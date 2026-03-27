import { useEffect, useState } from "react"

export default function AdminPasswordReset() {

  const [requests, setRequests] = useState([])

  const token = localStorage.getItem("token")

  const loadRequests = async () => {

    const res = await fetch(
      "http://localhost:5000/requests/password-reset",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    const data = await res.json()

    setRequests(data)
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const resetPassword = async (userId) => {

    const res = await fetch(
      `http://localhost:5000/admin/reset-password/${userId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    const data = await res.json()

    alert("Temp Password: " + data.tempPassword)

    loadRequests()
  }

  const reject = async (id) => {

    await fetch(
      `http://localhost:5000/requests/reject/${id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    loadRequests()
  }

  /* =====================================================
     ⭐ NEW APPROVE PASSWORD RESET FUNCTION
  ===================================================== */

  const approve = async (id) => {

    try {

      const res = await fetch(
        `http://localhost:5000/requests/approve-reset/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await res.json()

      if (data.success) {
        alert("Request Approved ✅")
      }

      loadRequests()

    } catch (err) {
      console.error("Approve error:", err)
    }

  }

  return (

    <div className="bg-white p-6 rounded shadow">

      <h2 className="text-xl font-bold mb-4">
        Password Reset Requests
      </h2>

      {requests.map(r => (

        <div
          key={r._id}
          className="border p-4 rounded mb-4"
        >

          <div className="font-semibold">
            {r.email}
          </div>

          <div className="text-sm text-gray-600">
            WhatsApp: {r.whatsapp}
          </div>

          <div className="mt-3 flex gap-3">

            <button
              onClick={() => resetPassword(r.requestedBy)}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Reset Password
            </button>

            {/* ⭐ NEW APPROVE BUTTON */}

            <button
              onClick={() => approve(r._id)}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Approve
            </button>

            <button
              onClick={() => reject(r._id)}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Reject
            </button>

          </div>

        </div>

      ))}

      {/* =====================================================
         EXTRA SAFE EMPTY STATE
      ===================================================== */}

      {requests.length === 0 && (
        <div className="text-gray-500 text-center mt-6">
          No pending password reset requests
        </div>
      )}

    </div>
  )
}