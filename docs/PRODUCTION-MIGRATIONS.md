# Production database migrations

How to keep **getflareflow.com** Postgres in sync with the app after each deploy.

---

## Rule

**Every production deploy** must apply pending Prisma migrations before (or as part of) the release.

| Method | When |
|--------|------|
| **Automatic** | Vercel build on project `saas-fire-protection` runs `node scripts/db/migrate-deploy.mjs` (see `scripts/vercel-build.mjs`) |
| **Manual** | If build skipped migrations, deploy failed, or you use a second DB — run locally with production `DIRECT_URL` |

```bash
# From repo root with production DIRECT_URL (or DATABASE_URL) in .env
npm run db:migrate:status
# Expect: "Database schema is up to date!"

npm run db:migrate:deploy
# Applies pending migrations only

npm run db:verify-schema
# Spot-checks critical tables/columns exist
```

**Use `DIRECT_URL` (session / port 5432)** for migrate commands when Supabase pooler is in `DATABASE_URL`. Migrations need a direct connection.

**One-time baseline** (legacy DBs that predated Prisma Migrate history):

```bash
npm run db:baseline-migrations -- --verify --yes
```

Only run baseline once per database; do not repeat on a healthy `_prisma_migrations` table.

---

## After deploy checklist (ops)

1. Vercel Production build log → `Prisma migrate deploy: success` (or no pending).
2. `npm run db:migrate:status` → up to date.
3. `npm run db:verify-schema` → all lines `OK`.
4. [PRODUCTION-SMOKE-TEST.md](./PRODUCTION-SMOKE-TEST.md) — app smoke pass.

---

## Recent migrations (what they unlock)

| Migration | Feature in the app |
|-----------|-------------------|
| `20260602120000_add_branches` | Multi-location branches, customer `branchId`, owner location filter |
| `20260604120000_add_checklist_templates` | Organization → checklist templates per inspection type |
| `20260605120000_add_staff_notifications` | In-app notification bell; technician assign alerts |
| `20260606120000_add_deficiencies` | Deficiencies workflow, command center tab, building deficiencies |
| `20260607120000_add_building_assets` | **Equipment** tab on building detail (`building_assets` table) |
| `20260609130000_add_inspection_asset_checks` | Field **Equipment register** on `/inspect/...` (per-asset pass/fail + service stamp) |
| `20260608120000_user_phone_day_of_sms` | Technician mobile + Twilio SMS + day-of cron |

If a migration is missing, typical symptoms:

| Missing | Symptom |
|---------|---------|
| `branches` | Customer create / settings crash; branch filter errors |
| `checklist_template_items` | Organization checklist editor 500 |
| `staff_notifications` | Notification bell error |
| `deficiencies` | Operations / building deficiencies 500 |
| `building_assets` | Building **Equipment** tab 500 or empty errors |
| `users.phone` / `technicianDayOfSmsSentAt` | SMS features no-op or Prisma errors |

---

## Pilot-facing features (docs)

These require migrations above — see [PILOT.md](./PILOT.md):

- **Branches** — Organization → Branches; branch on customers and team
- **CSV building import** — Buildings → **Import CSV** (`/dashboard/buildings/import`)
- **CSV equipment import** — Buildings → **Import equipment** (`/dashboard/buildings/import-equipment`)
- **Equipment register** — Building detail → **Equipment** tab (extinguishers, panels, QR/barcode scan + labels)
- **Deficiencies** — Failed items → tracked deficiencies (command center)
- **Technician SMS** — Twilio env + mobile on My jobs (optional)

---

## Do not run on production pilot tenants

```bash
npm run db:seed          # Demo Riverside data — dev only
npm run db:cleanup-smoke # Deletes smoke-test customers — only with dry run review
```

---

## Related

- [PILOT.md](./PILOT.md) — first customer walkthrough  
- [PILOT-ONBOARDING.md](./PILOT-ONBOARDING.md) — new company  
- [PRODUCTION-SMOKE-TEST.md](./PRODUCTION-SMOKE-TEST.md) — post-deploy smoke  
