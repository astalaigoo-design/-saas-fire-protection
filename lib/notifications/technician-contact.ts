/** Whether assign/reschedule job emails can be delivered to this user. */
export function hasTechnicianJobAlertEmail(email: string | null | undefined): boolean {
  return Boolean(email?.trim());
}

/** Whether SMS job alerts can be sent (phone present; normalization happens at send time). */
export function hasTechnicianJobAlertPhone(phone: string | null | undefined): boolean {
  return Boolean(phone?.trim());
}

export type TechnicianContactGap = "email" | "phone";

export function technicianContactGaps(input: {
  role: string;
  email: string | null | undefined;
  phone: string | null | undefined;
}): TechnicianContactGap[] {
  if (input.role !== "technician") return [];
  const gaps: TechnicianContactGap[] = [];
  if (!hasTechnicianJobAlertEmail(input.email)) gaps.push("email");
  if (!hasTechnicianJobAlertPhone(input.phone)) gaps.push("phone");
  return gaps;
}
