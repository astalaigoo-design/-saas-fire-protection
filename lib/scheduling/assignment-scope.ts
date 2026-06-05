/** How inspection visits are assigned in Flareflow — one primary tech per job. */
export const JOB_ASSIGNMENT_CAPABILITIES = [
  "One assigned technician per inspection (optional unassigned until dispatch)",
  "Assign, reschedule, and reassign with email, SMS, and in-app alerts to that technician",
  "Calendar drag-and-drop, CSV import, and API schedule with a single technician column",
  "Work orders use the same single-assignee model",
] as const;

/** Multi-tech crews are rare for small contractors and complicate notify/sync — not built. */
export const JOB_ASSIGNMENT_NOT_INCLUDED = [
  "Multiple technicians on the same inspection visit (crew / helper / trainee)",
  "Split notifications or partial checklists per crew member on one job",
  "Crew lead vs assistant roles on a single visit",
] as const;

export const JOB_ASSIGNMENT_STRATEGY =
  "Schedule separate visits or duplicate jobs if two techs must work the same site — one assignee keeps alerts and My jobs simple.";
