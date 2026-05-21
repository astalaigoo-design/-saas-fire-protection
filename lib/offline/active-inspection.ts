export const ACTIVE_INSPECTION_ID_KEY = "flareflow-active-inspection-id";

export function setActiveInspectionId(inspectionId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_INSPECTION_ID_KEY, inspectionId);
}

export function getActiveInspectionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_INSPECTION_ID_KEY);
}
