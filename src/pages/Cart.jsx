import { useStore } from "../context/StoreContext"

export default function Cart({ setPage }) {
  const {
    cart = [],
    incQty,
    decQty,
    removeFromCart
  } = useStore()

  /* ================= TOTAL ================= */
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  )

  /* ================= EMPTY CART ================= */
  if (cart.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-10">
        Cart is empty
      </p>
    )
  }

  /* ================= UI ================= */
  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      {cart.map(item => (
        <div
          key={item.id}
          className="grid grid-cols-5 items-center border-b py-3 gap-2"
        >
          <span className="font-medium">{item.title}</span>

          <span className="text-center">₹{item.price}</span>

          <div className="flex justify-center items-center gap-3">
            <button
              onClick={() => decQty(item.id)}
              className="px-2 py-1 bg-gray-200 rounded"
            >
              -
            </button>

            <span>{item.qty}</span>

            <button
              onClick={() => incQty(item.id)}
              className="px-2 py-1 bg-gray-200 rounded"
            >
              +
            </button>
          </div>

          <span className="text-center font-semibold">
            ₹{item.price * item.qty}
          </span>

          <button
            onClick={() => removeFromCart(item.id)}
            className="text-red-500 font-bold text-center"
          >
            ✕
          </button>
        </div>
      ))}

      {/* ================= FOOTER ================= */}
      <div className="flex justify-between items-center mt-6">
        <b className="text-lg">Total: ₹{total}</b>

        <button
          onClick={() => setPage && setPage("checkout")}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
        >
          Checkout
        </button>
      </div>
    </div>
  )
}
