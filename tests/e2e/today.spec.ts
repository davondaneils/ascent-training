import { expect, test } from "@playwright/test";
import { setClock } from "./support";

// Year 1 · Cycle 1 ("The First Response") from the 2026-09-28 test enrollment.
const strength: [string, string, string][] = [
  ["2026-09-28", "Monday", "Strength A · Press & Squat"],
  ["2026-09-30", "Wednesday", "Strength B · Hinge & Pull"],
  ["2026-10-02", "Friday", "Strength C · Full Body"],
];

test.describe("Today", () => {
  for (const [date, weekday, name] of strength) {
    test(`${weekday} shows ${name}`, async ({ page, context }) => {
      await setClock(context, `${date}T09:00:00-04:00`);
      await page.goto("/today");
      await expect(page.getByRole("heading", { name: weekday })).toBeVisible();
      await expect(page.getByText(/· Week 1 of 13/).first()).toBeVisible();
      await expect(page.getByRole("heading", { name })).toBeVisible();
      await expect(page.getByRole("button", { name: /Start Workout|Resume Workout/ })).toBeVisible();
      await expect(page.getByText("Later today")).toHaveCount(0);
    });
  }

  test("Tuesday is easy aerobic work, no lifting", async ({ page, context }) => {
    await setClock(context, "2026-09-29T09:00:00-04:00");
    await page.goto("/today");
    await expect(page.getByText("Bike · 20 min")).toBeVisible();
    await expect(page.getByRole("button", { name: /Start Workout/ })).toHaveCount(0);
  });

  test("Thursday is aerobic work plus mobility (no swim in cycle 1)", async ({ page, context }) => {
    await setClock(context, "2026-10-01T09:00:00-04:00");
    await page.goto("/today");
    await expect(page.getByText("Incline walk · 20 min")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Checklist" })).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(4);
    await expect(page.getByRole("button", { name: /Start Workout/ })).toHaveCount(0);
  });

  test("Saturday is the long walk / hike with mobility", async ({ page, context }) => {
    await setClock(context, "2026-10-03T09:00:00-04:00");
    await page.goto("/today");
    await expect(page.getByText("Long walk / hike · 35 min")).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(2);
    await expect(page.getByRole("button", { name: /Start Workout/ })).toHaveCount(0);
  });

  test("Sunday is rest and worship with no training or mission actions", async ({ page, context }) => {
    await setClock(context, "2026-10-04T09:00:00-04:00");
    await page.goto("/today");
    await expect(page.getByRole("heading", { name: "Rest · Fast" })).toBeVisible();
    await expect(page.getByText(/No physical training today/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Start|Mark complete|Met standard/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Start/ })).toHaveCount(0);
  });

  test("deload weeks are marked", async ({ page, context }) => {
    await setClock(context, "2026-10-19T09:00:00-04:00"); // week 4
    await page.goto("/today");
    await expect(page.getByText(/Week 4 of 13\s*·\s*Deload/)).toBeVisible();
  });

  test("the training cycle advances with the calendar", async ({ page, context }) => {
    // Day 91: Year 1 · Cycle 2 begins, with new lifts and optional run/walk + swim.
    await setClock(context, "2026-12-28T09:00:00-05:00");
    await page.goto("/today");
    await expect(page.getByText(/· Week 1 of 13/).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Strength A · Squat & Press" })).toBeVisible();
    await expect(page.getByText(/Cycle 2 of 20/)).toBeVisible();
    await setClock(context, "2026-12-29T09:00:00-05:00");
    await page.goto("/today");
    await expect(page.getByText("Run / walk · 22 min")).toBeVisible();
    await setClock(context, "2026-12-31T09:00:00-05:00");
    await page.goto("/today");
    await expect(page.getByText("Supervised swim · 25 min")).toBeVisible();

    // The last day of year 1 stays in cycle 4's recovery week; the anniversary starts year 2.
    await setClock(context, "2027-09-27T09:00:00-04:00");
    await page.goto("/today");
    await expect(page.getByText(/· Week 13 of 13/).first()).toBeVisible();
    await expect(page.getByText(/Cycle 4 of 20/)).toBeVisible();
    await setClock(context, "2027-09-28T09:00:00-04:00");
    await page.goto("/today");
    await expect(page.getByText(/YEAR 2 OF 5/)).toBeVisible();
    await expect(page.getByText(/Cycle 5 of 20/)).toBeVisible();
    await expect(page.getByText("Run / walk · 30 min")).toBeVisible();
  });

  test("Plan shows 13 weeks of the current cycle and read-only day detail", async ({ page, context }) => {
    await setClock(context, "2026-10-13T09:00:00-04:00"); // week 3
    await page.goto("/plan");
    await expect(page.getByRole("heading", { name: "Year 1 · The First Response" })).toBeVisible();
    const weeks = page.getByRole("navigation", { name: "Weeks" }).getByRole("link");
    await expect(weeks).toHaveCount(13);
    await expect(page.getByRole("link", { name: "Week 3, current" })).toBeVisible();
    await page.getByRole("link", { name: /Mon\s*Strength A/ }).click();
    await expect(page.getByRole("heading", { name: "Strength A · Press & Squat" })).toBeVisible();
    await expect(page.getByText("3 × 5–8").first()).toBeVisible();
    await expect(page.getByRole("textbox")).toHaveCount(0);
  });

  test("no horizontal overflow on iPhone widths", async ({ page, context }) => {
    await setClock(context, "2026-12-26T09:00:00-05:00"); // a crucible Saturday: longest Today
    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const path of ["/today", "/plan", "/progress", "/campaign", "/plan/1"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
      }
    }
  });
});
