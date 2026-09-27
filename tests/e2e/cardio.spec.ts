import { expect, test } from "@playwright/test";
import { adminClient, setClock, testUserId } from "./support";

test("cardio: start, pause, finish, RPE, save, persists", async ({ page, context }) => {
  await setClock(context, "2026-09-30T18:00:00-04:00"); // Wednesday week 1: bike 20 min
  await page.goto("/today");
  await page.getByRole("link", { name: "Start Cardio" }).click();
  await expect(page.getByText("20 min")).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("PAUSED")).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
  await page.getByRole("button", { name: "End", exact: true }).click();
  await expect(page.getByRole("heading", { name: "How hard?" })).toBeVisible();
  await page.getByRole("radio", { name: "3", exact: true }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL(/\/today$/);

  const userId = await testUserId();
  await expect
    .poll(async () => (await adminClient().from("cardio_logs").select("modality, target_minutes, actual_minutes, rpe").eq("user_id", userId).eq("scheduled_date", "2026-09-30").maybeSingle()).data)
    .toEqual({ modality: "bike", target_minutes: 20, actual_minutes: 0, rpe: 3 });

  await page.reload();
  await expect(page.getByText(/Done · 0 min · RPE 3/)).toBeVisible();
});
