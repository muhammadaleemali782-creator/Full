import { useState, useEffect, useMemo } from "react"
import { useStore } from "../context/StoreContext"
import { useAuth } from "../context/AuthContext"

/* ── Role config ── */
const RC = {
  admin:       { bg:"#f5f3ff", border:"#7c3aed", dot:"#7c3aed", icon:"👑", label:"Admin" },
  distributor: { bg:"#f0fdf4", border:"#16a34a", dot:"#16a34a", icon:"🏢", label:"Distributor" },
  seller:      { bg:"#eff6ff", border:"#3b82f6", dot:"#3b82f6", icon:"🛒", label:"Seller" },
  user:        { bg:"#f8fafc", border:"#94a3b8", dot:"#94a3b8", icon:"👤", label:"User" },
}
const getRC = (role) => RC[role] || RC.user
const ROLE_SORT = { distributor:0, seller:1, user:2, admin:3 }

/* ── Level Badge ── */
function LevelBadge({ level }) {
  const cfgs = [null,
    { bg:"#fef9c3", color:"#92400e", label:"L1" },
    { bg:"#dcfce7", color:"#166534", label:"L2" },
    { bg:"#dbeafe", color:"#1e40af", label:"L3" },
    { bg:"#fce7f3", color:"#9d174d", label:"L4" },
  ]
  const c = cfgs[level] || { bg:"#f1f5f9", color:"#475569", label:`L${level}` }
  return <span style={{ fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:99, background:c.bg, color:c.color, border:`1px solid ${c.color}22` }}>{c.label}</span>
}

/* ── Network picker ── */
function NetworkPicker({ downline, selected, onSelect }) {
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  const tabs = useMemo(() => {
    const roles = [...new Set(downline.map(d => d.role))]
      .sort((a,b) => (ROLE_SORT[a]??9)-(ROLE_SORT[b]??9))
    return [{ key:"all", label:"Sabhi", count: downline.length },
      ...roles.map(r => ({ key:r, label: getRC(r).label+"s", count: downline.filter(d=>d.role===r).length }))
    ]
  }, [downline])

  const shown = useMemo(() => {
    const q = search.toLowerCase()
    return downline
      .filter(d => (filter==="all" || d.role===filter) && (!q || d.name.toLowerCase().includes(q)))
      .sort((a,b) => (ROLE_SORT[a.role]??9)-(ROLE_SORT[b.role]??9) || a.level-b.level)
  }, [downline, filter, search])

  if (downline.length === 0) {
    return <div style={{ padding:"16px", textAlign:"center", color:"#94a3b8", fontSize:13 }}>Aapke neeche koi user nahi hai</div>
  }

  return (
    <div>
      {/* Search */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0", marginBottom:10 }}>
        <span style={{ color:"#94a3b8" }}>🔍</span>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search by name..."
          style={{ flex:1, border:"none", outline:"none", background:"transparent", fontSize:13, color:"#334155" }}
        />
        {search && <button onClick={()=>setSearch("")} style={{ border:"none", background:"none", cursor:"pointer", color:"#94a3b8", fontSize:12 }}>✕</button>}
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
        {tabs.map(tab => {
          const isA = filter===tab.key
          const dot = tab.key==="all" ? "#64748b" : getRC(tab.key).dot
          return (
            <button key={tab.key} onClick={()=>setFilter(tab.key)}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:99, fontSize:12, fontWeight: isA?700:500, cursor:"pointer",
                border:`1.5px solid ${isA ? dot : "#e2e8f0"}`,
                background: isA ? `${dot}12` : "#fff", color: isA ? dot : "#64748b",
                boxShadow: isA ? `0 0 0 2px ${dot}22` : "none" }}
            >
              {tab.key!=="all" && <span style={{ width:7, height:7, borderRadius:"50%", background: isA?dot:"#94a3b8", display:"inline-block" }} />}
              {tab.label}
              <span style={{ fontSize:10, fontWeight:700, padding:"0 5px", borderRadius:99, background: isA?`${dot}20`:"#f1f5f9", color: isA?dot:"#94a3b8" }}>{tab.count}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      <div style={{ maxHeight:260, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
        {/* None option */}
        <div onClick={()=>onSelect(null)}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:9, cursor:"pointer",
            border:`1.5px solid ${!selected ? "#3b82f6" : "#e2e8f0"}`,
            background: !selected ? "#eff6ff" : "#fff" }}
        >
          <span style={{ fontSize:16 }}>🧑‍💼</span>
          <span style={{ fontSize:13, fontWeight:600, color: !selected?"#1d4ed8":"#334155", flex:1 }}>Khud ke liye (apni ID se)</span>
          {!selected && <span style={{ fontSize:10, color:"#3b82f6", fontWeight:700 }}>✓ Selected</span>}
        </div>

        {shown.map(d => {
          const c = getRC(d.role)
          const isSel = selected?._id === d._id
          return (
            <div key={d._id} onClick={()=>onSelect(d)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:9, cursor:"pointer", transition:"all 0.12s",
                border:`1.5px solid ${isSel ? c.border : "#e2e8f0"}`,
                background: isSel ? c.bg : "#fff",
                paddingLeft: 12 + (d.level-1)*14 }}
            >
              {/* Level indent line */}
              {d.level > 1 && <span style={{ color:"#e2e8f0", fontSize:12 }}>└</span>}
              <span style={{ fontSize:13 }}>{c.icon}</span>
              <span style={{ fontSize:13, fontWeight:600, color: isSel?c.text:"#334155", flex:1 }}>{d.name}</span>
              <LevelBadge level={d.level} />
              <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:`${c.dot}15`, color:c.dot, border:`1px solid ${c.dot}30` }}>{c.label}</span>
              {isSel && <span style={{ fontSize:11, color:c.dot, fontWeight:700 }}>✓</span>}
            </div>
          )
        })}

        {shown.length === 0 && (
          <div style={{ textAlign:"center", padding:"16px", color:"#94a3b8", fontSize:12 }}>Koi nahi mila</div>
        )}
      </div>
    </div>
  )
}

