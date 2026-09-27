// Which database writes a session action produces. Pure: prev/next state in, outbox ops out.

import type { SessionAction, WorkoutSession } from "@/lib/training/session";
import type { OutboxOp } from "./outbox";

export interface OpsContext {
  userId: string;
  exerciseIdBySlug: Record<string, string>;
}

const iso = (ms: number) => new Date(ms).toISOString();

export function opsForAction(
  prev: WorkoutSession,
  next: WorkoutSession,
  action: SessionAction,
  ctx: OpsContext,
): OutboxOp[] {
  if (prev === next) return [];

  switch (action.type) {
    case "complete_set":
    case "edit_set": {
      const ex = next.exercises.find((e) => e.sets.some((s) => s.id === action.setId));
      const set = ex?.sets.find((s) => s.id === action.setId);
      if (!ex || !set) return [];
      const ops: OutboxOp[] = [
        {
          kind: "upsert_set",
          row: {
            id: set.id,
            user_id: ctx.userId,
            workout_id: next.workoutId,
            workout_exercise_id: ex.id,
            exercise_id: ctx.exerciseIdBySlug[ex.exerciseSlug],
            set_number: set.setNumber,
            weight: set.weight,
            reps: set.reps,
            completed_at: iso(set.completedAt),
          },
        },
      ];
      if (action.type === "complete_set") {
        const done = ex.sets.length >= ex.targetSets;
        ops.push({
          kind: "update_exercise",
          id: ex.id,
          patch: {
            actual_order: ex.actualOrder,
            status: done ? "completed" : "in_progress",
            completed_at: ex.completedAt ? iso(ex.completedAt) : null,
          },
        });
      }
      return ops;
    }
    case "finish":
      return [{ kind: "update_workout", id: next.workoutId, patch: { status: "completed", completed_at: iso(action.now) } }];
    case "abandon":
      return [{ kind: "update_workout", id: next.workoutId, patch: { status: "abandoned", completed_at: null } }];
    default:
      // Rest, continue and jump are local-only UI state.
      return [];
  }
}
