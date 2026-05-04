# Epic 11 — Bug Fixes & Code Review Findings

Bugs and issues identified during code review (2026-04-07). Ordered by severity.

---

#### T11.1 — Login route hardcodes `/fr` locale

**Severity:** High — affects every non-French guest
**File:** `app/api/login/route.ts:10,24-25`

**Problem:** The login API redirects all guests to `/fr/invitation` or `/fr/home` regardless of their language preference. A guest scanning a QR code in an English context always lands on the French page. The error redirect also hardcodes `/fr?error=invalid_token`.

**Fix:** Detect locale from `Accept-Language` header, a `locale` query param on the login URL, or fall back to `routing.defaultLocale`. Update `lib/qrcode.ts` if the login URL format changes.

**Status:** ✅ Done — `pickLocale()` now parses `Accept-Language` and picks the best supported tag, defaulting to `routing.defaultLocale`.

---

#### T11.2 — Missing DELETE route for admin invitations

**Severity:** High — admin feature is broken
**File:** `components/admin/guest-list-client.tsx:155`

**Problem:** The admin guest list UI calls `DELETE /api/admin/invitations/${selectedId}` but there is no corresponding route handler. The request 404s silently (the catch block only logs to console).

**Fix:** Add a `DELETE` handler in `app/api/admin/invitations/[id]/route.ts` that verifies admin session, cascade-deletes attendees, and removes the invitation.

**Status:** ⬜ Todo

---

#### T11.3 — RSVP form allows submission with null attending status

**Severity:** Medium — silent data issue
**File:** `components/rsvp-form.tsx:248`

**Problem:** If a guest never clicks "Attending" or "Not attending" for a pre-registered attendee, `states[a.id].attending` remains `null`. On submit, this is coerced to `false` via `?? false`, making the guest appear as "declined" without an explicit choice.

**Fix:** Validate that every attendee has an explicit `attending` value before allowing submission. Show a visual hint on attendees that haven't made a choice.

**Status:** ✅ Done — submit button is disabled and a hint message is shown until every pre-registered attendee (and the plus-one if enabled) has an explicit `attending` value. The API already required `typeof attending === "boolean"`; an equivalent check was added for the plus-one path.

---

#### T11.4 — CryptoKey re-imported on every session operation

**Severity:** Low — performance
**File:** `lib/session.ts:33-41`

**Problem:** `getCryptoKey()` calls `crypto.subtle.importKey()` on every sign/verify operation. Unlike the Prisma client and S3 client which are cached as singletons, the CryptoKey is recreated each time.

**Fix:** Cache the CryptoKey in a module-level variable or on `globalThis`, similar to the existing singleton patterns.

**Status:** ⬜ Todo

---

#### T11.5 — `useEffect` dependency array suppresses exhaustive-deps warning

**Severity:** Low — potential stale data
**File:** `components/admin/guest-list-client.tsx:83-95`

**Problem:** The `useEffect` depends only on `selectedId` but reads `selectedInv` (derived from `invitations`). After `router.refresh()` updates the invitation list, the effect won't re-run, so the edit form may show stale data (e.g., old table number).

**Fix:** Add `selectedInv?.tableNumber` to the dependency array, or compute `editTableNumber` as a derived value instead of syncing via effect.

**Status:** ⬜ Todo

---

#### T11.6 — Dockerfile runs dev server instead of production build

**Severity:** Medium — deployment
**File:** `Dockerfile`

**Problem:** The Dockerfile `CMD` runs `npm run dev`, which starts Next.js in development mode with hot reload, source maps, and no optimizations. Any production deployment using this Dockerfile will be slow and expose dev tooling.

**Fix:** Add a multi-stage build: `npm run build` in the build stage, `npm start` in the runtime stage. Keep `docker-compose.yml` overriding to `npm run dev` for local development.

**Status:** ⬜ Todo

---

#### T11.7 — Photo listing is unbounded (max 1000 objects)

**Severity:** Low — unlikely to hit
**File:** `lib/storage.ts:38-39`

**Problem:** `ListObjectsV2Command` returns at most 1000 objects by default. If the bucket ever has >1000 thumbnails, the listing silently truncates.

