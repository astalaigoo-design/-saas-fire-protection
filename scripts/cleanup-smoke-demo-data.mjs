/**
 * Remove smoke-test customers/buildings from the demo company.
 * Keeps seed data (e.g. Riverside Property Management).
 *
 * Usage:
 *   node scripts/cleanup-smoke-demo-data.mjs          # dry run
 *   node scripts/cleanup-smoke-demo-data.mjs --apply  # delete
 */
import { PrismaClient } from "@prisma/client";

const DEMO_COMPANY_NAME = "GetFlareflow Demo Co.";
const apply = process.argv.includes("--apply");

const prisma = new PrismaClient();

function isSmokeCustomer(customer) {
  const name = customer.name.toLowerCase();
  const email = (customer.email ?? "").toLowerCase();
  if (name.startsWith("smoke")) return true;
  if (email.includes("smoke") && (email.endsWith("@example.com") || email.endsWith("@test.example"))) {
    return true;
  }
  return false;
}

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: DEMO_COMPANY_NAME },
  });
  if (!company) {
    console.error(`Company not found: ${DEMO_COMPANY_NAME}`);
    process.exit(1);
  }

  const customers = await prisma.customer.findMany({
    where: { companyId: company.id },
    include: {
      buildings: { select: { id: true, name: true } },
    },
  });

  const smokeCustomers = customers.filter(isSmokeCustomer);
  if (smokeCustomers.length === 0) {
    console.log("No smoke-test customers found. Nothing to do.");
    return;
  }

  const smokeCustomerIds = smokeCustomers.map((c) => c.id);
  const buildingIds = smokeCustomers.flatMap((c) => c.buildings.map((b) => b.id));

  const inspections = await prisma.inspection.findMany({
    where: { buildingId: { in: buildingIds } },
    select: { id: true, status: true, building: { select: { name: true } } },
  });

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — smoke cleanup for "${DEMO_COMPANY_NAME}"\n`);
  console.log("Customers to remove:");
  for (const c of smokeCustomers) {
    console.log(`  - ${c.name} (${c.email ?? "no email"})`);
    for (const b of c.buildings) {
      console.log(`      building: ${b.name ?? "(unnamed)"}`);
    }
  }
  console.log(`\nInspections to remove: ${inspections.length}`);
  for (const i of inspections) {
    console.log(`  - ${i.id} [${i.status}] @ ${i.building.name ?? "building"}`);
  }

  const kept = customers.filter((c) => !isSmokeCustomer(c));
  console.log(`\nCustomers kept (${kept.length}):`);
  for (const c of kept) {
    console.log(`  - ${c.name}`);
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to delete.\n");
    return;
  }

  const inspectionIds = inspections.map((i) => i.id);

  await prisma.$transaction(async (tx) => {
    if (inspectionIds.length > 0) {
      await tx.inspection.deleteMany({ where: { id: { in: inspectionIds } } });
    }
    await tx.customer.deleteMany({ where: { id: { in: smokeCustomerIds } } });
  });

  console.log("\nDeleted smoke-test data.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
