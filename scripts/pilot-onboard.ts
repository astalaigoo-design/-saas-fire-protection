/**
 * One-shot pilot tenant setup: company + design partner + owner link or invite + verify.
 *
 * Usage:
 *   npm run pilot:onboard -- "Acme Fire Protection" --uk --design-partner --clerk-user user_xxx
 *   npm run pilot:onboard -- "Acme Fire Protection" --design-partner --invite owner@acme.com
 *   npm run pilot:onboard -- "Acme Fire Protection" --clerk-user user_xxx --verify
 *
 * Env (optional): PILOT_COMPANY_NAME, PILOT_CLERK_USER_ID, PILOT_INVITE_EMAIL, PILOT_DESIGN_PARTNER=1
 */
import { PrismaClient, OperatingMarket } from "@prisma/client";
import { z } from "zod";
import { createTeamInvitation } from "../lib/clerk/create-team-invitation";
import { syncClerkPublicMetadata } from "../lib/clerk/sync-public-metadata";
import { createCompanyWithDefaults } from "../lib/companies/bootstrap-company";
import { getAppOrigin } from "../lib/app-url";
import { parseOperatingMarket } from "../lib/market/operating-market";

const prisma = new PrismaClient();

function printUsage() {
  console.log(`
Pilot onboarding — create company, optional design partner, link or invite owner.

  npm run pilot:onboard -- "<company name>" [options]

Options:
  --design-partner     Complimentary pilot (no Paddle checkout)
  --uk                 UK operating market (BS checklists, GBP, GB addresses)
  --clerk-user <id>    Link existing Clerk user as owner (user_...)
  --invite <email>     Send Clerk invitation email as owner
  --verify             After link, verify Clerk metadata + DB row

Examples:
  npm run pilot:onboard -- "Bay Area Fire Protection" --design-partner --invite ops@bayarea.com
  npm run pilot:onboard -- "Bay Area Fire Protection" --design-partner --clerk-user user_abc --verify

After invite: owner completes sign-up from email, then run:
  npm run pilot:verify-clerk -- <clerk_user_id>
`);
}

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  let designPartner = false;
  let clerkUserId: string | undefined;
  let inviteEmail: string | undefined;
  let verify = false;
  let uk = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--design-partner") {
      designPartner = true;
      continue;
    }
    if (arg === "--uk") {
      uk = true;
      continue;
    }
    if (arg === "--verify") {
      verify = true;
      continue;
    }
    if (arg === "--clerk-user") {
      clerkUserId = argv[i + 1]?.trim();
      i += 1;
      continue;
    }
    if (arg === "--invite") {
      inviteEmail = argv[i + 1]?.trim();
      i += 1;
      continue;
    }
    if (!arg.startsWith("--")) {
      positional.push(arg);
    }
  }

  const companyName =
    positional.join(" ").trim() ||
    process.env.PILOT_COMPANY_NAME?.trim() ||
    "";

  if (process.env.PILOT_DESIGN_PARTNER === "1" || process.env.PILOT_DESIGN_PARTNER === "true") {
    designPartner = true;
  }
  clerkUserId = clerkUserId || process.env.PILOT_CLERK_USER_ID?.trim();
  inviteEmail = inviteEmail || process.env.PILOT_INVITE_EMAIL?.trim();

  const operatingMarket =
    uk || process.env.PILOT_OPERATING_MARKET?.trim().toUpperCase() === "UK"
      ? OperatingMarket.UK
      : parseOperatingMarket(process.env.PILOT_OPERATING_MARKET);

  return { companyName, designPartner, clerkUserId, inviteEmail, verify, operatingMarket };
}

