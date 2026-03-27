import { useState, useEffect } from "react"

/* =====================================================
   ADMIN PPC SETTINGS PAGE (MOBILE RESPONSIVE)
   Configure PPC rates and withdrawal limits
===================================================== */

export default function AdminPPCSettings() {
  
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState(null)
  const [message, setMessage] = useState({ type: "", text: "" })
  
  const [formData, setFormData] = useState({
    sellerPPCRate: "",
    sellerPPCType: "percentage",
    distributorBaseRate: "",
    distributorDirectRate: "",
    minimumWithdrawal: ""
  })
  
  useEffect(() => {
    fetchSettings()
  }, [])
  
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      
      const res = await fetch("http://localhost:5000/api/ppc-settings", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setFormData({
          sellerPPCRate: data.sellerPPCRate || "",
          sellerPPCType: data.sellerPPCType || "percentage",
          distributorBaseRate: data.distributorBaseRate || "",
          distributorDirectRate: data.distributorDirectRate || "",
          minimumWithdrawal: data.minimumWithdrawal || ""
        })
      }
      
    } catch (err) {
      console.error("Fetch settings error:", err)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setMessage({ type: "", text: "" })
      
      const token = localStorage.getItem("token")
      if (!token) {
        setMessage({ type: "error", text: "Unauthorized" })
        setLoading(false)
        return
      }
      
      const res = await fetch("http://localhost:5000/api/ppc-settings/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: "success", text: "PPC settings updated successfully!" })
        setSettings(data.settings)
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update settings" })
      }
      
    } catch (err) {
      console.error("Update error:", err)
      setMessage({ type: "error", text: "Failed to update settings" })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-4">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">⚙️ PPC Settings</h1>
        <p className="text-sm sm:text-base opacity-90">Configure reward points and withdrawal limits</p>
      </div>
      
      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Seller PPC</h3>
          <p className="text-sm text-blue-800">
            Percentage of sale amount or fixed amount per sale
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">💰 Distributor PPC</h3>
          <p className="text-sm text-green-800">
            ₹10 (with seller in chain) or ₹20 (direct connection)
          </p>
        </div>
        
      </div>
      
      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Configure PPC Rates</h2>
        
        {message.text && (
          <div className={`
            p-4 rounded-lg mb-4
            ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
          `}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Seller PPC Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🛍️ Seller Commission</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* PPC Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PPC Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sellerPPCType}
                  onChange={(e) => setFormData({ ...formData, sellerPPCType: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              
              {/* PPC Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.sellerPPCType === "percentage" ? "Percentage (%)" : "Amount (₹)"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sellerPPCRate}
                  onChange={(e) => setFormData({ ...formData, sellerPPCRate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={formData.sellerPPCType === "percentage" ? "e.g., 10" : "e.g., 50"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.sellerPPCType === "percentage" 
                    ? "% of total sale amount" 
                    : "Fixed amount per sale"}
                </p>
              </div>
              
            </div>
          </div>
          
          {/* Distributor PPC Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Distributor Commission</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Base Rate (with seller) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Rate (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.distributorBaseRate}
                  onChange={(e) => setFormData({ ...formData, distributorBaseRate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When seller exists in chain
                </p>
              </div>
              
              {/* Direct Rate (no seller) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direct Rate (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.distributorDirectRate}
                  onChange={(e) => setFormData({ ...formData, distributorDirectRate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Direct connection (no seller between)
                </p>
              </div>
              
            </div>
          </div>
          
          {/* Withdrawal Limits */}
          <div className="pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">💳 Withdrawal Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Withdrawal Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.minimumWithdrawal}
                onChange={(e) => setFormData({ ...formData, minimumWithdrawal: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., 100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Users must have at least this amount to request withdrawal
              </p>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 rounded-lg font-semibold text-white transition duration-200
              ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}
            `}
          >
            {loading ? "Updating..." : "💾 Save Settings"}
          </button>
          
        </form>
      </div>
      
      {/* Current Settings Display */}
      {settings && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Current Settings</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Seller PPC</p>
              <p className="text-xl font-bold text-gray-900">
                {settings.sellerPPCType === "percentage" 
                  ? `${settings.sellerPPCRate}%` 
                  : `₹${settings.sellerPPCRate}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {settings.sellerPPCType === "percentage" ? "of sale" : "per sale"}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Distributor PPC</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{settings.distributorBaseRate} / ₹{settings.distributorDirectRate}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Base / Direct
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Min Withdrawal</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{settings.minimumWithdrawal}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Last Updated</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(settings.updatedAt).toLocaleString()}
              </p>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  )
}
