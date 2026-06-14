import { captureError } from "@/lib/monitoring/capture";
import type { DashboardSession } from "@/lib/dashboard/session";
import { listCompanyParts, type PartRow } from "@/lib/parts/queries";
import type { ClientPartRow } from "@/lib/parts/types";

export function serializePartRow(row: PartRow): ClientPartRow {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    unitCents: row.unitCents,
    quantityOnHand: row.quantityOnHand,
    active: row.active,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt:
      row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  };
}

export function serializePartRows(rows: PartRow[]): ClientPartRow[] {
  return rows.map(serializePartRow);
}

export type ListCompanyPartsResult =
  | { ok: true; parts: ClientPartRow[] }
  | { ok: false; error: string };

function isMissingPartsTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /relation "parts" does not exist/i.test(message) ||
    /table `public\.parts`/i.test(message) ||
    /P2021/i.test(message)
  );
}

export async function listCompanyPartsForPage(
  session: DashboardSession,
): Promise<ListCompanyPartsResult> {
  try {
    const rows = await listCompanyParts(session);
    return { ok: true, parts: serializePartRows(rows) };
  } catch (error) {
    console.error("listCompanyParts failed", error);
    captureError(error, {
      tags: { layer: "data_fetch", query: "listCompanyParts" },
      extra: { companyId: session.companyId },
    });

    if (isMissingPartsTableError(error)) {
      return {
        ok: false,
        error:
          "Parts inventory is not available on this database yet. If you just updated the app, wait a minute and refresh — otherwise contact support.",
      };
    }

    return {
      ok: false,
      error: "Could not load parts inventory. Check your connection and try again.",
    };
  }
}
