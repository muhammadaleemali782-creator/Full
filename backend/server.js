/* =====================================================
   MONGODB CONNECTION
===================================================== */
import dotenv from "dotenv"
dotenv.config()

import mongoose from "mongoose"

mongoose
  .connect(process.env.MONGO_URI, { autoIndex: true })
  .then(async () => {
    console.log("✅ MongoDB connected")
    /* ⭐ FIX: UserRequest collection ka MongoDB-level validator clear karo
       Yeh tab zaruri hota hai jab enum change ho aur purana validator cached ho */
    try {
      const db = mongoose.connection.db
      await db.command({
        collMod: "userrequests",
        validator: {},
        validationLevel: "off"
      })
      console.log("✅ UserRequest validator cleared")
    } catch (e) {
      // Collection exist nahi karta ya pehle se theek hai — ignore
    }
  })
  .catch(err => console.error("❌ MongoDB error:", err.message))

/* =====================================================
   IMPORTS
===================================================== */
import express from "express"
import cors from "cors"
import multer from "multer"
import fs from "fs"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import protect from "./middleware/auth.js"
import allowRoles from "./middleware/allowRoles.js"
import User from "./models/User.js"
import Order from "./models/Order.js"
import Product from "./models/Product.js"
import UserRequest from "./models/UserRequest.js"
import Settings from "./models/Settings.js"
import Commission from "./commission/commission.model.js"
import crypto from "crypto"
import orderRoutes from "./routes/orders.js"
import usersRoutes from "./routes/users.js"   // ⭐ EXACT PATH
import userIdRoutes from "./routes/userIdRoutes.js"
import { generateUserId } from "./utils/generateUserId.js"

// ⭐ NEW PPC SYSTEM IMPORTS
import withdrawalRoutes from "./routes/withdrawal.routes.js"
import ppcSettingsRoutes from "./routes/ppcSettings.routes.js"
import { createPPCCommissionFromOrder, getMyPPCWallet } from "./commission/ppcCommission.controller.js"


/* =====================================================
   APP INIT
===================================================== */

const app = express()
app.use(cors({
  origin: true,
  credentials: true
}))
app.use(express.json())
app.use("/orders", orderRoutes)

// ⭐ NEW PPC SYSTEM ROUTES
app.use("/api/withdrawal", withdrawalRoutes)
app.use("/api/ppc-settings", ppcSettingsRoutes)
app.get("/api/ppc/wallet/me", protect, getMyPPCWallet)

app.use("/users", usersRoutes)
app.use("/users",userIdRoutes)

/* =====================================================
   CONFIG
===================================================== */
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"

/* =====================================================
   UPLOADS SETUP
===================================================== */
const uploadDir = "uploads"
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)
app.use("/uploads", express.static(uploadDir))

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  }
})
const upload = multer({ storage })


/* =====================================================
   LEGACY ADMIN LOGIN (DO NOT TOUCH)
===================================================== */
const ADMIN = {
  email: "admin@gmail.com",
  password: "12345"
}

/* =====================================================
   DEMO PRODUCTS (LEGACY)
===================================================== */
let products = [
  { id: 1, title: "Headphone", price: 1999, image: "" },
  { id: 2, title: "Watch", price: 2999, image: "" }
]

