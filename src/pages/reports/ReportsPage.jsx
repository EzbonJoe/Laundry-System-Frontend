import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import RefreshBar from "../../components/ui/RefreshBar";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  getRevenueReport,
  getProfitLoss,
  getStaffActivity,
  getFraudRisk,
  getUncollectedReport,
  getCustomerReport,
  getInventoryReport,
  getExpensesReport,
} from "../../api/reports";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"];

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

const fmtShort = (n) => {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n/1000).toFixed(0)}K`;
  return String(n || 0);
};

const ChartTooltip = ({ active, payload, label, prefix = "" }) => {
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

const Tab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`text-sm px-4 py-2.5 rounded-xl font-medium border transition-colors whitespace-nowrap
      ${active
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
      }`}
  >
    {label}
  </button>
);

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100">
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${color}`}>
        {icon}
      </div>
    </div>
    <p className="text-xl font-bold text-gray-800">{value ?? "—"}</p>
  </div>
);

const EmptyState = ({ message = "No data available yet." }) => (
  <div className="text-center py-8 text-gray-400 text-sm">{message}</div>
);

const EmptyChart = ({ message }) => (
  <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
    {message}
  </div>
);

export default function ReportsPage() {
  const { user }  = useAuth();
  const isAdmin   = user?.role === "hq_admin";
  const branchId  = user?.branch?._id || user?.branch;

  const [activeTab, setActiveTab] = useState("revenue");
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");

  const tabs = [
    { key: "revenue",       label: "Revenue"        },
    { key: "profitloss",    label: "Profit & Loss"  },
    { key: "uncollected",   label: "Uncollected"    },
    { key: "customers",     label: "Customers"      },
    { key: "inventory",     label: "Inventory"      },
    { key: "expenses",      label: "Expenses"       },
    { key: "staffactivity", label: "Staff Activity" },
    ...(isAdmin ? [{ key: "fraud", label: "Fraud Risk" }] : []),
  ];

  const fetchReport = () => {
    setLoading(true);
    setError("");
    setData(null);

    const params = {};
    if (dateFrom) params.from   = dateFrom;
    if (dateTo)   params.to     = dateTo;
    if (branchId) params.branch = branchId;

    const call =
      activeTab === "revenue"       ? getRevenueReport(params)    :
      activeTab === "profitloss"    ? getProfitLoss(params)        :
      activeTab === "uncollected"   ? getUncollectedReport(params) :
      activeTab === "customers"     ? getCustomerReport(params)    :
      activeTab === "inventory"     ? getInventoryReport(params)   :
      activeTab === "expenses"      ? getExpensesReport(params)    :
      activeTab === "staffactivity" ? getStaffActivity(params)     :
      activeTab === "fraud"         ? getFraudRisk()               :
      null;

    if (!call) return setLoading(false);

    call
      .then((res) => setData(res.data.data))
      .catch(() => setError("Failed to load report."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(); }, [activeTab]);

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Reports</h1>
            <p className="text-sm text-gray-400 mt-0.5">Analytics and insights</p>
          </div>
        </div>

        {/* Refresh bar — shows last fetch time + manual refresh */}
        <RefreshBar
          lastUpdated={data ? new Date() : null}
          refreshing={loading}
          onRefresh={fetchReport}
        />

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              label={tab.label}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </div>

        {/* Date filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">From</label>
            <input
              type="date" value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium">To</label>
            <input
              type="date" value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchReport}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Apply
          </button>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">
            Loading report...
          </div>
        ) : !data ? null : (
          <>
            {/* ── Revenue ── */}
            {activeTab === "revenue" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Total Revenue" value={fmt(data.totalRevenue)} icon="💰" color="bg-green-50" />
                  <StatCard
                    label="Total Orders"
                    value={data.byBranch?.reduce((s, b) => s + (b.count || 0), 0) ?? "—"}
                    icon="🧺" color="bg-blue-50"
                  />
                </div>

                {/* Daily Revenue Area Chart */}
                {Array.isArray(data.byDay) && data.byDay.length > 0 ? (
                  <Section title="Daily Revenue Trend">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart
                        data={data.byDay.map((d) => ({
                          date:    d._id || d.date,
                          revenue: d.total ?? d.revenue ?? 0,
                        }))}
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                        <Tooltip content={<ChartTooltip prefix="UGX " />} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#revGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Section>
                ) : null}

                {/* Revenue by Payment Method Bar Chart */}
                {Array.isArray(data.byMethod) && data.byMethod.length > 0 ? (
                  <Section title="Revenue by Payment Method">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={data.byMethod.map((m) => ({
                          name:    m._id?.replace("_", " ") || "Unknown",
                          revenue: m.total ?? m.revenue ?? 0,
                        }))}
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <Tooltip content={<ChartTooltip prefix="UGX " />} />
                        <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Section>
                ) : null}

                {/* Revenue by Branch Bar Chart — HQ Admin only */}
                {isAdmin && Array.isArray(data.byBranch) && data.byBranch.length > 0 ? (
                  <Section title="Revenue by Branch">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={data.byBranch.map((b) => ({
                          name:    b.branchName || b._id,
                          revenue: b.revenue    || 0,
                          orders:  b.count      || 0,
                        }))}
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <Tooltip content={<ChartTooltip prefix="UGX " />} />
                        <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Section>
                ) : null}
              </div>
            )}

            {/* ── Profit & Loss ── */}
            {activeTab === "profitloss" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Revenue"  value={fmt(data.revenue  ?? data.totalRevenue)}  icon="💰" color="bg-green-50"  />
                  <StatCard label="Expenses" value={fmt(data.expenses ?? data.totalExpenses)} icon="💸" color="bg-red-50"    />
                  <StatCard label="Profit"   value={fmt(data.profit   ?? data.netProfit)}     icon="📈" color="bg-teal-50"   />
                  <StatCard
                    label="Margin"
                    value={
                      data.margin       ? `${Number(data.margin).toFixed(1)}%`       :
                      data.profitMargin ? `${Number(data.profitMargin).toFixed(1)}%` : "—"
                    }
                    icon="%" color="bg-purple-50"
                  />
                </div>

                {/* Revenue vs Expenses Bar Chart */}
                <Section title="Revenue vs Expenses">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={[{
                        name:     "This Period",
                        Revenue:  data.revenue  ?? data.totalRevenue  ?? 0,
                        Expenses: data.expenses ?? data.totalExpenses ?? 0,
                        Profit:   data.profit   ?? data.netProfit     ?? 0,
                      }]}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <Tooltip content={<ChartTooltip prefix="UGX " />} />
                      <Bar dataKey="Revenue"  fill="#10b981" radius={[6,6,0,0]} />
                      <Bar dataKey="Expenses" fill="#ef4444" radius={[6,6,0,0]} />
                      <Bar dataKey="Profit"   fill="#3b82f6" radius={[6,6,0,0]} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </Section>

                {/* Expenses by Category Pie Chart */}
                {Array.isArray(data.expensesByCategory) && data.expensesByCategory.length > 0 ? (
                  <Section title="Expenses by Category">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={data.expensesByCategory.map((c) => ({
                            name:  c._id   || c.category || "Other",
                            value: c.total || 0,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.expensesByCategory.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => [`UGX ${Number(val).toLocaleString()}`, ""]} />
                        <Legend
                          formatter={(val) => (
                            <span className="text-xs text-gray-600 capitalize">{val}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Section>
                ) : null}
              </div>
            )}

            {/* ── Uncollected ── */}
            {activeTab === "uncollected" && (
              <div className="space-y-5">
                {(() => {
                  const orders  = Array.isArray(data?.orders)            ? data.orders            :
                                  Array.isArray(data?.uncollectedOrders)  ? data.uncollectedOrders :
                                  Array.isArray(data)                     ? data                   : [];
                  const summary = data?.summary || {};
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Uncollected Orders" value={summary.total ?? orders.length}               icon="⚠️" color="bg-red-50"    />
                        <StatCard label="Total Value"        value={fmt(summary.totalValue ?? summary.value)}     icon="💰" color="bg-orange-50" />
                      </div>

                      {/* Uncollected by payment status pie */}
                      {orders.length > 0 && (() => {
                        const paid    = orders.filter((o) => o.paymentStatus === "paid").length;
                        const partial = orders.filter((o) => o.paymentStatus === "partial").length;
                        const unpaid  = orders.filter((o) => o.paymentStatus === "unpaid").length;
                        const pieData = [
                          { name: "Paid",    value: paid    },
                          { name: "Partial", value: partial },
                          { name: "Unpaid",  value: unpaid  },
                        ].filter((d) => d.value > 0);
                        return pieData.length > 0 ? (
                          <Section title="Payment Status Breakdown">
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%" cy="50%"
                                  innerRadius={50} outerRadius={75}
                                  paddingAngle={3} dataKey="value"
                                >
                                  {pieData.map((_, i) => (
                                    <Cell key={i} fill={["#10b981","#f59e0b","#ef4444"][i]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend formatter={(val) => <span className="text-xs text-gray-600">{val}</span>} />
                              </PieChart>
                            </ResponsiveContainer>
                          </Section>
                        ) : null;
                      })()}

                      {orders.length === 0 ? (
                        <EmptyState message="No uncollected orders." />
                      ) : (
                        <Section title="Uncollected Orders">
                          <div className="space-y-3">
                            {orders.map((o, i) => (
                              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{o.orderNumber}</p>
                                  <p className="text-xs text-gray-400">{o.customer?.name || "—"}</p>
                                  {o.expectedReadyDate && (
                                    <p className="text-xs text-gray-400">
                                      Ready: {new Date(o.expectedReadyDate).toLocaleDateString("en-UG")}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gray-800">{fmt(o.totalAmount)}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                    ${o.paymentStatus === "paid" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                                    {o.paymentStatus}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Section>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── Customers ── */}
            {activeTab === "customers" && (
              <div className="space-y-5">
                {(() => {
                  const summary   = data?.summary || {};
                  const customers = Array.isArray(data?.topCustomers) ? data.topCustomers :
                                    Array.isArray(data?.customers)    ? data.customers    :
                                    Array.isArray(data)               ? data              : [];
                  const total  = summary.total ?? data?.total  ?? 0;
                  const loyal  = summary.loyal ?? data?.loyal  ?? 0;
                  const newCust= summary.new   ?? data?.newCount ?? 0;
                  const other  = Math.max(0, total - loyal - newCust);

                  const pieData = [
                    { name: "Loyal",    value: loyal    },
                    { name: "New",      value: newCust  },
                    { name: "Regular",  value: other    },
                  ].filter((d) => d.value > 0);

                  return (
                    <>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard label="Total Customers" value={total}   icon="👤" color="bg-blue-50"   />
                        <StatCard label="New This Period"  value={newCust} icon="✨" color="bg-green-50" />
                        <StatCard label="Loyal Customers"  value={loyal}  icon="⭐" color="bg-yellow-50" />
                      </div>

                      {/* Customer breakdown pie */}
                      {pieData.length > 0 && (
                        <Section title="Customer Breakdown">
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%" cy="50%"
                                innerRadius={50} outerRadius={75}
                                paddingAngle={3} dataKey="value"
                              >
                                {pieData.map((_, i) => (
                                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend formatter={(val) => <span className="text-xs text-gray-600">{val}</span>} />
                            </PieChart>
                          </ResponsiveContainer>
                        </Section>
                      )}

                      {/* Top customers bar chart */}
                      {customers.length > 0 && (
                        <Section title="Top Customers by Spend">
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart
                              data={customers.slice(0, 6).map((c) => ({
                                name:  c.name?.split(" ")[0] || "Customer",
                                spent: c.totalSpent ?? c.spent ?? 0,
                              }))}
                              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} />
                              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#6b7280" }} />
                              <Tooltip content={<ChartTooltip prefix="UGX " />} />
                              <Bar dataKey="spent" name="Total Spent" fill="#f59e0b" radius={[6,6,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </Section>
                      )}

                      {customers.length > 0 && (
                        <Section title="Top Customers">
                          <div className="space-y-3">
                            {customers.map((c, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-xs font-bold">
                                      {c.name?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{c.name}</p>
                                    <p className="text-xs text-gray-400">{c.totalOrders ?? c.orders ?? 0} orders</p>
                                  </div>
                                </div>
                                <p className="text-sm font-semibold text-green-600">
                                  {fmt(c.totalSpent ?? c.spent)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </Section>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── Inventory ── */}
            {activeTab === "inventory" && (
              <div className="space-y-5">
                {(() => {
                  const items   = Array.isArray(data?.items)     ? data.items     :
                                  Array.isArray(data?.inventory)  ? data.inventory :
                                  Array.isArray(data)             ? data           : [];
                  const summary = data?.summary || {};

                  const stockData = items.slice(0, 8).map((item) => ({
                    name:  item.name,
                    stock: item.currentStock ?? 0,
                    min:   item.minimumStockLevel ?? 0,
                  }));

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Total Items" value={summary.total    ?? items.length}       icon="📦" color="bg-blue-50" />
                        <StatCard label="Low Stock"   value={summary.lowStock ?? data?.lowStockCount} icon="⚠️" color="bg-red-50"  />
                      </div>

                      {/* Stock levels bar chart */}
                      {stockData.length > 0 ? (
                        <Section title="Current Stock Levels">
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                              data={stockData}
                              margin={{ top: 5, right: 10, left: 0, bottom: 30 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 9, fill: "#6b7280" }}
                                angle={-35}
                                textAnchor="end"
                              />
                              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                              <Tooltip />
                              <Bar dataKey="stock" name="Current Stock" fill="#3b82f6" radius={[4,4,0,0]} />
                              <Bar dataKey="min"   name="Min Level"     fill="#fca5a5" radius={[4,4,0,0]} />
                              <Legend />
                            </BarChart>
                          </ResponsiveContainer>
                        </Section>
                      ) : (
                        <EmptyState message="No inventory data." />
                      )}

                      {items.length > 0 && (
                        <Section title="Inventory Items">
                          <div className="space-y-3">
                            {items.map((item, i) => (
                              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                  <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gray-800">
                                    {item.currentStock} {item.unit}
                                  </p>
                                  {item.isLowStock && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500">
                                      Low Stock
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Section>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── Expenses ── */}
            {activeTab === "expenses" && (
              <div className="space-y-5">
                {(() => {
                  const expenses    = Array.isArray(data?.expenses)   ? data.expenses   :
                                      Array.isArray(data)              ? data             : [];
                  const summary     = data?.summary    || {};
                  const byCategory  = Array.isArray(data?.byCategory) ? data.byCategory : [];

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Total Expenses" value={fmt(summary.total  ?? data?.totalExpenses)} icon="💸" color="bg-red-50"    />
                        <StatCard label="This Period"    value={fmt(summary.period ?? data?.periodTotal)}   icon="📅" color="bg-orange-50" />
                      </div>

                      {/* Expenses by category pie */}
                      {byCategory.length > 0 && (
                        <Section title="Expenses by Category">
                          <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                              <Pie
                                data={byCategory.map((c) => ({
                                  name:  c._id || c.category || "Other",
                                  value: c.total ?? c.amount ?? 0,
                                }))}
                                cx="50%" cy="50%"
                                innerRadius={55} outerRadius={85}
                                paddingAngle={3} dataKey="value"
                              >
                                {byCategory.map((_, i) => (
                                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(val) => [`UGX ${Number(val).toLocaleString()}`, ""]} />
                              <Legend formatter={(val) => <span className="text-xs text-gray-600 capitalize">{val}</span>} />
                            </PieChart>
                          </ResponsiveContainer>
                        </Section>
                      )}

                      {/* Expenses bar chart */}
                      {byCategory.length > 0 && (
                        <Section title="Expenses Breakdown">
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart
                              data={byCategory.map((c) => ({
                                name:   c._id || c.category || "Other",
                                amount: c.total ?? c.amount ?? 0,
                              }))}
                              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} />
                              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#6b7280" }} />
                              <Tooltip content={<ChartTooltip prefix="UGX " />} />
                              <Bar dataKey="amount" name="Amount" fill="#ef4444" radius={[6,6,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </Section>
                      )}

                      {expenses.length > 0 && (
                        <Section title="Recent Expenses">
                          <div className="space-y-3">
                            {expenses.slice(0, 10).map((e, i) => (
                              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{e.description}</p>
                                  <p className="text-xs text-gray-400 capitalize">{e.category}</p>
                                </div>
                                <p className="text-sm font-semibold text-red-500">{fmt(e.amount)}</p>
                              </div>
                            ))}
                          </div>
                        </Section>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── Staff Activity ── */}
            {activeTab === "staffactivity" && (
              <div className="space-y-5">
                {(() => {
                  const staff =
                    Array.isArray(data?.staff)          ? data.staff          :
                    Array.isArray(data?.staffActivity)   ? data.staffActivity  :
                    Array.isArray(data?.activity)        ? data.activity       :
                    Array.isArray(data)                  ? data                : [];

                  return staff.length === 0 ? (
                    <EmptyState message="No staff activity data yet." />
                  ) : (
                    <>
                      {/* Staff orders bar chart */}
                      <Section title="Orders Handled per Staff">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart
                            data={staff.map((s) => ({
                              name:   (s.name || s.staffName)?.split(" ")[0] || "Staff",
                              orders: s.ordersHandled ?? s.totalOrders ?? 0,
                            }))}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} />
                            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                            <Tooltip />
                            <Bar dataKey="orders" name="Orders" fill="#3b82f6" radius={[6,6,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Section>

                      {/* Staff revenue bar chart */}
                      <Section title="Revenue Generated per Staff">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart
                            data={staff.map((s) => ({
                              name:    (s.name || s.staffName)?.split(" ")[0] || "Staff",
                              revenue: s.revenueGenerated ?? s.totalRevenue ?? 0,
                            }))}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} />
                            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#6b7280" }} />
                            <Tooltip content={<ChartTooltip prefix="UGX " />} />
                            <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[6,6,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Section>

                      <Section title="Staff Performance">
                        <div className="space-y-4">
                          {staff.map((s, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-bold text-sm">
                                    {(s.name || s.staffName)?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{s.name || s.staffName}</p>
                                  <p className="text-xs text-gray-400 capitalize">{s.role}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-800">
                                  {s.ordersHandled ?? s.totalOrders ?? 0} orders
                                </p>
                                <p className="text-xs text-green-600">
                                  {fmt(s.revenueGenerated ?? s.totalRevenue)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── Fraud Risk ── */}
            {activeTab === "fraud" && isAdmin && (
              <div className="space-y-5">
                {(() => {
                  const flagged =
                    Array.isArray(data?.flaggedPayments)            ? data.flaggedPayments           :
                    Array.isArray(data?.flaggedPayments?.payments)   ? data.flaggedPayments.payments  :
                    Array.isArray(data?.payments)                    ? data.payments                  :
                    Array.isArray(data)                              ? data                           : [];
                  const count = data?.flaggedPayments?.count ?? data?.flaggedCount ?? flagged.length;

                  return flagged.length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-8 text-center">
                      <p className="text-2xl mb-2">✅</p>
                      <p className="text-sm font-semibold text-green-700">No fraud risks detected</p>
                      <p className="text-xs text-green-500 mt-1">All payments look normal</p>
                    </div>
                  ) : (
                    <>
                      {/* Flagged amounts bar chart */}
                      <Section title="Flagged Payment Amounts">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart
                            data={flagged.slice(0, 8).map((p, i) => ({
                              name:   p.order?.orderNumber || `#${i+1}`,
                              amount: p.amount || 0,
                            }))}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6b7280" }} />
                            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#6b7280" }} />
                            <Tooltip content={<ChartTooltip prefix="UGX " />} />
                            <Bar dataKey="amount" name="Amount" fill="#ef4444" radius={[6,6,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Section>

                      <Section title={`Flagged Payments (${count})`}>
                        <div className="space-y-3">
                          {flagged.map((p, i) => (
                            <div key={i} className="bg-red-50 rounded-xl p-4">
                              <div className="flex justify-between mb-1">
                                <p className="text-sm font-semibold text-gray-800">
                                  {p.order?.orderNumber || "Unknown Order"}
                                </p>
                                <p className="text-sm font-bold text-red-500">{fmt(p.amount)}</p>
                              </div>
                              <p className="text-xs text-gray-500 mb-1">
                                {p.receivedBy?.name || "—"} •{" "}
                                {new Date(p.createdAt).toLocaleDateString("en-UG", {
                                  day: "numeric", month: "short", year: "numeric",
                                })}
                              </p>
                              {p.flagReason && (
                                <p className="text-xs text-red-500">🚩 {p.flagReason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </Section>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}