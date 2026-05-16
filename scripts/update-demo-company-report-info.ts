import { PrismaClient } from "@prisma/client";

const DEMO_COMPANY_NAME = "Demo Fire Protection Co.";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.company.findFirst({
    where: { name: DEMO_COMPANY_NAME },
  });
  if (!existing) {
    throw new Error(`Company not found: ${DEMO_COMPANY_NAME}`);
  }

  const company = await prisma.company.update({
    where: { id: existing.id },
    data: {
      reportEmail: "info@demofireprotection.example",
      reportPhone: "+1 (555) 010-2000",
      reportAddress: "100 Market Street, Suite 400\nSan Francisco, CA 94105",
    },
  });

  console.log("Updated company report fields:");
  console.log(JSON.stringify(company, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
