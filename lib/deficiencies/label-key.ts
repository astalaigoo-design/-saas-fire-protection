/** Normalize checklist labels for matching across re-inspection visits. */
export function deficiencyLabelKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}
