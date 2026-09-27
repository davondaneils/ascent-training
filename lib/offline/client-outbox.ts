"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { Outbox, type OutboxSnapshot } from "./outbox";
import { supabaseExecutor } from "./supabase-executor";

let outbox: Outbox | undefined;

const memoryStorage = new Map<string, string>();
const safeStorage = {
  getItem: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return memoryStorage.get(k) ?? null;
    }
  },
  setItem: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      memoryStorage.set(k, v);
    }
  },
  removeItem: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      memoryStorage.delete(k);
    }
  },
};

export function getOutbox(): Outbox {
  outbox ??= new Outbox(safeStorage, "ascent:outbox", supabaseExecutor(getBrowserClient()));
  return outbox;
}

const SERVER_SNAPSHOT: OutboxSnapshot = { pending: 0, state: "idle" };
const RETRY_MS = 10_000;

/** Subscribes to sync status and keeps retrying pending writes while mounted. */
export function useOutbox(): OutboxSnapshot {
  const box = getOutbox();
  const snapshot = useSyncExternalStore(box.subscribe, box.getSnapshot, () => SERVER_SNAPSHOT);

  useEffect(() => {
    const flush = () => void box.flush();
    flush();
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", flush);
    const id = window.setInterval(() => {
      if (box.getSnapshot().pending > 0) flush();
    }, RETRY_MS);
    return () => {
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", flush);
      window.clearInterval(id);
    };
  }, [box]);

  return snapshot;
}
