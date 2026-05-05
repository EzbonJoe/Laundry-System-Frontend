export default function RefreshBar({ lastUpdated, refreshing, onRefresh }) {
  const timeAgo = (date) => {
    if (!date) return "Never";
    const secs = Math.floor((new Date() - date) / 1000);
    if (secs < 10)  return "Just now";
    if (secs < 60)  return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return date.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${refreshing ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
        <p className="text-xs text-gray-500">
          {refreshing ? "Refreshing..." : `Updated ${timeAgo(lastUpdated)}`}
        </p>
      </div>
      <button
        onClick={() => onRefresh(false)}
        disabled={refreshing}
        className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center gap-1"
      >
        <span className={refreshing ? "animate-spin inline-block" : ""}>↻</span>
        Refresh
      </button>
    </div>
  );
}