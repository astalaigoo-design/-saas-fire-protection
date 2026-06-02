# GetFlareflow

Fire inspection operations platform — scheduling, field inspections, compliance PDFs, and customer report email.

**Stack:** Next.js 14 · TypeScript · Prisma · Supabase Postgres · Clerk · Tailwind / shadcn · Resend (optional)

## Quick start (clean machine)

```bash
git clone https://github.com/astalaigoo-design/-saas-fire-protection.git
cd -saas-fire-protection   # or your clone folder name
npm install
cp .env.example .env        # fill in values (see below)
npx prisma generate
npx prisma migrate deploy   # use empty DB; see troubleshooting if this fails
npm run build
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional after first run

```bash
npm run db:seed                      # demo customer, building, inspections
npm run storage:ensure-bucket        # Supabase bucket for inspection photos
npm run fix-user -- user_xxx owner   # link your Clerk user (see .env.example)
```

> **WARNING:** This script is for **DEVELOPMENT ONLY**. It links a Clerk user to a seeded database record by matching email. Never run this in production. In production, the Clerk webhook handles user creation automatically.

## Environment variables

Copy `.env.example` to `.env` and set:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (`pk_test_…`) |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (`sk_test_…`) |
| `DATABASE_URL` | Yes | Supabase transaction pooler (port 6543) |
| `DIRECT_URL` | Yes | Supabase session pooler (port 5432) for migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | For photos | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | For photos | Server-side storage uploads |
| `RESEND_API_KEY` | For auto-email | Post-submit PDF to customer |
| `REPORT_EMAIL_FROM` | For auto-email | Verified sender in Resend |
| `CRON_SECRET` | Production cron | Secures cron routes (Vercel sends `Authorization: Bearer …` on schedule): `GET /api/cron/due-reminders`, `GET /api/cron/trial-ending-reminders` |

Clerk user **public metadata** should include:

```json
{ "role": "owner", "companyId": "<your-company-cuid>" }
```

If `role` is omitted, new users default to **technician**. Production sign-up uses the Clerk webhook at `/api/webhooks/clerk` (see `.env.example`).
If no company exists yet, first sign-up auto-creates a bootstrap company and default inspection types (`annual`, `quarterly`, `monthly`).
Set `CLERK_BOOTSTRAP_COMPANY_NAME` to customize the initial company name.

## Deploy on Vercel

1. **Framework preset:** Next.js (leave **Output Directory** empty — do not set a custom path; Vercel uses `.next` automatically).
2. **Build command:** `npm run build` (runs `prisma generate && next build` — see `vercel.json`). CLI settings (migrations, seed) live in `prisma.config.ts` (Prisma 7–ready; replaces deprecated `package.json#prisma`).
3. **Environment variables:** Add all required vars from the table above for **Production** and **Preview**. Missing `DATABASE_URL`, `DIRECT_URL`, or Clerk keys will cause the build to fail and you will see *".next was not found"*. `DIRECT_URL` is used by Prisma Migrate via `prisma.config.ts`; the app runtime uses `DATABASE_URL` (pooler) in `lib/prisma.ts`.
4. **Clerk webhook URL:** `https://<your-domain>/api/webhooks/clerk` with `CLERK_WEBHOOK_SIGNING_SECRET`.
5. After deploy, run `npx prisma migrate deploy` against production (or apply migrations in CI) — the Vercel build does not migrate the database.
6. **Cron jobs:** Set `CRON_SECRET` (random string) in Production. `vercel.json` schedules both routes (middleware lists them as public so Clerk does not block Vercel’s cron requests):
   - **13:00 UTC** — `GET /api/cron/due-reminders` (inspections due in 7 days)
   - **13:15 UTC** — `GET /api/cron/trial-ending-reminders` (trial ending in 7 and 1 days; emails company owners)
   - **13:30 UTC** — `GET /api/cron/cleanup-idempotency` (delete expired idempotency rows)
   Requires `RESEND_API_KEY` and `REPORT_EMAIL_FROM`. Test manually: `npx vercel crons run /api/cron/trial-ending-reminders --prod` (or `due-reminders`).

