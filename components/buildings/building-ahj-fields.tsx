import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type JurisdictionOption = {
  id: string;
  name: string;
  code: string;
};

type BuildingAhjFieldsProps = {
  idPrefix: string;
  jurisdictions?: JurisdictionOption[];
  jurisdictionId?: string | null;
  fireDistrict?: string | null;
  permitNumber?: string | null;
  permitExpiresAt?: Date | null;
};

export function BuildingAhjFields({
  idPrefix,
  jurisdictions = [],
  jurisdictionId,
  fireDistrict,
  permitNumber,
  permitExpiresAt,
}: BuildingAhjFieldsProps) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-medium text-foreground">
        AHJ / permit (optional)
      </legend>

      {jurisdictions.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-jurisdiction`}>Jurisdiction</Label>
          <select
            id={`${idPrefix}-jurisdiction`}
            name="jurisdictionId"
            defaultValue={jurisdictionId ?? ""}
            className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">None — enter fire district manually</option>
            {jurisdictions.map((jurisdiction) => (
              <option key={jurisdiction.id} value={jurisdiction.id}>
                {jurisdiction.name} ({jurisdiction.code})
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Selecting a jurisdiction sets certificate numbering and PDF form template for this
            site.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-fire-district`}>Fire district / jurisdiction</Label>
        <Input
          id={`${idPrefix}-fire-district`}
          name="fireDistrict"
          defaultValue={fireDistrict ?? ""}
          placeholder="e.g. Austin Fire Dept"
          className="min-h-11"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-permit-number`}>Permit / approval number</Label>
          <Input
            id={`${idPrefix}-permit-number`}
            name="permitNumber"
            defaultValue={permitNumber ?? ""}
            placeholder="AHJ permit or system approval ID"
            className="min-h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-permit-expires`}>Permit expires</Label>
          <Input
            id={`${idPrefix}-permit-expires`}
            name="permitExpiresAt"
            type="date"
            defaultValue={
              permitExpiresAt ? permitExpiresAt.toISOString().slice(0, 10) : undefined
            }
            className="min-h-11"
          />
        </div>
      </div>
    </fieldset>
  );
}
