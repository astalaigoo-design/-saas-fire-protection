"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  updateMyTechnicianPhone,
  type UpdateMyPhoneState,
} from "@/lib/team/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MyPhoneFormProps = {
  currentPhone: string | null;
  smsConfigured: boolean;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-10">
      {pending ? "Saving…" : "Save mobile number"}
    </Button>
  );
}

export function MyPhoneForm({ currentPhone, smsConfigured }: MyPhoneFormProps) {
  const [state, formAction] = useFormState<UpdateMyPhoneState | undefined, FormData>(
    updateMyTechnicianPhone,
    undefined,
  );

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">SMS job alerts</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {smsConfigured
          ? "Add your mobile number to get texts when jobs are assigned, rescheduled, or due today."
          : "SMS is not enabled on this server yet. You still get in-app and email alerts when configured."}
      </p>
      <form action={formAction} className="mt-4 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="my-phone">Mobile number</Label>
          <Input
            id="my-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 123 4567"
            defaultValue={currentPhone ?? ""}
            className="min-h-11"
          />
        </div>
        {state?.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state?.ok === true ? (
          <p role="status" className="text-sm text-muted-foreground">
            Saved. You will receive SMS when jobs change (if Twilio is configured).
          </p>
        ) : null}
        <SaveButton />
      </form>
    </section>
  );
}
