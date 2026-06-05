import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BuildingAhjFieldsProps = {
  idPrefix: string;
  fireDistrict?: string | null;
  permitNumber?: string | null;
  permitExpiresAt?: Date | null;
};

export function BuildingAhjFields({
  idPrefix,
  fireDistrict,
  permitNumber,
  permitExpiresAt,
}: BuildingAhjFieldsProps) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-medium text-foreground">
        AHJ / permit (optional)
      </legend>
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
