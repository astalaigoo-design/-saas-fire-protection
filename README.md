# Saas Fire Protection

Vertical SaaS for fire inspection companies — scheduling, field inspections, compliance PDFs, and customer report email.

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

Clerk user **public metadata** should include:

```json
{ "role": "owner", "companyId": "<your-company-cuid>" }
```

If `role` is omitted, new users default to **technician**. Production sign-up uses the Clerk webhook at `/api/webhooks/clerk` (see `.env.example`).

## Roles

- **Owner / Admin:** Dashboard, customers, buildings, calendar, inspections list, reports, settings (owner).
- **Technician:** Dashboard, my jobs → mobile inspect form at `/inspect/[id]`.

## Troubleshooting

### `prisma migrate deploy` fails (column already exists / P3009)

The database was likely updated with `prisma db push` earlier. On a **fresh empty** database, `migrate deploy` should succeed. For an existing dev DB either:

- Reset the Supabase database and run `migrate deploy` once, or
- Mark migrations as applied: `npx prisma migrate resolve --applied <migration_folder_name>`

### EPERM on `prisma generate` (Windows)

Stop `npm run dev` and any Node processes, then run `npx prisma generate` again.

### Connection refused on localhost:3000

Only one dev server at a time. Run `npm run dev` and use the URL printed in the terminal.

### Building page 404

Open buildings from **Customers → building card**, not a literal `{buildingId}` in the URL.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |
