import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PHASE_1 } from "@/lib/training/programs/phase-1";
import { buildSeed } from "@/scripts/seed-sql";

describe("seed", () => {
  it("supabase/seed/phase-1.sql is up to date (run npm run db:seed:generate)", () => {
    const onDisk = readFileSync(resolve(__dirname, "../../supabase/seed/phase-1.sql"), "utf8");
    expect(onDisk).toBe(buildSeed(PHASE_1));
  });

  it("escapes quotes", () => {
    expect(buildSeed(PHASE_1)).toContain("Don''t force depth");
  });
});
