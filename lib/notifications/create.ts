import { revalidatePath } from "next/cache";
import type { CreateStaffNotificationInput } from "@/lib/notifications/types";
import { sendStaffNotificationEmails } from "@/lib/email/send-staff-notification-email";
import { prisma } from "@/lib/prisma";

export async function createStaffNotification(
  input: CreateStaffNotificationInput,
): Promise<string | null> {
  try {
    const row = await prisma.staffNotification.create({
      data: {
        companyId: input.companyId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        targetUserId: input.targetUserId ?? null,
      },
      select: { id: true },
    });

    revalidatePath("/dashboard", "layout");

    if (input.emailOwnersAndAdmins) {
      void sendStaffNotificationEmails({
        companyId: input.companyId,
        title: input.title,
        body: input.body,
        href: input.href,
      }).catch((error) => {
        console.error("sendStaffNotificationEmails failed", error);
      });
    }

    return row.id;
  } catch (error) {
    console.error("createStaffNotification failed", error, input);
    return null;
  }
}
