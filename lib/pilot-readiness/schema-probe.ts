import { prisma } from "@/lib/prisma";

/** Subset of `scripts/db/verify-schema-columns.mjs` required for a production pilot. */
export const PILOT_SCHEMA_CHECKS = [
  "branches",
  "customers.branchId",
  "building_assets",
  "inspection_asset_checks",
  "quotes.shareToken",
  "deficiencies",
  "work_orders",
] as const;

export type PilotSchemaProbeResult = {
  ready: boolean;
  missing: string[];
};

type SchemaCheckRow = { label: string; ok: boolean };

export async function probePilotDatabaseSchema(): Promise<PilotSchemaProbeResult> {
  try {
    const rows = await prisma.$queryRaw<SchemaCheckRow[]>`
      SELECT * FROM (
        VALUES
          ('branches', EXISTS(
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'branches'
          )),
          ('customers.branchId', EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'branchId'
          )),
          ('building_assets', EXISTS(
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'building_assets'
          )),
          ('inspection_asset_checks', EXISTS(
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'inspection_asset_checks'
          )),
          ('quotes.shareToken', EXISTS(
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'shareToken'
          )),
          ('deficiencies', EXISTS(
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'deficiencies'
          )),
          ('work_orders', EXISTS(
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'work_orders'
          ))
      ) AS checks(label, ok)
    `;

    const missing = rows.filter((row) => !row.ok).map((row) => row.label);
    return { ready: missing.length === 0, missing };
  } catch (error) {
    console.error("probePilotDatabaseSchema failed", error);
    return { ready: false, missing: ["schema_probe_failed"] };
  }
}
