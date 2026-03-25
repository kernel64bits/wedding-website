# Epic 1 — Project Setup

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

> ⚠️ **Never run `npm install` on the host machine.** All package installation happens inside the Docker container. The `node_modules` directory lives in a named Docker volume, not on the host filesystem.

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

---

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

---

#### T1.3 — Design tokens & visual identity ✅
**Description:** Define the visual language of the site — palette, typography, Tailwind theme extension, shadcn theme override. All subsequent UI tickets consume these tokens; none redefine them.
**Acceptance criteria:**
- Color palette defined and documented: primary accent, background gradient, text colors, surface colors — inspired by the prototype (`#8b6f47` warm brown, `#fdfcfb → #e2d1c3` cream/beige)
- Typography chosen: decorative serif for headings/display (e.g. Playfair Display or Cormorant Garamond), clean sans-serif for body (e.g. Inter) — Google Fonts imported
- Tailwind CSS theme extended in `globals.css` with custom color and font tokens
- shadcn/ui CSS variables (oklch) remapped to match the palette (buttons, cards, inputs match the wedding aesthetic, not default shadcn neutrals)
- A `/dev/styles` page (dev-only, not linked in nav) renders: color swatches, typography scale (h1→p), all button variants, card, input, badge — living reference for all subsequent tickets
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

---

#### T1.4 — Route groups & base layouts ✅
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
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized
