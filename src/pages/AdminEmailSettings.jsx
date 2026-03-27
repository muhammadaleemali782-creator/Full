import { useState, useEffect } from "react"

export default function AdminEmailSettings() {

  const [domain, setDomain] = useState("")
  const [input, setInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  /* ── Load current domain ── */
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("http://localhost:5000/settings/email-domain", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.domain) {
          setDomain(data.domain)
          // Remove leading @ for input field
          setInput(data.domain.replace(/^@/, ""))
        }
      } catch (err) {
        console.error("Load domain error:", err)
      }
    }
    load()
  }, [])

  /* ── Save ── */
  const handleSave = async () => {
    if (!input.trim()) {
      setMsg("❌ Domain khali nahi ho sakta")
      return
    }

    try {
      setSaving(true)
      setMsg("")
      const token = localStorage.getItem("token")

      const res = await fetch("http://localhost:5000/settings/email-domain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ domain: input.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        setMsg("❌ " + (data.message || "Error"))
        return
      }

      setDomain(data.domain)
      setMsg("✅ Domain save ho gaya!")

    } catch {
      setMsg("❌ Server error")
    } finally {
      setSaving(false)
    }
  }

  /* ── Clear ── */
  const handleClear = async () => {
    try {
      setSaving(true)
      setMsg("")
      const token = localStorage.getItem("token")

      await fetch("http://localhost:5000/settings/email-domain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ domain: "" })
      })

      setDomain("")
      setInput("")
      setMsg("✅ Domain remove ho gaya — ab free email use hogi")
    } catch {
      setMsg("❌ Server error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded shadow max-w-lg">

      <h2 className="text-xl font-bold mb-1">📧 Email Domain Settings</h2>
      <p className="text-sm text-gray-500 mb-5">
        Yeh domain set karne ke baad Request form mein automatically
        yahi domain lagega. Users sirf apna naam likhenge.
      </p>

      {/* Current domain badge */}
      <div className="mb-4">
        <span className="text-sm font-semibold text-gray-600">Current Domain: </span>
        {domain ? (
          <span className="ml-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
            {domain}
          </span>
        ) : (
          <span className="ml-1 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm">
            Not set — free email
          </span>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 items-center mb-2">
        <span className="text-gray-500 font-semibold text-lg">@</span>
        <input
          className="border p-2 rounded flex-1 text-sm"
          placeholder="educaved.com"
          value={input}
          onChange={e => setInput(e.target.value.replace(/^@/, ""))}
        />
      </div>

      {/* Preview */}
      {input && (
        <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded border">
          Preview: <b>john@{input.replace(/^@/, "")}</b>
          &nbsp;→ users "john" likhenge, system "{`john@${input.replace(/^@/, "")}`}" banayega
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Domain"}
        </button>

        {domain && (
          <button
            onClick={handleClear}
            disabled={saving}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            Remove Domain
          </button>
        )}
      </div>

      {msg && (
        <p className={`mt-3 text-sm font-medium ${msg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
          {msg}
        </p>
      )}

    </div>
  )
}
