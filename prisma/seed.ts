import {
  InspectionItemResult,
  InspectionStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import { DEMO_COMPANY_NAME } from "../lib/branding";
import { syncBuildingComplianceStatus } from "../lib/buildings/sync-compliance";
import { getWeekRange } from "../lib/dashboard/dates";

const prisma = new PrismaClient();

const INSPECTION_TYPES = [
  { code: "annual", name: "Annual Inspection" },
  { code: "quarterly", name: "Quarterly Inspection" },
  { code: "monthly", name: "Monthly Inspection" },
] as const;

const DEFAULT_CHECKLIST = [
  "Fire extinguishers accessible and charged",
  "Emergency exit signs illuminated",
  "Sprinkler heads unobstructed",
  "Fire alarm panel shows normal status",
  "Kitchen hood suppression system inspected",
] as const;

async function getOrCreateCompany() {
  let company = await prisma.company.findFirst({
    where: { name: DEMO_COMPANY_NAME },
  });
  if (!company) {
    company = await prisma.company.create({
      data: { name: DEMO_COMPANY_NAME },
    });
    console.log(`Created company: ${company.name}`);
  } else {
    console.log(`Using existing company: ${company.name}`);
  }
  return company;
}

async function seedInspectionTypes(companyId: string) {
  for (const type of INSPECTION_TYPES) {
    await prisma.inspectionType.upsert({
      where: {
        companyId_code: { companyId, code: type.code },
      },
      update: { name: type.name },
      create: {
        companyId,
        code: type.code,
        name: type.name,
      },
    });
  }
  console.log(`Ensured inspection types: ${INSPECTION_TYPES.map((t) => t.code).join(", ")}`);
}

async function seedClerkUsers(companyId: string) {
  const seeds: { envKey: string; role: UserRole; name: string }[] = [
    { envKey: "SEED_CLERK_OWNER_ID", role: UserRole.owner, name: "Demo Owner" },
    { envKey: "SEED_CLERK_ADMIN_ID", role: UserRole.admin, name: "Demo Admin" },
    {
      envKey: "SEED_CLERK_TECHNICIAN_ID",
      role: UserRole.technician,
      name: "Demo Technician",
    },
  ];

  let linked = 0;
  for (const { envKey, role, name } of seeds) {
    const clerkUserId = process.env[envKey]?.trim();
    if (!clerkUserId) continue;

    await prisma.user.upsert({
      where: {
        companyId_clerkUserId: { companyId, clerkUserId },
      },
      update: { role, name },
      create: {
        companyId,
        clerkUserId,
        role,
        name,
        email: process.env[`${envKey}_EMAIL`]?.trim() ?? null,
      },
    });
    linked += 1;
    console.log(`Linked Clerk user (${role}): ${clerkUserId}`);
  }

  if (linked === 0) {
    console.log(
      "Skipped users — set SEED_CLERK_OWNER_ID / SEED_CLERK_ADMIN_ID / SEED_CLERK_TECHNICIAN_ID in .env to link Clerk accounts.",
    );
  }
}

async function seedSampleInspection(companyId: string) {
  const existing = await prisma.customer.count({ where: { companyId } });
  if (existing > 0) {
    console.log("Sample customer already exists — skipping demo customer/building/inspection.");
    await ensureDemoCompletedInspection(companyId);
    await ensureUpcomingInspectionThisWeek(companyId);
    return;
  }

  const annualType = await prisma.inspectionType.findFirst({
    where: { companyId, code: "annual" },
  });
  if (!annualType) {
    throw new Error("Annual inspection type missing; run inspection type seed first.");
  }

  const technician = await prisma.user.findFirst({
    where: { companyId, role: UserRole.technician },
  });

  const customer = await prisma.customer.create({
    data: {
      companyId,
      name: "Riverside Property Management",
      email: "facilities@riverside-demo.example",
      phone: "+1-555-0100",
    },
  });

  const building = await prisma.building.create({
    data: {
      customerId: customer.id,
      name: "Riverside Office Tower",
      addressLine1: "1200 Market Street",
      city: "San Francisco",
      region: "CA",
      postalCode: "94103",
      country: "US",
    },
  });

  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 1);
  scheduledAt.setHours(10, 0, 0, 0);

  const completedAt = new Date();
  completedAt.setDate(completedAt.getDate() - 2);

  const quarterlyType = await prisma.inspectionType.findFirst({
    where: { companyId, code: "quarterly" },
  });

  const upcoming = await prisma.inspection.create({
    data: {
      companyId,
      buildingId: building.id,
      inspectionTypeId: annualType.id,
      assignedToUserId: technician?.id ?? null,
      scheduledAt,
      status: InspectionStatus.scheduled,
      notes: "Seed data — upcoming annual fire inspection walkthrough.",
      items: {
        create: DEFAULT_CHECKLIST.map((label, index) => ({
          label,
          sortOrder: index,
          result: InspectionItemResult.pending,
        })),
      },
    },
    include: { items: true },
  });

  if (quarterlyType) {
    await prisma.inspection.create({
      data: {
        companyId,
        buildingId: building.id,
        inspectionTypeId: quarterlyType.id,
        assignedToUserId: technician?.id ?? null,
        scheduledAt: completedAt,
        completedAt,
        status: InspectionStatus.completed,
        notes: "Seed data — completed quarterly inspection.",
        items: {
          create: DEFAULT_CHECKLIST.map((label, index) => ({
            label,
            sortOrder: index,
            result: InspectionItemResult.pass,
          })),
        },
      },
    });
  }

  console.log(
    `Created sample inspections (${upcoming.items.length} checklist items on upcoming) for ${building.name}.`,
  );
}

