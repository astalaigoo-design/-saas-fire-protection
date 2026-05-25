import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      reportEmail: true,
      reportPhone: true,
      createdAt: true,
      _count: { select: { users: true, customers: true, inspections: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log("\n=== Companies ===\n");
  for (const c of companies) {
    console.log(`${c.name}`);
    console.log(`  id:         ${c.id}`);
    console.log(`  users:      ${c._count.users}`);
    console.log(`  customers:  ${c._count.customers}`);
    console.log(`  inspections:${c._count.inspections}`);
    console.log(`  reportEmail:${c.reportEmail ?? "(not set)"}`);
    console.log("");
  }

  const users = await prisma.user.findMany({
    include: { company: { select: { name: true } } },
    orderBy: { email: "asc" },
  });

  console.log("=== Users ===\n");
  for (const u of users) {
    console.log(`${u.email ?? "(no email)"} — ${u.role} @ ${u.company.name}`);
    console.log(`  clerkUserId: ${u.clerkUserId}`);
    console.log(`  companyId:   ${u.companyId}`);
    console.log(`  active:      ${u.active}`);
    console.log("");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
