import { InspectFieldHeaderBar } from "@/components/inspect/inspect-field-header-bar";
import { canViewStaffNotifications } from "@/lib/notifications/scope";
import { getStaffNotificationsFeed } from "@/lib/notifications/queries";
import { getInspectSession } from "@/lib/inspect/access";
import { getTechnicianHomeHref } from "@/lib/inspect/resume-job";

/** Sticky back link + notification bell on field inspect routes (outside dashboard chrome). */
export async function InspectFieldHeader() {
  try {
    const session = await getInspectSession();
    if (!session || !canViewStaffNotifications(session.role)) {
      return null;
    }

    const feed = await getStaffNotificationsFeed(session);
    if (!feed) return null;

    const backHref =
      session.role === "technician" ? getTechnicianHomeHref() : "/dashboard/jobs";
    const backLabel = session.role === "technician" ? "My jobs" : "Calendar";

    return (
      <InspectFieldHeaderBar
        feed={feed}
        backHref={backHref}
        backLabel={backLabel}
        role={session.role}
      />
    );
  } catch (error) {
    console.error("InspectFieldHeader failed — continuing without header", error);
    return null;
  }
}
