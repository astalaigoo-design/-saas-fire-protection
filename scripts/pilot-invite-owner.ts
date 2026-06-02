/**
 * Send owner invitation for an existing company (Clerk metadata on accept).
 *
 * Usage:
 *   npm run pilot:invite-owner -- <companyId> owner@example.com
 */
import { z } from "zod";
import { createTeamInvitation } from "../lib/clerk/create-team-invitation";
import { prisma } from "../lib/prisma";
import { getAppOrigin } from "../lib/app-url";

async function main() {
  const companyId = process.argv[2]?.trim() || process.env.PILOT_COMPANY_ID?.trim();
  const email = process.argv[3]?.trim() || process.env.PILOT_INVITE_EMAIL?.trim();

  if (!companyId || !email) {
    console.error("Usage: npm run pilot:invite-owner -- <companyId> <owner email>");
    process.exit(1);
  }

  const emailParsed = z.string().email().safeParse(email);
  if (!emailParsed.success) {
    console.error("Invalid email.");
    process.exit(1);
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true },
  });
  if (!company) {
    console.error("Company not found:", companyId);
    process.exit(1);
  }

  const invite = await createTeamInvitation({
    emailAddress: emailParsed.data,
    role: "owner",
    companyId: company.id,
  });
  if (!invite.ok) {
    console.error(invite.error);
    process.exit(1);
  }

  console.log(`Invitation sent to ${emailParsed.data} for ${company.name}`);
  console.log("  companyId:", company.id);
  console.log("  invitationId:", invite.invitationId);
  console.log("  sign-up URL:", `${getAppOrigin()}/sign-up`);
  console.log("\nAfter sign-up:");
  console.log("  npm run pilot:verify-clerk -- <clerk_user_id>");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
