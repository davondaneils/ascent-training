import { expect, test, type Page } from "@playwright/test";
import { adminClient, setClock, testUserId } from "./support";

async function runAndSave(page: Page, rpe: string) {
  await page.getByRole("button", { name: "Start session" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("PAUSED")).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
  await page.getByRole("button", { name: "End", exact: true }).click();
  await expect(page.getByRole("heading", { name: "How hard?" })).toBeVisible();
  await page.getByRole("radio", { name: rpe, exact: true }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/today$/);
}

async function logFor(date: string) {
  const userId = await testUserId();
  return (await adminClient().from("cardio_logs").select("modality, target_minutes, actual_minutes, rpe")
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
  await expect.poll(() => logFor("2026-09-29")).toEqual({ modality: "bike", target_minutes: 20, actual_minutes: 0, rpe: 3 });
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

test("loaded hike is accepted by the database", async ({ page, context }) => {
  await setClock(context, "2027-10-02T09:00:00-04:00"); // Year 2 · Cycle 5 Saturday
  await page.goto("/today");
  await expect(page.getByText(/Progressive pack hike · 75 min/)).toBeVisible();
  await page.getByRole("link", { name: "Start Cardio" }).click();
  await page.waitForURL(/\/cardio\//);
  await page.getByRole("checkbox").check();
  await runAndSave(page, "3");
  await expect.poll(() => logFor("2027-10-02")).toMatchObject({ modality: "loaded_hike", target_minutes: 75 });
});
