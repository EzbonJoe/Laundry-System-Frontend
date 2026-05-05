import { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import {
  getStaff,
  createStaff,
  updateStaff,
  deactivateUser,
  reactivateUser,
} from "../../api/staff";
import { getBranches } from "../../api/branches";
import { resetPassword } from "../../api/auth";

const roleColor = (role) => {
  const map = {
    hq_admin:       "bg-purple-100 text-purple-700",
    branch_manager: "bg-blue-100 text-blue-700",
    staff:          "bg-green-100 text-green-700",
  };
  return map[role] || "bg-gray-100 text-gray-500";
};

const roleLabel = (role) => {
  const map = {
    hq_admin:       "HQ Admin",
    branch_manager: "Branch Manager",
    staff:          "Staff",
  };
  return map[role] || role;
};

export default function StaffPage() {
  const [staffList,     setStaffList]     = useState([]);
  const [branches,      setBranches]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [showAdd,       setShowAdd]       = useState(false);
  const [editMember,    setEditMember]    = useState(null);
  const [roleFilter,    setRoleFilter]    = useState("");
  const [search,        setSearch]        = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [resetModal, setResetModal] = useState(null);

  const fetchStaff = () => {
    setLoading(true);
    const params = {};
    if (roleFilter) params.role = roleFilter;
    getStaff(params)
      .then((res) => setStaffList(res.data.data || []))
      .catch(() => setError("Failed to load staff."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
    getBranches().then((res) => setBranches(res.data.data || []));
  }, [roleFilter]);

  const handleDeactivate = async (member) => {
    if (!window.confirm(`Deactivate ${member.name}?`)) return;
    setActionLoading(member._id + "deactivate");
    try {
      await deactivateUser(member._id);
      fetchStaff();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to deactivate user.");
    } finally {
      setActionLoading("");
    }
  };

  const handleReactivate = async (member) => {
    setActionLoading(member._id + "reactivate");
    try {
      await reactivateUser(member._id);
      fetchStaff();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to reactivate user.");
    } finally {
      setActionLoading("");
    }
  };

  const filtered = staffList.filter((s) =>
    search
      ? s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} staff members</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            + Add Staff
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="hq_admin">HQ Admin</option>
            <option value="branch_manager">Branch Manager</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm animate-pulse">
            Loading staff...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No staff found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((member) => (
              <div key={member._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">
                      {member.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(member.role)}`}>
                        {roleLabel(member.role)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${member.isActive
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"
                        }`}>
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{member.email}</p>
                    {member.branch?.name && (
                      <p className="text-xs text-gray-400">🏢 {member.branch.name}</p>
                    )}
                    {member.phone && (
                      <p className="text-xs text-gray-400">📞 {member.phone}</p>
                    )}
                    {member.lastLogin && (
                      <p className="text-xs text-gray-400">
                        Last login:{" "}
                        {new Date(member.lastLogin).toLocaleDateString("en-UG", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => setEditMember(member)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setResetModal(member)}
                    className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    🔑 Reset Password
                  </button>

                  {member.isActive ? (
                    <button
                      onClick={() => handleDeactivate(member)}
                      disabled={!!actionLoading}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-500 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === member._id + "deactivate" ? "Deactivating..." : "Deactivate"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(member)}
                      disabled={!!actionLoading}
                      className="text-xs bg-green-50 hover:bg-green-100 text-green-600 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === member._id + "reactivate" ? "Reactivating..." : "Reactivate"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAdd && (
        <StaffFormModal
          branches={branches}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchStaff(); }}
        />
      )}

      {/* Edit Staff Modal */}
      {editMember && (
        <StaffFormModal
          branches={branches}
          existing={editMember}
          onClose={() => setEditMember(null)}
          onSaved={() => { setEditMember(null); fetchStaff(); }}
        />
      )}
    </Layout>
  );
}

// ── Staff Form Modal (Add + Edit) ────────────────────────────
function StaffFormModal({ branches, existing, onClose, onSaved }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    name:     existing?.name           || "",
    email:    existing?.email          || "",
    password: "",
    role:     existing?.role           || "staff",
    phone:    existing?.phone          || "",
    branch:   existing?.branch?._id || existing?.branch || "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const needsBranch = ["branch_manager", "staff"].includes(form.role);

  const handleSubmit = async () => {
    if (!form.name)  return setError("Name is required.");
    if (!form.email) return setError("Email is required.");
    if (!isEdit && !form.password) return setError("Password is required.");
    if (needsBranch && !form.branch) return setError("Branch is required for this role.");
    setError("");
    setLoading(true);
    try {
      if (isEdit) {
        const payload = {
          name:  form.name,
          phone: form.phone,
          role:  form.role,
          ...(needsBranch && { branch: form.branch }),
        };
        await updateStaff(existing._id, payload);
      } else {
        await createStaff({
          name:     form.name,
          email:    form.email,
          password: form.password,
          role:     form.role,
          phone:    form.phone,
          ...(needsBranch && { branch: form.branch }),
        });
      }
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save staff member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-800">
            {isEdit ? "Edit Staff Member" : "Add Staff Member"}
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
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Sarah Nakato"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email {!isEdit && "*"}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="sarah@ezybriz.com"
              disabled={isEdit}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Min 6 characters with a number"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+256700000000"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="staff">Staff</option>
              <option value="branch_manager">Branch Manager</option>
              <option value="hq_admin">HQ Admin</option>
            </select>
          </div>

          {needsBranch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
              <select
                value={form.branch}
                onChange={(e) => update("branch", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a branch...</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name} — {b.location}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Saving..." : isEdit ? "Update Staff Member" : "Create Staff Member"}
          </button>

           {/* Reset Password Modal */}
          {resetModal && (
            <ResetPasswordModal
              member={resetModal}
              onClose={() => setResetModal(null)}
            />
          )}

        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ member, onClose }) {
  const [newPassword,  setNewPassword]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");

  const handleSubmit = async () => {
    if (!newPassword)          return setError("Password is required.");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters.");
    if (!/\d/.test(newPassword)) return setError("Password must contain at least one number.");
    setError("");
    setLoading(true);
    try {
      await resetPassword({ userId: member._id, newPassword });
      setSuccess("Password reset successfully!");
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Reset Password</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Reset password for <strong>{member.name}</strong>
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 text-sm rounded-xl px-4 py-3 mb-4">{success}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters with a number"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {loading ? "Resetting..." : "Reset"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}