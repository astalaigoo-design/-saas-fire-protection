import { getCronSecretStatus } from "@/lib/cron/env";
import { getOutboundEmailStatus } from "@/lib/email/env";
import { getSmsConfigStatus } from "@/lib/sms/env";
import { getSupabaseStorageStatus } from "@/lib/supabase/env";
import { probePilotDatabaseSchema } from "@/lib/pilot-readiness/schema-probe";

export type PilotReadinessItemId =
  | "migrations"
  | "resend"
  | "supabase_photos"
  | "cron_secret"
  | "twilio";

export type PilotReadinessItem = {
  id: PilotReadinessItemId;
  label: string;
  description: string;
  required: boolean;
  configured: boolean;
  envVars: string[];
  actionHref: string;
  actionLabel: string;
  detail?: string;
};

export type PilotReadinessStatus = {
  ready: boolean;
  requiredComplete: number;
  requiredTotal: number;
  optionalComplete: number;
  optionalTotal: number;
  items: PilotReadinessItem[];
  isProduction: boolean;
};

export function isProductionDeployment(): boolean {
  return (
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production"
  );
}

export function needsPilotReadinessAttention(status: PilotReadinessStatus): boolean {
  return !status.ready;
}

export async function getPilotReadinessStatus(): Promise<PilotReadinessStatus> {
  const isProduction = isProductionDeployment();
  const [schema, email, sms, supabase, cron] = await Promise.all([
    probePilotDatabaseSchema(),
    Promise.resolve(getOutboundEmailStatus()),
    Promise.resolve(getSmsConfigStatus()),
    Promise.resolve(getSupabaseStorageStatus()),
    Promise.resolve(getCronSecretStatus()),
  ]);

  const items: PilotReadinessItem[] = [
    {
      id: "migrations",
      label: "Database migrations",
      description:
        "Production schema must include branches, equipment register, quotes, deficiencies, and work orders.",
      required: true,
      configured: schema.ready,
      envVars: ["DATABASE_URL", "DIRECT_URL"],
      actionHref: "/dashboard/settings#pilot-readiness",
      actionLabel: "View migration checklist",
      detail: schema.ready
        ? undefined
        : schema.missing.includes("schema_probe_failed")
          ? "Could not verify schema — check database connectivity."
          : `Missing: ${schema.missing.join(", ")}. Run npm run db:migrate:deploy on production.`,
    },
    {
      id: "resend",
      label: "Outbound email (Resend)",
      description:
        "Customer quotes, compliance PDFs, due reminders, and technician job emails.",
      required: true,
      configured: email.configured,
      envVars: ["RESEND_API_KEY", "REPORT_EMAIL_FROM"],
      actionHref: "/dashboard/settings#outbound-email",
      actionLabel: "Outbound email setup",
      detail: email.configured && email.fromAddress
        ? `Sending as ${email.fromAddress}`
        : undefined,
    },
    {
      id: "supabase_photos",
      label: "Inspection photos (Supabase)",
      description: "Field photo uploads on failed checklist items and compliance PDF embeds.",
      required: true,
      configured: supabase.configured,
      envVars: [
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_STORAGE_BUCKET",
      ],
      actionHref: "/dashboard/settings#pilot-readiness",
      actionLabel: "Photo storage setup",
      detail: supabase.configured
        ? `Bucket: ${supabase.bucket}`
        : undefined,
    },
    {
      id: "cron_secret",
      label: "Scheduled jobs (CRON_SECRET)",
      description:
        "Secures due reminders, trial-ending emails, technician day-of SMS, and idempotency cleanup.",
      required: isProduction,
      configured: cron.configured,
      envVars: ["CRON_SECRET"],
      actionHref: "/dashboard/settings#pilot-readiness",
      actionLabel: "Cron setup",
    },
    {
      id: "twilio",
      label: "Technician SMS (Twilio)",
      description: "Optional assign/reschedule and day-of texts — in-app alerts work without SMS.",
      required: false,
      configured: sms.configured,
      envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_SMS_FROM"],
      actionHref: "/dashboard/settings#technician-alerts",
      actionLabel: "Technician alerts setup",
      detail: sms.configured && sms.fromNumber
        ? `From ${sms.fromNumber}`
        : undefined,
    },
  ];

  const requiredItems = items.filter((item) => item.required);
  const optionalItems = items.filter((item) => !item.required);

  return {
    ready: requiredItems.every((item) => item.configured),
    requiredComplete: requiredItems.filter((item) => item.configured).length,
    requiredTotal: requiredItems.length,
    optionalComplete: optionalItems.filter((item) => item.configured).length,
    optionalTotal: optionalItems.length,
    items,
    isProduction,
  };
}
