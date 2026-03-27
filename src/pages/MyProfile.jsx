import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { getRoleLabel } from "../utils/roleLabels"

export default function MyProfile() {
  const { user: authUser } = useAuth()

  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState("")
  const [msgType,  setMsgType]  = useState("") // "success" | "error"

  const [form, setForm] = useState({
    fullName: "",
    phone:    "",
    address:  "",
  })

  const token = localStorage.getItem("token")

  /* ── Load profile ── */
  const load = async () => {
    try {
      setLoading(true)
      const res  = await fetch("http://localhost:5000/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setProfile(data)
      setForm({
        fullName: data.fullName || "",
        phone:    data.phone    || "",
        address:  data.address  || "",
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  /* ── Save profile ── */
  const handleSave = async () => {
    try {
      setSaving(true)
      setMsg("")
      const res  = await fetch("http://localhost:5000/users/profile/update", {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.msg || "Update failed")
        setMsgType("error")
        return
      }
      setProfile(prev => ({ ...prev, ...data.user }))
      setMsg("✅ Profile update ho gaya!")
      setMsgType("success")
      setEditing(false)
    } catch (err) {
      setMsg("❌ Server error")
      setMsgType("error")
    } finally {
      setSaving(false)
    }
  }

  const roleColor = {
    distributor: "from-purple-500 to-indigo-600",
    seller:      "from-blue-500 to-cyan-600",
    user:        "from-green-500 to-teal-600",
    admin:       "from-red-500 to-pink-600",
  }

  if (loading) return (
    <div className="p-8 text-center text-gray-400 animate-pulse">Loading profile...</div>
  )

  if (!profile) return (
    <div className="p-8 text-center text-red-500">Profile load nahi hua</div>
  )

  const initials = (profile.fullName || profile.name || "?")[0].toUpperCase()

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">

      {/* ── Header Card ── */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className={`bg-gradient-to-r ${roleColor[profile.role] || "from-gray-400 to-gray-600"} p-6 flex items-center gap-5`}>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold border-4 border-white/40">
            {initials}
          </div>
          <div className="text-white">
            <h1 className="text-2xl font-bold">{profile.fullName || profile.name}</h1>
            <p className="text-white/80 text-sm font-mono">{profile.name}</p>
            <span className="text-xs bg-white/20 px-3 py-0.5 rounded-full mt-1 inline-block capitalize">
              {getRoleLabel(profile.role)}
            </span>
          </div>
        </div>

        {/* System ID — read only, clearly shown */}
        <div className="bg-gray-50 border-b px-6 py-3 flex items-center gap-3">
          <span className="text-xs text-gray-400 uppercase font-semibold tracking-wide">System ID</span>
          <span className="font-mono font-bold text-blue-700 text-lg">{profile.name}</span>
          <span className="text-xs text-gray-400 ml-auto">(Change nahi ho sakta)</span>
        </div>

        {/* ── Details / Edit Form ── */}
        <div className="p-6 space-y-4">

          {msg && (
            <div className={`p-3 rounded text-sm font-medium ${
              msgType === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}>
              {msg}
            </div>
          )}

          {!editing ? (
            /* ── View Mode ── */
            <div className="space-y-3 text-sm">
              <Row icon="👤" label="Full Name"    value={profile.fullName || "—"} />
              <Row icon="📧" label="Email"        value={profile.email    || "—"} />
              <Row icon="📞" label="Phone"        value={profile.phone    || "—"} />
              <Row icon="📍" label="Address"      value={profile.address  || "—"} />
              <Row icon="📅" label="Joining Date" value={
                profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric"
                    })
                  : "—"
              } />

              {/* ⭐ Reports To — admin ke alawa sab ke liye */}
              {["distributor", "seller", "user"].includes(profile.role) && (
                <Row
                  icon="👆"
                  label="Reports To"
                  value={
                    profile.parentId?.name
                      ? `${profile.parentId.name} (${profile.parentId.role})`
                      : "—"
                  }
                />
              )}

              <button
                onClick={() => { setEditing(true); setMsg("") }}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition"
              >
                ✏️ Edit Profile
              </button>
            </div>

          ) : (
            /* ── Edit Mode ── */
            <div className="space-y-4">

              <Field label="Full Name" icon="👤">
                <input
                  className="border rounded-lg p-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.fullName}
                  onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Apna poora naam"
                />
              </Field>

              <Field label="Email" icon="📧">
                <div className="border rounded-lg p-2.5 w-full text-sm bg-gray-50 text-gray-500 flex items-center gap-2">
                  {form.email || profile.email}
                  <span className="ml-auto text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded">Change nahi hoga</span>
                </div>
              </Field>

              <Field label="Phone" icon="📞">
                <input
                  className="border rounded-lg p-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </Field>

              <Field label="Address" icon="📍">
                <textarea
                  className="border rounded-lg p-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  rows={3}
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Poora address"
                />
              </Field>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "💾 Save"}
                </button>
                <button
                  onClick={() => { setEditing(false); setMsg(""); load() }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Helper components ── */
function Row({ icon, label, value }) {
  return (
    <div className="flex gap-3 items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-lg w-7 shrink-0">{icon}</span>
      <span className="text-gray-400 w-28 shrink-0 text-xs uppercase font-semibold tracking-wide pt-0.5">{label}</span>
      <span className="font-medium text-gray-800 break-all">{value}</span>
    </div>
  )
}

function Field({ icon, label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {icon} {label}
      </label>
      {children}
    </div>
  )
}
