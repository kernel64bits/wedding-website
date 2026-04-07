# Wedding Website

A bilingual (FR/EN) wedding website with a public section, a private guest area (RSVP, seating map), and an admin panel.

**Stack:** Next.js 16 · Tailwind CSS v4 · shadcn/ui · Prisma 7 · SQLite · MinIO (S3) · Docker

---

## Getting started

**Prerequisites:** Docker and Docker Compose.

```bash
# Copy environment variables (first time only)
cp .env.example .env
# Generate a session secret
openssl rand -hex 32
# Paste the output into .env as SESSION_SECRET=...

# Start all services (app + MinIO)
docker compose up --build

# Initialize the database (first time only)
docker compose exec app npx prisma db push

# Seed test data
docker compose exec app node prisma/seed.mjs
docker compose exec app node prisma/seed-guests.mjs
docker compose exec app node scripts/seed-photos.mjs
```

Day-to-day, `docker compose up` is enough — hot reload is enabled via bind mount.

### Services

| Service | URL | Purpose |
|---------|-----|---------|
| App | http://localhost:3000 | Next.js dev server |
| MinIO API | http://localhost:9000 | S3-compatible object storage (photos) |
| MinIO Console | http://localhost:9001 | Web UI to browse buckets (login: `minioadmin` / `minioadmin`) |
| Prisma Studio | http://localhost:5555 | Database browser (start manually, see below) |

---

## Common tasks

**Add a shadcn/ui component**
```bash
docker compose exec app npx shadcn@latest add <component>
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

**Seed data**
```bash
# Core data (admin account + test invitation)
docker compose exec app node prisma/seed.mjs

# Sample guest invitations (9 realistic entries)
docker compose exec app node prisma/seed-guests.mjs

# Sample photos to MinIO (6 wedding photos)
docker compose exec app node scripts/seed-photos.mjs
```
Seeds are idempotent — re-running them overwrites existing data. Never run `seed.mjs` in production (it creates a test token).

**Log in as a guest**
```
http://localhost:3000/api/login?token=<token>
```
Validates the token, sets the session cookie, and redirects to `/invitation` (first visit) or `/home` (returning visit). Use `test-token-123` after seeding.

**Log in as admin**
Navigate to http://localhost:3000/admin/login. Default credentials after seeding: `admin` / `admin1234`.

---

## Project structure

```
app/                  # Next.js App Router pages and layouts
  [locale]/           #   Guest-facing pages (i18n routed)
  admin/              #   Admin panel (no i18n)
  api/                #   API routes (login, rsvp, admin CRUD)
components/
  ui/                 #   shadcn/ui components (committed source files)
  admin/              #   Admin-specific components (guest list, etc.)
  gallery/            #   Photo gallery components (planned)
  invitation/         #   Cinematic invitation page components
lib/                  # Shared utilities
  prisma.ts           #   Prisma client singleton + getSettings()
  session.ts          #   HMAC session signing/verification (Web Crypto API)
  storage.ts          #   S3 client singleton + listPhotos() + getDownloadUrl()
  utils.ts            #   cn() helper (clsx + tailwind-merge)
middleware.ts         # Route protection (allowlist + default deny)
prisma/               # Database schema and seed scripts
scripts/              # Utility scripts (photo seeding)
messages/             # i18n translation files (fr.json, en.json)
docs/                 # Epic specs and ticket tracking
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
| `@aws-sdk/client-s3` | 3 | S3 client — list/get/put objects in MinIO (dev) or AWS S3 (prod) |
| `@aws-sdk/s3-request-presigner` | 3 | Generate presigned URLs for photo downloads |

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

### Infrastructure

| Service | Image | Purpose |
|---------|-------|---------|
| MinIO | `minio/minio` | S3-compatible object storage for wedding photos (local dev) |

---

## Environment variables

Copy `.env.example` to `.env` before first run:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `SESSION_SECRET` | *(required)* | 64 hex chars — run `openssl rand -hex 32` to generate |
| `BASE_URL` | `http://localhost:3000` | App URL (used for login URLs in QR codes) |
| `S3_ENDPOINT` | `http://localhost:9000` | S3 API endpoint (MinIO locally, real S3 in prod) |
| `S3_BUCKET` | `wedding-photos` | Bucket name for photo storage |
| `S3_REGION` | `us-east-1` | AWS region |
| `S3_ACCESS_KEY_ID` | `minioadmin` | S3 access key (MinIO defaults locally) |
| `S3_SECRET_ACCESS_KEY` | `minioadmin` | S3 secret key |

> Inside Docker, `S3_ENDPOINT` is overridden to `http://minio:9000` (Docker internal network). The `.env` value (`localhost:9000`) is for running Next.js outside Docker.

---

## Setting up on a new machine

```bash
git clone <repo-url> && cd wedding-website
cp .env.example .env
# Edit .env: set SESSION_SECRET (openssl rand -hex 32)
docker compose up --build -d
docker compose exec app npx prisma db push
docker compose exec app node prisma/seed.mjs
docker compose exec app node prisma/seed-guests.mjs
docker compose exec app node scripts/seed-photos.mjs
```

The database and MinIO volume start empty on a fresh clone. Seeds populate both.
