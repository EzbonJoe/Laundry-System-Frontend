import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCustomers, createCustomer } from "../../api/customers";
import { createOrder } from "../../api/orders";
import { recordPayment } from "../../api/payments";

// ── Constants ────────────────────────────────────────────────
const CATEGORIES = [
  { key: "shirt",     label: "Shirt",      icon: "👔" },
  { key: "trouser",   label: "Trouser",    icon: "👖" },
  { key: "dress",     label: "Dress",      icon: "👗" },
  { key: "suit",      label: "Suit",       icon: "🤵" },
  { key: "bedsheet",  label: "Bedsheet",   icon: "🛏️" },
  { key: "towel",     label: "Towel",      icon: "🧣" },
  { key: "jacket",    label: "Jacket",     icon: "🧥" },
  { key: "other",     label: "Other",      icon: "📦" },
];

const SERVICES = [
  { key: "wash",          label: "Wash",          color: "bg-blue-500"   },
  { key: "iron",          label: "Iron",           color: "bg-orange-500" },
  { key: "wash_and_iron", label: "Wash & Iron",    color: "bg-purple-500" },
  { key: "dry_clean",     label: "Dry Clean",      color: "bg-teal-500"   },
];

const DEFAULT_PRICES = {
  shirt:    { wash: 3000,  iron: 2000,  wash_and_iron: 4000,  dry_clean: 8000  },
  trouser:  { wash: 3000,  iron: 2000,  wash_and_iron: 4000,  dry_clean: 8000  },
  dress:    { wash: 5000,  iron: 3000,  wash_and_iron: 7000,  dry_clean: 12000 },
  suit:     { wash: 8000,  iron: 5000,  wash_and_iron: 12000, dry_clean: 20000 },
  bedsheet: { wash: 6000,  iron: 4000,  wash_and_iron: 9000,  dry_clean: 15000 },
  towel:    { wash: 2000,  iron: 1000,  wash_and_iron: 2500,  dry_clean: 5000  },
  jacket:   { wash: 8000,  iron: 4000,  wash_and_iron: 10000, dry_clean: 18000 },
  other:    { wash: 3000,  iron: 2000,  wash_and_iron: 4000,  dry_clean: 8000  },
};

const fmt = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