async function verifyClerkUser(clerkUserId: string, companyId: string): Promise<boolean> {
  const { execSync } = await import("node:child_process");
  try {
    execSync(
      `npx tsx scripts/verify-clerk-metadata.ts "${clerkUserId}" --company-id "${companyId}"`,
      { stdio: "inherit", env: process.env },
    );
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { companyName, designPartner, clerkUserId, inviteEmail, verify, operatingMarket } =
    parseArgs(process.argv.slice(2));

  if (!companyName) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (clerkUserId && inviteEmail) {
    console.error("Use either --clerk-user or --invite, not both.");
    process.exitCode = 1;
    return;
  }

  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    console.error("CLERK_SECRET_KEY is required in .env");
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.company.findFirst({
    where: { name: companyName },
    select: { id: true, name: true, designPartner: true },
  });
  if (existing) {
    console.error(`Company already exists: "${existing.name}" (${existing.id})`);
    console.error("Use fix-user / pilot:verify-clerk for that tenant, or pick a new name.");
    process.exitCode = 1;
    return;
  }

  console.log("\n1/4 Creating company with default inspection types…");
  const company = await createCompanyWithDefaults(companyName, undefined, { operatingMarket });
  console.log(`   ✓ ${company.name}`);
  console.log(`   id: ${company.id}`);
  console.log(`   market: ${company.operatingMarket}`);

  if (designPartner) {
    console.log("\n2/4 Marking design partner (complimentary pilot)…");
    await prisma.company.update({
      where: { id: company.id },
      data: { designPartner: true },
    });
    console.log("   ✓ designPartner=true");
  } else {
    console.log("\n2/4 Design partner: skipped (add --design-partner for complimentary pilot)");
  }

  if (clerkUserId) {
    console.log("\n3/4 Linking owner in DB + Clerk metadata…");
    if (!clerkUserId.startsWith("user_")) {
      console.error("   Clerk user id should look like user_...");
      process.exitCode = 1;
      return;
    }

    await prisma.user.upsert({
      where: {
        companyId_clerkUserId: {
          companyId: company.id,
          clerkUserId,
        },
      },
      update: { role: "owner", active: true, deletedAt: null },
      create: {
        companyId: company.id,
        clerkUserId,
        role: "owner",
      },
    });

    const sync = await syncClerkPublicMetadata(clerkUserId, {
      role: "owner",
      companyId: company.id,
    });
    if (!sync.ok) {
      throw new Error(sync.error);
    }
    console.log("   ✓ Linked as owner");
    console.log(`   metadata: { "role": "owner", "companyId": "${company.id}" }`);
  } else if (inviteEmail) {
    console.log("\n3/4 Sending owner invitation…");
    const emailParsed = z.string().email().safeParse(inviteEmail);
    if (!emailParsed.success) {
      console.error("   Invalid email for --invite");
      process.exitCode = 1;
      return;
    }

    const invite = await createTeamInvitation({
      emailAddress: emailParsed.data,
      role: "owner",
      companyId: company.id,
    });
    if (!invite.ok) {
      throw new Error(invite.error);
    }
    console.log(`   ✓ Invitation sent to ${emailParsed.data} (id: ${invite.invitationId})`);
    console.log(`   Redirect: ${getAppOrigin()}/sign-up`);
    console.log("\n   After they sign up, run:");
    console.log(`     npm run pilot:verify-clerk -- <clerk_user_id>`);
  } else {
    console.log("\n3/4 Owner: skipped");
    console.log("   Link existing account:");
    console.log(
      `     FIX_COMPANY_ID=${company.id} npm run fix-user -- <clerk_user_id> owner`,
    );
    console.log("   Or invite by email:");
    console.log(`     npm run pilot:invite-owner -- ${company.id} owner@example.com`);
  }

  if (verify && clerkUserId) {
    console.log("\n4/4 Verifying Clerk metadata…");
    const verified = await verifyClerkUser(clerkUserId, company.id);
    if (!verified) process.exitCode = 1;
  } else if (verify && !clerkUserId) {
    console.log("\n4/4 Verify: run after owner signs in:");
    console.log("     npm run pilot:verify-clerk -- <clerk_user_id>");
  } else {
    console.log("\n4/4 Verify (optional):");
    console.log(`     npm run pilot:verify-clerk -- <clerk_user_id> --company-id ${company.id}`);
  }

  console.log("\n--- Pilot tenant ready ---");
  console.log("Company:", company.name);
  console.log("Company ID:", company.id);
  console.log("Design partner:", designPartner ? "yes" : "no");
  console.log("Operating market:", operatingMarket);
  console.log("App:", getAppOrigin());
  console.log("Owner signs out/in after metadata changes.\n");
}

main()
  .catch((error: unknown) => {
    console.error("\npilot-onboard failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
