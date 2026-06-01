/**
 * Flag a company as a design partner (complimentary pilot — no Paddle checkout).
 *
 * Usage:
 *   npx tsx scripts/mark-design-partner.ts <companyId> [--unset]
 */
import { prisma } from "@/lib/prisma";

async function main() {
  const companyId = process.argv[2]?.trim();
  const unset = process.argv.includes("--unset");

  if (!companyId) {
    console.error("Usage: npx tsx scripts/mark-design-partner.ts <companyId> [--unset]");
    process.exit(1);
  }

  const company = await prisma.company.update({
    where: { id: companyId },
    data: { designPartner: !unset },
    select: { id: true, name: true, designPartner: true },
  });

  console.log(
    `${company.name} (${company.id}) — designPartner=${company.designPartner}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
