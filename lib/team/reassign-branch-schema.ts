import { z } from "zod";

export const reassignTeamMemberBranchSchema = z.object({
  userId: z.string().trim().min(1, "Choose a team member."),
  branchId: z.string().trim().min(1, "Choose a branch."),
});
