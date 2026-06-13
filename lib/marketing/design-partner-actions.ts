"use server";

import { sendDesignPartnerApplicationEmail } from "@/lib/email/send-design-partner-application";
import { designPartnerApplicationSchema } from "@/lib/marketing/design-partner-schema";
import { captureServerActionError } from "@/lib/monitoring/capture";

export type DesignPartnerApplicationState =
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | { ok: true; message: string };

export async function submitDesignPartnerApplication(
  _prev: DesignPartnerApplicationState | null,
  formData: FormData,
): Promise<DesignPartnerApplicationState> {
  const parsed = designPartnerApplicationSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    teamSize: formData.get("teamSize"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
      fieldErrors,
    };
  }

  try {
    const result = await sendDesignPartnerApplicationEmail(parsed.data);
    if (!result.ok) {
      captureServerActionError("submitDesignPartnerApplication", new Error(result.error));
      return {
        ok: false,
        error:
          "We could not send your application right now. Try again in a moment or email support@getflareflow.com.",
      };
    }

    return {
      ok: true,
      message:
        "Thanks — we received your application and will reply within one business day. You can still start a free trial while we review.",
    };
  } catch (error) {
    captureServerActionError("submitDesignPartnerApplication", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