If the build log shows `prisma generate` or `next build` errors, fix those first; the missing `.next` message is a symptom, not the root cause.

## Roles

- **Owner / Admin:** Dashboard, customers, buildings, calendar, inspections list, reports, settings (owner).
- **Technician:** Dashboard, my jobs → mobile inspect form at `/inspect/[id]`.

## Pilot onboarding

Step-by-step guide for one real client (owner login → customer → building → inspection → reports):

**[docs/PILOT.md](docs/PILOT.md)**

## Tests

```bash
npm test              # unit tests (Vitest)
npm run test:e2e      # Playwright: sign-up → inspect → public report
npm run test:e2e:ui   # Playwright UI mode
```

E2E requires Clerk **test** keys, `DATABASE_URL`, and uses `+clerk_test` emails (OTP `424242`). See `.env.example`.

## Troubleshooting

### `prisma migrate deploy` fails (column already exists / P3009)

The database was likely updated with `prisma db push` earlier. On a **fresh empty** database, `migrate deploy` should succeed. For an existing dev DB either:

- Reset the Supabase database and run `migrate deploy` once, or
- Mark migrations as applied: `npx prisma migrate resolve --applied <migration_folder_name>`

### Durable idempotency (offline replay)

Offline sync uses `x-idempotency-key` on write endpoints. In production/serverless this must be **durable**, so the app stores responses in the `idempotency_keys` table.

If your database is **not baselined** with Prisma migrations yet (you may see `P3005 The database schema is not empty`), you can still ensure the table exists with:

```bash
npm run db:ensure-idempotency
```

### EPERM on `prisma generate` (Windows)

Stop `npm run dev` and any Node processes, then run `npx prisma generate` again.

### Connection refused on localhost:3000

Only one dev server at a time. Run `npm run dev` and use the URL printed in the terminal.

### Building page 404

Open buildings from **Customers → building card**, not a literal `{buildingId}` in the URL.

### `Can't reach database server at x:5432` (or localhost)

Your **`DATABASE_URL` is wrong or still a placeholder**. Prisma is trying to connect to hostname `x` (or another invalid host), not Supabase.

1. Supabase Dashboard → **Project Settings** → **Database** → **Connect** → **ORMs** / URI.
2. Set **`DATABASE_URL`** to the **Transaction pooler** string (port **6543**, `?pgbouncer=true`).
3. Set **`DIRECT_URL`** to the **Session pooler** string (port **5432**) — used for migrations only.
4. Replace `[YOUR-PASSWORD]` with your real DB password. If the password contains `@`, `#`, or `%`, [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) it.
5. User must look like `postgres.abcdefghijklmnop` (project ref), not just `postgres`.
6. On **Vercel**, paste both URLs into **Environment Variables** for Production and Preview, then redeploy.
7. Verify locally: `npm run db:check` (alias: `npm run db:test`)

Example shape (use your host and ref from the dashboard):

```env
DATABASE_URL="postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:check` | Test `DATABASE_URL` / `DIRECT_URL` against Supabase |
| `npm run db:seed` | Seed demo data |
| `npm run db:backfill-share-tokens` | Assign `shareToken` on reports (and quotes with `--quotes`) missing public links |

## Rate limits

Middleware enforces limits before route handlers run:

| Route | Default | Key |
|-------|---------|-----|
| `/api/public/reports/*`, `/api/public/quotes/*` | 30 / min | Client IP |
| `/api/webhooks/clerk` | 300 / min | Global (Svix signature still required) |
| `/api/webhooks/paddle` | 300 / min | Global (Paddle signature still required) |

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` on Vercel so limits apply across all serverless instances (otherwise each instance has its own in-memory bucket). Override limits with `RATE_LIMIT_*` env vars (see `.env.example`).

## Monitoring (Sentry)

Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (see `.env.example`). Uncaught errors in API routes, Server Actions, and the React tree are reported automatically when a DSN is configured. Handled failures in critical paths also call `captureRouteError` / `captureServerActionError`.

On Vercel you can alternatively link **Monitoring** in the project dashboard; Sentry integration is recommended for Server Action and webhook visibility.
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |
