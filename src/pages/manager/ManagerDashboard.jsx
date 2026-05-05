import { useEffect, useState, useCallback } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { getBranchDashboard } from "../../api/reports";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import RefreshBar from "../../components/ui/RefreshBar";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
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

const fmt      = (n) => `UGX ${Number(n || 0).toLocaleString()}`;
const fmtShort = (n) => {
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

const statusColor = (status) => {
  const map = {
    collected:   "bg-green-100 text-green-600",
    received:    "bg-blue-100 text-blue-600",
    ready:       "bg-teal-100 text-teal-600",
    washing:     "bg-yellow-100 text-yellow-600",
    ironing:     "bg-orange-100 text-orange-600",
    packaging:   "bg-purple-100 text-purple-600",
    uncollected: "bg-red-100 text-red-500",
  };
  return map[status] || "bg-gray-100 text-gray-500";
};

export default function ManagerDashboard() {
  const { user }          = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const branchId = user?.branch?._id || user?.branch;

  const fetchData = useCallback(async () => {
    if (!branchId) {
      setError("No branch assigned to your account.");
      setLoading(false);
      return;
    }
    try {
      const res = await getBranchDashboard(branchId);
      setData(res.data.data);
      setError("");
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

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

  const orders       = data?.orders       || {};
  const finance      = data?.finance      || {};
  const customers    = data?.customers    || {};
  const inventory    = data?.inventory    || {};
  const recentOrders = data?.recentOrders || [];
  const topCustomers = data?.topCustomers || [];
  const charts       = data?.charts       || {};

  // Build daily revenue data from charts or recentOrders
  const dailyRevenue = Array.isArray(charts.revenueByDay)
    ? charts.revenueByDay.map((d) => ({
        date:    d._id || d.date,
        revenue: d.total ?? d.revenue ?? 0,
      }))
    : [];

  const ordersByStatus = Array.isArray(charts.ordersByStatus)
    ? charts.ordersByStatus.map((s) => ({
        name:  s._id   || s.status || "Unknown",
        value: s.count || 0,
      }))
    : [];

  return (
    <Layout>
      <div className="space-y-6">

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">Branch Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {user?.branch?.name || "Your branch"} — overview
          </p>
        </div>

        <RefreshBar
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          onRefresh={refresh}
        />

        {/* Orders row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Orders"   value={orders.total}      icon="🧺" color="bg-blue-50"   sub={`${orders.inPeriod ?? 0} this period`} />
          <StatCard label="Pending"        value={orders.pending}    icon="⏳" color="bg-yellow-50" />
          <StatCard label="Uncollected"    value={orders.uncollected} icon="⚠️" color="bg-red-50"   sub="Needs attention" />
          <StatCard label="Customers"      value={customers.total}   icon="👤" color="bg-indigo-50" sub={`${customers.new ?? 0} new`} />
        </div>

        {/* Finance row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue"  value={fmt(finance.totalRevenue)}   icon="💰" color="bg-green-50"  />
          <StatCard label="Period Revenue" value={fmt(finance.periodRevenue)}  icon="📈" color="bg-teal-50"   />
          <StatCard label="Expenses"       value={fmt(finance.periodExpenses)} icon="💸" color="bg-red-50"    />
          <StatCard label="Profit"         value={fmt(finance.periodProfit)}   icon="🏦" color="bg-purple-50" />
        </div>

        {/* Low stock alert */}
        {inventory.lowStockAlerts > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <p className="text-sm font-semibold text-orange-700">
                {inventory.lowStockAlerts} item{inventory.lowStockAlerts > 1 ? "s" : ""} low on stock
              </p>
              <p className="text-xs text-orange-500">Check inventory to restock</p>
            </div>
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Daily Revenue — Area Chart */}
          <Section title="Revenue Trend">
            {dailyRevenue.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No daily revenue data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip content={<CustomTooltip prefix="UGX " />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Section>

          {/* Orders by Status — Donut Chart */}
          <Section title="Orders by Status">
            {ordersByStatus.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No order status data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
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

        {/* Recent orders + Top customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Recent Orders">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.slice(0, 6).map((o) => (
                  <div key={o._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{o.orderNumber}</p>
                      <p className="text-xs text-gray-400">{o.customer?.name || "Unknown"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{fmt(o.totalAmount)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Top Customers">
            {topCustomers.length === 0 ? (
              <p className="text-sm text-gray-400">No customer data yet.</p>
            ) : (
              <div className="space-y-3">
                {topCustomers.slice(0, 6).map((c, i) => (
                  <div key={c._id || i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">
                          {c.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.totalOrders ?? 0} orders</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-green-600">{fmt(c.totalSpent)}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </Layout>
  );
}