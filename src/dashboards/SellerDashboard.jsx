import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import Store from "../pages/Store"
import UserAnalytics from "../admin/UserAnalytics"

/*
  =====================================================
  SELLER DASHBOARD (FINAL – ENTERPRISE READY)
  -----------------------------------------------------
  ✔ Company header
  ✔ Seller analytics
  ✔ Full order history
  ✔ Pending / Confirmed / Rejected counters
  ✔ Auto refresh safe
  ✔ Defensive auth handling
  ✔ NOTHING REMOVED – ONLY ENHANCED
  =====================================================
*/

export default function SellerDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  /* ================= SAFETY ================= */
  if (!user) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <p className="text-red-500 font-semibold">
          Unauthorized access. Please login again.
        </p>
      </div>
    )
  }

  /* ================= LOAD MY ORDERS ================= */
  const loadOrders = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch(
        "http://localhost:5000/orders/mine",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!res.ok) return

      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])

    } catch (err) {
      console.error("Order load failed", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  /* ================= STATUS COUNTS ================= */
  const pendingCount = orders.filter(o => o.status === "pending").length
  const confirmedCount = orders.filter(o => o.status === "confirmed").length
  const rejectedCount = orders.filter(o => o.status === "rejected").length

  return (
    <div className="bg-white p-6 rounded shadow space-y-8">

      {/* ================= HEADER ================= */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">My Company</h1>
        <p className="text-gray-600">
          Seller: <span className="font-semibold">{user?.name}</span>
        </p>
      </div>

      {/* ================= ANALYTICS ================= */}
      <section>
        <h2 className="font-bold mb-3">My Performance</h2>

        <UserAnalytics
          user={{
            id: user._id || user.id,
            name: user.name,
            role: user.role || "seller"
          }}
        />
      </section>

      {/* ================= ORDER SUMMARY ================= */}
      <section>
        <h2 className="font-bold mb-3">Order Summary</h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-yellow-100 p-3 rounded text-center">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="font-bold text-lg">{pendingCount}</p>
          </div>

          <div className="bg-green-100 p-3 rounded text-center">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="font-bold text-lg">{confirmedCount}</p>
          </div>

          <div className="bg-red-100 p-3 rounded text-center">
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="font-bold text-lg">{rejectedCount}</p>
          </div>
        </div>
      </section>

      {/* ================= ORDER HISTORY ================= */}
      <section>
        <h2 className="font-bold mb-3">My Orders</h2>

        {loading ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">No orders yet</p>
        ) : (
          orders.map(order => (
            <div key={order._id} className="border p-3 mb-2 rounded">
              <p><strong>Total:</strong> ₹{order.total}</p>
              <p><strong>Customer:</strong> {order.customerName}</p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    order.status === "pending"
                      ? "text-yellow-600 font-semibold"
                      : order.status === "confirmed"
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {order.status}
                </span>
              </p>

              <p className="text-xs text-gray-500">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </section>

      {/* ================= PRODUCTS ================= */}
      <section>
        <h2 className="font-bold mb-2">Available Products</h2>
        <Store />
      </section>

    </div>
  )
}