**Fix:** Either paginate using `ContinuationToken` or set an explicit `MaxKeys` with a comment documenting the limit.

**Status:** ⬜ Todo

---

#### T11.8 — `getPhotoStream` swallows all S3 errors as "Not found"

**Severity:** Low — debugging friction
**File:** `lib/storage.ts:68-69`

**Problem:** The catch block returns `null` for any S3 error (permissions, network, misconfiguration), making all failures look like a missing photo.

**Fix:** Catch `NoSuchKey` specifically for 404. Let other errors propagate so they surface as 500s with meaningful logs.

**Status:** ⬜ Todo

---

#### T11.9 — `timingSafeCompare` leaks signature length

**Severity:** Very low — theoretical
**File:** `lib/session.ts:50`

**Problem:** The function returns `false` immediately when string lengths differ, leaking whether the signature has the expected length. Since HMAC-SHA256 hex output is always 64 chars this is not practically exploitable, but it deviates from constant-time best practice.

**Fix:** Hash both inputs before comparing, or pad to equal length. Low priority given the fixed-length output.

**Status:** ⬜ Todo

---

#### T11.10 — `package-lock.json` is empty (0 bytes)

**Severity:** High — non-reproducible installs
**File:** `package-lock.json`

**Problem:** The committed lockfile is 0 bytes. `npm install` resolves dependency versions fresh on every run (host, CI, Vercel), making installs non-deterministic. `npm ci` and outside-Docker tooling (lint, build, code review) cannot work without a real lockfile.

**Fix:** Regenerate inside Docker (`npm install --package-lock-only`) and commit the resulting lockfile.

**Status:** ✅ Done — regenerated via a one-shot `node:24-alpine` container. Lockfile is now 442 KB (12 353 lines, lockfileVersion 3).

---

#### T11.11 — `.dockerignore` does not exclude secrets or local DB

**Severity:** High — secret leak risk
**File:** `.dockerignore`

**Problem:** The Dockerfile does `COPY . .` but `.dockerignore` only excluded `node_modules`, `.next`, and `prisma/dev.db`. Local `.env` (containing `SESSION_SECRET`), root `dev.db`, `.git` history, and editor/OS files were all baked into any image built from this repo.

**Fix:** Expand `.dockerignore` to exclude `.env*`, both `dev.db` paths, `.git`, build caches, and editor/OS junk.

**Status:** ✅ Done — `.dockerignore` rewritten to cover env files, local DBs, VCS, build caches, editor metadata, and `.claude`.

---

#### T11.12 — Admin invitations PATCH rejects partial updates

**Severity:** High — admin table edits broken
**Files:** `app/api/admin/invitations/[id]/route.ts:15`, `components/admin/guest-list-client.tsx:131`

**Problem:** The client only sends `{ tableNumber }` when assigning a table, but the API requires all of `groupLabel`, `allowPlusOne`, and `tableNumber` and returns 400 otherwise. Saving a table number from the admin UI was failing silently (the catch only logs).

**Fix:** Make the PATCH handler accept partial updates — validate each field only when present, build a `data` object incrementally, and reject only if no field is provided.

**Status:** ✅ Done — handler now follows proper PATCH semantics. Existing full-payload callers continue to work; the table-number-only path now succeeds.

---

#### T11.13 — Top-level `app/layout.tsx` returns only a fragment

**Severity:** Medium — non-idiomatic
**File:** `app/layout.tsx` (deleted)

**Problem:** The root layout only returned `<>{children}</>`. Next.js requires a root layout to define `<html>` and `<body>`, or to be omitted entirely when using the multiple-root-layouts pattern. Both `app/[locale]/layout.tsx` and `app/admin/layout.tsx` already define their own `<html>`/`<body>`, so the fragment was redundant and could block a valid build under stricter Next versions.

**Fix:** Delete `app/layout.tsx` and let each section provide its own root layout. The locale layout now imports `globals.css` directly (previously inherited from the deleted root layout).

**Status:** ✅ Done — `app/layout.tsx` removed, `app/[locale]/layout.tsx` updated to import `@/app/globals.css`.