/* ── Main Checkout ── */
export default function Checkout({ setPage }) {
  const { cart, clearCart } = useStore()
  const { user } = useAuth() || {}

  const [name,    setName]    = useState("")
  const [phone,   setPhone]   = useState("")
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)

  // On behalf of
  const canPlaceOnBehalf = user?.role === "seller" || user?.role === "distributor"
  const [showPicker,    setShowPicker]    = useState(false)
  const [onBehalfOf,    setOnBehalfOf]    = useState(null) // selected user object
  const [downline,      setDownline]      = useState([])
  const [downlineLoading, setDownlineLoading] = useState(false)

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  /* Load downline when picker opens */
  useEffect(() => {
    if (!showPicker || !canPlaceOnBehalf || downline.length > 0) return
    const load = async () => {
      try {
        setDownlineLoading(true)
        const token = localStorage.getItem("token")
        const res = await fetch("http://localhost:5000/users/my-downline", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setDownline(Array.isArray(data.downline) ? data.downline : [])
      } catch (err) {
        console.error("Downline load error:", err)
      } finally {
        setDownlineLoading(false)
      }
    }
    load()
  }, [showPicker, canPlaceOnBehalf])

  const placeOrder = async () => {
    if (!name || !phone || !address) { alert("Sab fields fill karo"); return }
    if (!cart || cart.length === 0) { alert("Cart empty hai"); return }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const backendItems = cart.map(i => ({
        productId:   i.productId || i._id || i.id,
        productName: i.productName || i.title,
        price:       Number(i.price),
        qty:         Number(i.qty),
        total:       Number(i.price) * Number(i.qty)
      }))

      const payload = {
        customerName: name,
        phone,
        address,
        items: backendItems,
        total,
        ...(onBehalfOf ? { onBehalfOfId: onBehalfOf._id } : {})
      }

      const res = await fetch("http://localhost:5000/orders", {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) { alert(data.message || "Order failed"); return }

      clearCart()
      setPage("orders")
    } catch (err) {
      alert("Order place karne mein error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth:520, margin:"0 auto", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:14, boxShadow:"0 4px 24px rgba(0,0,0,0.08)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"16px 20px", background:"linear-gradient(135deg,#f8fafc,#f0f4ff)", borderBottom:"1px solid #e8eef4" }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:"#1e293b", margin:0 }}>🛒 Checkout</h2>
          <p style={{ fontSize:12, color:"#94a3b8", margin:"4px 0 0" }}>{cart.length} item{cart.length!==1?"s":""} · ₹{total.toLocaleString()}</p>
        </div>

        <div style={{ padding:"20px" }}>

          {/* ⭐ ON BEHALF OF SECTION */}
          {canPlaceOnBehalf && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>👥 Kiske liye order hai?</div>
                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Apne network ke kisi member ke liye bhi order laga sakte ho</div>
                </div>
                <button onClick={()=>setShowPicker(p=>!p)}
                  style={{ fontSize:12, padding:"6px 14px", borderRadius:8, border:"1.5px solid #3b82f6", background: showPicker?"#3b82f6":"#eff6ff", color: showPicker?"#fff":"#1d4ed8", fontWeight:700, cursor:"pointer" }}>
                  {showPicker ? "✕ Band karo" : "🔍 Select karo"}
                </button>
              </div>

              {/* Selected person badge */}
              {onBehalfOf ? (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background: getRC(onBehalfOf.role).bg, border:`2px solid ${getRC(onBehalfOf.role).border}` }}>
                  <span style={{ fontSize:18 }}>{getRC(onBehalfOf.role).icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color: getRC(onBehalfOf.role).text }}>{onBehalfOf.name}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>Yeh order <strong>{onBehalfOf.name}</strong> ki ID se lagega</div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:`${getRC(onBehalfOf.role).dot}20`, color:getRC(onBehalfOf.role).dot }}>{getRC(onBehalfOf.role).label}</span>
                  <button onClick={()=>setOnBehalfOf(null)} style={{ border:"none", background:"none", cursor:"pointer", color:"#94a3b8", fontSize:14, fontWeight:700 }}>✕</button>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:10, background:"#f8fafc", border:"1.5px solid #e2e8f0" }}>
                  <span>🧑‍💼</span>
                  <span style={{ fontSize:12, color:"#64748b" }}>Khud ke liye order (apni ID se)</span>
                </div>
              )}

              {/* Picker */}
              {showPicker && (
                <div style={{ marginTop:10, padding:"14px", background:"#f8fafc", borderRadius:12, border:"1px solid #e2e8f0" }}>
                  {downlineLoading ? (
                    <div style={{ textAlign:"center", padding:"20px", color:"#94a3b8", fontSize:13 }}>⏳ Loading network...</div>
                  ) : (
                    <NetworkPicker
                      downline={downline}
                      selected={onBehalfOf}
                      onSelect={(u) => { setOnBehalfOf(u); setShowPicker(false) }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Customer Details */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", marginBottom:10 }}>📋 Customer Details</div>
            {[
              { val:name,    set:setName,    ph:"Full Name *",        type:"text" },
              { val:phone,   set:setPhone,   ph:"Phone Number *",     type:"tel" },
            ].map((f,i) => (
              <input key={i} type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                style={{ display:"block", width:"100%", padding:"10px 14px", borderRadius:9, border:"1.5px solid #e2e8f0", background:"#f8fafc", fontSize:13, color:"#334155", marginBottom:8, boxSizing:"border-box", outline:"none" }}
                onFocus={e=>e.target.style.borderColor="#3b82f6"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}
              />
            ))}
            <textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="Full Address *" rows={3}
              style={{ display:"block", width:"100%", padding:"10px 14px", borderRadius:9, border:"1.5px solid #e2e8f0", background:"#f8fafc", fontSize:13, color:"#334155", resize:"vertical", boxSizing:"border-box", outline:"none", fontFamily:"inherit" }}
              onFocus={e=>e.target.style.borderColor="#3b82f6"}
              onBlur={e=>e.target.style.borderColor="#e2e8f0"}
            />
          </div>

          {/* Order Summary */}
          <div style={{ background:"#f8fafc", borderRadius:10, padding:"14px", marginBottom:20, border:"1px solid #e8eef4" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:8 }}>📦 Order Summary</div>
            {cart.map((item,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748b", marginBottom:4 }}>
                <span>{item.productName||item.title} × {item.qty}</span>
                <span style={{ fontWeight:600, color:"#334155" }}>₹{(item.price*item.qty).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ borderTop:"1px solid #e2e8f0", marginTop:8, paddingTop:8, display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontWeight:700, color:"#1e293b" }}>Total</span>
              <span style={{ fontWeight:800, fontSize:16, color:"#16a34a" }}>₹{total.toLocaleString()}</span>
            </div>

            {/* Attribution notice */}
            {onBehalfOf && (
              <div style={{ marginTop:10, padding:"8px 12px", background:"#fffbeb", borderRadius:8, border:"1px solid #fcd34d", fontSize:11, color:"#92400e" }}>
                ⚠️ Yeh order <strong>{user?.name || "aap"}</strong> ({user?.role}) ne <strong>{onBehalfOf.name}</strong> ({onBehalfOf.role}) ki taraf se lagaya hai
              </div>
            )}
          </div>

          {/* Place Order Button */}
          <button onClick={placeOrder} disabled={loading}
            style={{ width:"100%", padding:"14px", borderRadius:10, border:"none", background: loading?"#94a3b8":"linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", fontSize:15, fontWeight:800, cursor: loading?"not-allowed":"pointer", boxShadow:"0 4px 12px #16a34a40", transition:"all 0.15s" }}>
            {loading ? "⏳ Order place ho raha hai..." : `✅ Place Order — ₹${total.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  )
}
