import { WorkOrderStatus } from "@prisma/client";
import { z } from "zod";

const workOrderStatusValues = [
  WorkOrderStatus.draft,
  WorkOrderStatus.scheduled,
  WorkOrderStatus.in_progress,
  WorkOrderStatus.completed,
  WorkOrderStatus.cancelled,
] as const;

export const createWorkOrderSchema = z.object({
  buildingId: z.string().cuid(),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  deficiencyId: z.string().cuid().optional().or(z.literal("")),
  quoteId: z.string().cuid().optional().or(z.literal("")),
  assignedToUserId: z.string().cuid().optional().or(z.literal("")),
  scheduledAt: z.string().trim().max(32).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const updateWorkOrderSchema = z.object({
  workOrderId: z.string().cuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  status: z.nativeEnum(WorkOrderStatus),
  assignedToUserId: z.string().cuid().optional().or(z.literal("")),
  scheduledAt: z.string().trim().max(32).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const addWorkOrderPartLineSchema = z.object({
  workOrderId: z.string().cuid(),
  partId: z.string().cuid().optional().or(z.literal("")),
  label: z.string().trim().min(1, "Line label is required").max(200),
  quantity: z
    .string()
    .trim()
    .transform((v) => {
      const n = Number.parseInt(v, 10);
      return Number.isInteger(n) && n >= 1 ? n : ("invalid" as const);
    }),
  unitCents: z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      if (!v) return 0;
      const n = Number.parseInt(v, 10);
      return Number.isInteger(n) && n >= 0 ? n : ("invalid" as const);
    }),
});

export const removeWorkOrderPartLineSchema = z.object({
  workOrderId: z.string().cuid(),
  lineId: z.string().cuid(),
});

export const technicianWorkOrderIdSchema = z.object({
  workOrderId: z.string().cuid(),
});

export const technicianWorkOrderNotesSchema = z.object({
  workOrderId: z.string().cuid(),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export { workOrderStatusValues };
