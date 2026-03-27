import mongoose from "mongoose"

/*
  =====================================================
  COMMISSION LEVEL SCHEMA
  -----------------------------------------------------
  ✔ Level wise commission control
  ✔ Admin configurable
  ✔ Role based commission
  ✔ Duplicate protection
  ✔ Validation added
  ✔ Debug friendly
  ✔ NOTHING REMOVED – ONLY IMPROVED
  =====================================================
*/

const commissionLevelSchema = new mongoose.Schema({

  /* =====================================================
     LEVEL NUMBER
     -----------------------------------------------------
     Example:
     Level 1 → Seller
     Level 2 → Distributor
     Level 3 → Admin
  ===================================================== */
  level: {
    type: Number,
    required: true,
    min: 1,
    index: true
  },

  /* =====================================================
     COMMISSION PERCENT
     -----------------------------------------------------
     Example:
     10 = 10%
  ===================================================== */
  percent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },

  /* =====================================================
     ROLE
     -----------------------------------------------------
     seller / distributor / admin etc
  ===================================================== */
  role: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },

  /* =====================================================
     🔥 COMMISSION TYPE
     -----------------------------------------------------
     percentage OR fixed coin
     Admin control karega
  ===================================================== */
  type: {
    type: String,
    enum: ["PERCENTAGE", "FIXED"],
    default: "PERCENTAGE",
    index: true
  },

  /* =====================================================
     🔥 FIXED COIN VALUE
     -----------------------------------------------------
     Agar type FIXED ho to yeh use hoga
  ===================================================== */
  fixedCoin: {
    type: Number,
    default: 0,
    min: 0
  },

  /* =====================================================
     🔥 ACTIVE FLAG
     -----------------------------------------------------
     Admin kisi level ko disable bhi kar sake
  ===================================================== */
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  /* =====================================================
     🔥 NOTE / DESCRIPTION
  ===================================================== */
  note: {
    type: String,
    trim: true,
    default: ""
  }

}, { timestamps: true })


/* =====================================================
   🔥 UNIQUE PROTECTION
   Same level + role duplicate nahi banega
===================================================== */
commissionLevelSchema.index(
  { level: 1, role: 1 },
  { unique: true }
)


/* =====================================================
   🔥 SAFE PRE SAVE CLEAN
===================================================== */
commissionLevelSchema.pre("save", function (next) {
  try {

    if (this.role) {
      this.role = this.role.trim().toLowerCase()
    }

    if (this.percent < 0) this.percent = 0
    if (this.percent > 100) this.percent = 100

    if (this.fixedCoin < 0) this.fixedCoin = 0

    next()

  } catch (err) {
    console.error("CommissionLevel PreSave Error:", err)
    next(err)
  }
})


/* =====================================================
   🔥 DEBUG HELPER
===================================================== */
commissionLevelSchema.methods.safeData = function () {
  return {
    id: this._id,
    level: this.level,
    percent: this.percent,
    role: this.role,
    type: this.type,
    fixedCoin: this.fixedCoin,
    isActive: this.isActive,
    note: this.note
  }
}


/* =====================================================
   🔥 STATIC HELPER – ADMIN FETCH LEVELS
===================================================== */
commissionLevelSchema.statics.getActiveLevels = function () {
  return this.find({ isActive: true }).sort({ level: 1 })
}


/*
  =====================================================
  MODEL EXPORT
  =====================================================
*/
export default mongoose.model("CommissionLevel", commissionLevelSchema)