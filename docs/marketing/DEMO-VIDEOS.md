# Marketing demo videos

Short clips for the homepage hero, feature cards, and a 30-day organic social series.

## Homepage embed

1. **Fastest:** run `npm run marketing:demo-video` (dev server required) — writes `public/marketing/demo/hero-field-inspection.webm` and the hero auto-plays it.
2. **Hosted:** set `NEXT_PUBLIC_MARKETING_HERO_VIDEO_URL` to a YouTube, Vimeo, or `/marketing/demo/*.mp4` URL in Vercel env.

Until a video exists, the hero shows a **live interactive preview** — real Pass/Fail controls on the NFPA checklist (no login).

## Per-clip env vars (optional)

| Env | Clip |
|-----|------|
| `NEXT_PUBLIC_MARKETING_CLIP_FIELD_URL` | Tap through checklist |
| `NEXT_PUBLIC_MARKETING_CLIP_REPORT_URL` | Submit → PDF |
| `NEXT_PUBLIC_MARKETING_CLIP_QUOTE_URL` | Failed item → quote |

## 30-day social series (repurpose homepage clips)

Use the same recordings; cut to 15–45s vertical. Posting order matches `lib/marketing/demo-videos.ts` (`socialSeriesDay`).

| Day | Topic | Hook |
|-----|-------|------|
| 1 | Field checklist | Swipe NFPA citations on your phone |
| 2 | Offline sync | “Saved locally — will sync” banner |
| 3 | Pass / Fail / N/A | Gloved-hand sized controls |
| 4 | Deficiency photos | Photo only on failed items |
| 5 | Pre-job brief | Site contact + prior deficiencies |
| 6 | Bulk N/A | Skip sections that don’t apply |
| 7 | Signature on glass | Finish the inspection in the truck |
| 8 | Compliance PDF | One submit → branded report |
| 9 | Report link | `/r/…` read-only for property managers |
| 10 | Email on submit | Report in the customer inbox |
| 11 | Certificate numbers | Jurisdiction settings |
| 12 | Command center | Overdue buildings at a glance |
| 13 | Open deficiencies | Track until re-inspection pass |
| 14 | Due reminders | 7-day email before due |
| 15 | Draft repair quote | Failed items → line items |
| 16 | Quote + report email | One send, two attachments |
| 17 | Customer accept link | `/q/…` no login |
| 18 | Schedule follow-up | One click after accept |
| 19 | Repair invoice | PDF from accepted quote |
| 20 | NFPA 25 pack | Sprinkler-specific cadences |
| 21 | NFPA 72 pack | Fire alarm section |
| 22 | Multi-branch | Owner filter vs tech scope |
| 23 | Equipment register | Due dates by asset |
| 24 | Work orders | Deficiency → owned → resolved |
| 25 | Portal scheduling | Customer picks a window |
| 26 | PWA install | Home-screen field app |
| 27 | Design partner | Shape the roadmap |
| 28 | 14-day trial | No card to start |
| 29 | Flat pricing | Whole company, one price |
| 30 | Full workflow | Schedule → inspect → report → quote |

## Recording tips

- Capture at **390×844** (iPhone viewport) — matches `npm run marketing:screenshots`.
- Keep each clip under **90 seconds**; hero demo targets **~45s**.
- Record in `/marketing-screenshot/field-inspection` for real UI, not mockups.
- Export WebM or MP4 to `public/marketing/demo/` or upload to YouTube/Vimeo unlisted.
