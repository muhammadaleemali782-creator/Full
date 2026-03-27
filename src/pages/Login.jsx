import { useState } from "react"
import { useAuth } from "../context/AuthContext"

export default function Login({ setPage }) {
  const { login, loading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  /* ⭐ NEW STATES */
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [userId, setUserId] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")

  const handleLogin = async () => {
    setError("")

    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    try {
      const result = await login(
        email.trim().toLowerCase(),
        password.trim()
      )

      console.log("LOGIN RESPONSE =", result)

      /* ⭐ TEMP PASSWORD CHECK FIRST */
      if (result?.changePasswordRequired) {
        setShowChangePassword(true)
        setUserId(result.userId)
        setError("Please set new password")
        return
      }

      if (!result || !result.success) {
        setError(result?.message || "Invalid login credentials")
        return
      }

      /* ================= SAVE TOKEN ================= */
      if (result.token) {
        localStorage.setItem("token", result.token)
      }

      /* ================= ROLE REDIRECT ================= */
      const role = result.role || result.user?.role

      if (role === "admin") {
        setPage("admin")
      } else if (role === "seller" || role === "distributor") {
        setPage("dashboard")
      } else {
        setPage("home")
      }

    } catch (err) {
      console.error("LOGIN ERROR:", err)
      setError("Login failed")
    }
  }

  /* ⭐ CHANGE PASSWORD FUNCTION */
  const changePassword = async () => {
    if (!newPass || !confirmPass) {
      setError("Enter new password")
      return
    }

    if (newPass !== confirmPass) {
      setError("Passwords do not match")
      return
    }

    try {
      const res = await fetch(
        "http://localhost:5000/users/change-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            newPassword: newPass.trim()
          })
        }
      )

      const data = await res.json()

      if (!data.success) {
        setError(data.message || "Password change failed")
        return
      }

      alert("Password changed ✅ Please login again")

      setShowChangePassword(false)
      setEmail("")
      setPassword("")
      setNewPass("")
      setConfirmPass("")
      setError("")

    } catch (err) {
      console.error(err)
      setError("Error changing password")
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow w-96 mx-auto mt-20">
      <h2 className="text-xl font-bold mb-4 text-center">
        Login to Dashboard
      </h2>

              {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-3 text-sm">

            <div>{error}</div>

            {/* ⭐ NEW MESSAGE */}
            <div className="mt-1 text-xs text-gray-700">
              Please contact admin for resetting your user ID.
            </div>

            {/* ⭐ CONTACT ADMIN BUTTON */}
            <button
              onClick={() => setPage("password-help")}
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
            >
              Contact Admin
            </button>

          </div>
        )}

      {/* ================= NORMAL LOGIN ================= */}
      {!showChangePassword && (
        <>
          <input
            className="border p-2 w-full mb-3 rounded"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            className="border p-2 w-full mb-4 rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-2 rounded text-white font-semibold ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </>
      )}

      {/* ================= CHANGE PASSWORD ================= */}
      {showChangePassword && (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-bold mb-3 text-center">
            Set New Password 🔒
          </h3>

          <input
            className="border p-2 w-full mb-3 rounded"
            type="password"
            placeholder="New Password"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
          />

          <input
            className="border p-2 w-full mb-4 rounded"
            type="password"
            placeholder="Confirm Password"
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
          />

          <button
            onClick={changePassword}
            className="w-full py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
          >
            Save New Password
          </button>
        </div>
      )}
    </div>
  )
}



