import { useStore } from "../context/StoreContext"

export default function Home() {
  const { products } = useStore()

  // safety fallback
  const safeProducts = Array.isArray(products) ? products : []

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {safeProducts.length === 0 && (
        <p className="text-gray-500">No products found</p>
      )}

      {safeProducts.map(p => (
        <div key={p.id} className="bg-white p-4 rounded shadow">
          <h3 className="font-bold">{p.title}</h3>
          <p className="text-green-600">₹{p.price}</p>
        </div>
      ))}
    </div>
  )
}
