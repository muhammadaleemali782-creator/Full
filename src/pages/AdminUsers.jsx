import { useEffect, useState } from "react"
import { getRoleLabel } from "../utils/roleLabels"

export default function AdminUsers() {

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)  // ⭐ detail modal

  /* =====================================================
     NEW STATE FOR AUTO REFRESH
  ===================================================== */

  const [refreshKey,setRefreshKey] = useState(0)

  /* =====================================================
     LOAD USERS
  ===================================================== */
  const loadUsers = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("No token found")
        return
      }

      const res = await fetch(
        "http://localhost:5000/users/all-for-product",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      let data = []
      try {
        data = await res.json()
      } catch {
        console.warn("Invalid JSON response")
      }

      if (!res.ok) {
        console.error("Failed to load users:", data)
        return
      }

      if (Array.isArray(data)) {
        setUsers(data)
      }

    } catch (err) {
      console.error("Load users error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  /* =====================================================
     AUTO REFRESH
  ===================================================== */

  useEffect(()=>{
    setRefreshKey(prev=>prev+1)
  },[users])

  /* =====================================================
     BLOCK / UNBLOCK USER
  ===================================================== */
  const toggleBlock = async (id, isBlocked) => {
    try {

      const token = localStorage.getItem("token")
      if (!token) {
        alert("Login again")
        return
      }

      setActionLoading(id)

      const url = isBlocked
        ? `http://localhost:5000/admin/unblock-user/${id}`
        : `http://localhost:5000/admin/block-user/${id}`

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      let data = {}
      try {
        data = await res.json()
      } catch {}

      if (!res.ok) {
        alert(data.message || "Action failed")
        return
      }

      await loadUsers()

    } catch (err) {
      console.error("Toggle block error:", err)
      alert("Something went wrong")
    } finally {
      setActionLoading(null)
    }
  }

  /* =====================================================
     DELETE USER (SOFT DELETE)
  ===================================================== */
  const deleteUser = async (id) => {
    try {

      if (!window.confirm("Soft delete this user?"))
        return

      const token = localStorage.getItem("token")
      if (!token) {
        alert("Login again")
        return
      }

      setActionLoading(id)

      const res = await fetch(
        `http://localhost:5000/admin/delete-user/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      let data = {}
      try {
        data = await res.json()
      } catch {}

      if (!res.ok) {
        alert(data.message || "Delete failed")
        return
      }

      await loadUsers()

    } catch (err) {
      console.error("Delete error:", err)
      alert("Something went wrong")
    } finally {
      setActionLoading(null)
    }
  }

  /* =====================================================
     RESTORE USER
  ===================================================== */
  const restoreUser = async (id) => {
    try {

      const token = localStorage.getItem("token")
      if (!token) {
        alert("Login again")
        return
      }

      setActionLoading(id)

      const res = await fetch(
        `http://localhost:5000/admin/restore-user/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      let data = {}
      try {
        data = await res.json()
      } catch {}

      if (!res.ok) {
        alert(data.message || "Restore failed")
        return
      }

      await loadUsers()

    } catch (err) {
      console.error("Restore error:", err)
      alert("Something went wrong")
    } finally {
      setActionLoading(null)
    }
  }

  /* =====================================================
     PERMANENT DELETE USER
  ===================================================== */
  const permanentDeleteUser = async (id) => {
    try {

      if (!window.confirm("Permanently delete this user? This cannot be undone."))
        return

      const token = localStorage.getItem("token")
      if (!token) {
        alert("Login again")
        return
      }

      setActionLoading(id)

      const res = await fetch(
        `http://localhost:5000/admin/permanent-delete-user/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      let data = {}
      try {
        data = await res.json()
      } catch {}

      if (!res.ok) {
        alert(data.message || "Permanent delete failed")
        return
      }

      await loadUsers()

    } catch (err) {
      console.error("Permanent delete error:", err)
      alert("Something went wrong")
    } finally {
      setActionLoading(null)
    }
  }

  /* =====================================================
     ⭐ RESET PASSWORD (NEW)
  ===================================================== */

  const resetPassword = async (id) => {

    try{

      if(!window.confirm("Generate temporary password for this user?"))
        return

      const token = localStorage.getItem("token")

      const res = await fetch(
        `http://localhost:5000/admin/reset-password/${id}`,
        {
          method:"PUT",
          headers:{
            Authorization:`Bearer ${token}`
          }
        }
      )

      const data = await res.json()

      if(!res.ok){
        alert(data.message || "Password reset failed")
        return
      }

      alert("Temporary password: " + data.tempPassword)

    }
    catch(err){
      console.error("Reset password error:",err)
      alert("Something went wrong")
    }

  }

  /* =====================================================
     UI
  ===================================================== */

  const activeUsers = users.filter(u => !u.isDeleted)
  const deletedUsers = users.filter(u => u.isDeleted)

  return (
    <div className="bg-white p-6 rounded shadow">

      <h2 className="text-xl font-bold mb-4">
        Admin Users
      </h2>

      {loading && (
        <div className="mb-4 text-blue-600 font-semibold">
          Loading users...
        </div>
      )}

      {/* ================= ACTIVE USERS ================= */}
      <h3 className="text-lg font-semibold mb-2">
        Active Users
      </h3>

      {activeUsers.length === 0 && (
        <div className="text-gray-500 mb-4">
          No active users found
        </div>
      )}

      {activeUsers.map(user => (
        <div
          key={user._id + refreshKey}
          className="flex justify-between items-center border p-3 mb-2 rounded"
        >
          <div>
            <b>{user.name}</b> ({getRoleLabel(user.role)})

            <div className="text-xs text-gray-500">
              {user.email}
            </div>

            <div className="text-sm mt-1">
              {user.isBlocked ? (
                <span className="text-red-600 font-semibold">
                  🚫 Blocked
                </span>
              ) : (
                <span className="text-green-600 font-semibold">
                  ✅ Active
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">

            <button
              onClick={() => setSelectedUser(user)}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              👁 View
            </button>

            <button
              disabled={actionLoading === user._id}
              onClick={() => toggleBlock(user._id, user.isBlocked)}
              className="bg-yellow-500 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              {user.isBlocked ? "Unblock" : "Block"}
            </button>

            <button
              disabled={actionLoading === user._id}
              onClick={() => deleteUser(user._id)}
              className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Delete
            </button>

            <button
              onClick={()=>resetPassword(user._id)}
              className="bg-purple-600 text-white px-3 py-1 rounded"
            >
              Reset Password
            </button>

          </div>
        </div>
      ))}

      {/* ================= DELETED USERS ================= */}
      <h3 className="text-lg font-semibold mt-6 mb-2">
        Deleted Users
      </h3>

      {deletedUsers.length === 0 && (
        <div className="text-gray-500">
          No deleted users
        </div>
      )}

      {deletedUsers.map(user => (
        <div
          key={user._id}
          className="flex justify-between items-center border p-3 mb-2 rounded bg-gray-100"
        >
          <div>
            <b>{user.name}</b> ({getRoleLabel(user.role)})
            <div className="text-sm mt-1 text-gray-600 font-semibold">
              🗑 Deleted
            </div>
          </div>

          <div className="flex gap-2">
            <button
              disabled={actionLoading === user._id}
              onClick={() => restoreUser(user._id)}
              className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Restore
            </button>

            <button
              disabled={actionLoading === user._id}
              onClick={() => permanentDeleteUser(user._id)}
              className="bg-black text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Permanent Delete
            </button>
          </div>
        </div>
      ))}

      {/* =====================================================
          ⭐ USER DETAIL MODAL — inside return, fixed
      ===================================================== */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">

            {/* Close */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl"
            >✕</button>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {(selectedUser.fullName || selectedUser.name || "?")[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedUser.fullName || selectedUser.name}
                </h2>
                <p className="text-xs font-mono text-gray-400">{selectedUser.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  selectedUser.role === "distributor" ? "bg-purple-100 text-purple-700" :
                  selectedUser.role === "seller"      ? "bg-blue-100 text-blue-700" :
                  selectedUser.role === "user"        ? "bg-green-100 text-green-700" :
                                                        "bg-gray-100 text-gray-600"
                }`}>
                  {getRoleLabel(selectedUser.role)}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 items-start">
                <span className="text-gray-400 w-28 shrink-0">📧 Email</span>
                <span className="font-medium text-gray-700 break-all">{selectedUser.email || "—"}</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-gray-400 w-28 shrink-0">📞 Phone</span>
                <span className="font-medium text-gray-700">{selectedUser.phone || "—"}</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-gray-400 w-28 shrink-0">📍 Address</span>
                <span className="font-medium text-gray-700">{selectedUser.address || "—"}</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-gray-400 w-28 shrink-0">🆔 System ID</span>
                <span className="font-mono text-blue-700 font-semibold">{selectedUser.name}</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-gray-400 w-28 shrink-0">👆 Reports To</span>
                <span className="font-medium text-gray-700">
                  {users.find(u => String(u._id) === String(selectedUser.parentId))?.name || "—"}
                </span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-gray-400 w-28 shrink-0">📅 Joined</span>
                <span className="font-medium text-gray-700">
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric"
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-gray-400 w-28 shrink-0">🔰 Status</span>
                {selectedUser.isBlocked
                  ? <span className="text-red-600 font-semibold">🚫 Blocked</span>
                  : <span className="text-green-600 font-semibold">✅ Active</span>
                }
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
