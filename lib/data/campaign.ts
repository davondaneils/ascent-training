import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocalDate } from "@/lib/training/types";
import type { MissionLog, MissionOutcome } from "@/lib/campaign/schedule";
import type { BenchmarkKey } from "@/lib/campaign/benchmarks";

interface MissionRow { mission_id: string; status: MissionOutcome; evidence: string | null }
export async function getMissionLogsForDate(
  supabase: SupabaseClient, userId: string, date: LocalDate,
): Promise<MissionLog[]> {
  const { data, error } = await supabase.from("mission_logs")
    .select("mission_id, status, evidence").eq("user_id", userId)
    .eq("scheduled_date", date).returns<MissionRow[]>();
  if (error) throw new Error("Loading missions failed: " + error.message);
  return (data ?? []).map((r) => ({ missionId: r.mission_id, status: r.status, evidence: r.evidence }));
}

export async function getMissionLogsForRange(
  supabase: SupabaseClient, userId: string, from: LocalDate, to: LocalDate,
): Promise<{ date: LocalDate; missionId: string; status: MissionOutcome }[]> {
  const { data, error } = await supabase.from("mission_logs")
    .select("scheduled_date, mission_id, status").eq("user_id", userId)
    .gte("scheduled_date", from).lte("scheduled_date", to)
    .returns<{ scheduled_date: LocalDate; mission_id: string; status: MissionOutcome }[]>();
  if (error) throw new Error("Loading mission history failed: " + error.message);
  return (data ?? []).map((r) => ({ date: r.scheduled_date, missionId: r.mission_id, status: r.status }));
}

export interface CapabilityTest {
  id: string;
  key: BenchmarkKey;
  value: number;
  date: LocalDate;
}
export async function getCapabilityTests(
  supabase: SupabaseClient, userId: string,
): Promise<CapabilityTest[]> {
  const { data, error } = await supabase.from("capability_tests")
    .select("id, test_key, value, tested_on").eq("user_id", userId)
    .order("tested_on", { ascending: false }).order("created_at", { ascending: false })
    .limit(250)
    .returns<{ id: string; test_key: BenchmarkKey; value: number | string; tested_on: LocalDate }[]>();
  if (error) throw new Error("Loading capability tests failed: " + error.message);
  return (data ?? []).map((r) => ({ id: r.id, key: r.test_key, value: Number(r.value), date: r.tested_on }));
}
