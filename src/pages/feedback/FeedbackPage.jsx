import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import {
  getFeedbackByBranch,
  getAverageRating,
  markFeedbackReviewed,
  submitFeedback,
} from "../../api/feedback";

const ratingColor = (rating) => {
  if (rating >= 4) return "text-green-500";
  if (rating >= 3) return "text-yellow-500";
  return "text-red-500";
};

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`text-sm ${star <= rating ? "text-yellow-400" : "text-gray-200"}`}
      >
        ★
      </span>
    ))}
  </div>
);

const categoryColor = (cat) => {
  const map = {
    service:   "bg-blue-100 text-blue-600",
    quality:   "bg-green-100 text-green-600",
    speed:     "bg-yellow-100 text-yellow-600",
    pricing:   "bg-purple-100 text-purple-600",
    other:     "bg-gray-100 text-gray-500",
  };
  return map[cat] || "bg-gray-100 text-gray-500";
};

export default function FeedbackPage() {
  const { user }  = useAuth();
  const isManager = user?.role === "branch_manager";
  const isAdmin   = user?.role === "hq_admin";
  const isStaff   = user?.role === "staff";
  const branchId  = user?.branch?._id || user?.branch;

  const [feedback,    setFeedback]    = useState([]);
  const [ratings,     setRatings]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [showSubmit,  setShowSubmit]  = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const fetchFeedback = () => {
    setLoading(true);
    setError("");
    getFeedbackByBranch(branchId)
      .then((res) => setFeedback(res.data.data || []))
      .catch(() => setError("Failed to load feedback."))
      .finally(() => setLoading(false));
  };

  const fetchRatings = () => {
    getAverageRating({ branch: branchId })
      .then((res) => setRatings(res.data.data))
      .catch(() => {});
  };

  useEffect(() => {
    if (branchId) {
      fetchFeedback();
      if (isManager || isAdmin) fetchRatings();
    }
  }, [branchId]);

  const handleMarkReviewed = async (id) => {
    setActionLoading(id);
    try {
      await markFeedbackReviewed(id);
      setFeedback((prev) =>
        prev.map((f) => f._id === id ? { ...f, isReviewed: true } : f)
      );
    } catch (e) {
      alert(e.response?.data?.message || "Failed to mark as reviewed.");
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
            <h1 className="text-xl font-bold text-gray-800">Customer Feedback</h1>
            <p className="text-sm text-gray-400 mt-0.5">{feedback.length} responses</p>
          </div>
          {isStaff && (
            <button
              onClick={() => setShowSubmit(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              + Submit Feedback
            </button>
          )}
        </div>

        {/* Ratings summary */}
        {ratings && (Array.isArray(ratings) ? ratings.length > 0 : true) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Average Ratings by Category</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(Array.isArray(ratings) ? ratings : []).map((r, i) => (
                <div key={i} className="text-center">
                  <p className={`text-2xl font-bold ${ratingColor(r.avgRating)}`}>
                    {Number(r.avgRating || 0).toFixed(1)}
                  </p>
                  <Stars rating={Math.round(r.avgRating || 0)} />
                  <p className="text-xs text-gray-400 mt-1 capitalize">{r._id || r.category}</p>
                  <p className="text-xs text-gray-300">{r.count} reviews</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">
            Loading feedback...
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No feedback yet.</div>
        ) : (
          <div className="space-y-3">
            {feedback.map((item) => (
              <div
                key={item._id}
                className={`bg-white rounded-2xl border shadow-sm p-4
                  ${!item.isReviewed ? "border-blue-100" : "border-gray-100"}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {item.customer?.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Order: {item.order?.orderNumber || "—"} •{" "}
                      {new Date(item.createdAt).toLocaleDateString("en-UG", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Stars rating={item.rating} />
                    <p className={`text-lg font-bold ${ratingColor(item.rating)}`}>
                      {item.rating}/5
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {item.category && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${categoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  )}
                  {item.isReviewed ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-600 font-medium">
                      ✓ Reviewed
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-600 font-medium">
                      Pending Review
                    </span>
                  )}
                </div>

                {item.comment && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 mb-3">
                    "{item.comment}"
                  </p>
                )}

                {(isManager || isAdmin) && !item.isReviewed && (
                  <div className="pt-2 border-t border-gray-50">
                    <button
                      onClick={() => handleMarkReviewed(item._id)}
                      disabled={!!actionLoading}
                      className="text-xs bg-green-50 hover:bg-green-100 text-green-600 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === item._id ? "Marking..." : "✓ Mark Reviewed"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Feedback Modal */}
      {showSubmit && (
        <SubmitFeedbackModal
          branchId={branchId}
          onClose={() => setShowSubmit(false)}
          onSubmitted={() => { setShowSubmit(false); fetchFeedback(); }}
        />
      )}
    </Layout>
  );
}

// ── Submit Feedback Modal ────────────────────────────────────
function SubmitFeedbackModal({ branchId, onClose, onSubmitted }) {
  const [orders,   setOrders]   = useState([]);
  const [form,     setForm]     = useState({
    order: "", rating: 5, category: "service", comment: "",
  });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    import("../../api/orders").then(({ getOrders }) => {
      getOrders({ branch: branchId })
        .then((res) => setOrders(
          (res.data.data || []).filter((o) => o.status === "collected")
        ))
        .catch(() => {});
    });
  }, [branchId]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.order)   return setError("Please select an order.");
    if (!form.rating)  return setError("Rating is required.");
    setError("");
    setLoading(true);
    try {
      await submitFeedback(form);
      onSubmitted();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Submit Customer Feedback</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order *</label>
            <select
              value={form.order}
              onChange={(e) => update("order", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a collected order...</option>
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.orderNumber} — {o.customer?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => update("rating", star)}
                  className={`text-2xl transition-transform hover:scale-110
                    ${star <= form.rating ? "text-yellow-400" : "text-gray-200"}`}
                >
                  ★
                </button>
              ))}
              <span className="text-sm text-gray-500 self-center ml-1">
                {form.rating}/5
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {["service", "quality", "speed", "pricing", "other"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => update("category", cat)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors capitalize
                    ${form.category === cat
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
            <textarea
              value={form.comment}
              onChange={(e) => update("comment", e.target.value)}
              rows={3}
              placeholder="Any additional comments..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}