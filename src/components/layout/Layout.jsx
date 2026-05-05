import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getMyNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from "../../api/notifications";

const navItems = {
  hq_admin: [
    { label: "Dashboard",   path: "/hq/dashboard",   icon: "📊" },
    { label: "Branches",    path: "/hq/branches",    icon: "🏢" },
    { label: "Staff",       path: "/hq/staff",       icon: "👥" },
    { label: "Reports",     path: "/hq/reports",     icon: "📈" },
    { label: "Audit Logs",  path: "/hq/audit-logs",  icon: "📋" },
    { label: "Feedback", path: "/hq/feedback", icon: "⭐" },
    { label: "Machines", path: "/hq/machines", icon: "🌀" },
  ],
  branch_manager: [
    { label: "Dashboard",   path: "/manager/dashboard",  icon: "📊" },
    { label: "Orders",      path: "/manager/orders",     icon: "🧺" },
    { label: "Payments",    path: "/manager/payments",   icon: "💰" },
    { label: "Inventory",   path: "/manager/inventory",  icon: "📦" },
    { label: "Customers",   path: "/manager/customers",  icon: "👤" },
    { label: "Expenses",    path: "/manager/expenses",   icon: "💸" },
    { label: "Reports",     path: "/manager/reports",    icon: "📈" },
    { label: "Feedback", path: "/manager/feedback", icon: "⭐" },
    { label: "Machines", path: "/manager/machines", icon: "🌀" },
    { label: "POS", path: "/pos", icon: "🖥️" },
  ],
  staff: [
    { label: "Dashboard",   path: "/staff/dashboard",    icon: "📊" },
    { label: "Orders",      path: "/staff/orders",       icon: "🧺" },
    { label: "Customers",   path: "/staff/customers",    icon: "👤" },
    { label: "Payments",    path: "/staff/payments",     icon: "💰" },
    { label: "Inventory",   path: "/staff/inventory",    icon: "📦" },
    { label: "Feedback", path: "/staff/feedback", icon: "⭐" },
    { label: "Machines", path: "/staff/machines", icon: "🌀" },
    { label: "POS", path: "/pos", icon: "🖥️" },
  ],
};

export default function Layout({ children }) {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Notifications state ──
  const [notifications,  setNotifications]  = useState([]);
  const [showNotifs,     setShowNotifs]      = useState(false);
  const [notifLoading,   setNotifLoading]    = useState(false);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = () => {
    setNotifLoading(true);
    getMyNotifications()
      .then((res) => setNotifications(res.data.data || []))
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkRead = async (id) => {
    await markRead(id);
    setNotifications((prev) =>
      prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const items = navItems[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const roleBadge = {
    hq_admin:       { label: "HQ Admin",       color: "bg-purple-100 text-purple-700" },
    branch_manager: { label: "Branch Manager", color: "bg-blue-100 text-blue-700"    },
    staff:          { label: "Staff",           color: "bg-green-100 text-green-700"  },
  };
  const badge = roleBadge[user?.role];

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-30 flex flex-col
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-200
      `}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-lg">🧺</span>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">EazyBriz</p>
            <p className="text-xs text-gray-400">Laundry System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge?.color}`}>
                {badge?.label}
              </span>
            </div>
          </div>

          <NavLink
            to={`/${user?.role === 'hq_admin' ? 'hq' : user?.role === 'branch_manager' ? 'manager' : 'staff'}/change-password`}
            className="w-full text-left text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors block mb-1"
          >
            🔑 Change Password
          </NavLink>
          
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-red-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="space-y-1">
              <span className="block w-5 h-0.5 bg-gray-600"></span>
              <span className="block w-5 h-0.5 bg-gray-600"></span>
              <span className="block w-5 h-0.5 bg-gray-600"></span>
            </div>
          </button>

          <div className="lg:hidden font-bold text-gray-800">EazyBriz</div>

          <div className="hidden lg:block text-sm text-gray-500">
            Welcome back,{" "}
            <span className="font-semibold text-gray-800">{user?.name}</span>
          </div>

          {/* Right side — date + notification bell */}
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString("en-UG", {
                weekday: "short", year: "numeric",
                month: "short",   day: "numeric",
              })}
            </p>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs((v) => !v)}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-800 text-sm">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="text-center py-8 text-gray-400 text-xs animate-pulse">
                        Loading...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        <p className="text-2xl mb-2">🔕</p>
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`px-4 py-3 border-b border-gray-50 last:border-0 
                            ${!notif.isRead ? "bg-blue-50" : "bg-white"}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                            >
                              <p className={`text-sm ${!notif.isRead ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                                {notif.title || notif.message}
                              </p>
                              {notif.title && notif.message && (
                                <p className="text-xs text-gray-400 mt-0.5">{notif.message}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString("en-UG", {
                                  day: "numeric", month: "short",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDelete(notif._id)}
                              className="text-gray-300 hover:text-red-400 text-sm flex-shrink-0"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}