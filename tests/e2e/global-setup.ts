import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { BASE_URL, STORAGE_STATE, resetTestUser, signIn } from "./support";

export default async function globalSetup() {
  await resetTestUser();
  mkdirSync(dirname(STORAGE_STATE), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: BASE_URL });
  await signIn(page);
  await page.context().storageState({ path: STORAGE_STATE });
  await browser.close();
}
