import { useState, useEffect } from "react"
import Navbar from "./components/Navbar"

// ================= PAGES =================
import Home from "./pages/Home"
import Store from "./pages/Store"
import Services from "./pages/Services"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import Orders from "./pages/Orders"
import Login from "./pages/Login"
import Admin from "./pages/Admin"
import AdminProductList from "./pages/AdminProductList"
import AdminUsers from "./pages/AdminUsers"
import PasswordHelp from "./pages/PasswordHelp"
import AdminPasswordReset from "./pages/AdminPasswordReset"

// ✅ NEW PAGE (IMPORTANT)
import AdminAddProduct from "./pages/AdminAddProduct"

// ✅ REQUEST PAGES
import AdminRequests from "./pages/AdminRequests"
import AdminEmailSettings from "./pages/AdminEmailSettings"
import RaiseRequest from "./pages/RaiseRequest"
import AdminRequestsHistory from "./pages/AdminRequestsHistory"
import MyCreatedUsers from "./pages/MyCreatedUsers"

// ================= DASHBOARDS =================
import DistributorDashboard from "./dashboards/DistributorDashboard"
import SellerDashboard from "./dashboards/SellerDashboard"

// ================= DISTRIBUTOR PAGES =================
import CreateSeller from "./pages/CreateSeller"

// ================= ADMIN EXTRA PAGES =================
import AdminNetworkView from "./pages/AdminNetworkView"

// ⭐⭐⭐ NEW PAGES ADDED (COIN / COMMISSION / NETWORK)
import CoinWallet from "./pages/CoinWallet"
import MyCommission from "./pages/MyCommission"
import MyNetwork from "./pages/MyNetwork"

// ⭐⭐⭐ NEW PPC SYSTEM PAGES
import PPCWallet from "./pages/PPCWallet"
import WithdrawalRequest from "./pages/WithdrawalRequest"
import AdminPPCSettings from "./pages/AdminPPCSettings"
import AdminWithdrawalManagement from "./pages/AdminWithdrawalManagement"

import MyProfile from "./pages/MyProfile"

// ================= CONTEXTS =================
import { StoreProvider, useStore } from "./context/StoreContext"
import { AuthProvider, useAuth } from "./context/AuthContext"
// ⭐ NEW ORDER PAGES
import AdminOrders from "./pages/AdminOrders"
import DistributorOrders from "./pages/DistributorOrders"
import SellerOrders from "./pages/SellerOrders"


