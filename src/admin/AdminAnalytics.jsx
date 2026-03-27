import { useEffect, useState } from "react"

/*
  =====================================================
  ADMIN ANALYTICS + DRILL DOWN (FINAL – PRODUCTION READY)
  -----------------------------------------------------
  ✔ MongoDB = single source of truth
  ✔ Handles ADMIN → DISTRIBUTOR → SELLER tree
  ✔ Correct counts (NO MORE ZERO BUG)
  ✔ Safe for _id / id mismatch
  ✔ Expand / collapse drilldown
  ✔ NOTHING REMOVED – ONLY HARDENED
  =====================================================
*/

export default function AdminAnalytics() {
  const [tree, setTree] = useState([])
  const [flatUsers, setFlatUsers] = useState([])
  const [openId, setOpenId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /* ================= FETCH TREE ================= */
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("Auth token missing")

        const res = await fetch("http://localhost:5000/users/tree", {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) throw new Error("Failed to fetch tree")

        const data = await res.json()
        const safeTree = Array.isArray(data) ? data : []

        setTree(safeTree)

        // 🔥 FLATTEN TREE WITH NORMALIZED id + parentId
        const flatten = (nodes = [], parentId = null, acc = []) => {
          nodes.forEach(n => {
            const nodeId = n._id || n.id

            acc.push({
              ...n,
              id: nodeId,        // ✅ normalize id
              parentId           // ✅ inject parent
            })

            if (n.children?.length) {
              flatten(n.children, nodeId, acc)
            }
          })
          return acc
        }

        setFlatUsers(flatten(safeTree))
      } catch (err) {
        console.error("AdminAnalytics error:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTree()
  }, [])

  /* ================= COUNTS ================= */
  const distributors = flatUsers.filter(
    u => u.role === "distributor"
  )

  const sellers = flatUsers.filter(
    u => u.role === "seller"
  )

  /* ================= LOADING / ERROR ================= */
  if (loading) {
    return (
      <div className="bg-white p-4 rounded shadow">
        Loading analytics...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded shadow text-red-600">
        {error}
      </div>
    )
  }

  /* ================= UI ================= */
  return (
    <div className="bg-white p-6 rounded shadow space-y-6">

      <h2 className="text-xl font-bold">
        Admin Analytics
      </h2>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-100 p-4 rounded">
          <p className="text-sm text-gray-600">
            Total Distributors
          </p>
          <p className="text-2xl font-bold">
            {distributors.length}
          </p>
        </div>

        <div className="bg-green-100 p-4 rounded">
          <p className="text-sm text-gray-600">
            Total Sellers
          </p>
          <p className="text-2xl font-bold">
            {sellers.length}
          </p>
        </div>
      </div>

      {/* ================= DRILL DOWN ================= */}
      <div>
        <h3 className="font-bold mb-3">
          Distributor → Seller Mapping
        </h3>

        {distributors.length === 0 ? (
          <p className="text-gray-500">
            No distributors created yet
          </p>
        ) : (
          distributors.map(d => {
            const distId = d.id

            const mySellers = flatUsers.filter(
              u =>
                u.role === "seller" &&
                String(u.parentId) === String(distId)
            )

            return (
              <div
                key={distId}
                className="border rounded mb-2"
              >
                <div
                  className="p-3 cursor-pointer bg-gray-100 flex justify-between items-center"
                  onClick={() =>
                    setOpenId(
                      openId === distId ? null : distId
                    )
                  }
                >
                  <span className="font-semibold">
                    {d.name} (Distributor)
                  </span>
                  <span className="text-sm text-gray-600">
                    Sellers: {mySellers.length}
                  </span>
                </div>

                {openId === distId && (
                  <div className="p-3 bg-white space-y-1">
                    {mySellers.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No sellers under this distributor
                      </p>
                    ) : (
                      mySellers.map(s => (
                        <div
                          key={s.id}
                          className="text-sm border-b py-1 pl-2"
                        >
                          • {s.name} (Seller)
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
