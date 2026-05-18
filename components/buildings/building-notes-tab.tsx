"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addBuildingNote, type BuildingActionResult } from "@/lib/buildings/actions";
import type { BuildingDetailRecord } from "@/lib/buildings/queries";
import { formatDateTime } from "@/lib/dashboard/dates";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";

const initialState: BuildingActionResult = { ok: false, error: "" };

function AddNoteButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
      {pending ? "Adding…" : "Add note"}
    </Button>
  );
}

type BuildingNotesTabProps = {
  building: BuildingDetailRecord;
};

export function BuildingNotesTab({ building }: BuildingNotesTabProps) {
  const [state, formAction] = useFormState(addBuildingNote, initialState);

  return (
    <div className="space-y-6">
      {building.generalNotes ? (
        <Card>
          <CardContent className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">General notes</h3>
            <p className="whitespace-pre-wrap text-sm text-foreground">{building.generalNotes}</p>
            <p className="text-xs text-muted-foreground">
              Edit general notes from the building edit dialog.
            </p>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No general notes"
          description="Add site-wide notes when editing the building."
        />
      )}

      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-medium text-foreground">Add a note</h3>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="buildingId" value={building.id} />
            {state.ok === false && state.error ? (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="note-body" className="sr-only">
                Note
              </Label>
              <Textarea
                id="note-body"
                name="body"
                rows={3}
                required
                placeholder="Log a site visit, access issue, or follow-up…"
              />
            </div>
            <AddNoteButton />
          </form>
        </CardContent>
      </Card>

      <section>
        <h3 className="mb-3 font-medium text-foreground">Note history</h3>
        {building.notes.length === 0 ? (
          <EmptyState title="No notes in history yet" />
        ) : (
          <ul className="space-y-3">
            {building.notes.map((note) => (
              <li key={note.id}>
                <Card>
                  <CardContent className="space-y-2">
                    <p className="whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {note.authorName ? `${note.authorName} · ` : ""}
                      {formatDateTime(note.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