async function ensureUpcomingInspectionThisWeek(companyId: string) {
  const { start, end } = getWeekRange();
  const inWeek = await prisma.inspection.count({
    where: {
      companyId,
      status: { in: [InspectionStatus.scheduled, InspectionStatus.in_progress] },
      scheduledAt: { gte: start, lt: end },
    },
  });
  if (inWeek > 0) return;

  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 1);
  scheduledAt.setHours(10, 0, 0, 0);
  if (scheduledAt >= end) {
    scheduledAt.setTime(start.getTime());
    scheduledAt.setHours(10, 0, 0, 0);
  }

  const existing = await prisma.inspection.findFirst({
    where: { companyId, status: InspectionStatus.scheduled },
    orderBy: { scheduledAt: "asc" },
  });

  if (existing) {
    await prisma.inspection.update({
      where: { id: existing.id },
      data: { scheduledAt },
    });
    console.log("Adjusted demo scheduled inspection into the current week.");
    return;
  }

  const building = await prisma.building.findFirst({
    where: { customer: { companyId } },
    orderBy: { createdAt: "asc" },
  });
  const annualType = await prisma.inspectionType.findFirst({
    where: { companyId, code: "annual" },
  });
  const technician = await prisma.user.findFirst({
    where: { companyId, role: UserRole.technician },
  });
  if (!building || !annualType) return;

  await prisma.inspection.create({
    data: {
      companyId,
      buildingId: building.id,
      inspectionTypeId: annualType.id,
      assignedToUserId: technician?.id ?? null,
      scheduledAt,
      status: InspectionStatus.scheduled,
      notes: "Seed data — upcoming inspection this week.",
      items: {
        create: DEFAULT_CHECKLIST.map((label, index) => ({
          label,
          sortOrder: index,
          result: InspectionItemResult.pending,
        })),
      },
    },
  });
  console.log("Added upcoming demo inspection for the current week.");
}

async function ensureDemoCompletedInspection(companyId: string) {
  const hasCompleted = await prisma.inspection.count({
    where: { companyId, status: InspectionStatus.completed },
  });
  if (hasCompleted > 0) return;

  const building = await prisma.building.findFirst({
    where: { customer: { companyId } },
    orderBy: { createdAt: "asc" },
  });
  const quarterlyType = await prisma.inspectionType.findFirst({
    where: { companyId, code: "quarterly" },
  });
  const technician = await prisma.user.findFirst({
    where: { companyId, role: UserRole.technician },
  });
  if (!building || !quarterlyType) return;

  const completedAt = new Date();
  completedAt.setDate(completedAt.getDate() - 2);

  await prisma.inspection.create({
    data: {
      companyId,
      buildingId: building.id,
      inspectionTypeId: quarterlyType.id,
      assignedToUserId: technician?.id ?? null,
      scheduledAt: completedAt,
      completedAt,
      status: InspectionStatus.completed,
      notes: "Seed data — completed quarterly inspection.",
      items: {
        create: DEFAULT_CHECKLIST.map((label, index) => ({
          label,
          sortOrder: index,
          result: InspectionItemResult.pass,
        })),
      },
    },
  });
  console.log(`Added completed demo inspection for ${building.name}.`);
}

async function backfillBuildingCompliance(companyId: string) {
  const buildings = await prisma.building.findMany({
    where: { customer: { companyId } },
    select: { id: true },
  });
  for (const building of buildings) {
    await syncBuildingComplianceStatus(building.id);
  }
  if (buildings.length > 0) {
    console.log(`Synced compliance status for ${buildings.length} building(s).`);
  }
}

async function main() {
  console.log("Seeding database…\n");

  const company = await getOrCreateCompany();
  await seedInspectionTypes(company.id);
  await seedClerkUsers(company.id);
  await seedSampleInspection(company.id);
  await ensureDemoCompletedInspection(company.id);
  await ensureUpcomingInspectionThisWeek(company.id);
  await backfillBuildingCompliance(company.id);

  console.log("\nSeed finished.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
