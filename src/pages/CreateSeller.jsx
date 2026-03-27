import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useStore } from "../context/StoreContext"
import ProductAssignSection from "../components/ProductAssignSection"

export default function CreateSeller() {

  const { user } = useAuth()
  const { fetchProducts } = useStore()   // 🔥 important

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("seller")

  /* ================= ASSIGNED PRODUCTS ================= */
  const [assignedProducts, setAssignedProducts] = useState([])

  const [loading, setLoading] = useState(false)

  /* ================= LOAD PRODUCTS ================= */
  useEffect(() => {
    fetchProducts()   // 🔥 seller create page me products load honge
  }, [])

  /* ================= SAFETY ================= */
  if (!user) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <p className="text-red-500 font-semibold">
          Unauthorized access. Please login again.
        </p>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Please fill all fields")
      return
    }

    try {
      setLoading(true)

      const token = localStorage.getItem("token")
      if (!token) {
        alert("Please login again")
        return
      }

      /* 🔥 ensure product ids array */
      const cleanProducts = assignedProducts.map(id => String(id))

      const res = await fetch("http://localhost:5000/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          assignedProducts: cleanProducts   // 🔥 important fix
        })
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || "User creation failed")
        return
      }

      alert("Seller created successfully!")

      /* ================= RESET ================= */
      setName("")
      setEmail("")
      setPassword("")
      setAssignedProducts([])

    } catch (err) {
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded shadow max-w-md">
      <h2 className="text-xl font-bold mb-4">
        {user?.role === "distributor" ? "Create Distributor / Seller" : "Create Seller / User"}
      </h2>

      <form onSubmit={handleSubmit}>

        <input
          className="border p-2 w-full mb-3"
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-3"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 w-full mb-3"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <select
          className="border p-2 w-full mb-3"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          {/* Distributor → Distributor ya Seller bana sakta hai */}
          {user?.role === "distributor" && (
            <>
              <option value="distributor">Distributor</option>
              <option value="seller">Seller</option>
            </>
          )}
          {/* Seller → Seller ya User bana sakta hai */}
          {user?.role === "seller" && (
            <>
              <option value="seller">Seller</option>
              <option value="user">User</option>
            </>
          )}
          {/* Admin → sab bana sakta hai */}
          {user?.role === "admin" && (
            <>
              <option value="distributor">Distributor</option>
              <option value="seller">Seller</option>
              <option value="user">User</option>
            </>
          )}
        </select>

        {/* 🔥 PRODUCT ASSIGN SECTION — only for seller/distributor */}
        {(role === "seller" || role === "distributor") && (
          <ProductAssignSection onChange={setAssignedProducts} />
        )}

        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white w-full py-2 rounded mt-4 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Creating..." : "Create User"}
        </button>

      </form>
    </div>
  )
}
