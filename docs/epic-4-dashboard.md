# Epic 4 — Guest Dashboard

#### T4.1 — Dashboard home ✅
**Description:** Hub page guests land on after their first visit. Personalized, warm, functional.
**Acceptance criteria:**
- Personalized greeting: "Bonjour, [prénom] !" using the primary attendee name
- RSVP status summary card: confirmed / pending / declined with a CTA if pending
- ~~Quick-access links to all dashboard sections (Info, RSVP, Seating, Gallery)~~ — removed, redundant with navbar
- ~~"Replay invitation" button → `/{locale}/invitation`~~ — removed, redundant with navbar
- Displayed in guest's language (from `invitation.language`)
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

---

#### T4.2 — RSVP form ✅
**Description:** Form for guests to confirm attendance and provide details per attendee.
**Acceptance criteria:**
- For each pre-registered attendee in the invitation:
  - Name (read-only)
  - Attending: Yes / No toggle
  - Dietary restrictions: checkboxes (Vegetarian, Vegan, Gluten-free, Allergies) + free text "Other" (shown only if attending)
- If `allowPlusOne = true`:
  - "Add a +1" button appears
  - +1 form: name (required), attending (defaults Yes), dietary restrictions
  - Guest can remove the +1 before or after submitting
- Submits to `POST /api/rsvp`:
  - Updates `attending` and `dietaryRestrictions` for each attendee
  - Creates/updates/deletes the +1 attendee as needed
  - Sets `rsvpStatus` on invitation to `confirmed` (if any attending) or `declined` (if none)
  - Sets `rsvpSubmittedAt` timestamp
- Shows confirmation message with summary on success
- Pre-fills with existing data if already submitted
- Editable (guest can update their answer)
- Bilingual labels and validation messages
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

---

#### T4.3 — Practical info page ✅
**Description:** Everything guests need to know — schedule, venue, logistics. All content comes from translation files.
**Acceptance criteria:**
- Wedding day timeline / schedule section (vertical timeline component — time, title, location, icon)
- Venue section: address, embedded map (Leaflet iframe or static map)
- Transport & parking section
- All text bilingual, content defined in `messages/fr.json` and `messages/en.json`
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

---

#### T4.4 — Seating map ✅
**Description:** Visual map of the room showing table assignments.
**Acceptance criteria:**
- SVG-based room layout with tables positioned using `Table.positionX/Y` from DB
- Background image (top-down floor plan) with table circles overlaid at pixel-exact positions
- Current guest's table is visually highlighted (accent color + glow ring)
- "You are seated at Table X" banner at top
- If `seatingEnabled = false` in Settings: "Seating plan not yet available" message
- If no table assigned yet: "Table assignments coming soon" message
- Feature flag: `Settings.seatingEnabled` boolean (DB singleton) — toggled by admin
- All guests on the same invitation share the same table number
- [x] Post-ticket check: acceptance criteria verified (functional test)
- [x] Post-ticket check: code quality reviewed
- [x] Post-ticket check: refactor opportunities identified and addressed
- [x] Post-ticket check: directory layout is clean and well-organized

---

#### T4.5 — Photo gallery
**Description:** A grid of couple photos with lightbox.
**Acceptance criteria:**
- Responsive photo grid (uniform grid or masonry)
- Lightbox on click: full-screen view with prev/next navigation and close button
- Placeholder images for now (replaced with real photos before the event)
- Lazy loading for performance
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized
