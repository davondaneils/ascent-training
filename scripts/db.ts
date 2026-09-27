// Minimal migration + seed runner (no Docker / Supabase CLI needed).
//   npm run db:push   → apply pending supabase/migrations/*.sql, then supabase/seed/*.sql
// Needs SUPABASE_DB_URL in .env.local. Applied migrations are tracked in ascent_meta.migrations,
// a schema the Data API does not expose.

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import postgres from "postgres";

const root = process.cwd();
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set. Add it to .env.local (see .env.example).");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1, onnotice: () => {} });

const sqlFiles = (dir: string) =>
  readdirSync(resolve(root, dir))
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ name: f, path: join(root, dir, f) }));

async function main() {
  await sql`create schema if not exists ascent_meta`;
  await sql`create table if not exists ascent_meta.migrations (name text primary key, applied_at timestamptz not null default now())`;

  const applied = new Set((await sql<{ name: string }[]>`select name from ascent_meta.migrations`).map((r) => r.name));

  for (const m of sqlFiles("supabase/migrations")) {
    if (applied.has(m.name)) continue;
    process.stdout.write(`migrate ${m.name} … `);
    await sql.begin(async (tx) => {
      await tx.unsafe(readFileSync(m.path, "utf8"));
      await tx`insert into ascent_meta.migrations (name) values (${m.name})`;
    });
    console.log("ok");
  }

  for (const s of sqlFiles("supabase/seed")) {
    process.stdout.write(`seed ${s.name} … `);
    await sql.unsafe(readFileSync(s.path, "utf8"));
    console.log("ok");
  }
}

main()
  .catch((err) => {
    console.error("\n", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
