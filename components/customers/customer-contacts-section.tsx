"use client";

import { useFormState, useFormStatus } from "react-dom";
import { CustomerContactRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCustomerContact,
  submitDeleteCustomerContact,
  seedBillingContactFromAccountAction,
  type CustomerContactActionResult,
} from "@/lib/customers/contact-actions";
import {
  CUSTOMER_CONTACT_ROLES,
  customerContactRoleLabel,
} from "@/lib/customers/contact-constants";
import type { CustomerDetail } from "@/lib/customers/queries";
type CustomerContactsSectionProps = {
  customer: Pick<CustomerDetail, "id" | "name" | "email" | "phone" | "contacts">;
};

const nativeSelectClassName =
  "flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-10">
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function CustomerContactsSection({ customer }: CustomerContactsSectionProps) {
  const [createState, createAction] = useFormState<
    CustomerContactActionResult | undefined,
    FormData
  >(createCustomerContact, undefined);
  const [, seedAction] = useFormState<
    CustomerContactActionResult | undefined,
    FormData
  >(seedBillingContactFromAccountAction, undefined);

  return (
    <section
      aria-labelledby="customer-contacts-heading"
      className="max-w-2xl rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <h2
        id="customer-contacts-heading"
        className="font-heading text-base font-semibold text-foreground"
      >
        Contacts
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Separate billing and on-site contacts. Account email and phone above are the primary record;
        add role-specific people here for invoices and site coordination.
      </p>

      {customer.contacts.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          No contacts yet.
          {customer.email || customer.phone ? (
            <form action={seedAction} className="mt-2">
              <input type="hidden" name="customerId" value={customer.id} />
              <Button type="submit" variant="outline" size="sm" className="min-h-9">
                Copy account info as billing contact
              </Button>
            </form>
          ) : null}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {customer.contacts.map((contact) => (
            <li
              key={contact.id}
              className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {contact.name}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {customerContactRoleLabel(contact.role)}
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-muted-foreground">
                    {contact.email ? <span>{contact.email}</span> : null}
                    {contact.phone ? <span>{contact.phone}</span> : null}
                  </div>
                  {contact.notes ? (
                    <p className="mt-2 text-xs text-muted-foreground">{contact.notes}</p>
                  ) : null}
                </div>
                <form action={submitDeleteCustomerContact}>
                  <input type="hidden" name="contactId" value={contact.id} />
                  <Button type="submit" variant="ghost" size="sm" className="min-h-9 text-destructive">
                    Remove
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={createAction} className="mt-6 space-y-4 border-t border-border pt-4">
        <input type="hidden" name="customerId" value={customer.id} />
        <p className="text-sm font-medium text-foreground">Add contact</p>
        {createState?.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {createState.error}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="contact-name">Name</Label>
            <Input id="contact-name" name="name" required className="min-h-11" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-role">Role</Label>
            <select
              id="contact-role"
              name="role"
              defaultValue={CustomerContactRole.site}
              className={nativeSelectClassName}
            >
              {CUSTOMER_CONTACT_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" name="email" type="email" className="min-h-11" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input id="contact-phone" name="phone" type="tel" className="min-h-11" />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-notes">Notes</Label>
          <Textarea id="contact-notes" name="notes" rows={2} />
        </div>
        <SubmitButton label="Add contact" />
      </form>
    </section>
  );
}
