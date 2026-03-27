import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"

export default function CoinWallet() {
  const { user } = useAuth() || {}

  const [walletData, setWalletData] = useState(null)
  const [history,    setHistory]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [activeTab,  setActiveTab]  = useState("seller") // "seller" | "network"

  /* ── Load ── */
  const load = async () => {
    try {
      setLoading(true); setError(null)
      const token = localStorage.getItem("token")

      // Wallet balance
      const wRes = await fetch("http://localhost:5000/users/wallet/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!wRes.ok) throw new Error("Wallet API failed")
      const wData = await wRes.json()
      setWalletData(wData)

      // Commission history
      const cRes = await fetch("http://localhost:5000/orders/commission/mine", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (cRes.ok) {
        const cData = await cRes.json()
        setHistory(Array.isArray(cData) ? cData : [])
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  /* ── Split history ── */
  // Seller coins = level 1 (apna khud ka sale)
  // Network coins = level 2+ (neeche walo ki sale se mila)
  const sellerHistory  = history.filter(h => (h.level ?? 1) === 1)
  const networkHistory = history.filter(h => (h.level ?? 1) > 1)

  const sellerEarnings  = sellerHistory.reduce((s, h) => s + (h.amount || 0), 0)
  const networkEarnings = networkHistory.reduce((s, h) => s + (h.amount || 0), 0)

  /* ── Helpers ── */
  const fmt = (n) => Number(n || 0).toLocaleString("en-IN")

  const StatusBadge = ({ status }) => {
    const colors = {
      approved: "bg-green-100 text-green-700",
      pending:  "bg-yellow-100 text-yellow-700",
      rejected: "bg-red-100 text-red-700"
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    )
  }

  const HistoryTable = ({ rows }) => {
    if (rows.length === 0)
      return <p className="text-gray-400 text-sm text-center py-6">Koi transaction nahi mili</p>

    return (
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              <th className="text-left px-3 py-2">Date</th>
              <th className="text-left px-3 py-2">Order</th>
              <th className="text-left px-3 py-2">From</th>
              <th className="text-left px-3 py-2">Level</th>
              <th className="text-right px-3 py-2">Amount</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(h => (
              <tr key={h._id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">
                  {h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-IN") : "-"}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">
                  #{h.orderId?._id?.slice(-6) || "-"}
                </td>
                <td className="px-3 py-2">
                  {h.fromUser?.name || "-"}
                </td>
                <td className="px-3 py-2">
                  <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded">
                    L{h.level ?? 1}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-semibold text-green-700">
                  ₹{fmt(h.amount)}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={h.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  /* ── Loading / Error ── */
  if (loading) return (
    <div className="p-6 text-gray-500 animate-pulse">Loading wallet...</div>
  )
  if (error) return (
    <div className="p-6 text-red-600 space-y-2">
      <p>Error: {error}</p>
      <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
        Retry
      </button>
    </div>
  )

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      <h1 className="text-2xl font-bold">🪙 My Wallet</h1>

      {/* ── Balance Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Real Wallet */}
        <div className="col-span-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">Real Wallet Balance</p>
          <p className="text-4xl font-bold mt-1">₹{fmt(walletData?.walletBalance)}</p>
          <p className="text-xs opacity-70 mt-2">Total Earned: ₹{fmt(walletData?.totalCommissionEarned)}</p>
        </div>

        {/* Coin Balance */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-400 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">Coin Balance</p>
          <p className="text-4xl font-bold mt-1">{fmt(walletData?.coinBalance)}</p>
          <p className="text-xs opacity-70 mt-2">🪙 Coins</p>
        </div>

        {/* Total Coin Earned */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">Total Coins Earned</p>
          <p className="text-4xl font-bold mt-1">{fmt(walletData?.totalCoinEarned)}</p>
          <p className="text-xs opacity-70 mt-2">Ever earned</p>
        </div>

      </div>

      {/* ── Earnings Summary ── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">🛒 Seller Earnings</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">₹{fmt(sellerEarnings)}</p>
          <p className="text-xs text-gray-400 mt-1">{sellerHistory.length} transactions — apni bechne se</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">🌐 Network Earnings</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">₹{fmt(networkEarnings)}</p>
          <p className="text-xs text-gray-400 mt-1">{networkHistory.length} transactions — neeche walo ki bechne se</p>
        </div>
      </div>

      {/* ── History Tabs ── */}
      <div className="bg-white rounded-xl shadow">

        {/* Tab Buttons */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("seller")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "seller"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🛒 Seller Coins ({sellerHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("network")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "network"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🌐 Network Coins ({networkHistory.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "seller" && (
            <div>
              <p className="text-xs text-gray-400 mb-3">
                Jab tumne khud apna saman becha — us par mila commission
              </p>
              <HistoryTable rows={sellerHistory} />
            </div>
          )}
          {activeTab === "network" && (
            <div>
              <p className="text-xs text-gray-400 mb-3">
                Jab tumhare neeche wale sellers ne saman becha — us par mila commission
              </p>
              <HistoryTable rows={networkHistory} />
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
