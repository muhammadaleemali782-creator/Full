import { useEffect, useState } from "react"

export default function DistributorOrders() {
  const [pendingOrders, setPendingOrders] = useState([])
  const [allOrders,     setAllOrders]     = useState([])
  const [activeTab,     setActiveTab]     = useState("pending")
  const [loading,       setLoading]       = useState(true)
  const [actionId,      setActionId]      = useState(null)
  const [actionType,    setActionType]    = useState(null) // "approve" | "reject"
  const [note,          setNote]          = useState("")
  const [showToSeller,  setShowToSeller]  = useState(false)
  const [msg,           setMsg]           = useState("")

  const token = localStorage.getItem("token")

  const load = async () => {
    try {
      setLoading(true)

      const pRes = await fetch("http://localhost:5000/orders/pending", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPendingOrders(Array.isArray(await pRes.json()) ? await pRes.clone().json() : [])

      const aRes = await fetch("http://localhost:5000/orders/distributor/all", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const aData = await aRes.json()
      setAllOrders(Array.isArray(aData) ? aData : [])

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // fix: double json parse issue
  const loadFixed = async () => {
    try {
      setLoading(true)

      const [pRes, aRes] = await Promise.all([
        fetch("http://localhost:5000/orders/pending",        { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:5000/orders/distributor/all", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const [pData, aData] = await Promise.all([pRes.json(), aRes.json()])
      setPendingOrders(Array.isArray(pData) ? pData : [])
      setAllOrders(Array.isArray(aData) ? aData : [])

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFixed() }, [])

  const handleAction = async () => {
    try {
      setMsg("")
      const endpoint = actionType === "approve"
        ? `http://localhost:5000/orders/approve/${actionId}`
        : `http://localhost:5000/orders/reject/${actionId}`

      const res  = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note, showNoteToSeller: showToSeller })
      })
      const data = await res.json()

      if (!res.ok) { setMsg("❌ " + (data.msg || "Failed")); return }

      setMsg(actionType === "approve"
        ? "✅ Approved! Admin ke paas bhej diya"
        : "❌ Order reject kar diya"
      )
      setActionId(null); setNote(""); setActionType(null); setShowToSeller(false)
      loadFixed()
    } catch (err) {
      setMsg("❌ " + err.message)
    }
  }

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN")

  const StatusBadge = ({ status, rejectedBy }) => {
    const cfg = {
      pending:              "bg-yellow-100 text-yellow-700",
      seller_approved:      "bg-orange-100 text-orange-700",
      distributor_approved: "bg-blue-100 text-blue-700",
      confirmed:            "bg-green-100 text-green-700",
      rejected:             "bg-red-100 text-red-700",
    }
    const labels = {
      pending:              "⏳ Pending",
      seller_approved:      "👤 Seller Approved",
      distributor_approved: "🔵 Sent to Admin",
      confirmed:            "✅ Confirmed",
      rejected:             `❌ Rejected${rejectedBy ? ` by ${rejectedBy}` : ""}`,
    }
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg[status] || "bg-gray-100 text-gray-600"}`}>
        {labels[status] || status}
      </span>
    )
  }

  const OrderCard = ({ order, showActions }) => (
    <div className="bg-white rounded-xl shadow p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-mono text-xs text-gray-400">#{order._id.slice(-6)}</p>
          <p className="font-bold text-lg">₹{fmt(order.total)}</p>
          <p className="text-sm font-medium">{order.sellerId?.name || "-"}</p>
          <p className="text-xs text-gray-400">{order.sellerId?.role}</p>
        </div>
        <div className="text-right space-y-1">
          <StatusBadge status={order.status} rejectedBy={order.rejectedBy} />
          <p className="text-xs text-gray-400 block">
            {new Date(order.createdAt).toLocaleDateString("en-IN")}
          </p>
        </div>
      </div>

      {order.customerName && (
        <div className="text-sm text-gray-600">
          👤 {order.customerName} · {order.phone}
        </div>
      )}

      {/* ⭐ On behalf of attribution */}
      {order.onBehalfOfName && (
        <div style={{ padding:"5px 10px", background:"#fffbeb", borderRadius:7, border:"1px solid #fcd34d", fontSize:11, color:"#92400e" }}>
          📋 <strong>{order.placedByName}</strong> ({order.placedByRole}) ne <strong>{order.onBehalfOfName}</strong> ({order.onBehalfOfRole}) ke liye lagaya
        </div>
      )}

      {order.items?.length > 0 && (
        <div className="border-t pt-2 space-y-1">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-gray-600">
              <span>{item.title || item.name} × {item.qty || item.quantity || 1}</span>
              <span>₹{fmt((item.price || 0) * (item.qty || item.quantity || 1))}</span>
            </div>
          ))}
        </div>
      )}

      {/* My note (always visible to distributor) */}
      {order.distributorNote && (
        <div className="bg-blue-50 text-blue-700 rounded p-2 text-xs">
          📝 Mera Note: {order.distributorNote}
          <span className={`ml-2 font-medium ${order.distributorNoteVisible ? "text-green-600" : "text-gray-400"}`}>
            {order.distributorNoteVisible ? "✅ Seller dekh sakta hai" : "🔒 Seller nahi dekh sakta"}
          </span>
        </div>
      )}

      {/* Admin note if any */}
      {order.adminNote && (
        <div className="bg-purple-50 text-purple-700 rounded p-2 text-xs">
          📝 Admin Note: {order.adminNote}
        </div>
      )}

      {order.status === "distributor_approved" && (
        <div className="text-xs text-blue-600 bg-blue-50 rounded p-2">
          ⏳ Admin ke paas approval ke liye bheja gaya
        </div>
      )}

      {showActions && order.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => { setActionId(order._id); setActionType("approve"); setNote(""); setShowToSeller(false) }}
            className="flex-1 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            ✅ Approve
          </button>
          <button
            onClick={() => { setActionId(order._id); setActionType("reject"); setNote(""); setShowToSeller(false) }}
            className="flex-1 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            ❌ Reject
          </button>
        </div>
      )}
    </div>
  )

  if (loading) return <div className="p-6 text-gray-400 animate-pulse">Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📦 Orders</h1>

      {msg && (
        <div className={`p-3 rounded text-sm font-medium ${
          msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500">⏳ Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{pendingOrders.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500">🔵 With Admin</p>
          <p className="text-2xl font-bold text-blue-700">
            {allOrders.filter(o => o.status === "distributor_approved").length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500">✅ Confirmed</p>
          <p className="text-2xl font-bold text-green-700">
            {allOrders.filter(o => o.status === "confirmed").length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pending" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
          }`}
        >
          ⏳ Pending ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "all" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"
          }`}
        >
          📋 All Orders ({allOrders.length})
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="space-y-3">
          {pendingOrders.length === 0
            ? <div className="text-gray-400 text-center py-8">Koi pending order nahi</div>
            : pendingOrders.map(o => <OrderCard key={o._id} order={o} showActions={true} />)
          }
        </div>
      )}

      {activeTab === "all" && (
        <div className="space-y-3">
          {allOrders.length === 0
            ? <div className="text-gray-400 text-center py-8">Koi order nahi</div>
            : allOrders.map(o => <OrderCard key={o._id} order={o} showActions={false} />)
          }
        </div>
      )}

      {/* ── Action Modal ── */}
      {actionId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <h3 className="font-bold text-lg">
              {actionType === "approve" ? "✅ Order Approve Karo" : "❌ Order Reject Karo"}
            </h3>

            {/* Note */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                📝 Note likho (kyun {actionType === "approve" ? "approve" : "reject"} kar rahe ho)
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
                showToSeller
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-gray-50"
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
                  actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
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
