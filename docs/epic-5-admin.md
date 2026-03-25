# Epic 5 — Admin Panel

#### T5.1 — Admin login
**Description:** Password-based login for the admin panel.
**Acceptance criteria:**
- Login page at `/admin/login`
- Email + password form
- Validates against `Admin` table (bcrypt hash comparison)
- Sets admin session cookie (independent from guest cookie)
- Redirects to `/admin/guests`
- Seed script (`prisma/seed.ts`) to create the initial admin account
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

#### T5.2 — Guest list dashboard
**Description:** Overview of all invitations and their RSVP status.
**Acceptance criteria:**
- Summary cards at top: total invitations, confirmed, declined, pending, total attending headcount
- Table listing all invitations: group label, attendees (names), RSVP status, headcount, dietary flags, table assignment, last login
- Filters: by RSVP status, by table assignment (assigned / unassigned)
- Search by name or group label
- Export to CSV button
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

#### T5.3 — Guest detail & manual override
**Description:** View and edit an individual invitation record.
**Acceptance criteria:**
- Accessible from guest list: click a row → `/admin/guests/[id]`
- Shows all invitation fields: group label, email, language, allowPlusOne, RSVP status, table, last login, invitationViewedAt, token
- Lists all attendees with attending status and dietary info
- QR code preview (uses T2.4 utility)
- Admin can edit: group label, email, language, allowPlusOne, table number
- Admin can add/remove/edit attendees and manually override RSVP status and dietary details
- Save → `PATCH /api/admin/invitations/[id]`
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
- Individual QR download also available on the guest detail page
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
- Individual QR preview on `/admin/guests/[id]` renders the real QR image (replaces placeholder from T5.3)
- "Export all QR codes" PDF on `/admin/guests` generates real QR images (replaces placeholder from T5.4)
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized
