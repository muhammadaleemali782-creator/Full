import mongoose from "mongoose"

const commissionSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  amount: Number,
percent: Number,
level: { type: Number, default: 1 },  // ⭐ ADD
status: { type: String, default: "pending" }
}, { timestamps: true })


/* =====================================================
   ⭐ EXTRA VALIDATION (NO LINE REMOVED)
===================================================== */
commissionSchema.pre("save", function (next) {
  try {

    console.log("🔥 Commission pre-save running")

    const validate = () => {

      if (this.amount && this.amount < 0) {
        throw new Error("Commission amount cannot be negative")
      }

      if (this.percent && (this.percent < 0 || this.percent > 100)) {
        throw new Error("Commission percent must be 0–100")
      }

      if (this.fromUser && !mongoose.Types.ObjectId.isValid(String(this.fromUser))) {
        throw new Error("Invalid fromUser ObjectId")
      }

      if (this.toUser && !mongoose.Types.ObjectId.isValid(String(this.toUser))) {
        throw new Error("Invalid toUser ObjectId")
      }

      if (this.orderId && !mongoose.Types.ObjectId.isValid(String(this.orderId))) {
        throw new Error("Invalid orderId ObjectId")
      }
    }

    /* ⭐ HANDLE BOTH CALLBACK & PROMISE MODE */
    if (typeof next === "function") {
      validate()
      return next()
    } else {
      validate()
      return Promise.resolve()
    }

  } catch (err) {
    console.error("❌ Commission pre-save error:", err.message)

    if (typeof next === "function") {
      return next(err)
    } else {
      return Promise.reject(err)
    }
  }
})


/* =====================================================
   ⭐ INDEXES FOR PERFORMANCE
===================================================== */
commissionSchema.index({ toUser: 1, createdAt: -1 })
commissionSchema.index({ fromUser: 1, createdAt: -1 })
commissionSchema.index({ orderId: 1 })
commissionSchema.index({ status: 1 })


/* =====================================================
   ⭐ SAFE HELPER METHOD
===================================================== */
commissionSchema.methods.safeCommission = function () {
  return {
    id: this._id,
    fromUser: this.fromUser,
    toUser: this.toUser,
    orderId: this.orderId,
    amount: this.amount,
    percent: this.percent,
    status: this.status,
    createdAt: this.createdAt
  }
}


/* =====================================================
   ⭐ DEBUG LOGGING
===================================================== */
commissionSchema.post("save", function (doc) {
  try {
    console.log("💰 Commission Saved:", {
      id: doc._id,
      amount: doc.amount,
      percent: doc.percent,
      status: doc.status
    })
  } catch (err) {
    console.error("❌ Commission post-save log error:", err.message)
  }
})


export default mongoose.model("Commission", commissionSchema)
