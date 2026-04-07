# Epic 7 — Production Readiness

#### T7.0 — Infrastructure & hosting design *(design ticket — outcome is implementation sub-tickets)*

**Description:** Decide on the full hosting stack before implementation begins. This ticket has no code output — its deliverable is a set of concrete decisions documented here, and the creation of the resulting implementation tickets (T7.0.a through T7.0.x). Nothing in Epic 7 should be implemented before this ticket is resolved.

**Questions to answer:**

| Concern | Options | Decision |
|---------|---------|----------|
| **App hosting** | Vercel (zero-config Next.js), Railway (container, simple), Fly.io (container, more control) | TBD |
| **Database** | Keep SQLite on a persistent volume, or migrate to PostgreSQL (managed: Supabase, Railway, Neon) | TBD |
| **Photo/media storage** | Cloudinary (free tier, transform API), Cloudflare Images, S3/R2, self-hosted in `/public` | TBD |
| **CDN access control** | Public URLs (rely on obscurity + app auth), or signed URLs generated server-side | TBD |
| **Email provider** | Resend (simple API, generous free tier), Postmark, AWS SES | TBD |
| **Secrets management** | Platform env vars (Vercel / Railway dashboard), or external vault | TBD |
| **Public git repo** | What goes in git vs. stays out (photos, `.env`, `dev.db`) | Keep photos on CDN, secrets in env vars, DB file gitignored — safe to make repo public |

**Constraints to factor in:**
- Site is private-only (all routes auth-gated) — no SEO, no CDN edge caching needed for pages
- ~50–200 guests, low traffic — no need to over-engineer scale
- SQLite is fine for this load; PostgreSQL only if the chosen host makes it cheaper/easier than managing a persistent volume
- Photos should never be committed to git regardless of repo visibility
- `dev.db` and `.env` are already gitignored — repo is safe to make public once photo storage is resolved

**Acceptance criteria:**
- All decisions in the table above are filled in
- The following implementation tickets exist and are scoped (add them to this file):
  - T7.0.a — App deployment setup (CI/CD, environment variables, domain)
  - T7.0.b — Database migration for production (if switching from SQLite)
  - T7.0.c — Photo storage setup (CDN account, upload workflow, replace Unsplash placeholders)
    > **Decision for T7.0.c:** Photo downloads currently proxy through Next.js (`getPhotoStream` in `lib/storage.ts`) to avoid Docker hostname issues in dev. In production, consider switching to presigned S3 URLs or CloudFront for direct browser-to-S3 downloads — removes server load from download traffic. Re-add `@aws-sdk/s3-request-presigner` if going that route.
  - T7.0.d — Email provider integration (replace `console.log` stub in `POST /api/request-link`)
- [ ] Post-ticket check: all decisions documented, implementation tickets created

---

#### T7.1 — Harden and ship

**Description:** Final pass before going live. Remove all dev tooling from the production build, add security headers, and run a basic pentest checklist. Nothing should be shipped without this ticket done.

---

**7.1.a — Remove / gate dev-only features**

| Item | What to do |
|------|-----------|
| Next.js dev indicator (bottom-left button) | Disappears automatically in `next build` — verify it's gone |
| Next.js error overlay | Disappears automatically in production — verify |
| `/[locale]/dev/styles` route | Delete the page, or return 404 in production via `if (process.env.NODE_ENV !== 'development') notFound()` |
| `console.log` / `console.error` calls in app code | Audit all files; keep only intentional server-side error logs |
| Port 5555 (Prisma Studio) in `docker-compose.yml` | Remove from production compose or use a separate `docker-compose.prod.yml` |
| Test seed token `test-token-123` | Must not exist in production DB; document "never run seed in prod" |

> Note: T2.6 adds middleware-level admin gating for `/[locale]/dev/*` routes, which supersedes the `notFound()` approach above for access control. Both can coexist: middleware blocks access, `notFound()` provides a clean 404 fallback.

---

**7.1.b — Security headers**