/* =====================================================
   AUTH HELPER
===================================================== */
const generateToken = (user) =>
  jwt.sign(
    {
      id: String(user._id),
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  )

/* =====================================================
   AUTH ROUTES
===================================================== */

app.post("/admin/login", (req, res) => {

  console.log("LOGIN BODY:", req.body)   // ⭐ moved inside route

  const { email, password } = req.body

  if (
    email?.trim().toLowerCase() === ADMIN.email &&
    password === ADMIN.password
  ) {
    console.log("✅ ADMIN LOGIN SUCCESS:", email)
    return res.json({ success: true })
  }

  console.log("❌ ADMIN LOGIN FAILED:", email)
  return res.status(401).json({ success: false })   // ⭐ return added
})



/* =====================================================
   USER LOGIN
===================================================== */

app.post("/login", async (req, res) => {

  console.log("LOGIN BODY:", req.body)   // ⭐ IMPORTANT DEBUG

  const { email, password } = req.body

  try {

    /* ⭐ EXTRA DEBUG */
    console.log("DB NAME =", mongoose.connection.name)

    /* ✅ EMPTY CHECK */
    if (!email || !password) {
      console.log("❌ LOGIN FAIL: Empty email/password")
      return res.status(400).json({
        success: false,
        message: "Email & password required"
      })
    }

    /* ⭐ PASSWORD TYPE CHECK FIRST */
    if (typeof password !== "string") {
      console.log("❌ LOGIN FAIL: Password undefined from frontend")
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      })
    }

    /* ✅ EMAIL CLEAN */
    const cleanEmail = email.trim().toLowerCase()

    /* ✅ FIND USER  ⭐⭐⭐ IMPORTANT FIX HERE */
    const user = await User.findOne({ email: cleanEmail })
      .select("+password")   // 🔥 PASSWORD ko force select karo
      .lean()

    if (!user) {
      console.log("❌ LOGIN FAIL: User not found", cleanEmail)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    console.log("USER FOUND:", user.email)
    console.log("PASSWORD FROM DB:", user.password)

    /* ⭐ PASSWORD EXIST CHECK */
    if (!user.password || user.password === "") {
      console.log("❌ LOGIN FAIL: Password missing in DB for", cleanEmail)
      return res.status(500).json({
        success: false,
        message: "User password not set. Contact admin."
      })
    }

    /* ✅ PASSWORD MATCH */
    const match = await bcrypt.compare(
      password.trim(),
      user.password
    )

    console.log("PASSWORD MATCH =", match)

    if (!match) {
      console.log("❌ LOGIN FAIL: Wrong password for", cleanEmail)
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    console.log("✅ LOGIN SUCCESS:", user.email)
    console.log("Must Change Password:", user.mustChangePassword)

    /* ✅ TEMP PASSWORD */
    if (user.mustChangePassword === true) {
      console.log("⚠️ TEMP PASSWORD LOGIN → NEED CHANGE")

      return res.json({
        success: true,
        changePasswordRequired: true,
        userId: user._id,
        email: user.email
      })
    }
    /* ⭐ BLOCK CHECK */
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "User is blocked by admin"
        })
      }

      if (user.isDeleted) {
        return res.status(403).json({
          success: false,
          message: "User account deleted"
        })
      }
    /* ✅ NORMAL LOGIN */
    const token = generateToken(user)

    console.log("🎯 TOKEN GENERATED FOR:", user.email)

    return res.json({
      success: true,
      token,
      role: user.role,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err)
    return res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

/*=========================================================
            Change Password
==========================================================*/

app.post("/users/change-password", async (req, res) => {
  try {

    console.log("CHANGE PASSWORD BODY:", req.body)

    let { userId, newPassword } = req.body

    if (!userId || !newPassword)
      return res.status(400).json({
        success: false,
        message: "Missing data"
      })

    const user = await User.findById(userId)

    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found"
      })

    const hashed = await bcrypt.hash(newPassword.trim(), 10)

    user.password = hashed
    user.mustChangePassword = false

    await user.save()

    console.log("✅ Password changed for:", user.email)

    return res.json({
      success: true,
      message: "Password changed successfully"
    })

  } catch (err) {
    console.error("❌ CHANGE PASSWORD ERROR:", err)
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

/* =====================================================
   PRODUCTS
===================================================== */

app.get(
  "/products/all",
  protect,
  async (req, res) => {
    try {
      let query = {}

      /* ================= ADMIN ================= */
      if (req.user.role === "admin") {
        query = {}
      }

    /* ================= DISTRIBUTOR ================= */
  if (req.user.role === "distributor") {
    const distributor = await User.findById(req.user.id)

    if (!distributor || !distributor.assignedProducts?.length) {
      return res.json([])
    }

    query = {
      _id: {
        $in: distributor.assignedProducts.map(
          id => new mongoose.Types.ObjectId(id)
        )
      }
    }
  }

      /* ================= SELLER ================= */
if (req.user.role === "seller") {
  const seller = await User.findById(req.user.id)

  if (!seller || !seller.assignedProducts?.length) {
    return res.json([])
  }

  query = {
    _id: {
      $in: seller.assignedProducts.map(
        id => new mongoose.Types.ObjectId(id)
      )
    }
  }
}

      /* ================= USER ================= */
if (req.user.role === "user") {
  const userDoc = await User.findById(req.user.id)

  if (!userDoc || !userDoc.assignedProducts?.length) {
    return res.json([])
  }

  query = {
    _id: {
      $in: userDoc.assignedProducts.map(
        id => new mongoose.Types.ObjectId(id)
      )
    }
  }
}

  // ✅🔥 YAHI PE ADD KARO
      console.log("ROLE:", req.user.role)
      console.log("QUERY:", query)
      
      const dbProducts = await Product.find(query).sort({ createdAt: -1 })

      res.json(dbProducts)

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)



/* =====================================================
   PUBLIC PRODUCTS (NO LOGIN)
===================================================== */
app.get("/products/public", async (req, res) => {
  try {
    const products = await Product.find({
      $or: [
        { distributorId: null },
        { distributorId: { $exists: false } }
      ]
    }).sort({ createdAt: -1 })

    res.json(products)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
/* =====================================================
   REQUEST SYSTEM
===================================================== */

app.post("/requests/create", protect, async (req, res) => {
  try {

    /* ⭐ NEW PRODUCT FIELDS */
    const { type, name, email, phone, address, productIds, assignAllProducts } = req.body

    if (!type || !name || !email) {
      return res.status(400).json({ message: "All fields required" })
    }

    /* ── Role-based type validation ── */
    if (req.user.role === "distributor") {
      if (!["distributor", "seller"].includes(type)) {
        return res.status(403).json({ message: "Distributor sirf Distributor ya Seller request kar sakta hai" })
      }
    }
    if (req.user.role === "seller") {
      if (!["seller", "user"].includes(type)) {
        return res.status(403).json({ message: "Seller sirf Seller ya User request kar sakta hai" })
      }
    }
    /* ⭐ USER → sirf user type request kar sakta hai */
    if (req.user.role === "user") {
      if (type !== "user") {
        return res.status(403).json({ message: "User sirf User request kar sakta hai" })
      }
    }

    const request = await UserRequest.create({
      requestedBy: req.user.id,
      type,
      name,
      email,
      phone: phone || "",
      address: address || "",
      status: "pending",

      /* ⭐ NEW */
      assignedProducts: productIds
        ? productIds.map(id => new mongoose.Types.ObjectId(id))
        : [],
      assignAllProducts: assignAllProducts || false
    })

    res.json(request)

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

app.get("/requests/all", protect, allowRoles("admin"), async (req, res) => {
  try {

    const requests = await UserRequest.find({
      status: "pending",
      type: { $ne: "password-reset" }   // ⭐ IMPORTANT FIX
    })
      .populate("requestedBy", "name email")

    res.json(requests)

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/* =====================================================
   PASSWORD RESET REQUEST (USER SIDE)
===================================================== */

app.post("/password-help", async (req, res) => {
  try {

    const { email, whatsapp } = req.body

    if (!email || !whatsapp) {
      return res.status(400).json({
        success: false,
        message: "Email and WhatsApp required"
      })
    }

    const cleanEmail = email.trim().toLowerCase()

    const user = await User.findOne({ email: cleanEmail })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    const request = await UserRequest.create({
      requestedBy: user._id,
      type: "password-reset",
      name: user.name,
      email: cleanEmail,
      whatsapp,
      status: "pending"
    })

    console.log("🔑 Password reset request created")

    res.json({
      success: true,
      message: "Request sent to admin"
    })

  } catch (err) {
    console.error("Password help error:", err)
    res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

/*========================================================
   Request raiser ko approved list
=======================================================*/


app.get("/requests/my", protect, async (req, res) => {
  try {
    const requests = await UserRequest.find({
      requestedBy: req.user.id,
      status: "approved"
    }).sort({ updatedAt: -1 })

    res.json(requests)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})
/*==========================================================
        Pending API
=========================================================*/
app.get("/requests/pending", protect, allowRoles("admin"), async (req, res) => {
  try {

    const requests = await UserRequest.find({
      status: "pending",
      type: { $ne: "password-reset" }   // ⭐ IMPORTANT FIX
    })
      .populate("requestedBy", "name email")

    res.json(requests)

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/* =====================================================
   PASSWORD RESET REQUESTS (ADMIN)
===================================================== */

app.get(
  "/requests/password-reset",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {

      const requests = await UserRequest.find({
        type: "password-reset",
        status: "pending"
      }).sort({ createdAt: -1 })

      res.json(requests)

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)
/*=========================================================

                     History API

========================================================*/

app.get("/requests/history", protect, allowRoles("admin"), async (req, res) => {
  try {
    const requests = await UserRequest.find({ status: { $ne: "pending" } })
      .populate("requestedBy", "name email")

    res.json(requests)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

      /* =====================================================
   ADD PRODUCT (MONGODB FINAL VERSION)
===================================================== */
app.post(
  "/admin/add-product",
  protect,
  allowRoles("admin"),
  upload.single("image"),
  async (req, res) => {
    try {

      console.log("🔥 ADD PRODUCT BODY:", req.body)
      console.log("🔥 FILE:", req.file)

      const { title, price, assignAllUsers, userIds } = req.body

      if (!title || !price) {
        return res.status(400).json({ message: "Title & Price required" })
      }

      const newProduct = await Product.create({
        title: String(title).trim(),
        price: Number(price),
        image: req.file ? req.file.filename : "",
        distributorId: null
      })

      console.log("✅ PRODUCT SAVED:", newProduct)

      /* =====================================================
         ⭐ AUTO ASSIGN PRODUCT TO USERS (FIXED PLACE)
      ===================================================== */

      try {

        const assignAll =
          assignAllUsers === true ||
          assignAllUsers === "true"

        /* ⭐ ALL USERS */
        if (assignAll) {

          console.log("🔥 Assigning product to ALL users")

          await User.updateMany(
            { role: { $in: ["seller", "distributor", "user"] } },
            { $addToSet: { assignedProducts: newProduct._id } }
          )
        }

        /* ⭐ SPECIFIC USERS */
        else {

          const ids =
            typeof userIds === "string"
              ? JSON.parse(userIds)
              : (Array.isArray(userIds) ? userIds : [])

          if (Array.isArray(ids) && ids.length > 0) {

            console.log("🔥 Assigning to users:", ids)

            await User.updateMany(
              { _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } },
              { $addToSet: { assignedProducts: newProduct._id } }
            )
          }

        }

      } catch (assignErr) {
        console.error("❌ Assign error:", assignErr.message)
      }

      res.json(newProduct)

    } catch (err) {
      console.error("❌ ADD PRODUCT ERROR:", err)
      res.status(500).json({ message: err.message })
    }
  }
)
/* =====================================================
   ADMIN DELETE PRODUCT EVERYWHERE
===================================================== */
app.delete(
  "/admin/delete-product/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {

    const productId = req.params.id

    await Product.findByIdAndDelete(productId)

    await User.updateMany(
      {},
      { $pull: { assignedProducts: productId } }
    )

    res.json({ success: true })
  }
)

/* =====================================================
   REMOVE PRODUCT FROM SPECIFIC USERS
===================================================== */
app.put(
  "/admin/remove-product-users/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {

    const { userIds } = req.body

    await User.updateMany(
      { _id: { $in: userIds } },
      { $pull: { assignedProducts: req.params.id } }
    )

    res.json({ success: true })
  }
)
/* =====================================================
   ADMIN → ADD PRODUCT TO SPECIFIC USERS  ⭐ NEW
   PUT /admin/add-product-users/:id
===================================================== */
app.put(
  "/admin/add-product-users/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const productId = req.params.id
      const { userIds } = req.body

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "userIds array required" })
      }

      await User.updateMany(
        { _id: { $in: userIds } },
        { $addToSet: { assignedProducts: new mongoose.Types.ObjectId(productId) } }
      )

      return res.json({
        success: true,
        message: `Product added to ${userIds.length} user(s)`
      })

    } catch (err) {
      console.error("Add product to users error:", err)
      return res.status(500).json({ message: err.message })
    }
  }
)

/* =====================================================
   USER CREATION
===================================================== */
app.post(
  "/users/create",
  protect,
  allowRoles("admin", "distributor", "seller"),
  async (req, res) => {
    try {
      const { parentId, email, password, role, assignedProducts } = req.body

      /* ── Role-based creation rules ── */
      if (req.user.role === "distributor") {
        // Distributor → sirf distributor ya seller bana sakta hai, user nahi
        if (!["distributor", "seller"].includes(role)) {
          return res.status(403).json({
            message: "Distributor sirf Distributor ya Seller bana sakta hai"
          })
        }
      }

      if (req.user.role === "seller") {
        // Seller → sirf seller ya user bana sakta hai
        if (!["seller", "user"].includes(role)) {
          return res.status(403).json({
            message: "Seller sirf Seller ya User bana sakta hai"
          })
        }
      }

      const exists = await User.findOne({ email })
      if (exists) {
        return res.status(409).json({
          message: "Email already exists"
        })
      }

      // ⭐ Actual parentId decide karo
      const actualParentId =
        req.user.role === "admin"
          ? (parentId ? parentId : null)
          : req.user.id

      // ⭐ Parent ka name lo
      // ⭐ FIX: Agar parent admin hai to prefix mat lagao
      let parentName = null
      if (actualParentId) {
        const parentUser = await User.findById(actualParentId).select("name role").lean()
        if (parentUser && parentUser.role !== "admin") {
          parentName = parentUser.name
        }
      }

      // ⭐ Auto name generate: e.g. "DB004/DS001" ya "DS001/US001"
      const autoName = await generateUserId(role, User, parentName)

      const hashed = await bcrypt.hash(password, 10)

      const newUser = await User.create({
        name: autoName,
        email,
        password: hashed,
        role,
        parentId: actualParentId,

        // 🔥 FIX: convert string → ObjectId (UNTOUCHED)
        assignedProducts: assignedProducts
          ? assignedProducts.map(
              id => new mongoose.Types.ObjectId(id)
            )
          : []
      })

      res.json({
        success: true,
        user: {
          id: String(newUser._id),
          name: newUser.name,
          role: newUser.role
        }
      })

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)



app.get(
  "/users/all-for-product",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {

      const users = await User.find({
        role: { $in: ["seller", "distributor", "user"] }
      })
        .select("name fullName email role phone address parentId isBlocked isDeleted blockedAt deletedAt createdAt")
        .sort({ createdAt: -1 })
        .lean()

      return res.json(users)

    } catch (err) {
      console.error("Get users error:", err)
      return res.status(500).json({ message: "Failed to fetch users" })
    }
  }
)

/* =====================================================
   ADMIN → BLOCK USER
   ✔ Prevent double block
   ✔ Prevent block deleted user
   ✔ Prevent self block
===================================================== */

app.put(
  "/admin/block-user/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {

      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid user id" })

      if (String(req.user.id) === String(id))
        return res.status(400).json({ message: "Admin cannot block self" })

      const user = await User.findById(id)

      if (!user)
        return res.status(404).json({ message: "User not found" })

      if (user.isDeleted)
        return res.status(400).json({ message: "Cannot block deleted user" })

      if (user.isBlocked)
        return res.status(400).json({ message: "User already blocked" })

      user.isBlocked = true
      user.blockedReason = req.body?.reason || "Blocked by admin"
      user.blockedAt = new Date()

      await user.save()

      return res.json({
        success: true,
        message: "User blocked",
        userId: user._id,
        isBlocked: true
      })

    } catch (err) {
      console.error("Block error:", err)
      return res.status(500).json({ message: "Failed to block user" })
    }
  }
)
/* =====================================================
   ADMIN → RESET USER PASSWORD (TEMP PASSWORD)
===================================================== */

app.put(
  "/admin/reset-password/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {

      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid user id"
        })
      }

      const user = await User.findById(id).select("+password")

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        })
      }

      /* 🔥 TEMP PASSWORD GENERATE */
      const tempPassword = crypto.randomBytes(4).toString("hex")

      const hashed = await bcrypt.hash(tempPassword, 10)

      user.password = hashed
      user.mustChangePassword = true

      await user.save()

      console.log("🔑 TEMP PASSWORD GENERATED:", tempPassword)

      return res.json({
        success: true,
        tempPassword
      })

    } catch (err) {
      console.error("Reset password error:", err)
      return res.status(500).json({
        message: "Failed to reset password"
      })
    }
  }
)
/* =====================================================
   ADMIN → APPROVE PASSWORD RESET REQUEST
   (Approve dabate hi request complete ho jayegi)
===================================================== */

app.post(
  "/requests/approve-reset/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {

      const request = await UserRequest.findById(req.params.id)

      if (!request) {
        return res.status(404).json({
          message: "Request not found"
        })
      }

      request.status = "approved"
      request.approvedAt = new Date()

      await request.save()

      console.log("✅ Password reset request approved")

      res.json({
        success: true
      })

    } catch (err) {
      console.error("Approve reset error:", err)

      res.status(500).json({
        message: "Failed to approve request"
      })
    }
  }
)

/* =====================================================
   ADMIN → UNBLOCK USER
   ✔ Prevent double unblock
===================================================== */

app.put(
  "/admin/unblock-user/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {

      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid user id" })

      const user = await User.findById(id)

      if (!user)
        return res.status(404).json({ message: "User not found" })

      if (!user.isBlocked)
        return res.status(400).json({ message: "User already active" })

      user.isBlocked = false
      user.blockedReason = null
      user.blockedAt = null

      await user.save()

      return res.json({
        success: true,
        message: "User unblocked",
        userId: user._id,
        isBlocked: false
      })

    } catch (err) {
      console.error("Unblock error:", err)
      return res.status(500).json({ message: "Failed to unblock user" })
    }
  }
)



/* =====================================================
   ADMIN → DELETE USER (SOFT DELETE)
   ✔ Prevent double delete
   ✔ Auto block
   ✔ Prevent self delete
===================================================== */

app.delete(
  "/admin/delete-user/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {

      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid user id" })

      if (String(req.user.id) === String(id))
        return res.status(400).json({ message: "Admin cannot delete self" })

      const user = await User.findById(id)

      if (!user)
        return res.status(404).json({ message: "User not found" })

      if (user.isDeleted)
  return res.status(400).json({ message: "User already deleted" })

        // ⭐ CASCADE REASSIGN — children ko grandparent se connect karo
        const grandParentId = user.parentId || null
        const children = await User.find({ parentId: user._id })

        if (children.length > 0) {
          await User.updateMany(
            { parentId: user._id },
            { $set: { parentId: grandParentId } }
          )
          if (grandParentId) {
            const childIds = children.map(c => c._id)
            const Order = mongoose.model("Order")
            await Order.updateMany(
              { sellerId: { $in: childIds }, status: "pending" },
              { $set: { distributorId: grandParentId } }
            )
          }
        }

        user.isDeleted = true
        user.deletedAt = new Date()

        /* 🔥 Auto block when deleted */
        user.isBlocked = true
        user.blockedAt = new Date()

        await user.save()

        return res.json({
          success: true,
          message: "User soft deleted",
          userId: user._id,
          isDeleted: true,
          childrenReassigned: children.length,
          newParentId: grandParentId
        })

    } catch (err) {
      console.error("Delete error:", err)
      return res.status(500).json({ message: "Failed to delete user" })
    }
  }
)



/* =====================================================
   ADMIN → RESTORE USER
   ✔ Prevent restore active user
===================================================== */

app.put(
  "/admin/restore-user/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {

      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid user id" })

      const user = await User.findById(id)

      if (!user)
        return res.status(404).json({ message: "User not found" })

      if (!user.isDeleted)
        return res.status(400).json({ message: "User is not deleted" })

      user.isDeleted = false
      user.deletedAt = null
      user.isBlocked = false
      user.blockedAt = null

      await user.save()

      return res.json({
        success: true,
        message: "User restored",
        userId: user._id
      })

    } catch (err) {
      console.error("Restore error:", err)
      return res.status(500).json({ message: "Failed to restore user" })
    }
  }
)

