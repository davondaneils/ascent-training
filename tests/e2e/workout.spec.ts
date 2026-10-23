import { expect, test, type Page } from "@playwright/test";
import { adminClient, setClock, testUserId } from "./support";

test.describe.configure({ mode: "serial" });

async function setCount(workoutUrl: string): Promise<number> {
  const id = workoutUrl.split("/workout/")[1];
  const { count } = await adminClient().from("workout_sets").select("id", { count: "exact", head: true }).eq("workout_id", id);
  return count ?? 0;
}

async function logSet(page: Page, weight: string | null, reps: string) {
  if (weight !== null) await page.getByLabel(/^Weight/).fill(weight);
  await page.getByRole("group", { name: /Reps/ }).getByRole("button", { name: reps, exact: true }).click();
  await page.getByRole("button", { name: "Complete Set" }).click();
}

let firstWorkoutUrl = "";

test.describe("workout", () => {
  test("Strength A: start, log, rest, reload, overview, finish", async ({ page, context }) => {
    await setClock(context, "2026-09-28T09:00:00-04:00");
    await page.goto("/today");
    await page.getByRole("button", { name: "Start Workout" }).click();
    await page.waitForURL(/\/workout\//);
    const url = page.url();
    firstWorkoutUrl = url;

    // Full-body Strength A: bench, leg press, pull-up, row, timed carry.
    await expect(page.getByRole("heading", { name: "Barbell Bench Press" })).toBeVisible();
    await expect(page.getByText("1 / 5")).toBeVisible();
    await expect(page.getByText("3 × 5–8")).toBeVisible();
    await expect(page.getByText("Rest 3:00")).toBeVisible();
    await expect(page.getByLabel(/^Weight/)).toHaveAttribute("inputmode", "decimal");

    // Complete a set → saved + rest starts automatically.
    await logSet(page, "135", "8");
    await expect(page.getByRole("timer")).toBeVisible();
    await expect(page.getByText("Set 1 — 135 × 8")).toBeVisible();
    await expect.poll(() => setCount(url)).toBe(1);

    // +30 sec extends; Skip ends rest.
    const before = await page.getByRole("timer").textContent();
    await page.getByRole("button", { name: "+30 sec" }).click();
    const after = await page.getByRole("timer").textContent();
    const secs = (t: string | null) => { const [m, s] = (t ?? "0:0").split(":").map(Number); return m * 60 + s; };
    expect(secs(after) - secs(before)).toBeGreaterThanOrEqual(28);
    await page.getByRole("button", { name: "Skip" }).click();
    await expect(page.getByText(/Set 2\s*of 3/)).toBeVisible();

    // Reload keeps the completed set.
    await page.reload();
    await expect(page.getByText(/Set 2\s*of 3/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit set 1" })).toBeVisible();

    // Finish bench at the top of the range so next week progresses.
    for (let i = 0; i < 2; i++) {
      await logSet(page, null, "8");
      if (i < 1) await page.getByRole("button", { name: "Skip" }).click();
    }
    await expect(page.getByRole("heading", { name: "Barbell Bench Press complete" })).toBeVisible();
    await expect.poll(() => setCount(url)).toBe(3);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Skip" }).click();
    await expect(page.getByRole("heading", { name: "Leg Press" })).toBeVisible();

    // Overview lists all five, including the timed farmer's carry.
    await page.getByRole("button", { name: "Overview" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByText("3/3")).toBeVisible();
    await drawer.getByRole("button", { name: /Farmer's Carry/ }).click();
    await expect(page.getByRole("heading", { name: "Farmer's Carry" })).toBeVisible();
    await expect(page.getByText(/20 sec/).first()).toBeVisible();

    // The carry's load is optional and recorded per hand; the hold timer is unchanged.
    await expect(page.getByRole("button", { name: "Start 20 sec" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Complete Set" })).toBeEnabled();
    await page.getByLabel(/^Weight/).fill("30");
    await page.getByRole("button", { name: "Complete Set" }).click();
    await expect(page.getByText("Set 1 — 1 hold · 30 lb each")).toBeVisible();
    await expect.poll(() => setCount(url)).toBe(4);
    const carry = await adminClient().from("workout_sets").select("weight, reps, exercises!inner(slug)")
      .eq("workout_id", url.split("/workout/")[1]).eq("exercises.slug", "farmer-carry");
    expect(carry.data?.map((r) => [Number(r.weight), r.reps])).toEqual([[30, null]]);

    await page.getByRole("button", { name: "Overview" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Finish workout" }).click();
    await page.getByRole("button", { name: "Finish", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Workout complete" })).toBeVisible();

    const userId = await testUserId();
    await expect
      .poll(async () => (await adminClient().from("workouts").select("status").eq("user_id", userId).eq("scheduled_date", "2026-09-28").single()).data)
      .toMatchObject({ status: "completed" });
    await page.goto("/today");
    await expect(page.getByText("Workout complete")).toBeVisible();
    await page.goto("/progress");
    await expect(page.getByText(/First load logged · latest 30 lb/)).toBeVisible();
  });

  test("next week recommends +5 lb; sets logged offline sync on reconnect", async ({ page, context }) => {
    await setClock(context, "2026-10-05T09:00:00-04:00"); // Monday week 2
    await page.goto("/today");
    await page.getByRole("button", { name: "Start Workout" }).click();
    await page.waitForURL(/\/workout\//);
    const url = page.url();
    await expect(page.getByText("Up 5 lb — all sets reached 8")).toBeVisible();
    await expect(page.getByLabel(/^Weight/)).toHaveValue("140");
    await expect(page.getByText(/Previous\s*135×8 · 135×8 · 135×8/)).toBeVisible();

    // Offline: the set is accepted locally, then written when the connection returns.
    await context.setOffline(true);
    await logSet(page, null, "6");
    await expect(page.getByText("Set 1 — 140 × 6")).toBeVisible();
    await page.waitForTimeout(1500);
    expect(await setCount(url)).toBe(0);
    await context.setOffline(false);
    await expect.poll(() => setCount(url), { timeout: 30_000 }).toBe(1);
  });

  test("a past cycle's workout still opens with its original prescription", async ({ page, context }) => {
    await setClock(context, "2027-01-04T09:00:00-05:00"); // Year 1 · Cycle 2
    await page.goto(firstWorkoutUrl);
    await expect(page.getByRole("heading", { name: "Workout complete" })).toBeVisible();
    await expect(page.getByText("Barbell Bench Press")).toBeVisible();
    await expect(page.getByText(/135/).first()).toBeVisible();
  });
});
