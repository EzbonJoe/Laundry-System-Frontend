import { useEffect, useState,useCallback } from "react";
import Layout from "../../components/layout/Layout";
import { getGlobalDashboard } from "../../api/reports";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import RefreshBar from "../../components/ui/RefreshBar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"];

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${color}`}>
        {icon}
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-800">{value ?? "—"}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100">
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const fmt     = (n) => `UGX ${Number(n || 0).toLocaleString()}`;
const fmtShort= (n) => {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n/1000).toFixed(0)}K`;
  return String(n || 0);
};

const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {prefix}{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function HQDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await getGlobalDashboard();
      setData(res.data.data);
      setError("");
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const { lastUpdated, refreshing, refresh } = useAutoRefresh(fetchData, 60000);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm animate-pulse">Loading dashboard...</div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm">{error}</div>
    </Layout>
  );

  const overview  = data?.overview  || {};
  const revenue   = data?.revenue   || {};
  const finance   = data?.finance   || {};
  const branches  = data?.branches  || {};
  const customers = data?.customers || {};
  const inventory = data?.inventory || {};
  const charts    = data?.charts    || {};

  const revenueByBranch = (charts.revenueByBranch || []).map((b) => ({
    name:    b.branchName || b._id || "Branch",
    revenue: b.revenue    || 0,
    orders:  b.count      || 0,
  }));

  const ordersByStatus = (charts.ordersByStatus || []).map((s) => ({
    name:  s._id   || s.status || "Unknown",
    value: s.count || 0,
  }));

  return (
    <Layout>
      <div className="space-y-6">

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">HQ Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Global overview across all branches</p>
        </div>

        {/* Auto-refresh bar */}
        <RefreshBar
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          onRefresh={refresh}
        />

        {/* Stat cards row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Branches"  value={branches.total}    icon="🏢" color="bg-purple-50" sub={`${branches.active ?? 0} active`} />
          <StatCard label="Total Customers" value={customers.total}   icon="👤" color="bg-indigo-50" sub={`${customers.active ?? 0} active`} />
          <StatCard label="Total Orders"    value={overview.totalOrders ?? data?.orders?.total} icon="🧺" color="bg-blue-50" />
          <StatCard label="Low Stock Alerts" value={inventory.lowStockAlerts} icon="📦" color="bg-orange-50" />
        </div>

        {/* Stat cards row 2 — finance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue"   value={fmt(finance.totalRevenue)}   icon="💰" color="bg-green-50"  />
          <StatCard label="Period Revenue"  value={fmt(finance.periodRevenue)}  icon="📈" color="bg-teal-50"   />
          <StatCard label="Period Expenses" value={fmt(finance.periodExpenses)} icon="💸" color="bg-red-50"    />
          <StatCard label="Period Profit"   value={fmt(finance.periodProfit)}   icon="🏦" color="bg-yellow-50" />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Revenue by Branch — Bar Chart */}
          <Section title="Revenue by Branch">
            {revenueByBranch.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No branch revenue data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueByBranch} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <Tooltip content={<CustomTooltip prefix="UGX " />} />
                  <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>

          {/* Orders by Status — Pie Chart */}
          <Section title="Orders by Status">
            {ordersByStatus.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No order status data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ordersByStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val, name]} />
                  <Legend
                    formatter={(val) => (
                      <span className="text-xs text-gray-600 capitalize">{val}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>

        {/* Orders stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Pending Orders"    value={data?.orders?.pending}     icon="⏳" color="bg-yellow-50" />
          <StatCard label="Uncollected Orders" value={data?.orders?.uncollected} icon="⚠️" color="bg-red-50" sub="Needs attention" />
          <StatCard label="Active Customers"   value={customers.active}          icon="👥" color="bg-blue-50" />
        </div>

      </div>
    </Layout>
  );
}