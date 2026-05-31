/**
 * Read-only: list all user rows for the shared GetFlareflow company.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: "GetFlareflow" },
    select: { id: true, name: true },
  });
  if (!company) {
    console.log("GetFlareflow company not found.");
    return;
  }

  const rows = await prisma.user.findMany({
    where: { companyId: company.id },
    select: {
      email: true,
      name: true,
      role: true,
      active: true,
      clerkUserId: true,
      deletedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nAll user rows on ${company.name} (${rows.length}):\n`);
  for (const row of rows) {
    console.log(
      [
        row.active ? "active" : "inactive",
        row.email ?? "(no email)",
        row.name ?? "(no name)",
        row.clerkUserId,
        row.deletedAt ? `deleted ${row.deletedAt.toISOString()}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
