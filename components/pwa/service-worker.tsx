"use client";

import { useEffect } from "react";

/** Registers /sw.js in production builds only (a dev service worker makes hot reload confusing). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}

/** Ask the service worker to drop cached pages (on sign-out). */
export function clearCachedPages() {
  navigator.serviceWorker?.controller?.postMessage("clear-pages");
}
