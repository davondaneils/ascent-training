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

test.describe("workout", () => {
  test("start, log, rest, reload, overview, finish", async ({ page, context }) => {
    await setClock(context, "2026-09-28T09:00:00-04:00");
    await page.goto("/today");
    await page.getByRole("button", { name: "Start Workout" }).click();
    await page.waitForURL(/\/workout\//);
    const url = page.url();

    // Focused first exercise with correct prescription.
    await expect(page.getByRole("heading", { name: "Barbell Bench Press" })).toBeVisible();
    await expect(page.getByText("1 / 7")).toBeVisible();
    await expect(page.getByText("4 × 4–6")).toBeVisible();
    await expect(page.getByText("Rest 3:00")).toBeVisible();
    await expect(page.getByText("First session")).toBeVisible();
    await expect(page.getByRole("button", { name: /demonstration/ })).toBeVisible();
    await expect(page.getByLabel(/^Weight/)).toHaveAttribute("inputmode", "decimal");

    // Complete a set → saved + rest starts automatically.
    await logSet(page, "135", "6");
    await expect(page.getByRole("timer")).toBeVisible();
    await expect(page.getByText("Set 1 — 135 × 6")).toBeVisible();
    await expect.poll(() => setCount(url)).toBe(1);

    // +30 sec extends; Skip ends rest.
    const before = await page.getByRole("timer").textContent();
    await page.getByRole("button", { name: "+30 sec" }).click();
    const after = await page.getByRole("timer").textContent();
    const secs = (t: string | null) => { const [m, s] = (t ?? "0:0").split(":").map(Number); return m * 60 + s; };
    expect(secs(after) - secs(before)).toBeGreaterThanOrEqual(28);
    await page.getByRole("button", { name: "Skip" }).click();
    await expect(page.getByText(/Set 2\s*of 4/)).toBeVisible();

    // Reload keeps the completed set.
    await page.reload();
    await expect(page.getByText(/Set 2\s*of 4/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit set 1" })).toBeVisible();

    // Finish bench (135 × 6 ×4 so next week progresses).
    for (let i = 0; i < 3; i++) {
      await logSet(page, null, "6");
      if (i < 2) await page.getByRole("button", { name: "Skip" }).click();
    }
    await expect(page.getByRole("heading", { name: "Barbell Bench Press complete" })).toBeVisible();
    await expect.poll(() => setCount(url)).toBe(4);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Pull-Up / Assisted Pull-Up" })).toBeVisible();

    // Overview lists all 7 and can jump without losing work.
    await page.getByRole("button", { name: "Overview" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByText("4/4")).toBeVisible();
    await drawer.getByRole("button", { name: /Lateral Raise/ }).click();
    await expect(page.getByRole("heading", { name: "Lateral Raise" })).toBeVisible();
    await page.getByRole("button", { name: "Overview" }).click();
    await expect(page.getByRole("dialog").getByText("4/4")).toBeVisible();

    // Finish early from Overview.
    await page.getByRole("dialog").getByRole("button", { name: "Finish workout" }).click();
    await page.getByRole("button", { name: "Finish", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Workout complete" })).toBeVisible();

    // Stored with completion time; reload still shows completed.
    const userId = await testUserId();
    await expect
      .poll(async () => (await adminClient().from("workouts").select("status, completed_at").eq("user_id", userId).eq("scheduled_date", "2026-09-28").single()).data)
      .toMatchObject({ status: "completed" });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Workout complete" })).toBeVisible();
    await page.goto("/today");
    await expect(page.getByText("Workout complete")).toBeVisible();
  });

  test("next week recommends +5 lb after 6/6/6/6", async ({ page, context }) => {
    await setClock(context, "2026-10-05T09:00:00-04:00"); // Monday week 2
    await page.goto("/today");
    await page.getByRole("button", { name: "Start Workout" }).click();
    await page.waitForURL(/\/workout\//);
    await expect(page.getByText("Up 5 lb — all sets reached 6")).toBeVisible();
    await expect(page.getByLabel(/^Weight/)).toHaveValue("140");
    await expect(page.getByText(/Previous\s*135×6 · 135×6 · 135×6 · 135×6/)).toBeVisible();
  });
});
