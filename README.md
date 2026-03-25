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

## Environment

Copy `.env.example` to `.env` before first run (already done if you cloned the repo):

```bash
cp .env.example .env
```
