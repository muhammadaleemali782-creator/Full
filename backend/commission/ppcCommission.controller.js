import mongoose from "mongoose"
import Commission from "./commission.model.js"
import User from "../models/User.js"
import PPCSettings from "../models/PPCSettings.js"

/* =====================================================
   🔥 NEW PPC COMMISSION SYSTEM
   Based on hierarchical wallet structure:
   - Distributor: 2 wallets (distributorWallet, sellerWallet)
   - Seller: 2 wallets (sellerWalletAsSeller, userWalletAsSeller)
   - User: No wallet
===================================================== */

/* =====================================================
   HELPER: Find nearest parent by role
===================================================== */
const findNearestByRole = async (userId, role) => {
  if (!userId) return null
  const parent = await User.findById(userId).select("role parentId isDeleted")
  if (!parent || parent.isDeleted) return null
  if (parent.role === role) return parent._id
  if (parent.role === "admin") return null
  return findNearestByRole(parent.parentId, role)
}

/* =====================================================
   HELPER: Check if seller exists between user and distributor
===================================================== */
const hasSellerInChain = async (userId, distributorId) => {
  if (!userId || !distributorId) return false
  
  let current = await User.findById(userId).select("role parentId")
  
  while (current) {
    // Reached distributor
    if (String(current._id) === String(distributorId)) return false
    
    // Found seller in chain
    if (current.role === "seller") return true
    
    // Move up
    if (!current.parentId) break
    current = await User.findById(current.parentId).select("role parentId")
  }
  
  return false
}

/* =====================================================
   HELPER: Get all children of a user (recursive)
===================================================== */
const getAllChildren = async (userId) => {
  const children = await User.find({ 
    parentId: userId,
    isDeleted: { $ne: true }
  }).select("_id role parentId")
  
  let all = [...children]
  
  for (const child of children) {
    const nested = await getAllChildren(child._id)
    all = [...all, ...nested]
  }
  
  return all
}

