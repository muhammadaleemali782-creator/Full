export default function ProductCard({ product }) {
  return (
    <div className="bg-white p-4 rounded shadow hover:shadow-lg">
      <img src={product.image} className="h-40 mx-auto" />
      <h2 className="font-bold mt-2">{product.title}</h2>
      <p className="text-green-600 font-semibold">₹{product.price}</p>
      <button className="bg-yellow-400 w-full mt-3 p-2 rounded font-bold">
        Add to Cart
      </button>
    </div>
  )
}