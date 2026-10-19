import { expect, test } from "@playwright/test";
import { adminClient, setClock, testUserId } from "./support";

test.describe.configure({ mode: "serial" });

async function missions(date: string) {
  const userId = await testUserId();
  return (await adminClient().from("mission_logs").select("mission_id, status, evidence")
    .eq("user_id", userId).eq("scheduled_date", date).order("mission_id")).data ?? [];
}

test("daily missions: complete, persist, clear", async ({ page, context }) => {
  await setClock(context, "2026-09-28T09:00:00-04:00");
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "Today's missions" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark complete" })).toHaveCount(2);
  await page.getByRole("button", { name: "Mark complete" }).first().click();
  await expect(page.getByText("Recorded as met")).toBeVisible();
  await expect.poll(() => missions("2026-09-28")).toEqual([
    { mission_id: "scripture:2026-09-28", status: "completed", evidence: null },
  ]);
  await page.reload();
  await expect(page.getByText("Recorded as met")).toBeVisible();
  await page.getByRole("button", { name: "Clear result" }).click();
  await expect.poll(() => missions("2026-09-28")).toEqual([]);
});

test("week-13 crucible requires evidence and records needs-work", async ({ page, context }) => {
  await setClock(context, "2026-12-26T09:00:00-05:00"); // cycle 1, week 13 Saturday
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "Crucible: The First Response" })).toBeVisible();
  const notes = page.getByRole("textbox");
  await notes.fill("Too short");
  await page.getByRole("button", { name: "Needs work" }).click();
  await expect(page.getByText("Describe the assessment result in at least 15 characters.")).toBeVisible();
  await notes.fill("Kit complete; first-aid course not yet booked.");
  await page.getByRole("button", { name: "Needs work" }).click();
  await expect(page.getByText("Needs work, recorded for review")).toBeVisible();
  await expect.poll(() => missions("2026-12-26")).toEqual([
    { mission_id: "practice:2026-12-26", status: "needs_work", evidence: "Kit complete; first-aid course not yet booked." },
  ]);
});

test("capability benchmark: zero pull-up baseline saves and shows", async ({ page, context }) => {
  await setClock(context, "2026-10-03T09:00:00-04:00");
  await page.goto("/progress");
  await page.getByLabel("Test").selectOption({ label: "Strict pull-ups" });
  await page.getByLabel(/Result/).fill("0");
  await page.getByRole("button", { name: "Save assessment" }).click();
  await expect(page.getByRole("status")).toHaveText("Result recorded.");
  const userId = await testUserId();
  await expect.poll(async () => (await adminClient().from("capability_tests").select("test_key, value, tested_on").eq("user_id", userId)).data)
    .toEqual([{ test_key: "pullups_strict", value: 0, tested_on: "2026-10-03" }]);
  await page.reload();
  await expect(page.getByText("First measured result")).toBeVisible();
});

test("roadmap lists all 20 cycles", async ({ page, context }) => {
  await setClock(context, "2026-10-03T09:00:00-04:00");
  await page.goto("/campaign");
  await expect(page.getByText("The First Response").first()).toBeVisible();
  await expect(page.getByText("Final Crucible").first()).toBeVisible();
});
