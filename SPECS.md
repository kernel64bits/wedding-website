# Wedding Website — Specifications & Tickets

## Context

A bilingual (FR/EN) wedding website with two sections:
- **Public**: landing page, schedule, practical info, photo gallery — accessible to anyone.
- **Private**: RSVP form, seating map, personalized welcome — accessible to authenticated guests via QR code.
- **Admin panel**: dashboard to manage guests, view RSVPs, assign tables, generate QR codes.

### Tech Stack

| Layer       | Choice                  | Why                                              |
|-------------|-------------------------|--------------------------------------------------|
| Framework   | Next.js (App Router)    | React frontend + API routes in one project       |
| Styling     | Tailwind CSS            | Utility-first, responsive, vibe-code friendly    |
| Components  | shadcn/ui               | Pre-built accessible components (buttons, forms, tables, dialogs, cards), Tailwind-native, no heavy dependency — code is copied into the project |
| Database    | Prisma + SQLite         | Zero-config dev, swap to PostgreSQL for prod      |
| i18n        | next-intl               | Lightweight, supports URL prefix (`/fr`, `/en`)  |
| Auth        | Custom QR token + cookie| No password for guests, simple and secure        |
| Admin auth  | Email + password (bcrypt + JWT or session) | Simple, just for the couple |

### Design Principles

- **Simplicity over cleverness**: minimal custom code, lean on shadcn/ui components and Tailwind utilities.
- **Maintainability**: flat file structure, small components, no premature abstractions.
- **Ready-made first**: use shadcn/ui components (Button, Card, Table, Form, Dialog, Input, Select, Checkbox, Badge, Tabs, etc.) instead of building from scratch. Only create custom components when no shadcn/ui component fits.

### Authentication Flow

**Guests:**
1. Each invitation (guest/household) gets a unique token stored in DB.
2. A QR code encodes: `https://yoursite.com/login?token=<token>`
3. Visiting the URL validates the token, sets a secure HTTP-only cookie (30-day session).
4. QR codes printed on invitations or sent via message/email.

**Admin:**
- Email + password login.
- Protected by Next.js middleware.

### Data Model

```
Invitation {
  id              String    @id @default(cuid())
  token           String    @unique
  groupLabel      String                        // e.g. "Famille Dupont"
  email           String?
  language        String    @default("fr")      // "fr" | "en"
  allowPlusOne    Boolean   @default(false)     // admin controls who can bring a +1
  rsvpStatus      String    @default("pending") // pending | confirmed | declined
  tableNumber     Int?
  lastLoginAt     DateTime?
  rsvpSubmittedAt DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  attendees       Attendee[]
}

Attendee {
  id                  String    @id @default(cuid())
  invitationId        String
  invitation          Invitation @relation(fields: [invitationId], references: [id])
  name                String
  isPrimary           Boolean   @default(false)  // the main contact
  isPlusOne           Boolean   @default(false)  // added by guest via RSVP
  attending           Boolean?                   // null = not yet answered
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
  label         String?                         // e.g. "Table des mariés"
  positionX     Float                           // for seating map rendering
  positionY     Float
  capacity      Int
}
```

**Key relationships:**
- An `Invitation` has many `Attendees` (1-to-many).
- Named attendees (e.g. "Marie" and "Pierre") are pre-created by the admin with `isPrimary = true` for the main contact.
- If `allowPlusOne = true`, the guest can add one additional `Attendee` with `isPlusOne = true` via the RSVP form.
- Headcount = count of attendees where `attending = true` for a given invitation.
- Table assignment is per invitation (the whole group sits together).

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
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

**Implementation details:**

All scaffolding runs inside Docker. Config files are written on the host; heavy lifting (npm install, prisma generate, shadcn add) is baked into the Dockerfile.

**Dev environment:**
- `docker compose up --build` — builds image and starts dev server on http://localhost:3000
- `docker compose exec app npx prisma db push` — initializes the SQLite database
- Day-to-day: `docker compose up` (hot reload via bind mount + WATCHPACK_POLLING)
- Adding new npm packages: add to `package.json`, delete `package-lock.json`, then `docker compose down -v && docker compose up --build` (the `-v` drops the stale `node_modules` volume)
- Adding new shadcn/ui components: `docker compose exec app npx shadcn@latest add <component>` — writes into `components/ui/` via bind mount, then commit the file

