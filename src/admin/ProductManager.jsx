export default function ProductManager({
  products = [],        // ✅ default safe value
  title = "",
  price = "",
  setTitle = () => {},  // ✅ fallback to avoid crash
  setPrice = () => {},
  setImage = () => {},
  addProduct = () => {},
  deleteProduct = () => {}
}) {
  return (
    <div className="mb-8">
      <h2 className="font-bold mb-3">Products</h2>

      {/* PRODUCT NAME */}
      <input
        className="border p-2 mr-2"
        placeholder="Name"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      {/* PRODUCT PRICE */}
      <input
        className="border p-2 mr-2"
        placeholder="Price"
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
      />

      {/* PRODUCT IMAGE */}
      <input
        type="file"
        className="border p-2 mr-2"
        onChange={e => setImage(e.target.files?.[0] || null)}
      />

      {/* ADD BUTTON */}
      <button
        onClick={addProduct}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Add Product
      </button>

      {/* PRODUCT LIST */}
      <div className="mt-4">
        {products.length === 0 && (
          <p className="text-gray-500 text-sm">No products added yet</p>
        )}

        {products.map(p => (
          <div
            key={p.id}
            className="flex justify-between items-center border-b py-2"
          >
            <span>
              {p.title} – ₹{p.price}
            </span>

            <button
              onClick={() => deleteProduct(p.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
