"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteJurisdiction,
  updateCertificateSettings,
  upsertJurisdiction,
  type JurisdictionActionResult,
} from "@/lib/jurisdictions/actions";
import type { JurisdictionRow } from "@/lib/jurisdictions/queries";
import {
  REPORT_TEMPLATE_KEYS,
  REPORT_TEMPLATE_LABELS,
} from "@/lib/reports/templates/types";

type JurisdictionsSettingsSectionProps = {
  jurisdictions: JurisdictionRow[];
  certificateNumberPrefix: string | null;
  nextCertificateNumber: number;
};

function SaveJurisdictionButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-10">
      {pending ? "Saving…" : "Save jurisdiction"}
    </Button>
  );
}

function SaveCertificateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-10">
      {pending ? "Saving…" : "Save certificate prefix"}
    </Button>
  );
}

export function JurisdictionsSettingsSection({
  jurisdictions: initialJurisdictions,
  certificateNumberPrefix,
  nextCertificateNumber,
}: JurisdictionsSettingsSectionProps) {
  const router = useRouter();
  const [jurisdictions, setJurisdictions] = useState(initialJurisdictions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [jurisdictionState, jurisdictionAction] = useFormState<
    JurisdictionActionResult | undefined,
    FormData
  >(upsertJurisdiction, undefined);

  const [certState, certAction] = useFormState<
    JurisdictionActionResult | undefined,
    FormData
  >(updateCertificateSettings, undefined);

  const editing = jurisdictions.find((j) => j.id === editingId);

  useEffect(() => {
    if (jurisdictionState?.ok) {
      router.refresh();
      setShowForm(false);
      setEditingId(null);
    }
  }, [jurisdictionState, router]);

  function handleDelete(id: string) {
    if (!window.confirm("Delete this jurisdiction? Buildings will be unassigned.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteJurisdiction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setJurisdictions((rows) => rows.filter((row) => row.id !== id));
    });
  }

  return (
    <section
      aria-labelledby="jurisdictions-heading"
      className="max-w-2xl space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div>
        <h2 id="jurisdictions-heading" className="font-heading text-base font-semibold text-foreground">
          Jurisdictions &amp; certificate PDFs
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define AHJs for certificate numbering and NFPA form layouts. Assign jurisdictions on
          building profiles; sprinkler and alarm inspections auto-select NFPA templates when no
          jurisdiction override is set.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {jurisdictionState && !jurisdictionState.ok ? (
        <p role="alert" className="text-sm text-destructive">
          {jurisdictionState.error}
        </p>
      ) : null}
      {jurisdictionState?.ok ? (
        <p role="status" className="text-sm text-emerald-700">
          Jurisdiction saved.
        </p>
      ) : null}

      <form action={certAction} className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium text-foreground">Company-wide certificate prefix</h3>
        <p className="text-xs text-muted-foreground">
          Used when a building has no jurisdiction. Next number: {nextCertificateNumber} (format:{" "}
          {certificateNumberPrefix ? `${certificateNumberPrefix}2026-00001` : "2026-00001"}).
        </p>
        {certState && !certState.ok ? (
          <p role="alert" className="text-sm text-destructive">
            {certState.error}
          </p>
        ) : null}
        {certState?.ok ? (
          <p role="status" className="text-sm text-emerald-700">
            Certificate prefix saved.
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="certificateNumberPrefix">Prefix (optional)</Label>
            <Input
              id="certificateNumberPrefix"
              name="certificateNumberPrefix"
              defaultValue={certificateNumberPrefix ?? ""}
              placeholder="e.g. FF-"
              className="min-h-10"
            />
          </div>
          <SaveCertificateButton />
        </div>
      </form>

      {jurisdictions.length > 0 ? (
        <ul className="space-y-2">
          {jurisdictions.map((jurisdiction) => (
            <li
              key={jurisdiction.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{jurisdiction.name}</p>
                <p className="text-xs text-muted-foreground">
                  Code {jurisdiction.code}
                  {jurisdiction.certificatePrefix
                    ? ` · Prefix ${jurisdiction.certificatePrefix}`
                    : ""}
                  {" · "}
                  {REPORT_TEMPLATE_LABELS[
                    jurisdiction.reportTemplateKey as keyof typeof REPORT_TEMPLATE_LABELS
                  ] ?? jurisdiction.reportTemplateKey}
                  {" · "}
                  {jurisdiction.buildingCount} building
                  {jurisdiction.buildingCount === 1 ? "" : "s"}
                  {" · "}
                  next #{jurisdiction.nextCertificateNumber}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10"
                  onClick={() => {
                    setEditingId(jurisdiction.id);
                    setShowForm(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10"
                  disabled={isPending}
                  onClick={() => handleDelete(jurisdiction.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No jurisdictions yet.</p>
      )}

      {showForm ? (
        <form action={jurisdictionAction} className="space-y-4 rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">
            {editing ? "Edit jurisdiction" : "Add jurisdiction"}
          </h3>
          {editing ? (
            <input type="hidden" name="jurisdictionId" value={editing.id} />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="jurisdiction-name">AHJ name</Label>
            <Input
              id="jurisdiction-name"
              name="name"
              required
              defaultValue={editing?.name}
              placeholder="Austin Fire Department"
              className="min-h-10"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jurisdiction-code">Code</Label>
              <Input
                id="jurisdiction-code"
                name="code"
                required
                defaultValue={editing?.code}
                placeholder="AFD"
                className="min-h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jurisdiction-prefix">Certificate prefix</Label>
              <Input
                id="jurisdiction-prefix"
                name="certificatePrefix"
                defaultValue={editing?.certificatePrefix ?? ""}
                placeholder="AFD-"
                className="min-h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jurisdiction-template">PDF form template</Label>
            <select
              id="jurisdiction-template"
              name="reportTemplateKey"
              defaultValue={editing?.reportTemplateKey ?? "default"}
              className="flex min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {REPORT_TEMPLATE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {REPORT_TEMPLATE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <SaveJurisdictionButton />
            <Button
              type="button"
              variant="ghost"
              className="min-h-10"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" className="min-h-10" onClick={() => setShowForm(true)}>
          Add jurisdiction
        </Button>
      )}
    </section>
  );
}
