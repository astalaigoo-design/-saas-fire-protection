import { z } from "zod";

export const reassignCustomerBranchSchema = z.object({
  customerId: z.string().trim().min(1, "Customer is required."),
  branchId: z.string().trim().min(1, "Choose a branch."),
});
