import mongoose from "mongoose"

/*
  =====================================================
  PRODUCT SCHEMA (ENTERPRISE READY – FINAL CLEAN)
  -----------------------------------------------------
  ✔ Distributor ownership
  ✔ Seller assignment compatible
  ✔ Safe defaults
  ✔ MongoDB timestamps
  ✔ Proper indexing (no duplicates)
  ✔ Admin products allowed
  ✔ NOTHING REMOVED – ONLY ENHANCED
  =====================================================
*/

const productSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    title: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    image: {
      type: String,
      default: ""
    },

    /* ================= OWNERSHIP ================= */
    // Which distributor owns this product
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,        // ✅ IMPORTANT → admin products visible everywhere
      required: false
    }
  },
  {
    timestamps: true
  }
)

/* ================= INDEXES ================= */

// Compound index → best performance for distributor product listing
productSchema.index({ distributorId: 1, createdAt: -1 })

// Title search optimization
productSchema.index({ title: "text" })

export default mongoose.model("Product", productSchema)
