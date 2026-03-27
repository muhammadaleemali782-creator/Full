import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { getRoleLabel } from "../utils/roleLabels"

export default function RaiseUserRequest() {

  const { user } = useAuth()

  const [type, setType] = useState(() => {
    const stored = localStorage.getItem("user")
    try {
      const u = JSON.parse(stored)
      if (u?.role === "user") return "user"
      if (u?.role === "distributor") return "distributor"
    } catch {}
    return "seller"
  })

  const [emailName, setEmailName]   = useState("")   // sirf naam part (before @)
  const [emailDomain, setEmailDomain] = useState("") // @educaved.com
  const [domainLoading, setDomainLoading] = useState(true)

  const [freeEmail, setFreeEmail]   = useState("")   // domain na ho tab full email
  const [loading, setLoading]       = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)

  const [generatedId, setGeneratedId] = useState("")
  const [name, setName]               = useState("")
  const [phone, setPhone]             = useState("")
  const [address, setAddress]         = useState("")

  const [products, setProducts]         = useState([])
  const [productIds, setProductIds]     = useState([])
  const [assignAllProducts, setAssignAllProducts] = useState(false)

  /* ── Computed full email ── */
  const fullEmail = emailDomain
    ? `${emailName.trim()}${emailDomain}`
    : freeEmail.trim()

  /* ── Email format check ── */
  const isValidEmail = (val) => {
    if (!val) return false
    // Agar domain mode hai to sirf @ ke baad kuch hona chahiye
    // Short domains like @educa bhi valid hain
    return /^[^\s@]+@[^\s@]+/.test(val.trim())
  }

  /* ── Load email domain from admin settings ── */
  useEffect(() => {
    const loadDomain = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("http://localhost:5000/settings/email-domain", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setEmailDomain(data.domain || "")
      } catch {}
      setDomainLoading(false)
    }
    loadDomain()
  }, [])

  /* ── Load products (admin only) ── */
  useEffect(() => {
    if (user?.role !== "admin") return
    const loadProducts = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("http://localhost:5000/products/all", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (Array.isArray(data)) setProducts(data)
      } catch {}
    }
    loadProducts()
  }, [user])

  /* ── Auto ID generator ── */
  useEffect(() => {
    const loadNextId = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return
        const res = await fetch(
          `http://localhost:5000/users/generate-id?type=${type}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const data = await res.json()
        if (data?.id) { setGeneratedId(data.id) }
      } catch {}
    }
    loadNextId()
  }, [type])

  /* ── Check email existence (debounced) ── */
  useEffect(() => {
    setEmailExists(false)
    const email = fullEmail
    if (!isValidEmail(email)) return

    const timer = setTimeout(async () => {
      setEmailChecking(true)
      try {
        const res = await fetch(
          `http://localhost:5000/check-email?email=${encodeURIComponent(email)}`
        )
        const data = await res.json()
        setEmailExists(data.exists)
      } catch {}
      setEmailChecking(false)
    }, 400)

    return () => clearTimeout(timer)
  }, [emailName, freeEmail, emailDomain])

  /* ── SUBMIT ── */
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) { alert("Name missing"); return }

    if (!isValidEmail(fullEmail)) {
      alert("Valid email likho" + (emailDomain ? ` (sirf naam likhna hai, domain automatic lagega)` : " (e.g. abc@gmail.com)"))
      return
    }

    // Final check on submit
    try {
      const chkRes = await fetch(
        `http://localhost:5000/check-email?email=${encodeURIComponent(fullEmail)}`
      )
      const chkData = await chkRes.json()
      if (chkData.exists) {
        alert("❌ Yeh email already registered hai! Dusra naam try karo.")
        setEmailExists(true)
        return
      }
    } catch {
      alert("Email check nahi ho paya")
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const res = await fetch("http://localhost:5000/requests/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          name,
          email: fullEmail,
          phone,
          address,
          generatedId,
          productIds: user?.role === "admin" ? productIds : [],
          assignAllProducts: user?.role === "admin" ? assignAllProducts : false
        })
      })

      const data = await res.json()
      if (!res.ok) { alert(data.message || "Error"); return }

      alert("Request sent to Admin ✅")

      // Reset
      setEmailName("")
      setFreeEmail("")
      setEmailExists(false)
      setName("")
      setPhone("")
      setAddress("")
      setProductIds([])
      setAssignAllProducts(false)

    } catch {
      alert("Server error")
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = loading || emailExists || emailChecking || !isValidEmail(fullEmail)

  if (domainLoading) return <div className="p-6 text-gray-400">Loading...</div>

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow max-w-md space-y-4"
    >
      <h2 className="font-bold text-xl">Request New User</h2>

      {/* TYPE SELECT */}
      <select
        className="border p-2 w-full rounded"
        value={type}
        onChange={e => setType(e.target.value)}
      >
        {user?.role === "distributor" && (
          <>
            <option value="distributor">{getRoleLabel("distributor")}</option>
            <option value="seller">{getRoleLabel("seller")}</option>
          </>
        )}
        {user?.role === "seller" && (
          <>
            <option value="seller">{getRoleLabel("seller")}</option>
            <option value="user">{getRoleLabel("user")}</option>
          </>
        )}
        {user?.role === "admin" && (
          <>
            <option value="seller">{getRoleLabel("seller")}</option>
            <option value="distributor">{getRoleLabel("distributor")}</option>
            <option value="user">{getRoleLabel("user")}</option>
          </>
        )}
        {user?.role === "user" && (
          <option value="user">{getRoleLabel("user")}</option>
        )}
      </select>

      {/* USER KA ASLI NAAM */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
        <input
          className="border p-2 w-full rounded"
          placeholder="Apna poora naam likho"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        {generatedId && (
          <p className="text-xs text-gray-400 mt-1">
            System ID: <span className="font-mono text-blue-600">{generatedId}</span> (auto-assigned)
          </p>
        )}
      </div>

      {/* ── EMAIL FIELD ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Email
          {emailDomain && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-normal">
              Domain: {emailDomain}
            </span>
          )}
        </label>

        {emailDomain ? (
          /* ── DOMAIN MODE — sirf naam likhna hai ── */
          <div className="flex items-center border rounded overflow-hidden">
            <input
              className="flex-1 p-2 outline-none text-sm"
              placeholder="sirf naam likho (e.g. john)"
              value={emailName}
              onChange={e => setEmailName(e.target.value.replace(/\s|@/g, ""))}
            />
            <span className="bg-gray-100 text-gray-500 px-3 py-2 text-sm border-l font-medium">
              {emailDomain}
            </span>
          </div>
        ) : (
          /* ── FREE MODE — poori email likhni hai ── */
          <input
            className="border p-2 w-full rounded text-sm"
            placeholder="Full email (e.g. abc@gmail.com)"
            value={freeEmail}
            onChange={e => setFreeEmail(e.target.value)}
          />
        )}

        {/* Preview */}
        {emailDomain && emailName && (
          <p className="text-xs text-gray-500 mt-1">
            📧 Full email: <b>{fullEmail}</b>
          </p>
        )}

        {/* Status messages */}
        {isValidEmail(fullEmail) && emailChecking && (
          <p className="text-xs text-gray-400 mt-1">🔄 Checking availability...</p>
        )}
        {isValidEmail(fullEmail) && !emailChecking && emailExists && (
          <p className="text-xs text-red-500 mt-1 font-medium">
            ❌ <b>{fullEmail}</b> already registered hai — dusra naam try karo
          </p>
        )}
        {isValidEmail(fullEmail) && !emailChecking && !emailExists && (
          <p className="text-xs text-green-600 mt-1">✅ Available hai</p>
        )}
        {!isValidEmail(fullEmail) && (emailName || freeEmail) && (
          <p className="text-xs text-red-400 mt-1">
            {emailDomain ? "Sirf naam likhna hai (koi special character nahi)" : "Valid email format chahiye"}
          </p>
        )}
      </div>

      {/* PHONE */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">Phone Number</label>
        <input
          className="border p-2 w-full rounded"
          placeholder="Mobile number likho"
          value={phone}
          onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          maxLength={10}
        />
      </div>

      {/* ADDRESS */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">Address</label>
        <textarea
          className="border p-2 w-full rounded text-sm"
          placeholder="Poora address likho"
          rows={3}
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
      </div>

      {/* PRODUCT ASSIGN – ADMIN ONLY */}
      {user?.role === "admin" && products.length > 0 && (
        <div className="border p-3 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Assign Products</h3>
          <label className="flex gap-2 items-center mb-2">
            <input
              type="checkbox"
              checked={assignAllProducts}
              onChange={(e) => {
                setAssignAllProducts(e.target.checked)
                setProductIds(e.target.checked ? products.map(p => p._id) : [])
              }}
            />
            Assign ALL Products
          </label>
          {!assignAllProducts && (
            <div className="max-h-40 overflow-auto border p-2 rounded space-y-1">
              {products.map(p => (
                <label key={p._id} className="flex gap-2 items-center text-sm">
                  <input
                    type="checkbox"
                    checked={productIds.includes(p._id)}
                    onChange={() => setProductIds(prev =>
                      prev.includes(p._id)
                        ? prev.filter(id => id !== p._id)
                        : [...prev, p._id]
                    )}
                  />
                  {p.title} ₹{p.price}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={isDisabled}
        className={`w-full py-2 rounded text-white font-medium transition ${
          isDisabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Sending..." : "Send Request"}
      </button>

    </form>
  )
}
