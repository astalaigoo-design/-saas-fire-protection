import { PrismaClient, UserRole } from "@prisma/client";

const DEMO_COMPANY_NAME = "Demo Fire Protection Co.";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({
    where: { name: DEMO_COMPANY_NAME },
  });
  if (!company) {
    throw new Error(`Company not found: ${DEMO_COMPANY_NAME}`);
  }

  const user = await prisma.user.upsert({
    where: {
      companyId_clerkUserId: {
        companyId: company.id,
        clerkUserId: "dummy_1",
      },
    },
    update: {
      email: "tech@test.com",
      name: "Tech Tim",
      role: UserRole.technician,
    },
    create: {
      companyId: company.id,
      clerkUserId: "dummy_1",
      email: "tech@test.com",
      name: "Tech Tim",
      role: UserRole.technician,
    },
  });

  console.log("Technician ready:");
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
