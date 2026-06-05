import { z } from "zod";
import { recurrenceFormValues } from "@/lib/scheduling/schemas";

export const SCHEDULE_IMPORT_MAX_ROWS = 200;
export const SCHEDULE_IMPORT_MAX_VISITS = 400;
export const SCHEDULE_IMPORT_MAX_BYTES = 512_000;

const HEADER_ALIASES: Record<string, string> = {
  branch: "branch",
  branch_name: "branch",
  office: "branch",
  customer: "customer",
  customer_name: "customer",
  building_name: "building_name",
  building: "building_name",
  site_name: "building_name",
  site: "building_name",
  address_line1: "address_line1",
  address1: "address_line1",
  street: "address_line1",
  city: "city",
  postal_code: "postal_code",
  zip: "postal_code",
  inspection_type: "inspection_type",
  type: "inspection_type",
  cadence: "inspection_type",
  scheduled_date: "scheduled_date",
  date: "scheduled_date",
  scheduled_time: "scheduled_time",
  time: "scheduled_time",
  technician_email: "technician_email",
  assigned_technician: "technician_email",
  technician: "technician_email",
  assignee: "technician_email",
  assignee_email: "technician_email",
  recurrence: "recurrence",
  notes: "notes",
};

export function canonicalizeScheduleImportHeader(header: string): string {
  return HEADER_ALIASES[header] ?? header;
}

export const scheduleImportRowSchema = z
  .object({
    branch: z.string().trim().max(100).optional().default(""),
    customer: z.string().trim().max(200).optional().default(""),
    building_name: z.string().trim().max(200).optional().default(""),
    address_line1: z.string().trim().max(200).optional().default(""),
    city: z.string().trim().max(100).optional().default(""),
    postal_code: z.string().trim().max(20).optional().default(""),
    inspection_type: z.string().trim().min(1, "Inspection type is required").max(80),
    scheduled_date: z.string().trim().min(1, "Scheduled date is required"),
    scheduled_time: z.string().trim().optional().default("09:00"),
    technician_email: z.string().trim().max(320).optional().default(""),
    recurrence: z.enum(recurrenceFormValues).optional().default("none"),
    notes: z.string().trim().max(2000).optional().default(""),
  })
  .superRefine((data, ctx) => {
    const hasCustomer = Boolean(data.customer.trim());
    const hasName = Boolean(data.building_name.trim());
    const hasAddress =
      Boolean(data.address_line1.trim()) &&
      Boolean(data.city.trim()) &&
      Boolean(data.postal_code.trim());
    if (!hasName && !hasAddress) {
      ctx.addIssue({
        code: "custom",
        message:
          "Provide building (or building_name) or address_line1 + city + postal_code to find the site.",
        path: ["building_name"],
      });
    }
    if (!hasCustomer && !hasName) {
      ctx.addIssue({
        code: "custom",
        message: "Without customer, building name is required and must be unique in the branch.",
        path: ["customer"],
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
    inspectionTypeInput: data.inspection_type,
    scheduledDate: data.scheduled_date,
    scheduledTime: data.scheduled_time,
    technicianEmail: data.technician_email.trim() || undefined,
    recurrence: data.recurrence,
    notes: data.notes.trim() || undefined,
  }));

export type ScheduleImportRow = z.infer<typeof scheduleImportRowSchema>;

export const scheduleImportActionSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("preview"),
    csv: z.string().max(SCHEDULE_IMPORT_MAX_BYTES, "CSV file is too large."),
  }),
  z.object({
    mode: z.literal("commit"),
    csv: z.string().max(SCHEDULE_IMPORT_MAX_BYTES, "CSV file is too large."),
  }),
]);
