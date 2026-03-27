import express from "express"
import multer from "multer"
import protect from "../middleware/auth.js"
import allowRoles from "../middleware/allowRoles.js"

const router = express.Router()

// upload config (same as tumhara)
const upload = multer({ dest: "uploads/" })

/* ================= ADMIN ONLY ================= */
router.post(
  "/admin/add-product",
  protect,
  allowRoles("admin"),
  upload.single("image"),
  (req, res) => {
    const { title, price } = req.body

    const newProduct = {
      id: Date.now(),
      title,
      price: Number(price),
      image: req.file ? req.file.filename : ""
    }

    // existing array me push
    req.app.locals.products.push(newProduct)

    res.json(req.app.locals.products)
  }
)

router.delete(
  "/admin/delete-product/:id",
  protect,
  allowRoles("admin"),
  (req, res) => {
    const id = Number(req.params.id)

    req.app.locals.products =
      req.app.locals.products.filter(p => p.id !== id)

    res.json(req.app.locals.products)
  }
)

export default router
