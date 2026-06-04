import { describe, expect, it } from "vitest";
import {
  hasTechnicianJobAlertEmail,
  technicianContactGaps,
} from "@/lib/notifications/technician-contact";

describe("technician-contact", () => {
  it("detects missing email", () => {
    expect(hasTechnicianJobAlertEmail(null)).toBe(false);
    expect(hasTechnicianJobAlertEmail("  ")).toBe(false);
    expect(hasTechnicianJobAlertEmail("tech@example.com")).toBe(true);
  });

  it("lists gaps for technicians only", () => {
    expect(
      technicianContactGaps({
        role: "technician",
        email: null,
        phone: "+15551234567",
      }),
    ).toEqual(["email"]);
    expect(
      technicianContactGaps({
        role: "admin",
        email: null,
        phone: null,
      }),
    ).toEqual([]);
  });
});
