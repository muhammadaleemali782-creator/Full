import { useEffect, useState } from "react"

export default function UserProfile({ userId, onBack }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://localhost:5000/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setUser(data)
    }
    loadUser()
  }, [userId])

  if (!user) return <p className="p-6 text-gray-400">Loading profile...</p>

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-lg">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:underline text-sm">
        ← Back
      </button>

      {/* Avatar + Name */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
          {(user.fullName || user.name || "?")[0].toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.fullName || user.name}</h2>
          <p className="text-xs font-mono text-gray-400">{user.name}</p>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 text-sm">
        <div className="flex gap-2">
          <span className="text-gray-400 w-24">📧 Email</span>
          <span className="font-medium">{user.email || "—"}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-24">📞 Phone</span>
          <span className="font-medium">{user.phone || "—"}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-24">📍 Address</span>
          <span className="font-medium">{user.address || "—"}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-24">🆔 System ID</span>
          <span className="font-mono text-gray-600">{user.name}</span>
        </div>
      </div>
    </div>
  )
}
