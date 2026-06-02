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

Continue with the field checklist: [PILOT.md](./PILOT.md) (customer → building → schedule → inspect).

After each production deploy, run [PRODUCTION-SMOKE-TEST.md](./PRODUCTION-SMOKE-TEST.md).

Owner nav should include **Organization**, **Billing** (read-only for admins), and full job/customer access.
