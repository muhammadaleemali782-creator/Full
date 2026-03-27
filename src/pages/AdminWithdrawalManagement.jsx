import { useState, useEffect } from "react"

/* =====================================================
   ADMIN WITHDRAWAL MANAGEMENT (MOBILE RESPONSIVE)
   Approve/Reject withdrawal requests
===================================================== */

export default function AdminWithdrawalManagement() {
  
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState("pending")
  const [message, setMessage] = useState({ type: "", text: "" })
  
  const [modalData, setModalData] = useState({
    show: false,
    action: "",
    request: null,
    transactionId: "",
    note: ""
  })
  
  useEffect(() => {
    fetchRequests()
  }, [filter])
  
  const fetchRequests = async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem("token")
      if (!token) return
      
      const url = filter 
        ? `http://localhost:5000/api/withdrawal/admin/all?status=${filter}`
        : "http://localhost:5000/api/withdrawal/admin/all"
      
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      }
      
    } catch (err) {
      console.error("Fetch requests error:", err)
    } finally {
      setLoading(false)
    }
  }
  
  const openModal = (action, request) => {
    setModalData({
      show: true,
      action,
      request,
      transactionId: "",
      note: ""
    })
    setMessage({ type: "", text: "" })
  }
  
  const closeModal = () => {
    setModalData({
      show: false,
      action: "",
      request: null,
      transactionId: "",
      note: ""
    })
  }
  
  const handleApprove = async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem("token")
      if (!token) return
      
      const res = await fetch(`http://localhost:5000/api/withdrawal/admin/approve/${modalData.request._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionId: modalData.transactionId,
          note: modalData.note
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: "success", text: "Withdrawal approved successfully!" })
        closeModal()
        fetchRequests()
      } else {
        setMessage({ type: "error", text: data.message || "Failed to approve" })
      }
      
    } catch (err) {
      console.error("Approve error:", err)
      setMessage({ type: "error", text: "Failed to approve withdrawal" })
    } finally {
      setLoading(false)
    }
  }
  
  const handleReject = async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem("token")
      if (!token) return
      
      const res = await fetch(`http://localhost:5000/api/withdrawal/admin/reject/${modalData.request._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: modalData.note || "Rejected by admin"
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: "success", text: "Withdrawal rejected" })
        closeModal()
        fetchRequests()
      } else {
        setMessage({ type: "error", text: data.message || "Failed to reject" })
      }
      
    } catch (err) {
      console.error("Reject error:", err)
      setMessage({ type: "error", text: "Failed to reject withdrawal" })
    } finally {
      setLoading(false)
    }
  }
  
  const getWalletLabel = (type) => {
    if (type === "sellerWallet") return "Seller Wallet"
    if (type === "sellerWalletAsSeller") return "Seller Wallet"
    if (type === "userWalletAsSeller") return "User Wallet"
    return type
  }
  
  return (
    <div className="max-w-7xl mx-auto space-y-6 px-2 sm:px-4">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">💳 Withdrawal Management</h1>
        <p className="text-sm sm:text-base opacity-90">Approve or reject withdrawal requests</p>
      </div>
      
      {/* Message */}
      {message.text && (
        <div className={`
          p-4 rounded-lg
          ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
        `}>
          {message.text}
        </div>
      )}
      
      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-2 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilter("pending")}
          className={`
            px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition duration-200
            ${filter === "pending" 
              ? "bg-yellow-600 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
          `}
        >
          ⏳ Pending
        </button>
        
        <button
          onClick={() => setFilter("approved")}
          className={`
            px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition duration-200
            ${filter === "approved" 
              ? "bg-green-600 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
          `}
        >
          ✅ Approved
        </button>
        
        <button
          onClick={() => setFilter("rejected")}
          className={`
            px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition duration-200
            ${filter === "rejected" 
              ? "bg-red-600 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
          `}
        >
          ❌ Rejected
        </button>
        
        <button
          onClick={() => setFilter("")}
          className={`
            px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition duration-200
            ${filter === "" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"}
          `}
        >
          📋 All
        </button>
      </div>
      
      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
          <p className="text-lg font-semibold mb-2">No requests found</p>
          <p className="text-sm">No {filter || "any"} withdrawal requests</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => (
            <div 
              key={req._id} 
              className="bg-white rounded-lg shadow-md border-l-4 border-orange-500 p-4 sm:p-6"
            >
              {/* User Info */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {req.userId?.name || "Unknown User"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    📧 {req.userId?.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    📱 {req.userId?.phone || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Role: <span className="font-semibold uppercase">{req.userRole}</span>
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
              
              {/* Amount & Wallet Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Amount</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{req.amount?.toFixed(2)}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Wallet</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {getWalletLabel(req.walletType)}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Balance at Request</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{req.balanceAtRequest?.toFixed(2)}
                  </p>
                </div>
              </div>
              
              {/* Payment Details */}
              {req.paymentMethod && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-xs text-blue-800 mb-1">
                    <strong>Payment Method:</strong> {req.paymentMethod}
                  </p>
                  {req.paymentDetails && (
                    <p className="text-xs text-blue-800">
                      <strong>Details:</strong> {req.paymentDetails}
                    </p>
                  )}
                </div>
              )}
              
              {/* Admin Note */}
              {req.adminNote && (
                <div className="bg-gray-100 p-3 rounded-lg mb-4">
                  <p className="text-xs font-semibold text-gray-800 mb-1">Admin Note:</p>
                  <p className="text-sm text-gray-700">{req.adminNote}</p>
                </div>
              )}
              
              {/* Transaction ID */}
              {req.transactionId && (
                <div className="bg-green-50 p-3 rounded-lg mb-4">
                  <p className="text-xs text-green-800">
                    <strong>Transaction ID:</strong> {req.transactionId}
                  </p>
                </div>
              )}
              
              {/* Dates */}
              <div className="text-xs text-gray-500 mb-4 space-y-1">
                <p>Requested: {new Date(req.createdAt).toLocaleString()}</p>
                {req.approvedAt && (
                  <p className="text-green-600">Approved: {new Date(req.approvedAt).toLocaleString()}</p>
                )}
                {req.rejectedAt && (
                  <p className="text-red-600">Rejected: {new Date(req.rejectedAt).toLocaleString()}</p>
                )}
              </div>
              
              {/* Action Buttons */}
              {req.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal("approve", req)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    ✅ Approve
                  </button>
                  
                  <button
                    onClick={() => openModal("reject", req)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
              
            </div>
          ))}
        </div>
      )}
      
      {/* Modal */}
      {modalData.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {modalData.action === "approve" ? "✅ Approve Withdrawal" : "❌ Reject Withdrawal"}
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">User: {modalData.request?.userId?.name}</p>
              <p className="text-lg font-bold text-gray-900">Amount: ₹{modalData.request?.amount?.toFixed(2)}</p>
            </div>
            
            {modalData.action === "approve" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={modalData.transactionId}
                  onChange={(e) => setModalData({ ...modalData, transactionId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter transaction ID"
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {modalData.action === "approve" ? "Note (Optional)" : "Rejection Reason"}
              </label>
              <textarea
                value={modalData.note}
                onChange={(e) => setModalData({ ...modalData, note: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={modalData.action === "approve" ? "Add a note..." : "Why rejecting?"}
              ></textarea>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              
              <button
                onClick={modalData.action === "approve" ? handleApprove : handleReject}
                disabled={loading}
                className={`
                  flex-1 font-semibold py-2 px-4 rounded-lg transition duration-200
                  ${loading ? "bg-gray-400 cursor-not-allowed text-gray-200" : ""}
                  ${modalData.action === "approve" && !loading ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                  ${modalData.action === "reject" && !loading ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                `}
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  )
}
