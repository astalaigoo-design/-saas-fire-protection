# Pilot checklist — one real client

Use this guide to onboard **one fire inspection company** (your tenant) with **one real customer**, **one building**, and **one inspection** on production.

**Production URL:** https://getflareflow.com

## Terms

| Term | Meaning |
|------|---------|
| **Company** | Your inspection business (tenant). Shown under the dashboard title. |
| **Customer** | A client you inspect for (property manager, site owner). |
| **Building** | A physical site with an address. |
| **Inspection** | A scheduled or completed visit with a checklist. |

---

## Before you start (ops)

**New tenant (one command):** see [PILOT-ONBOARDING.md](./PILOT-ONBOARDING.md) — `npm run pilot:onboard` creates the company, sets design partner, links or invites the owner, and verifies Clerk metadata.

Complete these once per environment:

- [ ] Production DB baselined: `npm run db:baseline-migrations -- --verify --yes` (once), then deploys run `migrate deploy` automatically.
- [ ] After each deploy: `npm run db:migrate:status` and `npm run db:verify-schema` (see [PRODUCTION-MIGRATIONS.md](./PRODUCTION-MIGRATIONS.md)).
- [ ] Vercel env: `DATABASE_URL`, `DIRECT_URL`, Clerk keys, Supabase storage keys.
- [ ] Clerk: `getflareflow.com` added under **Domains**; webhook → `https://getflareflow.com/api/webhooks/clerk` with `CLERK_WEBHOOK_SIGNING_SECRET` in Vercel.
- [ ] Resend: `getflareflow.com` verified; `RESEND_API_KEY` + `REPORT_EMAIL_FROM` on Vercel (for post-submit email and **Send quote**).
- [ ] Optional Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM` — technician assign/reschedule + day-of SMS (see Organization → Technician job alerts).
- [ ] Optional: remove leftover demo rows — `npm run db:check-demo` then `npm run db:cleanup-smoke` (dev/staging only if intentional; see script dry run without `--apply`).

---

## 1. Owner signs in

1. Open https://getflareflow.com/sign-up (or **Sign in** if the account already exists).
2. Create the owner account (email + password or Google, per your Clerk settings).
3. After sign-in you should land on **Dashboard** with nav: Dashboard, Customers, Buildings, Inspections, Calendar, Reports.

**First user on an empty database:** the Clerk webhook creates a bootstrap company and default inspection types (`annual`, `quarterly`, `monthly`).

**If dashboard is empty or role is wrong:**

New sign-ups should get both fields automatically via the Clerk webhook (`user.created`). For an existing pilot owner, run (with production `.env` / Clerk secret):

```bash
npm run fix-user -- <clerk_user_id> owner
```

Optional: `FIX_COMPANY_ID=<cuid>` if the user belongs to a specific company (not the demo tenant).

That links the user in Postgres **and** sets Clerk **public metadata**:

```json
{
  "role": "owner",
  "companyId": "<your-company-cuid>"
}
```

**Manual alternative:** [Clerk Dashboard](https://dashboard.clerk.com) → **Users** → **Public metadata** → paste the JSON above.

Then **sign out and sign in again** at https://getflareflow.com.

To find `companyId`: `npm run db:studio` → `Company` table → copy `id` for your company row.

**Rename an existing tenant (e.g. leave Demo Co.):** sign in as **owner** → **Organization** in the nav → set **Company name** to your real business name → **Save**.

**Create a separate real company + link owner:**

```bash
npm run pilot:onboard -- "Your Fire Inspection LLC" --design-partner --clerk-user <clerk_user_id> --verify
```

Or step-by-step: `npm run create-company -- "Your Fire Inspection LLC" <clerk_user_id> owner`

---

## 2. Add customers (CSV import or one-by-one)

### Multi-account — Import customers CSV (recommended for PM portfolios)

1. **Customers** → **Import CSV** (`/dashboard/customers/import`).
2. **Download template** — columns: `branch`, `customer`, optional `email`, `phone`.
3. Upload → **Preview import** (branch column resolves to Organization branches) → **Import N customers**.
4. Duplicates (same name in branch) show as **duplicate** in preview — fix the file or skip those rows.

Then import buildings (§3) so each row’s `customer` name matches an account already in FlareFlow.

### Single customer — New customer

1. **Customers** → **New customer**.
2. Fill in name, email (for compliance PDF / quotes when Resend is on), optional phone → Save.

Building CSV import can still **create customers** from the building file if you skip this step — use customer import when you want the roster separate from sites.

---

## 3. Add buildings (CSV import or one-by-one)

Most property managers onboard **many sites at once**. The dashboard checklist matches that path.

### Multi-site — Import CSV (recommended)

1. **Buildings** → **Import CSV** (`/dashboard/buildings/import`).
2. **Download template** — columns include `branch`, `customer`, `building_name`, address fields, optional `customer_email` / `customer_phone`.
3. Fill rows (one building per row; repeat the same `customer` name across rows for one portfolio).
4. Upload → review preview → confirm import.

Building CSV can still **create customers** when names are new — prefer **§2 Import customers** when you are loading dozens of property managers first.

Requires migration `20260602120000_add_branches` if you use the `branch` column (defaults to **Main** when omitted).

### Single site — Add one building

1. **Customers** → open the customer you created (or **Customers** → **New customer** first).
2. **Buildings** → **Add building** (or add from the customer page).
3. Fill in name, full address, optional building type / fire district / notes → Save.

Confirm the site appears on the customer detail page and **Buildings** list.

### Equipment register (optional, common for PM pilots)

1. Open a building → **Equipment** tab (or use the onboarding link with `?tab=assets`).
2. **Add equipment** — type, location (required), tag #, manufacturer, service dates, notes.
3. Save; repeat for a few assets to demo the register.

Requires migration `20260607120000_add_building_assets` on production (`npm run db:migrate:deploy`).

---

## 4. Schedule one inspection

1. **Dashboard** → **Schedule inspection** (or **Calendar** / **Inspections** → schedule flow).
2. Select:
   - **Building** — the site from step 3.
   - **Inspection type** — e.g. **Annual Inspection**.
   - **Date & time** — when the visit is planned.
   - **Assign technician** — optional; leave unassigned if the owner will run the visit.
3. Submit.

The inspection should appear on **Inspections**, **Calendar**, and **Dashboard → Upcoming this week**.

---

## 5. Run the field inspection (mobile-friendly)

1. From **Dashboard** or **Inspections**, open the job (**Open inspection**).
   - URL shape: `https://getflareflow.com/inspect/<inspectionId>`
