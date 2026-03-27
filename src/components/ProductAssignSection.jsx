import { useState, useEffect } from "react"
import { useStore } from "../context/StoreContext"

export default function ProductAssignSection({ onChange }) {

  /* ================= PRODUCTS FROM STORE ================= */
  const { products = [] } = useStore()

  /* ================= DEBUG (REMOVE LATER IF WANT) ================= */
  // console.log("Assign Section Products:", products)

  /* ================= SELECTED PRODUCTS STATE ================= */
  const [selectedProducts, setSelectedProducts] = useState([])

  /* ================= HANDLE PRODUCT SELECT ================= */
  const handleProductSelect = (e) => {
    const id = String(e.target.value) // always string for safety

    setSelectedProducts(prev => {
      let updated

      if (e.target.checked) {
        // avoid duplicates
        if (prev.includes(id)) return prev
        updated = [...prev, id]
      } else {
        updated = prev.filter(p => String(p) !== id)
      }

      return updated
    })
  }

  /* ================= SYNC WITH PARENT ================= */
  useEffect(() => {
    if (typeof onChange === "function") {
      onChange(selectedProducts)
    }
  }, [selectedProducts, onChange])

  /* ================= SAFE PRODUCT LIST ================= */
  const safeProducts = Array.isArray(products)
    ? products.filter(p => p && p._id)
    : []

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">Assign Products</h3>

      {safeProducts.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No products available
        </p>
      ) : (
        safeProducts.map(p => {
          const productId = String(p._id)

          return (
            <div
              key={productId}
              className="flex items-center gap-2 mb-2"
            >
              <input
                type="checkbox"
                value={productId}
                checked={selectedProducts.includes(productId)}
                onChange={handleProductSelect}
              />
              <span>{p.title}</span>
            </div>
          )
        })
      )}
    </div>
  )
}