/* =====================================================
   ADMIN → CHANGE USER PARENT (RECONNECT)
   PUT /admin/change-parent/:id
===================================================== */
app.put(
  "/admin/change-parent/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { id } = req.params
      const { newParentId } = req.body

      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid user id" })

      if (newParentId && !mongoose.Types.ObjectId.isValid(newParentId))
        return res.status(400).json({ message: "Invalid newParentId" })

      const user = await User.findById(id)
      if (!user) return res.status(404).json({ message: "User not found" })

      if (String(id) === String(newParentId))
        return res.status(400).json({ message: "User cannot be own parent" })

      user.parentId = newParentId || null

      // ⭐ Name update — generateUserId se fresh unique naam milega
      try {
        let parentName = null
        if (newParentId) {
          const newParentUser = await User.findById(newParentId).select("name role")
          if (newParentUser && newParentUser.role !== "admin") {
            parentName = newParentUser.name
          }
        }

        // ⭐ generateUserId se unique naam generate karo
        // Pehle current user ka naam temporarily hatao taaki uska apna number reuse na ho
        const oldName = user.name
        user.name = "__temp_rename__"
        await user.save()

        const newName = await generateUserId(user.role, User, parentName)
        user.name = newName

        console.log(`✅ Name changed: ${oldName} → ${newName}`)
      } catch (nameErr) {
        console.error("Name update error:", nameErr.message)
      }

      // ⭐ Final save with new name + parentId
      await user.save()

      // ⭐ Purane PENDING orders bhi new distributor ke paas bhejo
      try {
        const findNearestDist = async (userId) => {
          if (!userId) return null
          const p = await User.findById(userId).select("role parentId isDeleted")
          if (!p || p.isDeleted) return null
          if (p.role === "distributor") return p._id
          if (p.role === "admin") return null
          return findNearestDist(p.parentId)
        }

        const newDistId = await findNearestDist(user._id)

        if (newDistId) {
          const updated = await Order.updateMany(
            { sellerId: user._id, status: "pending" },
            { $set: { distributorId: newDistId } }
          )
          console.log("✅ Pending orders updated:", updated.modifiedCount)
        }
      } catch (orderErr) {
        console.error("Order update error:", orderErr.message)
      }

      const newParent = newParentId
        ? await User.findById(newParentId).select("name role")
        : null

      return res.json({
        success: true,
        message: "Parent updated",
        newParent: newParent
          ? { id: newParent._id, name: newParent.name, role: newParent.role }
          : null
      })
    } catch (err) {
      console.error("Change parent error:", err)
      return res.status(500).json({ message: err.message })
    }
  }
)
/* =====================================================
   ADMIN → PERMANENT DELETE USER
   ⚠️ Must be soft deleted first
   ✔ Prevent accidental delete
===================================================== */

