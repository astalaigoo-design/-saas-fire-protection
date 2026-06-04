import { AssetType } from "@prisma/client";
import { z } from "zod";

export const ASSET_IMPORT_MAX_ROWS = 500;
export const ASSET_IMPORT_MAX_BYTES = 512_000;

const HEADER_ALIASES: Record<string, string> = {
  branch: "branch",
  branch_name: "branch",
  office: "branch",
  customer: "customer",
  customer_name: "customer",
  building_name: "building_name",
  site_name: "building_name",
  site: "building_name",
  address_line1: "address_line1",
  address1: "address_line1",
  street: "address_line1",
  city: "city",
  postal_code: "postal_code",
  zip: "postal_code",
  asset_type: "asset_type",
  equipment_type: "asset_type",
  type: "asset_type",
  tag_number: "tag_number",
  tag: "tag_number",
  asset_id: "tag_number",
  location_on_site: "location",
  site_location: "location",
  manufacturer: "manufacturer",
  model: "model",
  serial_number: "serial_number",
  serial: "serial_number",
  last_service_at: "last_service_at",
  last_service: "last_service_at",
  next_service_due: "next_service_due",
  next_service: "next_service_due",
  notes: "notes",
};

export function canonicalizeAssetImportHeader(header: string): string {
  return HEADER_ALIASES[header] ?? header;
}

const ASSET_TYPE_ALIASES: Record<string, AssetType> = {
  fire_extinguisher: AssetType.fire_extinguisher,
  extinguisher: AssetType.fire_extinguisher,
  fe: AssetType.fire_extinguisher,
  fire_alarm_panel: AssetType.fire_alarm_panel,
  panel: AssetType.fire_alarm_panel,
  alarm_panel: AssetType.fire_alarm_panel,
  sprinkler_component: AssetType.sprinkler_component,
  sprinkler: AssetType.sprinkler_component,
  riser: AssetType.sprinkler_component,
  emergency_light: AssetType.emergency_light,
  emergency_lighting: AssetType.emergency_light,
  exit_light: AssetType.emergency_light,
  hose_cabinet: AssetType.hose_cabinet,
  hose: AssetType.hose_cabinet,
  other: AssetType.other,
};

export function parseAssetTypeFromImport(value: string): AssetType | null {
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!key) return null;
  return ASSET_TYPE_ALIASES[key] ?? null;
}

export const assetImportRowSchema = z
  .object({
    branch: z.string().trim().max(100).optional().default(""),
    customer: z.string().trim().min(1, "Customer is required").max(200),
    building_name: z.string().trim().max(200).optional().default(""),
    address_line1: z.string().trim().max(200).optional().default(""),
    city: z.string().trim().max(100).optional().default(""),
    postal_code: z.string().trim().max(20).optional().default(""),
    asset_type: z.string().trim().min(1, "Equipment type is required").max(80),
    tag_number: z.string().trim().max(80).optional().default(""),
    location: z.string().trim().min(1, "Location on site is required").max(200),
    manufacturer: z.string().trim().max(120).optional().default(""),
    model: z.string().trim().max(120).optional().default(""),
    serial_number: z.string().trim().max(120).optional().default(""),
    last_service_at: z.string().trim().max(30).optional().default(""),
    next_service_due: z.string().trim().max(30).optional().default(""),
    notes: z.string().trim().max(5000).optional().default(""),
  })
  .superRefine((data, ctx) => {
    const hasName = Boolean(data.building_name.trim());
    const hasAddress =
      Boolean(data.address_line1.trim()) &&
      Boolean(data.city.trim()) &&
      Boolean(data.postal_code.trim());
    if (!hasName && !hasAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Provide building_name or address_line1 + city + postal_code to find the site.",
        path: ["building_name"],
      });
    }
    if (!parseAssetTypeFromImport(data.asset_type)) {
      ctx.addIssue({
        code: "custom",
        message:
          "Unknown equipment type. Use fire_extinguisher, fire_alarm_panel, sprinkler_component, emergency_light, hose_cabinet, or other.",
        path: ["asset_type"],
      });
    }
  })
  .transform((data) => ({
    branch: data.branch,
    customer: data.customer,
    buildingName: data.building_name.trim() || undefined,
    addressLine1: data.address_line1.trim() || undefined,
    city: data.city.trim() || undefined,
    postalCode: data.postal_code.trim() || undefined,
    assetType: parseAssetTypeFromImport(data.asset_type)!,
    tagNumber: data.tag_number.trim() || undefined,
    location: data.location,
    manufacturer: data.manufacturer.trim() || undefined,
    model: data.model.trim() || undefined,
    serialNumber: data.serial_number.trim() || undefined,
    lastServiceAt: data.last_service_at.trim() || undefined,
    nextServiceDue: data.next_service_due.trim() || undefined,
    notes: data.notes.trim() || undefined,
  }));

export type AssetImportRow = z.infer<typeof assetImportRowSchema>;

export const assetImportActionSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("preview"),
    csv: z.string().max(ASSET_IMPORT_MAX_BYTES, "CSV file is too large."),
  }),
  z.object({
    mode: z.literal("commit"),
    csv: z.string().max(ASSET_IMPORT_MAX_BYTES, "CSV file is too large."),
  }),
]);
