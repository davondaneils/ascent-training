import { describe, expect, it } from "vitest";
import { mergeSession } from "@/lib/offline/merge";
import { opsForAction } from "@/lib/offline/session-ops";
import { classify } from "@/lib/offline/supabase-executor";
import {
  coalesce,
  Outbox,
  type KeyValueStorage,
  type OpResult,
  type OutboxOp,
  type SetRow,
} from "@/lib/offline/outbox";
import { createSession, sessionReducer, type WorkoutSession } from "@/lib/training/session";

class MemoryStorage implements KeyValueStorage {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

const row = (id: string, reps = 6): SetRow => ({
  id,
  user_id: "u",
  workout_id: "w",
  workout_exercise_id: "we",
  exercise_id: "e",
  set_number: 1,
  weight: 185,
  reps,
  completed_at: "2026-10-05T12:00:00Z",
});

const setOp = (id: string, reps = 6): OutboxOp => ({ kind: "upsert_set", row: row(id, reps) });

describe("outbox", () => {
  it("coalesces writes to the same target", () => {
    let q: OutboxOp[] = [];
    q = coalesce(q, setOp("a", 6));
    q = coalesce(q, { kind: "update_exercise", id: "x", patch: { actual_order: 1 } });
    q = coalesce(q, setOp("a", 5));
    q = coalesce(q, { kind: "update_exercise", id: "x", patch: { status: "completed" } });
    expect(q).toHaveLength(2);
    expect(q[0]).toMatchObject({ row: { reps: 5 } });
    expect(q[1]).toMatchObject({ patch: { actual_order: 1, status: "completed" } });
  });

  it("sends in order and empties storage when done", async () => {
    const storage = new MemoryStorage();
    const sent: string[] = [];
    const box = new Outbox(storage, "k", async (op) => {
      sent.push(op.kind === "upsert_set" ? op.row.id : op.id);
      return "ok";
    });
    box.enqueue(setOp("a"));
    box.enqueue(setOp("b"));
    expect(storage.getItem("k")).not.toBeNull();
    await box.flush();
    expect(sent).toEqual(["a", "b"]);
    expect(box.getSnapshot()).toEqual({ pending: 0, state: "idle" });
    expect(storage.getItem("k")).toBeNull();
  });

  it("keeps ops queued and survives a reload when the network fails", async () => {
    const storage = new MemoryStorage();
    let online = false;
    const exec = async (): Promise<OpResult> => (online ? "ok" : "retry");
    const box = new Outbox(storage, "k", exec);
    box.enqueue(setOp("a"));
    await box.flush();
    expect(box.getSnapshot()).toEqual({ pending: 1, state: "offline" });

    // "Reload": a new outbox reads the persisted queue.
    online = true;
    const reloaded = new Outbox(storage, "k", exec);
    expect(reloaded.getSnapshot().pending).toBe(1);
    await reloaded.flush();
    expect(reloaded.getSnapshot()).toEqual({ pending: 0, state: "idle" });
  });

  it("treats a thrown executor as transient", async () => {
    const box = new Outbox(new MemoryStorage(), "k", async () => {
      throw new TypeError("Failed to fetch");
    });
    box.enqueue(setOp("a"));
    await box.flush();
    expect(box.getSnapshot().state).toBe("offline");
  });

  it("stops on auth errors without dropping work", async () => {
    const box = new Outbox(new MemoryStorage(), "k", async () => "auth");
    box.enqueue(setOp("a"));
    await box.flush();
    expect(box.getSnapshot()).toEqual({ pending: 1, state: "auth" });
  });

  it("drops permanently failing ops and continues", async () => {
    const sent: string[] = [];
    const box = new Outbox(new MemoryStorage(), "k", async (op) => {
      const id = op.kind === "upsert_set" ? op.row.id : op.id;
      sent.push(id);
      return id === "bad" ? "drop" : "ok";
    });
    box.enqueue(setOp("bad"));
    box.enqueue(setOp("good"));
    await box.flush();
    expect(sent).toEqual(["bad", "good"]);
    expect(box.getSnapshot().pending).toBe(0);
  });

  it("an edit made while the original is in flight is still sent", async () => {
    const sent: number[] = [];
    const box: Outbox = new Outbox(new MemoryStorage(), "k", async (op) => {
      if (op.kind === "upsert_set") {
        sent.push(op.row.reps ?? 0);
        if (sent.length === 1) box.enqueue(setOp("a", 4)); // user edits during the request
      }
      return "ok";
    });
    box.enqueue(setOp("a", 6));
    await box.flush();
    expect(sent).toEqual([6, 4]);
    expect(box.getSnapshot().pending).toBe(0);
  });

  it("ignores corrupt storage", () => {
    const storage = new MemoryStorage();
    storage.setItem("k", "{not json");
    expect(new Outbox(storage, "k", async () => "ok").getSnapshot().pending).toBe(0);
  });
});

describe("mergeSession", () => {
  const T0 = 1_760_000_000_000;
  const base = (): WorkoutSession =>
    createSession({
      workoutId: "w",
      now: T0,
      exercises: [
        { id: "a", prescriptionKey: "a", exerciseSlug: "a", targetSets: 2, restSeconds: 60 },
        { id: "b", prescriptionKey: "b", exerciseSlug: "b", targetSets: 2, restSeconds: 60 },
      ],
    });

  it("keeps unsynced local sets, cursor and rest timer after reload", () => {
    const server = base();
    const local = [
      { type: "complete_set" as const, setId: "s1", weight: 100, reps: 8, now: T0 + 1 },
      { type: "complete_set" as const, setId: "s2", weight: 100, reps: 8, now: T0 + 2 },
      { type: "continue" as const },
    ].reduce(sessionReducer, base());
    const merged = mergeSession(server, local);
    expect(merged.exercises[0].sets.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(merged.exercises[0].completedAt).toBe(T0 + 2);
    expect(merged.currentExerciseId).toBe("b");
    expect(merged.rest).toEqual(local.rest);
  });

  it("adds sets the server has that the local copy doesn't", () => {
    const server = sessionReducer(base(), { type: "complete_set", setId: "remote", weight: 100, reps: 8, now: T0 });
    const merged = mergeSession(server, base());
    expect(merged.exercises[0].sets.map((s) => s.id)).toEqual(["remote"]);
  });

  it("local edits win over the server copy of the same set", () => {
    const server = sessionReducer(base(), { type: "complete_set", setId: "s1", weight: 815, reps: 8, now: T0 });
    const local = sessionReducer(server, { type: "edit_set", setId: "s1", weight: 185, reps: 8 });
    expect(mergeSession(server, local).exercises[0].sets[0].weight).toBe(185);
  });

  it("a server-side completion is final", () => {
    const server = { ...base(), status: "completed" as const, completedAt: T0 + 5 };
    expect(mergeSession(server, base()).status).toBe("completed");
  });

  it("ignores a snapshot from another workout", () => {
    const other = { ...base(), workoutId: "other", currentExerciseId: "b" };
    expect(mergeSession(base(), other).currentExerciseId).toBe("a");
  });
});

describe("classify", () => {
  it("maps PostgREST outcomes", () => {
    expect(classify(null, 201)).toBe("ok");
    expect(classify({ message: "TypeError: Failed to fetch", code: "" }, 0)).toBe("retry");
    expect(classify({ code: "42501", message: "permission denied" }, 403)).toBe("auth");
    expect(classify({ code: "PGRST301", message: "JWT expired" }, 401)).toBe("auth");
    expect(classify({ code: "", message: "Bad gateway" }, 502)).toBe("retry");
    expect(classify({ code: "23505", message: "duplicate" }, 409)).toBe("drop");
  });
});

describe("opsForAction", () => {
  const T0 = 1_760_000_000_000;
  const ctx = { userId: "u1", exerciseIdBySlug: { bench: "ex-bench" } };
  const start = () =>
    createSession({
      workoutId: "w1",
      now: T0,
      exercises: [{ id: "we1", prescriptionKey: "k", exerciseSlug: "bench", targetSets: 1, restSeconds: 180 }],
    });

  it("completing a set writes the set and the exercise state", () => {
    const prev = start();
    const action = { type: "complete_set" as const, setId: "s1", weight: 185, reps: 6, now: T0 };
    const ops = opsForAction(prev, sessionReducer(prev, action), action, ctx);
    expect(ops).toEqual([
      {
        kind: "upsert_set",
        row: {
          id: "s1", user_id: "u1", workout_id: "w1", workout_exercise_id: "we1", exercise_id: "ex-bench",
          set_number: 1, weight: 185, reps: 6, completed_at: new Date(T0).toISOString(),
        },
      },
      { kind: "update_exercise", id: "we1", patch: { actual_order: 1, status: "completed", completed_at: new Date(T0).toISOString() } },
    ]);
  });

  it("finish stores the completion time", () => {
    const prev = start();
    const action = { type: "finish" as const, now: T0 + 60_000 };
    expect(opsForAction(prev, sessionReducer(prev, action), action, ctx)).toEqual([
      { kind: "update_workout", id: "w1", patch: { status: "completed", completed_at: new Date(T0 + 60_000).toISOString() } },
    ]);
  });

  it("rest and navigation don't write", () => {
    const prev = start();
    const action = { type: "jump" as const, exerciseId: "we1" };
    expect(opsForAction(prev, sessionReducer(prev, action), action, ctx)).toEqual([]);
  });
});
