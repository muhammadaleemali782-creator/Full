import { useStore } from "../context/StoreContext"
import { useAuth } from "../context/AuthContext"

export default function Store() {
  const { products = [], cart = [], setCart } = useStore()
  const { user } = useAuth()

  console.log("🛍 STORE USER:", user)
  console.log("🛍 STORE PRODUCTS:", products.length)

  // ✅ FIX: backend already filtered products bhejta hai, yahan filter nahi chahiye
  const visibleProducts = products

  console.log("👀 VISIBLE PRODUCTS:", visibleProducts.length)

  /* ================= ADD TO CART ================= */
  const addToCart = (product) => {
    const productId = product.id || product._id

    console.log("➕ ADD TO CART CLICK:", product)

    setCart(prevCart => {
      const existingItem = prevCart.find(
        item => (item.id || item._id) === productId
      )

      if (existingItem) {
        console.log("🟡 CART QTY +1:", productId)
        return prevCart.map(item =>
          (item.id || item._id) === productId
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      }

      /* ⭐ IMPORTANT – BACKEND FRIENDLY ITEM */
      const safeItem = {
        ...product,
        id: productId,
        productId: productId,
        productName: product.title || product.name,
        price: product.price,
        qty: 1
      }

      console.log("🟢 NEW ITEM:", safeItem)

      return [
        ...prevCart,
        safeItem
      ]
    })
  }

  /* ================= EMPTY STATE ================= */
  if (!visibleProducts || visibleProducts.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-12 text-lg">
        No products available right now
      </div>
    )
  }

  /* ================= UI ================= */
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {visibleProducts.map(product => {
        const productId = product.id || product._id

        return (
          <div
            key={productId}
            className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition duration-200"
          >
            {/* ---------- PRODUCT IMAGE (SAFE) ---------- */}
            {product.image && (
              <div className="h-40 mb-3 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                <img
                  src={
                    typeof product.image === "string"
                      ? product.image.startsWith("http")
                        ? product.image
                        : `http://localhost:5000/uploads/${product.image}`
                      : product.image instanceof File
                      ? URL.createObjectURL(product.image)
                      : ""
                  }
                  alt={product.title}
                  className="h-full w-full object-cover"
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            )}

            {/* ---------- PRODUCT INFO ---------- */}
            <h2 className="font-semibold text-lg">
              {product.title}
            </h2>

            <p className="text-green-600 font-bold mt-1">
              ₹{product.price}
            </p>

            {/* ---------- ACTION ---------- */}
            <button
              onClick={() => addToCart(product)}
              className="bg-yellow-400 hover:bg-yellow-500 w-full mt-4 py-2 rounded font-semibold transition"
            >
              Add to Cart
            </button>
          </div>
        )
      })}
    </div>
  )
}