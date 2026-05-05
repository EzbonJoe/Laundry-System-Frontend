import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import {
  getCustomers,
  getLoyalCustomers,
  getInactiveCustomers,
  createCustomer,
  updateCustomer,
} from "../../api/customers";
import { getOrdersByCustomer } from "../../api/orders";

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

export default function CustomersPage() {
  const { user }  = useAuth();
  const isManager = user?.role === "branch_manager";
  const branchId  = user?.branch?._id || user?.branch;

  const [customers,    setCustomers]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd,      setShowAdd]      = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [viewOrders,   setViewOrders]   = useState(null);

  const fetchCustomers = () => {
    setLoading(true);
    setError("");
    const params = { branch: branchId };

    const call =
      statusFilter === "loyal"    ? getLoyalCustomers(params)    :
      statusFilter === "inactive" ? getInactiveCustomers(params) :
      getCustomers(params);

    call
      .then((res) => setCustomers(res.data.data || []))
      .catch(() => setError("Failed to load customers."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, [statusFilter]);

  const filtered = customers.filter((c) =>
    search
      ? c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
      : true
  );

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Customers</h1>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} customers</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            + New Customer
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {[
            { key: "all",      label: "All"      },
            { key: "loyal",    label: "⭐ Loyal"  },
            { key: "inactive", label: "Inactive"  },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`text-sm px-4 py-2 rounded-xl font-medium border transition-colors
                ${statusFilter === f.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No customers found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((customer) => (
              <div
                key={customer._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">
                        {customer.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{customer.name}</p>
                      <p className="text-xs text-gray-400">{customer.phone}</p>
                      {customer.email && (
                        <p className="text-xs text-gray-400">{customer.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {customer.totalOrders ?? 0} orders
                    </p>
                    <div className="flex flex-col gap-1 items-end mt-1">
                      {customer.isLoyal && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600 font-medium">
                          ⭐ Loyal
                        </span>
                      )}
                      {!customer.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => setViewOrders(customer)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    📋 Order History
                  </button>
                  {isManager && (
                    <button
                      onClick={() => setEditCustomer(customer)}
                      className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAdd && (
        <CustomerFormModal
          branchId={branchId}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchCustomers(); }}
        />
      )}

      {/* Edit Customer Modal */}
      {editCustomer && (
        <CustomerFormModal
          branchId={branchId}
          existing={editCustomer}
          onClose={() => setEditCustomer(null)}
          onSaved={() => { setEditCustomer(null); fetchCustomers(); }}
        />
      )}

      {/* Order History Modal */}
      {viewOrders && (
        <CustomerOrdersModal
          customer={viewOrders}
          onClose={() => setViewOrders(null)}
        />
      )}
    </Layout>
  );
}

// ── Customer Form Modal ──────────────────────────────────────
function CustomerFormModal({ branchId, existing, onClose, onSaved }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    name:    existing?.name    || "",
    phone:   existing?.phone   || "",
    email:   existing?.email   || "",
    address: existing?.address || "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name)  return setError("Name is required.");
    if (!form.phone) return setError("Phone is required.");
    setError("");
    setLoading(true);
    try {
      if (isEdit) {
        await updateCustomer(existing._id, form);
      } else {
        await createCustomer({ ...form, branch: branchId });
      }
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">
            {isEdit ? "Edit Customer" : "New Customer"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text" value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. John Mukasa"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel" value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+256700000000"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
            <input
              type="email" value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="john@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
            <input
              type="text" value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="e.g. Kampala, Ntinda"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Saving..." : isEdit ? "Update Customer" : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Customer Orders Modal ────────────────────────────────────
function CustomerOrdersModal({ customer, onClose }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getOrdersByCustomer(customer._id)
      .then((res) => setOrders(res.data.data || []))
      .catch(() => setError("Failed to load order history."))
      .finally(() => setLoading(false));
  }, [customer._id]);

  const totalSpent = orders.reduce((s, o) => s + (o.amountPaid || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">{customer.name}</h2>
            <p className="text-xs text-gray-400">{customer.phone}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {!loading && orders.length > 0 && (
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex gap-6">
            <div>
              <p className="text-xs text-blue-500">Total Orders</p>
              <p className="text-lg font-bold text-blue-700">{orders.length}</p>
            </div>
            <div>
              <p className="text-xs text-blue-500">Total Spent</p>
              <p className="text-lg font-bold text-blue-700">{fmt(totalSpent)}</p>
            </div>
            {customer.isLoyal && (
              <div>
                <p className="text-xs text-yellow-500">Status</p>
                <p className="text-sm font-bold text-yellow-600">⭐ Loyal</p>
              </div>
            )}
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm animate-pulse">Loading...</div>
          ) : error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No orders yet.</div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800">{order.orderNumber}</p>
                    <p className="text-sm font-bold text-gray-800">{fmt(order.totalAmount)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${order.paymentStatus === "paid"    ? "bg-green-100 text-green-600"   : ""}
                      ${order.paymentStatus === "partial" ? "bg-yellow-100 text-yellow-600" : ""}
                      ${order.paymentStatus === "unpaid"  ? "bg-red-100 text-red-500"       : ""}
                    `}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("en-UG", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {" · "}{order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}