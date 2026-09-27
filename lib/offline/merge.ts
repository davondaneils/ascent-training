// Reconciles the server's view of a workout with the locally cached session after a reload.
// Local wins for anything it knows about (it may hold writes not yet synced); the server fills gaps
// (e.g. sets logged on another device). A server-side completion is final.

import type { SessionExercise, WorkoutSession } from "@/lib/training/session";

function mergeExercise(server: SessionExercise, local: SessionExercise | undefined): SessionExercise {
  if (!local) return server;
  const byId = new Map(server.sets.map((s) => [s.id, s]));
  for (const s of local.sets) byId.set(s.id, s);
  // One set per set number; prefer the local copy on a clash.
  const byNumber = new Map<number, (typeof local.sets)[number]>();
  for (const s of byId.values()) {
    const existing = byNumber.get(s.setNumber);
    const isLocal = local.sets.some((l) => l.id === s.id);
    if (!existing || isLocal) byNumber.set(s.setNumber, s);
  }
  const sets = [...byNumber.values()].sort((a, b) => a.setNumber - b.setNumber);
  return {
    ...server,
    actualOrder: local.actualOrder ?? server.actualOrder,
    sets,
    completedAt: sets.length >= server.targetSets ? (local.completedAt ?? server.completedAt) : null,
  };
}

export function mergeSession(server: WorkoutSession, local: WorkoutSession | null): WorkoutSession {
  if (!local || local.workoutId !== server.workoutId) return server;
  if (server.status !== "in_progress") return server;

  const exercises = server.exercises.map((e) =>
    mergeExercise(e, local.exercises.find((l) => l.id === e.id)),
  );
  const currentExists = exercises.some((e) => e.id === local.currentExerciseId);
  return {
    ...server,
    status: local.status,
    completedAt: local.completedAt,
    exercises,
    currentExerciseId: currentExists ? local.currentExerciseId : server.currentExerciseId,
    rest: local.rest,
  };
}
