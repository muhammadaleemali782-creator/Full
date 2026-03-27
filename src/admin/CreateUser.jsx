import { useState } from "react"
import { useAuth } from "../context/AuthContext"

/*
  ================= CREATE USER (ADMIN / DISTRIBUTOR) =================
  ✔ Admin → create Distributor / Seller
  ✔ Distributor → create Seller only
  ✔ JWT protected
  ✔ Production safe
*/

export default function CreateUser() {
  const { user } = useAuth()

  /* ================= FORM STATE ================= */
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "seller"
  })

  const [loading, setLoading] = useState(false)

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  /* ================= HANDLE SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      return alert("All fields are required")
    }

    // 🔒 SAFETY: Role-based creation rules
    if (user?.role === "distributor" && !["distributor", "seller"].includes(form.role)) {
      return alert("Distributor sirf Distributor ya Seller bana sakta hai")
    }
    if (user?.role === "seller" && !["seller", "user"].includes(form.role)) {
      return alert("Seller sirf Seller ya User bana sakta hai")
    }

    try {
      setLoading(true)

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Session expired. Please login again.")
      }

      const res = await fetch("http://localhost:5000/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` // 🔐 JWT
        },
        body: JSON.stringify({
          parentId: user?.id,   // 🔥 IMPORTANT (Admin / Distributor)
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || data.error || "Failed to create user"
        )
      }

      alert(`${form.role.toUpperCase()} created successfully ✅`)

      // 🔄 Reset form
      setForm({
        name: "",
        email: "",
        password: "",
        role: "seller"
      })

    } catch (err) {
      console.error("Create user error:", err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */
  return (
    <div className="bg-white p-6 rounded shadow max-w-md">

      {/* ---------- HEADER ---------- */}
      <h2 className="font-bold text-lg mb-1">
        {user?.role === "distributor"
          ? "Create Distributor / Seller"
          : user?.role === "seller"
          ? "Create Seller / User"
          : "Create User"}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Logged in as: <b>{user?.name}</b> ({user?.role})
      </p>

      {/* ---------- NAME ---------- */}
      <input
        name="name"
        placeholder="Full Name"
        className="border p-2 w-full mb-2 rounded"
        value={form.name}
        onChange={handleChange}
      />

      {/* ---------- EMAIL ---------- */}
      <input
        name="email"
        placeholder="Email"
        className="border p-2 w-full mb-2 rounded"
        value={form.email}
        onChange={handleChange}
      />

      {/* ---------- PASSWORD ---------- */}
      <input
        name="password"
        type="password"
        placeholder="Password"
        className="border p-2 w-full mb-3 rounded"
        value={form.password}
        onChange={handleChange}
      />

      {/* ---------- ROLE ---------- */}
      <select
        name="role"
        className="border p-2 w-full mb-4 rounded"
        value={form.role}
        onChange={handleChange}
      >
        {/* Admin → sab bana sakta hai */}
        {user?.role === "admin" && (
          <>
            <option value="distributor">Distributor</option>
            <option value="seller">Seller</option>
            <option value="user">User</option>
          </>
        )}
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
      </select>

      {/* ---------- BUTTON ---------- */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-2 rounded text-white font-semibold transition ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Creating..." : "Create User"}
      </button>
    </div>
  )
}
