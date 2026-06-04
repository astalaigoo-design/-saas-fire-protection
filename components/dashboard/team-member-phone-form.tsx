"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  updateTeamMemberPhone,
  type UpdateTeamMemberPhoneState,
} from "@/lib/team/actions";
import type { TeamMemberRow } from "@/lib/team/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TeamMemberPhoneFormProps = {
  member: TeamMemberRow;
};

function SavePhoneButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending} className="min-h-9">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function TeamMemberPhoneForm({ member }: TeamMemberPhoneFormProps) {
  const [state, formAction] = useFormState<
    UpdateTeamMemberPhoneState | undefined,
    FormData
  >(updateTeamMemberPhone, undefined);

  if (member.role !== "technician") return null;

  return (
    <form action={formAction} className="mt-2 space-y-2">
      <input type="hidden" name="userId" value={member.id} />
      <Label htmlFor={`phone-${member.id}`} className="text-xs text-muted-foreground">
        Mobile (SMS job alerts)
      </Label>
      <div className="flex gap-2">
        <Input
          id={`phone-${member.id}`}
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+1 555 123 4567"
          defaultValue={member.phone ?? ""}
          className="min-h-9 flex-1"
        />
        <SavePhoneButton />
      </div>
      {state?.ok === false ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p role="status" className="text-xs text-muted-foreground">
          Phone saved.
        </p>
      ) : null}
    </form>
  );
}
