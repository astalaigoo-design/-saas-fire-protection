import { clerkClient } from "@clerk/nextjs/server";

/** Load a pending application invitation by id, or null if missing / not pending. */
export async function getPendingInvitation(invitationId: string) {
  const client = await clerkClient();
  const response = await client.invitations.getInvitationList({
    status: "pending",
    limit: 100,
  });
  const invite = response.data.find((row) => row.id === invitationId);
  return invite?.status === "pending" ? invite : null;
}
