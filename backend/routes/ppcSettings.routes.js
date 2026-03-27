import express from "express"
import auth from "../middleware/auth.js"
import allowRoles from "../middleware/allowRoles.js"
import PPCSettings from "../models/PPCSettings.js"

const router = express.Router()

/* =====================================================
   GET PPC SETTINGS (Anyone can view)
===================================================== */
router.get("/", auth, async (req, res) => {
  try {
    
    const settings = await PPCSettings.getSettings()
    
    res.json(settings)
    
  } catch (err) {
    console.error("Get PPC settings error:", err)
    res.status(500).json({ message: "Failed to load settings" })
  }
})

/* =====================================================
   ADMIN → UPDATE PPC SETTINGS
===================================================== */
router.post("/update", auth, allowRoles("admin"), async (req, res) => {
  try {
    
    const {
      sellerPPCRate,
      sellerPPCType,
      distributorBaseRate,
      distributorDirectRate,
      minimumWithdrawal
    } = req.body
    
    let settings = await PPCSettings.getSettings()
    
    // Update fields
    if (sellerPPCRate !== undefined) {
      settings.sellerPPCRate = Number(sellerPPCRate)
    }
    
    if (sellerPPCType) {
      settings.sellerPPCType = sellerPPCType
    }
    
    if (distributorBaseRate !== undefined) {
      settings.distributorBaseRate = Number(distributorBaseRate)
    }
    
    if (distributorDirectRate !== undefined) {
      settings.distributorDirectRate = Number(distributorDirectRate)
    }
    
    if (minimumWithdrawal !== undefined) {
      settings.minimumWithdrawal = Number(minimumWithdrawal)
    }
    
    settings.lastUpdatedBy = req.user.id
    
    await settings.save()
    
    console.log("✅ PPC settings updated by admin")
    
    res.json({ 
      success: true, 
      message: "PPC settings updated successfully",
      settings 
    })
    
  } catch (err) {
    console.error("Update PPC settings error:", err)
    res.status(500).json({ message: "Failed to update settings" })
  }
})

export default router