// ── Main POS Page ────────────────────────────────────────────
export default function POSPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const branchId   = user?.branch?._id || user?.branch;

  // Customer
  const [customers,      setCustomers]      = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showNewCustomer,    setShowNewCustomer]    = useState(false);

  // Order items
  const [orderItems,    setOrderItems]    = useState([]);
  const [selectedCat,   setSelectedCat]   = useState("shirt");
  const [selectedSvc,   setSelectedSvc]   = useState("wash");
  const [quantity,      setQuantity]      = useState(1);
  const [customPrice,   setCustomPrice]   = useState("");

  // Collection
  const [collectionType, setCollectionType] = useState("pickup");

  // Flow control
  const [step,          setStep]          = useState("order");  // order | payment | receipt
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [createdOrder,  setCreatedOrder]  = useState(null);

  // Payment
  const [payAmount,   setPayAmount]   = useState("");
  const [payMethod,   setPayMethod]   = useState("cash");
  const [payLoading,  setPayLoading]  = useState(false);

  // Load customers
  useEffect(() => {
    getCustomers({ branch: branchId })
      .then((res) => setCustomers(res.data.data || []))
      .catch(() => {});
  }, [branchId]);

  const filteredCustomers = customers.filter((c) =>
    customerSearch
      ? c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch)
      : true
  ).slice(0, 6);

  // Add item to order
  const addItem = () => {
    const unitPrice = customPrice
      ? Number(customPrice)
      : DEFAULT_PRICES[selectedCat]?.[selectedSvc] || 3000;

    const existing = orderItems.findIndex(
      (i) => i.category === selectedCat && i.serviceType === selectedSvc
    );

    if (existing >= 0) {
      setOrderItems((prev) => prev.map((item, idx) =>
        idx === existing
          ? {
              ...item,
              quantity:  item.quantity + quantity,
              subtotal:  (item.quantity + quantity) * item.unitPrice,
            }
          : item
      ));
    } else {
      setOrderItems((prev) => [...prev, {
        category:    selectedCat,
        serviceType: selectedSvc,
        quantity,
        unitPrice,
        subtotal:    quantity * unitPrice,
        description: "",
      }]);
    }
    setCustomPrice("");
    setQuantity(1);
  };

  const removeItem = (i) => setOrderItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateQty = (i, delta) => {
    setOrderItems((prev) => prev.map((item, idx) => {
      if (idx !== i) return item;
      const newQty = Math.max(1, item.quantity + delta);
      return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
    }));
  };

  const totalAmount = orderItems.reduce((s, i) => s + i.subtotal, 0);

  // Place order
  const handlePlaceOrder = async () => {
    if (!selectedCustomer) return setError("Please select a customer.");
    if (orderItems.length === 0) return setError("Add at least one item.");
    setError("");
    setLoading(true);
    try {
      const res = await createOrder({
        customer:       selectedCustomer._id,
        branch:         branchId,
        collectionType,
        items:          orderItems,
        totalAmount,
      });
      setCreatedOrder(res.data.data);
      setPayAmount(totalAmount);
      setStep("payment");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  // Record payment
  const handlePayment = async (payNow) => {
    if (!payNow) {
      setStep("receipt");
      return;
    }
    if (!payAmount || Number(payAmount) <= 0)
      return setError("Enter a valid amount.");
    setError("");
    setPayLoading(true);
    try {
      await recordPayment({
        orderId: createdOrder._id,
        amount:  Number(payAmount),
        method:  payMethod,
      });
      setStep("receipt");
    } catch (e) {
      setError(e.response?.data?.message || "Payment failed.");
    } finally {
      setPayLoading(false);
    }
  };

  // New order reset
  const handleNewOrder = () => {
    setOrderItems([]);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCreatedOrder(null);
    setPayAmount("");
    setCollectionType("pickup");
    setStep("order");
    setError("");
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">

      {/* ── Topbar ── */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🧺</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">EazyBriz POS</p>
            <p className="text-gray-400 text-xs">{user?.branch?.name || "Branch"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-gray-400 text-sm">{user?.name}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      {step === "order" && (
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT — Item selector */}
          <div className="w-[60%] flex flex-col border-r border-gray-700 overflow-hidden">

            {/* Customer bar */}
            <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex-shrink-0">
              {selectedCustomer ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {selectedCustomer.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{selectedCustomer.name}</p>
                      <p className="text-gray-400 text-sm">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-white text-sm bg-gray-700 px-3 py-1.5 rounded-lg"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowCustomerSearch(true); setShowNewCustomer(false); }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                  >
                    👤 Select Customer
                  </button>
                  <button
                    onClick={() => { setShowNewCustomer(true); setShowCustomerSearch(false); }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                  >
                    + New Customer
                  </button>
                </div>
              )}

              {/* Customer search dropdown */}
              {showCustomerSearch && !selectedCustomer && (
                <div className="mt-3">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search by name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c._id}
                        onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); setCustomerSearch(""); }}
                        className="bg-gray-700 hover:bg-gray-600 text-left px-4 py-2.5 rounded-xl transition-colors"
                      >
                        <p className="text-white text-sm font-medium">{c.name}</p>
                        <p className="text-gray-400 text-xs">{c.phone}</p>
                      </button>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <p className="text-gray-400 text-sm col-span-2 py-2">No customers found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* New customer form */}
              {showNewCustomer && (
                <NewCustomerForm
                  branchId={branchId}
                  onCreated={(c) => {
                    setCustomers((prev) => [...prev, c]);
                    setSelectedCustomer(c);
                    setShowNewCustomer(false);
                  }}
                  onCancel={() => setShowNewCustomer(false)}
                />
              )}
            </div>

            {/* Category selector */}
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
                Select Item
              </p>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCat(cat.key)}
                    className={`py-3 rounded-xl text-center transition-colors border-2
                      ${selectedCat === cat.key
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      }`}
                  >
                    <span className="text-2xl block mb-1">{cat.icon}</span>
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Service selector */}
            <div className="px-6 pb-3 flex-shrink-0">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">
                Service Type
              </p>
              <div className="grid grid-cols-4 gap-2">
                {SERVICES.map((svc) => (
                  <button
                    key={svc.key}
                    onClick={() => setSelectedSvc(svc.key)}
                    className={`py-3 rounded-xl text-sm font-semibold transition-colors border-2
                      ${selectedSvc === svc.key
                        ? `${svc.color} border-transparent text-white`
                        : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      }`}
                  >
                    {svc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price + Qty + Add */}
            <div className="px-6 pb-4 flex-shrink-0">
              <div className="bg-gray-800 rounded-2xl p-4 flex items-center gap-4">
                {/* Unit price */}
                <div className="flex-1">
                  <p className="text-gray-400 text-xs mb-1">Unit Price (UGX)</p>
                  <input
                    type="number"
                    placeholder={String(DEFAULT_PRICES[selectedCat]?.[selectedSvc] || 3000)}
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <p className="text-gray-400 text-xs mb-1">Qty</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xl font-bold transition-colors"
                    >
                      −
                    </button>
                    <span className="text-white text-xl font-bold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 h-10 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xl font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Subtotal preview */}
                <div className="text-right">
                  <p className="text-gray-400 text-xs mb-1">Subtotal</p>
                  <p className="text-green-400 text-lg font-bold">
                    {fmt(quantity * (customPrice
                      ? Number(customPrice)
                      : DEFAULT_PRICES[selectedCat]?.[selectedSvc] || 3000
                    ))}
                  </p>
                </div>

                {/* Add button */}
                <button
                  onClick={addItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Collection type */}
            <div className="px-6 pb-4 flex-shrink-0">
              <div className="flex gap-3">
                {["pickup", "delivery"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setCollectionType(type)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 capitalize transition-colors
                      ${collectionType === type
                        ? "bg-gray-600 border-gray-500 text-white"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                      }`}
                  >
                    {type === "pickup" ? "🏪 Pickup" : "🚚 Delivery"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Order summary */}
          <div className="w-[40%] flex flex-col bg-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-white font-bold text-lg">Order Summary</h2>
              {orderItems.length > 0 && (
                <p className="text-gray-400 text-sm">{orderItems.length} item type{orderItems.length !== 1 ? "s" : ""}</p>
              )}
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {orderItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <span className="text-5xl mb-3">🧺</span>
                  <p className="text-sm">No items added yet</p>
                  <p className="text-xs mt-1">Select a category and service to begin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item, i) => (
                    <div key={i} className="bg-gray-700 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-semibold capitalize">{item.category}</p>
                          <p className="text-gray-400 text-xs capitalize">
                            {item.serviceType.replace("_", " ")}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(i)}
                          className="text-gray-500 hover:text-red-400 text-sm transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(i, -1)}
                            className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-bold transition-colors"
                          >
                            −
                          </button>
                          <span className="text-white font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(i, 1)}
                            className="w-8 h-8 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-bold transition-colors"
                          >
                            +
                          </button>
                          <span className="text-gray-400 text-xs ml-1">× {fmt(item.unitPrice)}</span>
                        </div>
                        <p className="text-green-400 font-bold">{fmt(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total + Place order */}
            <div className="px-6 py-4 border-t border-gray-700 flex-shrink-0">
              {error && (
                <div className="bg-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 text-lg">Total</span>
                <span className="text-white text-2xl font-bold">{fmt(totalAmount)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={loading || orderItems.length === 0 || !selectedCustomer}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
              >
                {loading ? "Placing Order..." : "✓ Place Order"}
              </button>
              {!selectedCustomer && (
                <p className="text-center text-gray-500 text-xs mt-2">Select a customer to continue</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Step ── */}
      {step === "payment" && createdOrder && (
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-800 rounded-3xl p-6 w-full max-w-lg">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <h2 className="text-white text-xl font-bold">Order Placed!</h2>
              <p className="text-gray-400 mt-0.5 text-sm">{createdOrder.orderNumber}</p>
            </div>

            {/* Order summary — compact */}
            <div className="bg-gray-700 rounded-2xl p-4 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Customer</span>
                <span className="text-white font-medium">{selectedCustomer?.name}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Items</span>
                <span className="text-white font-medium">{orderItems.length} type(s)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total</span>
                <span className="text-green-400 font-bold">{fmt(totalAmount)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3 mb-3">{error}</div>
            )}

            {/* Amount */}
            <div className="mb-3">
              <label className="text-gray-400 text-sm block mb-1">Amount Received (UGX)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full bg-gray-700 text-white text-xl font-bold rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Payment method */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { key: "cash",         label: "💵 Cash"         },
                { key: "mobile_money", label: "📱 Mobile Money" },
                { key: "card",         label: "💳 Card"         },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setPayMethod(m.key)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors
                    ${payMethod === m.key
                      ? "bg-green-600 border-green-500 text-white"
                      : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePayment(false)}
                className="py-3.5 rounded-2xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
              >
                Pay Later
              </button>
              <button
                onClick={() => handlePayment(true)}
                disabled={payLoading}
                className="py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-bold text-base transition-colors"
              >
                {payLoading ? "Processing..." : "✓ Collect Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Step ── */}
      {step === "receipt" && createdOrder && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="pos-receipt bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">

            {/* Receipt header */}
            <div className="text-center mb-6">
              <p className="text-2xl font-bold text-gray-800">EazyBriz</p>
              <p className="text-gray-400 text-sm">{user?.branch?.name || "Branch"}</p>
              <div className="print-divider border-t border-dashed border-gray-200 my-4" />
              <p className="text-lg font-bold text-gray-800">{createdOrder.orderNumber}</p>
              <p className="text-sm text-gray-400">
                {new Date().toLocaleDateString("en-UG", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>

            {/* Customer */}
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-800">{selectedCustomer?.name}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-800">{selectedCustomer?.phone}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-500">Collection</span>
              <span className="font-medium text-gray-800 capitalize">{collectionType}</span>
            </div>

            <div className="print-divider border-t border-dashed border-gray-200 my-4" />

            {/* Items */}
            <div className="space-y-2 mb-4">
              {orderItems.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">
                    {item.category} ({item.serviceType.replace("_", " ")}) × {item.quantity}
                  </span>
                  <span className="font-medium text-gray-800">{fmt(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="print-divider border-t border-dashed border-gray-200 my-4" />

            {/* Totals */}
            <div className="flex justify-between text-lg font-bold mb-1">
              <span className="text-gray-800">Total</span>
              <span className="text-gray-800">{fmt(totalAmount)}</span>
            </div>
            {payAmount && Number(payAmount) > 0 && (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Paid ({payMethod.replace("_", " ")})</span>
                  <span className="text-green-600 font-semibold">{fmt(Number(payAmount))}</span>
                </div>
                {Number(payAmount) < totalAmount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Balance</span>
                    <span className="text-red-500 font-semibold">
                      {fmt(totalAmount - Number(payAmount))}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Served by */}
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">Served by</span>
              <span className="font-medium text-gray-800">{user?.name}</span>
            </div>

            <div className="print-divider border-t border-dashed border-gray-200 my-4" />
            <p className="text-center text-xs text-gray-400 mb-6">
              Thank you for using EazyBriz!
            </p>

            {/* Actions — hidden when printing */}
            <div className="no-print grid grid-cols-2 gap-3">
              <button
                onClick={() => window.print()}
                className="py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
              >
                🖨️ Print
              </button>
              <button
                onClick={handleNewOrder}
                className="py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
              >
                + New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Customer Form (inline in POS) ────────────────────────
function NewCustomerForm({ branchId, onCreated, onCancel }) {
  const [form,    setForm]    = useState({ name: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!form.name)  return setError("Name is required.");
    if (!form.phone) return setError("Phone is required.");
    setError("");
    setLoading(true);
    try {
      const res = await createCustomer({ ...form, branch: branchId });
      onCreated(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 bg-gray-700 rounded-2xl p-4 space-y-3">
      <p className="text-white text-sm font-semibold">New Customer</p>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <input
        type="text"
        placeholder="Full name *"
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        className="w-full bg-gray-600 text-white placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="tel"
        placeholder="Phone number *"
        value={form.phone}
        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        className="w-full bg-gray-600 text-white placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="email"
        placeholder="Email (optional)"
        value={form.email}
        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        className="w-full bg-gray-600 text-white placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}