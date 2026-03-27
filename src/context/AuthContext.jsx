import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

/* ================= SAFE JSON HELPER ================= */
const safeJSON = (key) => {
  try {
    const value = localStorage.getItem(key)
    if (!value || value === "undefined") return null
    return JSON.parse(value)
  } catch {
    return null
  }
}

/*
  ================= DEMO USERS (BACKUP MODE) =================
*/
const DEMO_USERS = [
  {
    id: 1,
    name: "Admin",
    email: "admin@gmail.com",
    password: "12345",
    role: "admin"
  },
  {
    id: 2,
    name: "Distributor",
    email: "distributor@gmail.com",
    password: "12345",
    role: "distributor"
  },
  {
    id: 3,
    name: "Seller",
    email: "seller@gmail.com",
    password: "12345",
    role: "seller"
  }
]

/* ================= PROVIDER ================= */
export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => safeJSON("user"))
  const [loggedIn, setLoggedIn] = useState(() => !!safeJSON("user"))
  const [loading, setLoading] = useState(false)

  /* =========================================================
     ⭐⭐⭐ NEW → AUTO TOKEN CHECK FUNCTION
  ========================================================= */
  const checkAuthStatus = async () => {
    try {

      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch(
        "http://localhost:5000/users/wallet/me",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (res.status === 401 || res.status === 403) {
        console.log("User blocked/deleted/session expired")
        logout()
      }

    } catch (err) {
      console.log("Auth status check failed:", err.message)
    }
  }

  /* ================= LOGIN ================= */
  const login = async (email, password) => {
    setLoading(true)

    try {

      /* ===== 1️⃣ REAL BACKEND LOGIN (JWT) ===== */
      try {
        const cleanEmail = email?.trim().toLowerCase()
        const cleanPassword = password?.trim()

        console.log("LOGIN TRY:", cleanEmail, cleanPassword)

        const res = await fetch("http://localhost:5000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPassword
          })
        })

        const data = await res.json()

        console.log("AUTH LOGIN RESPONSE =", data)
        console.log("LOGIN RESPONSE =", data)

        /* ⭐⭐ TEMP PASSWORD CASE ⭐⭐ */
        if (res.ok && data?.changePasswordRequired) {
          console.log("TEMP PASSWORD LOGIN DETECTED")
          return data
        }

        /* ⭐⭐ NORMAL LOGIN ⭐⭐ */
        if (res.ok && data?.success && data?.user && data?.token) {

          console.log("NORMAL LOGIN SUCCESS")

          setUser(data.user)
          setLoggedIn(true)

          localStorage.setItem("user", JSON.stringify(data.user))
          localStorage.setItem("token", data.token)

          /* 🔥 IMPORTANT — notify StoreContext */
          localStorage.setItem("auth-change", Date.now())

          /* ⭐ AUTO CHECK AFTER LOGIN */
          setTimeout(checkAuthStatus, 1500)

          return {
            success: true,
            role: data.user.role,
            token: data.token,
            user: data.user
          }
        }

        /* ⭐⭐ BACKEND ERROR MESSAGE ⭐⭐ */
        if (data?.message) {
          console.log("BACKEND MESSAGE:", data.message)
          return { success: false, message: data.message }
        }

        /* ⭐ UNKNOWN RESPONSE ⭐ */
        console.log("UNKNOWN LOGIN RESPONSE", data)
        return { success: false, message: "Unknown login response" }

      } catch (err) {
        console.log("Backend not reachable, using demo login", err)
      }

      /* ===== 2️⃣ DEMO LOGIN (FALLBACK MODE) ===== */
      const demoUser = DEMO_USERS.find(
        u =>
          u.email === email?.trim().toLowerCase() &&
          u.password === password?.trim()
      )

      if (!demoUser) {
        throw new Error("Invalid email or password")
      }

      const safeUser = {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role
      }

      setUser(safeUser)
      setLoggedIn(true)
      localStorage.setItem("user", JSON.stringify(safeUser))

      /* 🔥 IMPORTANT */
      localStorage.setItem("auth-change", Date.now())

      return {
        success: true,
        role: safeUser.role,
        user: safeUser
      }

    } catch (err) {
      console.error("Login error:", err.message)
      return { success: false, message: err.message }
    } finally {
      setLoading(false)
    }
  }

  /* ================= LOGOUT ================= */
  const logout = () => {
    console.log("LOGOUT CALLED")

    setUser(null)
    setLoggedIn(false)
    localStorage.removeItem("user")
    localStorage.removeItem("token")

    /* 🔥 IMPORTANT */
    localStorage.setItem("auth-change", Date.now())
  }

  /* ================= AUTO SYNC ================= */
  useEffect(() => {
    if (!user) setLoggedIn(false)
  }, [user])

  /* 🔥 AUTO UPDATE if another tab/login happens */
  useEffect(() => {
    const syncAuth = () => {
      const stored = safeJSON("user")
      console.log("SYNC AUTH:", stored)
      setUser(stored)
      setLoggedIn(!!stored)
    }

    window.addEventListener("storage", syncAuth)
    return () => window.removeEventListener("storage", syncAuth)
  }, [])

  /* =========================================================
     ⭐⭐⭐ NEW → AUTO CHECK EVERY 30 SEC
  ========================================================= */
  useEffect(() => {
    const interval = setInterval(checkAuthStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loggedIn,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/* ================= HOOK ================= */
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return ctx
}