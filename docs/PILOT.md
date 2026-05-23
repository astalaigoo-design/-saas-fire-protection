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

Complete these once per environment:

- [ ] `npx prisma migrate deploy` on production (quotes/reports need current schema).
- [ ] Vercel env: `DATABASE_URL`, `DIRECT_URL`, Clerk keys, Supabase storage keys.
- [ ] Clerk: `getflareflow.com` added under **Domains**; webhook → `https://getflareflow.com/api/webhooks/clerk` with `CLERK_WEBHOOK_SIGNING_SECRET` in Vercel.
- [ ] Resend: `getflareflow.com` verified; `RESEND_API_KEY` + `REPORT_EMAIL_FROM` on Vercel (for post-submit email and **Send quote**).
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

---

## 2. Add one real customer

1. **Dashboard** → **New customer** (or **Customers** → **New customer**).
2. Fill in:
   - **Name** — client business name (e.g. `Acme Property Group`).
   - **Email** — real inbox (used for compliance PDF and quote email when Resend is configured).
   - **Phone** — optional.
3. Save.

You should see the customer on **Customers**.

---

## 3. Add one building

1. **Customers** → open the customer you just created.
2. Add a building (or **Buildings** → **New building** and select that customer).
3. Fill in:
   - **Name** — e.g. `Main campus` or street name.
   - **Address** — full address (city, state, ZIP).
   - **Building type / fire district / notes** — optional.
4. Save.

Confirm the building appears on the customer detail page and **Buildings** list.

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

1. Invite a second user (Clerk sign-up or invite).
2. Set Clerk public metadata:

```json
{
  "role": "technician",
  "companyId": "<same company id as owner>"
}
```

3. Assign them on the next **Schedule inspection** form.
4. They use **Dashboard → Inspections** (or **My jobs** if only technician role) → **Open inspection**.

---

## Pilot success criteria

- [ ] Owner signs in at https://getflareflow.com with full dashboard nav.
- [ ] One customer + one building exist (real names, real customer email).
- [ ] One inspection scheduled and completed with signature.
- [ ] Compliance PDF downloads from **Reports**.
- [ ] (Optional) Failed item → draft quote → save pricing → send email.

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| 404 on `/dashboard` when signed out | Expected — sign in at `/sign-in`. |
| No Customers / Buildings nav | Role is `technician`; set `owner` or `admin` in Clerk metadata. |
| “Repair quotes temporarily unavailable” | Run `npx prisma migrate deploy` on production. |
| Send quote does nothing | `RESEND_API_KEY`, `REPORT_EMAIL_FROM`, verified domain; customer email set. |
| Photos fail to upload | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, bucket `inspection-photos`. |
| User not in database | Clerk webhook URL + `CLERK_WEBHOOK_SIGNING_SECRET`; check Vercel function logs. |

---

## Related commands

```bash
npm run db:check-demo      # Read-only counts (safe on production)
npm run db:cleanup-smoke   # Remove smoke-test customers (use with care)
npm run db:seed            # Dev only — demo Riverside data; do not use on production pilot
```
