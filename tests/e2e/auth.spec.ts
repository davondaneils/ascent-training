import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { adminClient, setClock, signIn, testUserId } from "./support";

test.describe("auth", () => {
  test("app routes redirect to sign-in when signed out", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    for (const path of ["/today", "/plan", "/progress", "/settings"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    }
    await expect(page.getByLabel("Email")).toBeVisible();
    await context.close();
  });

  test("password sign-in rejects a wrong password", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/login");
    await page.getByLabel("Email").fill("not-allowed@example.com");
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toHaveText("Email or password is incorrect.");
    await expect(page).toHaveURL(/\/login$/);
    await context.close();
  });

  test("the email-link fallback moves to the code step", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await page.goto("/login");
    await page.getByRole("button", { name: "Email me a sign-in link instead" }).click();
    // Not the allowed address: the app responds identically but sends nothing.
    await page.getByLabel("Email").fill("not-allowed@example.com");
    await page.getByRole("button", { name: "Send link" }).click();
    await expect(page.getByLabel("Code")).toBeVisible();
    await expect(page.getByLabel("Code")).toHaveAttribute("inputmode", "numeric");
    await context.close();
  });

  test("session survives reload and Today opens by default", async ({ page, context }) => {
    await setClock(context, "2026-09-28T09:00:00-04:00");
    await page.goto("/");
    await expect(page).toHaveURL(/\/today$/);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Monday" })).toBeVisible();
  });

  test("RLS: data is scoped to the signed-in user", async () => {
    // Anonymous requests are refused outright.
    const anonRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/workouts?select=id`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    });
    expect(anonRes.status).toBeGreaterThanOrEqual(400);

    // A real user session (the test account) sees only its own rows and can't write for others.
    const { data: link } = await adminClient().auth.admin.generateLink({ type: "magiclink", email: process.env.E2E_EMAIL! });
    const user = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { error: otpError } = await user.auth.verifyOtp({ token_hash: link.properties!.hashed_token, type: "magiclink" });
    expect(otpError).toBeNull();
    const me = await testUserId();

    const { data: profiles } = await user.from("profiles").select("id");
    expect(profiles?.map((p) => p.id)).toEqual([me]);

    const { data: others } = await adminClient().from("profiles").select("id").neq("id", me).limit(1);
    if (others && others.length > 0) {
      const { data: block } = await user.from("program_blocks").select("id").single();
      const { error } = await user.from("cardio_logs").insert({
        id: crypto.randomUUID(), user_id: others[0].id, program_block_id: block!.id, week_number: 1,
        scheduled_date: "2026-09-28", modality: "bike", target_minutes: 15, actual_minutes: 15, rpe: 3,
        completed_at: new Date().toISOString(),
      });
      expect(error?.code).toBe("42501");
    }
    await user.auth.signOut({ scope: "local" });
  });

  test("sign out", async ({ browser }) => {
    // Own session, so signing out doesn't affect the shared one.
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    await signIn(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/today");
    await expect(page).toHaveURL(/\/login$/);
    await context.close();
  });
});
