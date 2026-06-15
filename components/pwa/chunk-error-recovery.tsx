"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "flareflow-chunk-reload-attempted";

function isChunkLoadFailure(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("loading chunk") ||
    normalized.includes("chunkloaderror") ||
    normalized.includes("failed to fetch dynamically imported module")
  );
}

function isRecoverableClientError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    isChunkLoadFailure(message) ||
    normalized.includes("an error occurred in the server components render")
  );
}

function tryRecoverFromChunkError(): void {
  if (sessionStorage.getItem(RELOAD_GUARD_KEY) === "1") return;
  sessionStorage.setItem(RELOAD_GUARD_KEY, "1");

  void (async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    } finally {
      window.location.reload();
    }
  })();
}

/** After a deploy, clear stale HTML caches once and reload. */
export function ChunkErrorRecovery() {
  useEffect(() => {
    const clearGuardTimer = window.setTimeout(() => {
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
    }, 30_000);

    const handleError = (event: ErrorEvent) => {
      if (event.error instanceof DOMException) return;
      const message = event.message ?? "";
      if (!isRecoverableClientError(message)) return;
      tryRecoverFromChunkError();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason instanceof DOMException) return;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "";
      if (!isRecoverableClientError(message)) return;
      tryRecoverFromChunkError();
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.clearTimeout(clearGuardTimer);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