2. On a phone or narrow browser window:
   - Mark each checklist item **Pass**, **Fail**, or **N/A**.
   - For **Fail**, enter a short failure note (required).
   - Optional: **Add photo** per item.
3. Scroll down → **Sign** in the signature area.
4. Tap **Submit & lock inspection**.

After submit:

- Status becomes **completed**.
- A compliance report is generated (see **Reports**).
- If any items **failed**, a **draft repair quote** is created (after quote migrations are applied).

---

## 6. Verify back office

| Step | Where | Expected |
|------|--------|----------|
| Compliance PDF | **Reports** → **Download compliance PDF** | PDF downloads |
| Draft quote | **Reports** → **Draft repair quotes** | Appears when inspection had failed items |
| Pricing | Open draft quote → **Pricing** → **Save pricing** | Totals update |
| Send quote | **Send quote to customer** | Email sends when Resend + customer email are set |
| Customer email | Customer record email | Matches Resend recipient |

---

## 7. Optional — add a technician

1. **Dashboard → Organization** → **Team** → enter email → **Technician** → **Send invite** (pick **branch** if you have multiple locations).
2. They accept the Clerk email and sign up; `role` and `companyId` are set automatically.
3. Set their **mobile (SMS)** on the team row or ask them to save it on **My jobs** (for Twilio alerts).
4. Assign them on the next **Schedule inspection** form.
5. They use **My jobs** (technician home) or **Open inspection** — assign/reschedule sends in-app bell + email + SMS when configured.

**Manual fallback:** Clerk Dashboard → invite user, then set public metadata:

```json
{
  "role": "technician",
  "companyId": "<same company id as owner>"
}
```

---

## Pilot success criteria

- [ ] Owner signs in at https://getflareflow.com with full dashboard nav.
- [ ] One customer + one building exist (real names, real customer email).
- [ ] One inspection scheduled and completed with signature.
- [ ] Compliance PDF downloads from **Reports**.
- [ ] (Optional) Failed item → draft quote → save pricing → send email → customer accepts on `/q/…` → re-inspection auto-schedules (or **Schedule re-inspection** in Reports / acceptance email).

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| 404 on `/dashboard` when signed out | Expected — sign in at `/sign-in`. |
| No Customers / Buildings nav | Role is `technician`; set `owner` or `admin` in Clerk metadata. |
| “Repair quotes temporarily unavailable” | Run `npm run db:migrate:status`; baseline or `npm run db:migrate:deploy` on production. |
| Building **Equipment** tab errors | Migration `20260607120000_add_building_assets` — see [PRODUCTION-MIGRATIONS.md](./PRODUCTION-MIGRATIONS.md). |
| CSV import fails / branch column | Migrations for `branches` + `customers.branchId`; use **Main** or match Organization branch names. |
| Send quote does nothing | `RESEND_API_KEY`, `REPORT_EMAIL_FROM`, verified domain; customer email set. |
| Photos fail to upload | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, bucket `inspection-photos`. |
| User not in database | Clerk webhook URL + `CLERK_WEBHOOK_SIGNING_SECRET`; check Vercel function logs. |

---

## Related docs

- **Every deploy:** [PRODUCTION-SMOKE-TEST.md](./PRODUCTION-SMOKE-TEST.md) — 5–10 minute production pass
- **New tenant:** [PILOT-ONBOARDING.md](./PILOT-ONBOARDING.md)

## Related commands

```bash
npm run db:migrate:status  # Pending migrations?
npm run db:migrate:deploy  # Apply pending (production DIRECT_URL in .env)
npm run db:verify-schema   # building_assets, branches, etc.
npm run db:check-demo      # Read-only counts (safe on production)
npm run db:cleanup-smoke   # Remove smoke-test customers (use with care)
npm run db:seed            # Dev only — demo Riverside data; do not use on production pilot
```
