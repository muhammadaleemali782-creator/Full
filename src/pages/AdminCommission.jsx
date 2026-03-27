import { useEffect, useState } from "react"

export default function AdminCommission() {

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /* ⭐ AUTO BASE URL (NO NEED CHANGE AGAIN) */
  const API_BASE = "http://localhost:5000"

  /* ⭐ TRY MULTIPLE ROUTES AUTO */
  const URLS = [
    `${API_BASE}/orders/commission/all`,
    `${API_BASE}/commission/all`,
    `${API_BASE}/api/commission/all`
  ]

  /* ⭐ NEW STATE FOR DEBUG + SUMMARY */
  const [summary, setSummary] = useState({})
  const [workingUrl, setWorkingUrl] = useState("")

  /* ================= LOAD COMMISSION ================= */
  const load = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("Token missing. Please login again.")
      }

      console.log("📥 Loading admin commissions...")

      let res = null
      let text = null
      let data = null
      let success = false

      /* ⭐ TRY BOTH URLS */
      for (const url of URLS) {
        try {
          console.log("🌐 Trying API:", url)

          res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          })

          console.log("🌐 API STATUS:", res.status)

          text = await res.text()

          try {
            data = JSON.parse(text)
            success = true
            setWorkingUrl(url)
            console.log("✅ Working API found:", url)
            break
          } catch {
            console.warn("⚠️ Not JSON from:", url)
          }

        } catch (err) {
          console.warn("⚠️ API failed:", url)
        }
      }

      if (!success) {
        console.error("❌ Server returned HTML or 404:", text)
        throw new Error("API route not working. Check backend mount path.")
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to load commissions")
      }

      console.log("✅ Commissions loaded:", data.length)

      setList(data)

      /* ⭐ SUMMARY CALCULATION */
      const totalAmount = data.reduce((a,b)=>a+(b.amount||0),0)
      const totalCount = data.length

      setSummary({
        totalAmount,
        totalCount
      })

    } catch (err) {
      console.error("Admin Commission Load Error:", err.message)
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
        Loading commissions...
      </div>
    )

  if (error)
    return (
      <div className="p-6 text-red-600 space-y-3">
        <div>Error: {error}</div>

        {/* ⭐ Retry Button */}
        <button
          onClick={load}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    )

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">

      <h2 className="text-xl font-bold mb-2">
        💰 All Commissions (Admin)
      </h2>

      {/* ⭐ DEBUG INFO */}
      <div className="text-sm text-gray-500">
        Working API: {workingUrl || "Not detected"}
      </div>

      {/* ⭐ SUMMARY */}
      <div className="bg-gray-100 p-3 rounded text-sm">
        Total Records: {summary.totalCount || 0} |
        Total Amount: ₹ {summary.totalAmount || 0}
      </div>

      {list.length === 0 && (
        <p>No commission found</p>
      )}

      {list.length > 0 && (
        <div className="overflow-auto">
          <table className="w-full border text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Order ID</th>
                <th className="p-2 border">From User</th>
                <th className="p-2 border">To User</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Percent</th>
                <th className="p-2 border">Level</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>

            <tbody>
              {list.map(c => (
                <tr key={c._id} className="text-center">

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
                    {c.fromUser?.name || "-"}
                  </td>

                  <td className="p-2 border">
                    {c.toUser?.name || "-"}
                  </td>

                  <td className="p-2 border font-bold text-green-600">
                    ₹ {c.amount || 0}
                  </td>

                  <td className="p-2 border">
                    {c.percent ?? "-"} %
                  </td>

                  <td className="p-2 border">
                    {c.level ?? "-"}
                  </td>

                  <td className="p-2 border">
                    {c.type || "REAL"}
                  </td>

                  <td className="p-2 border">
                    {c.status || "-"}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}

    </div>
  )
}