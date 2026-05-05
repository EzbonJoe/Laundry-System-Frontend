import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../../components/layout/Layout";
import api from "../../api/axios";

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.currentPassword) return setError("Current password is required.");
    if (!form.newPassword)     return setError("New password is required.");
    if (form.newPassword.length < 6) return setError("Password must be at least 6 characters.");
    if (!/\d/.test(form.newPassword)) return setError("Password must contain at least one number.");
    if (form.newPassword !== form.confirmPassword)
      return setError("Passwords do not match.");

    setError("");
    setLoading(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setSuccess("Password changed successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => navigate(-1), 1500);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">Change Password</h1>
          <p className="text-sm text-gray-400 mt-0.5">Update your account password</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-sm rounded-xl px-4 py-3">{success}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => update("currentPassword", e.target.value)}
              placeholder="Enter current password"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => update("newPassword", e.target.value)}
              placeholder="Min 6 characters with a number"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Repeat new password"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </Layout>
  );
}