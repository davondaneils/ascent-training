import { describe, expect, it } from "vitest";
import {
  elapsedMs,
  extendRest,
  formatClock,
  isRestComplete,
  pauseStopwatch,
  remainingMs,
  restProgress,
  resumeStopwatch,
  skipRest,
  startRest,
  startStopwatch,
} from "@/lib/training/rest-timer";

const T0 = 1_760_000_000_000;

describe("rest timer", () => {
  it("stores an absolute end timestamp", () => {
    expect(startRest(T0, 180)).toEqual({ startedAt: T0, endsAt: T0 + 180_000 });
  });

  it("derives remaining time from now, so backgrounding doesn't drift", () => {
    const t = startRest(T0, 180);
    expect(remainingMs(t, T0 + 1_000)).toBe(179_000);
    // Tab frozen for 2 minutes: nothing ticked, but the answer is still right.
    expect(remainingMs(t, T0 + 120_000)).toBe(60_000);
  });

  it("returning after it elapsed shows rest complete", () => {
    const t = startRest(T0, 180);
    expect(isRestComplete(t, T0 + 179_999)).toBe(false);
    expect(isRestComplete(t, T0 + 600_000)).toBe(true);
    expect(remainingMs(t, T0 + 600_000)).toBe(0);
  });

  it("+30 sec extends a running timer", () => {
    const t = extendRest(startRest(T0, 180), T0 + 10_000);
    expect(t.endsAt).toBe(T0 + 210_000);
    expect(remainingMs(t, T0 + 10_000)).toBe(200_000);
  });

  it("+30 sec after rest ended gives 30 s from now", () => {
    const t = extendRest(startRest(T0, 60), T0 + 90_000);
    expect(remainingMs(t, T0 + 90_000)).toBe(30_000);
  });

  it("skip ends rest immediately", () => {
    const t = skipRest(startRest(T0, 180), T0 + 5_000);
    expect(isRestComplete(t, T0 + 5_000)).toBe(true);
    expect(remainingMs(t, T0 + 5_000)).toBe(0);
  });

  it("progress goes 0 → 1", () => {
    const t = startRest(T0, 100);
    expect(restProgress(t, T0)).toBe(0);
    expect(restProgress(t, T0 + 50_000)).toBe(0.5);
    expect(restProgress(t, T0 + 500_000)).toBe(1);
  });
});

describe("stopwatch", () => {
  it("accumulates across pause and resume", () => {
    let sw = startStopwatch(T0);
    expect(elapsedMs(sw, T0 + 60_000)).toBe(60_000);
    sw = pauseStopwatch(sw, T0 + 60_000);
    expect(elapsedMs(sw, T0 + 600_000)).toBe(60_000); // paused time doesn't count
    sw = resumeStopwatch(sw, T0 + 600_000);
    expect(elapsedMs(sw, T0 + 630_000)).toBe(90_000);
  });

  it("pause and resume are idempotent", () => {
    const sw = pauseStopwatch(startStopwatch(T0), T0 + 1_000);
    expect(pauseStopwatch(sw, T0 + 5_000)).toBe(sw);
    const running = startStopwatch(T0);
    expect(resumeStopwatch(running, T0 + 5_000)).toBe(running);
  });
});

describe("formatClock", () => {
  it("rounds up to whole seconds", () => {
    expect(formatClock(180_000)).toBe("3:00");
    expect(formatClock(179_001)).toBe("3:00");
    expect(formatClock(179_000)).toBe("2:59");
    expect(formatClock(200)).toBe("0:01");
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(-5)).toBe("0:00");
  });
});
