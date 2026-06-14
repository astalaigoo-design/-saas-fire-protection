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
  {
    label: "branches",
    sql: `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'branches'`,
  },
  {
    label: "customers.branchId",
    sql: `SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'branchId'`,
  },
  {
    label: "checklist_template_items",
    sql: `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'checklist_template_items'`,
  },
  {
    label: "staff_notifications",
    sql: `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'staff_notifications'`,
  },
  {
    label: "deficiencies",
    sql: `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'deficiencies'`,
  },
  {
    label: "building_assets",
    sql: `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'building_assets'`,
  },
  {
    label: "inspection_asset_checks",
    sql: `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'inspection_asset_checks'`,
  },
  {
    label: "inspection_items.linkedTagNumber",
    sql: `SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'inspection_items' AND column_name = 'linkedTagNumber'`,
  },
  {
    label: "building_assets.barcodeValue",
    sql: `SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'building_assets' AND column_name = 'barcodeValue'`,
  },
  {
    label: "building_assets.retiredAt",
    sql: `SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'building_assets' AND column_name = 'retiredAt'`,
  },
  {
    label: "users.phone",
    sql: `SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone'`,
  },
  {
    label: "inspections.technicianDayOfSmsSentAt",
    sql: `SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'inspections' AND column_name = 'technicianDayOfSmsSentAt'`,
  },
  {
    label: "branch_asset_service_intervals",
    sql: `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'branch_asset_service_intervals'`,
  },
  {
    label: "jurisdictions",
    sql: `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'jurisdictions'`,
  },
  {
    label: "work_orders",
    sql: `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'work_orders'`,
  },
  {
    label: "parts",
    sql: `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'parts'`,
  },
  {
    label: "inspections.arrivedAt",
    sql: `SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'inspections' AND column_name = 'arrivedAt'`,
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
