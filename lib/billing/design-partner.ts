/** Shown in billing UI when the company is flagged as a design partner. */
export const DESIGN_PARTNER_ACCESS_MESSAGE =
  "Design partner — complimentary access during the pilot.";

export function shouldShowPaidCheckout(designPartner: boolean): boolean {
  return !designPartner;
}