Add to `next.config.ts` via `headers()`:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` — prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` — HTTPS only, 2-year cache |
| `Content-Security-Policy` | Start permissive, tighten per page: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com` |

Verify with [securityheaders.com](https://securityheaders.com) after deploy.

---

**7.1.c — Rate limiting**

No npm package needed — use a simple in-memory sliding window (sufficient for a private wedding site with ~100 guests):

| Endpoint | Limit | Why |
|----------|-------|-----|
| `GET /api/login` | 10 req / 15 min per IP | Token brute-force |
| `POST /api/request-link` | 3 req / hour per IP | Email abuse |
| `POST /api/logout` | 10 req / min per IP | Low risk, just sanity |
| `POST /api/rsvp` | 20 req / min per IP | Spam prevention |
| `POST /admin/login` | 5 req / 15 min per IP | Password brute-force |

Implement as a small `lib/rate-limit.ts` using a `Map<string, {count, resetAt}>` in module scope.

> Note: module-scope state resets on cold start. For a 100-guest site this is fine. On multi-instance deploys, use Redis (out of scope).

---

**7.1.d — Pentest checklist (manual)**

Run through these before go-live:

**Authentication & session**
- [ ] Tampered session cookie is rejected (flip a byte in the signature)
- [ ] Expired session cookie is rejected (manually set `expiresAt` to past)
- [ ] Token with 1 char difference → gate page, not 500
- [ ] `/api/login` with no token param → gate page, not 500
- [ ] Session cookie has `HttpOnly`, `Secure`, `SameSite=Lax` in production (check DevTools)
- [ ] Admin cookie does not grant access to guest routes and vice versa

**Access control**
- [ ] Hitting `/fr/home` without a cookie → redirected to `/fr` (gate)
- [ ] Hitting `/admin/guests` without admin cookie → redirected to `/admin/login`
- [ ] `/admin/guests` returns 302 (not 200 with a login form) when unauthenticated — prevents content leakage
- [ ] Guest A's invitation ID cannot be used to read Guest B's data (check RSVP API)

**Information leakage**
- [ ] API errors return generic messages (no stack traces, no Prisma error details)
- [ ] `/api/login?token=wrong` response body reveals nothing about whether the token format is valid
- [ ] `X-Powered-By: Next.js` header is absent (add `poweredByHeader: false` to `next.config.ts`)

**Input validation**
- [ ] RSVP dietary restrictions field: try 10 000-character string → rejected with 400
- [ ] Attendee `name` field: try `<script>alert(1)</script>` → stored as plain text, rendered escaped (React handles this automatically)
- [ ] `POST /api/rsvp` with an `invitationId` not belonging to the session → rejected

**Infrastructure**
- [ ] `.env` is not served as a static file (request `/.env`, `/.env.local`)
- [ ] `prisma/dev.db` is not served (request `/dev.db`)
- [ ] `node_modules` is not served
- [ ] Prisma Studio (port 5555) is not reachable from outside the server

---

**7.1.e — Environment & deployment checklist**

- [ ] `NODE_ENV=production` in production environment
- [ ] `SESSION_SECRET` is at least 64 hex chars (32 bytes entropy) — generated with `openssl rand -hex 32`
- [ ] `SESSION_SECRET` is NOT the example value
- [ ] Admin account seeded with a strong password (≥16 chars, not a dictionary word)
- [ ] `DATABASE_URL` points to the correct production database file (or PostgreSQL)
- [ ] SQLite file is on a persistent volume (not wiped on container restart)
- [ ] `poweredByHeader: false` in `next.config.ts`
- [ ] `next build` completes with no TypeScript errors and no lint errors

---

**7.1.f — Prisma schema hardening**

| Item | What to do |
|------|-----------|
| Missing cascade rules | ✅ `onDelete: Cascade` on `Attendee → Invitation` — done. Add `onDelete: SetNull` for `Invitation.tableNumber` → `Table` if/when a foreign key is introduced, so deleting a table doesn't orphan invitations |
| Missing database indexes | Add `@@index([email])` on `Invitation` for email lookups (used by request-link). Add `@@index([token])` if Prisma doesn't already optimize the `@unique` constraint for lookups |
| No `Settings` singleton guard | Ensure the seed script creates the `Settings` singleton row; document that exactly one row must exist |

---

**7.1.g — Next.js config hardening**

| Item | What to do |
|------|-----------|
| `poweredByHeader` | Set `poweredByHeader: false` in `next.config.ts` to suppress the `X-Powered-By: Next.js` header |
| Remote image domains | Audit `images.remotePatterns` — remove `unsplash.com` / `pexels.com` if not used in production; add only the domains actually needed |

---

**7.1.h — Docker production readiness**

| Item | What to do |
|------|-----------|
| Single-stage Dockerfile | Add a multi-stage build: `deps` stage for `npm ci --omit=dev`, `builder` stage for `next build`, `runner` stage with only production artifacts — reduces final image size and removes dev tooling |
| Dev command in CMD | Change `CMD ["npm", "run", "dev"]` to `CMD ["node", "server.js"]` (or `next start`) in production; use `docker-compose.override.yml` for dev |
| Prisma Studio port | Port 5555 is exposed in `docker-compose.yml` — remove from production compose or move to a `docker-compose.dev.yml` override |

---

**7.1.i — Miscellaneous production issues**

| Item | What to do |
|------|-----------|
| Hardcoded couple names | Replace "Sophie & John" and "Juin 2026" in `app/[locale]/(dashboard)/layout.tsx` footer with translation keys from `messages/{locale}.json` |
| Non-functional admin logout | `app/admin/layout.tsx` has `<a href="#">Logout</a>` — wire it to `POST /api/logout` (admin variant) |
| Hardcoded confetti colors | `components/invitation/Confetti.tsx` uses hardcoded hex colors — derive from the active theme tokens or make configurable via `lib/theme.config.ts` |
| Dev route `/[locale]/dev/confetti` | Not listed in 7.1.a — also gate or remove this route alongside `/dev/styles` |

---

**7.1.k — Handle stale session cookies (deleted invitations)**

**Description:** If an invitation is deleted while the guest still has a valid session cookie, the HMAC signature passes but the `invitationId` no longer exists in the database. This causes the gate page to redirect to `/fr/home` (session looks valid), but dashboard pages may crash or show empty data.

**Fix:** In the dashboard layout (`app/[locale]/(dashboard)/layout.tsx`), verify the invitation still exists in the DB. If not, clear the cookie and redirect to the gate page. This is a defensive check — in normal usage invitations aren't deleted, but it prevents confusing behavior if one is removed while a guest is logged in.

**Acceptance criteria:**
- [ ] Dashboard layout checks that `session.invitationId` exists in DB
- [ ] If invitation is missing: clear `wedding_session` cookie, redirect to gate
- [ ] Verified by: login, delete invitation via admin/CLI, refresh dashboard → lands on gate page
- [ ] Post-ticket check: code quality reviewed

---

**7.1.j — Security audit report**

**Description:** Generate a comprehensive report of all implemented security features, controls, and configurations across the application. The goal is to have a single document the project owner can review to verify the site meets security standards.

**Report should cover:**

| Section | Contents |
|---------|----------|
| **Authentication** | Session mechanism (HMAC-SHA256, Web Crypto), cookie flags (HttpOnly, Secure, SameSite), session durations (guest: 30d, admin: 8h), password hashing (bcryptjs, cost 12) |
| **Authorization** | Middleware route protection (allowlist + default deny), server-side session checks in layouts/API routes, ownership validation in RSVP endpoint |
| **Input validation** | Which endpoints validate what, max lengths, type checks |
| **Transport security** | HSTS header, Secure cookie flag, HTTPS enforcement |
| **Information leakage prevention** | Generic error messages, `poweredByHeader: false`, no stack traces in responses |
| **Rate limiting** | Per-endpoint limits (from T7.1.c) |
| **Infrastructure** | Static file protection (.env, dev.db not served), Prisma Studio not exposed, Docker hardening |
| **Dependencies** | List of all runtime dependencies with purpose and known CVE status |
| **Known limitations** | No CSRF tokens (mitigated by SameSite), no WAF, in-memory rate limiting (resets on cold start) |

**Deliverable:** `docs/security-report.md` — a living document updated whenever security-relevant changes are made.

**Acceptance criteria:**
- [ ] Report covers all sections above
- [ ] Each security control references the relevant file/line
- [ ] Known limitations are honestly documented
- [ ] Report reviewed by project owner

---

**Acceptance criteria:**
- Dev indicator and styles page are gone in production build
- All security headers present and verified via securityheaders.com
- Rate limiting active on all listed endpoints
- All pentest checklist items pass
- `next build` is clean (zero type errors, zero lint warnings)
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized
