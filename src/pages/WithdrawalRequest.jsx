import { useState, useEffect } from "react"

/* =====================================================
   WITHDRAWAL REQUEST PAGE (MOBILE RESPONSIVE)
   User can request withdrawal from their wallets
===================================================== */

export default function WithdrawalRequest() {
  
  const [loading, setLoading] = useState(false)
  const [walletData, setWalletData] = useState(null)
  const [requests, setRequests] = useState([])
  const [settings, setSettings] = useState(null)
  
  const [formData, setFormData] = useState({
    walletType: "",
    amount: "",
    paymentMethod: "",
    paymentDetails: ""
  })
  
  const [message, setMessage] = useState({ type: "", text: "" })
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      
      // Fetch wallet data
      const walletRes = await fetch("http://localhost:5000/api/ppc/wallet/me", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (walletRes.ok) {
        const data = await walletRes.json()
        setWalletData(data)
      }
      
      // Fetch withdrawal requests
      const reqRes = await fetch("http://localhost:5000/api/withdrawal/my-requests", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (reqRes.ok) {
        const data = await reqRes.json()
        setRequests(data)
      }
      
      // Fetch settings
      const settingsRes = await fetch("http://localhost:5000/api/ppc-settings", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data)
      }
      
    } catch (err) {
      console.error("Fetch data error:", err)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setMessage({ type: "", text: "" })
      
      const token = localStorage.getItem("token")
      if (!token) {
        setMessage({ type: "error", text: "Please login first" })
        setLoading(false)
        return
      }
      
      const res = await fetch("http://localhost:5000/api/withdrawal/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: "success", text: "Withdrawal request submitted successfully!" })
        setFormData({ walletType: "", amount: "", paymentMethod: "", paymentDetails: "" })
        fetchData()  // Refresh data
      } else {
        setMessage({ type: "error", text: data.message || "Failed to submit request" })
      }
      
    } catch (err) {
      console.error("Submit error:", err)
      setMessage({ type: "error", text: "Failed to submit request" })
    } finally {
      setLoading(false)
    }
  }
  
  const getWithdrawableWallets = () => {
    if (!walletData || !walletData.wallets) return []
    
    return Object.entries(walletData.wallets)
      .filter(([_, wallet]) => wallet.withdrawable && wallet.balance > 0)
      .map(([key, wallet]) => ({ key, ...wallet }))
  }
  
  const withdrawableWallets = getWithdrawableWallets()
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-4">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">💸 Withdrawal Request</h1>
        <p className="text-sm sm:text-base opacity-90">Request to withdraw your PPC earnings</p>
      </div>
      
      {/* Min Withdrawal Note */}
      {settings && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Minimum Withdrawal:</strong> ₹{settings.minimumWithdrawal}
          </p>
        </div>
      )}
      
      {/* Request Form */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">New Withdrawal Request</h2>
        
        {message.text && (
          <div className={`
            p-4 rounded-lg mb-4
            ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
          `}>
            {message.text}
          </div>
        )}
        
        {withdrawableWallets.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <p className="mb-2">No withdrawable balance available</p>
            <p className="text-sm">Earn more to request withdrawal</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Wallet Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Wallet <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.walletType}
                onChange={(e) => setFormData({ ...formData, walletType: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Choose Wallet --</option>
                {withdrawableWallets.map((wallet) => (
                  <option key={wallet.key} value={wallet.key}>
                    {wallet.key === "sellerWallet" && "Seller Wallet"}
                    {wallet.key === "sellerWalletAsSeller" && "Seller Wallet"}
                    {wallet.key === "userWalletAsSeller" && "User Wallet"}
                    {" - ₹"}
                    {wallet.balance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter amount"
              />
              {settings && formData.amount && parseFloat(formData.amount) < settings.minimumWithdrawal && (
                <p className="text-xs text-red-600 mt-1">
                  Minimum withdrawal: ₹{settings.minimumWithdrawal}
                </p>
              )}
            </div>
            
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Select Method --</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="paytm">Paytm</option>
                <option value="phonepe">PhonePe</option>
                <option value="gpay">Google Pay</option>
              </select>
            </div>
            
            {/* Payment Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Details (Account/UPI ID)
              </label>
              <textarea
                value={formData.paymentDetails}
                onChange={(e) => setFormData({ ...formData, paymentDetails: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter bank account details or UPI ID"
              ></textarea>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-3 rounded-lg font-semibold text-white transition duration-200
                ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}
              `}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
            
          </form>
        )}
      </div>
      
      {/* Request History */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Withdrawal Requests</h2>
        
        {requests.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No withdrawal requests yet</p>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div 
                key={req._id} 
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">₹{req.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">
                      {req.walletType === "sellerWallet" && "Seller Wallet"}
                      {req.walletType === "sellerWalletAsSeller" && "Seller Wallet"}
                      {req.walletType === "userWalletAsSeller" && "User Wallet"}
                    </p>
                  </div>
                  
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-semibold inline-block
                    ${req.status === "pending" && "bg-yellow-100 text-yellow-800"}
                    ${req.status === "approved" && "bg-green-100 text-green-800"}
                    ${req.status === "rejected" && "bg-red-100 text-red-800"}
                  `}>
                    {req.status.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500">
                  Requested: {new Date(req.createdAt).toLocaleString()}
                </p>
                
                {req.adminNote && (
                  <div className="mt-2 bg-gray-100 p-2 rounded text-xs">
                    <strong>Admin Note:</strong> {req.adminNote}
                  </div>
                )}
                
                {req.transactionId && (
                  <div className="mt-2 text-xs text-green-700">
                    <strong>Transaction ID:</strong> {req.transactionId}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  )
}
