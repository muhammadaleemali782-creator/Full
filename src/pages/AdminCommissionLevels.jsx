import { useState, useEffect } from "react"
import api from "../services/api"

export default function AdminCommissionLevels() {
  const [levels, setLevels] = useState([
    { level: 1, percent: 10 },
    { level: 2, percent: 5 }
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /* ⭐ NEW STATE (MLM SUPPORT) */
  const [message, setMessage] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      setMessage("")

      console.log("📥 Loading commission levels...")

      /* ⭐ NEW SAFE TRY BOTH ROUTES */
      let res
      try {
        res = await api.get("/commission/levels")
      } catch {
        res = await api.get("/commission-levels")
      }

      if (res?.data?.length) {
        console.log("✅ Levels loaded:", res.data)

        /* ⭐ SAFE MAP FOR NEW FIELDS */
        const safe = res.data.map(l => ({
          level: l.level ?? 1,
          percent: l.percent ?? 0,
          role: l.role ?? "seller",
          type: l.type ?? "PERCENTAGE",
          fixedCoin: l.fixedCoin ?? 0
        }))

        setLevels(safe)
      } else {
        console.log("ℹ️ No levels found, using default")
      }

    } catch (err) {
      console.error("❌ Load levels error:", err.message)
      setError(err.message || "Failed to load levels")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      setLoading(true)
      setError(null)
      setMessage("")

      console.log("💾 Saving commission levels:", levels)

      /* ⭐ SAFE SAVE BOTH ROUTES */
      try {
        await api.post("/commission/levels", { levels })
      } catch {
        await api.post("/commission-levels", { levels })
      }

      setMessage("Saved successfully ✅")
      alert("Saved!")

    } catch (err) {
      console.error("❌ Save levels error:", err.message)
      alert("Save failed")
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-xl font-bold">Commission Levels</h2>

      {loading && (
        <p className="text-blue-600">Loading...</p>
      )}

      {error && (
        <div className="text-red-600">
          Error: {error}
        </div>
      )}

      {message && (
        <div className="text-green-600">
          {message}
        </div>
      )}

      {levels.map((lvl, i) => (
        <div key={i} className="flex gap-3 items-center flex-wrap">

          <input
            type="number"
            value={lvl.level}
            onChange={e=>{
              const copy=[...levels]
              copy[i].level=Number(e.target.value)
              setLevels(copy)
            }}
            className="border p-2 w-20"
          />

          <input
            type="number"
            value={lvl.percent}
            onChange={e=>{
              const copy=[...levels]
              copy[i].percent=Number(e.target.value)
              setLevels(copy)
            }}
            className="border p-2 w-20"
          />

          %

          {/* ⭐ ROLE FIELD */}
          <input
            value={lvl.role || ""}
            onChange={e=>{
              const copy=[...levels]
              copy[i].role=e.target.value
              setLevels(copy)
            }}
            placeholder="seller/distributor"
            className="border p-2 w-32"
          />

          {/* ⭐ TYPE FIELD */}
          <select
            value={lvl.type || "PERCENTAGE"}
            onChange={e=>{
              const copy=[...levels]
              copy[i].type=e.target.value
              setLevels(copy)
            }}
            className="border p-2"
          >
            <option value="PERCENTAGE">%</option>
            <option value="FIXED">Fixed Coin</option>
          </select>

          {/* ⭐ FIXED COIN */}
          <input
            type="number"
            value={lvl.fixedCoin || 0}
            onChange={e=>{
              const copy=[...levels]
              copy[i].fixedCoin=Number(e.target.value)
              setLevels(copy)
            }}
            className="border p-2 w-24"
            placeholder="Coin"
          />

        </div>
      ))}

      <button
        onClick={()=>setLevels([...levels,{level:levels.length+1,percent:0,role:"seller",type:"PERCENTAGE",fixedCoin:0}])}
        className="bg-blue-600 text-white px-4 py-1 rounded"
      >
        Add Level
      </button>

      <button
        onClick={save}
        className="bg-green-600 text-white px-4 py-1 rounded"
      >
        Save Levels
      </button>

      {/* ⭐ Reload button */}
      <button
        onClick={load}
        className="bg-gray-600 text-white px-4 py-1 rounded"
      >
        Reload
      </button>

    </div>
  )
}