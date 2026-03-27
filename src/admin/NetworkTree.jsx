import { useStore } from "../context/StoreContext"
import { useEffect, useState, useMemo } from "react"

export default function NetworkTree() {
  const { users = [] } = useStore() // ✅ safe default

  /* ⭐⭐⭐ NEW STATE FOR LIVE REFRESH */
  const [refreshKey, setRefreshKey] = useState(0)

  /* ⭐⭐⭐ NEW COLLAPSE STATE */
  const [collapsed, setCollapsed] = useState({})

  /* ⭐⭐⭐ AUTO REFRESH WHEN USERS CHANGE */
  useEffect(() => {
    setRefreshKey(prev => prev + 1)
  }, [users])

  /* ⭐⭐⭐ SAFE USERS (Hide permanently deleted if needed) */
  const safeUsers = useMemo(() => {
    return users.filter(u => !u?.permanentlyDeleted)
  }, [users])

  /* ⭐⭐⭐ ROOT DETECTION */
  const rootUsers = useMemo(() => {
    return safeUsers.filter(
      u => !u.parentId || u.parentId === null
    )
  }, [safeUsers])

  /* ⭐⭐⭐ TOGGLE COLLAPSE */
  const toggleCollapse = (id) => {
    setCollapsed(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  /* ================= RECURSIVE TREE ================= */
  const renderTree = (parentId, level = 0) => {
    return safeUsers
      .filter(
        u =>
          String(u?.parentId) === String(parentId)
      )
      .map(u => {
        const userId = u.id || u._id

        /* ⭐ STATUS FLAGS */
        const isBlocked = u?.isBlocked
        const isDeleted = u?.isDeleted

        /* ⭐ ROLE COLOR */
        const roleColor =
          u.role === "admin"
            ? "border-purple-500"
            : u.role === "distributor"
            ? "border-blue-500"
            : "border-green-500"

        /* ⭐ NODE STYLE BASED ON STATUS */
        const nodeStyle =
          isDeleted
            ? "bg-gray-200 text-gray-500 line-through"
            : isBlocked
            ? "bg-red-100 text-red-700"
            : "bg-white text-gray-800"

        const badge =
          isDeleted
            ? "🗑 Deleted"
            : isBlocked
            ? "🚫 Blocked"
            : "✅ Active"

        const hasChildren = safeUsers.some(
          child => String(child?.parentId) === String(userId)
        )

        return (
          <div
            key={userId + refreshKey}
            style={{ marginLeft: level * 28 }}
            className="mt-3 transition-all duration-300"
          >
            {/* NODE */}
            <div
              className={`flex items-center justify-between gap-3 px-4 py-2 rounded-xl border-2 shadow-sm hover:shadow-md transition ${roleColor} ${nodeStyle}`}
            >
              <div className="flex items-center gap-2">

                {hasChildren && (
                  <button
                    onClick={() => toggleCollapse(userId)}
                    className="text-xs bg-gray-200 px-1 rounded"
                  >
                    {collapsed[userId] ? "+" : "-"}
                  </button>
                )}

                <span className="font-semibold">
                  {u.name || "Unnamed"}
                </span>

                <span className="text-xs text-gray-500">
                  ({u.role || "user"})
                </span>
              </div>

              {/* STATUS BADGE */}
              <span className="text-xs font-semibold">
                {badge}
              </span>
            </div>

            {/* CHILDREN */}
            {!collapsed[userId] && hasChildren && (
              <div className="ml-4 border-l-2 border-gray-300 pl-4">
                {renderTree(userId, level + 1)}
              </div>
            )}
          </div>
        )
      })
  }

  /* ================= UI ================= */
  return (
    <div className="mt-6 bg-white p-6 rounded-2xl shadow-xl border">

      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-xl">
          🌳 Network Tree
        </h3>

        <div className="text-sm text-gray-500 flex gap-4">
          <span>Total: {safeUsers.length}</span>
          <span className="text-green-600">
            Active: {safeUsers.filter(u => !u.isBlocked && !u.isDeleted).length}
          </span>
          <span className="text-red-600">
            Blocked: {safeUsers.filter(u => u.isBlocked).length}
          </span>
          <span className="text-gray-600">
            Deleted: {safeUsers.filter(u => u.isDeleted).length}
          </span>
        </div>
      </div>

      {safeUsers.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No members yet
        </p>
      ) : (
        rootUsers.map(root =>
          renderTree(root._id, 0)
        )
      )}
    </div>
  )
}