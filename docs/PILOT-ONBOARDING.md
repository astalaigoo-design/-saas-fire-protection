# Pilot onboarding (admin)

One-command setup for a new fire inspection tenant on production or staging.

**Requires:** `.env` with `DATABASE_URL`, `DIRECT_URL`, `CLERK_SECRET_KEY`, and `NEXT_PUBLIC_APP_URL` (or production URL).

---

## One command (recommended)

### Owner already has a Clerk account (signed up once)

```bash
npm run pilot:onboard -- "Acme Fire Protection" --design-partner --clerk-user user_xxxxxxxx --verify
```

This will:

1. Create the company + default inspection types (annual, quarterly, monthly)
2. Set `designPartner=true` (complimentary pilot — no Paddle checkout)
3. Link the Clerk user as **owner** in Postgres and set Clerk **public metadata**
4. Verify metadata and DB membership

Tell the owner to **sign out and sign in** at https://getflareflow.com.

### Owner does not have an account yet (email invite)

```bash
npm run pilot:onboard -- "Acme Fire Protection" --design-partner --invite owner@acme.com
```

Clerk sends an invitation. Metadata (`role`, `companyId`) is applied when they complete sign-up.

After they sign up, find their user id in [Clerk Dashboard](https://dashboard.clerk.com) → Users, then:

```bash
npm run pilot:verify-clerk -- user_xxxxxxxx
```

---

## Step-by-step (manual)

| Step | Command |
|------|---------|
| Create company + link owner | `npm run create-company -- "Acme Fire Protection" user_xxx owner` |
| Design partner flag | `npm run mark-design-partner -- <companyId>` |
| Fix metadata only | `FIX_COMPANY_ID=<cuid> npm run fix-user -- user_xxx owner` |
| Verify | `npm run pilot:verify-clerk -- user_xxx` |
| Invite owner (existing company) | `npm run pilot:invite-owner -- <companyId> owner@acme.com` |

---

## Clerk public metadata (must match)

```json
{
  "role": "owner",
  "companyId": "<company-cuid-from-Postgres>"
}
```

Set automatically by `pilot:onboard`, `create-company`, `fix-user`, and owner **invitations**.

**Manual check:** Clerk Dashboard → Users → Public metadata.

**CLI check:**

```bash
npm run pilot:verify-clerk -- user_xxxxxxxx
npm run pilot:verify-clerk -- user_xxxxxxxx --company-id <cuid>
```

---

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run pilot:onboard` | Company + design partner + link or invite + optional verify |
| `npm run pilot:verify-clerk` | Confirm Clerk metadata + DB membership |
| `npm run pilot:invite-owner` | Invitation for an existing `companyId` |
| `npm run create-company` | Company only (+ optional link user) |
| `npm run mark-design-partner` | Toggle `designPartner` on existing company |
| `npm run fix-user` | Link user + sync Clerk metadata |
| `npm run sync-user-clerk-metadata` | Re-sync metadata from DB row |

---

## Env shortcuts

```bash
PILOT_COMPANY_NAME="Acme Fire Protection" \
PILOT_CLERK_USER_ID=user_xxx \
PILOT_DESIGN_PARTNER=1 \
npm run pilot:onboard -- --verify
```

---

## After onboarding

1. **Apply and verify production schema** (required before CSV or equipment):

```bash
npm run db:migrate:status   # Database schema is up to date!
npm run db:migrate:deploy   # if anything pending (use DIRECT_URL)
npm run db:verify-schema    # all OK
```

See [PRODUCTION-MIGRATIONS.md](./PRODUCTION-MIGRATIONS.md) if anything is `MISSING`.

2. **Configure outbound email** before promising quotes or compliance PDFs:

   - Vercel: `RESEND_API_KEY`, `REPORT_EMAIL_FROM` (verified **getflareflow.com** domain).
   - Owner checks **Organization → Outbound email** shows configured.
   - Import **customer email** in Customers CSV (or per customer) before **Send quote**.

3. **CSV + equipment path** — [PILOT.md § Prerequisites](./PILOT.md#prerequisites--email-csv-and-equipment):

   | Order | Action |
   |-------|--------|
   | 1 | Organization → **Branches** (if multi-location) |
   | 2 | **Customers → Import CSV** (`email` column for mail later) |
   | 3 | **Buildings → Import CSV** |
   | 4 | **Import equipment** (optional; buildings must exist) |
   | 5 | **Calendar → Import schedule** (`technician_email` optional) |

4. Continue the field checklist: [PILOT.md](./PILOT.md) → inspect → Reports.

5. After each production deploy, run [PRODUCTION-SMOKE-TEST.md](./PRODUCTION-SMOKE-TEST.md).

Owner nav should include **Organization** (branches, checklist templates, outbound email), **Customers → Import CSV**, **Buildings → Import CSV**, **Import equipment**, building **Equipment** tab, **Billing** (read-only for admins), and full job/customer access.
