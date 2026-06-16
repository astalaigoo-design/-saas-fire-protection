"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addChecklistTemplateItem,
  reorderChecklistTemplateItem,
  resetChecklistTemplateToDefaults,
  toggleChecklistTemplateItemHidden,
  updateChecklistTemplateItem,
  type ChecklistTemplateActionState,
} from "@/lib/inspections/checklist-template-actions";
import { orgSectionAnchorClass } from "@/components/dashboard/org-settings-layout";
import type { ChecklistTemplatesEditorData } from "@/lib/inspections/checklist-template-queries";
import { cn } from "@/lib/utils";

type ChecklistTemplatesSectionProps = {
  data: ChecklistTemplatesEditorData;
  resetLabel: string;
  templatesDescription: string;
};

function ActionButton({
  children,
  variant = "secondary",
}: {
  children: ReactNode;
  variant?: "secondary" | "ghost" | "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant} size="sm" className="min-h-9">
      {pending ? "…" : children}
    </Button>
  );
}

function TemplateItemRow({
  item,
  isFirst,
  isLast,
}: {
  item: ChecklistTemplatesEditorData["types"][number]["items"][number];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction] = useFormState<
    ChecklistTemplateActionState | undefined,
    FormData
  >(updateChecklistTemplateItem, undefined);
  const [toggleState, toggleAction] = useFormState<
    ChecklistTemplateActionState | undefined,
    FormData
  >(toggleChecklistTemplateItemHidden, undefined);
  const [upState, upAction] = useFormState<
    ChecklistTemplateActionState | undefined,
    FormData
  >(reorderChecklistTemplateItem, undefined);
  const [downState, downAction] = useFormState<
    ChecklistTemplateActionState | undefined,
    FormData
  >(reorderChecklistTemplateItem, undefined);

  const error =
    (updateState && !updateState.ok ? updateState.error : null) ??
    (toggleState && !toggleState.ok ? toggleState.error : null) ??
    (upState && !upState.ok ? upState.error : null) ??
    (downState && !downState.ok ? downState.error : null);

  if (editing) {
    return (
      <li
        className={`rounded-lg border border-border p-3 ${item.hidden ? "opacity-60" : ""}`}
      >
        <form action={updateAction} className="space-y-3">
          <input type="hidden" name="itemId" value={item.id} />
          <div className="space-y-1">
            <Label htmlFor={`label-${item.id}`} className="text-xs">
              Label
            </Label>
            <Input
              id={`label-${item.id}`}
              name="label"
              defaultValue={item.label}
              required
              className="min-h-10"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`desc-${item.id}`} className="text-xs">
              Citation / notes (optional)
            </Label>
            <textarea
              id={`desc-${item.id}`}
              name="description"
              defaultValue={item.description ?? ""}
              rows={3}
              className="flex min-h-[4.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`tag-${item.id}`} className="text-xs">
              Equipment tag (optional)
            </Label>
            <Input
              id={`tag-${item.id}`}
              name="linkedTagNumber"
              defaultValue={item.linkedTagNumber ?? ""}
              placeholder="e.g. FE-101"
              className="min-h-10"
            />
            <p className="text-xs text-muted-foreground">
              When this row passes, the matching register item is stamped on submit.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton>Save</ActionButton>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-9"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
          {updateState?.ok ? (
            <p className="text-xs text-emerald-700" role="status">
              Saved.
            </p>
          ) : null}
        </form>
      </li>
    );
  }

  return (
    <li
      className={`rounded-lg border border-border p-3 ${item.hidden ? "border-dashed bg-muted/30 opacity-75" : "bg-card"}`}
    >
      <div className="space-y-1">
        <p className="font-medium text-foreground">{item.label}</p>
        {item.description ? (
          <p className="text-xs text-muted-foreground line-clamp-3">{item.description}</p>
        ) : null}
        {item.linkedTagNumber ? (
          <p className="text-xs text-muted-foreground">
            Register tag: <span className="font-medium text-foreground">{item.linkedTagNumber}</span>
          </p>
        ) : null}
        {item.hidden ? (
          <p className="text-xs font-medium text-muted-foreground">Hidden on new jobs</p>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-9"
          onClick={() => setEditing(true)}
        >
          Edit
        </Button>
        <form action={toggleAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <ActionButton variant="outline">
            {item.hidden ? "Show" : "Hide"}
          </ActionButton>
        </form>
        {!isFirst ? (
          <form action={upAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="direction" value="up" />
            <ActionButton variant="ghost">Up</ActionButton>
          </form>
        ) : null}
        {!isLast ? (
          <form action={downAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="direction" value="down" />
            <ActionButton variant="ghost">Down</ActionButton>
          </form>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}

function AddItemForm({ inspectionTypeId }: { inspectionTypeId: string }) {
  const [state, formAction] = useFormState<
    ChecklistTemplateActionState | undefined,
    FormData
  >(addChecklistTemplateItem, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <input type="hidden" name="inspectionTypeId" value={inspectionTypeId} />
      <p className="text-sm font-medium text-foreground">Add item</p>
      <div className="space-y-1">
        <Label htmlFor={`add-label-${inspectionTypeId}`} className="text-xs">
          Label
        </Label>
        <Input
          id={`add-label-${inspectionTypeId}`}
          name="label"
          required
          placeholder="e.g. Backflow assembly test"
          className="min-h-10"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`add-desc-${inspectionTypeId}`} className="text-xs">
          Citation / notes (optional)
        </Label>
        <textarea
          id={`add-desc-${inspectionTypeId}`}
          name="description"
          rows={2}
          placeholder="AHJ form section or internal procedure"
          className="flex min-h-[3.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`add-tag-${inspectionTypeId}`} className="text-xs">
          Equipment tag (optional)
        </Label>
        <Input
          id={`add-tag-${inspectionTypeId}`}
          name="linkedTagNumber"
          placeholder="e.g. FE-101"
          className="min-h-10"
        />
      </div>
      <ActionButton>Add to template</ActionButton>
      {state && !state.ok ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-xs text-emerald-700" role="status">
          Item added.
        </p>
      ) : null}
    </form>
  );
}

function ResetTemplateForm({
  inspectionTypeId,
  resetLabel,
}: {
  inspectionTypeId: string;
  resetLabel: string;
}) {
  const [state, formAction] = useFormState<
    ChecklistTemplateActionState | undefined,
    FormData
  >(resetChecklistTemplateToDefaults, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <input type="hidden" name="inspectionTypeId" value={inspectionTypeId} />
      <ActionButton variant="outline">{resetLabel}</ActionButton>
      {state && !state.ok ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-xs text-emerald-700" role="status">
          Template reset.
        </p>
      ) : null}
    </form>
  );
}

export function ChecklistTemplatesSection({
  data,
  resetLabel,
  templatesDescription,
}: ChecklistTemplatesSectionProps) {
  const types = data.types;
  const defaultTypeId = types[0]?.id ?? "";
  const [selectedTypeId, setSelectedTypeId] = useState(defaultTypeId);

  const selectedType = useMemo(
    () => types.find((type) => type.id === selectedTypeId) ?? types[0],
    [types, selectedTypeId],
  );

  if (types.length === 0) {
    return null;
  }

  const visibleCount = selectedType?.items.filter((item) => !item.hidden).length ?? 0;

  return (
    <section
      id="checklist-templates"
      className={cn(orgSectionAnchorClass, "max-w-2xl space-y-4")}
      aria-labelledby="checklist-templates-heading"
    >
      <div>
        <h2
          id="checklist-templates-heading"
          className="font-heading text-lg font-semibold text-foreground"
        >
          Checklist templates
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{templatesDescription}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="checklist-type-select" className="text-sm">
          Inspection type
        </Label>
        <select
          id="checklist-type-select"
          value={selectedType?.id ?? ""}
          onChange={(event) => setSelectedTypeId(event.target.value)}
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {selectedType ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {visibleCount} item{visibleCount === 1 ? "" : "s"} on new jobs
              {selectedType.items.length > visibleCount
                ? ` (${selectedType.items.length - visibleCount} hidden)`
                : ""}
            </p>
            <ResetTemplateForm inspectionTypeId={selectedType.id} resetLabel={resetLabel} />
          </div>

          <ul className="space-y-3">
            {selectedType.items.map((item, index) => (
              <TemplateItemRow
                key={item.id}
                item={item}
                isFirst={index === 0}
                isLast={index === selectedType.items.length - 1}
              />
            ))}
          </ul>

          <AddItemForm inspectionTypeId={selectedType.id} />
        </div>
      ) : null}
    </section>
  );
}
