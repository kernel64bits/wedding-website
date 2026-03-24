# Wedding Website — Specifications & Tickets

## Context

A bilingual (FR/EN) wedding website. Everything is private — unauthenticated users see only a gate page asking them to scan their QR code.

- **Gate**: single public page — "scan your QR code" message + form to receive the link by email or SMS.
- **Invitation experience**: cinematic, scroll-driven first-login experience (immersive, full-viewport, no navbar).
- **Guest dashboard**: traditional layout with navbar — RSVP, practical info, seating map, gallery. Guests can replay the invitation from here.
- **Admin panel**: separate section of the same app (outside locale routes), password-protected, for the couple to manage guests, RSVPs, tables and QR codes.

### Tech Stack

| Layer       | Choice                  | Why                                              |
|-------------|-------------------------|--------------------------------------------------|
| Framework   | Next.js (App Router)    | React frontend + API routes in one project       |
| Styling     | Tailwind CSS            | Utility-first, responsive, vibe-code friendly    |
| Components  | shadcn/ui               | Pre-built accessible components (buttons, forms, tables, dialogs, cards), Tailwind-native, no heavy dependency — code is copied into the project |
| Database    | Prisma + SQLite         | Zero-config dev, swap to PostgreSQL for prod      |
| i18n        | next-intl               | Lightweight, supports URL prefix (`/fr`, `/en`)  |
| Auth        | Custom QR token + cookie| No password for guests, simple and secure        |
| Admin auth  | Email + password (bcrypt + session cookie) | Simple, just for the couple |

### Design Principles

- **Simplicity over cleverness**: minimal custom code, lean on shadcn/ui components and Tailwind utilities.
- **Maintainability**: flat file structure, small components, no premature abstractions.
- **Ready-made first**: use shadcn/ui components (Button, Card, Table, Form, Dialog, Input, Select, Checkbox, Badge, Tabs, etc.) instead of building from scratch. Only create custom components when no shadcn/ui component fits.
- **Style coherence**: design tokens defined once in T1.3 (palette, fonts, spacing) — all subsequent tickets consume them, never redefine them.

### Route Architecture

```
app/
├── [locale]/
│   ├── (gate)/
│   │   └── page.tsx              ← public: "scan your QR code" + request link by email/SMS
│   ├── (immersive)/
│   │   └── invitation/
│   │       └── page.tsx          ← cinematic first-login experience (auth required)
│   └── (dashboard)/
│       ├── layout.tsx            ← shared navbar + footer (auth required)
│       ├── home/page.tsx         ← hub: greeting, RSVP status, quick links
│       ├── rsvp/page.tsx
│       ├── info/page.tsx         ← schedule, venue, dress code, accommodation
│       ├── seating/page.tsx
│       └── gallery/page.tsx
└── admin/                        ← outside locale (no i18n needed)
    ├── layout.tsx                ← admin shell (admin auth required)
    ├── login/page.tsx
    ├── guests/
    │   ├── page.tsx              ← guest list + summary stats
    │   └── [id]/page.tsx         ← guest detail + manual override
    └── tables/page.tsx           ← table management
```

**Route groups** (`(gate)`, `(immersive)`, `(dashboard)`) are Next.js organizational folders — they don't appear in URLs. Each has its own layout (or none), so the cinematic invitation page and the dashboard never share a navbar.

### Authentication Flow

**Guests:**
1. Each invitation (guest/household) gets a unique token stored in DB.
2. A QR code encodes: `https://yoursite.com/login?token=<token>`
3. `GET /api/login?token=<token>` validates the token, sets a secure HTTP-only cookie (30-day session containing invitation ID + expiry).
4. **First visit** (`invitationViewedAt` is null): redirect to `/{locale}/invitation`. Set `invitationViewedAt` timestamp.
5. **Returning visits** (`invitationViewedAt` is set): redirect to `/{locale}/home`.
6. Any protected route without a valid session cookie → redirect to `/{locale}` (gate page).
7. Guests can replay the invitation at any time from the dashboard.