**Key files created:**
| File | Purpose |
|------|---------|
| `Dockerfile` | Node 22 Alpine, npm install, prisma generate, shadcn add baked in |
| `docker-compose.yml` | Bind mount `.:/app`, named `node_modules` volume, port 3000 |
| `.dockerignore` | Excludes node_modules, .next, dev.db |
| `package.json` | Next.js 15, React 19, Tailwind v4, Prisma, shadcn deps |
| `tsconfig.json` | App Router defaults, `@/*` path alias |
| `next.config.ts` | Minimal config |
| `postcss.config.mjs` | @tailwindcss/postcss plugin |
| `components.json` | shadcn/ui config (new-york style, rsc, aliases) |
| `app/layout.tsx` | Root layout with globals.css import |
| `app/page.tsx` | Smoke test page with shadcn Card + Button |
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
- shadcn components generated in Dockerfile, copied back to host after first build
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
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T1.3 — Base layout and navigation
**Description:** Create the shared layout (header, footer, nav) used across all public pages.
**Acceptance criteria:**
- Responsive navbar with site title, nav links (Home, Schedule, Info), language switcher
- Footer with couple names and date
- Mobile hamburger menu
- Tailwind-based, clean design
- Placeholder pages exist for all public routes
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

### Epic 2 — Public Pages

#### T2.1 — Landing page
**Description:** The main public-facing page.
**Acceptance criteria:**
- Hero section with couple names, wedding date, venue name
- Animated countdown timer to the wedding date
- Welcome message (bilingual)
- Call-to-action button for guests ("Access your space" → login)
- At least one fun CSS animation (parallax, fade-in on scroll, or similar)
- Fully responsive
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T2.2 — Schedule / timeline page
**Description:** Visual timeline of the wedding day.
**Acceptance criteria:**
- Vertical timeline component
- Each event shows: time, title, location, short description, icon
- Events data stored in translation files (bilingual)
- Responsive (works well on mobile)
- Placeholder data for: ceremony, cocktail hour, dinner, party
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T2.3 — Practical info page
**Description:** All logistics guests need.
**Acceptance criteria:**
- Venue section with address and embedded map (Google Maps or OpenStreetMap iframe)
- Transport / parking section
- Accommodation suggestions (name, link, approximate price)
- Dress code section
- Contact section (email or phone for questions)
- All text bilingual
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T2.4 — Photo gallery
**Description:** A grid of couple photos.
**Acceptance criteria:**
- Responsive photo grid (masonry or uniform grid)
- Lightbox on click (full-screen view with navigation)
- Placeholder images for now
- Lazy loading for performance
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

### Epic 3 — Guest Authentication

#### T3.1 — Token-based login endpoint
**Description:** API route that validates a guest token and creates a session.
**Acceptance criteria:**
- `GET /login?token=<token>` validates token against DB
- If valid: sets a secure HTTP-only cookie with session info (invitation ID, expiry)
- Updates `lastLoginAt` in DB
- Redirects to the private welcome page (`/fr/dashboard` or `/en/dashboard`)
- If invalid: shows an error page ("Invalid or expired link")
- Session duration: 30 days
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T3.2 — Auth middleware for private routes
**Description:** Protect all private pages behind authentication.
**Acceptance criteria:**
- Next.js middleware checks for valid session cookie on `/dashboard/*` routes
- If no valid session: redirect to public landing page
- Session validation checks expiry
- Logout endpoint clears the cookie
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T3.3 — QR code generation utility
**Description:** Utility to generate QR codes from guest tokens.
**Acceptance criteria:**
- Function that takes a guest token and base URL, returns a QR code (PNG or SVG)
- Can be called from admin panel or as a script
- QR code encodes: `https://<base_url>/login?token=<token>`
- Uses a library like `qrcode` (npm)
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

### Epic 4 — Private Guest Pages

#### T4.1 — Guest dashboard / welcome page
**Description:** The first page guests see after login.
**Acceptance criteria:**
- Personalized greeting: "Hello, [name]!" (uses primary attendee name or group label)
- RSVP status summary ("You have confirmed" / "Please RSVP below")
- List of attendees in the invitation with their status
- Quick links to RSVP form and seating map
- Displayed in guest's preferred language
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T4.2 — RSVP form
**Description:** Form for guests to confirm attendance and provide details per attendee.
**Acceptance criteria:**
- For each pre-registered attendee in the invitation:
  - Name (read-only)
  - Attending: Yes / No toggle
  - Dietary restrictions: checkboxes (Vegetarian, Vegan, Gluten-free, Allergies) + free text "Other" (shown only if attending)
