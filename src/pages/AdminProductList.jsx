import { useEffect, useState } from "react"

export default function AdminProductList() {

  const [products, setProducts]   = useState([])
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(false)

  /* ⭐ Per-product selected users map: { productId: Set([uid, ...]) } */
  const [selMap, setSelMap] = useState({})

  /* ─── helpers ─── */
  const getSelected    = (pid)      => selMap[pid] || new Set()
  const isChecked      = (pid, uid) => getSelected(pid).has(uid)

  const toggle = (pid, uid) => {
    setSelMap(prev => {
      const cur = new Set(prev[pid] || [])
      cur.has(uid) ? cur.delete(uid) : cur.add(uid)
      return { ...prev, [pid]: cur }
    })
  }

  const selectAll = (pid) => {
    setSelMap(prev => ({
      ...prev,
      [pid]: new Set(users.map(u => u._id))
    }))
  }

  const clearAll = (pid) => {
    setSelMap(prev => ({ ...prev, [pid]: new Set() }))
  }

  /* ================= LOAD PRODUCTS ================= */
  const loadProducts = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch(
        "http://localhost:5000/products/all",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])

    } catch (err) {
      console.error("Product load error:", err)
    }
  }

  /* ================= LOAD USERS ================= */
  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch(
        "http://localhost:5000/users/all-for-product",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])

    } catch (err) {
      console.error("User load error:", err)
    }
  }

  useEffect(() => {
    loadProducts()
    loadUsers()
  }, [])

  /* ================= DELETE EVERYWHERE ================= */
  const deleteProduct = async (id) => {

    if (!window.confirm("Delete product everywhere?")) return

    try {
      const token = localStorage.getItem("token")

      await fetch(
        `http://localhost:5000/admin/delete-product/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      alert("Product removed everywhere ✅")
      loadProducts()

    } catch (err) {
      console.error(err)
      alert("Delete failed")
    }
  }

  /* ================= REMOVE FROM USERS ================= */
  const removeFromUsers = async (id) => {

    const selected = [...getSelected(id)]

    if (selected.length === 0) {
      alert("Select users first")
      return
    }

    try {
      const token = localStorage.getItem("token")

      const res = await fetch(
        `http://localhost:5000/admin/remove-product-users/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ userIds: selected })
        }
      )

      const data = await res.json()
      if (!res.ok) { alert(data.message || "Remove failed"); return }

      alert("Removed from selected users ✅")
      clearAll(id)
      loadProducts()

    } catch (err) {
      console.error(err)
      alert("Remove failed")
    }
  }

  /* ================= ADD TO USERS ================= */
  const addToUsers = async (id) => {

    const selected = [...getSelected(id)]

    if (selected.length === 0) {
      alert("Select users first")
      return
    }

    try {
      const token = localStorage.getItem("token")

      const res = await fetch(
        `http://localhost:5000/admin/add-product-users/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ userIds: selected })
        }
      )

      const data = await res.json()
      if (!res.ok) { alert(data.message || "Add failed"); return }

      alert(`Product added to ${selected.length} user(s) ✅`)
      clearAll(id)
      loadProducts()

    } catch (err) {
      console.error(err)
      alert("Add to users failed")
    }
  }

  return (
    <div className="bg-white p-6 rounded shadow">

      <h2 className="font-bold text-xl mb-4">
        Admin Product Manager
      </h2>

      {products.length === 0 && (
        <p>No products found</p>
      )}

      {products.map(p => {

        const selected    = getSelected(p._id)
        const selectedArr = [...selected]

        return (
          <div
            key={p._id}
            className="border p-4 mb-3 rounded bg-gray-50"
          >

            {/* ── Product title + selected count badge ── */}
            <div className="mb-2 flex justify-between items-center">
              <div>
                <b>{p.title}</b> ₹{p.price}
              </div>
              {selectedArr.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {selectedArr.length} selected
                </span>
              )}
            </div>

            {/* ── Select All / Clear ── */}
            <div className="flex gap-3 mb-1 text-xs">
              <button
                onClick={() => selectAll(p._id)}
                className="text-blue-600 underline"
              >
                Select All
              </button>
              <button
                onClick={() => clearAll(p._id)}
                className="text-gray-500 underline"
              >
                Clear
              </button>
            </div>

            {/* USER SELECT */}
            <div className="max-h-32 overflow-auto border p-2 mb-2 rounded text-sm bg-white">
              {users.map(u => (
                <label key={u._id} className="flex gap-2 items-center py-0.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked(p._id, u._id)}
                    onChange={() => toggle(p._id, u._id)}
                  />
                  <span>{u.name}</span>
                  <span className={`text-xs px-1 rounded ${
                    u.role === "distributor"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {u.role}
                  </span>
                  {u.isBlocked && (
                    <span className="text-xs text-red-500">🚫</span>
                  )}
                </label>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">

              <button
                onClick={() => addToUsers(p._id)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                ➕ Add to Users
              </button>

              <button
                onClick={() => removeFromUsers(p._id)}
                className="bg-yellow-600 text-white px-3 py-1 rounded"
              >
                Remove From Users
              </button>

              <button
                onClick={() => deleteProduct(p._id)}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete Everywhere
              </button>

            </div>
          </div>
        )
      })}
    </div>
  )
}