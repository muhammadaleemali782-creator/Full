import { useEffect, useState, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import VisualTree from "../admin/VisualTree"
import { getRoleLabel, getRoleLabelPlural } from "../utils/roleLabels"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const RC = {
  admin:       { bg:"#f5f3ff", border:"#7c3aed", text:"#5b21b6", dot:"#7c3aed", icon:"👑", label:"Admin" },
  distributor: { bg:"#f0fdf4", border:"#16a34a", text:"#15803d", dot:"#16a34a", icon:"🏢", label:"Distributor" },
  seller:      { bg:"#eff6ff", border:"#3b82f6", text:"#1d4ed8", dot:"#3b82f6", icon:"🛒", label:"Seller" },
  user:        { bg:"#f8fafc", border:"#94a3b8", text:"#475569", dot:"#94a3b8", icon:"👤", label:"User" },
}
const getRC     = (role) => RC[role] || RC.user
const ROLE_SORT = { distributor:0, seller:1, user:2, admin:3 }
const sortKids  = (arr) => [...(arr||[])].sort((a,b)=>(ROLE_SORT[a.role]??9)-(ROLE_SORT[b.role]??9))

function LevelBadge({ level }) {
  const cfgs = [null,
    {bg:"#fef9c3",color:"#92400e",label:"L1 • Commission"},
    {bg:"#dcfce7",color:"#166534",label:"L2 • Commission"},
    {bg:"#dbeafe",color:"#1e40af",label:"L3 • Commission"},
    {bg:"#fce7f3",color:"#9d174d",label:"L4 • Coins"},
  ]
  const cfg = cfgs[level]||{bg:"#f1f5f9",color:"#475569",label:`L${level} • Coins`}
  return <span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99,background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.color}22`,whiteSpace:"nowrap"}}>{cfg.label}</span>
}

function InlineAnalytics({ userId, userName, userRole }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const c = getRC(userRole)
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`http://localhost:5000/analytics/user/${userId}?range=lifetime`, { headers:{Authorization:`Bearer ${token}`} })
        setData(await res.json())
      } catch { setData(null) }
      finally { setLoading(false) }
    }
    load()
  }, [userId])
  const timeline = data?.timeline?.length ? data.timeline : Array.from({length:7},(_,i)=>({label:`D${i+1}`,total:0}))
  return (
    <div style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:10,padding:"12px 14px",marginTop:2}}>
      {loading ? (
        <div style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:"8px"}}>⏳ Loading analytics...</div>
      ) : !data ? (
        <div style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:"8px"}}>Koi data nahi</div>
      ) : (
        <>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            <span style={{fontSize:13}}>{c.icon}</span>
            <span style={{fontSize:13,fontWeight:700,color:c.text}}>{userName}</span>
            <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:`${c.dot}20`,color:c.dot,fontWeight:700}}>{c.label}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
            {[
              {label:"Orders",val:data.ordersCount??0,color:"#1d4ed8",bg:"#eff6ff"},
              {label:"Sales",val:`₹${Number(data.totalSales??0).toLocaleString()}`,color:"#15803d",bg:"#f0fdf4"},
              {label:"Connected",val:data.subUsersCount??0,color:"#7c3aed",bg:"#faf5ff"},
              {label:"Products",val:data.assignedProducts?.length??0,color:"#b45309",bg:"#fffbeb"},
            ].map((s,i)=>(
              <div key={i} style={{background:s.bg,borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#64748b",fontWeight:600,marginBottom:2}}>{s.label}</div>
                <div style={{fontSize:14,fontWeight:800,color:s.color}}>{s.val}</div>
              </div>
            ))}
          </div>
          {data.topProduct && (
            <div style={{background:"#fff7ed",borderRadius:7,padding:"6px 10px",marginBottom:10,border:"1px solid #fed7aa"}}>
              <span style={{fontSize:10,color:"#92400e",fontWeight:700}}>🏆 Top: </span>
              <span style={{fontSize:11,color:"#c2410c",fontWeight:600}}>{data.topProduct.name}</span>
              <span style={{fontSize:10,color:"#78716c",marginLeft:6}}>{data.topProduct.count} units · ₹{Number(data.topProduct.total).toLocaleString()}</span>
            </div>
          )}
          {data.assignedProducts?.length > 0 && (
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"#475569",marginBottom:4}}>📦 Products:</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {data.assignedProducts.map(p=>(
                  <span key={p._id} style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#f1f5f9",color:"#334155",border:"1px solid #e2e8f0"}}>{p.title} — ₹{p.price}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{height:65}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0"/>
                <XAxis dataKey="label" tick={{fontSize:7}}/>
                <YAxis tick={{fontSize:7}} width={22}/>
                <Tooltip contentStyle={{fontSize:10,borderRadius:6,padding:"3px 8px"}}/>
                <Line type="monotone" dataKey="total" stroke={c.dot} strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

function SubTreeNode({ node, depth=0, isLast=false, level=1, hideIfNotUser=false }) {
  const [open,       setOpen]       = useState(false)
  const [inlineOpen, setInlineOpen] = useState(false)
  const isHidden  = hideIfNotUser && node.role !== "user" && node._hideSelf
  const children  = sortKids(node.children)
  const hasKids   = children.length > 0
  const c         = getRC(node.role)
  const summary   = hasKids && !open ? (() => {
    const cnt={}; children.forEach(ch=>{cnt[ch.role]=(cnt[ch.role]||0)+1})
    return Object.entries(cnt).map(([r,n])=>`${n} ${getRC(r).label}${n>1?"s":""}`).join(", ")
  })() : ""

  if (isHidden) return (
    <div>{children.map((child,i)=><SubTreeNode key={child.id||child._id||i} node={child} depth={depth} isLast={i===children.length-1} level={level} hideIfNotUser={hideIfNotUser}/>)}</div>
  )

  return (
    <div style={{position:"relative"}}>
      {depth>0&&(<>
        <div style={{position:"absolute",left:-17,top:0,bottom:isLast?"50%":0,width:2,background:"#e2e8f0"}}/>
        <div style={{position:"absolute",left:-17,top:18,width:14,height:2,background:"#e2e8f0"}}/>
      </>)}
      <div onClick={()=>hasKids&&setOpen(p=>!p)}
        style={{display:"flex",alignItems:"center",gap:7,padding:"6px 10px",marginBottom:3,borderRadius:9,background:open&&hasKids?c.bg:"#fff",border:`1.5px solid ${open&&hasKids?c.border:"#e8eef4"}`,cursor:hasKids?"pointer":"default",userSelect:"none",transition:"all 0.12s",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}
        onMouseEnter={e=>{if(hasKids)e.currentTarget.style.borderColor=c.border}}
        onMouseLeave={e=>{if(hasKids&&!(open&&hasKids))e.currentTarget.style.borderColor="#e8eef4"}}
      >
        <div style={{width:18,height:18,borderRadius:5,background:hasKids?(open?c.dot:"#e2e8f0"):"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {hasKids&&<span style={{fontSize:8,color:open?"#fff":"#94a3b8",fontWeight:700}}>{open?"▼":"▶"}</span>}
        </div>
        <span style={{fontSize:13}}>{c.icon}</span>
        <span style={{fontSize:13,fontWeight:600,color:"#1e293b",flex:1}}>{node.name}</span>
        <LevelBadge level={level}/>
        <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:`${c.dot}15`,color:c.dot,border:`1px solid ${c.dot}30`}}>{c.label}</span>
        {summary&&<span style={{fontSize:10,color:"#94a3b8",whiteSpace:"nowrap"}}>({summary})</span>}
        {node.isBlocked&&<span title="Blocked" style={{fontSize:11}}>🚫</span>}
        <span onClick={e=>{e.stopPropagation();setInlineOpen(p=>!p)}} title="Analytics" style={{fontSize:11,padding:"2px 7px",borderRadius:99,background:inlineOpen?"#3b82f6":"#f1f5f9",color:inlineOpen?"#fff":"#94a3b8",cursor:"pointer",userSelect:"none",flexShrink:0,transition:"all 0.15s"}}>
          {inlineOpen?"▲":"📊"}
        </span>
      </div>
      {inlineOpen&&(
        <div style={{marginLeft:26,marginBottom:6,marginTop:2}}>
          <InlineAnalytics userId={node.id||node._id} userName={node.name} userRole={node.role}/>
        </div>
      )}
      {open&&hasKids&&(
        <div style={{paddingLeft:28,position:"relative"}}>
          {children.map((child,i)=><SubTreeNode key={child.id||child._id||i} node={child} depth={depth+1} isLast={i===children.length-1} level={level+1} hideIfNotUser={hideIfNotUser}/>)}
        </div>
      )}
    </div>
  )
}

function SubUsersList({ subtree, allSubs }) {
  const [collapsed,    setCollapsed]    = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")
  const [search,       setSearch]       = useState("")

  const rawChildren = sortKids(subtree?.children||[])
  const distCount   = rawChildren.filter(c=>c.role==="distributor").length
  const sellerCount = rawChildren.filter(c=>c.role==="seller").length
  const userCount   = rawChildren.filter(c=>c.role==="user").length
  const total       = allSubs?.length??0

  const totalUserCount = (() => {
    const list=[]; const collect=(n)=>{if(!n)return;if(n.role==="user")list.push(n);(n.children||[]).forEach(collect)}
    rawChildren.forEach(collect); return list.length
  })()

  const usersOnlyTree = (() => {
    const build=(n)=>{if(!n)return null;const kids=(n.children||[]).map(build).filter(Boolean);if(n.role==="user")return{...n,children:kids};if(kids.length>0)return{...n,_hideSelf:true,children:kids};return null}
    return rawChildren.map(build).filter(Boolean)
  })()

  const filtered = activeFilter==="all" ? rawChildren : activeFilter==="user" ? usersOnlyTree : rawChildren.filter(c=>c.role===activeFilter)

  const searchedFiltered = useMemo(()=>{
    if(!search.trim()) return filtered
    const q=search.toLowerCase()
    const st=(n)=>{if(!n)return null;const match=(n.name||"").toLowerCase().includes(q);const kids=(n.children||[]).map(st).filter(Boolean);if(match||kids.length>0)return{...n,children:kids};return null}
    return filtered.map(st).filter(Boolean)
  },[filtered,search])

  const tabs=[
    {key:"all",         label:"All",          count:rawChildren.length, dot:null},
    distCount>0   && {key:"distributor", label:"Distributors",  count:distCount,      dot:RC.distributor.dot},
    sellerCount>0 && {key:"seller",      label:"Sellers",       count:sellerCount,    dot:RC.seller.dot},
                      {key:"user",        label:"Users",         count:totalUserCount, dot:RC.user.dot},
  ].filter(Boolean)

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>👥 Connected Users</span>
          <span style={{fontSize:11,fontWeight:700,padding:"1px 8px",borderRadius:99,background:"#e0e7ff",color:"#4338ca"}}>{total}</span>
        </div>
        {rawChildren.length>0&&(
          <button onClick={()=>setCollapsed(p=>!p)} style={{fontSize:11,padding:"3px 11px",borderRadius:7,border:"1.5px solid #e2e8f0",background:collapsed?"#f8fafc":"#fff",color:"#64748b",cursor:"pointer",fontWeight:600}}>
            {collapsed?"▼ Show":"▲ Collapse"}
          </button>
        )}
      </div>

      {!collapsed&&rawChildren.length>0&&(
        <>
          <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
            {tabs.map(tab=>{
              const isActive=activeFilter===tab.key; const dotColor=tab.dot||"#94a3b8"
              return(
                <button key={tab.key} onClick={()=>setActiveFilter(tab.key)}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"4px 11px",borderRadius:99,border:`1.5px solid ${isActive?dotColor:"#e2e8f0"}`,background:isActive?(tab.dot?`${dotColor}12`:"#f1f5f9"):"#fff",color:isActive?dotColor:"#64748b",fontWeight:isActive?700:500,fontSize:12,cursor:"pointer",boxShadow:isActive?`0 0 0 2px ${dotColor}22`:"none",transition:"all 0.12s"}}>
                  {tab.dot&&<span style={{width:7,height:7,borderRadius:"50%",background:isActive?dotColor:"#94a3b8",display:"inline-block"}}/>}
                  {tab.label}
                  <span style={{fontSize:10,fontWeight:700,padding:"0px 5px",borderRadius:99,background:isActive?`${dotColor}20`:"#f1f5f9",color:isActive?dotColor:"#94a3b8"}}>{tab.count}</span>
                </button>
              )
            })}
            <div style={{marginLeft:"auto",display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
              {[1,2,3,4].map(l=><LevelBadge key={l} level={l}/>)}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",marginBottom:10}}>
            <span style={{color:"#94a3b8",fontSize:14}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name..."
              style={{flex:1,border:"none",outline:"none",background:"transparent",fontSize:13,color:"#334155"}}/>
            {search&&<button onClick={()=>setSearch("")} style={{border:"none",background:"none",cursor:"pointer",color:"#94a3b8",fontSize:12}}>✕</button>}
          </div>
        </>
      )}

      {total===0?(
        <div style={{textAlign:"center",padding:"20px 0",color:"#94a3b8",fontSize:13}}>Koi connected user nahi hai</div>
      ):collapsed?(
        <div style={{textAlign:"center",padding:"10px",color:"#94a3b8",fontSize:12,background:"#f8fafc",borderRadius:8,border:"1px dashed #e2e8f0"}}>{total} users — Show karo dekhne ke liye</div>
      ):(
        <div style={{maxHeight:400,overflowY:"auto",paddingRight:4}}>
          {searchedFiltered.length>0
            ?searchedFiltered.map((child,i)=><SubTreeNode key={child.id||child._id||i} node={child} depth={0} isLast={i===searchedFiltered.length-1} level={1} hideIfNotUser={activeFilter==="user"}/>)
            :<div style={{textAlign:"center",padding:"16px 0",color:"#94a3b8",fontSize:12}}>{search?`"${search}" nahi mila`:`Is filter mein koi ${activeFilter} nahi`}</div>
          }
        </div>
      )}
    </div>
  )
}

export default function AdminNetworkView() {
  const { user } = useAuth()
  const [treeData,       setTreeData]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [selectedUser,   setSelectedUser]   = useState(null)
  const [analytics,      setAnalytics]      = useState(null)
  const [aLoading,       setALoading]       = useState(false)
  const [range,          setRange]          = useState("lifetime")
  const [showLines,      setShowLines]      = useState(true)
  const [allUsers,       setAllUsers]       = useState([])
  const [changingParent, setChangingParent] = useState(false)
  const [newParentId,    setNewParentId]    = useState("")
  const [cpLoading,      setCpLoading]      = useState(false)
  const [cpMsg,          setCpMsg]          = useState("")

  if (!user||user.role!=="admin") return <div className="bg-white p-6 rounded shadow"><p className="text-red-600 font-semibold">❌ Admin access only</p></div>

  useEffect(()=>{loadTree()},[])

  const loadTree = async () => {
    try {
      setLoading(true);setError(null)
      const token=localStorage.getItem("token")
      if(!token) throw new Error("Auth token missing")
      const res=await fetch("http://localhost:5000/users/tree",{headers:{Authorization:`Bearer ${token}`}})
      if(!res.ok) throw new Error("Failed to load network tree")
      const data=await res.json()
      let arr=Array.isArray(data)?data:Array.isArray(data?.tree)?data.tree:[]
      const sanitize=(nodes)=>Array.isArray(nodes)?nodes.map(n=>({...n,id:n.id||n._id,name:n.name||"Unnamed",role:n.role||"user",children:sanitize(n.children||[])})):[]
      const sanitized=sanitize(arr)
      let finalTree=sanitized
      if(sanitized.length>1){
        const adminRoot=sanitized.find(n=>n.role==="admin");const nonAdmin=sanitized.filter(n=>n.role!=="admin")
        if(adminRoot){adminRoot.children=[...(adminRoot.children||[]),...nonAdmin];finalTree=[adminRoot]}
        else finalTree=[{id:"admin",name:"Admin",role:"admin",children:sanitized}]
      }
      setTreeData(finalTree)
    } catch(err){setError(err.message);setTreeData([])}
    finally{setLoading(false)}
  }

  useEffect(()=>{
    const load=async()=>{
      try{const token=localStorage.getItem("token");const res=await fetch("http://localhost:5000/users/all-for-product",{headers:{Authorization:`Bearer ${token}`}});const d=await res.json();setAllUsers(Array.isArray(d)?d:[])}catch{}
    };load()
  },[])

  useEffect(()=>{
    if(!selectedUser) return
    setChangingParent(false);setCpMsg("")
    const load=async()=>{
      try{setALoading(true);const token=localStorage.getItem("token");const uid=selectedUser.id||selectedUser._id;const res=await fetch(`http://localhost:5000/analytics/user/${uid}?range=${range}`,{headers:{Authorization:`Bearer ${token}`}});setAnalytics(await res.json())}
      catch{setAnalytics(null)}finally{setALoading(false)}
    };load()
  },[selectedUser,range])

  const handleChangeParent=async()=>{
    try{
      setCpLoading(true);setCpMsg("")
      const token=localStorage.getItem("token");const uid=selectedUser.id||selectedUser._id
      const res=await fetch(`http://localhost:5000/admin/change-parent/${uid}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({newParentId:newParentId||null})})
      const data=await res.json()
      if(!res.ok){setCpMsg("❌ "+(data.message||"Failed"));return}
      setCpMsg(`✅ Parent changed to: ${data.newParent?.name||"Root (Admin)"}`);setChangingParent(false);loadTree()
    }catch(err){setCpMsg("❌ Error: "+err.message)}finally{setCpLoading(false)}
  }

  const finalTimeline=analytics?.timeline?.length?analytics.timeline:Array.from({length:7},(_,i)=>({label:`Day ${i+1}`,total:0}))
  if(loading) return <div className="bg-white p-6 rounded shadow">Loading network...</div>
  if(error)   return <div className="bg-white p-6 rounded shadow text-red-600">{error}</div>

  return (
    <div style={{background:"#fff",borderRadius:12,boxShadow:"0 2px 16px rgba(0,0,0,0.07)",overflow:"hidden"}}>
      <div style={{padding:"14px 16px",borderBottom:"1px solid #f1f5f9",background:"linear-gradient(135deg,#f8fafc,#f0f4ff)",display:"flex",flexWrap:"wrap",gap:10,alignItems:"center",justifyContent:"space-between"}}>
        <div><h1 style={{fontSize:16,fontWeight:800,color:"#1e293b",margin:0}}>🌐 Network Hierarchy</h1><p style={{fontSize:11,color:"#94a3b8",margin:"2px 0 0"}}>Kisi bhi user pe click karo</p></div>
        <div style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={()=>setShowLines(p=>!p)}>
          <span style={{fontSize:11,color:"#64748b"}}>Lines</span>
          <div style={{width:38,height:22,borderRadius:99,background:showLines?"#3b82f6":"#cbd5e1",position:"relative",transition:"background 0.2s"}}><div style={{position:"absolute",top:3,left:showLines?18:3,width:16,height:16,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left 0.2s"}}/></div>
          <span style={{fontSize:10,color:showLines?"#3b82f6":"#94a3b8",fontWeight:700}}>{showLines?"ON":"OFF"}</span>
        </div>
      </div>

      <div style={{overflowX:"auto",borderBottom:"1px solid #f1f5f9",background:"#f8fafc",minHeight:280}}>
        {treeData.length===0?<p style={{padding:24,color:"#94a3b8",textAlign:"center"}}>No users in network</p>
          :<VisualTree data={treeData} showLines={showLines} onSelect={(node)=>{setSelectedUser(node);setAnalytics(null);setNewParentId("");setCpMsg("")}}/>}
      </div>

      {selectedUser&&(
        <div style={{padding:"16px",borderTop:"2px solid #e0e7ff",background:"#fff"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"flex-start",marginBottom:14}}>
            <div style={{flex:1,minWidth:160}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{selectedUser.name}</span>
                <span style={{fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:99,background:getRC(selectedUser.role).bg,color:getRC(selectedUser.role).dot,border:`1px solid ${getRC(selectedUser.role).border}`}}>{getRC(selectedUser.role).icon} {getRC(selectedUser.role).label}</span>
              </div>
              {cpMsg&&<p style={{fontSize:12,marginTop:4}}>{cpMsg}</p>}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
              <select value={range} onChange={e=>setRange(e.target.value)} style={{fontSize:12,padding:"6px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#334155",cursor:"pointer"}}>
                <option value="today">📅 Aaj</option><option value="week">📅 Hafte mein</option><option value="month">📅 Is Mahine</option><option value="year">📅 Is Saal</option><option value="lifetime">♾️ Lifetime</option>
              </select>
              <button onClick={()=>{setChangingParent(p=>!p);setCpMsg("")}} style={{fontSize:12,padding:"6px 12px",borderRadius:8,border:"none",background:changingParent?"#e0e7ff":"#4f46e5",color:changingParent?"#4f46e5":"#fff",fontWeight:700,cursor:"pointer"}}>{changingParent?"✕ Cancel":"🔗 Change Parent"}</button>
              <button onClick={()=>{setSelectedUser(null);setAnalytics(null);setCpMsg("")}} style={{width:32,height:32,borderRadius:"50%",border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#94a3b8",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✕</button>
            </div>
          </div>

          {changingParent&&(
            <div style={{marginBottom:14,padding:"12px 14px",background:"#eef2ff",borderRadius:10,border:"1px solid #c7d2fe",display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
              <span style={{fontSize:12,fontWeight:700,color:"#4f46e5"}}>New Parent:</span>
              <select value={newParentId} onChange={e=>setNewParentId(e.target.value)} style={{flex:1,minWidth:180,fontSize:12,padding:"6px 10px",borderRadius:8,border:"1.5px solid #c7d2fe",background:"#fff"}}>
                <option value="">— Root (Admin ke neeche) —</option>
                {allUsers.filter(u=>String(u._id)!==String(selectedUser.id||selectedUser._id)).map(u=>(<option key={u._id} value={u._id}>{u.name} ({u.role})</option>))}
              </select>
              <button onClick={handleChangeParent} disabled={cpLoading} style={{fontSize:12,padding:"6px 16px",borderRadius:8,border:"none",background:"#4f46e5",color:"#fff",fontWeight:700,cursor:"pointer",opacity:cpLoading?0.6:1}}>{cpLoading?"Saving...":"✓ Save"}</button>
            </div>
          )}

          {aLoading&&<div style={{textAlign:"center",padding:"16px",color:"#94a3b8",fontSize:13}}>⏳ Loading analytics...</div>}

          {analytics&&!aLoading&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                {[{label:"📦 Orders",val:analytics.ordersCount??0,bg:"#eff6ff",color:"#1d4ed8"},{label:"💰 Sales",val:`₹${Number(analytics.totalSales??0).toLocaleString()}`,bg:"#f0fdf4",color:"#15803d"},{label:"👥 Connected",val:analytics.subUsersCount??0,bg:"#faf5ff",color:"#7c3aed"},{label:"📋 Products",val:analytics.assignedProducts?.length??0,bg:"#fffbeb",color:"#b45309"}].map((card,i)=>(
                  <div key={i} style={{background:card.bg,borderRadius:12,padding:"12px 14px",border:`1px solid ${card.color}22`}}>
                    <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4}}>{card.label}</div>
                    <div style={{fontSize:22,fontWeight:800,color:card.color}}>{card.val}</div>
                  </div>
                ))}
              </div>
              {analytics.topProduct&&(<div style={{background:"#fff7ed",borderRadius:10,padding:"10px 14px",border:"1px solid #fed7aa"}}><div style={{fontSize:11,color:"#92400e",fontWeight:700,marginBottom:4}}>🏆 Best Selling Product</div><div style={{fontSize:14,fontWeight:700,color:"#c2410c"}}>{analytics.topProduct.name}</div><div style={{fontSize:12,color:"#78716c",marginTop:2}}>{analytics.topProduct.count} units · ₹{Number(analytics.topProduct.total).toLocaleString()}</div></div>)}
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:8}}>📦 Assigned Products</div>
                {analytics.assignedProducts?.length>0?<div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:160,overflowY:"auto"}}>{analytics.assignedProducts.map(p=>(<div key={p._id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#f8fafc",borderRadius:8,border:"1px solid #e8eef4"}}><span style={{fontSize:13,fontWeight:600,color:"#334155"}}>{p.title}</span><span style={{fontSize:13,fontWeight:700,color:"#16a34a"}}>₹{p.price}</span></div>))}</div>:<p style={{fontSize:12,color:"#94a3b8"}}>Koi product assign nahi</p>}
              </div>
              <SubUsersList subtree={(() => {
                const uid=selectedUser?.id||selectedUser?._id
                for(const root of treeData){const found=(function find(n){if(!n)return null;if(String(n.id||n._id)===String(uid))return n;for(const ch of(n.children||[])){const r=find(ch);if(r)return r}return null})(root);if(found)return found}
                return null
              })()} allSubs={analytics.allSubUsers||[]}/>
              <div style={{background:"#f8fafc",borderRadius:12,padding:"14px",border:"1px solid #e8eef4"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:10}}>📈 Sales Graph</div>
                <div style={{height:150}}><ResponsiveContainer width="100%" height="100%"><LineChart data={finalTimeline}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="label" tick={{fontSize:9}}/><YAxis tick={{fontSize:9}}/><Tooltip contentStyle={{fontSize:11,borderRadius:8}}/><Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} dot={false}/></LineChart></ResponsiveContainer></div>
                {analytics.timeline?.length===0&&<p style={{fontSize:11,color:"#94a3b8",textAlign:"center",marginTop:4}}>Is period mein koi sale nahi</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
