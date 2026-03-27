import mongoose from "mongoose"
// ⭐ Commission hook removed to avoid double commission

const orderSchema = new mongoose.Schema(
  {
    // 🔗 USER (agar user ne order kiya ho)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    // 🔗 SELLER (nearest seller in chain)
    nearestSellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    // 🔗 SELLER (REQUIRED)
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // 🔗 DISTRIBUTOR
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },

    // 🛒 ITEMS SOLD
    items: {
      type: Array,
      default: []
    },

    // 💰 ORDER TOTAL
    total: {
      type: Number,
      required: true
    },

    // 👤 CUSTOMER INFO
    customerName: { type: String, trim: true },
    phone:        { type: String, trim: true },
    address:      { type: String, trim: true },

    // 🔥 ORDER STATUS — 3 LEVEL APPROVAL
    // pending              → Seller ke paas (agar user ne order kiya) ya Distributor ke paas (agar seller ne)
    // seller_approved      → Distributor ke paas
    // distributor_approved → Admin ke paas
    // confirmed            → Final (Admin ne approve kiya)
    // rejected             → Kisi ne bhi reject kiya
    status: {
      type: String,
      enum: ["pending", "seller_approved", "distributor_approved", "confirmed", "rejected"],
      default: "pending",
      index: true
    },

    // ⭐ REJECTED BY
    rejectedBy: {
      type: String,
      enum: ["seller", "distributor", "admin", null],
      default: null
    },

    // ⭐ DISTRIBUTOR NOTE
    distributorNote: { type: String, trim: true, default: "" },

    // ⭐ DISTRIBUTOR NOTE SELLER KO DIKHAO YA NAHI
    distributorNoteVisible: { type: Boolean, default: false },

    // ⭐ ADMIN NOTE
    adminNote: { type: String, trim: true, default: "" },

    // ⭐ ADMIN NOTE SELLER KO DIKHAO YA NAHI
    adminNoteVisible: { type: Boolean, default: false },

    // ⭐ SELLER NOTE
    sellerNote:        { type: String, trim: true, default: "" },
    sellerApprovedAt:  { type: Date },

    // ⭐ TIMESTAMPS
    distributorApprovedAt: { type: Date },
    confirmedAt:           { type: Date },
    rejectedAt:            { type: Date },

    // Commission duplicate prevent flag
    _commissionDone: { type: Boolean, default: false },

    // Debug help
    debugCreatedBy: { type: String, default: "" },

    // ⭐ ON BEHALF OF — Seller/Distributor kisi ke liye order lagaye
    placedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    placedByName:  { type: String, default: "" },
    placedByRole:  { type: String, default: "" },
    onBehalfOfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    onBehalfOfName: { type: String, default: "" },
    onBehalfOfRole: { type: String, default: "" }
  },
  { timestamps: true }
)

/* =====================================================
   🔥 INDEXES
===================================================== */
orderSchema.index({ sellerId: 1, createdAt: -1 })
orderSchema.index({ distributorId: 1, createdAt: -1 })
orderSchema.index({ distributorId: 1, status: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })

orderSchema.post("save", function (doc) {
  console.log("📦 ORDER SAVED:", doc._id, "| STATUS:", doc.status)
})

export default mongoose.model("Order", orderSchema)
