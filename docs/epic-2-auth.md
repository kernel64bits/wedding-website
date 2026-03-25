# Epic 2 — Authentication & Entry

#### T2.1 — Gate page ✅
**Description:** The only public-facing page. Shown to any unauthenticated user regardless of the route they tried to reach.
**Acceptance criteria:**
- Clean, on-brand page (uses T1.3 tokens) with a message asking the guest to scan their QR code
- "Request my link" section: a form with email field — looks up the matching invitation and sends the token link (email via a simple transactional service, logged to console until a provider is wired up)
- Fully bilingual
- Responsive, works well on mobile (primary use case — guests will land here on their phones)
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

---

#### T2.2 — Token login & session ✅
**Description:** API route that validates a guest token, creates a session, and routes the guest to the right page.
**Acceptance criteria:**
- `GET /api/login?token=<token>` validates token against DB
- If valid:
  - Sets a secure HTTP-only cookie with session payload (invitation ID, expiry)
  - Updates `lastLoginAt` in DB
  - If `invitationViewedAt` is null → redirect to `/{locale}/invitation`
  - If `invitationViewedAt` is set → redirect to `/{locale}/home`
- If invalid or expired: redirect to gate page with an error query param (`?error=invalid`)
- Session duration: 30 days
- Logout: `POST /api/logout` clears the cookie, redirects to gate page
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

---

#### T2.3 — Auth middleware ✅
**Description:** Protect all guest and admin routes behind their respective authentication.
**Acceptance criteria:**
- Middleware runs on all `/{locale}/(immersive)/*` and `/{locale}/(dashboard)/*` routes
- No valid guest session cookie → redirect to `/{locale}` (gate page)
- Middleware runs on all `/admin/*` routes (except `/admin/login`)
- No valid admin session cookie → redirect to `/admin/login`
- Session validation checks expiry timestamp
- Guest and admin cookies are fully independent (different names, different payloads)
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

---

#### T2.4 — QR code generation utility ✅
**Description:** Utility to generate QR codes from guest tokens.
**Acceptance criteria:**
- `lib/qrcode.ts`: function that takes a token + base URL, returns a QR code as SVG string or PNG Buffer
- QR code encodes: `https://<base_url>/api/login?token=<token>`
- Used by admin panel (T5.3, T5.4) — not exposed as a standalone page
- Uses `qrcode` npm package
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

---

#### T2.5 — Request link by email (optional)
**Description:** Let guests without their QR code request their personal link via email.
**Acceptance criteria:**
- Gate page gains a "Don't have your QR code?" collapsible section
- Form with a single field: email address
- `POST /api/request-link` looks up invitation by email, sends the token link
- Email via a transactional provider (Resend, Postmark…) — logged to console until a provider is wired up
- Fully bilingual
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

#### T2.6 — Middleware hardening: explicit allowlist + default deny
**Description:** Strengthen `proxy.ts` so that access is denied by default and every accessible route is explicitly declared. Closes two current gaps: dev routes are only guest-protected (not admin-only), and unknown paths fall through to the i18n middleware rather than being rejected.

**Access policy (ordered checks):**

| Path | Access |
|------|--------|
| `/admin/login` | Public |
| `/admin/*` | Admin session required → redirect `/admin/login` |
| `/{locale}/dev/*` | Admin session required in production; open in development (see note) |
| `/{locale}` (gate) | Public |
| `/{locale}/{guest-route}` | Guest session required → redirect `/{locale}` |
| Everything else | Redirect to `/{defaultLocale}` (default deny) |

**Guest route allowlist** — explicit `Set` in `proxy.ts`. New guest pages must be consciously added here:
```
home, invitation, gallery, info, rsvp, seating
```

**Dev route guard:** In development (`NODE_ENV !== 'production'`), skip the admin check for `/dev/*` so developers don't need an admin session to view style/debug pages. In production, admin session required.

> **Open question:** bare `/` (root) — currently intlMiddleware redirects it to `/{defaultLocale}`. With default deny, the fallback also redirects to `/{defaultLocale}`. Behaviour is identical; decide whether to keep the implicit intlMiddleware fallback or make it explicit.

**Acceptance criteria:**
- Guest visiting `/{locale}/dev/*` in production → redirected to `/admin/login`
- Guest visiting `/{locale}/dev/*` in development → accessible (no auth required)
- Admin visiting `/{locale}/dev/*` → accessible in both environments
- Unknown path (e.g. `/{locale}/foo`) → redirected to `/{defaultLocale}` (gate)
- All existing guest and admin protections remain intact (regression test)
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized
