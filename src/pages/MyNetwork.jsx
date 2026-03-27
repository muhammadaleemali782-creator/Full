import { useEffect, useState, useMemo, useRef } from "react"
import { Tree, TreeNode } from "react-organizational-chart"
import { useAuth } from "../context/AuthContext"
import { getRoleLabel, getRoleLabelPlural } from "../utils/roleLabels"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

/* ─── helpers ─── */
function collectAllNodes(node, result = []) {
  if (!node) return result
  result.push({ id: node.id || node._id || "", name: node.name || "Unnamed", role: node.role || "user" })
  if (Array.isArray(node.children)) node.children.forEach((c) => collectAllNodes(c, result))
  return result
}

function findNodeById(node, targetId) {
  if (!node) return null
  if (String(node.id || node._id) === String(targetId)) return node
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findNodeById(child, targetId)
      if (found) return found
    }
  }
  return null
}

function filterTopByRole(node, role) {
  if (!node) return null
  return { ...node, children: (node.children || []).filter(c => c.role === role) }
}

const ROLE_SORT  = { distributor: 0, seller: 1, user: 2, admin: 3 }
const ROLE_ORDER = { admin: 0, distributor: 1, seller: 2, user: 3 }

const RC = {
  admin:       { bg: "#f5f3ff", border: "#7c3aed", text: "#5b21b6", dot: "#7c3aed", icon: "👑", label: "Admin" },
  distributor: { bg: "#f0fdf4", border: "#16a34a", text: "#15803d", dot: "#16a34a", icon: "🏢", label: "Distributor" },
  seller:      { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8", dot: "#3b82f6", icon: "🛒", label: "Seller" },
  user:        { bg: "#f8fafc", border: "#94a3b8", text: "#475569", dot: "#94a3b8", icon: "👤", label: "User" },
}
const getRC   = (role) => RC[role] || RC.user
const sortKids = (arr) => [...(arr||[])].sort((a,b) => (ROLE_SORT[a.role]??9)-(ROLE_SORT[b.role]??9))
const rc      = (role) => getRC(role)

/* ─── Level Badge ─── */
function LevelBadge({ level }) {
  const configs = [null,
    { bg: "#fef9c3", color: "#92400e", label: "L1 • Commission" },
    { bg: "#dcfce7", color: "#166534", label: "L2 • Commission" },
    { bg: "#dbeafe", color: "#1e40af", label: "L3 • Commission" },
    { bg: "#fce7f3", color: "#9d174d", label: "L4 • Coins" },
  ]
  const cfg = configs[level] || { bg: "#f1f5f9", color: "#475569", label: `L${level} • Coins` }
  return <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:99, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}22`, whiteSpace:"nowrap" }}>{cfg.label}</span>
}

/* ── Mini Analytics Popup ── */
function MiniAnalytics({ userId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`http://localhost:5000/analytics/user/${userId}?range=lifetime`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setData(await res.json())
      } catch { setData(null) }
      finally { setLoading(false) }
    }
    load()
  }, [userId])

  const timeline = data?.timeline?.length ? data.timeline : Array.from({length:7},(_,i)=>({label:`D${i+1}`,total:0}))

  return (
    <div style={{ marginLeft:26, marginBottom:6, marginTop:2, background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0", padding:"12px 14px" }}>
      {loading ? (
        <div style={{ textAlign:"center", padding:"16px", color:"#94a3b8", fontSize:12 }}>⏳ Loading...</div>
      ) : !data ? (
        <div style={{ textAlign:"center", padding:"16px", color:"#94a3b8", fontSize:12 }}>Koi data nahi</div>
      ) : (
        <>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:6 }}>
            <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", fontSize:12, color:"#94a3b8", fontWeight:700 }}>✕ band karo</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
            {[
              { label:"Orders",    val: data.ordersCount??0,                              color:"#1d4ed8", bg:"#eff6ff" },
              { label:"Sales",     val:`₹${Number(data.totalSales??0).toLocaleString()}`, color:"#15803d", bg:"#f0fdf4" },
              { label:"Connected", val: data.subUsersCount??0,                            color:"#7c3aed", bg:"#faf5ff" },
              { label:"Products",  val: data.assignedProducts?.length??0,                 color:"#b45309", bg:"#fffbeb" },
            ].map((s,i) => (
              <div key={i} style={{ background:s.bg, borderRadius:8, padding:"7px 10px" }}>
                <div style={{ fontSize:9, color:"#64748b", fontWeight:600 }}>{s.label}</div>
                <div style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ height:70 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize:7 }} />
                <YAxis tick={{ fontSize:7 }} width={20} />
                <Tooltip contentStyle={{ fontSize:10, borderRadius:6, padding:"3px 8px" }} />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

function SubTreeNode({ node, depth = 0, isLast = false, level = 1, hideIfNotUser = false }) {
  const [open,        setOpen]        = useState(false)
  const [showMini,    setShowMini]    = useState(false)
  const children  = sortKids(node.children)
  const hasKids   = children.length > 0
  const c         = getRC(node.role)
  const isHidden = hideIfNotUser && node.role !== "user" && node._hideSelf

  const summary = hasKids && !open ? (() => {
    const cnt = {}
    children.forEach(ch => { cnt[ch.role] = (cnt[ch.role]||0)+1 })
    return Object.entries(cnt).map(([r,n]) => `${n} ${getRC(r).label}${n>1?"s":""}`).join(", ")
  })() : ""

  if (isHidden) {
    return (
      <div>
        {children.map((child, i) => (
          <SubTreeNode key={child.id||child._id||i} node={child} depth={depth} isLast={i===children.length-1} level={level} hideIfNotUser={hideIfNotUser} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ position:"relative" }}>
      {depth > 0 && (
        <>
          <div style={{ position:"absolute", left:-17, top:0, bottom:isLast?"50%":0, width:2, background:"#e2e8f0" }} />
          <div style={{ position:"absolute", left:-17, top:18, width:14, height:2, background:"#e2e8f0" }} />
        </>
      )}
      <div onClick={() => hasKids && setOpen(p => !p)}
        style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 10px", marginBottom:3, borderRadius:9, background:open&&hasKids?c.bg:"#fff", border:`1.5px solid ${open&&hasKids?c.border:"#e8eef4"}`, cursor:hasKids?"pointer":"default", userSelect:"none", transition:"all 0.12s", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}
        onMouseEnter={e => { if(hasKids) e.currentTarget.style.borderColor=c.border }}
        onMouseLeave={e => { if(hasKids&&!(open&&hasKids)) e.currentTarget.style.borderColor="#e8eef4" }}
      >
        <div style={{ width:18, height:18, borderRadius:5, background:hasKids?(open?c.dot:"#e2e8f0"):"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {hasKids && <span style={{ fontSize:8, color:open?"#fff":"#94a3b8", fontWeight:700 }}>{open?"▼":"▶"}</span>}
        </div>
        <span style={{ fontSize:13 }}>{c.icon}</span>
        <span style={{ fontSize:13, fontWeight:600, color:"#1e293b", flex:1 }}>{node.name}</span>
        <LevelBadge level={level} />
        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:`${c.dot}15`, color:c.dot, border:`1px solid ${c.dot}30` }}>{c.label}</span>
        {summary && <span style={{ fontSize:10, color:"#94a3b8", whiteSpace:"nowrap" }}>({summary})</span>}
        {node.isBlocked && <span title="Blocked" style={{ fontSize:11 }}>🚫</span>}
        <span
          onClick={e => { e.stopPropagation(); setShowMini(p => !p) }}
          title="Analytics dekhne ke liye click karo"
          style={{ fontSize:11, padding:"1px 6px", borderRadius:99, background:"#f1f5f9", color:"#94a3b8", cursor:"pointer", userSelect:"none", flexShrink:0 }}
        >📊</span>
      </div>

      {showMini && (
        <MiniAnalytics userId={node.id||node._id} onClose={() => setShowMini(false)} />
      )}

      {open && hasKids && (
        <div style={{ paddingLeft:28, position:"relative" }}>
          {children.map((child,i) => <SubTreeNode key={child.id||child._id||i} node={child} depth={depth+1} isLast={i===children.length-1} level={level+1} hideIfNotUser={hideIfNotUser} />)}
        </div>
      )}
    </div>
  )
}

/* ─── ConnectedUsers Panel ─── */
function ConnectedUsers({ subtree }) {
  const [collapsed,    setCollapsed]    = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")
  const [search,       setSearch]       = useState("")
  const rawChildren = sortKids(subtree?.children || [])
  const distCount   = rawChildren.filter(c => c.role === "distributor").length
  const sellerCount = rawChildren.filter(c => c.role === "seller").length
  const userCount   = rawChildren.filter(c => c.role === "user").length

  const allDescendants = useMemo(() => {
    const list = []
    rawChildren.forEach(c => collectAllNodes(c, list))
    return list
  }, [rawChildren])
  const totalUserCount = allDescendants.filter(n => n.role === "user").length
  const total = useMemo(() => { const list = []; rawChildren.forEach(c => collectAllNodes(c, list)); return list.length }, [rawChildren])

  const usersOnlyTree = (() => {
    const buildUserTree = (node) => {
      if (!node) return null
      const userKids = (node.children || []).map(buildUserTree).filter(Boolean)
      if (node.role === "user") return { ...node, children: userKids }
      if (userKids.length > 0) return { ...node, _hideSelf: true, children: userKids }
      return null
    }
    return rawChildren.map(buildUserTree).filter(Boolean)
  })()

  const filtered = activeFilter === "all"
    ? rawChildren
    : activeFilter === "user"
      ? usersOnlyTree
      : rawChildren.filter(c => c.role === activeFilter)

  const searchedFiltered = useMemo(() => {
    if (!search.trim()) return filtered
    const q = search.toLowerCase()
    const searchTree = (node) => {
      if (!node) return null
      const match = (node.name||"").toLowerCase().includes(q)
      const kids = (node.children||[]).map(searchTree).filter(Boolean)
      if (match || kids.length > 0) return { ...node, children: kids }
      return null
    }
    return filtered.map(searchTree).filter(Boolean)
  }, [filtered, search])

  const tabs = [
    { key:"all", label:"All", count:rawChildren.length, dot:null },
    distCount   > 0 && { key:"distributor", label:"Distributors", count:distCount,      dot:RC.distributor.dot },
    sellerCount > 0 && { key:"seller",      label:"Sellers",      count:sellerCount,    dot:RC.seller.dot },
                        { key:"user",        label:"Users",        count:totalUserCount, dot:RC.user.dot },
  ].filter(Boolean)

  if (rawChildren.length === 0) return <div style={{ padding:"20px", textAlign:"center", color:"#94a3b8", fontSize:13, background:"#f8fafc", borderRadius:12, border:"1px dashed #e2e8f0" }}>Aapke neeche koi connected user nahi hai</div>
  return (
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e8eef4", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", borderBottom:"1px solid #f1f5f9", background:"#fafbfc" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"#1e293b" }}>👥 Connected Users</span>
          <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:99, background:"#e0e7ff", color:"#4338ca" }}>{total} total</span>
          <span style={{ fontSize:11, fontWeight:600, padding:"2px 9px", borderRadius:99, background:"#f0fdf4", color:"#16a34a" }}>{rawChildren.length} direct</span>
        </div>
        <button onClick={() => setCollapsed(p => !p)} style={{ fontSize:11, padding:"4px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b", cursor:"pointer", fontWeight:600 }}>
          {collapsed ? "▼ Show" : "▲ Collapse"}
        </button>
      </div>
      {!collapsed && (
        <div style={{ padding:"14px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12, flexWrap:"wrap" }}>
            {tabs.map(tab => {
              const isActive = activeFilter === tab.key
              const dotColor = tab.dot || "#64748b"
              return (
                <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
                  style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:99, border:`1.5px solid ${isActive?dotColor:"#e2e8f0"}`, background:isActive?`${dotColor}12`:"#f8fafc", color:isActive?dotColor:"#64748b", fontWeight:isActive?700:500, fontSize:12, cursor:"pointer", boxShadow:isActive?`0 0 0 2px ${dotColor}22`:"none", transition:"all 0.12s" }}>
                  {tab.dot && <span style={{ width:7, height:7, borderRadius:"50%", background:isActive?dotColor:"#94a3b8", display:"inline-block" }} />}
                  {tab.label}
                  <span style={{ fontSize:10, fontWeight:700, padding:"0px 5px", borderRadius:99, background:isActive?`${dotColor}20`:"#f1f5f9", color:isActive?dotColor:"#94a3b8" }}>{tab.count}</span>
                </button>
              )
            })}
            <div style={{ marginLeft:"auto", display:"flex", gap:4, alignItems:"center", flexWrap:"wrap" }}>
              {[1,2,3,4].map(l => <LevelBadge key={l} level={l} />)}
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0", marginBottom:10 }}>
            <span style={{ color:"#94a3b8", fontSize:14 }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name..."
              style={{ flex:1, border:"none", outline:"none", background:"transparent", fontSize:13, color:"#334155" }} />
            {search && <button onClick={()=>setSearch("")} style={{ border:"none", background:"none", cursor:"pointer", color:"#94a3b8", fontSize:12 }}>✕</button>}
          </div>

          <div style={{ maxHeight:320, overflowY:"auto", paddingRight:4 }}>
            {searchedFiltered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"16px", color:"#94a3b8", fontSize:12 }}>{search ? `"${search}" nahi mila` : `Is filter mein koi ${activeFilter} nahi`}</div>
            ) : (
              searchedFiltered.map((child,i) => (
                <SubTreeNode key={child.id||child._id||i} node={child} depth={0} isLast={i===searchedFiltered.length-1} level={1} hideIfNotUser={activeFilter === "user"} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Analytics Panel ─── */
function AnalyticsPanel({ selectedUser, treeData, onClose }) {
  const [analytics, setAnalytics] = useState(null)
  const [aLoading,  setALoading]  = useState(false)
  const [range,     setRange]     = useState("lifetime")

  useEffect(() => {
    if (!selectedUser) return
    const load = async () => {
      try {
        setALoading(true)
        const token  = localStorage.getItem("token")
        const userId = selectedUser.id || selectedUser._id
        const res    = await fetch(`http://localhost:5000/analytics/user/${userId}?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setAnalytics(await res.json())
      } catch { setAnalytics(null) }
      finally { setALoading(false) }
    }
    load()
  }, [selectedUser, range])

  const finalTimeline = analytics?.timeline?.length
    ? analytics.timeline
    : Array.from({ length:7 }, (_,i) => ({ label:`Day ${i+1}`, total:0 }))

  const c = getRC(selectedUser.role)

  const subtree = useMemo(() => {
    const userId = selectedUser?.id || selectedUser?._id
    for (const root of treeData) {
      const found = (function find(n) {
        if (!n) return null
        if (String(n.id || n._id) === String(userId)) return n
        for (const ch of (n.children||[])) { const r = find(ch); if (r) return r }
        return null
      })(root)
      if (found) return found
    }
    return null
  }, [selectedUser, treeData])

  return (
    <div style={{ padding:"16px", borderTop:"2px solid #e0e7ff", background:"#fff" }}>
      {/* Selected header */}
      <div style={{ fontSize:14, fontWeight:700, color:"#475569", marginBottom:12 }}>
        Selected: <span style={{ color:c.text }}>{selectedUser.name}</span>
        <span style={{ marginLeft:8, fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:99, background:c.bg, color:c.dot, border:`1px solid ${c.border}` }}>{c.icon} {c.label}</span>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"flex-start", marginBottom:14 }}>
        <div style={{ flex:1, minWidth:160 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <select value={range} onChange={e => setRange(e.target.value)}
            style={{ fontSize:12, padding:"6px 10px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"#f8fafc", color:"#334155", cursor:"pointer" }}>
            <option value="today">📅 Aaj</option>
            <option value="week">📅 Hafte mein</option>
            <option value="month">📅 Is Mahine</option>
            <option value="year">📅 Is Saal</option>
            <option value="lifetime">♾️ Lifetime</option>
          </select>
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:"50%", border:"1.5px solid #e2e8f0", background:"#f8fafc", color:"#94a3b8", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
            ✕
          </button>
        </div>
      </div>

      {aLoading && <div style={{ textAlign:"center", padding:"16px", color:"#94a3b8", fontSize:13 }}>⏳ Loading analytics...</div>}

      {analytics && !aLoading && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
            {[
              { label:"📦 Orders",    val:analytics.ordersCount??0,                               bg:"#eff6ff", color:"#1d4ed8" },
              { label:"💰 Sales",     val:`₹${Number(analytics.totalSales??0).toLocaleString()}`,  bg:"#f0fdf4", color:"#15803d" },
              { label:"👥 Connected", val:analytics.subUsersCount??0,                              bg:"#faf5ff", color:"#7c3aed" },
              { label:"📋 Products",  val:analytics.assignedProducts?.length??0,                   bg:"#fffbeb", color:"#b45309" },
            ].map((card,i) => (
              <div key={i} style={{ background:card.bg, borderRadius:12, padding:"12px 14px", border:`1px solid ${card.color}22` }}>
                <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:4 }}>{card.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:card.color }}>{card.val}</div>
              </div>
            ))}
          </div>
          {analytics.topProduct && (
            <div style={{ background:"#fff7ed", borderRadius:10, padding:"10px 14px", border:"1px solid #fed7aa" }}>
              <div style={{ fontSize:11, color:"#92400e", fontWeight:700, marginBottom:4 }}>🏆 Best Selling Product</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#c2410c" }}>{analytics.topProduct.name}</div>
              <div style={{ fontSize:12, color:"#78716c", marginTop:2 }}>{analytics.topProduct.count} units · ₹{Number(analytics.topProduct.total).toLocaleString()}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", marginBottom:8 }}>📦 Assigned Products</div>
            {analytics.assignedProducts?.length > 0
              ? <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:160, overflowY:"auto" }}>
                  {analytics.assignedProducts.map(p => (
                    <div key={p._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"#f8fafc", borderRadius:8, border:"1px solid #e8eef4" }}>
                      <span style={{ fontSize:13, fontWeight:600, color:"#334155" }}>{p.title}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:"#16a34a" }}>₹{p.price}</span>
                    </div>
                  ))}
                </div>
              : <p style={{ fontSize:12, color:"#94a3b8" }}>Koi product assign nahi</p>
            }
          </div>
          {subtree && <ConnectedUsers subtree={subtree} />}
          <div style={{ background:"#f8fafc", borderRadius:12, padding:"14px", border:"1px solid #e8eef4" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#1e293b", marginBottom:10 }}>📈 Sales Graph</div>
            <div style={{ height:150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={finalTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize:9 }} />
                  <YAxis tick={{ fontSize:9 }} />
                  <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {analytics.timeline?.length === 0 && (
              <p style={{ fontSize:11, color:"#94a3b8", textAlign:"center", marginTop:4 }}>Is period mein koi sale nahi</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Filter Bar ─── */
function FilterBar({ allNodes, selectedId, roleFilter, onSelectNode, onSelectRole, onReset }) {
  const [search, setSearch]     = useState("")
  const [nodeOpen, setNodeOpen] = useState(false)
  const nodeDropRef             = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (nodeDropRef.current && !nodeDropRef.current.contains(e.target)) setNodeOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allNodes.filter((n) => n.name.toLowerCase().includes(q) || n.role.toLowerCase().includes(q))
      .sort((a,b) => (ROLE_ORDER[a.role]??9)-(ROLE_ORDER[b.role]??9))
  }, [search, allNodes])
  const selectedNode = allNodes.find((n) => String(n.id) === String(selectedId))
  const hasFilter = selectedId || (roleFilter && roleFilter !== "all")
  const roleTabs = (() => {
    const nr = selectedNode?.role
    if (!nr || nr === "admin" || nr === "distributor") return [
      { key:"all", label:"All" }, { key:"distributor", label:getRoleLabelPlural("distributor") }, { key:"seller", label:getRoleLabelPlural("seller") }
    ]
    if (nr === "seller") return [{ key:"all", label:"All" }, { key:"seller", label:getRoleLabelPlural("seller") }, { key:"user", label:getRoleLabelPlural("user") }]
    return [{ key:"all", label:"All" }]
  })()
  return (
    <div style={fs.bar}>
      <div style={fs.row}>
        <span style={fs.label}>🔍 Select Node:</span>
        <div style={{ position:"relative" }} ref={nodeDropRef}>
          <button style={{ ...fs.trigger, ...(selectedNode?{background:rc(selectedNode.role).bg,borderColor:rc(selectedNode.role).border,color:rc(selectedNode.role).text}:{}) }} onClick={() => setNodeOpen(p=>!p)}>
            {selectedNode ? (<><span style={{...fs.dot,background:rc(selectedNode.role).dot}}/><span style={fs.triggerName}>{selectedNode.name}</span><span style={fs.triggerRole}>({getRoleLabel(selectedNode.role)})</span></>) : <span style={{color:"#94a3b8"}}>— Select a node —</span>}
            <span style={fs.chevron}>{nodeOpen?"▲":"▼"}</span>
          </button>
          {nodeOpen && (
            <div style={fs.dropdown}>
              <div style={fs.searchWrap}>
                <span style={{fontSize:17,color:"#94a3b8"}}>⌕</span>
                <input autoFocus style={fs.searchInput} placeholder="Search name or role…" value={search} onChange={e=>setSearch(e.target.value)} />
                {search && <button style={fs.clearBtn} onClick={()=>setSearch("")}>✕</button>}
              </div>
              <div style={fs.optionsList}>
                {filtered.length===0 && <div style={fs.empty}>No results found</div>}
                {filtered.map(n => {
                  const c=rc(n.role), active=String(n.id)===String(selectedId)
                  return (<div key={n.id} style={{...fs.option,...(active?{background:c.bg,borderLeftColor:c.border}:{})}} onClick={()=>{onSelectNode(n.id);setNodeOpen(false);setSearch("")}} onMouseEnter={e=>{if(!active)e.currentTarget.style.background="#f8fafc"}} onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent"}}>
                    <span style={{...fs.dot,background:c.dot}}/><span style={{fontWeight:600,fontSize:13,flex:1,color:c.text}}>{n.name}</span><span style={{fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:999,color:c.dot,background:`${c.dot}18`}}>{getRoleLabel(n.role)}</span>
                  </div>)
                })}
              </div>
            </div>
          )}
        </div>
        {hasFilter && <button style={fs.resetBtn} onClick={onReset}>✕ Reset</button>}
      </div>
      <div style={fs.roleRow}>
        <span style={fs.label}>👥 Show only:</span>
        <div style={fs.roleTabs}>
          {roleTabs.map(tab => {
            const isActive=roleFilter===tab.key, tabBg=tab.key==="all"?"#f1f5f9":rc(tab.key).bg, tabBd=tab.key==="all"?"#94a3b8":rc(tab.key).border, tabTx=tab.key==="all"?"#334155":rc(tab.key).text, tabDot=tab.key==="all"?"#94a3b8":rc(tab.key).dot
            return (<button key={tab.key} style={{...fs.roleTab,...(isActive?{background:tabBg,borderColor:tabBd,color:tabTx,fontWeight:700,boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}:{})}} onClick={()=>onSelectRole(tab.key)}>
              {tab.key!=="all"&&<span style={{...fs.dot,background:tabDot}}/>}{tab.label}
            </button>)
          })}
        </div>
        {selectedNode && <div style={fs.badge}>{roleFilter==="all"?<>Subtree of <strong style={{color:rc(selectedNode.role).text}}>{selectedNode.name}</strong></>:<><strong style={{color:rc(selectedNode.role).text}}>{selectedNode.name}</strong>&nbsp;→ only&nbsp;<strong style={{color:rc(roleFilter).text}}>{getRoleLabelPlural(roleFilter)}</strong></>}</div>}
      </div>
    </div>
  )
}

const fs = {
  bar:{display:"flex",flexDirection:"column",gap:0,background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",padding:"12px 16px",marginBottom:16,fontFamily:"system-ui,sans-serif"},
  row:{display:"flex",alignItems:"center",flexWrap:"wrap",gap:10},
  roleRow:{display:"flex",alignItems:"center",flexWrap:"wrap",gap:10,paddingTop:10,marginTop:8,borderTop:"1px solid #f1f5f9"},
  label:{fontSize:13,fontWeight:600,color:"#475569",whiteSpace:"nowrap"},
  trigger:{display:"inline-flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:999,border:"1.8px solid #cbd5e1",background:"#f8fafc",cursor:"pointer",fontSize:13,fontWeight:500,minWidth:190,fontFamily:"inherit",color:"#334155",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"},
  dot:{width:8,height:8,borderRadius:"50%",flexShrink:0,display:"inline-block"},
  triggerName:{fontWeight:600,flex:1}, triggerRole:{fontSize:11,opacity:0.6}, chevron:{fontSize:9,marginLeft:"auto",opacity:0.5},
  dropdown:{position:"absolute",top:"calc(100% + 8px)",left:0,minWidth:260,maxWidth:320,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.13)",zIndex:100,overflow:"hidden"},
  searchWrap:{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:"1px solid #f1f5f9",background:"#f8fafc"},
  searchInput:{flex:1,border:"none",outline:"none",background:"transparent",fontSize:13,color:"#334155",fontFamily:"inherit"},
  clearBtn:{border:"none",background:"none",cursor:"pointer",color:"#94a3b8",fontSize:12,padding:"2px 4px"},
  optionsList:{maxHeight:260,overflowY:"auto",padding:"6px 0"}, empty:{padding:16,textAlign:"center",color:"#94a3b8",fontSize:13},
  option:{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",cursor:"pointer",borderLeft:"3px solid transparent"},
  resetBtn:{display:"inline-flex",alignItems:"center",gap:4,padding:"6px 14px",borderRadius:999,border:"1.5px solid #fca5a5",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit"},
  roleTabs:{display:"flex",gap:6,flexWrap:"wrap"},
  roleTab:{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:999,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:12,fontWeight:500,fontFamily:"inherit",cursor:"pointer",whiteSpace:"nowrap"},
  badge:{fontSize:12,color:"#64748b",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:999,padding:"4px 12px",whiteSpace:"nowrap"},
}

export default function MyNetwork() {
  const { user } = useAuth() || {}
  const [tree,         setTree]         = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [viewMode,     setViewMode]     = useState("graph")
  const [graphRoot,    setGraphRoot]    = useState(null)
  const [rootRole,     setRootRole]     = useState(null)
  const [filteredId,   setFilteredId]   = useState(null)
  const [roleFilter,   setRoleFilter]   = useState("all")
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError(null)
        const token = localStorage.getItem("token")
        if (!token) { setError("Token missing"); return }
        const res = await fetch("http://localhost:5000/users/tree", { headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" } })
        if (!res.ok) throw new Error("Failed to load network")
        const data = await res.json()
        let arr = Array.isArray(data) ? data : Array.isArray(data?.tree) ? data.tree : []
        setTree(arr)
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    if (tree && tree.length > 0) {
      let myRoot = tree[0]
      if (user?.role !== "admin") { const f=tree.filter(n=>n.role!=="admin"); if(f.length>0) myRoot=f[0] }
      setGraphRoot(myRoot); setRootRole(myRoot?.role||null)
    }
  }, [tree, user])

  const allNodes = useMemo(() => { const list=[]; tree.forEach(root=>collectAllNodes(root,list)); return list }, [tree])

  const displayRoots = useMemo(() => {
    let roots = tree
    if (filteredId) { for (const root of tree) { const found=findNodeById(root,filteredId); if(found){roots=[found];break} } }
    if (roleFilter !== "all") roots = roots.map(r=>filterTopByRole(r,roleFilter)).filter(Boolean)
    return roots
  }, [filteredId, roleFilter, tree])

  const networkSubtree = useMemo(() => {
    if (!graphRoot) return null
    const userId = graphRoot.id || graphRoot._id
    for (const root of tree) { const found=findNodeById(root,userId); if(found) return found }
    return graphRoot
  }, [graphRoot, tree])

  const handleReset      = () => { setFilteredId(null); setRoleFilter("all") }
  const handleSelectNode = (id) => { setFilteredId(id); setRoleFilter("all") }

  const renderNode = (node, level=0) => (
    <div key={node.id||node._id} style={{ marginLeft:level*20 }}>
      <div className="p-2 border rounded my-1 bg-gray-50">{getRC(node.role).icon} {node.name||"User"} — {getRoleLabel(node.role)||"-"}</div>
      {node.children && sortKids(node.children).map(child=>renderNode(child,level+1))}
    </div>
  )

  const renderGraphNode = (node) => {
    if (!node) return null
    const c = rc(node.role)
    return (
      <TreeNode key={node.id||node._id}
        label={<div style={{background:c.bg,border:`1.5px solid ${c.border}`,color:c.text,padding:"5px 10px",borderRadius:999,fontSize:11,fontWeight:600,minWidth:70,textAlign:"center",boxShadow:`0 2px 6px ${c.dot}22`,fontFamily:"system-ui,sans-serif",cursor:"pointer"}} onClick={()=>setSelectedUser(node)}>
          <div>{node.name||"User"}</div>
          <div style={{fontSize:9,opacity:0.6,marginTop:1}}>({getRoleLabel(node.role)||"-"})</div>
        </div>}
      >
        {sortKids(node.children).map(child=>renderGraphNode(child))}
      </TreeNode>
    )
  }

  const rootsToShow = displayRoots.length>0 ? displayRoots : (graphRoot?[graphRoot]:[])
  const views = [
    { key:"network", label:"👥 Network", recommended:true  },
    { key:"graph",   label:"🌳 Graph",   recommended:false },
    { key:"tree",    label:"📋 List",    recommended:false },
  ]

  return (
    <div style={{ background:"#fff", borderRadius:12, boxShadow:"0 2px 16px rgba(0,0,0,0.07)", overflow:"hidden", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ padding:"14px 16px", background:"linear-gradient(135deg,#f8fafc,#f0f4ff)", borderBottom:"1px solid #e8eef4" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, color:"#1e293b", margin:0 }}>🌐 My Network</h2>
            <p style={{ fontSize:11, color:"#94a3b8", margin:"2px 0 0" }}>Role: <strong style={{color:getRC(user?.role).dot}}>{user?.role||"unknown"}</strong> · Kisi bhi user pe click karo — analytics dekhne ke liye</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, marginTop:12, overflowX:"auto", paddingBottom:2 }}>
          {views.map(v => (
            <button key={v.key} onClick={() => setViewMode(v.key)}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 16px", borderRadius:99, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", border:viewMode===v.key?"2px solid #3b82f6":"2px solid #e2e8f0", background:viewMode===v.key?"#eff6ff":"#fff", color:viewMode===v.key?"#1d4ed8":"#64748b", boxShadow:viewMode===v.key?"0 0 0 3px #3b82f622":"none", transition:"all 0.15s" }}>
              {v.label}
              {v.recommended && viewMode!==v.key && <span style={{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:99,background:"#dcfce7",color:"#15803d"}}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"16px" }}>
        {loading && <div style={{textAlign:"center",padding:"32px",color:"#94a3b8",fontSize:13}}><div style={{fontSize:28,marginBottom:8}}>⏳</div>Loading your network...</div>}
        {error   && <div style={{padding:"12px 16px",background:"#fef2f2",borderRadius:10,color:"#dc2626",fontSize:13,border:"1px solid #fecaca"}}>❌ {error}</div>}

        {viewMode==="network" && !loading && (
          <>
            <ConnectedUsers subtree={networkSubtree} />
            <div style={{marginTop:10,padding:"8px 12px",background:"#f0f9ff",borderRadius:8,border:"1px solid #bae6fd",fontSize:12,color:"#0369a1"}}>
              💡 📊 icon pe click karo kisi bhi user ki analytics dekhne ke liye
            </div>
          </>
        )}

        {viewMode==="graph" && !loading && (
          <>
            {allNodes.length>0 && <FilterBar allNodes={allNodes} selectedId={filteredId} roleFilter={roleFilter} onSelectNode={handleSelectNode} onSelectRole={setRoleFilter} onReset={handleReset} />}
            {rootsToShow.length>0 ? (
              <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",background:"#f8fafc",borderRadius:12,padding:"16px",border:"1px solid #e8eef4",minHeight:200}}>
                {rootsToShow.map((root,i) => (
                  <Tree key={root.id||root._id||i} lineWidth="2px" lineColor="#94a3b8" lineBorderRadius="10px"
                    label={<div style={{fontWeight:700,fontSize:13,textAlign:"center",color:"#334155",padding:"5px 12px",background:"#fff",borderRadius:99,border:"1.5px solid #e2e8f0",display:"inline-block"}}>My Network</div>}>
                    {renderGraphNode(root)}
                  </Tree>
                ))}
              </div>
            ) : <div style={{textAlign:"center",padding:"24px",color:"#94a3b8",fontSize:13}}>No graph data</div>}
          </>
        )}

        {viewMode==="tree" && !loading && (
          <>
            {allNodes.length>0 && <FilterBar allNodes={allNodes} selectedId={filteredId} roleFilter={roleFilter} onSelectNode={handleSelectNode} onSelectRole={setRoleFilter} onReset={handleReset} />}
            {displayRoots.length>0 ? <div style={{marginTop:8}}>{displayRoots.map(n=>renderNode(n))}</div> : <div style={{textAlign:"center",padding:"24px",color:"#94a3b8",fontSize:13}}>No data</div>}
          </>
        )}

        {tree.length===0 && !loading && <div style={{textAlign:"center",padding:"32px",color:"#94a3b8",fontSize:13}}><div style={{fontSize:32,marginBottom:8}}>🕸️</div>Aapke network mein koi user nahi hai abhi</div>}
      </div>

      {selectedUser && (
        <AnalyticsPanel
          selectedUser={selectedUser}
          treeData={tree}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}
