"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  updateCustomerNotificationSettings,
  type UpdateCustomerNotificationSettingsState,
} from "@/lib/companies/customer-notification-actions";
import type { CustomerNotificationSettings } from "@/lib/notifications/customer-settings";
import type { OutboundEmailStatus } from "@/lib/email/env";
import type { SmsConfigStatus } from "@/lib/sms/env";
import { orgSectionAnchorClass } from "@/components/dashboard/org-settings-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CustomerNotificationsSettingsSectionProps = {
  settings: CustomerNotificationSettings;
  emailStatus: OutboundEmailStatus;
  smsStatus: SmsConfigStatus;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
      {pending ? "Saving…" : "Save customer notifications"}
    </Button>
  );
}

function NotifyToggle({
  id,
  name,
  label,
  description,
  defaultChecked,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer gap-3 rounded-lg border border-border px-3 py-3",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-1 size-4 shrink-0 accent-primary"
      />
      <span>
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export function CustomerNotificationsSettingsSection({
  settings,
  emailStatus,
  smsStatus,
}: CustomerNotificationsSettingsSectionProps) {
  const [state, formAction] = useFormState<
    UpdateCustomerNotificationSettingsState | undefined,
    FormData
  >(updateCustomerNotificationSettings, undefined);

  const emailOff = !emailStatus.configured;
  const smsOff = !smsStatus.configured;

  return (
    <section
      id="customer-notifications"
      className={cn(
        orgSectionAnchorClass,
        "max-w-2xl rounded-xl border border-border bg-card p-5 shadow-sm",
      )}
      aria-labelledby="customer-notifications-heading"
    >
      <h2
        id="customer-notifications-heading"
        className="font-heading text-lg font-semibold text-foreground"
      >
        Customer notifications
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Optional email and SMS to customers so they do not have to check the portal. Uses the
        customer profile email and phone. SMS requires Twilio; email requires Resend.
      </p>

      <form action={formAction} className="mt-4 space-y-6">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground">Report ready</legend>
          <p className="text-sm text-muted-foreground">
            After a technician submits an inspection (when no repair quote is bundled).
          </p>
          <NotifyToggle
            id="reportReadyEmail"
            name="reportReadyEmail"
            label="Email with PDF"
            description="Compliance report attached plus online link."
            defaultChecked={settings.reportReadyEmail}
            disabled={emailOff}
          />
          <NotifyToggle
            id="reportReadySms"
            name="reportReadySms"
            label="SMS with report link"
            description="Short text with the public report URL."
            defaultChecked={settings.reportReadySms}
            disabled={smsOff}
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground">Quote sent</legend>
          <p className="text-sm text-muted-foreground">
            When staff sends a repair quote from Reports or Quotes.
          </p>
          <NotifyToggle
            id="quoteSentEmail"
            name="quoteSentEmail"
            label="Email with PDFs"
            description="Inspection report and quote attached when available."
            defaultChecked={settings.quoteSentEmail}
            disabled={emailOff}
          />
          <NotifyToggle
            id="quoteSentSms"
            name="quoteSentSms"
            label="SMS with quote link"
            description="Short text with the public quote URL."
            defaultChecked={settings.quoteSentSms}
            disabled={smsOff}
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground">Visit scheduled</legend>
          <p className="text-sm text-muted-foreground">
            When a new visit is scheduled from Jobs, CSV import, or the customer portal.
          </p>
          <NotifyToggle
            id="visitScheduledEmail"
            name="visitScheduledEmail"
            label="Email confirmation"
            description="Date, site, and customer portal link when enabled."
            defaultChecked={settings.visitScheduledEmail}
            disabled={emailOff}
          />
          <NotifyToggle
            id="visitScheduledSms"
            name="visitScheduledSms"
            label="SMS confirmation"
            description="Short text with visit time and portal link."
            defaultChecked={settings.visitScheduledSms}
            disabled={smsOff}
          />
        </fieldset>

        {state?.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state?.ok === true ? (
          <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
            Customer notification settings saved.
          </p>
        ) : null}

        <SaveButton />
      </form>
    </section>
  );
}
