# Pilot checklist — one real client

Use this guide to onboard **one fire inspection company** (your tenant) on production. Paths range from **single-site** (one customer, one building, one inspection) to **multi-site CSV** (customers, buildings, equipment, and schedule in bulk).

**Production URL:** https://getflareflow.com

After sign-in, owners and admins see a **Get started** card on **Dashboard**. Its steps, links, and completion rules match [`lib/dashboard/onboarding.ts`](../lib/dashboard/onboarding.ts) — treat that file as the source of truth when the app and this doc differ.

**Typical paths:**

| Pilot size | What to use |
|------------|-------------|
| **Single site** | Add one building (or one customer + one building), schedule one job, run field inspect — skip optional equipment. |
| **Portfolio / PM** | Import customers (optionally with site columns), import buildings, optional equipment CSV, import schedule CSV. |

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
- [ ] After each deploy: `npm run db:migrate:status` → **up to date**; `npm run db:verify-schema` → all `OK` (see [PRODUCTION-MIGRATIONS.md](./PRODUCTION-MIGRATIONS.md)).
- [ ] Vercel env: `DATABASE_URL`, `DIRECT_URL`, Clerk keys, Supabase storage keys.
- [ ] Clerk: `getflareflow.com` added under **Domains**; webhook → `https://getflareflow.com/api/webhooks/clerk` with `CLERK_WEBHOOK_SIGNING_SECRET` in Vercel.
- [ ] **Email + CSV + equipment prerequisites** below (Resend, import order, migrations).
- [ ] Optional Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM` — technician assign/reschedule + day-of SMS (see Organization → Technician job alerts).
- [ ] Optional: remove leftover demo rows — `npm run db:check-demo` then `npm run db:cleanup-smoke` (dev/staging only if intentional; see script dry run without `--apply`).

---

## Prerequisites — email, CSV, and equipment

Complete **before** bulk import or promising quotes / compliance email to a pilot.

### 1. Database migrations (required for imports)

CSV and equipment features need current schema. On production (with `DIRECT_URL` in `.env`):

```bash
npm run db:migrate:status    # expect: Database schema is up to date!
npm run db:verify-schema     # expect: all OK
```

If anything is pending or `MISSING`, run `npm run db:migrate:deploy` and see [PRODUCTION-MIGRATIONS.md](./PRODUCTION-MIGRATIONS.md).

| Feature | Minimum migration |
|---------|-------------------|
| **Branches** + `branch` CSV column | `20260602120000_add_branches` |
| **Customers → Import CSV** | `branches` + `customers.branchId` |
| **Buildings → Import CSV** | `branches` (building import can create customers) |
| **Equipment register** + **Import equipment** | `20260607120000_add_building_assets` |
| Field equipment pass/fail on inspect | `20260609130000_add_inspection_asset_checks` |
| Barcode / QR on equipment rows | `20260611120000_add_building_asset_barcode` |
| **Calendar → Import schedule** | buildings + inspection types in DB (no extra migration) |
| Technician SMS + day-of | `20260608120000_user_phone_day_of_sms` |

### 2. Outbound email (Resend) — required for customer-facing mail

Set on Vercel Production:

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | API access |
| `REPORT_EMAIL_FROM` | From address, e.g. `reports@getflareflow.com` |

Also:

- Verify sending domain at [resend.com](https://resend.com) (**getflareflow.com**).
- **Organization → Outbound email** in the app should show configured (owner/admin).

**What needs email on file:**

| Flow | Recipient | Where to set |
|------|-----------|--------------|
| Post-inspection compliance PDF | Customer | Customer **email** (or `customer_email` in building CSV) |
| **Send quote** | Customer | Same customer email |
| Due / trial reminders (cron) | Owner/admin inboxes | Clerk sign-in email + Resend configured |
| Assign / reschedule job | Technician | **Organization → Team** email (or `technician_email` in schedule CSV) |

In-app bell notifications work **without** Resend. SMS is separate (Twilio). Pilots still need **customer email** on accounts they want to email.

### 3. Dashboard **Get started** checklist

The **Dashboard → Get started** card lists these steps in order (see [`lib/dashboard/onboarding.ts`](../lib/dashboard/onboarding.ts)). **Equipment** is the only step marked **Optional** — it does not block the progress bar.

| # | Step | Route | Counts as done when |
|---|------|-------|---------------------|
| 1 | Add your company logo | `/dashboard/settings` | Logo uploaded (shows on compliance PDFs). |
| 2 | Import customers from CSV | `/dashboard/customers/import` | At least one customer **or** building exists. |
| 3 | Or add a single customer | `/dashboard/customers/new` | Same as step 2 (either path satisfies both). |
| 4 | Import buildings from CSV | `/dashboard/buildings/import` | At least one building exists. |
| 5 | Or add a single building | `/dashboard/buildings/new` | Same as step 4. |
| 6 | Import equipment (CSV) or add on a site | `/dashboard/buildings/import-equipment` | **Optional** — at least one active equipment row. Links to first building’s **Equipment** tab when sites exist. |
| 7 | Import schedule from CSV | `/dashboard/jobs/import` | At least one inspection exists. |
| 8 | Or schedule one inspection | `/dashboard/jobs/new` | Same as step 7. |
| 9 | Run a field inspection on your phone | `/inspect/<id>` or `/dashboard/jobs` | At least one inspection **in progress** or **completed**. |

**Flexible order (within reason):**

- **Customers + sites in one file:** Customer import accepts optional `building_name`, `address_line1`, `city`, etc. per row — you can skip a separate building import when every site is in that file.
- **Building CSV creates customers:** Building import can create new customer names automatically; you do not have to run customer import first.
- **Preview before commit** on every CSV — fix branch typos and duplicates in preview.

**Branches:** create names under **Organization → Branches** before CSV if you use a `branch` column (omit column or use **Main** for a single office).

**CSV import reference (columns and migrations):**

1. **Customers → Import CSV** — `branch`, `customer`, optional `email`, `phone`, optional site columns (`building_name`, address fields, permit fields).
2. **Buildings → Import CSV** — `branch`, `customer`, `building_name`, address fields, optional `customer_email` / `customer_phone`.
3. **Buildings → Import equipment** (optional) — sites must exist; match `branch` + `customer` + `building_name` (or address).
4. **Calendar → Import schedule** — buildings + inspection types must exist; `inspection_type` codes (`annual`, `quarterly`, `monthly`) or exact Organization names; optional `technician_email`.

### 4. Equipment register (optional)

Equipment is **optional** in **Get started** — skip it for a minimal pilot unless the client tracks extinguishers, hydrants, etc.

**After buildings exist:**

- **Bulk:** **Buildings → Import equipment** (`/dashboard/buildings/import-equipment`) — up to 500 rows per file.  
  - `asset_type`: `fire_extinguisher`, `fire_alarm_panel`, `sprinkler_component`, `fire_hydrant`, `standpipe`, `emergency_light`, `hose_cabinet`, `other` (aliases like `extinguisher`, `hydrant` work in preview).
- **Single site:** Building detail → **Equipment** tab (`?tab=assets`) → **Add equipment** (location required; tag # and barcode optional).

**Field inspection:** open `/inspect/...` on a building with equipment — **Equipment register** section appears when `inspection_asset_checks` migration is applied. Scan QR/barcode or link checklist rows by tag in Organization → checklist templates.

---

## 1. Owner signs in

1. Open https://getflareflow.com/sign-up (or **Sign in** if the account already exists).
2. Create the owner account (email + password or Google, per your Clerk settings).
3. After sign-in you should land on **Dashboard** with the **Get started** checklist and nav including: **Dashboard**, **Customers**, **Buildings**, **Command center**, **Inspections**, **Calendar**, **Quotes**, **Invoices**, **Work orders**, **Parts**, **Reports**, and **Organization** (owners).

**First user on an empty database:** the Clerk webhook creates a bootstrap company and default inspection types (`annual`, `quarterly`, `monthly`).

**If dashboard is empty or role is wrong:**

New sign-ups are linked in the database **on first sign-in** (webhook optional). If you land on **Connect your workspace**, click **Connect workspace** — that runs the same provisioning without waiting for Clerk.

For an existing pilot owner, run (with production `.env` / Clerk secret):

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

## 2. Logo and customers (Get started steps 1–3)

### Company logo

1. **Organization** → upload **Company logo** (`/dashboard/settings`) — appears on compliance PDFs.
2. The **Get started** card marks this complete when a logo URL is saved.

### Import customers CSV (portfolios — customers only or customers + sites)

1. **Customers** → **Import CSV** (`/dashboard/customers/import`).
2. **Download template** — minimum columns: `branch`, `customer`, optional `email`, `phone`.
3. **Optional site columns on the same row:** `building_name`, `address_line1`, `city`, `region`, `postal_code`, permit fields — when present, FlareFlow creates the building during customer import (full address required).
4. Upload → **Preview import** → **Import**.

You do **not** need a separate building import when every site is included here.

### Single customer

1. **Customers** → **New customer** (`/dashboard/customers/new`).
2. Fill in name, email (for compliance PDF / quotes when Resend is on), optional phone → Save.

**Note:** **Buildings → Import CSV** can still create customers from new names if you skip customer import entirely.

---

## 3. Buildings and equipment (Get started steps 4–6)

Use **Get started** step 4 or 5 for buildings; step 6 (equipment) is **optional**.

### Import buildings CSV

1. **Buildings** → **Import CSV** (`/dashboard/buildings/import`).
2. **Download template** — columns include `branch`, `customer`, `building_name`, address fields, optional `customer_email` / `customer_phone`.
3. Fill rows (one building per row; repeat the same `customer` name across rows for one portfolio).
4. Upload → review preview → confirm import.

New `customer` names in the file are **created automatically** — no separate customer import required.

Requires migration `20260602120000_add_branches` if you use the `branch` column (defaults to **Main** when omitted).

### Single building

1. **Buildings** → **Add building** (`/dashboard/buildings/new`), or add from a customer profile.
2. Fill in name, full address, optional building type / fire district / notes → Save.

Confirm the site appears on the customer detail page and **Buildings** list.

### Equipment (optional)

See **§ Prerequisites — Equipment register** for bulk CSV and single-site **Equipment** tab (`?tab=assets`). Skip for a minimal single-inspection pilot.

---

## 4. Schedule inspections (Get started steps 7–8)

### Bulk — Import schedule CSV

1. **Calendar** → **Import schedule** (`/dashboard/jobs/import`).
2. Template: `branch`, `customer`, `building_name` (or address), `inspection_type`, `scheduled_date`, `scheduled_time`, optional `technician_email`, `recurrence` (`none` / `monthly` / `quarterly` / `annual`).
3. Preview → schedule (max 400 total visits per file; technicians notified when assigned).

Sites and inspection types must already exist. Use inspection type **codes** (`annual`, `quarterly`, `monthly`) or exact type names from Organization settings.

### Single visit

1. **Dashboard** → **Schedule inspection** (or **Calendar** → **Schedule one job**).
2. Select:
   - **Building** — the site from step 3.
   - **Inspection type** — e.g. **Annual Inspection**.
   - **Date & time** — when the visit is planned.
   - **Assign technician** — optional; leave unassigned if the owner will run the visit.
3. Submit.

The inspection should appear on **Inspections**, **Calendar**, and **Dashboard → Upcoming this week**.

---

## 5. Run the field inspection (Get started step 9)

1. From **Dashboard** (**Get started** links the next open job), **Calendar**, or **Inspections**, open the job (**Open inspection**).
   - URL shape: `https://getflareflow.com/inspect/<inspectionId>`
