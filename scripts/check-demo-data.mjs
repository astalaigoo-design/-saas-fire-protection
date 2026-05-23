/**
 * Read-only: report demo / seed-related rows. Safe for production inspection.
 * Usage: node scripts/check-demo-data.mjs
 */
import { PrismaClient } from "@prisma/client";

const DEMO_COMPANY_NAME = "GetFlareflow Demo Co.";

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nCompanies (${companies.length}):`);
  for (const c of companies) {
    const [customers, users, inspections, quotes] = await Promise.all([
      prisma.customer.count({ where: { companyId: c.id } }),
      prisma.user.count({ where: { companyId: c.id } }),
      prisma.inspection.count({ where: { companyId: c.id } }),
      prisma.quote.count({ where: { companyId: c.id } }).catch(() => -1),
    ]);
    const demo = c.name === DEMO_COMPANY_NAME ? " [demo seed name]" : "";
    console.log(
      `  - ${c.name}${demo}\n` +
        `    customers=${customers} users=${users} inspections=${inspections}` +
        (quotes >= 0 ? ` quotes=${quotes}` : " quotes=(table missing?)"),
    );
  }

  const demo = companies.find((c) => c.name === DEMO_COMPANY_NAME);
  if (!demo) {
    console.log(`\nNo "${DEMO_COMPANY_NAME}" company found.`);
    console.log("Run `npm run db:seed` on a DEV database to create demo data.");
    return;
  }

  const types = await prisma.inspectionType.findMany({
    where: { companyId: demo.id },
    select: { code: true, name: true },
    orderBy: { code: "asc" },
  });
  console.log(`\nInspection types for demo company: ${types.map((t) => t.code).join(", ") || "(none)"}`);

  const customers = await prisma.customer.findMany({
    where: { companyId: demo.id },
    select: {
      name: true,
      email: true,
      buildings: { select: { name: true, city: true } },
    },
  });
  console.log(`\nDemo customers (${customers.length}):`);
  for (const cust of customers) {
    console.log(`  - ${cust.name} (${cust.email ?? "no email"})`);
    for (const b of cust.buildings) {
      console.log(`      building: ${b.name}, ${b.city ?? "?"}`);
    }
  }

  const byStatus = await prisma.inspection.groupBy({
    by: ["status"],
    where: { companyId: demo.id },
    _count: true,
  });
  console.log("\nDemo inspections by status:");
  for (const row of byStatus) {
    console.log(`  - ${row.status}: ${row._count}`);
  }

  console.log("\nDone (read-only).\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
