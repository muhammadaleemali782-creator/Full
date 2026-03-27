import { useState, useMemo, useRef, useEffect } from "react"
import TreeNode from "./TreeNode"
import "./tree.css"

/* ─── helpers ─── */
function collectAllNodes(node, result = []) {
  if (!node) return result
  result.push({ id: node.id || node._id || "", name: node.name || "Unnamed", role: node.role || "user" })
  if (Array.isArray(node.children)) node.children.forEach(c => collectAllNodes(c, result))
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

/* Filter: sirf selected node ke direct children filter honge by role,
   lekin har matching child ka POORA subtree intact rahega */
function filterTopByRole(node, role) {
  if (!node) return null
  const filteredChildren = (node.children || []).filter(c => c.role === role)
  return { ...node, children: filteredChildren }
}

const ROLE_ORDER = { admin: 0, distributor: 1, seller: 2, user: 3 }

const ROLE_COLORS = {
  admin:       { bg: "#f5f3ff", border: "#7c3aed", text: "#5b21b6", dot: "#7c3aed" },
  distributor: { bg: "#ecfdf5", border: "#059669", text: "#064e3b", dot: "#059669" },
  seller:      { bg: "#eff6ff", border: "#2563eb", text: "#1e3a8a", dot: "#2563eb" },
  user:        { bg: "#f9fafb", border: "#94a3b8", text: "#374151", dot: "#94a3b8" },
}
const rc = (role) => ROLE_COLORS[role] || ROLE_COLORS.user

/* ─── contextual role tabs per node role ─── */
function getRoleTabs(nodeRole) {
  if (!nodeRole || nodeRole === "admin") {
    return [
      { key: "all",         label: "All"          },
      { key: "distributor", label: "Distributors" },
      { key: "seller",      label: "Sellers"      },
    ]
  }
  if (nodeRole === "distributor") {
    return [
      { key: "all",         label: "All"          },
      { key: "distributor", label: "Distributors" },
      { key: "seller",      label: "Sellers"      },
    ]
  }
  if (nodeRole === "seller") {
    return [
      { key: "all",    label: "All"     },
      { key: "seller", label: "Sellers" },
      { key: "user",   label: "Users"   },
    ]
  }
  return [{ key: "all", label: "All" }]
}

export default function VisualTree({ data = [], onSelect }) {
  const [selectedId, setSelectedId] = useState(null)
  const [roleFilter, setRoleFilter] = useState("all")
  const [search, setSearch]         = useState("")
  const [dropOpen, setDropOpen]     = useState(false)
  const dropRef                     = useRef(null)

  const safeData = Array.isArray(data) ? data : []

  /* close dropdown on outside click */
  useEffect(() => {
    const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const allNodes = useMemo(() => {
    const list = []
    safeData.forEach(root => collectAllNodes(root, list))
    return list
  }, [safeData])

  const filteredNodes = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allNodes
      .filter(n => n.name.toLowerCase().includes(q) || n.role.toLowerCase().includes(q))
      .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9))
  }, [search, allNodes])

  const selectedNode = allNodes.find(n => String(n.id) === String(selectedId))

  /* subtree to display */
  const displayRoots = useMemo(() => {
    let roots = safeData

    if (selectedId) {
      for (const root of safeData) {
        const found = findNodeById(root, selectedId)
        if (found) { roots = [found]; break }
      }
    }

    if (roleFilter !== "all") {
      roots = roots.map(r => filterTopByRole(r, roleFilter)).filter(Boolean)
    }

    return roots.map((root, i) => ({
      ...root,
      id:       root?.id || root?._id || `root-${i}`,
      name:     root?.name || "Unnamed",
      role:     root?.role || "user",
      children: Array.isArray(root?.children) ? root.children : [],
    }))
  }, [selectedId, roleFilter, safeData])

  const roleTabs = getRoleTabs(selectedNode?.role)

  const handleSelectNode = (id) => {
    setSelectedId(id)
    setRoleFilter("all")
    setDropOpen(false)
    setSearch("")
  }

  const handleReset = () => {
    setSelectedId(null)
    setRoleFilter("all")
  }

  if (safeData.length === 0) return <p className="text-gray-500 text-sm">No network hierarchy available</p>

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>

      {/* ══ SELECT NODE BAR ══ */}
      <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", padding: "12px 16px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>

        <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>🔍 Select Node:</span>

        {/* Dropdown */}
        <div style={{ position: "relative" }} ref={dropRef}>
          <button
            onClick={() => setDropOpen(p => !p)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "7px 14px", borderRadius: "8px",
              border: `2px solid ${selectedNode ? rc(selectedNode.role).border : "#cbd5e1"}`,
              background: selectedNode ? rc(selectedNode.role).bg : "#f8fafc",
              color: selectedNode ? rc(selectedNode.role).text : "#64748b",
              fontWeight: selectedNode ? 700 : 500, fontSize: "13px", cursor: "pointer",
              minWidth: "200px", justifyContent: "space-between",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              {selectedNode && <span style={{ width: 8, height: 8, borderRadius: "50%", background: rc(selectedNode.role).dot, display: "inline-block" }} />}
              {selectedNode ? <>{selectedNode.name} <span style={{ opacity: 0.6, fontSize: "11px" }}>({selectedNode.role})</span></> : "— Select a node —"}
            </span>
            <span style={{ fontSize: "10px" }}>{dropOpen ? "▲" : "▼"}</span>
          </button>

          {dropOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100, background: "#fff", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0", minWidth: "260px", overflow: "hidden" }}>
              {/* search */}
              <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: "#94a3b8" }}>⌕</span>
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name or role…"
                  style={{ border: "none", outline: "none", fontSize: "13px", flex: 1, background: "transparent", color: "#334155" }}
                />
                {search && <button onClick={() => setSearch("")} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", fontSize: "13px" }}>✕</button>}
              </div>
              {/* options */}
              <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                {filteredNodes.length === 0 && <div style={{ padding: "14px", color: "#94a3b8", fontSize: "13px", textAlign: "center" }}>No results</div>}
                {filteredNodes.map(n => {
                  const c = rc(n.role)
                  const active = String(n.id) === String(selectedId)
                  return (
                    <div key={n.id} onClick={() => handleSelectNode(n.id)}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 14px", cursor: "pointer", background: active ? c.bg : "transparent", borderLeft: `3px solid ${active ? c.border : "transparent"}`, transition: "background 0.1s" }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f8fafc" }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: "13px", color: c.text, flex: 1 }}>{n.name}</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: c.dot, background: `${c.dot}18`, padding: "2px 8px", borderRadius: "99px" }}>{n.role}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reset */}
        {(selectedId || roleFilter !== "all") && (
          <button onClick={handleReset} style={{ padding: "7px 14px", borderRadius: "8px", border: "2px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
            ✕ Reset
          </button>
        )}
      </div>

      {/* ══ CONTEXTUAL ROLE FILTER TABS ══ */}
      <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)", padding: "10px 16px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>👥 Show only:</span>
        {roleTabs.map(tab => {
          const isActive = roleFilter === tab.key
          const c = tab.key === "all" ? { bg: "#f1f5f9", border: "#94a3b8", text: "#334155", dot: "#94a3b8" } : rc(tab.key)
          return (
            <button key={tab.key} onClick={() => setRoleFilter(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 14px", borderRadius: "8px",
                border: `2px solid ${isActive ? c.border : "#e2e8f0"}`,
                background: isActive ? c.bg : "#f8fafc",
                color: isActive ? c.text : "#64748b",
                fontWeight: isActive ? 700 : 500, fontSize: "13px", cursor: "pointer",
                boxShadow: isActive ? `0 0 0 3px ${c.dot}22` : "none",
                transition: "all 0.15s",
              }}
            >
              {tab.key !== "all" && <span style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? c.dot : "#94a3b8", display: "inline-block" }} />}
              {tab.label}
            </button>
          )
        })}

        {/* Active badge */}
        {selectedNode && (
          <span style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>
            {roleFilter === "all"
              ? <>Subtree of <strong style={{ color: rc(selectedNode.role).text }}>{selectedNode.name}</strong></>
              : <><strong style={{ color: rc(selectedNode.role).text }}>{selectedNode.name}</strong> → only <strong style={{ color: rc(roleFilter).text }}>{roleFilter}s</strong></>
            }
          </span>
        )}
      </div>

      {/* ══ TREE ══ */}
      <div className="tree-wrapper">
        {displayRoots.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: "14px", padding: "32px" }}>Koi node nahi mila is filter mein</div>
        ) : (
          displayRoots.map((root, i) => (
            <TreeNode key={root.id || `root-${i}`} node={root} onSelect={onSelect} depth={0} />
          ))
        )}
        <div className="text-xs text-gray-400 mt-4 text-center">
          Total root nodes: {displayRoots.length}<br />
          Tree rendered at: {new Date().toLocaleTimeString()}
        </div>
      </div>

    </div>
  )
}
