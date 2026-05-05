import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import {
  getExpenses,
  getExpensesByCategory,
  createExpense,
  deleteExpense,
} from "../../api/expenses";
import { getBranches } from "../../api/branches";

const CATEGORIES = ["utilities","salaries","supplies","maintenance","transport","other"];

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

const categoryColor = (cat) => {
  const map = {
    utilities:   "bg-blue-100 text-blue-600",
    salaries:    "bg-green-100 text-green-600",
    supplies:    "bg-yellow-100 text-yellow-600",
    maintenance: "bg-orange-100 text-orange-600",
    transport:   "bg-purple-100 text-purple-600",
    other:       "bg-gray-100 text-gray-500",
  };
  return map[cat] || "bg-gray-100 text-gray-500";
};

export default function ExpensesPage() {
  const { user }  = useAuth();
  const isAdmin   = user?.role === "hq_admin";
  const branchId  = user?.branch?._id || user?.branch;

  const [expenses,     setExpenses]     = useState([]);
  const [breakdown,    setBreakdown]    = useState([]);
  const [branches,     setBranches]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [catFilter,    setCatFilter]    = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [showBreakdown,setShowBreakdown]= useState(false);
  const [error,        setError]        = useState("");
  const [actionLoading,setActionLoading]= useState("");

  useEffect(() => {
    if (isAdmin) {
      getBranches().then((res) => setBranches(res.data.data || []));
    }
  }, []);

  const fetchExpenses = () => {
    setLoading(true);
    const params = {};
    if (catFilter)    params.category = catFilter;
    if (branchFilter) params.branch   = branchFilter;
    else if (branchId) params.branch  = branchId;

    getExpenses(params)
      .then((res) => setExpenses(res.data.data || []))
      .catch(() => setError("Failed to load expenses."))
      .finally(() => setLoading(false));
  };

  const fetchBreakdown = () => {
    const params = {};
    if (branchFilter) params.branch  = branchFilter;
    else if (branchId) params.branch = branchId;
    getExpensesByCategory(params)
      .then((res) => setBreakdown(res.data.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchExpenses();
    fetchBreakdown();
  }, [catFilter, branchFilter]);

  const handleDelete = async (expense) => {
    if (!window.confirm("Delete this expense?")) return;
    setActionLoading(expense._id);
    try {
      await deleteExpense(expense._id);
      fetchExpenses();
      fetchBreakdown();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete expense.");
    } finally {
      setActionLoading("");
    }
  };

  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Expenses</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {expenses.length} records · Total: {fmt(totalAmount)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBreakdown((v) => !v)}
              className={`text-sm font-semibold px-4 py-2.5 rounded-xl border transition-colors
                ${showBreakdown
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-purple-600 border-purple-200 hover:bg-purple-50"
                }`}
            >
              📊 Breakdown
            </button>
            {!isAdmin && (
              <button
                onClick={() => setShowAdd(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                + Add Expense
              </button>
            )}
          </div>
        </div>

        {/* Category breakdown panel */}
        {showBreakdown && breakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Expenses by Category</p>
            <div className="space-y-3">
              {breakdown.map((b, i) => {
                const pct = totalAmount > 0
                  ? Math.round(((b.total || b.amount || 0) / totalAmount) * 100)
                  : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">{b._id || b.category}</span>
                      <span className="text-gray-500">{fmt(b.total || b.amount)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCatFilter("")}
              className={`text-sm px-4 py-2 rounded-xl font-medium border transition-colors
                ${catFilter === ""
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`text-sm px-4 py-2 rounded-xl font-medium border transition-colors capitalize
                  ${catFilter === cat
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No expenses found.</div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 mr-3">
                    <p className="text-sm font-semibold text-gray-800">{expense.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {expense.recordedBy?.name || "—"} •{" "}
                      {new Date(expense.createdAt).toLocaleDateString("en-UG", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    {isAdmin && expense.branch?.name && (
                      <p className="text-xs text-gray-400">🏢 {expense.branch.name}</p>
                    )}
                  </div>
                  <p className="text-base font-bold text-gray-800 flex-shrink-0">
                    {fmt(expense.amount)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${categoryColor(expense.category)}`}>
                    {expense.category}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(expense)}
                      disabled={!!actionLoading}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-500 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === expense._id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAdd && (
        <AddExpenseModal
          branchId={branchId}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); fetchExpenses(); fetchBreakdown(); }}
        />
      )}
    </Layout>
  );
}

// ── Add Expense Modal ────────────────────────────────────────
function AddExpenseModal({ branchId, onClose, onAdded }) {
  const [form, setForm] = useState({
    description: "", category: "utilities", amount: "", date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.description) return setError("Description is required.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Enter a valid amount.");
    setError("");
    setLoading(true);
    try {
      await createExpense({
        ...form,
        amount: Number(form.amount),
        branch: branchId,
        ...(form.date && { date: form.date }),
      });
      onAdded();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to add expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Add Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              type="text" value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="e.g. Monthly electricity bill"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (UGX)</label>
              <input
                type="number" min="1" value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date (optional)</label>
            <input
              type="date" value={form.date}
              onChange={(e) => update("date", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Saving..." : "Add Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}