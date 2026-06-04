import { publicReportUrl } from "@/lib/app-url";
import { buildingLabel } from "@/lib/customers/format";
import {
  branchScopeFromSession,
  inspectionWhereFromScope,
} from "@/lib/branches/scope";
import type { DashboardSession } from "@/lib/dashboard/session";
import { sendComplianceReportEmail } from "@/lib/email/send-compliance-report";
import { isOutboundEmailConfigured } from "@/lib/email/env";
import { notifyReportEmailFailed } from "@/lib/notifications/notify-report-email-failed";
import { generateComplianceReport } from "@/lib/reports/generate-compliance-report";
import { prisma } from "@/lib/prisma";

export type ReportEmailOutcome =
  | { status: "sent"; to: string }
  | { status: "skipped"; reason: string };

async function alertReportEmailSkipped(
  companyId: string,
  inspectionId: string,
  reason: string,
  buildingLabelText?: string,
): Promise<void> {
  if (reason.includes("not configured")) return;
  if (reason.includes("already emailed")) return;

  await notifyReportEmailFailed({
    companyId,
    inspectionId,
    reason,
    buildingLabel: buildingLabelText,
  });
}

/**
 * Post-submit hook: generate the compliance PDF and email it to the customer.
 * Never throws — failures are logged and recorded on the Report row.
 */
export async function emailComplianceReportAfterSubmit(
  session: DashboardSession,
  inspectionId: string,
): Promise<ReportEmailOutcome> {
  if (!isOutboundEmailConfigured()) {
    return {
      status: "skipped",
      reason:
        "Outbound email (Resend) is not configured — report was saved; use the share link or configure RESEND_API_KEY and REPORT_EMAIL_FROM.",
    };
  }

  const existingReport = await prisma.report.findFirst({
    where: { inspectionId },
    orderBy: { createdAt: "desc" },
    select: { id: true, emailedAt: true, emailedTo: true },
  });

  if (existingReport?.emailedAt && existingReport.emailedTo) {
    return {
      status: "skipped",
      reason: `Report was already emailed to ${existingReport.emailedTo}.`,
    };
  }

  let buffer: Buffer;
  let filename: string;
  let reportId: string;
  let shareToken: string;

  try {
    const generated = await generateComplianceReport(session, inspectionId);
    buffer = generated.buffer;
    filename = generated.filename;
    reportId = generated.reportId;
    shareToken = generated.shareToken;
  } catch (error) {
    console.error("emailComplianceReportAfterSubmit: PDF generation failed", error);
    const reason = "Could not generate the PDF report for email.";
    await alertReportEmailSkipped(session.companyId, inspectionId, reason);
    return { status: "skipped", reason };
  }

  const scope = branchScopeFromSession(session);
  const data = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      ...inspectionWhereFromScope(scope, session.companyId),
    },
    select: {
      completedAt: true,
      company: { select: { name: true, reportEmail: true } },
      building: {
        select: {
          name: true,
          addressLine1: true,
          city: true,
          customer: { select: { name: true, email: true } },
        },
      },
      inspectionType: { select: { name: true } },
      items: { select: { result: true } },
    },
  });

  if (!data?.completedAt) {
    return { status: "skipped", reason: "Inspection data is not available for email." };
  }

  const customerEmail = data.building.customer.email?.trim();
  if (!customerEmail) {
    const noEmailReason =
      "This customer has no email address — add one on the customer profile.";
    await prisma.report.update({
      where: { id: reportId },
      data: {
        emailError: "Customer has no email address on file.",
      },
    });
    await alertReportEmailSkipped(
      session.companyId,
      inspectionId,
      noEmailReason,
      buildingLabel(data.building),
    );
    return { status: "skipped", reason: noEmailReason };
  }

  const overallPass = !data.items.some(
    (item) => item.result === "fail" || item.result === "pending",
  );

  const sendResult = await sendComplianceReportEmail({
    to: customerEmail,
    customerName: data.building.customer.name,
    buildingLabel: buildingLabel(data.building),
    companyName: data.company.name,
    inspectionTypeName: data.inspectionType.name,
    completedAt: data.completedAt,
    overallPass,
    pdfBuffer: buffer,
    filename,
    replyTo: data.company.reportEmail,
    reportLink: publicReportUrl(shareToken),
  });

  if (!sendResult.ok) {
    console.error("emailComplianceReportAfterSubmit: send failed", sendResult.error);
    const failReason =
      "The report was saved but the email could not be sent. Try downloading from the dashboard.";
    await prisma.report.update({
      where: { id: reportId },
      data: { emailError: sendResult.error },
    });
    await alertReportEmailSkipped(
      session.companyId,
      inspectionId,
      failReason,
      buildingLabel(data.building),
    );
    return { status: "skipped", reason: failReason };
  }

  await prisma.report.update({
    where: { id: reportId },
    data: {
      emailedTo: customerEmail,
      emailedAt: new Date(),
      emailError: null,
    },
  });

  return { status: "sent", to: customerEmail };
}
