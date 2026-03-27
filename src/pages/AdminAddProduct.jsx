import { useState, useRef, useEffect } from "react"
import { useStore } from "../context/StoreContext"

export default function AdminAddProduct() {

  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const fileRef = useRef(null)

  const { fetchProducts } = useStore()

  /* ⭐⭐⭐ NEW STATES — USER ASSIGN FEATURE */
  const [users, setUsers] = useState([])
  const [assignAllUsers, setAssignAllUsers] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])

  /* ⭐⭐⭐ LOAD USERS */
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const res = await fetch("http://localhost:5000/users/all-for-product", {
          headers: { Authorization: `Bearer ${token}` }
        })

        const data = await res.json()
        if (Array.isArray(data)) setUsers(data)

      } catch (err) {
        console.error("User load error:", err)
      }
    }

    loadUsers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return

    if (!title.trim() || !price.trim()) {
      alert("Please enter title & price")
      return
    }

    if (Number(price) <= 0) {
      alert("Price must be greater than 0")
      return
    }

    try {
      setLoading(true)

      const token = localStorage.getItem("token")
      if (!token) {
        alert("Please login again")
        return
      }

      const formData = new FormData()
      formData.append("title", title.trim())
      formData.append("price", price.trim())
      if (image) formData.append("image", image)

      /* ⭐⭐⭐ NEW ADD HERE */
      formData.append("assignAllUsers", assignAllUsers)
      formData.append("userIds", JSON.stringify(selectedUsers))

      console.log("🔥 Sending product:", title, price)
      console.log("🔥 Assign All:", assignAllUsers)
      console.log("🔥 Selected Users:", selectedUsers)

      const res = await fetch(
        "http://localhost:5000/admin/add-product",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      )

      let data = {}
      try {
        data = await res.json()
      } catch {
        console.warn("⚠️ Invalid JSON response")
      }

      if (!res.ok) {
        console.error("❌ Backend error:", data)
        alert(data.message || "Error adding product")
        return
      }

      console.log("✅ Product saved:", data)

      alert("Product added in MongoDB ✅")

      await fetchProducts()

      setTitle("")
      setPrice("")
      setImage(null)
      setAssignAllUsers(false)
      setSelectedUsers([])

      if (fileRef.current) fileRef.current.value = ""

    } catch (err) {
      console.error("❌ Add product error:", err)
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow max-w-md space-y-3"
    >
      <h2 className="font-bold text-xl">Add Product</h2>

      <input
        className="border p-2 w-full"
        placeholder="Product name"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <input
        className="border p-2 w-full"
        placeholder="Price"
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
      />

      <input
        type="file"
        ref={fileRef}
        onChange={e => setImage(e.target.files[0])}
      />

      {/* ⭐⭐⭐ USER ASSIGN UI */}
      {users.length > 0 && (
        <div className="border p-3 rounded bg-gray-50">

          <h3 className="font-semibold mb-2">
            Assign Product To Users
          </h3>

          <label className="flex gap-2 items-center mb-2">
            <input
              type="checkbox"
              checked={assignAllUsers}
              onChange={(e) => {
                setAssignAllUsers(e.target.checked)
                if (e.target.checked) {
                  setSelectedUsers(users.map(u => u._id))
                } else {
                  setSelectedUsers([])
                }
              }}
            />
            Assign ALL Users
          </label>

          {!assignAllUsers && (
            <div className="max-h-40 overflow-auto border p-2 rounded space-y-1">
              {users.map(u => (
                <label key={u._id} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u._id)}
                    onChange={() => {
                      setSelectedUsers(prev =>
                        prev.includes(u._id)
                          ? prev.filter(id => id !== u._id)
                          : [...prev, u._id]
                      )
                    }}
                  />
                  {u.name} ({u.role})
                </label>
              ))}
            </div>
          )}

        </div>
      )}

      <button
        disabled={loading}
        className={`bg-blue-600 text-white w-full py-2 rounded ${
          loading ? "opacity-50" : ""
        }`}
      >
        {loading ? "Adding..." : "Add Product"}
      </button>
    </form>
  )
}


