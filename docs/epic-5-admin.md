# Epic 5 — Admin Panel

#### T5.1 — Admin login ✅
**Description:** Username + password login for the admin panel.
**Acceptance criteria:**
- [x] Login page at `/admin/login` — lock icon, clean centered layout, English UI
- [x] Username + password form (Admin.email renamed to Admin.username)
- [x] Validates against `Admin` table (bcrypt hash comparison via `bcryptjs`)
- [x] Sets admin session cookie (independent from guest cookie, 8h)
- [x] Redirects to `/admin/guests` on success
- [x] Error banner on invalid credentials (same response for wrong user/pass — no enumeration)
- [x] `POST /api/admin/logout` clears cookie, redirects to `/admin/login`
- [x] Logout button in nav is a `<form method="POST">` (httpOnly-safe)
- [x] `prisma/seed.mjs` creates initial admin (`username: admin / password: admin1234`)
- [x] Already-authenticated redirect: `/admin/login` → `/admin/guests` if session active
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

---

#### T5.2 — Guest list dashboard ✅
**Description:** Overview of all invitations and their RSVP status.
**Acceptance criteria:**
- [x] Summary cards at top: total invitations, confirmed, declined, pending, total attending headcount
- [x] Table listing all invitations: group label, attendees (names), RSVP status, headcount, dietary flags, table assignment, last login
- [x] Filters: by RSVP status, by table assignment (assigned / unassigned)
- [x] Search by name or group label
- [x] Export CSV removed (out of scope for now — kept simple)
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

---

#### T5.3 — Guest detail sheet & create invitation
**Description:** Enhance the guest list dashboard into a single self-contained admin panel.
Clicking a row opens a side sheet for viewing/editing. A "+ New" button opens the same sheet for creating.
No separate detail page — everything lives in `/admin/guests`.
**Acceptance criteria:**
- "+ New" button in page header opens a side sheet with an empty create form
- Clicking any row opens the side sheet with that invitation's data
- **Create form fields:** group label (required), allow +1, table number (optional), attendee names (at least one)
- **Edit form fields:** group label, allow +1, table number (editable); RSVP status, dates, token, login URL (read-only); attendees list read-only
- Create → `POST /api/admin/invitations` (generates token automatically)
- Edit → `PATCH /api/admin/invitations/[id]`
- After save: sheet closes, list refreshes in place (no page reload)
- Delete placeholder page `app/admin/(protected)/guests/[id]/page.tsx`
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

#### T5.4 — QR code bulk export
**Description:** Generate and download QR codes for all invitations at once.
**Acceptance criteria:**
- "Export all QR codes" button on `/admin/guests`
- Generates a PDF: one page per invitation, showing group label + QR code
- Individual login URL visible in the side sheet (T5.3); real QR image added in T5.5
- Uses the utility from T2.4
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

#### T5.5 — QR code image generation
**Description:** Add QR code image rendering on top of the `buildLoginUrl` utility from T2.4. Kept separate because it requires a new npm package and is purely an end-user facing feature.
**Acceptance criteria:**
- Add `qrcode` npm package + `@types/qrcode` to `package.json`
- Extend `lib/qrcode.ts` with:
  - `generateQrSvg(token)` → SVG string (used inline on guest detail page T5.3)
  - `generateQrPng(token)` → PNG Buffer (used in PDF export T5.4)
- Individual QR preview in the side sheet (T5.3) renders the real QR image (replaces login URL text)
- "Export all QR codes" PDF on `/admin/guests` generates real QR images (replaces placeholder from T5.4)
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized
