# Wedding Website

A bilingual (FR/EN) wedding website with a public section, a private guest area (RSVP, seating map), and an admin panel.

**Stack:** Next.js 15 · Tailwind CSS v4 · shadcn/ui · Prisma · SQLite · Docker

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
