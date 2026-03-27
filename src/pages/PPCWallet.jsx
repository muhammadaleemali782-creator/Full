import { useState, useEffect } from "react"

/* =====================================================
   PPC WALLET PAGE (MOBILE RESPONSIVE)
   Shows multi-wallet view based on role
===================================================== */

export default function PPCWallet() {
  
  const [loading, setLoading] = useState(true)
  const [walletData, setWalletData] = useState(null)
  const [error, setError] = useState("")
  
  useEffect(() => {
    fetchWallet()
  }, [])
  
  const fetchWallet = async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please login first")
        setLoading(false)
        return
      }
      
      const res = await fetch("http://localhost:5000/api/ppc/wallet/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (!res.ok) {
        throw new Error("Failed to load wallet")
      }
      
      const data = await res.json()
      setWalletData(data)
      setError("")
      
    } catch (err) {
      console.error("Wallet fetch error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    )
  }
  
  if (!walletData) {
    return <div className="text-center py-8">No wallet data found</div>
  }
  
  return (
    <div className="max-w-7xl mx-auto space-y-6 px-2 sm:px-4">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">💰 My PPC Wallet</h1>
        <p className="text-sm sm:text-base opacity-90">Role: <span className="font-semibold uppercase">{walletData.role}</span></p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Total Earned */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total PPC Earned</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                ₹{walletData.totalPPCEarned?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Total Withdrawn */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Withdrawn</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                ₹{walletData.totalWithdrawn?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Wallets Section */}
      {walletData.wallets && (
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Your Wallets</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {Object.entries(walletData.wallets).map(([key, wallet]) => (
              <div 
                key={key} 
                className={`
                  bg-white rounded-lg shadow-md border-l-4 p-4 sm:p-6
                  ${wallet.withdrawable ? 'border-green-500' : 'border-orange-500'}
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                      {key === "distributorWallet" && "📊 Distributor Wallet"}
                      {key === "sellerWallet" && "💼 Seller Wallet"}
                      {key === "userWallet" && "👤 User Wallet"}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {wallet.description}
                    </p>
                  </div>
                  
                  {wallet.withdrawable ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold ml-2">
                      Withdrawable
                    </span>
                  ) : (
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-semibold ml-2">
                      Locked
                    </span>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Balance</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    ₹{wallet.balance?.toFixed(2) || "0.00"}
                  </p>
                </div>
                
                {wallet.withdrawable && wallet.balance > 0 && (
                  <button
                    onClick={() => window.location.href = "#withdrawal-request"}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Request Withdrawal
                  </button>
                )}
                
                {!wallet.withdrawable && (
                  <div className="text-xs sm:text-sm text-orange-700 bg-orange-50 p-3 rounded">
                    <strong>Note:</strong> This wallet is used for level progression only
                  </div>
                )}
              </div>
            ))}
            
          </div>
        </div>
      )}
      
      {/* Commission History */}
      {walletData.history && walletData.history.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Recent Earnings</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Level
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {walletData.history.slice(0, 10).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {item.fromUser?.name || "N/A"}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-green-600">
                      +₹{item.amount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                      L{item.level}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {walletData.history.length > 10 && (
            <p className="text-center text-sm text-gray-600 mt-4">
              Showing 10 of {walletData.history.length} transactions
            </p>
          )}
        </div>
      )}
      
    </div>
  )
}
