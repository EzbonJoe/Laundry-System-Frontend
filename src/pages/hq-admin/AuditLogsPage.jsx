import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { getAllLogs, getLogsByUser, getLogsByBranch } from "../../api/auditLogs";
import { getBranches } from "../../api/branches";
import { getStaff } from "../../api/staff";

const actionColor = (action) => {
  const map = {
    LOGIN:          "bg-blue-100 text-blue-600",
    LOGOUT:         "bg-gray-100 text-gray-500",
    CREATE:         "bg-green-100 text-green-600",
    UPDATE:         "bg-yellow-100 text-yellow-600",
    DELETE:         "bg-red-100 text-red-500",
    PAYMENT:        "bg-purple-100 text-purple-600",
    STATUS_CHANGE:  "bg-teal-100 text-teal-600",
  };
  return map[action] || "bg-gray-100 text-gray-500";
};

export default function AuditLogsPage() {
  const [logs,       setLogs]       = useState([]);
  const [branches,   setBranches]   = useState([]);
  const [staff,      setStaff]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [filterType, setFilterType] = useState("all");   // all | user | branch
  const [selectedId, setSelectedId] = useState("");
  const [search,     setSearch]     = useState("");

  useEffect(() => {
    getBranches().then((res) => setBranches(res.data.data || []));
    getStaff().then((res)    => setStaff(res.data.data    || []));
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    setError("");

    const call =
      filterType === "user"   && selectedId ? getLogsByUser(selectedId)   :
      filterType === "branch" && selectedId ? getLogsByBranch(selectedId) :
      getAllLogs();

    call
      .then((res) => setLogs(res.data.data || []))
      .catch(() => setError("Failed to load audit logs."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [filterType, selectedId]);

  const filtered = logs.filter((log) =>
    search
      ? log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.description?.toLowerCase().includes(search.toLowerCase()) ||
        log.entity?.toLowerCase().includes(search.toLowerCase()) ||
        log.performedBy?.name?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Full accountability trail — {filtered.length} records
          </p>
        </div>

        {/* Filter type */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all",    label: "All Logs"   },
            { key: "user",   label: "By User"    },
            { key: "branch", label: "By Branch"  },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilterType(f.key); setSelectedId(""); }}
              className={`text-sm px-4 py-2 rounded-xl font-medium border transition-colors
                ${filterType === f.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Secondary filter — user or branch selector */}
        {filterType === "user" && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a staff member...</option>
            {staff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} — {s.email}
              </option>
            ))}
          </select>
        )}

        {filterType === "branch" && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a branch...</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} — {b.location}
              </option>
            ))}
          </select>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Search by action, entity or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">
            Loading audit logs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No logs found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((log) => (
              <div key={log._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${actionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                      {log.entity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {new Date(log.createdAt).toLocaleDateString("en-UG", {
                      day: "numeric", month: "short", year: "numeric",
                    })}{" "}
                    {new Date(log.createdAt).toLocaleTimeString("en-UG", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                {log.description && (
                  <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  {log.performedBy?.name && (
                    <span>👤 {log.performedBy.name}</span>
                  )}
                  {log.branch?.name && (
                    <span>🏢 {log.branch.name}</span>
                  )}
                  {log.ipAddress && (
                    <span>🌐 {log.ipAddress}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}