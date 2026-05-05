import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { getBranches, createBranch, updateBranch, deleteBranch, getBranchStats } from "../../api/branches";

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

export default function BranchesPage() {
  const [branches,      setBranches]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [showAdd,       setShowAdd]       = useState(false);
  const [editBranch,    setEditBranch]    = useState(null);
  const [statsModal,    setStatsModal]    = useState(null);
  const [actionLoading, setActionLoading] = useState("");

  const fetchBranches = () => {
    setLoading(true);
    getBranches()
      .then((res) => setBranches(res.data.data || []))
      .catch(() => setError("Failed to load branches."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBranches(); }, []);

  const handleDeactivate = async (branch) => {
    if (!window.confirm(`Deactivate ${branch.name}?`)) return;
    setActionLoading(branch._id);
    try {
      await deleteBranch(branch._id);
      fetchBranches();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to deactivate branch.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Branches</h1>
            <p className="text-sm text-gray-400 mt-0.5">{branches.length} branches</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            + New Branch
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">
            Loading branches...
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No branches found.</div>
        ) : (
          <div className="space-y-3">
            {branches.map((branch) => (
              <div
                key={branch._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{branch.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${branch.isActive
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"
                        }`}>
                        {branch.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{branch.location}</p>
                    {branch.address && (
                      <p className="text-xs text-gray-400">{branch.address}</p>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                  {branch.phone && <span>📞 {branch.phone}</span>}
                  {branch.manager?.name && <span>👤 {branch.manager.name}</span>}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                  <button
                    onClick={() => setStatsModal(branch)}
                    className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    📊 Stats
                  </button>
                  <button
                    onClick={() => setEditBranch(branch)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  {branch.isActive && (
                    <button
                      onClick={() => handleDeactivate(branch)}
                      disabled={!!actionLoading}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-500 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === branch._id ? "Deactivating..." : "Deactivate"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {showAdd && (
        <BranchFormModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchBranches(); }}
        />
      )}

      {/* Edit Branch Modal */}
      {editBranch && (
        <BranchFormModal
          existing={editBranch}
          onClose={() => setEditBranch(null)}
          onSaved={() => { setEditBranch(null); fetchBranches(); }}
        />
      )}

      {/* Stats Modal */}
      {statsModal && (
        <BranchStatsModal
          branch={statsModal}
          onClose={() => setStatsModal(null)}
        />
      )}
    </Layout>
  );
}

// ── Branch Form Modal ────────────────────────────────────────
function BranchFormModal({ existing, onClose, onSaved }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    name:     existing?.name     || "",
    location: existing?.location || "",
    address:  existing?.address  || "",
    phone:    existing?.phone    || "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name)     return setError("Branch name is required.");
    if (!form.location) return setError("Location is required.");
    setError("");
    setLoading(true);
    try {
      if (isEdit) {
        await updateBranch(existing._id, form);
      } else {
        await createBranch(form);
      }
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save branch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">
            {isEdit ? "Edit Branch" : "New Branch"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
            <input
              type="text" value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Kampala Main"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <input
              type="text" value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Kampala"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
            <input
              type="text" value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="e.g. 1 Kampala Road"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              type="tel" value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+256700000000"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Saving..." : isEdit ? "Update Branch" : "Create Branch"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Branch Stats Modal ───────────────────────────────────────
function BranchStatsModal({ branch, onClose }) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getBranchStats(branch._id)
      .then((res) => setStats(res.data.data))
      .catch(() => setError("Failed to load branch stats."))
      .finally(() => setLoading(false));
  }, [branch._id]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">{branch.name}</h2>
            <p className="text-xs text-gray-400">{branch.location}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm animate-pulse">
              Loading stats...
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : !stats ? null : (
            <div className="space-y-5">

              {/* Orders */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Orders
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total",       value: stats.orders?.total       ?? stats.totalOrders       },
                    { label: "Pending",     value: stats.orders?.pending     ?? stats.pendingOrders     },
                    { label: "Collected",   value: stats.orders?.collected   ?? stats.collectedOrders   },
                    { label: "Uncollected", value: stats.orders?.uncollected ?? stats.uncollectedOrders },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-400">{s.label}</p>
                      <p className="text-lg font-bold text-gray-800">{s.value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finance */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Finance
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Revenue", value: fmt(stats.finance?.totalRevenue ?? stats.totalRevenue) },
                    { label: "Total Expenses",value: fmt(stats.finance?.totalExpenses ?? stats.totalExpenses) },
                    { label: "Net Profit",    value: fmt(stats.finance?.profit ?? stats.profit) },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-400">{s.label}</p>
                      <p className="text-sm font-bold text-gray-800">{s.value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff */}
              {(stats.staff || stats.totalStaff) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Staff
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total Staff",   value: stats.staff?.total   ?? stats.totalStaff   },
                      { label: "Active Staff",  value: stats.staff?.active  ?? stats.activeStaff  },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-400">{s.label}</p>
                        <p className="text-lg font-bold text-gray-800">{s.value ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory */}
              {(stats.inventory || stats.lowStockAlerts) && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Inventory
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total Items",  value: stats.inventory?.total      ?? stats.totalItems      },
                      { label: "Low Stock",    value: stats.inventory?.lowStock   ?? stats.lowStockAlerts  },
                    ].map((s, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-400">{s.label}</p>
                        <p className="text-lg font-bold text-gray-800">{s.value ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}