**Admin:**
- Email + password login at `/admin/login`.
- Sets a separate admin session cookie (independent from guest cookie).
- Protected by Next.js middleware on `/admin/*` routes (except `/admin/login`).

### Data Model

```
Invitation {
  id                  String    @id @default(cuid())
  token               String    @unique
  groupLabel          String                        // e.g. "Famille Dupont"
  email               String?
  phone               String?                       // for SMS link delivery
  language            String    @default("fr")      // "fr" | "en"
  allowPlusOne        Boolean   @default(false)
  rsvpStatus          String    @default("pending") // pending | confirmed | declined
  tableNumber         Int?
  invitationViewedAt  DateTime?                     // null = first login not yet done
  lastLoginAt         DateTime?
  rsvpSubmittedAt     DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  attendees           Attendee[]
}

Attendee {
  id                  String    @id @default(cuid())
  invitationId        String
  invitation          Invitation @relation(fields: [invitationId], references: [id])
  name                String
  isPrimary           Boolean   @default(false)
  isPlusOne           Boolean   @default(false)
  attending           Boolean?
  dietaryRestrictions String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

Admin {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
}

Table {
  id            String   @id @default(cuid())
  number        Int      @unique
  label         String?
  positionX     Float
  positionY     Float
  capacity      Int
}
```

**Key relationships:**
- An `Invitation` has many `Attendees` (1-to-many).
- Named attendees are pre-created by the admin with `isPrimary = true` for the main contact.
- If `allowPlusOne = true`, the guest can add one `Attendee` with `isPlusOne = true` via the RSVP form.
- Headcount = count of attendees where `attending = true`.
- Table assignment is per invitation (whole group sits together).

---

## Tickets

### Epic 1 — Project Setup

#### T1.1 — Initialize Next.js project with Tailwind, shadcn/ui, and Prisma ✅
**Description:** Scaffold the project with all base dependencies.
**Acceptance criteria:**
- Next.js App Router project created with TypeScript
- Tailwind CSS configured and working
- shadcn/ui initialized (`npx shadcn@latest init`), a few base components added (Button, Card, Input)
- Prisma initialized with SQLite, schema matches the data model above
- `prisma db push` creates the database
- Basic folder structure in place (`/app`, `/components`, `/lib`, `/prisma`)
- Project runs with `npm run dev`
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

**Implementation details:**

All scaffolding runs inside Docker. Config files are written on the host; heavy lifting (npm install, prisma generate) is baked into the Dockerfile.

**Dev environment:**
- `docker compose up --build` — builds image and starts dev server on http://localhost:3000
- `docker compose exec app npx prisma db push` — initializes the SQLite database
- Day-to-day: `docker compose up` (hot reload via bind mount + WATCHPACK_POLLING)
- Adding new npm packages: add to `package.json`, delete `package-lock.json`, then `docker compose down -v && docker compose up --build` (the `-v` drops the stale `node_modules` volume)
- Adding new shadcn/ui components: `docker compose exec app npx shadcn@latest add <component>` — writes into `components/ui/` via bind mount, then commit the file

**Key files created:**
| File | Purpose |
|------|---------|
| `Dockerfile` | Node 22 Alpine, npm install, prisma generate baked in |
| `docker-compose.yml` | Bind mount `.:/app`, named `node_modules` volume, port 3000 |
| `.dockerignore` | Excludes node_modules, .next, dev.db |
| `package.json` | Next.js 15, React 19, Tailwind v4, Prisma, shadcn deps |
| `tsconfig.json` | App Router defaults, `@/*` path alias |
| `next.config.ts` | Minimal config |
| `postcss.config.mjs` | @tailwindcss/postcss plugin |
| `components.json` | shadcn/ui config (new-york style, rsc, aliases) |
| `app/layout.tsx` | Root layout with globals.css import |
| `app/globals.css` | Tailwind v4 directives + shadcn CSS variables (oklch) |
| `lib/utils.ts` | `cn()` utility (clsx + tailwind-merge) |
| `lib/prisma.ts` | Singleton PrismaClient for dev hot-reload |
| `prisma/schema.prisma` | 4 models: Invitation, Attendee, Admin, Table |
| `components/ui/button.tsx` | shadcn Button component |
| `components/ui/card.tsx` | shadcn Card component |
| `components/ui/input.tsx` | shadcn Input component |
| `.env` | DATABASE_URL for SQLite |
| `.gitignore` | node_modules, .next, .env, dev.db |