app.delete(
  "/admin/permanent-delete-user/:id",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {

      const { id } = req.params

      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid user id" })

      const user = await User.findById(id)

      if (!user)
        return res.status(404).json({ message: "User not found" })

      if (!user.isDeleted)
  return res.status(400).json({
    message: "User must be soft deleted first"
  })

      // ⭐ CASCADE REASSIGN on permanent delete (safety ke liye dobara)
      const grandParentId2 = user.parentId || null
      const children2 = await User.find({ parentId: user._id })

      if (children2.length > 0) {
        await User.updateMany(
          { parentId: user._id },
          { $set: { parentId: grandParentId2 } }
        )
        if (grandParentId2) {
          const childIds2 = children2.map(c => c._id)
          const Order = mongoose.model("Order")
          await Order.updateMany(
            { sellerId: { $in: childIds2 }, status: "pending" },
            { $set: { distributorId: grandParentId2 } }
          )
        }
      }

      await User.findByIdAndDelete(id)

      return res.json({
        success: true,
        message: "User permanently deleted",
        childrenReassigned: children2.length,
        newParentId: grandParentId2
      })

          } catch (err) {
            console.error("Permanent delete error:", err)
            return res.status(500).json({
              message: "Failed to permanently delete user"
            })
          }
        }
      )
