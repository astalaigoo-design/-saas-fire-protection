import { loadEnv } from "./load-env.mjs";

loadEnv();
import pg from "pg";

const url = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Set DIRECT_URL or DATABASE_URL.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const checks = [
  {
    label: "companies.designPartner",
    sql: `SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'designPartner'`,
  },
  {
    label: "quotes.shareToken",
    sql: `SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'shareToken'`,
  },
  {
    label: "idempotency_keys",
    sql: `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'idempotency_keys'`,
  },
];

let failed = false;
for (const { label, sql } of checks) {
  const { rows } = await client.query(sql);
  const ok = rows.length > 0;
  console.log(`${ok ? "OK" : "MISSING"}  ${label}`);
  if (!ok) failed = true;
}

const { rows: countRows } = await client.query(
  "SELECT COUNT(*)::int AS n FROM _prisma_migrations",
);
console.log(`OK  _prisma_migrations (${countRows[0].n} recorded)`);

const { rows: latest } = await client.query(
  `SELECT migration_name, finished_at FROM _prisma_migrations
   ORDER BY finished_at DESC NULLS LAST LIMIT 3`,
);
console.log("\nLatest applied:");
for (const row of latest) {
  const when = row.finished_at
    ? row.finished_at.toISOString().slice(0, 19)
    : "pending";
  console.log(`  ${row.migration_name}  ${when}`);
}

await client.end();
process.exit(failed ? 1 : 0);
