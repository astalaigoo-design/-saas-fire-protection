# Production smoke test (every deploy)

Quick pass after each **Production** deploy to https://getflareflow.com. Target **5–10 minutes**.

**Canonical checklist:** this file in the repo (`docs/PRODUCTION-SMOKE-TEST.md`). Copy sections into Notion if your team tracks deploys there — keep this file updated when flows change.

**Deeper pilot / first tenant:** [PILOT.md](./PILOT.md) · **New company setup:** [PILOT-ONBOARDING.md](./PILOT-ONBOARDING.md)

---

## Record the deploy

| Field | Value |
|-------|--------|
| Date / time (UTC) | |
| Deploy URL (Vercel) | |
| Git commit / branch | |
| Tester | |
| Result | Pass / Fail |

---

## 1. Deploy & database (ops)

- [ ] Vercel Production deploy **Ready** (build log shows `Prisma migrate deploy: success` or no pending migrations).
- [ ] No new Sentry issues spike in the first 15 minutes (if Sentry is enabled).
- [ ] Optional CLI (production `DIRECT_URL` in `.env`):

```bash
npm run db:migrate:status
# Expect: "Database schema is up to date!"
```

---

## 2. Public site (no sign-in)

Open in a private/incognito window.

| Check | URL | Expected |
|-------|-----|----------|
| Homepage loads | https://getflareflow.com | 200, hero + screenshots, no error overlay |
| Sign-in page | https://getflareflow.com/sign-in | Clerk sign-in UI loads |
| Terms / Privacy | `/terms`, `/privacy` | 200 |
| www redirect | https://www.getflareflow.com | Redirects to apex |

Optional curl (status codes only):

```bash
curl -s -o /dev/null -w "home %{http_code}\n" https://getflareflow.com/
curl -s -o /dev/null -w "sign-in %{http_code}\n" https://getflareflow.com/sign-in
curl -s -o /dev/null -w "cron %{http_code}\n" https://getflareflow.com/api/cron/due-reminders
```

Cron without auth should return **401** (not 307 to sign-in).

---

## 3. Auth & dashboard (owner or admin test account)

Use a dedicated **smoke** owner account (not a real client tenant if you can avoid it).

- [ ] Sign in at https://getflareflow.com/sign-in → lands on **Dashboard** (not `/account-setup` loop).
- [ ] Nav visible: Dashboard, Customers, Buildings, Inspections, Calendar, Reports (owner/admin).
- [ ] **Organization** opens (`/dashboard/settings`).
- [ ] **Billing** opens (`/dashboard/billing`) — trial banner or plan status renders (no crash).
- [ ] **Command center** opens (`/dashboard/operations`) if you ship ops features.

**Clerk metadata sanity** (if dashboard is empty or wrong role):

```bash
npm run pilot:verify-clerk -- <clerk_user_id>
```

---

## 4. One write path (pick any — proves API + billing + DB)

Only on a **test** company/customer, or skip if production is live-only.

- [ ] **Read:** Customers list loads; open one customer or building detail.
- [ ] **Write (light):** Add a building note or open schedule form (no need to complete full inspection).
- [ ] **Billing gate:** If testing on an expired-trial test company, a write action shows billing message (not a generic 500).

Full field flow (monthly release / major change): complete one inspection through **Done** on mobile width — see [PILOT.md § 4](./PILOT.md).

---

## 5. Public customer links (if this release touched quotes/reports)

Use an existing **sent** quote or **completed** inspection with a share link (from Reports).

- [ ] `/q/<token>` — quote page loads (not sign-in redirect).
- [ ] `/r/<token>` — report page loads + **View compliance PDF** returns PDF (200).
- [ ] Quote **Accept** / **Decline** buttons work on a test `sent` quote (optional).

---

## 6. Integrations (spot-check after env or billing changes)

Skip unless that area shipped in this deploy.

| Area | Quick check |
|------|-------------|
| Clerk webhook | New test sign-up gets `role` + `companyId` (or bootstrap company) |
| Resend | Send quote or submit inspection email on test row |
| Paddle | Billing page checkout / portal button (owner only) |
| Supabase photos | Upload one photo on a test inspection item |
| Crons | Vercel → Cron jobs show 3 paths; yesterday’s runs not all failed |

---

## 7. Sign-off

- [ ] All sections above **Pass** (or failures documented with Vercel/Sentry links).
- [ ] Failures filed / fix deployed or rolled back before announcing.

### If something fails

| Symptom | First check |
|---------|-------------|
| `MIDDLEWARE_INVOCATION_FAILED` / blank site | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` on Production |
| Dashboard error digest | Vercel logs, Sentry, `DATABASE_URL` / `DIRECT_URL` |
| 500 on writes | `npm run db:migrate:status`; build log for migrate deploy |
| Public `/q` or `/r` → sign-in | `middleware.ts` public routes; `shareToken` column |
| Cron 401 expected; 500 is not | `CRON_SECRET` set; route logs |

---

## Related commands

```bash
npm run db:migrate:status
npm run db:check-demo          # read-only; safe on production
npx vercel crons ls            # confirm 3 cron paths registered
```
