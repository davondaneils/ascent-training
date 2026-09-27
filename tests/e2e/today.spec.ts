import { expect, test } from "@playwright/test";
import { setClock } from "./support";

const days: [string, string, string][] = [
  ["2026-09-28", "Monday", "Upper Strength"],
  ["2026-09-29", "Tuesday", "Lower Strength + Movement"],
  ["2026-09-30", "Wednesday", "Upper Hypertrophy"],
  ["2026-10-01", "Thursday", "Lower Hypertrophy"],
  ["2026-10-02", "Friday", "Upper Specialization"],
];

test.describe("Today", () => {
  for (const [date, weekday, name] of days) {
    test(`${weekday} shows ${name}`, async ({ page, context }) => {
      await setClock(context, `${date}T09:00:00-04:00`);
      await page.goto("/today");
      await expect(page.getByRole("heading", { name: weekday })).toBeVisible();
      await expect(page.getByText("Week 1 of 12")).toBeVisible();
      await expect(page.getByRole("heading", { name })).toBeVisible();
      await expect(page.getByRole("button", { name: /Start Workout|Resume Workout/ })).toBeVisible();
    });
  }

  test("Saturday shows aerobic + mobility, no lifting", async ({ page, context }) => {
    await setClock(context, "2026-10-03T09:00:00-04:00");
    await page.goto("/today");
    await expect(page.getByText("Bike · 30 min")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Checklist" })).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(8);
    await expect(page.getByRole("button", { name: /Start Workout/ })).toHaveCount(0);
  });

  test("Sunday is Rest · Fast with no training CTA", async ({ page, context }) => {
    await setClock(context, "2026-10-04T09:00:00-04:00");
    await page.goto("/today");
    await expect(page.getByRole("heading", { name: "Rest · Fast" })).toBeVisible();
    await expect(page.getByText("No training today.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Start/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Start/ })).toHaveCount(0);
  });

  test("PM cardio appears only on the right weeks/days", async ({ page, context }) => {
    // Tuesday cardio starts week 3; Thursday week 5.
    await setClock(context, "2026-09-29T09:00:00-04:00"); // Tue week 1
    await page.goto("/today");
    await expect(page.getByText("Later today")).toHaveCount(0);
    await setClock(context, "2026-10-13T09:00:00-04:00"); // Tue week 3
    await page.goto("/today");
    await expect(page.getByText("Later today")).toBeVisible();
    await expect(page.getByText("Bike · 15 min")).toBeVisible();
    await setClock(context, "2026-10-15T09:00:00-04:00"); // Thu week 3
    await page.goto("/today");
    await expect(page.getByText("Later today")).toHaveCount(0);
  });

  test("Plan shows 12 weeks, current highlighted, read-only day detail", async ({ page, context }) => {
    await setClock(context, "2026-10-13T09:00:00-04:00"); // week 3
    await page.goto("/plan");
    const weeks = page.getByRole("navigation", { name: "Weeks" }).getByRole("link");
    await expect(weeks).toHaveCount(12);
    await expect(page.getByRole("link", { name: "Week 3, current" })).toBeVisible();
    await page.getByRole("link", { name: /Mon\s*Upper Strength/ }).click();
    await expect(page.getByRole("heading", { name: "Upper Strength" })).toBeVisible();
    await expect(page.getByText("4 × 4–6")).toBeVisible();
    await expect(page.getByRole("textbox")).toHaveCount(0);
  });
});
