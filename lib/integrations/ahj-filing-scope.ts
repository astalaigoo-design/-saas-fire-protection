/** What Flareflow provides for AHJ electronic filing — not built-in municipal portals. */
export const AHJ_FILING_CAPABILITIES = [
  "Jurisdiction + permit metadata on buildings and compliance PDFs",
  "report.finalized webhook with certificate number, AHJ fields, and public PDF URL",
  "Partner middleware can map each jurisdiction to its fire marshal portal or API",
] as const;

/** Each AHJ portal differs — implemented per partner, not in core Flareflow. */
export const AHJ_FILING_NOT_INCLUDED = [
  "Built-in submission to city/county fire marshal e-filing portals",
  "Universal AHJ form library or automatic portal authentication",
  "Flareflow-operated filing service — use a certified integration partner instead",
] as const;

export const AHJ_FILING_WEBHOOK_EVENT = "report.finalized" as const;
