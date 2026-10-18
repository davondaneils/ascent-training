"use server";

import { revalidatePath } from "next/cache";
import { serverNow } from "@/lib/clock";
import { getBenchmark } from "@/lib/campaign/benchmarks";
import { toLocalDate } from "@/lib/dates";
import { getAppContext } from "@/lib/data/context";

export async function recordCapabilityTest(input: { key: string; value: number }): Promise<void> {
  const test = getBenchmark(input.key);
  if (!test || !Number.isFinite(input.value) || input.value <= 0 || input.value > test.max)
    throw new Error("Enter a valid measured result for the selected test.");
  if (test.key === "pullups_strict" && !Number.isInteger(input.value))
    throw new Error("Pull-up count must be a whole number.");
  const { user, supabase, enrollment } = await getAppContext();
  if (!enrollment) throw new Error("Training enrollment not found.");
  const date = toLocalDate(await serverNow());
  if (date < enrollment.startDate) throw new Error("The program has not started.");
  const { error } = await supabase.from("capability_tests").insert({
    user_id: user.id, tested_on: date, test_key: test.key, value: input.value,
  });
  if (error) throw new Error("Could not record the test.");
  revalidatePath("/progress");
}
