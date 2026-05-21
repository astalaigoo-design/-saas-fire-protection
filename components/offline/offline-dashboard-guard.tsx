"use client";

import { useEffect } from "react";

const LAST_INSPECTION_PATH_KEY = "offline-last-inspection-path";

export function OfflineDashboardGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const maybeRedirectToLastInspection = () => {
      if (navigator.onLine) return;
      if (!window.location.pathname.startsWith("/dashboard")) return;

      const lastInspectionPath = localStorage.getItem(LAST_INSPECTION_PATH_KEY);
      if (!lastInspectionPath) return;
      if (lastInspectionPath === window.location.pathname) return;

      window.location.replace(lastInspectionPath);
    };

    maybeRedirectToLastInspection();
    window.addEventListener("online", maybeRedirectToLastInspection);
    window.addEventListener("offline", maybeRedirectToLastInspection);

    return () => {
      window.removeEventListener("online", maybeRedirectToLastInspection);
      window.removeEventListener("offline", maybeRedirectToLastInspection);
    };
  }, []);

  return null;
}