- If `allowPlusOne = true` on the invitation:
  - "Add a +1" button appears
  - +1 form: name (required), attending (defaults Yes), dietary restrictions
  - Guest can remove the +1 before or after submitting
- Submits to `POST /api/rsvp`:
  - Updates `attending` and `dietaryRestrictions` for each attendee
  - Creates/updates/deletes the +1 attendee as needed
  - Sets `rsvpStatus` on invitation to confirmed (if any attending) or declined (if none attending)
  - Sets `rsvpSubmittedAt` timestamp
- Shows confirmation message with summary on success
- Pre-fills with existing data if already submitted
- Editable (guest can change their answer)
- Bilingual labels and validation messages
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T4.3 — Seating map page
**Description:** Visual map showing table assignments.
**Acceptance criteria:**
- SVG or canvas-based room layout with tables
- Each table shows its number/label and attendee names
- Current guest's table is highlighted (green dot / glow / different color)
- "You are seated at Table X" banner at top
- If no table assigned yet: "Table assignments coming soon" message
- Scrollable and zoomable on mobile
- Table data loaded from DB (or hardcoded JSON as initial step)
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
- Sets admin session cookie
- Redirects to admin dashboard
- Seed script to create initial admin account
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T5.2 — Guest list dashboard
**Description:** Overview of all invitations and their RSVP status.
**Acceptance criteria:**
- Summary cards: total invitations, confirmed, declined, pending, total headcount (sum of attending attendees)
- Table listing all invitations with columns: group label, attendees (names), RSVP status, headcount, dietary restrictions, table, last login
- Filters: by status (pending/confirmed/declined), by table assignment
- Search by name or group label
- Export to CSV button
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T5.3 — Guest detail & manual override
**Description:** View and edit individual invitation records.
**Acceptance criteria:**
- Click an invitation in the list → detail view
- Shows all fields: group label, language, allowPlusOne, RSVP status, table, last login, token
- Lists all attendees with their attending status and dietary info
- QR code preview for this invitation
- Admin can:
  - Edit group label, language, allowPlusOne, table number
  - Add/remove/edit attendees
  - Manually override RSVP status and attendee details
- Save button updates the DB
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T5.4 — QR code bulk export
**Description:** Generate and download QR codes for all invitations.
**Acceptance criteria:**
- Button on admin dashboard: "Export all QR codes"
- Generates a PDF with one QR code per invitation (group label + QR code)
- Also supports individual QR download from guest detail page
- Uses the utility from T3.3
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

### Epic 6 — Table Assignment (Bonus)

#### T6.1 — Table management CRUD
**Description:** Admin can create, edit, delete tables.
**Acceptance criteria:**
- Admin page to manage tables
- Create table: number, label, capacity, position (x, y)
- Edit and delete existing tables
- Validation: table number must be unique
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

#### T6.2 — Drag-and-drop table assignment
**Description:** Visual interface to assign invitations to tables.
**Acceptance criteria:**
- Left panel: unassigned invitations list (with attendee count)
- Right panel: visual table map (same as guest-facing seating map)
- Drag an invitation onto a table to assign
- Table shows current occupancy vs capacity
- Warning when table exceeds capacity
- Changes saved to DB on drop
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

## Ticket Dependency Graph

```
T1.1 ──► T1.2 ──► T1.3
  │
  ├──► T2.1, T2.2, T2.3, T2.4  (public pages, parallel, after T1.3)
  │
  ├──► T3.1 ──► T3.2 ──► T4.1 ──► T4.2
  │      │                         T4.3
  │      └──► T3.3
  │
  ├──► T5.1 ──► T5.2 ──► T5.3
  │              T5.4 (needs T3.3)
  │
  └──► T6.1 ──► T6.2  (bonus, after T5.x and T4.3)
```

### Suggested implementation order
1. **T1.1 → T1.2 → T1.3** (foundation)
2. **T2.1 → T2.2 → T2.3 → T2.4** (public pages — visible progress fast)
3. **T3.1 → T3.2 → T3.3** (auth system)
4. **T4.1 → T4.2 → T4.3** (private guest pages)
5. **T5.1 → T5.2 → T5.3 → T5.4** (admin panel)
6. **T6.1 → T6.2** (bonus — table assignment UI)
