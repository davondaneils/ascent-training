"use server";

import { revalidatePath } from "next/cache";
import { serverNow } from "@/lib/clock";
import { getBenchmark, isValidBenchmarkValue } from "@/lib/campaign/benchmarks";
import { toLocalDate } from "@/lib/dates";
import { getAppContext } from "@/lib/data/context";

export async function recordCapabilityTest(input: { key: string; value: number }): Promise<{ error?: string }> {
  const test = getBenchmark(input.key);
  if (!test || !isValidBenchmarkValue(input.key, input.value))
    return { error: "Enter a valid measured result for the selected test." };
  const { user, supabase, enrollment } = await getAppContext();
  if (!enrollment) return { error: "Training enrollment not found." };
  const date = toLocalDate(await serverNow());
  if (date < enrollment.startDate) return { error: "The program has not started." };
  const { error } = await supabase.from("capability_tests").insert({
    user_id: user.id, tested_on: date, test_key: test.key, value: input.value,
  });
  if (error) return { error: "Could not record the test." };
  revalidatePath("/progress");
  return {};
}
