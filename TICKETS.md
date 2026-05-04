# Ticket Status

> Last updated: 2026-04-07 (security audit report added; Datadog observability epic created)

| Ticket | Title | Status | Epic file |
|--------|-------|--------|-----------|
| T1.1 | Initialize Next.js project | ✅ Done | [epic-1](docs/epic-1-foundation.md) |
| T1.2 | Set up i18n with next-intl | ✅ Done | [epic-1](docs/epic-1-foundation.md) |
| T1.3 | Design tokens & visual identity | ✅ Done | [epic-1](docs/epic-1-foundation.md) |
| T1.4 | Route groups & base layouts | ✅ Done | [epic-1](docs/epic-1-foundation.md) |
| T2.1 | Gate page | ✅ Done | [epic-2](docs/epic-2-auth.md) |
| T2.2 | Token login & session | ✅ Done | [epic-2](docs/epic-2-auth.md) |
| T2.3 | Auth middleware | ✅ Done | [epic-2](docs/epic-2-auth.md) |
| T2.4 | QR code generation utility | ✅ Done | [epic-2](docs/epic-2-auth.md) |
| T2.5 | Request link by email | ⬜ Optional | [epic-2](docs/epic-2-auth.md) |
| T2.6 | Middleware hardening: explicit allowlist + default deny | ✅ Done | [epic-2](docs/epic-2-auth.md) |
| T3.1 | Cinematic invitation page | ✅ Done | [epic-3](docs/epic-3-invitation.md) |
| T4.1 | Dashboard home | ✅ Done | [epic-4](docs/epic-4-dashboard.md) |
| T4.2 | RSVP form | ✅ Done | [epic-4](docs/epic-4-dashboard.md) |
| T4.3 | Practical info page | ✅ Done | [epic-4](docs/epic-4-dashboard.md) |
| T4.4 | Seating map | ✅ Done | [epic-4](docs/epic-4-dashboard.md) |
| T4.5.a | Photo gallery — storage abstraction & MinIO local dev | ✅ Done | [epic-4](docs/epic-4-dashboard.md) |
| T4.5.b | Photo gallery — grid page & empty state | ✅ Done | [epic-4](docs/epic-4-dashboard.md) |
| T4.5.c | Photo gallery — lightbox & download (presigned URLs) | ✅ Done | [epic-4](docs/epic-4-dashboard.md) |
| T5.1 | Admin login | ✅ Done | [epic-5](docs/epic-5-admin.md) |
| T5.2 | Guest list dashboard | ✅ Done | [epic-5](docs/epic-5-admin.md) |
| T5.3 | Guest detail sheet & create invitation | ✅ Done | [epic-5](docs/epic-5-admin.md) |
| T5.4 | QR code bulk export | ⬜ Todo | [epic-5](docs/epic-5-admin.md) |
| T5.5 | QR code image generation | ⬜ Todo | [epic-5](docs/epic-5-admin.md) |
| T6.1 | Table management CRUD | ⬜ Bonus | [epic-6](docs/epic-6-tables.md) |
| T6.2 | Drag-and-drop table assignment | ⬜ Bonus | [epic-6](docs/epic-6-tables.md) |
| T7.0 | Infrastructure & hosting design | ⬜ Todo | [epic-7](docs/epic-7-production.md) |
| T7.0.a | App deployment setup | ⬜ Todo | [epic-7](docs/epic-7-production.md) |
| T7.0.b | Database migration for production | ⬜ Todo | [epic-7](docs/epic-7-production.md) |
| T7.0.c | Photo storage setup | ⬜ Todo | [epic-7](docs/epic-7-production.md) |
| T7.0.d | Email provider integration | ⬜ Todo | [epic-7](docs/epic-7-production.md) |
| T7.1 | Harden and ship | ⬜ Todo | [epic-7](docs/epic-7-production.md) |
| T7.1.j | Security audit report | ⬜ Todo | [epic-7](docs/epic-7-production.md) |
| T7.1.k | Handle stale session cookies (deleted invitations) | ⬜ Todo | [epic-7](docs/epic-7-production.md) |
| T8.0 | Dev CLI for manual testing | ✅ Done | [epic-8](docs/epic-8-qa.md) |
| T8.1 | Test infrastructure setup (Vitest) | ⬜ Todo | [epic-8](docs/epic-8-qa.md) |
| T8.2 | Unit tests: session & auth utilities | ⬜ Todo | [epic-8](docs/epic-8-qa.md) |
| T8.3 | API route tests: auth & access control | ⬜ Todo | [epic-8](docs/epic-8-qa.md) |
| T8.4 | GitHub Actions CI pipeline | ⬜ Todo | [epic-8](docs/epic-8-qa.md) |
| T8.5 | Vercel preview deployment (preprod) | ⬜ Todo | [epic-8](docs/epic-8-qa.md) |

