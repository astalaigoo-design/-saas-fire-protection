/**
 * Backfill missing shareToken values on reports (and optionally quotes).
 *
 * Run after deploying report/quote public links when older rows predate token assignment.
 *
 * Usage:
 *   npx tsx scripts/backfill-report-share-tokens.ts
 *   npx tsx scripts/backfill-report-share-tokens.ts --apply
 *   npx tsx scripts/backfill-report-share-tokens.ts --apply --quotes
 *   npx tsx scripts/backfill-report-share-tokens.ts --apply --all-statuses
 *   npx tsx scripts/backfill-report-share-tokens.ts --apply --company-id=cmp_xxx
 *
 * Requires DATABASE_URL (and DIRECT_URL if set) in the environment or .env.
 */
import { PrismaClient, ReportStatus } from "@prisma/client";
import { createReportShareToken } from "../lib/reports/share-token";

const prisma = new PrismaClient();

const apply = process.argv.includes("--apply");
const includeQuotes = process.argv.includes("--quotes");
const allStatuses = process.argv.includes("--all-statuses");

function readCompanyIdArg(): string | undefined {
  const arg = process.argv.find((value) => value.startsWith("--company-id="));
  if (!arg) return undefined;
  const id = arg.slice("--company-id=".length).trim();
  return id || undefined;
}

async function assignShareToken(
  table: "report" | "quote",
  id: string,
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareToken = createReportShareToken();
    try {
      if (table === "report") {
        const updated = await prisma.report.update({
          where: { id },
          data: { shareToken },
          select: { shareToken: true },
        });
        return updated.shareToken!;
      }
      const updated = await prisma.quote.update({
        where: { id },
        data: { shareToken },
        select: { shareToken: true },
      });
      return updated.shareToken!;
    } catch {
      /* unique collision — retry */
    }
  }
  throw new Error(`Could not assign share token to ${table} ${id}`);
}

async function main() {
  const companyId = readCompanyIdArg();

  const reportWhere = {
    shareToken: null,
    ...(allStatuses ? {} : { status: ReportStatus.finalized }),
    ...(companyId
      ? { inspection: { companyId } }
      : {}),
  };

  const reports = await prisma.report.findMany({
    where: reportWhere,
    select: {
      id: true,
      title: true,
      status: true,
      generatedAt: true,
      inspection: {
        select: {
          company: { select: { name: true } },
          building: {
            select: {
              name: true,
              addressLine1: true,
              city: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const quoteWhere = {
    shareToken: null,
    ...(companyId ? { companyId } : {}),
  };

  const quotes = includeQuotes
    ? await prisma.quote.findMany({
        where: quoteWhere,
        select: {
          id: true,
          title: true,
          status: true,
          company: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — shareToken backfill\n`);
  if (companyId) console.log(`Company filter: ${companyId}`);
  if (!allStatuses) {
    console.log("Reports: finalized only (pass --all-statuses to include draft/failed)");
  }

  console.log(`\nReports missing shareToken: ${reports.length}`);
  for (const report of reports.slice(0, 25)) {
    const building = report.inspection.building;
    const site =
      building.name?.trim() || `${building.addressLine1}, ${building.city}`;
    console.log(
      `  - ${report.id} [${report.status}] ${report.title ?? "(untitled)"} · ${site} · ${report.inspection.company.name}`,
    );
  }
  if (reports.length > 25) {
    console.log(`  … and ${reports.length - 25} more`);
  }

  if (includeQuotes) {
    console.log(`\nQuotes missing shareToken: ${quotes.length}`);
    for (const quote of quotes.slice(0, 25)) {
      console.log(
        `  - ${quote.id} [${quote.status}] ${quote.title ?? "(untitled)"} · ${quote.company.name}`,
      );
    }
    if (quotes.length > 25) {
      console.log(`  … and ${quotes.length - 25} more`);
    }
  }

  const total = reports.length + quotes.length;
  if (total === 0) {
    console.log("\nNothing to backfill.\n");
    return;
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write tokens.\n");
    return;
  }

  let reportUpdated = 0;
  for (const report of reports) {
    const token = await assignShareToken("report", report.id);
    reportUpdated += 1;
    if (reportUpdated <= 5 || reportUpdated === reports.length) {
      console.log(`  report ${report.id} → /r/${token}`);
    }
  }
  if (reports.length > 5) {
    console.log(`  … ${reports.length} reports updated`);
  }

  let quoteUpdated = 0;
  for (const quote of quotes) {
    const token = await assignShareToken("quote", quote.id);
    quoteUpdated += 1;
    if (quoteUpdated <= 5 || quoteUpdated === quotes.length) {
      console.log(`  quote ${quote.id} → /q/${token}`);
    }
  }
  if (quotes.length > 5) {
    console.log(`  … ${quotes.length} quotes updated`);
  }

  console.log(
    `\nDone. Updated ${reportUpdated} report(s)${includeQuotes ? ` and ${quoteUpdated} quote(s)` : ""}.\n`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
