import express from "express"
import auth from "../middleware/auth.js"
import allowRoles from "../middleware/allowRoles.js"
import Order from "../models/Order.js"
import User from "../models/User.js"
import { createCommissionFromOrder } from "../commission/commission.controller.js"
import commissionRoutes from "../commission/commission.routes.js"
import mongoose from "mongoose"

const router = express.Router()

/* ── Commission Routes ── */
router.use("/commission", commissionRoutes)

/* =====================================================
   HELPER: Nearest role wala parent dhundo
===================================================== */
const findNearestByRole = async (userId, role) => {
  if (!userId) return null
  const parent = await User.findById(userId).select("role parentId isDeleted")
  if (!parent || parent.isDeleted) return null
  if (parent.role === role) return parent._id
  if (parent.role === "admin") return null
  return findNearestByRole(parent.parentId, role)
}

// ⭐ Find nearest distributor — includes self if self IS distributor
const findDistributorId = async (user) => {
  if (user.role === "distributor") return user._id   // self IS the distributor
  return findNearestByRole(user._id, "distributor")
}

/* =====================================================
   🛒 CREATE ORDER
   NEW FLOW:
   User   → directly to Distributor → Admin  (Seller SKIP)
   Seller → directly to Distributor → Admin
   Distributor → Admin
===================================================== */
router.post("/", auth, allowRoles("seller", "user", "distributor"), async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ msg: "Unauthorized" })

    const me = await User.findById(req.user.id)
    if (!me) return res.status(404).json({ msg: "User not found" })

    // ⭐ ON BEHALF OF
    const { onBehalfOfId: rawBehalfId, ...orderBody } = req.body
    let behalfUser = null
    if (rawBehalfId) {
      behalfUser = await User.findById(rawBehalfId).select("name role")
    }

    let sellerId = me._id  // track who placed it
    let userId   = null

    if (me.role === "user") {
      userId   = me._id
      sellerId = me._id  // user acts as seller reference
    } else if (behalfUser) {
      userId   = behalfUser._id
    }

    // ⭐ NEW: Find nearest DISTRIBUTOR — includes self if distributor
    const nearestDistId = await findDistributorId(me)

    const behalfFields = behalfUser ? {
      onBehalfOfId:   behalfUser._id,
      onBehalfOfName: behalfUser.name,
      onBehalfOfRole: behalfUser.role,
      placedById:     me._id,
      placedByName:   me.name,
      placedByRole:   me.role,
    } : {
      placedById:   me._id,
      placedByName: me.name,
      placedByRole: me.role,
    }

    const order = await Order.create({
      sellerId,
      userId,
      nearestSellerId: null,          // Seller step removed
      distributorId:   nearestDistId || null,
      status:          "pending",     // Goes directly to distributor
      ...behalfFields,
      ...orderBody
    })

    console.log("✅ ORDER CREATED:", order._id, "| by:", me.role, "| dist:", nearestDistId, "| onBehalf:", behalfUser?.name || "self")
    res.json(order)

  } catch (err) {
    console.error("❌ ORDER CREATE ERROR:", err)
    res.status(500).json({ msg: "Order creation failed" })
  }
})

/* ⭐ Seller approval step REMOVED — orders go directly to Distributor */

/* =====================================================
   📦 DISTRIBUTOR → PENDING ORDERS
   (seller_approved orders — direct seller orders bhi)
===================================================== */
router.get("/pending", auth, allowRoles("distributor"), async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ msg: "Unauthorized" })

    // ⭐ NEW FLOW: All pending orders — either assigned to dist OR placed by dist
    const orders = await Order.find({
      $or: [
        { distributorId: req.user.id, status: "pending" },
        { placedById:    req.user.id, status: "pending" },
      ]
    })
      .populate("sellerId", "name email role")
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (err) {
    res.status(500).json({ msg: "Failed to load orders" })
  }
})

/* =====================================================
   📋 DISTRIBUTOR → ALL MY ORDERS (HISTORY)
===================================================== */
router.get("/distributor/all", auth, allowRoles("distributor"), async (req, res) => {
  try {
    // All orders: either assigned to this distributor OR placed by this distributor
    const orders = await Order.find({
      $or: [
        { distributorId: req.user.id },
        { placedById:    req.user.id },
      ]
    })
      .populate("sellerId", "name email role")
      .populate("userId",   "name email role")
      .sort({ createdAt: -1 })

    // Deduplicate
    const seen = new Set()
    const unique = orders.filter(o => {
      const id = String(o._id)
      if (seen.has(id)) return false
      seen.add(id); return true
    })
    res.json(unique)
  } catch (err) {
    res.status(500).json({ msg: "Failed" })
  }
})

/* =====================================================
   ✅ DISTRIBUTOR → APPROVE ORDER
===================================================== */
router.put("/approve/:id", auth, allowRoles("distributor"), async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ msg: "Unauthorized" })

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ msg: "Order not found" })

    // Check ownership: either distributorId or placedById must match
    const isOwner = String(order.distributorId) === String(req.user.id)
                 || String(order.placedById)     === String(req.user.id)
    if (!isOwner) return res.status(403).json({ msg: "Not your order" })

    // ⭐ Only pending orders (seller step removed)
    if (order.status !== "pending")
      return res.status(400).json({ msg: "Order already processed" })

    order.status                = "distributor_approved"
    order.distributorApprovedAt = new Date()
    order.distributorNote        = req.body?.note || ""
    order.distributorNoteVisible = req.body?.showNoteToSeller === true

    await order.save()
    res.json({ success: true, order })

  } catch (err) {
    res.status(500).json({ msg: "Approval failed" })
  }
})

