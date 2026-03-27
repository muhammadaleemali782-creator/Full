import { useEffect, useState } from "react"
import { getRoleLabel } from "../utils/roleLabels"

export default function AdminRequestHistory() {
  const [requests, setRequests] = useState([])

  /* ================= NEW STATES ================= */

  const [search,setSearch]=useState("")
  const [statusFilter,setStatusFilter]=useState("")
  const [typeFilter,setTypeFilter]=useState("")
  const [dateFilter,setDateFilter]=useState("")

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token")

      const res = await fetch(
        "http://localhost:5000/requests/history",
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const data = await res.json()
      setRequests(data)
    }

    load()
  }, [])

  /* ================= FILTER LOGIC ================= */

  const filteredRequests=requests.filter(r=>{

    const emailMatch=
      r.email?.toLowerCase().includes(search.toLowerCase())

    const idMatch=
      r._id?.toLowerCase().includes(search.toLowerCase())

    const statusMatch=
      statusFilter==="" || r.status===statusFilter

    const typeMatch=
      typeFilter==="" || r.type===typeFilter

    const dateMatch=
      dateFilter==="" ||
      new Date(r.createdAt)
      .toISOString()
      .slice(0,10)===dateFilter

    return (emailMatch||idMatch)&&statusMatch&&typeMatch&&dateMatch

  })

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="font-bold text-xl mb-4">Request History</h2>

      {/* ================= SEARCH + FILTER ================= */}

      <div className="flex flex-wrap gap-3 mb-4">

        <input
        type="text"
        placeholder="Search Email / UserId"
        value={search}
        onChange={e=>setSearch(e.target.value)}
        className="border p-2 rounded"
        />

        <select
        value={statusFilter}
        onChange={e=>setStatusFilter(e.target.value)}
        className="border p-2 rounded"
        >
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
        value={typeFilter}
        onChange={e=>setTypeFilter(e.target.value)}
        className="border p-2 rounded"
        >
          <option value="">All Type</option>
          <option value="distributor">Distributor</option>
          <option value="seller">Seller</option>
          <option value="user">User</option>
          <option value="password-reset">Password Reset</option>
        </select>

        <input
        type="date"
        value={dateFilter}
        onChange={e=>setDateFilter(e.target.value)}
        className="border p-2 rounded"
        />

        <button
        onClick={()=>{
          setSearch("")
          setStatusFilter("")
          setTypeFilter("")
          setDateFilter("")
        }}
        className="bg-gray-700 text-white px-4 py-2 rounded"
        >
          Reset
        </button>

      </div>

      {filteredRequests.length === 0 && <p>No history</p>}

      {filteredRequests.map(r => (
        <div key={r._id} className="border p-3 mb-2">
          <b>{r.name}</b> ({r.email}) → {getRoleLabel(r.type)}

          <div className="text-sm text-gray-500">
            Requested by: {r.requestedBy?.name}
          </div>

          <div className={
            r.status === "approved"
              ? "text-green-600 font-semibold"
              : "text-red-600 font-semibold"
          }>
            Status: {r.status}
          </div>

          {/* ================= DATE DISPLAY ================= */}

          <div className="text-xs text-gray-400">
            {new Date(r.createdAt).toLocaleString()}
          </div>

        </div>
      ))}
    </div>
  )
}