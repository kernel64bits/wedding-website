# Epic 8 — QA & Testing

**Philosophy:** Test behaviour, not implementation. Unit tests cover security-critical logic and API contracts. We don't aim for 100% coverage — we aim to catch auth bypasses and API regressions that could expose guest data. Visual/integration testing is handled manually via Vercel preview deployments.

**Tooling:**
- **Vitest** — unit and API route tests (fast, native ESM, runs inside Docker)

**No browser-based E2E tests** (Playwright removed). Rationale: single developer, ~50 guests, Vercel preview deployments cover visual/integration testing manually. Browser tests add 200MB+ of dependencies and fragile maintenance for minimal value at this scale.

---

#### T8.0 — Dev CLI for manual testing
**Description:** A single CLI script (`scripts/dev.mjs`) with subcommands for common operations needed during manual local testing. Runs inside Docker: `docker compose exec app node scripts/dev.mjs <command>`. No external dependencies — uses Prisma client and the existing S3 client directly.

**Commands:**

| Command | What it does |
|---------|-------------|
| `guest:create --name "Alice Dupont"` | Creates invitation + primary attendee with a random token, prints the login URL |
| `guest:list` | Lists all invitations with name, token, RSVP status, and login URL |
| `guest:delete --token <token>` | Deletes invitation + attendees (cascade) |
| `photos:seed` | Seeds sample photos to MinIO (wraps existing `seed-photos.mjs`) |
| `photos:clear` | Removes all photos from the MinIO bucket |
| `settings:lock-rsvp` | Toggles `Settings.rsvpLocked` on/off, prints new state |
| `admin:reset-password --password <pw>` | Resets the admin account password |
| `help` | Lists available commands |

**Acceptance criteria:**
- Single file: `scripts/dev.mjs`
- All commands work via `docker compose exec app node scripts/dev.mjs <command>`
- `help` command lists all available subcommands with descriptions
- `guest:create` prints a ready-to-click `http://localhost:3000/api/login?token=...` URL
- No new npm dependencies
- Add a `"dev:cli"` script shortcut in `package.json` or document usage in README
- [ ] Post-ticket check: acceptance criteria verified
- [ ] Post-ticket check: code quality reviewed

---

#### T8.1 — Test infrastructure setup
**Description:** Install and configure Vitest inside the Docker container. No tests written yet — just the scaffolding and scripts.
**Acceptance criteria:**
- `vitest` added to `devDependencies` (install inside Docker)
- `vitest.config.ts` configured (environment: `node`, path aliases matching `tsconfig.json`)
- Scripts added to `package.json`:
  - `"test"`: `vitest run`
  - `"test:watch"`: `vitest`
- `tests/` directory created
- `npm run test` exits 0 with zero test files
- [ ] Post-ticket check: acceptance criteria verified
- [ ] Post-ticket check: code quality reviewed

---

#### T8.2 — Unit tests: session & auth utilities
**Description:** Unit tests for `lib/session.ts` — the HMAC signing/verification logic is security-critical and has no UI to validate it manually.
**Acceptance criteria:**

**`tests/session.test.ts`** covers:

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

- [ ] Post-ticket check: acceptance criteria verified
- [ ] Post-ticket check: code quality reviewed

---

#### T8.3 — API route tests: auth & access control
**Description:** Test every API route for correct authentication enforcement. Each endpoint is tested with three caller profiles: **no session**, **guest session**, and **admin session** — to ensure no restricted operation can be performed by an unauthorized caller.

**Acceptance criteria:**

**`tests/api-auth.test.ts`** — authentication matrix:

| Endpoint | No session | Guest session | Admin session |
|----------|-----------|---------------|---------------|
| `GET /api/login?token=valid` | 307 redirect, sets cookie | — | — |
| `GET /api/login?token=invalid` | 307 redirect to gate | — | — |
| `POST /api/logout` | clears cookie | clears cookie | — |
| `POST /api/rsvp` | 401 | 200 (own data) | 401 |
| `GET /api/photos/download?key=...` | 401 | 200 (streams photo) | 401 |
| `GET /api/admin/invitations` | 401 | 401 | 200 |
| `POST /api/admin/invitations` | 401 | 401 | 201 |
| `PATCH /api/admin/invitations/[id]` | 401 | 401 | 200 |
| `DELETE /api/admin/invitations/[id]` | 401 | 401 | 200 |
| `POST /api/admin/login` | 401 (bad creds) | — | — |
| `POST /api/admin/login` | 200 (good creds) | — | — |

**`tests/api-rsvp.test.ts`** — RSVP logic:
- Guest can submit RSVP for own invitation
- Guest cannot submit RSVP for another invitation (ownership check)
- RSVP with invalid attendee IDs → 400
- RSVP when `Settings.rsvpLocked = true` → 403

**`tests/api-download.test.ts`** — download validation:
- Valid key (`originals/photo.jpg`) → 200 with image data
- Invalid key (`../secret`) → 400
- Non-existent key → 404

**Test approach:**
- Call API routes directly using `fetch` against the running dev server, or use Vitest with Next.js test utilities
- Use existing seed data (`seed.mjs` + `seed-guests.mjs`) — no separate E2E seed needed
- Create valid session cookies programmatically using `createSessionValue()` / `createAdminSessionValue()` from `lib/session.ts`

- [ ] Post-ticket check: acceptance criteria verified
- [ ] Post-ticket check: code quality reviewed

---

#### T8.4 — GitHub Actions CI pipeline
**Description:** Run the test suite on every push to main and on pull requests.
**Depends on:** T8.1, T8.2, T8.3

**Acceptance criteria:**

**`.github/workflows/ci.yml`** — single job:
- Runs on: `ubuntu-latest`
- Trigger: push to `main`, any pull request
- Steps:
  - Checkout repo
  - Setup Node.js
  - `npm ci`
  - Set `SESSION_SECRET` from GitHub secret
  - `npx prisma generate`
  - `npm run test` (Vitest)

**GitHub secrets to configure:**
- `SESSION_SECRET` — HMAC signing key

**Branch protection:** require `unit-tests` to pass before merging to `main`.

- [ ] Post-ticket check: pipeline passes on clean push
- [ ] Post-ticket check: a failing test causes the pipeline to fail

---

#### T8.5 — Vercel preview deployment (preprod)
**Description:** Configure Vercel so that every push to a non-main branch creates a preview deployment using production infrastructure. This serves as the preprod environment for manual visual/integration testing before merging.

**Acceptance criteria:**

- Vercel project connected to the GitHub repo
- Preview deployments triggered automatically on non-main branches
- Environment variables configured per environment:
  - **Production** (`main`): production DB, production S3, real `SESSION_SECRET`
  - **Preview** (branches): staging DB, staging S3 bucket, separate `SESSION_SECRET`
- Preview URL pattern: `wedding-<hash>.vercel.app`
- Preview deployment uses the same runtime and edge network as production
- Document the preview workflow in README

**Database strategy for preview:**
- Separate staging database (same provider as production) seeded with realistic test data
- Prevents preview deployments from affecting real guest data
- Seed script runs automatically or is documented as a manual step

> This ticket depends on T7.0 (infrastructure decisions). Implement after the hosting stack is chosen.

- [ ] Post-ticket check: preview deployment works on a test branch
- [ ] Post-ticket check: preview uses staging DB, not production