/* =====================================================
   ⭐ GET MY WALLET
===================================================== */
app.get("/users/wallet/me", protect, async (req, res) => {
  try {

    console.log("🪙 Wallet request by:", req.user?.id)

    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const history = await Commission.find({
      toUser: user._id
    })
      .populate("fromUser", "name email role")
      .populate("orderId")
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({
      coinBalance: user.coinBalance || 0,
      walletBalance: user.walletBalance || 0,
      totalCommissionEarned: user.totalCommissionEarned || 0,
      totalCoinEarned: user.totalCoinEarned || 0,
      history
    })

  } catch (err) {
    console.error("Wallet error:", err.message)
    res.status(500).json({ message: err.message })
  }
})

/*=====================================================
   Admin Approve → Auto Create User + Temp Password
=====================================================*/

app.post("/requests/approve/:id", protect, allowRoles("admin"), async (req, res) => {
  try {

    console.log("🔥 APPROVE REQUEST ID =", req.params.id)
    console.log("🔥 USER =", req.user?.id, req.user?.role)

    const { productIds, assignAllProducts } = req.body

    const request = await UserRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ message: "Request not found" })

    if (request.status === "approved")
      return res.status(400).json({ message: "Already approved" })

    if (request.status === "rejected")
      return res.status(400).json({ message: "Already rejected" })

    const cleanEmail = request.email.trim().toLowerCase()
    const exists = await User.findOne({ email: cleanEmail })
    if (exists) return res.status(409).json({ message: "User already exists" })

    // ⭐ Parent ka name lo
    // ⭐ FIX: Agar parent admin hai to prefix mat lagao
    let parentName = null
    if (request.requestedBy) {
      const parentUser = await User.findById(request.requestedBy).select("name role").lean()
      if (parentUser && parentUser.role !== "admin") {
        parentName = parentUser.name
      }
}

    // ⭐ Auto name generate: e.g. "DB004/DS001"
    const autoName = await generateUserId(request.type, User, parentName)

    const tempPass = crypto.randomBytes(4).toString("hex")
    const hashed = await bcrypt.hash(tempPass, 10)

    // ⭐ PRODUCTS LOGIC (UNTOUCHED)
    let assignedProducts = []

if (assignAllProducts) {
  assignedProducts = await Product.find().distinct("_id")
}
else if (productIds?.length) {
  assignedProducts = productIds.map(id => new mongoose.Types.ObjectId(id))
}
else if (request.assignAllProducts) {
  assignedProducts = await Product.find().distinct("_id")
}
// ⭐ FIX: Last fallback hataya — admin ne select nahi kiya to koi product nahi milega
// else if (request.assignedProducts?.length) { ... }  ← REMOVED

    const newUser = await User.create({
      name: autoName,         // ⭐ auto generated name
      email: cleanEmail,
      password: hashed,
      role: request.type,
      parentId: request.requestedBy,
      mustChangePassword: true,
      assignedProducts,
      // ⭐ FIX: Request form se phone/address/fullName save karo
      fullName: request.name || "",
      phone: request.phone || "",
      address: request.address || ""
    })

    request.status           = "approved"
    request.approvedAt       = new Date()
    request.createdUserId    = newUser._id
    request.createdUserName  = newUser.name
    request.createdUserEmail = newUser.email
    request.tempPassword     = tempPass
    await request.save()

    res.json({
      success: true,
      tempPassword: tempPass,
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
})

/* =====================================================
   ADMIN → REJECT REQUEST
===================================================== */

app.post("/requests/reject/:id", protect, allowRoles("admin"), async (req, res) => {
  try {

    console.log("🔥 REJECT REQUEST ID =", req.params.id)   // ⭐ DEBUG

    const request = await UserRequest.findById(req.params.id)

    if (!request)
      return res.status(404).json({ message: "Request not found" })

    request.status = "rejected"
    await request.save()

    console.log("🔥 REQUEST REJECTED")

    return res.json({ success: true })

  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

/* =====================================================
   SELLER → MY ASSIGNED PRODUCTS
===================================================== */
app.get(
  "/products/mine",
  protect,
  allowRoles("seller"),
  async (req, res) => {
    try {
      const seller = await User.findById(req.user.id)

      if (!seller) {
        return res.status(404).json({ message: "Seller not found" })
      }

      // If no assignment → show empty
      if (!seller.assignedProducts || seller.assignedProducts.length === 0) {
        return res.json([])
      }

      const assignedProducts = await Product.find({
        _id: { $in: seller.assignedProducts }
      })

      res.json(assignedProducts)

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)
/* =====================================================
   NETWORK TREE (FINAL FIXED)
===================================================== */
app.get(
  "/users/tree",
  protect,
  allowRoles("admin","distributor","seller","user"),
  async (req, res) => {

    try {

      const users = await User.find().lean()

      /* =====================================================
         BUILD TREE FUNCTION
      ===================================================== */

      const buildTree = (parentId) => {

        const children = users.filter(
          u => String(u.parentId) === String(parentId)
        )

        return children.map(user => {

          const childNodes = buildTree(String(user._id))

          return {
            id: String(user._id),
            name: user.name,
            role: user.role,
            children: childNodes
          }

        })

      }

      /* =====================================================
         ADMIN → FULL TREE
      ===================================================== */

      if (req.user.role === "admin") {
  const adminUser = users.find(u => u.role === "admin")
  const adminId = adminUser ? String(adminUser._id) : null

  // Saare valid user IDs ka set
  const allUserIds = new Set(users.map(u => String(u._id)))

  const adminChildren = users
    .filter(u => {
      if (u.role === "admin") return false
      const pid = u.parentId ? String(u.parentId) : null
      return (
        !pid ||                        // parentId null
        pid === adminId ||             // directly admin se connected
        !allUserIds.has(pid)           // ⭐ orphan — parent exist hi nahi karta
      )
    })
    .map(u => ({
      id: String(u._id),
      name: u.name,
      role: u.role,
      children: buildTree(String(u._id))
    }))

  const tree = [{
    id: adminId || "admin",
    name: "Admin",
    role: "admin",
    children: adminChildren
  }]

  return res.json(tree)
}

      /* =====================================================
         DISTRIBUTOR / SELLER → ONLY THEIR TREE
      ===================================================== */

      const me = users.find(
        u => String(u._id) === String(req.user.id)
      )

      if (!me) return res.json([])

      const myTree = [{
        id: String(me._id),
        name: me.name,
        role: me.role,
        children: buildTree(String(me._id))
      }]

      return res.json(myTree)

    } catch (err) {

      console.error("Tree error:", err)

      res.status(500).json({
        message: err.message
      })

    }

  }
)
/* =====================================================
   DISTRIBUTOR → OWN SELLERS
===================================================== */
app.get(
  "/users/my-sellers",
  protect,
  allowRoles("distributor"),
  async (req, res) => {
    const sellers = await User.find({
      role: "seller",
      parentId: String(req.user.id)
    })

    res.json(sellers)
  }
)

/* =====================================================
   SELLER → OWN SELLERS + USERS (direct children)
===================================================== */
app.get(
  "/users/my-children",
  protect,
  allowRoles("seller"),
  async (req, res) => {
    try {
      const children = await User.find({
        role: { $in: ["seller", "user"] },
        parentId: req.user.id
      }).select("name email role isBlocked isDeleted createdAt assignedProducts")

      res.json(children)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

/* =====================================================
   ORDER SYSTEM (APPROVAL FLOW)
===================================================== 

app.post(
  "/orders",
  protect,
  allowRoles("seller"),
  async (req, res) => {
    try {
      const seller = await User.findById(req.user.id)
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" })
      }

      const order = await Order.create({
        sellerId: seller._id,
        distributorId: seller.parentId || null,
        items: req.body.items || [],
        total: req.body.total,
        customerName: req.body.customerName,
        phone: req.body.phone,
        address: req.body.address,
        status: "pending"
      })

      res.json(order)

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

app.get(
  "/orders/pending",
  protect,
  allowRoles("distributor"),
  async (req, res) => {
    try {
      const orders = await Order.find({
        distributorId: req.user.id,
        status: "pending"
      })
        .populate("sellerId", "name")
        .sort({ createdAt: -1 })

      res.json(orders)

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

app.put(
  "/orders/confirm/:id",
  protect,
  allowRoles("distributor"),
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
      if (!order) {
        return res.status(404).json({ message: "Order not found" })
      }

      if (order.status !== "pending") {
        return res.status(400).json({ message: "Already processed" })
      }

      order.status = "confirmed"
      order.confirmedAt = new Date()
      await order.save()

      

      const seller = await User.findById(order.sellerId)
      if (seller) {
        seller.sales = (seller.sales || 0) + order.total
        await seller.save()

        if (seller.sales >= 50000 && seller.role === "seller") {
          seller.role = "distributor"
          await seller.save()
        }
      }

      res.json(order)

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)
*/
/* =====================================================
   DISTRIBUTOR → ALL MY ORDERS (HISTORY)
===================================================== */
app.get(
  "/orders/distributor",
  protect,
  allowRoles("distributor"),
  async (req, res) => {
    try {
      const orders = await Order.find({
        distributorId: req.user.id
      })
        .populate("sellerId", "name")
        .sort({ createdAt: -1 })

      res.json(orders)

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)
/* =====================================================
   SELLER → MY ORDERS
===================================================== */
app.get(
  "/orders/mine",
  protect,
  allowRoles("seller", "user"),
  async (req, res) => {
    try {
      const orders = await Order.find({
        sellerId: new mongoose.Types.ObjectId(req.user.id)
      }).sort({ createdAt: -1 })

      res.json(orders)

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

/* =====================================================
   🔥 ENTERPRISE ANALYTICS API
===================================================== */
app.get(
  "/analytics/user/:id",
  protect,
  async (req, res) => {
    try {
      const { range = "lifetime" } = req.query
      const userId = String(req.params.id)

      let startDate = null
      const now = new Date()

      if (range === "today")
        startDate = new Date(now.setHours(0, 0, 0, 0))
      if (range === "week")
        startDate = new Date(Date.now() - 7 * 86400000)
      if (range === "month")
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      if (range === "year")
        startDate = new Date(now.getFullYear(), 0, 1)

      const orderQuery = { sellerId: userId, status: "confirmed" }
if (startDate) orderQuery.createdAt = { $gte: startDate }
const orders = await Order.find(orderQuery)

const totalSales = orders.reduce((s, o) => s + o.total, 0)

const timelineMap = {}
orders.forEach(o => {
  const label = new Date(o.createdAt).toLocaleDateString()
  if (!timelineMap[label]) timelineMap[label] = 0
  timelineMap[label] += o.total
})
const timeline = Object.keys(timelineMap).map(key => ({
  label: key, total: timelineMap[key]
}))

// Sub-users count (recursive)
const countSubUsers = async (parentId) => {
  const direct = await User.find({ parentId: new mongoose.Types.ObjectId(parentId), isDeleted: { $ne: true } }).select("_id")
  let total = direct.length
  for (const child of direct) {
    total += await countSubUsers(child._id)
  }
  return total
}
const subUsersCount = await countSubUsers(userId)

// Direct children
const directChildren = await User.find({
  parentId: new mongoose.Types.ObjectId(userId),
  isDeleted: { $ne: true }
}).select("name role email isBlocked")

// ⭐ ALL sub users (recursive flat list)
const getAllSubUsers = async (parentId) => {
  const direct = await User.find({
    parentId: new mongoose.Types.ObjectId(String(parentId)),
    isDeleted: { $ne: true }
  }).select("name role isBlocked")
  let all = [...direct]
  for (const child of direct) {
    const nested = await getAllSubUsers(child._id)
    all = [...all, ...nested]
  }
  return all
}
const allSubUsers = await getAllSubUsers(userId)

// Assigned products
const targetUser = await User.findById(userId).select("assignedProducts role name")
let assignedProducts = []
if (targetUser?.assignedProducts?.length) {
  assignedProducts = await Product.find({
    _id: { $in: targetUser.assignedProducts }
  }).select("title price")
}

// Top selling product
const productSalesMap = {}
orders.forEach(o => {
  (o.items || []).forEach(item => {
    const pid = String(item.productId || item._id || "unknown")
    const name = item.title || item.name || pid
    if (!productSalesMap[pid]) productSalesMap[pid] = { name, total: 0, count: 0 }
    productSalesMap[pid].total += (item.price || 0) * (item.qty || item.quantity || 1)
    productSalesMap[pid].count += (item.qty || item.quantity || 1)
  })
})
const topProduct = Object.values(productSalesMap).sort((a, b) => b.total - a.total)[0] || null

res.json({
  ordersCount: orders.length,
  totalSales,
  timeline,
  subUsersCount,
  directChildren,
  assignedProducts,
  topProduct,
  allSubUsers,
  userName: targetUser?.name,
  userRole: targetUser?.role
})

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)
/* =====================================================
   DISTRIBUTOR → ASSIGN PRODUCTS TO SELLER
===================================================== */

app.put(
  "/users/assign-products/:sellerId",
  protect,
  allowRoles("distributor"),
  async (req, res) => {
    try {
      const { sellerId } = req.params
      const { productIds } = req.body

      const seller = await User.findById(sellerId)

      if (!seller) {
        return res.status(404).json({ message: "Seller not found" })
      }

      if (String(seller.parentId) !== String(req.user.id)) {
        return res.status(403).json({
          message: "You can assign only your own sellers"
        })
      }

      // 🔥🔥🔥 IMPORTANT FIX HERE
      seller.assignedProducts = productIds
        ? productIds.map(
            id => new mongoose.Types.ObjectId(id)
          )
        : []

      await seller.save()

      res.json({
        success: true,
        assignedProducts: seller.assignedProducts
      })

    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)
/* =====================================================
   CHECK EMAIL EXISTS
===================================================== */
app.get("/check-email", async (req, res) => {
  try {
    const email = req.query.email?.trim().toLowerCase()
    if (!email) return res.json({ exists: false })

    const user = await User.findOne({ email })
    res.json({ exists: !!user })

  } catch (err) {
    res.status(500).json({ exists: false })
  }
})

/* =====================================================
   SETTINGS — Email Domain Suffix
   GET  /settings/email-domain  → domain fetch karo
   POST /settings/email-domain  → admin domain set kare
===================================================== */

// GET — koi bhi logged user domain fetch kar sakta hai
app.get("/settings/email-domain", protect, async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: "emailDomain" })
    res.json({ domain: setting?.value || "" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST — sirf admin set kar sakta hai
app.post(
  "/settings/email-domain",
  protect,
  allowRoles("admin"),
  async (req, res) => {
    try {
      let { domain } = req.body
      if (!domain) return res.status(400).json({ message: "Domain required" })

      // Clean: ensure starts with @
      domain = domain.trim()
      if (!domain.startsWith("@")) domain = "@" + domain

      await Settings.findOneAndUpdate(
        { key: "emailDomain" },
        { key: "emailDomain", value: domain },
        { upsert: true, new: true }
      )

      res.json({ success: true, domain })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)
/* =====================================================
   HEALTH CHECK
===================================================== */
app.get("/health", (req, res) => {
  res.json({ status: "OK", time: new Date() })
})

/* =====================================================
   SERVER START
===================================================== */
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`)
})

 

