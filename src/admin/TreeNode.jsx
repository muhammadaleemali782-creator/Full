const ROLE_SORT = { distributor: 0, seller: 1, user: 2, admin: 3 }

function TreeNode({ node, onSelect, depth = 0, visited = new Set() }) {

  if (!node) return null

  const safeNode = node || {}
  const nodeId = safeNode.id || safeNode._id || `node-${Math.random().toString(36).slice(2)}`

  if (visited.has(nodeId)) {
    console.warn("Cycle detected:", nodeId)
    return null
  }

  const newVisited = new Set(visited)
  newVisited.add(nodeId)

  const roleClass =
    safeNode.role === "admin"        ? "admin"
    : safeNode.role === "distributor"? "distributor"
    : safeNode.role === "seller"     ? "seller"
    : "user"

  const children     = Array.isArray(safeNode.children) ? safeNode.children : []

  /* ⭐ Sort: distributors LEFT, sellers RIGHT, users last */
  const safeChildren = children
    .filter((c) => c && (c.id || c._id))
    .sort((a, b) => (ROLE_SORT[a.role] ?? 9) - (ROLE_SORT[b.role] ?? 9))

  const safeName     = safeNode.name || "Unnamed"
  const safeRole     = safeNode.role || "user"

  const handleClick = () => {
    if (!onSelect) return
    try { onSelect(safeNode) } catch (e) { console.error("onSelect error:", e) }
  }

  return (
    <div
      className="tree-node"
      data-nodeid={nodeId}
      data-depth={depth}
    >

      {/* ── NODE PILL ── */}
      <div
        className={`node-circle ${roleClass}`}
        onClick={handleClick}
        title="Click to view analytics"
        style={{ cursor: onSelect ? "pointer" : "default" }}
      >
        <div className="font-medium">{safeName}</div>
        <div className="text-xs opacity-70">({safeRole})</div>
      </div>

      {/* ── CHILDREN ── */}
      {safeChildren.length > 0 && (
        <div className="children">
          {safeChildren.map((child, i) => (
            <TreeNode
              key={child.id || child._id || `${nodeId}-${i}`}
              node={child}
              onSelect={onSelect}
              depth={depth + 1}
              visited={newVisited}
            />
          ))}
        </div>
      )}

      {safeChildren.length === 0 && (
        <div className="leaf-placeholder" data-leaf="true" />
      )}

    </div>
  )
}

export default TreeNode
