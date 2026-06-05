import { JobEquipmentPreview } from "@/components/inspect/job-equipment-preview";
import type { JobEquipmentPreviewRow } from "@/lib/inspect/job-equipment";

type JobEquipmentSectionProps = {
  buildingId: string;
  rows: JobEquipmentPreviewRow[];
};

export function JobEquipmentSection({ buildingId, rows }: JobEquipmentSectionProps) {
  return (
    <section
      className="max-w-lg rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="job-equipment-heading"
    >
      <h2 id="job-equipment-heading" className="text-sm font-semibold text-foreground">
        Equipment on this job
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {rows.length === 0
          ? "Add equipment on the building to show the register in the field app."
          : `${rows.length} active item${rows.length === 1 ? "" : "s"} on the building register — technicians mark pass/fail in the field; passed items update service dates on submit.`}
      </p>
      <div className="mt-4">
        <JobEquipmentPreview rows={rows} buildingId={buildingId} variant="dashboard" />
      </div>
    </section>
  );
}
