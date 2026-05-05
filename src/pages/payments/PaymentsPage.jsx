import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import {
  getPayments,
  recordPayment,
  flagPayment,
  getReceipt,
} from "../../api/payments";
import { getOrders } from "../../api/orders";

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

const methodColor = (method) => {
  const map = {
    cash:         "bg-green-100 text-green-600",
    mobile_money: "bg-blue-100 text-blue-600",
    card:         "bg-purple-100 text-purple-600",
  };
  return map[method] || "bg-gray-100 text-gray-500";
};

export default function PaymentsPage() {
  const { user }   = useAuth();
  const isManager  = user?.role === "branch_manager";
  const isAdmin    = user?.role === "hq_admin";
  const branchId   = user?.branch?._id || user?.branch;

  const [payments,      setPayments]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [showRecord,    setShowRecord]    = useState(false);
  const [flagModal,     setFlagModal]     = useState(null);
  const [receiptModal,  setReceiptModal]  = useState(null);
  const [flagReason,    setFlagReason]    = useState("");
  const [flagLoading,   setFlagLoading]   = useState(false);
  const [filterFlag,    setFilterFlag]    = useState("");
  const [filterMethod,  setFilterMethod]  = useState("");

  const fetchPayments = () => {
    setLoading(true);
    const params = {};
    if (filterFlag   !== "") params.isFlagged = filterFlag;
    if (filterMethod !== "") params.method    = filterMethod;
    getPayments(params)
      .then((res) => setPayments(res.data.data || []))
      .catch(() => setError("Failed to load payments."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [filterFlag, filterMethod]);

  const handleFlag = async () => {
    if (!flagReason) return;
    setFlagLoading(true);
    try {
      await flagPayment(flagModal._id, flagReason);
      setFlagModal(null);
      setFlagReason("");
      fetchPayments();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to flag payment.");
    } finally {
      setFlagLoading(false);
    }
  };

  // Summary stats
  const totalAmount  = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const flaggedCount = payments.filter((p) => p.isFlagged).length;

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Payments</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {payments.length} records · {fmt(totalAmount)} total
              {flaggedCount > 0 && (
                <span className="ml-2 text-red-500">· {flaggedCount} flagged</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowRecord(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            + Record Payment
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Flag filter */}
          {[
            { label: "All",     value: ""      },
            { label: "Flagged", value: "true"  },
            { label: "Normal",  value: "false" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterFlag(f.value)}
              className={`text-sm px-4 py-2 rounded-xl font-medium border transition-colors
                ${filterFlag === f.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
            >
              {f.label}
            </button>
          ))}

          {/* Method filter */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="card">Card</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No payments found.</div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {payment.order?.orderNumber || "Unknown Order"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {payment.receivedBy?.name || "—"} •{" "}
                      {new Date(payment.createdAt).toLocaleDateString("en-UG", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    {payment.order?.customer?.name && (
                      <p className="text-xs text-gray-400">
                        👤 {payment.order.customer.name}
                      </p>
                    )}
                  </div>
                  <p className="text-base font-bold text-gray-800">{fmt(payment.amount)}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${methodColor(payment.method)}`}>
                    {payment.method?.replace("_", " ")}
                  </span>
                  {payment.isFlagged && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-500">
                      🚩 Flagged
                    </span>
                  )}
                </div>

                {payment.isFlagged && payment.flagReason && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">
                    Reason: {payment.flagReason}
                  </p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                  {/* Receipt */}
                  <button
                    onClick={() => setReceiptModal(payment)}
                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    🧾 Receipt
                  </button>

                  {/* Flag */}
                  {(isManager || isAdmin) && !payment.isFlagged && (
                    <button
                      onClick={() => setFlagModal(payment)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-500 font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      🚩 Flag
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showRecord && (
        <RecordPaymentModal
          branchId={branchId}
          onClose={() => setShowRecord(false)}
          onRecorded={() => { setShowRecord(false); fetchPayments(); }}
        />
      )}

      {/* Flag Modal */}
      {flagModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <h3 className="font-bold text-gray-800 mb-4">Flag Payment</h3>
            <p className="text-sm text-gray-500 mb-4">
              Flag payment of <strong>{fmt(flagModal.amount)}</strong> for review.
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              rows={3}
              placeholder="Reason for flagging..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setFlagModal(null); setFlagReason(""); }}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={!flagReason || flagLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {flagLoading ? "Flagging..." : "Flag"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal && (
        <ReceiptModal
          payment={receiptModal}
          onClose={() => setReceiptModal(null)}
        />
      )}
    </Layout>
  );
}

// ── Record Payment Modal ─────────────────────────────────────
function RecordPaymentModal({ branchId, onClose, onRecorded }) {
  const [orders,   setOrders]   = useState([]);
  const [orderId,  setOrderId]  = useState("");
  const [amount,   setAmount]   = useState("");
  const [method,   setMethod]   = useState("cash");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    getOrders({ branch: branchId })
      .then((res) => {
        const unpaid = (res.data.data || []).filter(
          (o) => o.paymentStatus !== "paid"
        );
        setOrders(unpaid);
      })
      .catch(() => {});
  }, [branchId]);

  const selectedOrder = orders.find((o) => o._id === orderId);
  const remaining     = selectedOrder
    ? selectedOrder.totalAmount - selectedOrder.amountPaid
    : 0;

  const handleSubmit = async () => {
    if (!orderId) return setError("Please select an order.");
    if (!amount || Number(amount) <= 0) return setError("Enter a valid amount.");
    setError("");
    setLoading(true);
    try {
      await recordPayment({ orderId, amount: Number(amount), method });
      onRecorded();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to record payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Record Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select an order...</option>
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.orderNumber} — {o.customer?.name} — {fmt(o.totalAmount)}
                </option>
              ))}
            </select>
          </div>

          {selectedOrder && (
            <div className="bg-yellow-50 rounded-xl px-4 py-3 flex justify-between">
              <span className="text-sm text-yellow-700">Balance Remaining</span>
              <span className="text-sm font-bold text-yellow-700">{fmt(remaining)}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (UGX)</label>
            <input
              type="number" min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount paid"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedOrder && remaining > 0 && (
              <button
                onClick={() => setAmount(remaining)}
                className="text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                Pay full balance ({fmt(remaining)})
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {["cash", "mobile_money", "card"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`py-2.5 rounded-xl text-xs font-medium border transition-colors
                    ${method === m
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {m === "mobile_money" ? "Mobile Money" : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Receipt Modal ────────────────────────────────────────────
function ReceiptModal({ payment, onClose }) {
  const [receipt,  setReceipt]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    getReceipt(payment._id)
      .then((res) => setReceipt(res.data.data))
      .catch(() => setError("Failed to load receipt."))
      .finally(() => setLoading(false));
  }, [payment._id]);

  const data = receipt || payment;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">🧾 Receipt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm animate-pulse">Loading receipt...</div>
        ) : error ? (
          <div className="p-5 text-red-500 text-sm">{error}</div>
        ) : (
          <div className="p-5">
            {/* Header */}
            <div className="text-center mb-5">
              <p className="text-xl font-bold text-gray-800">EazyBriz</p>
              <p className="text-xs text-gray-400">Laundry Management System</p>
              {data.branch?.name && (
                <p className="text-xs text-gray-500 mt-1">{data.branch.name}</p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 my-3" />

            {/* Order details */}
            <div className="space-y-2 mb-4">
              {[
                { label: "Receipt #",   value: data._id?.slice(-8).toUpperCase() },
                { label: "Order #",     value: data.order?.orderNumber || payment.order?.orderNumber },
                { label: "Customer",    value: data.order?.customer?.name || data.customer?.name || "—" },
                { label: "Date",        value: new Date(data.createdAt).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" }) },
                { label: "Method",      value: (data.method || payment.method)?.replace("_", " ") },
                { label: "Served by",   value: data.receivedBy?.name || payment.receivedBy?.name || "—" },
              ].map((row, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-800 capitalize">{row.value || "—"}</span>
                </div>
              ))}
            </div>

            {/* Items */}
            {(data.order?.items || []).length > 0 && (
              <>
                <div className="border-t border-dashed border-gray-200 my-3" />
                <div className="space-y-2 mb-4">
                  {data.order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span className="capitalize">
                        {item.category} ({item.serviceType?.replace("_", " ")}) × {item.quantity}
                      </span>
                      <span>{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 my-3" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Total</span>
                <span className="font-medium">{fmt(data.order?.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount Paid</span>
                <span className="font-medium text-green-600">{fmt(data.amount || payment.amount)}</span>
              </div>
              {(data.order?.totalAmount - (data.order?.amountPaid || 0)) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Balance</span>
                  <span className="font-medium text-red-500">
                    {fmt(data.order?.totalAmount - (data.order?.amountPaid || 0))}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-200 my-3" />
            <p className="text-center text-xs text-gray-400">Thank you for using EazyBriz!</p>
          </div>
        )}
      </div>
    </div>
  );
}