"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutbox } from "@/lib/offline/client-outbox";

/** Quiet indicator: nothing when synced; "Syncing…" only if a write takes a moment; offline / sign-in when stuck. */
export function SyncStatus() {
  const { pending, state } = useOutbox();
  if (pending === 0) return null;
  if (state === "auth") {
    return (
      <a href="/login" className="flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-[12px] font-medium text-text-primary">
        Sign in to sync
      </a>
    );
  }
  if (state === "offline") {
    return (
      <span role="status" className="flex items-center gap-1.5 rounded-full bg-surface-subtle px-2.5 py-1 text-[12px] text-text-secondary">
        <CloudOff className="size-3.5" aria-hidden /> Offline · saved on phone
      </span>
    );
  }
  return state === "syncing" ? <DelayedSyncing /> : null;
}

/** Mounted per syncing episode; appears only if syncing lasts over a second. */
function DelayedSyncing() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <span role="status" className="flex items-center gap-1.5 rounded-full bg-surface-subtle px-2.5 py-1 text-[12px] text-text-secondary">
      <RefreshCw className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> Syncing…
    </span>
  );
}