2. On a phone or narrow browser window:
   - Mark each checklist item **Pass**, **Fail**, or **N/A**.
   - If the building has an **equipment register**, mark each item **Pass**, **Fail**, or **N/A** (failed items need a note). **Pass** stamps last service on submit. Use **Scan QR / barcode** to jump to the matching register row. Checklist rows can also link by **equipment tag** (Settings → checklist template, or tag in the label); a passing linked row stamps the register on submit.
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

Matches **Get started** completion in [`lib/dashboard/onboarding.ts`](../lib/dashboard/onboarding.ts) (equipment optional):

- [ ] Owner signs in at https://getflareflow.com with full dashboard nav and **Get started** visible until complete.
- [ ] Company logo uploaded (**Organization**).
- [ ] At least one customer and building (real names; customer email for outbound mail).
- [ ] At least one inspection scheduled and **completed** with signature (field step done).
- [ ] Compliance PDF downloads from **Reports**.
- [ ] (Optional) Equipment register populated — bulk or per building.
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
| Send quote does nothing | Resend env + verified domain; customer **email** on record (see **§ Prerequisites — email**). |
| Equipment import: building not found | Import buildings first; `branch` / `customer` / `building_name` must match existing rows. |
| Schedule CSV: technician skipped | `technician_email` must match Organization → Team; assign manually if omitted. |
| Photos fail to upload | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, bucket `inspection-photos`. |
| User not in database / stuck on account setup | App now **auto-provisions on sign-in** (no webhook required). If still stuck: open `/account-setup` → **Connect workspace**. Ops: Clerk webhook → `https://getflareflow.com/api/webhooks/clerk` + `CLERK_WEBHOOK_SIGNING_SECRET`; `npm run fix-user -- <clerk_user_id> owner` as fallback. |

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
