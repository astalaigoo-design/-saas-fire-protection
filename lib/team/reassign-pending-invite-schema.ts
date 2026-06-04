import { z } from "zod";

export const reassignPendingInviteBranchSchema = z.object({
  invitationId: z.string().trim().min(1, "Choose a pending invitation."),
  branchId: z.string().trim().min(1, "Choose a branch."),
});
