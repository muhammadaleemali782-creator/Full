import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"

const STATUS_CONFIG = {
  pending:              { label: "Pending",              color: "bg-yellow-100 text-yellow-700",  dot: "bg-yellow-400" },
  distributor_approved: { label: "Distributor Approved", color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"   },
  confirmed:            { label: "Confirmed",            color: "bg-green-100 text-green-700",   dot: "bg-green-500"  },
  rejected:             { label: "Rejected",             color: "bg-red-100 text-red-700",       dot: "bg-red-500"    },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export default function AdminOrders() {
  const { user } = useAuth()

  const [orders,             setOrders]             = useState([])
  const [loading,            setLoading]            = useState(true)
  const [filter,             setFilter]             = useState("distributor_approved")
  const [actionId,           setActionId]           = useState(null)
  const [note,               setNote]               = useState("")
  const [showToSeller,       setShowToSeller]       = useState(false)
  const [actionType,         setActionType]         = useState(null)
  const [msg,                setMsg]                = useState("")
  const [allCounts, setAllCounts] = useState({
    distributor_approved: 0, confirmed: 0, rejected: 0, pending: 0,
  })

  const token = localStorage.getItem("token")

  const loadCounts = async () => {
    try {
      const allRes  = await fetch("http://localhost:5000/orders/admin/all", { headers: { Authorization: `Bearer ${token}` } })
      const allData = await allRes.json()
      const all = Array.isArray(allData) ? allData : []
      setAllCounts({
        distributor_approved: all.filter(o => o.status === "distributor_approved").length,
        confirmed:            all.filter(o => o.status === "confirmed").length,
        rejected:             all.filter(o => o.status === "rejected").length,
        pending:              all.filter(o => o.status === "pending").length,
      })
    } catch {}
  }

  const load = async () => {
    try {
      setLoading(true)
      let url
      if (filter === "all") url = "http://localhost:5000/orders/admin/all"
      else                  url = `http://localhost:5000/orders/admin/all?status=${filter}`
      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // ✅ Hooks BEFORE early return (React rules)
  useEffect(() => { load() }, [filter])
  useEffect(() => { loadCounts() }, [])

  if (!user || user.role !== "admin") {
    return <div className="p-6 text-red-600">❌ Admin access only</div>
  }

  const handleAction = async () => {
    try {
      setMsg("")
      const endpoint = actionType === "confirm"
        ? `http://localhost:5000/orders/admin/confirm/${actionId}`
        : `http://localhost:5000/orders/admin/reject/${actionId}`

      const res  = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note, showNoteToSeller: showToSeller })
      })
      const data = await res.json()

      if (!res.ok) { setMsg("❌ " + (data.msg || "Failed")); return }

      setMsg(actionType === "confirm" ? "✅ Order confirmed!" : "❌ Order rejected!")
      setActionId(null); setNote(""); setActionType(null); setShowToSeller(false)
      load()
      loadCounts()
    } catch (err) {
      setMsg("❌ " + err.message)
    }
  }

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN")

  const FILTERS = [
    { key: "distributor_approved", label: "⏳ Admin Pending"  },
    { key: "confirmed",            label: "✅ Confirmed"       },
    { key: "rejected",             label: "❌ Rejected"        },
    { key: "pending",              label: "🔄 Dist. Pending"   },
    { key: "all",                  label: "📋 All Orders"      },
  ]

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-2xl font-bold">📦 Order Management</h1>
        <p className="text-gray-500 text-sm mt-1">2-level approval — User/Seller → Distributor → Admin</p>
      </div>

      {msg && (
        <div className={`p-3 rounded text-sm font-medium ${
          msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FILTERS.slice(0, 4).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`p-4 rounded-xl border text-left transition-all ${
              filter === f.key ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <p className="text-xs text-gray-500">{f.label}</p>
            <p className={`text-2xl font-bold mt-1 ${
              f.key === "distributor_approved" && (allCounts[f.key] ?? 0) > 0 ? "text-blue-600" :
              f.key === "pending"              && (allCounts[f.key] ?? 0) > 0 ? "text-yellow-600" :
              f.key === "rejected"             && (allCounts[f.key] ?? 0) > 0 ? "text-red-600" :
              f.key === "confirmed"            ? "text-green-600" : ""
            }`}>
              {allCounts[f.key] ?? 0}
            </p>
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
              filter === f.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-gray-400 animate-pulse">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400">Koi order nahi mila</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Seller</th>
                <th className="text-left px-4 py-3">Distributor</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Notes</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    #{order._id.slice(-6)}
                    <div className="text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-IN")}</div>
                  </td>
                  <td className="px-4 py-3">
                    {order.userId ? (
                      <>
                        <div className="font-medium text-indigo-700">{order.userId?.name || "-"}</div>
                        <div className="text-xs bg-indigo-50 text-indigo-400 px-1 rounded inline-block">user</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-300">—</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.sellerId?.name || order.nearestSellerId?.name || "-"}</div>
                    <div className="text-xs text-gray-400">{order.sellerId?.role}</div>

                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.distributorId?.name || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{order.customerName || "-"}</div>
                    <div className="text-xs text-gray-400">{order.phone}</div>
                    {order.onBehalfOfName && (
                      <div style={{ marginTop:3, padding:"2px 7px", background:"#fffbeb", borderRadius:5, border:"1px solid #fcd34d", fontSize:10, color:"#92400e" }}>
                        {order.placedByName} → {order.onBehalfOfName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    ₹{fmt(order.total)}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {order.distributorNote && (
                      <div className="text-xs bg-blue-50 text-blue-700 rounded p-1 mb-1">
                        📦 Dist: {order.distributorNote}
                        <span className={`ml-1 ${order.distributorNoteVisible ? "text-green-600" : "text-gray-400"}`}>
                          {order.distributorNoteVisible ? "👁️" : "🔒"}
                        </span>
                      </div>
                    )}
                    {order.adminNote && (
                      <div className="text-xs bg-purple-50 text-purple-700 rounded p-1">
                        👑 Admin: {order.adminNote}
                        <span className={`ml-1 ${order.adminNoteVisible ? "text-green-600" : "text-gray-400"}`}>
                          {order.adminNoteVisible ? "👁️" : "🔒"}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                    {order.rejectedBy && (
                      <div className="text-xs text-red-400 mt-1">by {order.rejectedBy}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {order.status === "distributor_approved" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setActionId(order._id); setActionType("confirm"); setNote(""); setShowToSeller(false) }}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => { setActionId(order._id); setActionType("reject"); setNote(""); setShowToSeller(false) }}
                          className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}
                    {order.status === "confirmed"            && <span className="text-xs text-green-600">✅ Done</span>}
                    {order.status === "rejected"             && <span className="text-xs text-red-500">❌ Rejected</span>}
                    {order.status === "pending" && order.userId  && <span className="text-xs text-orange-600">👤 With Seller</span>}
                    {order.status === "pending" && !order.userId && <span className="text-xs text-yellow-600">⏳ With Dist.</span>}
                    
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Action Modal ── */}
      {actionId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="font-bold text-lg">
              {actionType === "confirm" ? "✅ Order Confirm Karo" : "❌ Order Reject Karo"}
            </h3>

            {/* Note */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                📝 Note likho (kyun {actionType === "confirm" ? "approve" : "reject"} kar rahe ho)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Note likho yahan..."
                className="w-full border rounded p-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Visibility Toggle */}
            <div
              onClick={() => setShowToSeller(!showToSeller)}
              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                showToSeller ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div>
                <p className="text-sm font-medium">
                  {showToSeller ? "✅ Seller dekh sakta hai" : "🔒 Seller nahi dekh sakta"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Yeh note seller ko dikhana hai?
                </p>
              </div>
              <div className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${
                showToSeller ? "bg-green-500" : "bg-gray-300"
              }`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-all ${
                  showToSeller ? "translate-x-6" : "translate-x-0"
                }`} />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAction}
                className={`flex-1 py-2 text-white rounded font-medium ${
                  actionType === "confirm" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {actionType === "confirm" ? "Confirm" : "Reject"}
              </button>
              <button
                onClick={() => { setActionId(null); setNote(""); setActionType(null); setShowToSeller(false) }}
                className="flex-1 py-2 border rounded text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
