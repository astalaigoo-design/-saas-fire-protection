import { currentUser } from "@clerk/nextjs/server";
import { parseAppRoleFromMetadata, type AppRole } from "./roles";

export async function getAppRole(): Promise<AppRole | null> {
  const user = await currentUser();
  if (!user) return null;
  return parseAppRoleFromMetadata(
    user.publicMetadata as Record<string, unknown>,
    user.unsafeMetadata as Record<string, unknown> | undefined,
  );
}
