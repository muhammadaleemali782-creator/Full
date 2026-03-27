import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

/*
  =====================================================
  ANALYTICS CHART (PRODUCTION READY - FINAL FIXED)
  -----------------------------------------------------
  ✔ Smooth curve
  ✔ Responsive
  ✔ Clean professional look
  ✔ Works for Admin / Distributor / Seller
  ✔ Always shows graph (even if no sales)
  =====================================================
*/

export default function AnalyticsChart({ data }) {

  // 🔥 Generate empty fallback data (flat graph)
  const generateEmptyData = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      label: `Day ${i + 1}`,
      sales: 0
    }))
  }

  // ✅ If no data → use fallback
  const finalData =
    data && data.length > 0 ? data : generateEmptyData()

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={finalData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#2563eb"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Optional message but graph always visible */}
      {(!data || data.length === 0) && (
        <p className="text-gray-500 text-sm mt-2 text-center">
          No sales yet for this period
        </p>
      )}
    </div>
  )
}