/* =====================================================
   MAIN: CREATE PPC COMMISSION ON ORDER CONFIRMATION
===================================================== */
export const createPPCCommissionFromOrder = async (order) => {
  try {
    
    console.log("🔥 PPC COMMISSION START for order:", order._id)
    
    /* ── Validations ── */
    if (!order || !order.total || order.total <= 0) {
      console.log("⚠️ Invalid order for PPC")
      return
    }
    
    /* ── Prevent Duplicate ── */
    const existing = await Commission.findOne({
      orderId: order._id
    })
    
    if (existing) {
      console.log("⚠️ PPC commission already processed")
      return
    }
    
    /* ── Load PPC Settings ── */
    const settings = await PPCSettings.getSettings()
    console.log("💰 PPC Settings:", settings)
    
    const seller = await User.findById(order.sellerId)
    if (!seller) {
      console.log("⚠️ Seller not found")
      return
    }
    
    const total = Number(order.total)
    
    /* =====================================================
       STEP 1: SELLER COMMISSION
       Calculate based on settings (percentage or fixed)
    ===================================================== */
    
    let sellerPPC = 0
    
    if (settings.sellerPPCType === "percentage") {
      sellerPPC = total * (settings.sellerPPCRate / 100)
    } else {
      sellerPPC = settings.sellerPPCRate
    }
    
    console.log("💵 Seller PPC:", sellerPPC)
    
    // Save commission record
    if (sellerPPC > 0) {
      await Commission.create({
        fromUser: order.sellerId,
        toUser: seller._id,
        orderId: order._id,
        amount: sellerPPC,
        percent: settings.sellerPPCRate,
        level: 1,
        status: "approved"
      })
      
      // Update seller's appropriate wallet based on role
      if (seller.role === "seller") {
        // Seller earns in userWalletAsSeller (since this is from a user purchase)
        seller.userWalletAsSeller = (Number(seller.userWalletAsSeller) || 0) + sellerPPC
      }
      
      seller.totalPPCEarned = (Number(seller.totalPPCEarned) || 0) + sellerPPC
      await seller.save()
      
      console.log("✅ Seller PPC credited")
    }
    
    /* =====================================================
       STEP 2: DISTRIBUTOR COMMISSION
       ₹10 if seller exists in chain, ₹20 if direct connection
    ===================================================== */
    
    // Find nearest distributor
    const nearestDistId = await findNearestByRole(seller._id, "distributor")
    
    if (nearestDistId) {
      const distributor = await User.findById(nearestDistId)
      
      if (distributor) {
        // Check if seller exists between seller/user and distributor
        const sellerExists = await hasSellerInChain(seller._id, nearestDistId)
        
        const distPPC = sellerExists 
          ? settings.distributorBaseRate 
          : settings.distributorDirectRate
        
        console.log(`💵 Distributor PPC: ₹${distPPC} (${sellerExists ? 'with seller' : 'direct'})`)
        
        // Save commission record
        await Commission.create({
          fromUser: order.sellerId,
          toUser: distributor._id,
          orderId: order._id,
          amount: distPPC,
          percent: 0,  // Fixed amount, not percentage
          level: 2,
          status: "approved"
        })
        
        // Update distributor's sellerWallet (earnings from seller side)
        distributor.sellerWallet = (Number(distributor.sellerWallet) || 0) + distPPC
        distributor.totalPPCEarned = (Number(distributor.totalPPCEarned) || 0) + distPPC
        await distributor.save()
        
        console.log("✅ Distributor PPC credited to sellerWallet")
      }
    }
    
    /* =====================================================
       STEP 3: UPLINE COMMISSION (RECURSIVE)
       Go up the chain and credit appropriate wallets
    ===================================================== */
    
    let currentUser = await User.findById(seller.parentId)
    let level = 2
    
    while (currentUser && level <= 10) {  // Max 10 levels
      
      if (currentUser.role === "admin") break
      
      console.log(`➡️ Level ${level}: ${currentUser.role} - ${currentUser.name}`)
      
      /* ── DISTRIBUTOR LOGIC ── */
      if (currentUser.role === "distributor") {
        
        // Check if this sale came from distributor side or seller side
        const allChildren = await getAllChildren(currentUser._id)
        
        // Count distributors vs sellers in downline
        const hasDistributorsBelow = allChildren.some(c => c.role === "distributor")
        
        if (hasDistributorsBelow) {
          // This is from distributor side → credit to distributorWallet
          const distPPC = 5  // Fixed amount for upper level distributors
          
          currentUser.distributorWallet = (Number(currentUser.distributorWallet) || 0) + distPPC
          currentUser.totalPPCEarned = (Number(currentUser.totalPPCEarned) || 0) + distPPC
          await currentUser.save()
          
          console.log(`✅ Upper distributor: ₹${distPPC} → distributorWallet`)
        }
      }
      
      /* ── SELLER LOGIC ── */
      if (currentUser.role === "seller") {
        
        // Check if sale came from a seller or user below
        const directChild = await User.findById(currentUser._id).select("parentId")
        
        if (directChild && directChild.role === "seller") {
          // From seller side → credit to sellerWalletAsSeller
          const sellerPPC = 3  // Fixed amount
          
          currentUser.sellerWalletAsSeller = (Number(currentUser.sellerWalletAsSeller) || 0) + sellerPPC
          currentUser.totalPPCEarned = (Number(currentUser.totalPPCEarned) || 0) + sellerPPC
          await currentUser.save()
          
          console.log(`✅ Upper seller: ₹${sellerPPC} → sellerWalletAsSeller`)
          
        } else {
          // From user side → credit to userWalletAsSeller
          const userPPC = 2  // Fixed amount
          
          currentUser.userWalletAsSeller = (Number(currentUser.userWalletAsSeller) || 0) + userPPC
          currentUser.totalPPCEarned = (Number(currentUser.totalPPCEarned) || 0) + userPPC
          await currentUser.save()
          
          console.log(`✅ Upper seller: ₹${userPPC} → userWalletAsSeller`)
        }
      }
      
      // Move to parent
      if (!currentUser.parentId) break
      currentUser = await User.findById(currentUser.parentId)
      level++
    }
    
    console.log("🎉 PPC Commission distribution complete!")
    
  } catch (err) {
    console.error("❌ PPC Commission error:", err)
  }
}

/* =====================================================
   GET MY PPC WALLET INFO
===================================================== */
export const getMyPPCWallet = async (req, res) => {
  try {
    
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    
    const user = await User.findById(req.user.id)
      .select("name role distributorWallet sellerWallet sellerWalletAsSeller userWalletAsSeller totalPPCEarned totalWithdrawn")
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    
    // Get commission history
    const history = await Commission.find({
      toUser: user._id
    })
      .populate("fromUser", "name role")
      .populate("orderId")
      .sort({ createdAt: -1 })
      .limit(50)
    
    // Build response based on role
    const response = {
      name: user.name,
      role: user.role,
      totalPPCEarned: user.totalPPCEarned || 0,
      totalWithdrawn: user.totalWithdrawn || 0,
      history
    }
    
    if (user.role === "distributor") {
      response.wallets = {
        distributorWallet: {
          balance: user.distributorWallet || 0,
          withdrawable: false,
          description: "Earnings from downline distributors (for promotion only)"
        },
        sellerWallet: {
          balance: user.sellerWallet || 0,
          withdrawable: true,
          description: "Earnings from downline sellers (withdrawable after admin approval)"
        }
      }
    }
    
    if (user.role === "seller") {
      response.wallets = {
        sellerWallet: {
          balance: user.sellerWalletAsSeller || 0,
          withdrawable: true,
          description: "Earnings from downline sellers"
        },
        userWallet: {
          balance: user.userWalletAsSeller || 0,
          withdrawable: true,
          description: "Earnings from downline users"
        }
      }
    }
    
    res.json(response)
    
  } catch (err) {
    console.error("Get PPC wallet error:", err)
    res.status(500).json({ message: "Failed to load wallet" })
  }
}
