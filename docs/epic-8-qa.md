# Epic 8 — QA & Testing

**Philosophy:** Test behaviour, not implementation. Unit tests cover pure logic that can break silently; E2E tests cover critical user flows end-to-end. We don't aim for 100% coverage — we aim to catch the failures that actually hurt guests.

**Tooling:**
- **Vitest** — unit/integration tests (fast, native ESM, no Jest config overhead)
- **Playwright** — E2E tests (runs against the live Docker dev server)

---

#### T8.1 — Test infrastructure setup
**Description:** Install and configure Vitest and Playwright. No tests written yet — just the scaffolding, scripts, and CI hooks.
**Acceptance criteria:**
- `vitest` + `@vitest/coverage-v8` added to `devDependencies`
- `vitest.config.ts` configured (environment: `node`, path aliases matching `tsconfig.json`)
- `playwright` + `@playwright/test` added to `devDependencies`
- `playwright.config.ts` configured:
  - `baseURL`: `http://localhost:3000`
  - `webServer`: starts the Docker dev server if not already running (or documents manual start requirement)
  - Browsers: Chromium only (sufficient for a private site)
- Scripts added to `package.json`:
  - `"test"`: `vitest run`
  - `"test:watch"`: `vitest`
  - `"test:e2e"`: `playwright test`
  - `"test:e2e:ui"`: `playwright test --ui`
- `tests/` directory structure created:
  ```
  tests/
  ├── unit/          ← Vitest unit tests
  └── e2e/           ← Playwright E2E tests
  ```
- Both `npm run test` and `npm run test:e2e` exit 0 with zero test files (no failures on empty suite)
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

#### T8.2 — Unit tests: session & auth utilities
**Description:** Unit tests for `lib/session.ts` — the HMAC signing/verification logic is security-critical and has no UI to validate it manually.
**Acceptance criteria:**

**`tests/unit/session.test.ts`** covers:

*Guest session:*
- `createSessionValue()` returns a string in `base64url.hex` format
- `verifyGuestToken()` returns a valid `GuestSession` for a fresh token
- `verifyGuestToken()` returns `null` for an expired token (`expiresAt` in the past)
- `verifyGuestToken()` returns `null` if the signature is tampered (flip one char)
- `verifyGuestToken()` returns `null` for a completely invalid string
- `verifyGuestToken()` returns `null` for an empty string

*Admin session:*
- `createAdminSessionValue()` returns a valid token
- `verifyAdminToken()` returns a valid `AdminSession` for a fresh token
- `verifyAdminToken()` returns `null` for expired / tampered tokens (same cases as above)

*Cross-contamination:*
- A guest token is rejected by `verifyAdminToken()`
- An admin token is rejected by `verifyGuestToken()`

> `SESSION_SECRET` must be set in the Vitest environment (`process.env.SESSION_SECRET = 'test-secret'` in setup or `vitest.config.ts` env block).

- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

#### T8.3 — E2E tests: guest flows
**Description:** Playwright tests covering the end-to-end guest journey. Requires the app and database to be running (Docker dev server).
**Acceptance criteria:**

**`tests/e2e/guest-auth.spec.ts`**
- Visiting `/{locale}` without a session shows the gate page
- Visiting `/{locale}/home` without a session redirects to `/{locale}` (gate)
- `GET /api/login?token=<valid-token>` sets a cookie and redirects to `/{locale}/invitation` (first visit) or `/{locale}/home` (returning visit)
- `GET /api/login?token=invalid` redirects to gate with `?error=invalid_token`
- `POST /api/logout` clears the session cookie and redirects to gate

**`tests/e2e/guest-rsvp.spec.ts`**
- Authenticated guest can load the RSVP page
- Form pre-fills with existing RSVP data (if already submitted)
- Submitting a valid RSVP returns a success confirmation
- RSVP is locked when `Settings.rsvpLocked = true` (submit button disabled or error shown)

**`tests/e2e/guest-navigation.spec.ts`**
- Authenticated guest can navigate to: home, info, rsvp, seating, invitation
- Active nav link is highlighted
- Language switcher changes locale and stays on the equivalent page

**Test data strategy:**
- Use a dedicated test invitation seeded into the dev DB (`token: "e2e-test-token"`)
- Seed script: `prisma/seed-e2e.ts` (separate from the main seed, safe to re-run)
- Playwright `globalSetup` calls the seed script before the test suite

- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

#### T8.4 — E2E tests: admin flows
**Description:** Playwright tests for the admin panel. Depends on T5.1 (admin login) being implemented.
**Acceptance criteria:**

**`tests/e2e/admin-auth.spec.ts`**
- Visiting `/admin/guests` without admin session redirects to `/admin/login`
- Valid admin username + password → redirects to `/admin/guests`
- Invalid credentials → error message shown, no redirect
- Admin session expires after 8 hours (verify cookie `maxAge`)

**`tests/e2e/admin-guests.spec.ts`**
- Guest list page loads and displays at least one invitation (the E2E seed data)
- Search by name filters the list
- Clicking a row opens the side sheet with invitation details

**`tests/e2e/middleware.spec.ts`** *(regression suite for T2.6)*
- Guest cookie → `/fr/home` accessible
- Guest cookie → `/fr/dev/styles` redirected to `/admin/login` (production mode only)
- Admin cookie → `/fr/dev/styles` accessible
- No cookie → `/fr/anything-unknown` redirected to `/fr` (gate)
- No cookie → `/fr` accessible (gate page rendered)

**Test data strategy:**
- Seed an admin account (`email: "test@admin.com"`, known bcrypt hash) via `prisma/seed-e2e.ts`

- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

#### T8.5 — GitHub Actions CI pipeline
**Description:** Set up a GitHub Actions workflow that runs the full test suite automatically on every push and pull request. The pipeline runs without Docker — tests execute directly on GitHub's Ubuntu runners.
**Depends on:** T8.1, T8.2, T8.3, T8.4

**Acceptance criteria:**

**`.github/workflows/ci.yml`** with two jobs:

*`unit-tests` job:*
- Runs on: `ubuntu-latest`
- Trigger: push to `main`, any pull request
- Steps:
  - Checkout repo
  - Setup Node.js (match version in `package.json` `engines` field)
  - `npm ci`
  - Set `SESSION_SECRET` from GitHub secret
  - `npm run test` (Vitest)
  - Upload coverage report as artifact

*`e2e-tests` job:*
- Runs on: `ubuntu-latest`
- Steps:
  - Checkout repo + `npm ci`
  - `npx playwright install --with-deps chromium`
  - Create `.env` from GitHub secrets (`DATABASE_URL=file:./dev.db`, `SESSION_SECRET`, `BASE_URL=http://localhost:3000`)
  - `npx prisma db push`
  - `node prisma/seed.mjs` + `node prisma/seed-e2e.mjs`
  - Start Next.js: `npm run dev &` + wait for `localhost:3000`
  - `npm run test:e2e`
  - Upload Playwright HTML report as artifact on failure

**GitHub secrets to configure (document in README):**
- `SESSION_SECRET` — HMAC signing key

**Branch protection recommendation:** require `unit-tests` to pass before merging to `main`.

- [ ] Post-ticket check: pipeline passes on clean push to main
- [ ] Post-ticket check: a failing test causes the pipeline to fail
- [ ] Post-ticket check: Playwright report artifact visible in GitHub Actions UI on failure
