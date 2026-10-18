"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, Circle, AlertCircle } from "lucide-react";
import type { Mission, MissionLog, MissionOutcome } from "@/lib/campaign/schedule";
import { recordMission } from "@/app/(app)/(enrolled)/(tabs)/campaign/actions";

export function MissionChecklist({ missions, initialLogs }: {
  missions: Mission[]; initialLogs: MissionLog[];
}) {
  const [logs, setLogs] = useState<MissionLog[]>(initialLogs);
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(mission: Mission, status: MissionOutcome | "remove") {
    setError(null);
    startTransition(async () => {
      try {
        const note = evidence[mission.id] ?? logs.find((x) => x.missionId === mission.id)?.evidence ?? "";
        await recordMission({ date: mission.date, missionId: mission.id, status, evidence: note });
        setLogs((prev) => status === "remove"
          ? prev.filter((x) => x.missionId !== mission.id)
          : [...prev.filter((x) => x.missionId !== mission.id), { missionId: mission.id, status, evidence: note }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save. Try again when connected.");
      }
    });
  }

  if (missions.length === 0) return null;

  return (
    <section className="flex flex-col gap-4" aria-label="Today's missions">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="type-heading">Today's missions</h2>
        <p className="type-meta font-normal text-text-secondary">Complete the work, not just the checkbox.</p>
      </div>
      <div className="divide-y divide-border-subtle rounded-[20px] border border-border-subtle bg-surface">
        {missions.map((mission) => {
          const log = logs.find((x) => x.missionId === mission.id);
          return (
            <article className="flex flex-col gap-3 p-4" key={mission.id}>
              <div className="flex items-start gap-3">
                {log?.status === "completed" ? <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> :
                  log?.status === "needs_work" ? <AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden /> :
                    <Circle className="mt-0.5 size-5 shrink-0 text-text-tertiary" aria-hidden />}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="type-meta text-text-tertiary">{mission.domain.toUpperCase()} · ~{mission.minutes} MIN</p>
                  <h3 className="type-subheading">{mission.title}</h3>
                  <p className="type-body text-text-secondary">{mission.instructions}</p>
                </div>
              </div>
              <div className="ml-8 flex flex-col gap-3">
                <p className="text-[13px] leading-relaxed text-text-secondary">
                  <span className="font-medium text-text-primary">Standard:</span> {mission.success}
                </p>
                <details className="text-[13px] text-text-secondary">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-accent">
                    <ChevronDown className="size-3.5" aria-hidden /> Why it matters
                  </summary>
                  <p className="pt-2 leading-relaxed">{mission.stakes}</p>
                </details>
                {mission.requiresEvidence && (
                  <label className="flex flex-col gap-2 text-[13px] text-text-secondary">
                    What happened? Record observable evidence.
                    <textarea
                      value={evidence[mission.id] ?? log?.evidence ?? ""}
                      onChange={(event) => setEvidence((prev) => ({ ...prev, [mission.id]: event.target.value }))}
                      maxLength={2000} rows={3} placeholder="What did you demonstrate? What failed? What will you improve?"
                      className="w-full resize-y rounded-[12px] border border-border-subtle bg-background p-3 text-[15px] text-text-primary"
                    />
                  </label>
                )}
                {log && <p className="type-meta font-normal text-text-secondary">
                  {log.status === "completed" ? "Recorded as met" : "Needs work, recorded for review"}
                </p>}
                <div className="flex flex-wrap gap-2">
                  {mission.requiresEvidence ? (
                    <>
                      <button type="button" disabled={pending} onClick={() => submit(mission, "completed")}
                        className="min-h-11 rounded-[12px] bg-accent px-4 text-[14px] font-medium text-white disabled:opacity-50">
                        Met standard
                      </button>
                      <button type="button" disabled={pending} onClick={() => submit(mission, "needs_work")}
                        className="min-h-11 rounded-[12px] border border-border-subtle px-4 text-[14px] font-medium disabled:opacity-50">
                        Needs work
                      </button>
                    </>
                  ) : !log ? (
                    <button type="button" disabled={pending} onClick={() => submit(mission, "completed")}
                      className="min-h-11 rounded-[12px] bg-accent px-4 text-[14px] font-medium text-white disabled:opacity-50">
                      Mark complete
                    </button>
                  ) : null}
                  {log && (
                    <button type="button" disabled={pending} onClick={() => submit(mission, "remove")}
                      className="min-h-11 rounded-[12px] px-3 text-[14px] font-medium text-text-secondary underline-offset-2 hover:underline disabled:opacity-50">
                      Clear result
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {error && <p role="alert" className="px-1 text-[14px] text-danger">{error}</p>}
    </section>
  );
}
