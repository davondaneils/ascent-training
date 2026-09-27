// Durable, ordered queue of workout writes. Every op is an idempotent upsert/update keyed by a
// client-generated id, so replaying after a failure or reload is safe.

export interface SetRow {
  id: string;
  user_id: string;
  workout_id: string;
  workout_exercise_id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  completed_at: string;
}

export interface CardioRow {
  id: string;
  user_id: string;
  program_block_id: string;
  week_number: number;
  scheduled_date: string;
  modality: "bike" | "incline_walk";
  target_minutes: number;
  actual_minutes: number;
  rpe: number;
  completed_at: string;
}

export interface ExercisePatch {
  actual_order?: number | null;
  status?: "pending" | "in_progress" | "completed";
  completed_at?: string | null;
}

export interface WorkoutPatch {
  status?: "in_progress" | "completed" | "abandoned";
  completed_at?: string | null;
}

export type OutboxOp =
  | { kind: "upsert_set"; row: SetRow }
  | { kind: "upsert_cardio"; row: CardioRow }
  | { kind: "update_exercise"; id: string; patch: ExercisePatch }
  | { kind: "update_workout"; id: string; patch: WorkoutPatch };

/** ok: done · retry: transient (network/5xx) · auth: needs sign-in · drop: permanent, discard. */
export type OpResult = "ok" | "retry" | "auth" | "drop";
export type Executor = (op: OutboxOp) => Promise<OpResult>;

export type SyncState = "idle" | "syncing" | "offline" | "auth";

export interface OutboxSnapshot {
  pending: number;
  state: SyncState;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function targetKey(op: OutboxOp): string {
  if (op.kind === "upsert_set") return `set:${op.row.id}`;
  if (op.kind === "upsert_cardio") return `cardio:${op.row.id}`;
  return `${op.kind}:${op.id}`;
}

/** Later writes to the same target replace (sets) or merge into (patches) earlier queued ones. */
export function coalesce(queue: OutboxOp[], op: OutboxOp): OutboxOp[] {
  const key = targetKey(op);
  const i = queue.findIndex((q) => targetKey(q) === key);
  if (i === -1) return [...queue, op];
  const prev = queue[i];
  const merged: OutboxOp =
    op.kind === "upsert_set" || op.kind === "upsert_cardio" || prev.kind === "upsert_set" || prev.kind === "upsert_cardio"
      ? op
      : ({ ...op, patch: { ...prev.patch, ...op.patch } } as OutboxOp);
  return [...queue.slice(0, i), merged, ...queue.slice(i + 1)];
}

export class Outbox {
  private queue: OutboxOp[];
  private state: SyncState = "idle";
  private flushing = false;
  private listeners = new Set<() => void>();
  private snapshot: OutboxSnapshot;

  constructor(
    private storage: KeyValueStorage,
    private key: string,
    private execute: Executor,
  ) {
    this.queue = this.load();
    this.snapshot = { pending: this.queue.length, state: this.state };
  }

  private load(): OutboxOp[] {
    try {
      const raw = this.storage.getItem(this.key);
      return raw ? (JSON.parse(raw) as OutboxOp[]) : [];
    } catch {
      return [];
    }
  }

  private persist() {
    try {
      if (this.queue.length === 0) this.storage.removeItem(this.key);
      else this.storage.setItem(this.key, JSON.stringify(this.queue));
    } catch {
      // Storage full or unavailable: the in-memory queue still syncs while the tab is open.
    }
  }

  private emit() {
    this.snapshot = { pending: this.queue.length, state: this.state };
    for (const l of this.listeners) l();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): OutboxSnapshot => this.snapshot;

  enqueue(op: OutboxOp) {
    this.queue = coalesce(this.queue, op);
    this.persist();
    this.emit();
  }

  /** Sends queued ops in order. Stops at the first op that can't go through yet. */
  async flush(): Promise<void> {
    if (this.flushing) return;
    this.flushing = true;
    try {
      while (this.queue.length > 0) {
        this.state = "syncing";
        this.emit();
        const op = this.queue[0];
        let result: OpResult;
        try {
          result = await this.execute(op);
        } catch {
          result = "retry";
        }
        if (result === "retry" || result === "auth") {
          this.state = result === "auth" ? "auth" : "offline";
          this.emit();
          return;
        }
        // ok or drop: remove it. Coalescing keeps position, so if the head is no longer `op`,
        // a newer write to the same target replaced it while in flight — send that next.
        if (this.queue[0] === op) this.queue = this.queue.slice(1);
        this.persist();
      }
      this.state = "idle";
      this.emit();
    } finally {
      this.flushing = false;
    }
  }
}
