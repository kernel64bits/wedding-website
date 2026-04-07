# Wedding Website

A bilingual (FR/EN) wedding website with a public section, a private guest area (RSVP, seating map), and an admin panel.

**Stack:** Next.js 16 · Tailwind CSS v4 · shadcn/ui · Prisma 7 · SQLite · Docker

---

## Getting started

**Prerequisites:** Docker and Docker Compose.

```bash
# Start the dev server (http://localhost:3000)
docker compose up --build

# Initialize the database (first time only)
docker compose exec app npx prisma db push
```

Day-to-day, `docker compose up` is enough — hot reload is enabled via bind mount.

---

## Common tasks

**Add a shadcn/ui component**
```bash
docker compose exec app npx shadcn@latest add <component>
# e.g. npx shadcn@latest add dialog
```
The file appears in `components/ui/` on your host. Commit it.

**Add an npm package**
1. Add it to `package.json` and delete `package-lock.json`
2. Rebuild: `docker compose down -v && docker compose up --build`
3. Extract the regenerated lock file: `docker run --rm wedding-website-app cat /app/package-lock.json > package-lock.json`

**Update the database schema**
1. Edit `prisma/schema.prisma`
2. Push: `docker compose exec app npx prisma db push`

**Browse the database (Prisma Studio)**
```bash
docker compose exec app npx prisma studio --browser none --port 5555
```
Then open http://localhost:5555 in your browser.

**Seed test data**
```bash
docker compose exec app node prisma/seed.mjs
```
Creates a test invitation with token `test-token-123`. Never run in production.

**Log in as a guest**
```
http://localhost:3000/api/login?token=<token>
```
Validates the token, sets the session cookie, and redirects to `/invitation` (first visit) or `/home` (returning visit). Use `test-token-123` after seeding.

---

## Project structure

```
app/              # Next.js App Router pages and layouts
components/ui/    # shadcn/ui components (committed, not generated)
lib/              # prisma.ts (singleton), utils.ts (cn helper)
prisma/           # schema.prisma
messages/         # i18n translation files (fr.json, en.json)
```

---

## Dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16 | Framework — App Router, server components, image optimisation, middleware |
| `react` / `react-dom` | 19 | UI rendering |
| `next-intl` | 4 | Internationalisation — bilingual routing (`/fr`, `/en`), translation files |
| `tailwindcss` | 4 | Utility-first CSS — all layout, spacing, colour, and responsive design |
| `radix-ui` | 1 | Headless accessible UI primitives (Dialog, Sheet, etc.) used by shadcn/ui |
| `class-variance-authority` | 0.7 | Typed variant helper used internally by shadcn/ui components |
| `clsx` + `tailwind-merge` | — | Conditional class merging (`cn()` helper in `lib/utils.ts`) |
| `lucide-react` | 0.475 | Icon set — used throughout the UI (arrows, badges, admin icons, etc.) |
| `motion` | 12 | Animation library — cinematic invitation page transitions and effects |
| `@prisma/client` | 7 | Database ORM — type-safe queries against SQLite |
| `@prisma/adapter-libsql` | 7 | Prisma adapter for libsql (Turso-compatible SQLite driver) |
| `@libsql/client` | 0.15 | Low-level libsql client used by the Prisma adapter |
| `bcryptjs` | 3 | Password hashing for admin authentication (pure JS, no native bindings) |

### Dev only

| Package | Purpose |
|---------|---------|
| `prisma` | CLI — `prisma db push`, `prisma studio`, schema migrations |
| `typescript` | Static typing |
| `@types/*` | TypeScript type definitions for Node, React, bcryptjs |
| `eslint` + `eslint-config-next` | Linting |
| `@tailwindcss/postcss` | PostCSS plugin required by Tailwind v4 |

### shadcn/ui components (`components/ui/`)

These are **copied source files**, not npm packages. They depend only on `radix-ui`, `lucide-react`, and `clsx`/`tailwind-merge` — all already listed above.

| Component | Used for |
|-----------|---------|
| `button.tsx` | All buttons across guest and admin UI |
| `badge.tsx` | RSVP status badges in the admin guest list |
| `card.tsx` | Stat cards on the admin dashboard and guest home |
| `input.tsx` | Form inputs in the admin sheet and RSVP form |
| `sheet.tsx` | Slide-in panel for guest detail / create invitation in admin |
| `table.tsx` | Guest list table in the admin dashboard |
| `dialog.tsx` | *(planned — T4.5)* Full-screen lightbox for the photo gallery |

---

## Environment

Copy `.env.example` to `.env` before first run (already done if you cloned the repo):

```bash
cp .env.example .env
```
