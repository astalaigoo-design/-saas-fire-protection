"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  provisionUserWorkspace,
  type ProvisionWorkspaceResult,
} from "@/lib/dashboard/provision-workspace";

export async function retryWorkspaceProvisioning(): Promise<ProvisionWorkspaceResult> {
  const result = await provisionUserWorkspace();
  if (result.ok) {
    revalidatePath("/account-setup");
    revalidatePath("/dashboard", "layout");
    redirect("/dashboard");
  }
  return result;
}
