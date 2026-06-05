/** Minimum pilot companies explicitly requesting native apps before we prioritize iOS/Android builds. */
export const NATIVE_APP_PILOT_THRESHOLD = 5;

/** Field technician experience in Flareflow today — mobile web + PWA. */
export const FIELD_APP_CAPABILITIES = [
  "Mobile-first inspection UI — checklist, photos, signature, equipment register",
  "Installable PWA (Add to Home Screen) with standalone My jobs entry",
  "Offline checklist pass/fail, notes, and submit queue via IndexedDB — sync when back online",
  "Open assigned jobs once while online to cache them for basement / no-signal sites",
] as const;

/** Deferred until enough pilots ask — not building App Store / Play Store apps yet. */
export const FIELD_APP_NOT_INCLUDED = [
  "Native iOS or Android apps in the App Store / Google Play",
  "OS-level background GPS, native barcode SDKs, or device MDM packaging",
  `Dedicated native team before ${NATIVE_APP_PILOT_THRESHOLD}+ pilot companies request it`,
] as const;

/** Product stance for sales and settings copy. */
export const FIELD_APP_STRATEGY =
  "PWA + offline covers field technicians for early pilots; revisit native apps when demand is clear.";
