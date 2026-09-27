// Writes supabase/seed/phase-1.sql from lib/training/programs/phase-1.ts.
// Run: npm run db:seed:generate

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PHASE_1 } from "../lib/training/programs/phase-1";
import { buildSeed } from "./seed-sql";

const target = resolve(process.cwd(), "supabase/seed/phase-1.sql");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, buildSeed(PHASE_1));
console.log(`Wrote ${target}`);
