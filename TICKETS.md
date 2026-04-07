# Ticket Status

> Last updated: 2026-03-27 (T4.5 expanded into sub-tickets; onDelete:Cascade done)

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
| T4.5.a | Photo gallery — storage abstraction & MinIO local dev | ⬜ Todo | [epic-4](docs/epic-4-dashboard.md) |
| T4.5.b | Photo gallery — grid page & empty state | ⬜ Todo | [epic-4](docs/epic-4-dashboard.md) |
| T4.5.c | Photo gallery — lightbox & download (presigned URLs) | ⬜ Todo | [epic-4](docs/epic-4-dashboard.md) |
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
| T8.1 | Test infrastructure setup (Vitest + Playwright) | ⬜ Todo | [epic-8](docs/epic-8-qa.md) |
| T8.2 | Unit tests: session & auth utilities | ⬜ Todo | [epic-8](docs/epic-8-qa.md) |
| T8.3 | E2E tests: guest flows | ⬜ Todo | [epic-8](docs/epic-8-qa.md) |
| T8.4 | E2E tests: admin flows | ⬜ Todo | [epic-8](docs/epic-8-qa.md) |
| T8.5 | GitHub Actions CI pipeline | ⬜ Todo | [epic-8](docs/epic-8-qa.md) |

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ Done | Implemented, committed, post-ticket checks passed |
| 🔜 Next | Planned next ticket |
| ⬜ Todo | Not started |
| ⬜ Optional | Low priority / skippable |
| ⬜ Bonus | Nice-to-have, implement after core is done |
