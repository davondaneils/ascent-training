// Shared E2E helpers. Runs against the real Supabase project with a dedicated test account
// (E2E_EMAIL), never the owner's account. The service-role key is used only here, in Node.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BrowserContext, Page } from "@playwright/test";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI provides env directly.
}

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
export const START_DATE = "2026-09-28"; // a Monday; week 1 of the test enrollment
export const STORAGE_STATE = "tests/e2e/.auth/user.json";

export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} must be set (see .env.example) to run E2E tests`);
  return v;
}

let admin: SupabaseClient | undefined;
export function adminClient(): SupabaseClient {
  admin ??= createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/** The pre-created test user. Fails loudly instead of creating one. */
export async function testUserId(): Promise<string> {
  const email = env("E2E_EMAIL").toLowerCase();
  if (email === process.env.ALLOWED_EMAIL?.toLowerCase()) {
    throw new Error("E2E_EMAIL must be a separate test account, not ALLOWED_EMAIL");
  }
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await adminClient().auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (user) return user.id;
    if (data.users.length < 200) break;
  }
  throw new Error(`Test user ${email} not found. Create it in Supabase → Authentication → Users.`);
}

/** Deletes all of the test user's training data and re-enrols them from START_DATE. */
export async function resetTestUser(): Promise<string> {
  const id = await testUserId();
  const db = adminClient();
  for (const table of ["workouts", "cardio_logs", "mobility_logs", "program_enrollments"]) {
    const { error } = await db.from(table).delete().eq("user_id", id);
    if (error) throw new Error(`reset ${table}: ${error.message}`);
  }
  const { data: block, error: blockError } = await db.from("program_blocks").select("id").eq("is_active", true).single();
  if (blockError) throw blockError;
  const { error } = await db.from("program_enrollments").insert({ user_id: id, program_block_id: block.id, start_date: START_DATE });
  if (error) throw error;
  return id;
}

/** Signs the test user in through the app's own magic-link route (no password is ever entered). */
export async function signIn(page: Page): Promise<void> {
  const { data, error } = await adminClient().auth.admin.generateLink({ type: "magiclink", email: env("E2E_EMAIL") });
  if (error) throw error;
  await page.goto(`/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink`);
  await page.waitForURL(/\/(today|onboarding)/);
}

/** Pretend it's `iso` for server-side day logic (dev-only clock override). */
export async function setClock(context: BrowserContext, iso: string): Promise<void> {
  await context.addCookies([{ name: "ascent-now", value: new Date(iso).toISOString(), url: BASE_URL }]);
}
