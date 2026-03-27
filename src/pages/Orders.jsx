import { useEffect, useState } from "react"
import { useStore } from "../context/StoreContext"

export default function Orders() {
  const { deleteOrder, printInvoice } = useStore()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  /* ================= FETCH FROM BACKEND ================= */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token")

        console.log("🔥 TOKEN =", token)

        if (!token) {
          console.log("❌ No token → user not logged in")
          return
        }

        console.log("📥 Fetching orders from backend...")

        const res = await fetch(
          "http://localhost:5000/orders/mine",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        )

        console.log("🌐 API STATUS =", res.status)

        if (!res.ok) {
          const txt = await res.text()
          console.error("❌ API ERROR:", txt)
          throw new Error("Failed to load orders")
        }

        const data = await res.json()

        console.log("✅ ORDERS FROM DB =", data)

        if (!Array.isArray(data)) {
          console.log("⚠️ Backend did not return array")
          setOrders([])
          return
        }

        // 🔥 Format backend orders to match old UI
        const formatted = data.map(o => ({
          id: o._id,
          name: o.customerName || "Customer",
          total: o.total || 0,
          date: o.createdAt ? new Date(o.createdAt).toLocaleString() : "-",
          status: o.status || "pending",
          items: o.items || [],
          // ⭐ On behalf of fields
          placedByName:   o.placedByName   || null,
          placedByRole:   o.placedByRole   || null,
          onBehalfOfName: o.onBehalfOfName || null,
          onBehalfOfRole: o.onBehalfOfRole || null,
        }))

        console.log("✅ FORMATTED ORDERS =", formatted)

        setOrders(formatted)

      } catch (err) {
        console.error("❌ Order fetch error:", err.message)

        // 🔥 Fallback to localStorage (legacy support)
        const localOrders =
          JSON.parse(localStorage.getItem("orders")) || []

        console.log("📦 Local orders fallback =", localOrders)

        setOrders(localOrders)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="bg-white p-6 rounded shadow text-center">
        <h2 className="font-bold text-xl">Loading Orders...</h2>
      </div>
    )
  }

  /* ================= EMPTY STATE ================= */
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white p-6 rounded shadow text-center">
        <h2 className="font-bold text-xl">No Orders Yet</h2>
        <p className="text-sm text-gray-500 mt-2">
          (Check backend logs if order create ho raha hai ya nahi)
        </p>
      </div>
    )
  }

  /* ================= UI ================= */
  return (
    <div style={{ background:"#fff", borderRadius:12, padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", fontFamily:"system-ui,sans-serif" }}>
      <h2 style={{ fontSize:17, fontWeight:800, color:"#1e293b", marginBottom:16 }}>📦 My Orders</h2>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {orders.map(o => (
          <div key={o.id} style={{ background:"#f8fafc", borderRadius:10, padding:"14px 16px", border:"1.5px solid #e8eef4", display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <b style={{ fontSize:14, color:"#1e293b" }}>{o.name}</b>
                <span style={{ fontSize:14, fontWeight:800, color:"#16a34a" }}>₹{Number(o.total).toLocaleString()}</span>
                <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:700,
                  background: o.status==="confirmed"?"#dcfce7":o.status==="rejected"?"#fee2e2":o.status==="pending"?"#fffbeb":"#e0e7ff",
                  color:      o.status==="confirmed"?"#15803d":o.status==="rejected"?"#dc2626":o.status==="pending"?"#92400e":"#3730a3"
                }}>{o.status}</span>
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>{o.date}</div>

              {/* ⭐ On behalf of attribution */}
              {o.onBehalfOfName && (
                <div style={{ marginTop:7, padding:"6px 10px", background:"#fffbeb", borderRadius:7, border:"1px solid #fcd34d", fontSize:11, color:"#92400e", lineHeight:1.5 }}>
                  📋 <strong>{o.placedByName}</strong> ({o.placedByRole}) ne <strong>{o.onBehalfOfName}</strong> ({o.onBehalfOfRole}) ke liye order lagaya
                </div>
              )}

              <button onClick={() => printInvoice?.(o)}
                style={{ marginTop:8, fontSize:11, color:"#3b82f6", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, padding:"4px 12px", cursor:"pointer", fontWeight:600 }}>
                📄 Invoice Download
              </button>
            </div>

            {deleteOrder && (
              <button onClick={() => deleteOrder(o.id)}
                style={{ width:28, height:28, borderRadius:"50%", border:"none", background:"#fee2e2", color:"#dc2626", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, flexShrink:0 }}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}