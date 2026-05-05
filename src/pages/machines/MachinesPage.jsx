import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { useAuth } from "../../context/AuthContext";
import {
  getMachines,
  addMachine,
  updateMachineStatus,
  logMachineUsage,
  getMachineHistory,
} from "../../api/machines";

const MACHINE_TYPES = ["washer", "dryer", "iron", "other"];
const STATUSES      = ["idle", "in_use", "maintenance", "out_of_service"];

const statusColor = (status) => {
  const map = {
    idle:            "bg-green-100 text-green-600",
    in_use:          "bg-blue-100 text-blue-600",
    maintenance:     "bg-yellow-100 text-yellow-600",
    out_of_service:  "bg-red-100 text-red-500",
  };
  return map[status] || "bg-gray-100 text-gray-500";
};

const typeIcon = (type) => {
  const map = {
    washer: "🫧",
    dryer:  "🌀",
    iron:   "♨️",
    other:  "⚙️",
  };
  return map[type] || "⚙️";
};

export default function MachinesPage() {
  const { user }  = useAuth();
  const isManager = user?.role === "branch_manager";
  const isAdmin   = user?.role === "hq_admin";
  const branchId  = user?.branch?._id || user?.branch;

  const [machines,     setMachines]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [usageModal,   setUsageModal]   = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [statusModal,  setStatusModal]  = useState(null);

  const fetchMachines = () => {
    setLoading(true);
    getMachines({ branch: branchId })
      .then((res) => setMachines(res.data.data || []))
      .catch(() => setError("Failed to load machines."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMachines(); }, []);

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Machines</h1>
            <p className="text-sm text-gray-400 mt-0.5">{machines.length} machines</p>
          </div>
          {(isManager || isAdmin) && (
            <button
              onClick={() => setShowAdd(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              + Add Machine
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">
            Loading machines...
          </div>
        ) : machines.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No machines found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {machines.map((machine) => (
              <div key={machine._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">

                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
                      {typeIcon(machine.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{machine.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{machine.type}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColor(machine.status)}`}>
                    {machine.status?.replace("_", " ")}
                  </span>
                </div>

                {/* Branch */}
                {machine.branch?.name && (
                  <p className="text-xs text-gray-400 mb-3">🏢 {machine.branch.name}</p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                  <button
                    onClick={() => setUsageModal(machine)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Log Usage
                  </button>
                  <button
                    onClick={() => setHistoryModal(machine)}
                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    History
                  </button>
                  {(isManager || isAdmin) && (
                    <button
                      onClick={() => setStatusModal(machine)}
                      className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Machine Modal */}
      {showAdd && (
        <AddMachineModal
          branchId={branchId}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); fetchMachines(); }}
        />
      )}

      {/* Log Usage Modal */}
      {usageModal && (
        <LogUsageModal
          machine={usageModal}
          onClose={() => setUsageModal(null)}
          onLogged={() => { setUsageModal(null); fetchMachines(); }}
        />
      )}

      {/* Update Status Modal */}
      {statusModal && (
        <UpdateStatusModal
          machine={statusModal}
          onClose={() => setStatusModal(null)}
          onUpdated={() => { setStatusModal(null); fetchMachines(); }}
        />
      )}

      {/* History Modal */}
      {historyModal && (
        <HistoryModal
          machine={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </Layout>
  );
}

// ── Add Machine Modal ────────────────────────────────────────
function AddMachineModal({ branchId, onClose, onAdded }) {
  const [form, setForm] = useState({ name: "", type: "washer" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!form.name) return setError("Machine name is required.");
    setError("");
    setLoading(true);
    try {
      await addMachine({ ...form, branch: branchId });
      onAdded();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to add machine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800">Add Machine</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Machine Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Washer Unit A"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {MACHINE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setForm((p) => ({ ...p, type }))}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors capitalize
                    ${form.type === type
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {typeIcon(type)} {type}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Adding..." : "Add Machine"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Log Usage Modal ──────────────────────────────────────────
function LogUsageModal({ machine, onClose, onLogged }) {
  const [form, setForm] = useState({ startTime: "", endTime: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!form.startTime || !form.endTime) return setError("Start and end time are required.");
    if (new Date(form.endTime) <= new Date(form.startTime))
      return setError("End time must be after start time.");
    setError("");
    setLoading(true);
    try {
      await logMachineUsage(machine._id, {
        startTime: form.startTime,
        endTime:   form.endTime,
        ...(form.notes && { notes: form.notes }),
      });
      onLogged();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to log usage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800">Log Usage</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {typeIcon(machine.type)} <strong>{machine.name}</strong>
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
            <input
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
            <input
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Heavy load cycle"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Logging..." : "Log Usage"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Update Status Modal ──────────────────────────────────────
function UpdateStatusModal({ machine, onClose, onUpdated }) {
  const [status,  setStatus]  = useState(machine.status || "idle");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await updateMachineStatus(machine._id, status);
      onUpdated();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800">Update Status</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {typeIcon(machine.type)} <strong>{machine.name}</strong>
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        <div className="space-y-3 mb-5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-colors capitalize text-left px-4
                ${status === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${statusColor(s).split(" ")[0]}`} />
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? "Updating..." : "Update Status"}
        </button>
      </div>
    </div>
  );
}

// ── History Modal ────────────────────────────────────────────
function HistoryModal({ machine, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMachineHistory(machine._id)
      .then((res) => setHistory(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [machine._id]);

  const durationMins = (start, end) => {
    if (!start || !end) return "—";
    const diff = (new Date(end) - new Date(start)) / 60000;
    return `${Math.round(diff)} min`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">
            {typeIcon(machine.type)} {machine.name} — History
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm animate-pulse">Loading...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No usage history yet.</div>
          ) : (
            <div className="space-y-3">
              {history.map((log, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium text-gray-800">
                      {log.usedBy?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {durationMins(log.startTime, log.endTime)}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    <p>Start: {new Date(log.startTime).toLocaleString("en-UG")}</p>
                    <p>End:   {new Date(log.endTime).toLocaleString("en-UG")}</p>
                    {log.notes && <p>Notes: {log.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}