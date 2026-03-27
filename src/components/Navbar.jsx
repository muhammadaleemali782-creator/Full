import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"

export default function Navbar({ setPage, cartCount }) {
  const { loggedIn, logout, user } = useAuth() || {}
  const safeUser = user || {}
  const role = safeUser?.role || "guest"
  const safeSetPage = typeof setPage === "function" ? setPage : () => {}
  const safeCartCount = Number(cartCount) || 0
  const isBlocked = safeUser?.isBlocked || false
  const isDeleted = safeUser?.isDeleted || false
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const go = (page) => { safeSetPage(page); setMenuOpen(false) }

  if (loggedIn && (isBlocked || isDeleted)) {
    return (
      <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#fef2f2", padding:"12px 16px", marginBottom:16, borderRadius:8, boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
        <span style={{ fontWeight:700, color:"#dc2626" }}>Account Disabled</span>
        <button onClick={() => { logout && logout(); go("login") }} style={{ padding:"6px 14px", borderRadius:6, background:"#dc2626", color:"#fff", border:"none", cursor:"pointer", fontSize:13, fontWeight:600 }}>Logout</button>
      </header>
    )
  }

  /* ─── Button configs ─── */
  const publicBtns = [
    { label:"home",     page:"home",     color:"#3b82f6" },
    { label:"services", page:"services", color:"#3b82f6" },
    { label:"store",    page:"store",    color:"#3b82f6" },
    { label:"orders",   page:"orders",   color:"#3b82f6" },
  ]

  const adminBtns = [
    { label:"Admin Panel",        page:"admin",                  color:"#7c3aed" },
    { label:"Network View",       page:"admin-network",          color:"#a21caf" },
    { label:"Add Product",        page:"admin-add-product",      color:"#ea580c" },
    { label:"Manage Products",    page:"admin-products",         color:"#dc2626" },
    { label:"Manage Users",       page:"admin-users",            color:"#1e293b" },
    { label:"User Requests",      page:"admin-requests",         color:"#db2777" },
    { label:"Requests History",   page:"admin-requests-history", color:"#4b5563" },
    { label:"Admin Commission",   page:"admin-commission",       color:"#059669" },
    { label:"Commission Levels",  page:"admin-commission-levels",color:"#1d4ed8" },
    { label:"Coin Wallet",        page:"admin-coin-wallet",      color:"#65a30d" },
    { label:"Password Reset",     page:"admin-password-reset",   color:"#b91c1c" },
    { label:"📧 Email Settings",  page:"email-settings",         color:"#4f46e5" },
    { label:"Orders",             page:"admin-orders",           color:"#0f766e" },
    { label:"Created Users",      page:"my-users",               color:"#0d9488" },
  ]

  const distSellerBtns = [
    { label:"Create User",   page:"create-seller",     color:"#16a34a" },
    { label:"Request User",  page:"raise-request",     color:"#ea580c" },
    { label:"My Commission", page:"my-commission",     color:"#0891b2" },
    { label:"My Network",    page:"my-network",        color:"#7c3aed" },
    { label:"My Coins",      page:"coin-wallet",       color:"#ca8a04" },
  ]

  const userBtns = [
    { label:"Request User",  page:"raise-request",  color:"#ea580c" },
    { label:"My Commission", page:"my-commission",  color:"#0891b2" },
    { label:"My Network",    page:"my-network",     color:"#7c3aed" },
    { label:"My Coins",      page:"coin-wallet",    color:"#ca8a04" },
  ]

  /* Bottom nav items per role */
  const bottomNav = loggedIn ? [
    { label:"Home",    page:"home",    icon:"🏠" },
    { label:"Store",   page:"store",   icon:"🛒" },
    ...(role==="admin"
      ? [{ label:"Network", page:"admin-network", icon:"🌐" }, { label:"Orders", page:"admin-orders", icon:"📦" }]
      : [{ label:"Network", page:"my-network", icon:"🌐" }, { label:"Orders", page: role==="user" ? "seller-orders" : role==="seller" ? "seller-orders" : "distributor-orders", icon:"📦" }]
    ),
    { label:"Profile", page:"my-profile", icon:"👤" },
  ] : [
    { label:"Home",  page:"home",  icon:"🏠" },
    { label:"Store", page:"store", icon:"🛒" },
    { label:"Login", page:"login", icon:"👤" },
  ]

  /* Role-specific drawer buttons */
  let roleBtns = []
  if (role === "admin")                         roleBtns = adminBtns
  else if (role === "distributor" || role === "seller") roleBtns = distSellerBtns
  else if (role === "user")                     roleBtns = userBtns

  const orderBtn = role === "user" || role === "seller"
    ? { label:"My Orders", page:"seller-orders",      color:"#1e40af" }
    : role === "distributor"
    ? { label:"Orders",    page:"distributor-orders", color:"#166534" }
    : null

  return (
    <>
      {/* ─── DESKTOP NAVBAR ─── */}
      <header style={{display:isMobile?"none":"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",padding:"16px",borderRadius:8,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",marginBottom:24,flexWrap:"wrap",gap:8}}>
        <h1 className="font-bold text-lg cursor-pointer select-none" onClick={() => go("home")}>My E-Commerce Store</h1>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
          {publicBtns.map(b => (
            <button key={b.page} onClick={() => go(b.page)} style={{padding:"4px 12px",borderRadius:6,background:b.color,color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600}}>{b.label}</button>
          ))}
          <button onClick={() => go("cart")} style={{padding:"4px 12px",borderRadius:6,background:"#ca8a04",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600}}>Cart ({safeCartCount})</button>
          {!loggedIn ? (
            <button onClick={() => go("login")} style={{padding:"4px 12px",borderRadius:6,background:"#1e293b",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600}}>Login</button>
          ) : (
            <>
              <button onClick={() => go("dashboard")} style={{padding:"4px 12px",borderRadius:6,background:"#4f46e5",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600}}>Dashboard</button>
              <button onClick={() => go("my-profile")} style={{padding:"4px 12px",borderRadius:6,background:"#475569",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600}}>👤 My Profile</button>
              {roleBtns.map(b => (
                <button key={b.page} onClick={() => go(b.page)} style={{padding:"4px 12px",borderRadius:6,background:b.color,color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600}}>{b.label}</button>
              ))}
              {role !== "admin" && (
                <button onClick={() => go("my-users")} style={{padding:"4px 12px",borderRadius:6,background:"#0d9488",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600}}>Created Users</button>
              )}
              {orderBtn && (
                <button onClick={() => go(orderBtn.page)} style={{padding:"4px 12px",borderRadius:6,background:orderBtn.color,color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600}}>{orderBtn.label}</button>
              )}
              <button onClick={() => { logout && logout(); go("home") }} style={{padding:"4px 12px",borderRadius:6,background:"#dc2626",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600}}>Logout</button>
            </>
          )}
        </div>
      </header>

      {/* ─── MOBILE NAVBAR ─── */}
      <header style={{display:isMobile?"flex":"none",alignItems:"center",justifyContent:"space-between",background:"#fff",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:16,padding:"10px 16px",position:"sticky",top:0,zIndex:100}}>
        <h1 style={{fontWeight:800,fontSize:15,color:"#1e293b",cursor:"pointer"}} onClick={() => go("home")}>My E-Commerce Store</h1>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={() => go("cart")} style={{fontSize:20,background:"none",border:"none",cursor:"pointer",position:"relative"}}>
            🛒
            {safeCartCount > 0 && <span style={{position:"absolute",top:-4,right:-6,background:"#ef4444",color:"#fff",fontSize:9,fontWeight:700,borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{safeCartCount}</span>}
          </button>
          <button onClick={() => setMenuOpen(p => !p)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,padding:4}}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* ─── MOBILE DRAWER ─── */}
      {menuOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:200,display:"flex",flexDirection:"column"}}>
          {/* Backdrop */}
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)"}} onClick={() => setMenuOpen(false)} />
          {/* Drawer */}
          <div style={{position:"absolute",top:0,right:0,width:260,height:"100%",background:"#fff",boxShadow:"-4px 0 24px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column",overflowY:"auto"}}>
            <div style={{padding:"16px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:15,color:"#1e293b"}}>Menu</span>
              <button onClick={() => setMenuOpen(false)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#64748b"}}>✕</button>
            </div>
            <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:6,flex:1}}>
              {publicBtns.map(b => (
                <button key={b.page} onClick={() => go(b.page)} style={{padding:"10px 14px",borderRadius:8,background:b.color+"15",color:b.color,border:`1px solid ${b.color}30`,cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left"}}>
                  {b.label.charAt(0).toUpperCase()+b.label.slice(1)}
                </button>
              ))}
              {loggedIn && (
                <>
                  <div style={{height:1,background:"#f1f5f9",margin:"4px 0"}} />
                  <button onClick={() => go("dashboard")} style={{padding:"10px 14px",borderRadius:8,background:"#4f46e515",color:"#4f46e5",border:"1px solid #4f46e530",cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left"}}>📊 Dashboard</button>
                  <button onClick={() => go("my-profile")} style={{padding:"10px 14px",borderRadius:8,background:"#47556915",color:"#475569",border:"1px solid #47556930",cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left"}}>👤 My Profile</button>
                  <div style={{height:1,background:"#f1f5f9",margin:"4px 0"}} />
                  {roleBtns.map(b => (
                    <button key={b.page} onClick={() => go(b.page)} style={{padding:"10px 14px",borderRadius:8,background:b.color+"15",color:b.color,border:`1px solid ${b.color}30`,cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left"}}>{b.label}</button>
                  ))}
                  {role !== "admin" && (
                    <button onClick={() => go("my-users")} style={{padding:"10px 14px",borderRadius:8,background:"#0d948815",color:"#0d9488",border:"1px solid #0d948830",cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left"}}>Created Users</button>
                  )}
                  {orderBtn && (
                    <button onClick={() => go(orderBtn.page)} style={{padding:"10px 14px",borderRadius:8,background:orderBtn.color+"15",color:orderBtn.color,border:`1px solid ${orderBtn.color}30`,cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left"}}>{orderBtn.label}</button>
                  )}
                  <div style={{height:1,background:"#f1f5f9",margin:"4px 0"}} />
                  <button onClick={() => { logout && logout(); go("home") }} style={{padding:"10px 14px",borderRadius:8,background:"#dc262615",color:"#dc2626",border:"1px solid #dc262630",cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left"}}>🚪 Logout</button>
                </>
              )}
              {!loggedIn && (
                <button onClick={() => go("login")} style={{padding:"10px 14px",borderRadius:8,background:"#1e293b",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontWeight:600}}>Login</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav style={{display:isMobile?"flex":"none",position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #e2e8f0",zIndex:50}}>
        {bottomNav.map(item => (
          <button key={item.page} onClick={() => go(item.page)}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"8px 4px",background:"none",border:"none",cursor:"pointer",gap:2}}>
            <span style={{fontSize:18}}>{item.icon}</span>
            <span style={{fontSize:9,color:"#64748b",fontWeight:600}}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ─── MOBILE BOTTOM SPACER ─── */}
      <div style={{display:isMobile?"block":"none",height:60}} />
    </>
  )
}
