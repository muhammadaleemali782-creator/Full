import { useEffect, useState } from "react"
import { getRoleLabel } from "../utils/roleLabels"

export default function AdminRequests() {

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)

  /* ⭐ EMAIL EXISTS CHECK MAP */
  const [emailExistsMap, setEmailExistsMap] = useState({})

  /* ⭐ NEW STATES – PRODUCT OVERRIDE */
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState({})
  const [assignAllMap, setAssignAllMap] = useState({})

  /* ================= LOAD REQUESTS ================= */
  const load = async () => {
    const token = localStorage.getItem("token")

    try {
      setLoading(true)

      const res = await fetch(
        "http://localhost:5000/requests/all",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])

    } catch (err) {
      console.error("Load error:", err)
      alert("Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  /* ⭐ REQUESTS LOAD HONE KE BAAD — SAARI EMAILS CHECK KARO */
  useEffect(() => {
    if (requests.length === 0) return

    const checkEmails = async () => {
      const map = {}
      await Promise.all(
        requests.map(async (r) => {
          try {
            const res = await fetch(
              `http://localhost:5000/check-email?email=${encodeURIComponent(r.email)}`
            )
            const data = await res.json()
            map[r._id] = data.exists
          } catch {
            map[r._id] = false
          }
        })
      )
      setEmailExistsMap(map)
    }

    checkEmails()
  }, [requests])

  /* ================= LOAD PRODUCTS ================= */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const token = localStorage.getItem("token")

        const res = await fetch(
          "http://localhost:5000/products/all",
          { headers: { Authorization: `Bearer ${token}` } }
        )

        const data = await res.json()
        if (Array.isArray(data)) setProducts(data)

      } catch (err) {
        console.error("Product load error:", err)
      }
    }

    loadProducts()
  }, [])

  /* ================= APPROVE ================= */
  const approve = async (id) => {
    const token = localStorage.getItem("token")

    try {

      const productIds = selectedProducts[id] || []
      const assignAllProducts = assignAllMap[id] || false

      const res = await fetch(
        `http://localhost:5000/requests/approve/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            productIds,
            assignAllProducts
          })
        }
      )

      const data = await res.json()

      if (!res.ok || !data.success) {
        alert(data.message || "Approve failed ❌")
        return
      }

      alert("User created ✅ Temp password: " + data.tempPassword)

      setRequests(prev => prev.filter(r => r._id !== id))

    } catch (err) {
      alert("Error approving request")
      console.error(err)
    }
  }

  /* ================= REJECT ================= */
  const reject = async (id) => {
    const token = localStorage.getItem("token")

    try {
      const res = await fetch(
        `http://localhost:5000/requests/reject/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      )

      await res.json()
      alert("Request rejected ❌")
      setRequests(prev => prev.filter(r => r._id !== id))

    } catch (err) {
      alert("Error rejecting request")
      console.error(err)
    }
  }

  /* ================= UI ================= */
  return (
    <div className="bg-white p-6 rounded shadow">

      <h2 className="font-bold text-xl mb-4">
        Pending Requests
      </h2>

      {loading && <p>Loading...</p>}
      {!loading && requests.length === 0 && <p>No requests</p>}

      {requests.map(r => (
        <div
          key={r._id}
          className="border p-4 mb-3 rounded bg-gray-50"
        >

          {/* ===== USER INFO ===== */}
          <div className="mb-3">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <b className="text-base">{r.name}</b>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                {getRoleLabel(r.type)}
              </span>

              {/* ⭐ EMAIL EXISTS BADGE */}
              {emailExistsMap[r._id] === true && (
                <span className="text-xs bg-red-100 text-red-600 border border-red-300 px-2 py-0.5 rounded-full font-semibold">
                  ❌ Email already registered
                </span>
              )}
              {emailExistsMap[r._id] === false && (
                <span className="text-xs bg-green-100 text-green-600 border border-green-300 px-2 py-0.5 rounded-full font-semibold">
                  ✅ Email available
                </span>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-600 mt-2">
              <div>📧 <span className="font-medium">{r.email || "—"}</span></div>
              <div>📞 <span className="font-medium">{r.phone || "—"}</span></div>
              <div className="sm:col-span-2">📍 <span className="font-medium">{r.address || "—"}</span></div>
              <div>👤 Requested by: <span className="font-medium">{r.requestedBy?.name || "Unknown"}</span></div>
              <div>🕐 <span className="font-medium">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
            </div>
          </div>

          {/* ===== PRODUCT INFO FROM REQUEST ===== */}
          {(r.assignAllProducts || r.assignedProducts?.length > 0) && (
            <div className="text-sm mb-2 text-blue-600">
              Requested Products:{" "}
              {r.assignAllProducts
                ? "ALL PRODUCTS"
                : `${r.assignedProducts.length} selected`}
            </div>
          )}

          {/* ===== ADMIN OVERRIDE PRODUCT SELECT ===== */}
          {products.length > 0 && (
            <div className="border p-2 mb-3 rounded bg-white">

              <div className="text-sm font-semibold mb-1">
                Admin Product Override (Optional)
              </div>

              <label className="flex gap-2 text-sm mb-2">
                <input
                  type="checkbox"
                  onChange={(e)=>{
                    setAssignAllMap(prev=>({
                      ...prev,
                      [r._id]: e.target.checked
                    }))
                  }}
                />
                Assign ALL Products
              </label>

              {!assignAllMap[r._id] && (
                <div className="max-h-32 overflow-auto text-sm border p-2 rounded">
                  {products.map(p => (
                    <label key={p._id} className="flex gap-2">
                      <input
                        type="checkbox"
                        onChange={()=>{
                          setSelectedProducts(prev=>{
                            const arr = prev[r._id] || []
                            return {
                              ...prev,
                              [r._id]: arr.includes(p._id)
                                ? arr.filter(x=>x!==p._id)
                                : [...arr, p._id]
                            }
                          })
                        }}
                      />
                      {p.title} ₹{p.price}
                    </label>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ===== ACTIONS ===== */}
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => approve(r._id)}
              disabled={emailExistsMap[r._id] === true}
              className={`px-3 py-1 rounded text-white font-medium ${
                emailExistsMap[r._id] === true
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Approve
            </button>

            <button
              onClick={() => reject(r._id)}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-medium"
            >
              Reject
            </button>

            {/* ⭐ WARNING MESSAGE */}
            {emailExistsMap[r._id] === true && (
              <span className="text-xs text-red-500 font-medium">
                ⚠️ Approve nahi ho sakta — email already registered. Pehle Reject karo.
              </span>
            )}
          </div>

        </div>
      ))}
    </div>
  )
}