**Design decisions:**
- Named `node_modules` volume prevents macOS/Linux binary conflicts
- `prisma db push` as runtime step (DB file lives on host via bind mount)
- No `create-next-app` — config files written directly for Docker compatibility

#### T1.2 — Set up i18n with next-intl ✅
**Description:** Configure bilingual support (FR/EN).
**Acceptance criteria:**
- next-intl configured with URL prefix strategy (`/fr/...`, `/en/...`)
- Default locale is `fr`
- Translation files created (`messages/fr.json`, `messages/en.json`) with placeholder keys
- Language switcher component (FR/EN toggle) in a shared layout
- Middleware redirects `/` to `/fr`
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

#### T1.3 — Design tokens & visual identity
**Description:** Define the visual language of the site — palette, typography, Tailwind theme extension, shadcn theme override. All subsequent UI tickets consume these tokens; none redefine them.
**Acceptance criteria:**
- Color palette defined and documented: primary accent, background gradient, text colors, surface colors — inspired by the prototype (`#8b6f47` warm brown, `#fdfcfb → #e2d1c3` cream/beige)
- Typography chosen: decorative serif for headings/display (e.g. Playfair Display or Cormorant Garamond), clean sans-serif for body (e.g. Inter) — Google Fonts imported
- Tailwind CSS theme extended in `globals.css` with custom color and font tokens
- shadcn/ui CSS variables (oklch) remapped to match the palette (buttons, cards, inputs match the wedding aesthetic, not default shadcn neutrals)
- A `/dev/styles` page (dev-only, not linked in nav) renders: color swatches, typography scale (h1→p), all button variants, card, input, badge — living reference for all subsequent tickets
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T1.4 — Route groups & base layouts
**Description:** Establish the full route group structure and each group's layout shell. No real content — placeholder pages only.
**Acceptance criteria:**
- Route groups created: `(gate)`, `(immersive)`, `(dashboard)` under `app/[locale]/`, and `admin/` at root
- `(gate)` has no layout (or bare minimal — just `{children}`)
- `(immersive)` has no layout (full-viewport, no chrome)
- `(dashboard)` has a layout with: responsive navbar (site title, nav links: Home / Info / Seating / Gallery, language switcher, "Replay invitation" link), footer (couple names + date), mobile hamburger menu — using T1.3 design tokens
- `admin/` has a separate layout: simple sidebar or top nav (links: Guests / Tables), logout button — visually distinct from the guest-facing site
- Placeholder `page.tsx` exists for every route listed in the Route Architecture section
- Navigating between dashboard pages works; navbar highlights the active route
- Auth protection is **not** implemented yet (that's T2.3) — all pages are accessible for now
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

### Epic 2 — Authentication & Entry

#### T2.1 — Gate page
**Description:** The only public-facing page. Shown to any unauthenticated user regardless of the route they tried to reach.
**Acceptance criteria:**
- Clean, on-brand page (uses T1.3 tokens) with a message asking the guest to scan their QR code
- "Request my link" section: a form with email OR phone field — looks up the matching invitation and sends the token link (email via a simple transactional service, SMS via a provider like Twilio or just logged to console for now)
- Fully bilingual
- Responsive, works well on mobile (primary use case — guests will land here on their phones)
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T2.2 — Token login & session
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
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T2.3 — Auth middleware
**Description:** Protect all guest and admin routes behind their respective authentication.
**Acceptance criteria:**
- Middleware runs on all `/{locale}/(immersive)/*` and `/{locale}/(dashboard)/*` routes
- No valid guest session cookie → redirect to `/{locale}` (gate page)
- Middleware runs on all `/admin/*` routes (except `/admin/login`)
- No valid admin session cookie → redirect to `/admin/login`
- Session validation checks expiry timestamp
- Guest and admin cookies are fully independent (different names, different payloads)
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T2.4 — QR code generation utility
**Description:** Utility to generate QR codes from guest tokens.
**Acceptance criteria:**
- `lib/qrcode.ts`: function that takes a token + base URL, returns a QR code as SVG string or PNG Buffer
- QR code encodes: `https://<base_url>/api/login?token=<token>`
- Used by admin panel (T5.3, T5.4) — not exposed as a standalone page
- Uses `qrcode` npm package
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T2.5 — Request link by email/SMS (optional)
**Description:** Let guests without their QR code request their personal link via email or SMS.
**Acceptance criteria:**
- Gate page gains a "Don't have your QR code?" collapsible section
- Form with a single field: email or phone number
- `POST /api/request-link` looks up invitation by email or phone, sends the token link
- Email via a transactional provider (Resend, Postmark…); SMS via Twilio or similar — logged to console until a provider is wired up
- Requires adding `phone: String?` to the `Invitation` schema
- Fully bilingual
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

### Epic 3 — Invitation Experience

#### T3.1 — Cinematic invitation page
**Description:** The emotional heart of the site. A full-viewport, scroll-driven experience guests see on first login — a direct Next.js port of the HTML prototype, bilingual, using T1.3 design tokens.
**Acceptance criteria:**
- Full-viewport layout (no navbar, no footer — `(immersive)` route group)
- Welcome splash screen with "Enter" button + confetti animation on click
- Scroll-driven sections appearing/disappearing one at a time (matching prototype behaviour)
- Sections: Save the Date → couple photo → wedding announcement → venue photo → date/time/location → dress code → celebration photo → map → final message
- Interactive map with venue pin (Mapbox GL JS or OpenStreetMap/Leaflet — no API key required for Leaflet)
- All text content from translation files (bilingual)
- On first view: sets `invitationViewedAt` timestamp via `PATCH /api/invitation/viewed`
- "Go to my space →" CTA button at the end leads to `/{locale}/home`
- Accessible again from the dashboard ("Replay invitation" link)
- Fully responsive, mobile-first
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

### Epic 4 — Guest Dashboard

#### T4.1 — Dashboard home
**Description:** Hub page guests land on after their first visit. Personalized, warm, functional.
**Acceptance criteria:**
- Personalized greeting: "Bonjour, [prénom] !" using the primary attendee name
- RSVP status summary card: confirmed / pending / declined with a CTA if pending
- Quick-access links to all dashboard sections (Info, RSVP, Seating, Gallery)
- "Replay invitation" button → `/{locale}/invitation`
- Displayed in guest's language (from `invitation.language`)
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T4.2 — RSVP form
**Description:** Form for guests to confirm attendance and provide details per attendee.
**Acceptance criteria:**
- For each pre-registered attendee in the invitation:
  - Name (read-only)
  - Attending: Yes / No toggle
  - Dietary restrictions: checkboxes (Vegetarian, Vegan, Gluten-free, Allergies) + free text "Other" (shown only if attending)
- If `allowPlusOne = true`:
  - "Add a +1" button appears
  - +1 form: name (required), attending (defaults Yes), dietary restrictions
  - Guest can remove the +1 before or after submitting
- Submits to `POST /api/rsvp`:
  - Updates `attending` and `dietaryRestrictions` for each attendee
  - Creates/updates/deletes the +1 attendee as needed
  - Sets `rsvpStatus` on invitation to `confirmed` (if any attending) or `declined` (if none)
  - Sets `rsvpSubmittedAt` timestamp
- Shows confirmation message with summary on success
- Pre-fills with existing data if already submitted
- Editable (guest can update their answer)
- Bilingual labels and validation messages
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T4.3 — Practical info page
**Description:** Everything guests need to know — schedule, venue, logistics. All content comes from translation files.
**Acceptance criteria:**
- Wedding day timeline / schedule section (vertical timeline component — time, title, location, icon)
- Venue section: address, embedded map (Leaflet iframe or static map)
- Transport & parking section
- Accommodation suggestions (name, link, approximate price range)
- Dress code section
- Contact section (email or phone for questions)
- All text bilingual, content defined in `messages/fr.json` and `messages/en.json`
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T4.4 — Seating map
**Description:** Visual map of the room showing table assignments.
**Acceptance criteria:**
- SVG-based room layout with tables positioned using `Table.positionX/Y` from DB
- Each table shows its number/label and the names of assigned attendees
- Current guest's table is visually highlighted
- "You are seated at Table X" banner at top
- If no table assigned yet: "Table assignments coming soon" message
- Scrollable and pinch-zoomable on mobile
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T4.5 — Photo gallery
**Description:** A grid of couple photos with lightbox.
**Acceptance criteria:**
- Responsive photo grid (uniform grid or masonry)
- Lightbox on click: full-screen view with prev/next navigation and close button
- Placeholder images for now (replaced with real photos before the event)
- Lazy loading for performance
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

### Epic 5 — Admin Panel

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

#### T5.3 — Guest detail & manual override
**Description:** View and edit an individual invitation record.
**Acceptance criteria:**
- Accessible from guest list: click a row → `/admin/guests/[id]`
- Shows all invitation fields: group label, email, phone, language, allowPlusOne, RSVP status, table, last login, invitationViewedAt, token
- Lists all attendees with attending status and dietary info
- QR code preview (uses T2.4 utility)
- Admin can edit: group label, email, phone, language, allowPlusOne, table number
- Admin can add/remove/edit attendees and manually override RSVP status and dietary details
- Save → `PATCH /api/admin/invitations/[id]`
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

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

### Epic 6 — Table Assignment (Bonus)

#### T6.1 — Table management CRUD
**Description:** Admin can create, edit and delete tables.
**Acceptance criteria:**
- Admin page at `/admin/tables`
- Create table: number, label, capacity, position (x, y)
- Edit and delete existing tables
- Validation: table number must be unique
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T6.2 — Drag-and-drop table assignment
**Description:** Visual interface to assign invitations to tables.
**Acceptance criteria:**
- Left panel: unassigned invitations list with attendee count
- Right panel: visual table map (same layout as T4.4)
- Drag an invitation onto a table to assign it
- Table shows current occupancy vs capacity
- Warning indicator when a table exceeds capacity
- Changes saved to DB on drop (`PATCH /api/admin/invitations/[id]`)
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

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

---

### Epic 7 — Production Readiness

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
| `POST /api/request-link` | 3 req / hour per IP | Email/SMS abuse |
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

---

## Ticket Dependency Graph

```
T1.1 ──► T1.2 ──► T1.3 ──► T1.4
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
            T2.1            T2.2           T5.1
                              │               │
                            T2.3           T5.2 ──► T5.3
                              │               │
                    ┌─────────┤            T5.4 (needs T2.4)
                  T2.4      T3.1
                    │         │
                  T5.5      T4.1
                    │         │
              ┌─────┘ ┌───────┼──────────────┐
              ▼       ▼       ▼              ▼
            T5.3    T4.2    T4.3           T4.4 ──► T6.1 ──► T6.2
            T5.4    T4.5
                              │
                (all of the above)
                              │
                              ▼
                            T7.1
```

### Suggested implementation order
1. **T1.1 → T1.2 → T1.3 → T1.4** — foundation + design + layouts
2. **T2.1 → T2.2 → T2.3 → T2.4** — auth system + gate page
3. **T3.1** — cinematic invitation experience
4. **T4.1 → T4.2 → T4.3 → T4.4 → T4.5** — guest dashboard
5. **T5.1 → T5.2 → T5.3 → T5.4** — admin panel
6. **T6.1 → T6.2** — bonus: drag-and-drop table assignment
7. **T7.1** — production hardening (always last, before go-live)
