import { useEffect, useState } from "react"

export default function SellerPendingOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId,   setActionId]   = useState(null)
  const [actionType, setActionType] = useState(null)
  const [note, setNote]             = useState("")
  const [msg,  setMsg]              = useState("")

  const token = localStorage.getItem("token")

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("http://localhost:5000/orders/seller/pending", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN")

  const handleAction = async (id, type) => {
    try {
      setMsg("")
      const url = type === "approve"
        ? `http://localhost:5000/orders/seller/approve/${id}`
        : `http://localhost:5000/orders/seller/reject/${id}`

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setMsg("❌ " + (data.msg || "Error"))
        return
      }

      setMsg(type === "approve" ? "✅ Order approved — Distributor ke paas bheja" : "❌ Order rejected")
      setActionId(null)
      setNote("")
      load()

    } catch (err) {
      setMsg("❌ Server error")
    }
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">📥 User Orders — Pending Approval</h1>
      <p className="text-sm text-gray-500">Yeh orders aapke neeche ke users ne place kiye hain</p>

      {msg && (
        <div className={`p-3 rounded text-sm font-medium ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {msg}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
          Koi pending order nahi hai
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white rounded-xl shadow p-5 space-y-3">

              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-xs text-gray-400">#{order._id.slice(-6)}</p>
                  <p className="font-bold text-lg">₹{fmt(order.total)}</p>
                  <p className="text-sm text-gray-500">{order.customerName} · {order.phone}</p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  <div className="mt-1">
                    By: <span className="font-semibold text-gray-600">
                      {order.userId?.name || "Unknown User"}
                    </span>
                    <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-1 rounded">user</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              {order.items?.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-2">Items:</p>
                  <div className="space-y-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.title || item.name} × {item.qty || item.quantity || 1}</span>
                        <span className="text-green-700">₹{fmt((item.price || 0) * (item.qty || item.quantity || 1))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {actionId === order._id ? (
                <div className="border-t pt-3 space-y-2">
                  <textarea
                    className="border p-2 w-full rounded text-sm"
                    placeholder="Note (optional)"
                    rows={2}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(order._id, actionType)}
                      className={`flex-1 py-2 rounded text-white font-medium ${
                        actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {actionType === "approve" ? "✅ Confirm Approve" : "❌ Confirm Reject"}
                    </button>
                    <button
                      onClick={() => { setActionId(null); setNote("") }}
                      className="flex-1 py-2 rounded bg-gray-200 text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 border-t pt-3">
                  <button
                    onClick={() => { setActionId(order._id); setActionType("approve") }}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => { setActionId(order._id); setActionType("reject") }}
                    className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 font-medium"
                  >
                    ❌ Reject
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