function AppContent() {
  const [page, setPage] = useState("home")

  const { cart = [] } = useStore() || {}
  const { loggedIn, user, logout } = useAuth() || {}

  /* ⭐ SAFE DEFAULTS */
  const safeUser = user || {}
  const role = safeUser?.role || "guest"

  /* ⭐ DEBUG */
  console.log("📄 Current Page:", page)
  console.log("👤 LoggedIn:", loggedIn)
  console.log("👤 Role:", role)

  /* =========================================================
     ⭐⭐⭐ NEW → AUTO BLOCK / DELETE CHECK
  ========================================================= */
  useEffect(() => {

    const checkUser = async () => {
      try {

        const token = localStorage.getItem("token")
        if (!token) return

        console.log("🔐 Checking user status...")

        const res = await fetch(
          "http://localhost:5000/users/wallet/me",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        console.log("🔐 Status check:", res.status)

        if (res.status === 401 || res.status === 403) {
          alert("Your account is blocked, deleted, or session expired.")

          if (typeof logout === "function") {
            logout()
          }

          /* ⭐ SAFE NAVIGATION */
          setPage("login")

          /* ⭐ EXTRA CLEAR */
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        }

      } catch (err) {
        console.error("Auth check error:", err)
      }
    }

    checkUser()

  }, [logout])

  /* ========================================================= */

  const renderPage = () => {
    try {

      switch (page) {

        // ================= PUBLIC =================
        case "home":
          return <Home />

        case "services":
          return <Services />

        case "store":
          return <Store />

        case "cart":
          return <Cart setPage={setPage} />

        case "checkout":
          return <Checkout setPage={setPage} />

        case "orders":
          return loggedIn ? <Orders /> : <Login setPage={setPage} />

        case "my-users":
          return <MyCreatedUsers />

        case "admin-products":
          return <AdminProductList />

        case "admin-users":
          if (!loggedIn) return <Login setPage={setPage} />
          if (role !== "admin")
            return (
              <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">
                🚫 Unauthorized Access — Admin Only
              </div>
            )
          return <AdminUsers />

          case "admin-password-reset":
              if (!loggedIn) return <Login setPage={setPage} />
              if (role !== "admin") return <Home />
              return <AdminPasswordReset />

        // ⭐⭐⭐ NEW ================= MY COIN WALLET =================
        case "coin-wallet":
          if (!loggedIn) return <Login setPage={setPage} />
          return <CoinWallet />

        // ⭐⭐⭐ NEW ================= MY COMMISSION =================
        case "my-commission":
          if (!loggedIn) return <Login setPage={setPage} />
          return <MyCommission />

        // ⭐⭐⭐ NEW ================= MY NETWORK =================
        case "my-network":
          if (!loggedIn) return <Login setPage={setPage} />
          return <MyNetwork />

        // ⭐⭐⭐ NEW ================= PPC WALLET =================
        case "ppc-wallet":
          if (!loggedIn) return <Login setPage={setPage} />
          return <PPCWallet />

        // ⭐⭐⭐ NEW ================= WITHDRAWAL REQUEST =================
        case "withdrawal-request":
          if (!loggedIn) return <Login setPage={setPage} />
          if (!["distributor", "seller"].includes(role)) {
            return (
              <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">
                🚫 Only Distributor and Seller can request withdrawal
              </div>
            )
          }
          return <WithdrawalRequest />

        // ⭐⭐⭐ NEW ================= ADMIN PPC SETTINGS =================
        case "admin-ppc-settings":
          if (!loggedIn) return <Login setPage={setPage} />
          if (role !== "admin") {
            return (
              <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">
                🚫 Unauthorized Access — Admin Only
              </div>
            )
          }
          return <AdminPPCSettings />

        // ⭐⭐⭐ NEW ================= ADMIN WITHDRAWAL MANAGEMENT =================
        case "admin-withdrawal-management":
          if (!loggedIn) return <Login setPage={setPage} />
          if (role !== "admin") {
            return (
              <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">
                🚫 Unauthorized Access — Admin Only
              </div>
            )
          }
          return <AdminWithdrawalManagement />


        // ================= DASHBOARD =================
        case "dashboard":
          if (!loggedIn) return <Login setPage={setPage} />

          if (role === "seller") return <SellerDashboard />
          if (role === "user")   return <SellerDashboard />  // ⭐ user ko bhi seller dashboard dikhao
          if (role === "distributor") return <DistributorDashboard />
          if (role === "admin") return <Admin />

          return <Home />

        // ================= CREATE SELLER (Distributor only) =================
        case "create-seller":
          if (!loggedIn) return <Login setPage={setPage} />

          if (!["distributor", "seller"].includes(role)) {
            return (
              <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">
                🚫 Unauthorized — Only Distributor or Seller can create users
              </div>
            )
          }

          return <CreateSeller />

        // ================= ADMIN PANEL =================
        case "admin":
          if (!loggedIn) return <Login setPage={setPage} />

          if (role !== "admin") {
            return (
              <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">
                🚫 Unauthorized Access — Admin Only
              </div>
            )
          }

          return <Admin />

        // ================= ADD PRODUCT =================
        case "admin-add-product":
          if (!loggedIn) return <Login setPage={setPage} />

          if (role !== "admin") {
            return (
              <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">
                🚫 Unauthorized Access — Admin Only
              </div>
            )
          }

          return <AdminAddProduct />

        // ================= ADMIN NETWORK =================
        case "admin-network":
          if (!loggedIn) return <Login setPage={setPage} />

          if (role !== "admin") {
            return (
              <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">
                🚫 Unauthorized Access — Admin Only
              </div>
            )
          }

          return <AdminNetworkView />

        // ================= RAISE REQUEST =================
        case "raise-request":
          if (!loggedIn) return <Login setPage={setPage} />

          if (role === "admin") {
            return (
              <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">
                🚫 Admin cannot raise requests
              </div>
            )
          }

          return <RaiseRequest />

        // ================= ADMIN REQUEST PANEL =================
        case "admin-requests":
          if (!loggedIn) return <Login setPage={setPage} />

          if (role !== "admin") {
            return (
              <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">
                🚫 Unauthorized Access — Admin Only
              </div>
            )
          }

          return <AdminRequests />

        // ⭐ NEW ================= REQUEST HISTORY =================
        case "admin-requests-history":
          if (!loggedIn) return <Login setPage={setPage} />

          if (role !== "admin") {
            return (
              <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">
                🚫 Unauthorized Access — Admin Only
              </div>
            )
          }
          return <AdminRequestsHistory />

        case "email-settings":
          if (!loggedIn) return <Login setPage={setPage} />
          if (role !== "admin") return <div className="bg-white p-6 rounded shadow text-red-600 font-semibold">🚫 Admin Only</div>
          return <AdminEmailSettings />
// ⭐ NEW ================= seller-order =================

                      case "seller-orders":
              if (!loggedIn) return <Login setPage={setPage} />
              if (!["seller", "user"].includes(role)) return <Home />
              return <SellerOrders />

  if (role !== "seller") return <Home />

            case "distributor-orders":
              if (!loggedIn) return <Login setPage={setPage} />
              if (role !== "distributor") return <Home />
              return <DistributorOrders />

            case "admin-orders":
              if (!loggedIn) return <Login setPage={setPage} />
              if (role !== "admin") return <Home />
              return <AdminOrders />

          
          case "my-profile":
          if (!loggedIn) return <Login setPage={setPage} />
          return <MyProfile />

        // ================= PASSWORD HELP =================
        case "password-help":
          return <PasswordHelp />

        // ================= LOGIN =================
        case "login":
          return <Login setPage={setPage} />

        default:
          console.log("⚠️ Unknown page:", page)
          return <Home />
      }

    } catch (err) {
      console.error("❌ Page render crash:", err)
      return (
        <div className="bg-white p-6 rounded shadow text-red-600">
          Page crashed. Check console.
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <Navbar
        setPage={setPage}
        cartCount={cart?.length || 0}
      />

      <main className="p-6">
        {renderPage()}
      </main>
    </div>
  )
}


export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  )
}


