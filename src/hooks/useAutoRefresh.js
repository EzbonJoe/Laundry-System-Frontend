import { useEffect, useRef, useState, useCallback } from "react";

export function useAutoRefresh(fetchFn, intervalMs = 60000) {
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [refreshing,   setRefreshing]   = useState(false);
  const intervalRef = useRef(null);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      await fetchFn();
      setLastUpdated(new Date());
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    // Initial load
    refresh(true);

    // Set up polling
    intervalRef.current = setInterval(() => refresh(true), intervalMs);

    // Refresh when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return { lastUpdated, refreshing, refresh };
}