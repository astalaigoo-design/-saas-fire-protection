/** Days before trialEndsAt to email company owners. */
export const TRIAL_ENDING_REMINDER_DAYS = [7, 1] as const;

export type TrialEndingReminderDays = (typeof TRIAL_ENDING_REMINDER_DAYS)[number];
