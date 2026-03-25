# Epic 3 — Invitation Experience

#### T3.1 — Cinematic invitation page ✅
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
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized
