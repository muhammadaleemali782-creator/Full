import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

/*
  =====================================================
  USER ANALYTICS PANEL (FINAL – PRODUCTION STABLE)
  -----------------------------------------------------
  ✔ Admin / Distributor / Seller supported
  ✔ Date range filter
  ✔ Smooth analytics graph
  ✔ Safe token handling
  ✔ Safe user id (_id / id)
  ✔ Loading & error handling
  ✔ Defensive timeline parsing
  ✔ Production safe
  ✔ Graph always visible (even if no sales)
  =====================================================
*/

export default function UserAnalytics({ user }) {
  const [range, setRange] = useState("lifetime")
  const [stats, setStats] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return

    let isMounted = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem("token")
        if (!token) throw new Error("Auth token missing")

        const userId = user.id || user._id
        if (!userId) throw new Error("Invalid user id")

        const res = await fetch(
          `http://localhost:5000/analytics/user/${userId}?range=${range}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (!res.ok) {
          throw new Error("Failed to load analytics")
        }

        const data = await res.json()

        if (!isMounted) return

        setStats(data || null)

        // 🔥 SAFE timeline parsing
        if (Array.isArray(data?.timeline)) {
          const formatted = data.timeline.map(item => ({
            label: item?.label ?? "",
            sales: Number(item?.total ?? 0)
          }))
          setTimeline(formatted)
        } else {
          setTimeline([])
        }

      } catch (err) {
        if (!isMounted) return
        setError(err.message || "Something went wrong")
        setStats(null)
        setTimeline([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [user, range])

  /* ================= SAFETY ================= */
  if (!user) {
    return (
      <p className="text-gray-500">
        Select a user to view analytics
      </p>
    )
  }

  /* 🔥 Generate fallback flat graph */
  const generateEmptyTimeline = () => {
    const points = 7
    return Array.from({ length: points }, (_, i) => ({
      label: `Point ${i + 1}`,
      sales: 0
    }))
  }

  const finalTimeline =
    timeline.length > 0 ? timeline : generateEmptyTimeline()

  /* ================= UI ================= */
  return (
    <div className="bg-white p-6 rounded shadow space-y-6">

      {/* HEADER */}
      <div>
        <h3 className="font-bold text-lg">
          Analytics – {user.name}
          <span className="text-xs text-gray-500 ml-2">
            ({user.role})
          </span>
        </h3>
      </div>

      {/* FILTER */}
      <select
        value={range}
        onChange={e => setRange(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
        <option value="lifetime">Lifetime</option>
      </select>

      {/* STATES */}
      {loading && (
        <p className="text-sm text-gray-500">
          Loading analytics...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* SUMMARY */}
      {stats && !loading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-100 p-4 rounded">
            <p className="text-sm text-gray-600">
              Total Orders
            </p>
            <p className="text-xl font-bold">
              {Number(stats.ordersCount ?? 0)}
            </p>
          </div>

          <div className="bg-green-100 p-4 rounded">
            <p className="text-sm text-gray-600">
              Total Sales
            </p>
            <p className="text-xl font-bold">
              ₹{Number(stats.totalSales ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* GRAPH (Always Visible) */}
      {!loading && (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finalTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#2563eb"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* EMPTY MESSAGE */}
      {!loading && timeline.length === 0 && stats && (
        <p className="text-sm text-gray-400 text-center">
          No sales yet for this period.
        </p>
      )}

    </div>
  )
}