/* =====================================================
   ❌ DISTRIBUTOR → REJECT ORDER
===================================================== */
router.put("/reject/:id", auth, allowRoles("distributor"), async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ msg: "Unauthorized" })

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ msg: "Order not found" })

    const isOwnerR = String(order.distributorId) === String(req.user.id)
                  || String(order.placedById)     === String(req.user.id)
    if (!isOwnerR) return res.status(403).json({ msg: "Not your order" })

    if (order.status !== "pending")
      return res.status(400).json({ msg: "Already processed" })

    order.status                = "rejected"
    order.rejectedBy            = "distributor"
    order.rejectedAt            = new Date()
    order.distributorNote        = req.body?.note || ""
    order.distributorNoteVisible = req.body?.showNoteToSeller === true

    await order.save()
    res.json({ success: true, order })

  } catch (err) {
    res.status(500).json({ msg: "Reject failed" })
  }
})

/* =====================================================
   👑 ADMIN → SELLER PENDING ORDERS
   (User ne order diya, Seller ne abhi approve nahi kiya)
===================================================== */
router.get("/admin/seller-pending", auth, allowRoles("admin"), async (req, res) => {
  try {
    // status=pending AND userId exists (matlab user ne order kiya hai)
    const orders = await Order.find({
      status: "pending",
      userId: { $ne: null, $exists: true }
    })
      .populate("sellerId",      "name email role")
      .populate("distributorId", "name email role")
      .populate("userId",        "name email role")
      .populate("nearestSellerId", "name email role")
      .sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ msg: "Failed" })
  }
})

/* =====================================================
   👑 ADMIN → ALL ORDERS
===================================================== */
router.get("/admin/all", auth, allowRoles("admin"), async (req, res) => {
  try {
    const { status } = req.query
    const query = status ? { status } : {}
    const orders = await Order.find(query)
      .populate("sellerId",        "name email role")
      .populate("distributorId",   "name email role")
      .populate("userId",          "name email role")
      .sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ msg: "Failed" })
  }
})

/* =====================================================
   👑 ADMIN → CONFIRM ORDER (FINAL)
===================================================== */
router.put("/admin/confirm/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ msg: "Order not found" })

    if (order.status !== "distributor_approved")
      return res.status(400).json({ msg: "Order must be distributor approved first" })

    order.status           = "confirmed"
    order.confirmedAt      = new Date()
    order.adminNote        = req.body?.note || ""
    order.adminNoteVisible = req.body?.showNoteToSeller === true

    await order.save()

    // Commission
    try {
      if (order.total && !order._commissionDone) {
        await createCommissionFromOrder(order)
        order._commissionDone = true
        await order.save()
      }
    } catch (err) {
      console.error("❌ COMMISSION ERROR:", err.message)
    }

    // Seller sales update
    const seller = await User.findById(order.sellerId)
    if (seller) {
      seller.sales = (seller.sales || 0) + (order.total || 0)
      await seller.save()
      if (seller.sales >= 50000 && seller.role === "seller") {
        seller.role = "distributor"
        await seller.save()
      }
    }

    res.json({ success: true, order })

  } catch (err) {
    res.status(500).json({ msg: "Confirmation failed" })
  }
})

/* =====================================================
   👑 ADMIN → REJECT ORDER
===================================================== */
router.put("/admin/reject/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ msg: "Order not found" })

    if (order.status === "confirmed")
      return res.status(400).json({ msg: "Cannot reject confirmed order" })

    order.status           = "rejected"
    order.rejectedBy       = "admin"
    order.rejectedAt       = new Date()
    order.adminNote        = req.body?.note || ""
    order.adminNoteVisible = req.body?.showNoteToSeller === true

    await order.save()
    res.json({ success: true, order })

  } catch (err) {
    res.status(500).json({ msg: "Reject failed" })
  }
})

/* =====================================================
   📊 MY ORDERS — Seller ya User dono ke liye
   User ko simplified status dikhao
===================================================== */
router.get("/mine", auth, allowRoles("seller", "user", "distributor"), async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("role")

    let orders
    if (me.role === "user") {
      // User ke orders — userId se dhundo
      // Purane orders mein userId nahi tha, sellerId mein user ka _id tha
      orders = await Order.find({
        $or: [
          { userId: req.user.id },
          { sellerId: req.user.id }  // backward compat for old orders
        ]
      }).sort({ createdAt: -1 })

      // User ko simplified status dikhao
      orders = orders.map(o => {
        const plain = o.toObject()
        // ⭐ Show pending for all in-progress states
        if (["pending", "distributor_approved"].includes(plain.status)) {
          plain.displayStatus = "pending"
        } else {
          plain.displayStatus = plain.status  // confirmed / rejected
        }
        return plain
      })
    } else {
      // Seller / Distributor ke orders:
      // 1. Khud ne lagaye (sellerId = me)
      // 2. Kisi ke behalf mein lagaye (placedById = me)
      // 3. Kisi ne MERE liye lagaya (onBehalfOfId = me) ← FIX for distributor→seller orders
      orders = await Order.find({
        $or: [
          { sellerId:      req.user.id },
          { placedById:    req.user.id },
          { onBehalfOfId:  req.user.id },
        ]
      })
        .populate("distributorId", "name role")
        .populate("userId",        "name role")
        .sort({ createdAt: -1 })

      // Deduplicate
      const seen = new Set()
      orders = orders.filter(o => {
        const id = String(o._id)
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
    }

    res.json(orders)
  } catch (err) {
    res.status(500).json({ msg: "Failed" })
  }
})

/* =====================================================
   DISTRIBUTOR legacy route
===================================================== */
router.get("/distributor", auth, allowRoles("distributor"), async (req, res) => {
  try {
    const orders = await Order.find({ distributorId: req.user.id })
      .populate("sellerId", "name")
      .sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ msg: "Failed" })
  }
})

export default router
