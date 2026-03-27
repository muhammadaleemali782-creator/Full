import mongoose from "mongoose"

/*
  =====================================================
  PPC SETTINGS MODEL
  -----------------------------------------------------
  Admin configurable PPC (reward points) rates
  ✔ Global default rates
  ✔ Product-specific rates (future)
  ✔ Minimum withdrawal limits
  =====================================================
*/

const ppcSettingsSchema = new mongoose.Schema(
  {
    /* ================= GLOBAL PPC RATES ================= */
    
    // Default PPC rate for sellers (% of sale or fixed amount)
    sellerPPCRate: {
      type: Number,
      default: 10,
      min: 0
    },

    // Type: percentage or fixed
    sellerPPCType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage"
    },

    // Distributor base rate (when seller exists in chain)
    distributorBaseRate: {
      type: Number,
      default: 10,
      min: 0
    },

    // Distributor direct rate (when no seller between distributor and user)
    distributorDirectRate: {
      type: Number,
      default: 20,
      min: 0
    },

    /* ================= WITHDRAWAL LIMITS ================= */
    
    minimumWithdrawal: {
      type: Number,
      default: 100,
      min: 0
    },

    /* ================= META ================= */
    
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

/* =====================================================
   SINGLETON PATTERN - Only one settings document
===================================================== */
ppcSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ isActive: true })
  
  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({
      sellerPPCRate: 10,
      sellerPPCType: "percentage",
      distributorBaseRate: 10,
      distributorDirectRate: 20,
      minimumWithdrawal: 100,
      isActive: true
    })
    console.log("✅ Default PPC settings created")
  }
  
  return settings
}

export default mongoose.model("PPCSettings", ppcSettingsSchema)
