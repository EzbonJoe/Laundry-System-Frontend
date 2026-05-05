import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { getOrders, updateStatus, collectOrder, deleteOrder } from "../../api/orders";
import CreateOrderModal from "./CreateOrderModal";

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

const STATUS_FLOW = ["received", "washing", "ironing", "packaging", "ready", "collected"];

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

export default function OrdersPage() {
  const { user } = useAuth();
  const isAdmin  = user?.role === "hq_admin";
  const canDelete = ["hq_admin", "branch_manager"].includes(user?.role);

  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [statusFilter,setStatusFilter]= useState("");
  const [search,      setSearch]      = useState("");
  const [showCreate,  setShowCreate]  = useState(false);
  const [selected,    setSelected]    = useState(null); // for detail view
  const [actionLoading, setActionLoading] = useState("");

  const fetchOrders = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    getOrders(params)
      .then((res) => setOrders(res.data.data || []))
      .catch(() => setError("Failed to load orders."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const handleAdvanceStatus = async (order) => {
    const current = STATUS_FLOW.indexOf(order.status);
    if (current === -1 || current === STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[current + 1];
    setActionLoading(order._id + "status");
    try {
      await updateStatus(order._id, next);
      fetchOrders();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update status.");
    } finally {
      setActionLoading("");
    }
  };

  const handleCollect = async (order) => {
    setActionLoading(order._id + "collect");
    try {
      await collectOrder(order._id);
      fetchOrders();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to collect order.");
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Delete order ${order.orderNumber}?`)) return;
    setActionLoading(order._id + "delete");
    try {
      await deleteOrder(order._id);
      fetchOrders();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete order.");
    } finally {
      setActionLoading("");
    }
  };

  const filtered = orders.filter((o) =>
    search
      ? o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.customer?.name?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Orders</h1>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} orders found</p>
          </div>
          {!isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              + New Order
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            {STATUS_FLOW.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No orders found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.customer?.name || "Unknown customer"}
                    </p>
                  </div>
                  <p className="font-bold text-gray-800 text-sm">{fmt(order.totalAmount)}</p>
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${paymentColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                    {order.collectionType}
                  </span>
                </div>

                {/* Items summary */}
                <p className="text-xs text-gray-400 mb-3">
                  {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""} •{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-UG", {
                    day: "numeric", month: "short", year: "numeric"
                  })}
                </p>

                {/* Actions */}
                {!isAdmin && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                    {/* Advance status */}
                    {order.status !== "collected" && order.status !== "ready" && (
                      <button
                        onClick={() => handleAdvanceStatus(order)}
                        disabled={!!actionLoading}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === order._id + "status" ? "Updating..." : `→ ${STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]}`}
                      </button>
                    )}

                    {/* Collect */}
                    {order.status === "ready" && order.paymentStatus === "paid" && (
                      <button
                        onClick={() => handleCollect(order)}
                        disabled={!!actionLoading}
                        className="text-xs bg-green-50 hover:bg-green-100 text-green-600 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === order._id + "collect" ? "Processing..." : "✅ Mark Collected"}
                      </button>
                    )}

                    {/* View details */}
                    <button
                      onClick={() => setSelected(order)}
                      className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View Details
                    </button>

                    {/* Delete */}
                    {canDelete && order.status !== "collected" && (
                      <button
                        onClick={() => handleDelete(order)}
                        disabled={!!actionLoading}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-500 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === order._id + "delete" ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchOrders(); }}
        />
      )}

      {/* Order Detail Modal */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </Layout>
  );
}

// ── Order Detail Modal ──────────────────────────────────────
function OrderDetailModal({ order, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{order.orderNumber}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Customer</p>
              <p className="text-sm font-medium text-gray-800">{order.customer?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-800">{order.customer?.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <p className="text-sm font-medium text-gray-800 capitalize">{order.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Payment</p>
              <p className="text-sm font-medium text-gray-800 capitalize">{order.paymentStatus}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Amount</p>
              <p className="text-sm font-semibold text-gray-800">UGX {Number(order.totalAmount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Amount Paid</p>
              <p className="text-sm font-semibold text-green-600">UGX {Number(order.amountPaid).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Collection Type</p>
              <p className="text-sm font-medium text-gray-800 capitalize">{order.collectionType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Created</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(order.createdAt).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {order.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{order.notes}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Order Items</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{item.category}</p>
                    <p className="text-xs text-gray-400 capitalize">{item.serviceType?.replace("_", " ")} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">UGX {Number(item.subtotal).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}