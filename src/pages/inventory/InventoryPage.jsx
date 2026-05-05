import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import {
  getInventory,
  addItem,
  updateStock,
  useStock,
  restockItem,
  getUsageReport,
} from "../../api/inventory";
import { getBranches } from "../../api/branches";

const CATEGORIES = ["detergent","softener","bleach","packaging","equipment","other"];
const UNITS      = ["kg","litre","piece","box","bag","bottle"];

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

export default function InventoryPage() {
  const { user }  = useAuth();
  const isManager = user?.role === "branch_manager";
  const isAdmin   = user?.role === "hq_admin";
  const branchId  = user?.branch?._id || user?.branch;

  const [items,         setItems]         = useState([]);
  const [branches,      setBranches]      = useState([]);
  const [usageReport,   setUsageReport]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [filterLow,     setFilterLow]     = useState(false);
  const [branchFilter,  setBranchFilter]  = useState("");
  const [showAdd,       setShowAdd]       = useState(false);
  const [showUsage,     setShowUsage]     = useState(false);
  const [actionModal,   setActionModal]   = useState(null);

  useEffect(() => {
    if (isAdmin) {
      getBranches().then((res) => setBranches(res.data.data || []));
    }
  }, []);

  const fetchInventory = () => {
    setLoading(true);
    const params = {};
    if (filterLow)    params.isLowStock = true;
    if (branchFilter) params.branch     = branchFilter;
    else if (branchId) params.branch    = branchId;
    getInventory(params)
      .then((res) => setItems(res.data.data || []))
      .catch(() => setError("Failed to load inventory."))
      .finally(() => setLoading(false));
  };

  const fetchUsageReport = () => {
    const params = {};
    if (branchFilter)  params.branch = branchFilter;
    else if (branchId) params.branch = branchId;
    getUsageReport(params)
      .then((res) => setUsageReport(res.data.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchInventory();
    fetchUsageReport();
  }, [filterLow, branchFilter]);

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Inventory</h1>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} items</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUsage((v) => !v)}
              className={`text-sm font-semibold px-4 py-2.5 rounded-xl border transition-colors
                ${showUsage
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-purple-600 border-purple-200 hover:bg-purple-50"
                }`}
            >
              📊 Usage
            </button>
            {(isManager || isAdmin) && (
              <button
                onClick={() => setShowAdd(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                + Add Item
              </button>
            )}
          </div>
        </div>

        {/* Usage report panel */}
        {showUsage && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Stock Usage Report</p>
            {usageReport.length === 0 ? (
              <p className="text-sm text-gray-400">No usage data yet.</p>
            ) : (
              <div className="space-y-3">
                {usageReport.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {item.name || item.item?.name || item._id}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        {item.totalUsed ?? item.used ?? 0} {item.unit}
                      </p>
                      <p className="text-xs text-gray-400">{item.usageCount ?? 0} uses</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3">
          {/* Branch filter — HQ admin only */}
          {isAdmin && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name} — {b.location}</option>
              ))}
            </select>
          )}

          {/* Low stock filter */}
          <div className="flex gap-3">
            {[
              { label: "All Items",  value: false },
              { label: "Low Stock",  value: true  },
            ].map((f) => (
              <button
                key={String(f.value)}
                onClick={() => setFilterLow(f.value)}
                className={`text-sm px-4 py-2 rounded-xl font-medium border transition-colors
                  ${filterLow === f.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">
            Loading inventory...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No inventory items found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{item.category}</p>
                    {isAdmin && item.branch?.name && (
                      <p className="text-xs text-gray-400">🏢 {item.branch.name}</p>
                    )}
                  </div>
                  {item.isLowStock && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-500 font-medium">
                      Low Stock
                    </span>
                  )}
                </div>

                {/* Stock bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Current Stock</span>
                    <span className="font-semibold text-gray-800">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        item.isLowStock ? "bg-red-400" : "bg-green-400"
                      }`}
                      style={{
                        width: `${Math.min(100, (item.currentStock / ((item.minimumStockLevel * 3) || 100)) * 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Min level: {item.minimumStockLevel} {item.unit}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                  <button
                    onClick={() => setActionModal({ type: "use", item })}
                    className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Use Stock
                  </button>
                  {(isManager || isAdmin) && (
                    <>
                      <button
                        onClick={() => setActionModal({ type: "restock", item })}
                        className="text-xs bg-green-50 hover:bg-green-100 text-green-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Restock
                      </button>
                      <button
                        onClick={() => setActionModal({ type: "update", item })}
                        className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Update
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAdd && (
        <AddItemModal
          branchId={branchId}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); fetchInventory(); }}
        />
      )}

      {/* Action Modal */}
      {actionModal && (
        <ActionModal
          type={actionModal.type}
          item={actionModal.item}
          onClose={() => setActionModal(null)}
          onDone={() => { setActionModal(null); fetchInventory(); fetchUsageReport(); }}
        />
      )}
    </Layout>
  );
}

// ── Add Item Modal ───────────────────────────────────────────
function AddItemModal({ branchId, onClose, onAdded }) {
  const [form, setForm] = useState({
    name: "", category: "detergent", unit: "kg",
    currentStock: 0, minimumStockLevel: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name) return setError("Name is required.");
    setError("");
    setLoading(true);
    try {
      await addItem({ ...form, branch: branchId });
      onAdded();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to add item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Add Inventory Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text" value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Washing Powder"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => update("unit", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
              <input
                type="number" min="0" value={form.currentStock}
                onChange={(e) => update("currentStock", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
              <input
                type="number" min="0" value={form.minimumStockLevel}
                onChange={(e) => update("minimumStockLevel", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Adding..." : "Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Action Modal (Use / Restock / Update) ────────────────────
function ActionModal({ type, item, onClose, onDone }) {
  const [quantity, setQuantity] = useState("");
  const [reason,   setReason]   = useState("");
  const [newLevel, setNewLevel] = useState(item.minimumStockLevel || 0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async () => {
    if (type !== "update" && (!quantity || Number(quantity) <= 0))
      return setError("Enter a valid quantity.");
    setError("");
    setLoading(true);
    try {
      if (type === "use") {
        await useStock(item._id, { quantityUsed: Number(quantity), reason });
      } else if (type === "restock") {
        await restockItem(item._id, { quantityAdded: Number(quantity), reason });
      } else if (type === "update") {
        await updateStock(item._id, { minimumStockLevel: Number(newLevel) });
      }
      onDone();
    } catch (e) {
      setError(e.response?.data?.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const config = {
    use:     { title: "Use Stock",    color: "bg-yellow-600", label: "Quantity Used"  },
    restock: { title: "Restock Item", color: "bg-green-600",  label: "Quantity Added" },
    update:  { title: "Update Item",  color: "bg-blue-600",   label: "Min Stock Level"},
  }[type];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">{config.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          <strong>{item.name}</strong> — Current:{" "}
          <strong>{item.currentStock} {item.unit}</strong>
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        {type === "update" ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{config.label}</label>
            <input
              type="number" min="0" value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">{config.label}</label>
              <input
                type="number" min="1" value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Enter ${config.label.toLowerCase()}...`}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <input
                type="text" value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Used for order batch"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 ${config.color} hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors`}
          >
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}