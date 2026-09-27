import { describe, expect, it } from "vitest";
import {
  actualMinutes,
  cardioElapsedMs,
  cardioReducer,
  createCardioSession,
  type CardioAction,
  type CardioSession,
} from "@/lib/training/cardio";

const T0 = 1_760_000_000_000;
const MIN = 60_000;
const fresh = () => createCardioSession({ logId: "c1", date: "2026-10-19", modality: "bike", targetMinutes: 20 });
const run = (s: CardioSession, ...a: CardioAction[]) => a.reduce(cardioReducer, s);

describe("cardio session", () => {
  it("starts and derives elapsed time from timestamps", () => {
    const s = run(fresh(), { type: "start", now: T0 });
    expect(s.phase).toBe("running");
    // Screen off for 10 minutes: nothing ticked, still correct.
    expect(cardioElapsedMs(s, T0 + 10 * MIN)).toBe(10 * MIN);
  });

  it("pause excludes paused time", () => {
    const s = run(fresh(), { type: "start", now: T0 }, { type: "pause", now: T0 + 5 * MIN }, { type: "resume", now: T0 + 9 * MIN });
    expect(cardioElapsedMs(s, T0 + 12 * MIN)).toBe(8 * MIN);
  });

  it("finish freezes the time and asks for RPE", () => {
    const s = run(fresh(), { type: "start", now: T0 }, { type: "finish", now: T0 + 18 * MIN + 20_000 });
    expect(s.phase).toBe("rating");
    expect(cardioElapsedMs(s, T0 + 60 * MIN)).toBe(18 * MIN + 20_000);
    expect(actualMinutes(cardioElapsedMs(s, 0))).toBe(18);
  });

  it("finishing early from pause works", () => {
    const s = run(fresh(), { type: "start", now: T0 }, { type: "pause", now: T0 + 7 * MIN }, { type: "finish", now: T0 + 30 * MIN });
    expect(s.finalElapsedMs).toBe(7 * MIN);
  });

  it("back to timer after an accidental finish keeps the time, paused", () => {
    let s = run(fresh(), { type: "start", now: T0 }, { type: "finish", now: T0 + 5 * MIN }, { type: "back_to_timer", now: T0 + 6 * MIN });
    expect(s.phase).toBe("paused");
    s = run(s, { type: "resume", now: T0 + 8 * MIN });
    expect(cardioElapsedMs(s, T0 + 10 * MIN)).toBe(7 * MIN);
  });

  it("RPE must be 1–10 and is required to save", () => {
    let s = run(fresh(), { type: "start", now: T0 }, { type: "finish", now: T0 + MIN });
    expect(run(s, { type: "saved" }).phase).toBe("rating");
    expect(run(s, { type: "rate", rpe: 11 }).rpe).toBeNull();
    s = run(s, { type: "rate", rpe: 3 }, { type: "saved" });
    expect(s).toMatchObject({ phase: "saved", rpe: 3 });
  });

  it("modality can only change before starting", () => {
    const ready = run(fresh(), { type: "set_modality", modality: "incline_walk" });
    expect(ready.modality).toBe("incline_walk");
    const running = run(fresh(), { type: "start", now: T0 }, { type: "set_modality", modality: "incline_walk" });
    expect(running.modality).toBe("bike");
  });

  it("ignores out-of-order actions", () => {
    expect(run(fresh(), { type: "pause", now: T0 }).phase).toBe("ready");
    expect(run(fresh(), { type: "finish", now: T0 }).phase).toBe("ready");
  });

  it("rounds minutes to nearest", () => {
    expect(actualMinutes(29_000)).toBe(0);
    expect(actualMinutes(30_000)).toBe(1);
    expect(actualMinutes(20 * MIN + 29_000)).toBe(20);
    expect(actualMinutes(20 * MIN + 31_000)).toBe(21);
  });
});
