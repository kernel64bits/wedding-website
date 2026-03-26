# Wedding Website — Specifications & Tickets

## Context

A bilingual (FR/EN) wedding website. Everything is private — unauthenticated users see only a gate page asking them to scan their QR code.

- **Gate**: single public page — "scan your QR code" message + form to receive the link by email.
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
| Admin auth  | Username + password (bcrypt + session cookie) | Simple, just for the couple |

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
│   │   └── page.tsx              ← public: "scan your QR code" + request link by email
│   ├── (immersive)/
│   │   └── invitation/
│   │       └── page.tsx          ← cinematic first-login experience (auth required)
│   └── (dashboard)/
│       ├── layout.tsx            ← shared navbar + footer (auth required)
│       ├── home/page.tsx         ← hub: greeting, RSVP status, quick links
│       ├── rsvp/page.tsx
│       ├── info/page.tsx         ← schedule, venue, transport
│       ├── seating/page.tsx
│       └── gallery/page.tsx
└── admin/                        ← outside locale (no i18n needed)
    ├── layout.tsx                ← admin shell: html/body/nav (no auth check)
    ├── login/page.tsx            ← public
    └── (protected)/              ← route group: getAdminSession() gate
        ├── layout.tsx            ← redirects to /admin/login if no admin session
        ├── guests/
        │   ├── page.tsx          ← guest list + summary stats
        │   └── [id]/page.tsx     ← guest detail + manual override
        └── tables/page.tsx       ← table management
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
- Username + password login at `/admin/login`.
- Sets a separate admin session cookie (independent from guest cookie).
- Double-protected: middleware rejects requests without a valid admin cookie, AND `app/admin/(protected)/layout.tsx` calls `getAdminSession()` server-side and redirects — neither layer depends on the other.

### Data Model

```
Invitation {
  id                  String    @id @default(cuid())
  token               String    @unique
  groupLabel          String                        // e.g. "Famille Dupont"
  email               String?
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
  username      String   @unique
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

For a quick status overview see **[TICKETS.md](TICKETS.md)**.

Ticket details are split by epic:

| Epic | File |
|------|------|
| Epic 1 — Project Setup | [docs/epic-1-foundation.md](docs/epic-1-foundation.md) |
| Epic 2 — Authentication & Entry | [docs/epic-2-auth.md](docs/epic-2-auth.md) |
| Epic 3 — Invitation Experience | [docs/epic-3-invitation.md](docs/epic-3-invitation.md) |
| Epic 4 — Guest Dashboard | [docs/epic-4-dashboard.md](docs/epic-4-dashboard.md) |
| Epic 5 — Admin Panel | [docs/epic-5-admin.md](docs/epic-5-admin.md) |
| Epic 6 — Table Assignment (Bonus) | [docs/epic-6-tables.md](docs/epic-6-tables.md) |
| Epic 7 — Production Readiness | [docs/epic-7-production.md](docs/epic-7-production.md) |
| Epic 8 — QA & Testing | [docs/epic-8-qa.md](docs/epic-8-qa.md) |

---

## Ticket Dependency Graph

```
T1.1 ──► T1.2 ──► T1.3 ──► T1.4
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
            T2.1            T2.2           T5.1
                              │               │
                    ┌───────T2.3           T5.2 ──► T5.3
                    │         │               │
                   T2.6     T2.4          T5.4 (needs T2.4)
                              │
                    ┌─────────┤
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
                            T7.0 (design: hosting decisions)
                              │
                    ┌─────────┼──────────┐
                    ▼         ▼          ▼
                 T7.0.a   T7.0.b     T7.0.c
                 T7.0.d
                    └─────────┼──────────┘
                              ▼
                            T7.1
```

## Suggested implementation order
1. **T1.1 → T1.2 → T1.3 → T1.4** — foundation + design + layouts
2. **T2.1 → T2.2 → T2.3 → T2.4** — auth system + gate page
3. **T2.6** — middleware hardening (do early, before more routes are added)
4. **T3.1** — cinematic invitation experience
5. **T4.1 → T4.2 → T4.3 → T4.4 → T4.5** — guest dashboard
6. **T5.1 → T5.2 → T5.3 → T5.4** — admin panel
7. **T6.1 → T6.2** — bonus: drag-and-drop table assignment
8. **T7.0** — infrastructure design decisions (gates all T7 implementation)
9. **T7.0.a–d** — deploy, DB, photos, email (from T7.0 decisions)
10. **T7.1** — production hardening (always last, before go-live)
