import { useEffect, useState } from "react"

export default function MyCreatedUsers() {
  const [list, setList] = useState([])

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token")

      const res = await fetch("http://localhost:5000/requests/my", {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()
      setList(data)
    }

    load()
  }, [])

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="font-bold text-xl mb-4">
        Created Users Info
      </h2>

      {list.length === 0 && <p>No approved users</p>}

      {list.map(r => (
        <div key={r._id} className="border p-3 mb-2">
          <b>{r.createdUserName}</b><br/>
          Email: {r.createdUserEmail}<br/>
          Temp Password: <b>{r.tempPassword}</b>
        </div>
      ))}
    </div>
  )
}
