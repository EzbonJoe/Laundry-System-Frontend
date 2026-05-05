import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createOrder } from "../../api/orders";
import { getCustomers, createCustomer } from "../../api/customers";

const CATEGORIES    = ["shirt","trouser","dress","suit","bedsheet","towel","jacket","other"];
const SERVICE_TYPES = ["wash","iron","wash_and_iron","dry_clean"];

const emptyItem = () => ({
  category: "shirt", serviceType: "wash", quantity: 1, unitPrice: 0, description: "",
});

export default function CreateOrderModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const branchId = user?.branch?._id || user?.branch;

  const [customers,      setCustomers]      = useState([]);
  const [customerId,     setCustomerId]     = useState("");
  const [items,          setItems]          = useState([emptyItem()]);
  const [collection,     setCollection]     = useState("pickup");
  const [address,        setAddress]        = useState("");
  const [notes,          setNotes]          = useState("");
  const [readyDate,      setReadyDate]      = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [showNewCustomer,setShowNewCustomer]= useState(false);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerError,  setCustomerError]  = useState("");

  const fetchCustomers = () => {
    getCustomers({ branch: branchId })
      .then((res) => setCustomers(res.data.data || []))
      .catch(() => {});
  };

  useEffect(() => { fetchCustomers(); }, [branchId]);

  const handleSaveCustomer = async () => {
    if (!newCustomer.name) return setCustomerError("Name is required.");
    if (!newCustomer.phone) return setCustomerError("Phone is required.");
    setCustomerError("");
    setSavingCustomer(true);
    try {
      const res = await createCustomer({ ...newCustomer, branch: branchId });
      const created = res.data.data;
      await fetchCustomers();
      setCustomerId(created._id);
      setShowNewCustomer(false);
      setNewCustomer({ name: "", phone: "", email: "" });
    } catch (e) {
      setCustomerError(e.response?.data?.message || "Failed to create customer.");
    } finally {
      setSavingCustomer(false);
    }
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        const q = field === "quantity"  ? Number(value) : Number(updated[index].quantity);
        const p = field === "unitPrice" ? Number(value) : Number(updated[index].unitPrice);
        updated[index].subtotal = q * p;
      }
      return updated;
    });
  };

  const addItem    = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const totalAmount = items.reduce((sum, item) =>
    sum + (Number(item.quantity) * Number(item.unitPrice)), 0
  );

  const handleSubmit = async () => {
    if (!customerId)  return setError("Please select a customer.");
    if (items.some(i => !i.unitPrice || i.unitPrice <= 0)) return setError("All items need a unit price.");
    if (collection === "delivery" && !address) return setError("Delivery address is required.");
    setError("");
    setLoading(true);
    try {
      await createOrder({
        customer:       customerId,
        branch:         branchId,
        collectionType: collection,
        items: items.map((item) => ({
          ...item,
          quantity:  Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          subtotal:  Number(item.quantity) * Number(item.unitPrice),
        })),
        totalAmount,
        ...(address   && { deliveryAddress: address }),
        ...(notes     && { notes }),
        ...(readyDate && { expectedReadyDate: readyDate }),
      });
      onCreated();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-800">New Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-5 space-y-5">

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {/* Customer selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Customer</label>
              <button
                onClick={() => setShowNewCustomer((v) => !v)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {showNewCustomer ? "Cancel" : "+ New Customer"}
              </button>
            </div>

            {/* Inline new customer form */}
            {showNewCustomer && (
              <div className="bg-blue-50 rounded-xl p-4 mb-3 space-y-3">
                <p className="text-xs font-semibold text-blue-700">Create New Customer</p>
                {customerError && (
                  <p className="text-xs text-red-500">{customerError}</p>
                )}
                <input
                  type="text"
                  placeholder="Full name *"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone number *"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveCustomer}
                  disabled={savingCustomer}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  {savingCustomer ? "Saving..." : "Save Customer"}
                </button>
              </div>
            )}

            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select a customer...</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>

          {/* Collection type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collection Type</label>
            <div className="flex gap-3">
              {["pickup", "delivery"].map((type) => (
                <button
                  key={type}
                  onClick={() => setCollection(type)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors capitalize
                    ${collection === type
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery address */}
          {collection === "delivery" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter delivery address"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Expected ready date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Ready Date</label>
            <input
              type="datetime-local"
              value={readyDate}
              onChange={(e) => setReadyDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Items</label>
              <button
                onClick={addItem}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-600">Item {i + 1}</p>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(i)}
                        className="text-xs text-red-400 hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(i, "category", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c} className="capitalize">{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Service</label>
                      <select
                        value={item.serviceType}
                        onChange={(e) => updateItem(i, "serviceType", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {SERVICE_TYPES.map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Unit Price (UGX)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Description (optional)</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                      placeholder="e.g. White shirt with stain"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-right text-gray-500 font-medium">
                    Subtotal: UGX {(Number(item.quantity) * Number(item.unitPrice)).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any special instructions..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Total */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-700">Total Amount</span>
            <span className="text-lg font-bold text-blue-700">UGX {totalAmount.toLocaleString()}</span>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Creating..." : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
}