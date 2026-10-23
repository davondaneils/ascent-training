import { expect, test, type Page } from "@playwright/test";
import { adminClient, setClock, testUserId } from "./support";

async function runAndSave(page: Page, rpe: string, packKg?: string) {
  await page.getByRole("button", { name: "Start session" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("PAUSED")).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
  await page.getByRole("button", { name: "End", exact: true }).click();
  await expect(page.getByRole("heading", { name: "How hard?" })).toBeVisible();
  await page.getByRole("radio", { name: rpe, exact: true }).click();
  if (packKg !== undefined) await page.getByLabel(/Pack weight/).fill(packKg);
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/today$/);
}

async function logFor(date: string) {
  const userId = await testUserId();
  return (await adminClient().from("cardio_logs").select("modality, target_minutes, actual_minutes, rpe, pack_weight_kg")
    .eq("user_id", userId).eq("scheduled_date", date).maybeSingle()).data;
}

test("cardio: bike session start, pause, finish, RPE, save, persists", async ({ page, context }) => {
  await setClock(context, "2026-09-29T18:00:00-04:00"); // Tuesday week 1: bike 20 min
  await page.goto("/today");
  await page.getByRole("link", { name: "Start Cardio" }).click();
  await page.waitForURL(/\/cardio\//);
  await expect(page.getByText("20 min")).toBeVisible();
  // Beginner modalities need no preflight.
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await runAndSave(page, "3");
  await expect.poll(() => logFor("2026-09-29")).toEqual({ modality: "bike", target_minutes: 20, actual_minutes: 0, rpe: 3, pack_weight_kg: null });
  await page.reload();
  await expect(page.getByText(/Done · 0 min · RPE 3/)).toBeVisible();
});

test("run/walk requires a readiness preflight and saves as run_walk", async ({ page, context }) => {
  await setClock(context, "2026-12-29T18:00:00-05:00"); // Year 1 · Cycle 2 Tuesday
  await page.goto("/today");
  await page.getByRole("link", { name: "Start Cardio" }).click();
  await page.waitForURL(/\/cardio\//);
  await expect(page.getByRole("radio", { name: /Easy run \/ walk/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("button", { name: "Confirm readiness or choose an alternative" })).toBeDisabled();
  await page.getByRole("checkbox").check();
  await runAndSave(page, "4");
  await expect.poll(() => logFor("2026-12-29")).toMatchObject({ modality: "run_walk", target_minutes: 22, rpe: 4 });
});

test("swim day offers a safe land alternative without the preflight", async ({ page, context }) => {
  await setClock(context, "2026-12-31T18:00:00-05:00"); // Cycle 2 Thursday: supervised swim
  await page.goto("/today");
  await page.getByRole("link", { name: "Start Cardio" }).click();
  await page.waitForURL(/\/cardio\//);
  await expect(page.getByText(/Safety preflight/)).toBeVisible();
  await page.getByRole("radio", { name: "Bike" }).click();
  await expect(page.getByText(/Safety preflight/)).toHaveCount(0);
  await runAndSave(page, "2");
  await expect.poll(() => logFor("2026-12-31")).toMatchObject({ modality: "bike", target_minutes: 25 });
});

test("loaded hike records its pack weight and charts it on Progress", async ({ page, context }) => {
  await setClock(context, "2027-10-02T09:00:00-04:00"); // Year 2 · Cycle 5 Saturday
  await page.goto("/today");
  await expect(page.getByText(/Progressive pack hike · 75 min/)).toBeVisible();
  await page.getByRole("link", { name: "Start Cardio" }).click();
  await page.waitForURL(/\/cardio\//);
  await page.getByRole("checkbox").check();
  await runAndSave(page, "3", "4.5");
  await expect.poll(() => logFor("2027-10-02")).toMatchObject({ modality: "loaded_hike", target_minutes: 75 });
  expect(Number((await logFor("2027-10-02"))?.pack_weight_kg)).toBe(4.5);
  await page.goto("/progress");
  await expect(page.getByText("Pack hike")).toBeVisible();
  await expect(page.getByText(/First load logged · latest 4\.5 kg/)).toBeVisible();
});

test("year 2 quality run: tempo notes, readiness preflight, and an easy alternative", async ({ page, context }) => {
  await setClock(context, "2028-06-27T18:00:00-04:00"); // Year 2 · Cycle 8, week 1 Tuesday
  await page.goto("/today");
  await page.getByRole("link", { name: "Start Cardio" }).click();
  await page.waitForURL(/\/cardio\//);
  await expect(page.getByRole("radio", { name: "Easy run", exact: true })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText(/2 × 3 min tempo/)).toBeVisible();
  await expect(page.getByText(/drop to easy running or walking/).first()).toBeVisible();
  await expect(page.getByText(/Target RPE 3–6/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm readiness or choose an alternative" })).toBeDisabled();
  // Choosing the easier alternative keeps the whole session easy.
  await page.getByRole("radio", { name: /Easy run \/ walk/ }).click();
  await expect(page.getByText(/Alternative chosen: keep the whole session easy/)).toBeVisible();
  await expect(page.getByText(/Target RPE 2–4/)).toBeVisible();
  await page.getByRole("radio", { name: "Easy run", exact: true }).click();
  await page.getByRole("checkbox").check();
  await runAndSave(page, "5");
  await expect.poll(() => logFor("2028-06-27")).toMatchObject({ modality: "run", target_minutes: 38, rpe: 5, pack_weight_kg: null });
});
