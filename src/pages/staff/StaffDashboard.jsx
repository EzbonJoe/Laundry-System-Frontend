import { useEffect, useState, useCallback } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import RefreshBar from "../../components/ui/RefreshBar";

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

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

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

const paymentColor = (status) => {
  const map = {
    paid:    "bg-green-100 text-green-600",
    partial: "bg-yellow-100 text-yellow-600",
    unpaid:  "bg-red-100 text-red-500",
  };
  return map[status] || "bg-gray-100 text-gray-500";
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const branchId = user?.branch?._id || user?.branch;

  const [orders,    setOrders]    = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

 const fetchData = useCallback(async () => {
    if (!branchId) {
      setError("No branch assigned to your account.");
      setLoading(false);
      return;
    }
    try {
      const [ordersRes, inventoryRes] = await Promise.all([
        api.get("/orders",    { params: { branch: branchId, limit: 10 } }),
        api.get("/inventory", { params: { branch: branchId } }),
      ]);
      setOrders(ordersRes.data.data       || []);
      setInventory(inventoryRes.data.data || []);
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

  const totalOrders    = orders.length;
  const pendingOrders  = orders.filter(o => !["collected"].includes(o.status)).length;
  const readyOrders    = orders.filter(o => o.status === "ready").length;
  const unpaidOrders   = orders.filter(o => o.paymentStatus === "unpaid").length;
  const lowStockItems  = inventory.filter(i => i.isLowStock).length;

  return (
    <Layout>
      <div className="space-y-6">

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">Staff Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {user?.branch?.name || "Your branch"} — today's overview
          </p>
        </div>

        <RefreshBar
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          onRefresh={refresh}
        />

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Orders"
            value={totalOrders}
            icon="🧺"
            color="bg-blue-50"
            sub="In your branch"
          />
          <StatCard
            label="Pending"
            value={pendingOrders}
            icon="⏳"
            color="bg-yellow-50"
            sub="Not yet collected"
          />
          <StatCard
            label="Ready"
            value={readyOrders}
            icon="✅"
            color="bg-teal-50"
            sub="Awaiting collection"
          />
          <StatCard
            label="Unpaid"
            value={unpaidOrders}
            icon="💳"
            color="bg-red-50"
            sub="Needs payment"
          />
        </div>

        {/* Low stock alert */}
        {lowStockItems > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <p className="text-sm font-semibold text-orange-700">
                {lowStockItems} item{lowStockItems > 1 ? "s" : ""} low on stock
              </p>
              <p className="text-xs text-orange-500">Notify your manager to restock</p>
            </div>
          </div>
        )}

        {/* Recent orders + Low stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Section title="Recent Orders">
            {orders.length === 0 ? (
              <p className="text-sm text-gray-400">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 8).map((o) => (
                  <div key={o._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{o.orderNumber}</p>
                      <p className="text-xs text-gray-400">{o.customer?.name || "Unknown"}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-semibold text-gray-800">{fmt(o.totalAmount)}</p>
                      <div className="flex gap-1 justify-end">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(o.status)}`}>
                          {o.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentColor(o.paymentStatus)}`}>
                          {o.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Inventory Status">
            {inventory.length === 0 ? (
              <p className="text-sm text-gray-400">No inventory items yet.</p>
            ) : (
              <div className="space-y-3">
                {inventory.slice(0, 8).map((item) => (
                  <div key={item._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        {item.currentStock} {item.unit}
                      </p>
                      {item.isLowStock && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-medium">
                          Low stock
                        </span>
                      )}
                    </div>
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