| T10.1 | Datadog agent setup & local dev | ⬜ Todo | [epic-10](docs/epic-10-observability.md) |
| T10.2 | Application tracing (APM) | ⬜ Todo | [epic-10](docs/epic-10-observability.md) |
| T10.3 | Structured logging | ⬜ Todo | [epic-10](docs/epic-10-observability.md) |
| T10.4 | Application metrics (custom) | ⬜ Todo | [epic-10](docs/epic-10-observability.md) |
| T10.5 | Error tracking | ⬜ Todo | [epic-10](docs/epic-10-observability.md) |
| T10.6 | Infrastructure agent & host metrics | ⬜ Todo | [epic-10](docs/epic-10-observability.md) |
| T10.7 | Database monitoring | ⬜ Todo | [epic-10](docs/epic-10-observability.md) |
| T10.8 | Uptime monitoring & synthetic tests | ⬜ Todo | [epic-10](docs/epic-10-observability.md) |
| T10.9 | Observability dashboard & runbook | ⬜ Todo | [epic-10](docs/epic-10-observability.md) |

| T11.1 | Login route hardcodes `/fr` locale | ✅ Done | [epic-11](docs/epic-11-bugs.md) |
| T11.2 | Missing DELETE route for admin invitations | ⬜ Todo | [epic-11](docs/epic-11-bugs.md) |
| T11.3 | RSVP form allows submission with null attending | ✅ Done | [epic-11](docs/epic-11-bugs.md) |
| T11.4 | CryptoKey re-imported on every session op | ⬜ Todo | [epic-11](docs/epic-11-bugs.md) |
| T11.5 | Admin guest list stale data after refresh | ⬜ Todo | [epic-11](docs/epic-11-bugs.md) |
| T11.6 | Dockerfile runs dev server in production | ⬜ Todo | [epic-11](docs/epic-11-bugs.md) |
| T11.7 | Photo listing unbounded (max 1000) | ⬜ Todo | [epic-11](docs/epic-11-bugs.md) |
| T11.8 | S3 errors swallowed as "not found" | ⬜ Todo | [epic-11](docs/epic-11-bugs.md) |
| T11.9 | timingSafeCompare leaks signature length | ⬜ Todo | [epic-11](docs/epic-11-bugs.md) |
| T11.10 | Empty `package-lock.json` | ✅ Done | [epic-11](docs/epic-11-bugs.md) |
| T11.11 | `.dockerignore` doesn't exclude secrets/local DB | ✅ Done | [epic-11](docs/epic-11-bugs.md) |
| T11.12 | Admin invitations PATCH rejects partial updates | ✅ Done | [epic-11](docs/epic-11-bugs.md) |
| T11.13 | Top-level `app/layout.tsx` returns only a fragment | ✅ Done | [epic-11](docs/epic-11-bugs.md) |

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ Done | Implemented, committed, post-ticket checks passed |
| 🔜 Next | Planned next ticket |
| ⬜ Todo | Not started |
| ⬜ Optional | Low priority / skippable |
| ⬜ Bonus | Nice-to-have, implement after core is done |
