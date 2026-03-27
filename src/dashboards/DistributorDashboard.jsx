import { useMemo, useEffect, useState } from "react"
import { useStore } from "../context/StoreContext"
import { useAuth } from "../context/AuthContext"
import StatsCard from "./StatsCard"
import UserAnalytics from "../admin/UserAnalytics"

export default function DistributorDashboard() {
  const { users: storeUsers = [], products = [] } = useStore()
  const { user } = useAuth()

  const [apiSellers, setApiSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [pendingOrders, setPendingOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])

  /* ⭐ NEW SAFE TOKEN FUNCTION (ADDED ONLY) */
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")

    if (!token) {
      alert("Session expired. Please login again.")
      window.location.href = "/login"
      return {}
    }

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  }

  if (!user) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <p className="text-red-500 font-semibold">
          Unauthorized access. Please login again.
        </p>
      </div>
    )
  }

  /* ================= LOAD SELLERS ================= */
  useEffect(() => {
    const loadSellers = async () => {
      try {

        const res = await fetch(
          "http://localhost:5000/users/my-sellers",
          { headers: getAuthHeaders() }
        )

        if (res.status === 401) {
          alert("Login expired. Please login again.")
          localStorage.removeItem("token")
          window.location.href = "/login"
          return
        }

        if (!res.ok) throw new Error("Failed to load sellers")

        const data = await res.json()
        setApiSellers(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
        setApiSellers([])
      } finally {
        setLoading(false)
      }
    }

    loadSellers()
  }, [])

  /* ================= LOAD ORDERS ================= */
  const loadOrders = async () => {
    try {

      const pendingRes = await fetch(
        "http://localhost:5000/orders/pending",
        { headers: getAuthHeaders() }
      )

      const historyRes = await fetch(
        "http://localhost:5000/orders/distributor",
        { headers: getAuthHeaders() }
      )

      if (pendingRes.status === 401 || historyRes.status === 401) {
        alert("Login expired. Please login again.")
        localStorage.removeItem("token")
        window.location.href = "/login"
        return
      }

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json()
        setPendingOrders(Array.isArray(pendingData) ? pendingData : [])
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setAllOrders(Array.isArray(historyData) ? historyData : [])
      }

    } catch (err) {
      console.error("Order loading error:", err)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  /* ================= CONFIRM ORDER ================= */
  const confirmOrder = async (id) => {
    try {

      const res = await fetch(
        `http://localhost:5000/orders/confirm/${id}`,
        {
          method: "PUT",
          headers: getAuthHeaders()
        }
      )

      if (res.status === 401) {
        alert("Login expired. Please login again.")
        localStorage.removeItem("token")
        window.location.href = "/login"
        return
      }

      if (!res.ok) return
      await loadOrders()

    } catch (err) {
      console.error("Confirm failed", err)
    }
  }

  /* ================= SELLERS ================= */
  const sellers = useMemo(() => {
    if (apiSellers.length > 0) return apiSellers

    return storeUsers.filter(
      u =>
        u.role === "seller" &&
        String(u.parentId) === String(user.id || user._id)
    )
  }, [apiSellers, storeUsers, user])

  const customers = useMemo(
    () => storeUsers.filter(u => u.role === "customer"),
    [storeUsers]
  )

  const commissionRate = 0.05

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white p-4 rounded shadow">
        <h1 className="text-2xl font-bold">My Company</h1>
        <p className="text-gray-600">
          Distributor: <span className="font-semibold">{user.name}</span>
        </p>
      </div>

      {/* STATS */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Sellers" value={sellers.length} />
        <StatsCard title="Total Customers" value={customers.length} />
        <StatsCard title="Products" value={products.length} />
        <StatsCard title="Commission Rate" value={`${commissionRate * 100}%`} />
      </div>

      {/* PENDING ORDERS FULL DETAIL */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-3">Pending Orders</h2>

        {pendingOrders.length === 0 ? (
          <p className="text-gray-500">No pending orders</p>
        ) : (
          pendingOrders.map(order => (
            <div key={order._id} className="border p-4 mb-3 rounded">

              <p><strong>Seller:</strong> {order.sellerId?.name}</p>
              <p><strong>Customer:</strong> {order.customerName}</p>
              <p><strong>Phone:</strong> {order.phone}</p>
              <p><strong>Address:</strong> {order.address}</p>

              <div className="mt-2">
                <strong>Products:</strong>
                {order.items?.map((item, i) => (
                  <div key={i} className="ml-3 text-sm">
                    • {item.title} × {item.qty} (₹{item.price})
                  </div>
                ))}
              </div>

              <p className="mt-2"><strong>Total:</strong> ₹{order.total}</p>

              <button
                onClick={() => confirmOrder(order._id)}
                className="mt-3 bg-green-600 text-white px-3 py-1 rounded"
              >
                Confirm Order
              </button>

            </div>
          ))
        )}
      </div>

      {/* FULL ORDER HISTORY */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-3">Order History</h2>

        {allOrders.length === 0 ? (
          <p className="text-gray-500">No order history</p>
        ) : (
          allOrders.map(order => (
            <div key={order._id} className="border p-4 mb-3 rounded">

              <p><strong>Seller:</strong> {order.sellerId?.name}</p>
              <p><strong>Customer:</strong> {order.customerName}</p>
              <p><strong>Phone:</strong> {order.phone}</p>
              <p><strong>Address:</strong> {order.address}</p>

              <div className="mt-2">
                <strong>Products:</strong>
                {order.items?.map((item, i) => (
                  <div key={i} className="ml-3 text-sm">
                    • {item.title} × {item.qty}
                  </div>
                ))}
              </div>

              <p className="mt-2"><strong>Total:</strong> ₹{order.total}</p>

              <p>
                <strong>Status:</strong>{" "}
                <span className={
                  order.status === "confirmed"
                    ? "text-green-600 font-semibold"
                    : order.status === "rejected"
                    ? "text-red-600 font-semibold"
                    : "text-yellow-600 font-semibold"
                }>
                  {order.status}
                </span>
              </p>

              <p className="text-xs text-gray-500">
                {new Date(order.createdAt).toLocaleString()}
              </p>

            </div>
          ))
        )}
      </div>

      {/* SELLERS */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-3">My Sellers</h2>

        {loading ? (
          <p className="text-gray-500">Loading sellers...</p>
        ) : sellers.length === 0 ? (
          <p className="text-gray-500">No sellers added yet</p>
        ) : (
          sellers.map(s => (
            <div
              key={s._id || s.id}
              onClick={() => setSelectedSeller(s)}
              className="border-b py-2 cursor-pointer hover:bg-gray-50"
            >
              {s.name}
            </div>
          ))
        )}
      </div>

      {/* ANALYTICS */}
      {selectedSeller && (
        <div className="bg-white p-4 rounded shadow">
          <UserAnalytics
            user={{
              id: selectedSeller._id || selectedSeller.id,
              name: selectedSeller.name,
              role: "seller"
            }}
          />
        </div>
      )}

    </div>
  )
}