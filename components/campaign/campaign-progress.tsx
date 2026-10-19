"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BENCHMARKS, isValidBenchmarkValue, type BenchmarkKey } from "@/lib/campaign/benchmarks";
import type { CampaignPosition } from "@/lib/campaign/schedule";
import type { CapabilityTest } from "@/lib/data/campaign";
import { recordCapabilityTest } from "@/app/(app)/(enrolled)/(tabs)/progress/actions";

function measuredChange(current: CapabilityTest, previous: CapabilityTest | undefined, better: string) {
  if (!previous) return "First measured result";
  const difference = Number((current.value - previous.value).toFixed(2));
  if (difference === 0) return "No change";
  const improved = better === "lower" ? difference < 0 : difference > 0;
  const sign = difference > 0 ? "+" : "";
  return `${sign}${difference} since previous · ${improved ? "Improved" : "Below previous"}`;
}

export function CampaignProgress({ position, completedThisWeek, scheduledThisWeek, needsWork, tests }: {
  position: CampaignPosition;
  completedThisWeek: number;
  scheduledThisWeek: number;
  needsWork: number;
  tests: CapabilityTest[];
}) {
  const [key, setKey] = useState<BenchmarkKey>("run_5k_minutes");
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const selected = BENCHMARKS.find((test) => test.key === key)!;
  const canRecord = position.status !== "before_start" && !pending &&
    value.trim() !== "" && isValidBenchmarkValue(key, Number(value));

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRecord) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await recordCapabilityTest({ key, value: Number(value) });
        if (result.error) {
          setError(result.error);
          return;
        }
        setSuccess("Result recorded.");
        setValue("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save result.");
      }
    });
  }

  return (
    <section className="flex flex-col gap-5 pt-2" aria-label="Campaign capability">
      <div className="flex flex-col gap-2">
        <p className="type-meta text-text-tertiary">FIVE YEARS TO PREPARE · YEAR {position.year} OF 5</p>
        <h1 className="type-title">Progress</h1>
        <p className="type-body text-text-secondary">
          Real performance, demonstrated competence, and service. No invented readiness score.
        </p>
        <Link href="/campaign" className="w-fit text-[14px] font-medium text-accent underline-offset-4 hover:underline">
          See the 20-cycle roadmap →
        </Link>
      </div>
      <div className="rounded-[20px] border border-border-subtle bg-surface p-4">
        <h3 className="type-subheading">Mission execution</h3>
        <p className="pt-2 type-heading tabular-nums">{completedThisWeek} <span className="text-text-tertiary">/ {scheduledThisWeek}</span></p>
        <p className="type-meta font-normal text-text-secondary">Assignments recorded complete this week to date</p>
        {needsWork > 0 && (
          <p className="pt-2 text-[14px] text-text-secondary">
            {needsWork} assessment{needsWork === 1 ? "" : "s"} marked needs work. Review and practice again.
          </p>
        )}
        <p className="pt-3 text-[13px] text-text-tertiary">
          Missing assignments are not failures of character. Use them to find constraints and improve the plan.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="type-heading">Capability benchmarks</h3>
        <div className="divide-y divide-border-subtle overflow-hidden rounded-[20px] border border-border-subtle bg-surface">
          {BENCHMARKS.map((benchmark) => {
            const results = tests.filter((r) => r.key === benchmark.key);
            return (
              <div key={benchmark.key} className="flex flex-col gap-1 p-4">
                <p className="type-meta text-text-tertiary">{benchmark.label}</p>
                {results[0] ? (
                  <>
                    <p className="type-heading tabular-nums">{results[0].value} <span className="type-meta font-normal text-text-secondary">{benchmark.unit}</span></p>
                    <p className="text-[13px] text-text-secondary">{measuredChange(results[0], results[1], benchmark.better)}</p>
                    <p className="text-[12px] text-text-tertiary">Measured {results[0].date}</p>
                  </>
                ) : (
                  <p className="text-[14px] text-text-secondary">No measurement yet.</p>
                )}
              </div>
            );
          })}
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3 rounded-[20px] border border-border-subtle bg-surface p-4">
          <h4 className="type-subheading">Record an observed result</h4>
          <label className="flex flex-col gap-1 text-[14px] text-text-secondary">
            Test
            <select value={key} onChange={(event) => { setKey(event.target.value as BenchmarkKey); setValue(""); setError(null); setSuccess(null); }}
              className="min-h-12 w-full rounded-[12px] border border-border-subtle bg-background px-3 text-[15px] text-text-primary">
              {BENCHMARKS.map((test) => <option key={test.key} value={test.key}>{test.label}</option>)}
            </select>
          </label>
          <p className="text-[13px] text-text-secondary">{selected.description}</p>
          <label className="flex flex-col gap-1 text-[14px] text-text-secondary">
            Result ({selected.unit})
            <input value={value} onChange={(event) => setValue(event.target.value)}
              type="number" min={key === "pullups_strict" ? 0 : 0.01}
              step={key === "pullups_strict" ? "1" : "any"} max={selected.max}
              inputMode="decimal" required
              className="min-h-12 rounded-[12px] border border-border-subtle bg-background px-3 text-[16px] text-text-primary" />
          </label>
          <button type="submit" disabled={!canRecord}
            className="min-h-12 rounded-[12px] bg-accent px-4 text-[15px] font-medium text-accent-foreground disabled:opacity-50">
            {pending ? "Saving…" : "Save assessment"}
          </button>
          {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
          {success && <p role="status" className="text-[14px] text-success">{success}</p>}
          <p className="text-[12px] leading-relaxed text-text-tertiary">
            Train progressively and record only actual, safely completed tests. Use qualified instructors for swimming and first-aid skills.
          </p>
        </form>
      </div>
    </section>
  );
}
