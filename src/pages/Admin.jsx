import { useState } from "react"
import { useStore } from "../context/StoreContext"
import { useAuth } from "../context/AuthContext"

// ================= ADMIN SECTIONS =================
import CMSBlocks from "../admin/CMSBlocks"
import ProductManager from "../admin/ProductManager"
import NetworkManager from "../admin/NetworkManager"
import NetworkTree from "../admin/NetworkTree"
import CreateUser from "../admin/CreateUser"
import AdminAnalytics from "../admin/AdminAnalytics"

/* ⭐ NEW IMPORT – COMMISSION PAGE */
import AdminCommission from "../pages/AdminCommission"

// ================= VISUAL TREE (INTENTIONALLY DISABLED HERE) =================
import VisualTree from "../admin/VisualTree"

/*
  =====================================================
  ADMIN PANEL (FINAL – CLEAN & CONTROLLED)
  -----------------------------------------------------
  ✔ Admin only (hard lock)
  ✔ Visual Tree MOVED to separate page
  ✔ Admin page kept CLEAN & FAST
  ✔ Feature flags for safe toggling
  ✔ NOTHING REMOVED – ONLY RENDER CONTROL
  =====================================================
*/

// ================= FEATURE FLAGS =================
const SHOW_LEGACY_NETWORK = false
const SHOW_VISUAL_TREE_IN_ADMIN = false   // ❌ DO NOT ENABLE

/* ⭐ NEW FEATURE FLAG FOR COMMISSION */
const SHOW_COMMISSION_PANEL = true

export default function Admin() {

  /* ================= AUTH (HARD GUARD) ================= */
  const { user } = useAuth()

  if (!user || user.role !== "admin") {
    return (
      <div className="bg-white p-6 rounded shadow">
        <p className="text-red-600 font-semibold">
          ❌ Access Denied. Admins only.
        </p>
      </div>
    )
  }

  /* ================= STORE CONTEXT ================= */
  const {
    products = [],
    addProduct: addProductToStore,
    deleteProduct
  } = useStore()

  /* ================= LOCAL PRODUCT STATE ================= */
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState(null)

  /* ================= ADD PRODUCT ================= */
  const addProduct = () => {
    if (!title.trim() || !price) {
      alert("Product name & price are required")
      return
    }

    addProductToStore({
      id: Date.now(),
      title: title.trim(),
      price: Number(price),
      image
    })

    setTitle("")
    setPrice("")
    setImage(null)
  }

  /* ================= UI ================= */
  return (
    <div className="bg-white p-6 rounded shadow space-y-12">

      {/* ================= ANALYTICS ================= */}
      <section>
        <AdminAnalytics />
      </section>

      {/* ================= CMS ================= */}
      <section>
        <h2 className="text-lg font-bold mb-3">
          CMS Blocks
        </h2>
        <CMSBlocks />
      </section>

      {/* ================= PRODUCT MANAGEMENT ================= */}
      <section>
        <h2 className="text-lg font-bold mb-3">
          Product Management
        </h2>

        <ProductManager
          products={products}
          title={title}
          price={price}
          setTitle={setTitle}
          setPrice={setPrice}
          setImage={setImage}
          addProduct={addProduct}
          deleteProduct={deleteProduct}
        />
      </section>

      {/* ================= CREATE USER ================= */}
      <section>
        <h2 className="text-lg font-bold mb-3">
          Create Distributor / Seller
        </h2>
        <CreateUser />
      </section>

      {/* ================= ⭐ COMMISSION PANEL ================= */}
      {SHOW_COMMISSION_PANEL && (
        <section>
          <h2 className="text-lg font-bold mb-3">
            Commission Management
          </h2>
          <AdminCommission />
        </section>
      )}

      {/* ================= LEGACY NETWORK (OPTIONAL) ================= */}
      {SHOW_LEGACY_NETWORK && (
        <section>
          <NetworkManager />
          <NetworkTree />
        </section>
      )}

      {/* ================= VISUAL TREE (INTENTIONALLY NOT RENDERED) ================= */}
      {SHOW_VISUAL_TREE_IN_ADMIN && (
        <VisualTree data={[]} />
      )}

    </div>
  )
}
