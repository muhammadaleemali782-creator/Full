import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"

export default function DistributorSellers({ distributorId, distributorName }) {
  const { user } = useAuth()
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSellers = async () => {
      try {
        const token = localStorage.getItem("token")

        const res = await fetch(
          `http://localhost:5000/users/my-sellers?parentId=${distributorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const data = await res.json()
        setSellers(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Failed to load sellers", err)
      } finally {
        setLoading(false)
      }
    }

    loadSellers()
  }, [distributorId])

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">

      <h1 className="text-2xl font-bold">
        Sellers of {distributorName}
      </h1>

      {loading ? (
        <p className="text-gray-500">Loading sellers...</p>
      ) : sellers.length === 0 ? (
        <p className="text-gray-500">
          No sellers found for this distributor
        </p>
      ) : (
        <div className="space-y-2">
          {sellers.map(s => (
            <div
              key={s._id}
              className="border p-3 rounded flex justify-between"
            >
              <span className="font-medium">{s.name}</span>
              <span className="text-sm text-gray-500">
                Seller ID: {s._id}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
