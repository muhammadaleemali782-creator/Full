import { useEffect, useState } from "react"

export default function MyCommission() {

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /* ================= LOAD COMMISSION ================= */
  const load = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("Token missing. Please login again.")
      }

      console.log("📥 Loading MY commissions...")

      /* ⭐⭐⭐ ONLY THIS URL CHANGED ⭐⭐⭐ */
      const res = await fetch(
        "http://localhost:5000/orders/commission/mine",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )

      console.log("🌐 API STATUS:", res.status)

      /* ⭐ FIX FOR HTML ERROR */
      const text = await res.text()

      let data
      try {
        data = JSON.parse(text)
      } catch {
        console.error("❌ Server returned HTML:", text)
        throw new Error("Server returned invalid response. Check API route.")
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to load commission")
      }

      if (!Array.isArray(data)) {
        console.warn("⚠️ Invalid commission format:", data)
        setList([])
        return
      }

      console.log("✅ My commissions loaded:", data.length)

      setList(data)

    } catch (err) {
      console.error("Commission Load Error:", err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  /* ================= UI ================= */

  if (loading)
    return (
      <div className="p-6 text-center">
        Loading commission...
      </div>
    )

  if (error)
    return (
      <div className="p-6 text-red-600">
        Error: {error}
      </div>
    )

  return (
    <div className="bg-white p-6 rounded shadow">

      <h2 className="text-xl font-bold mb-4">
        💰 My Commission
      </h2>

      {list.length === 0 && (
        <p>No commission yet</p>
      )}

      {list.length > 0 && (
        <table className="w-full border">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Order ID</th>
              <th className="p-2 border">From User</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>

          <tbody>
            {list.map(c => (
              <tr key={c._id || Math.random()} className="text-center">

                <td className="p-2 border">
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString()
                    : "-"}
                </td>

                <td className="p-2 border">
                  {c.orderId?._id
                    ? c.orderId._id.slice(-6)
                    : "-"}
                </td>

                <td className="p-2 border">
                  {c.fromUser?.name || "System"}
                </td>

                <td className="p-2 border font-bold text-green-600">
                  ₹ {c.amount || 0}
                </td>

                <td className="p-2 border">
                  {c.status || "-"}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      )}

    </div>
  )
}