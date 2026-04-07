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

**Description:** A browsable photo gallery for guests. Photos (thumbnails for display, originals for download) are stored on S3-compatible storage. In local dev, MinIO runs as a Docker container. No upload UI — photos are uploaded by the admin directly via the S3 console or CLI. If no photos are present, the page shows a friendly "coming soon" message.

---

**T4.5.a — Storage abstraction & local dev setup**

*Goal: make the app read photos from S3-compatible storage regardless of environment (real AWS in prod, MinIO in dev), with zero code changes.*

Storage layout in bucket:
```
thumbnails/<filename>.jpg   — compressed, ~1000px wide (used for grid + lightbox display)
originals/<filename>.jpg    — full resolution (~10–12MP, used for guest downloads)
```

Files to create / modify:
- `lib/storage.ts` — thin wrapper around `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`:
  - `listPhotos()` — lists all keys under `thumbnails/`, returns `{ key, thumbnailUrl, originalKey }[]`
  - `getDownloadUrl(originalKey)` — generates a presigned `GetObject` URL for the original (expires in 1h)
  - Reads env vars: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` (optional — set for MinIO/LocalStack, unset for real AWS)
- `docker-compose.yml` — add a `minio` service (image: `minio/minio`, port `9000`, console port `9001`)
- `.env.example` — add photo storage env vars with MinIO defaults
- `docs/photo-setup.md` — short doc explaining how to seed MinIO with test photos and how to upload to real S3 before the event

New dependencies:
```
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
```

Acceptance criteria:
- [ ] `npm run dev` (Docker) + MinIO starts without errors
- [ ] MinIO console reachable at `http://localhost:9001`
- [ ] `listPhotos()` returns an empty array when bucket is empty — no crash
- [ ] `listPhotos()` returns photo metadata after seeding MinIO with test images
- [ ] Swapping to real AWS requires only env var changes (no code changes)

---

**T4.5.b — Gallery page & photo grid**

*Goal: responsive grid of thumbnails, lazy-loaded, with an empty state.*

Files to create / modify:
- `app/[locale]/(dashboard)/gallery/page.tsx` — server component:
  - Calls `listPhotos()` server-side
  - If empty: renders bilingual "no photos yet" message
  - Otherwise: passes photo list to `<PhotoGrid>`
- `components/gallery/PhotoGrid.tsx` — client component:
  - Uniform responsive grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`)
  - Each tile: `<Image>` (next/image) with `loading="lazy"`, fills the grid cell, `object-cover`
  - `onClick` → opens lightbox at the clicked index
- `messages/fr.json` + `messages/en.json` — add `gallery.*` translation keys:
  - `gallery.title`, `gallery.noPhotos`

Acceptance criteria:
- [ ] Empty bucket → "no photos yet" message, no error
- [ ] 10 test photos → grid renders, thumbnails load lazily
- [ ] Grid is responsive across mobile / tablet / desktop
- [ ] Photos are served from MinIO (dev) — no Unsplash/placeholder URLs in code

---

**T4.5.c — Lightbox & download**

*Goal: clicking a thumbnail opens a full-screen lightbox with prev/next and a download button. No new npm packages — built entirely with existing stack.*

No new npm dependencies. Uses:
- `dialog.tsx` — added via `npx shadcn add dialog` (no new package, `radix-ui` already installed)
- `lucide-react` — `ChevronLeft`, `ChevronRight`, `X`, `Download` icons (already installed)
- Vanilla React `useEffect` + `keydown` listener for keyboard navigation
- Vanilla React touch events (`onTouchStart` / `onTouchEnd`) for swipe on mobile

Files to create / modify:
- `components/ui/dialog.tsx` — add via shadcn CLI
- `components/gallery/PhotoLightbox.tsx` — client component:
  - Props: `photos`, `initialIndex`, `open`, `onClose`
  - Full-screen `Dialog` with dark backdrop (`bg-black/90`)
  - Displays current photo with `next/image` (`object-contain`, fills viewport)
  - `ChevronLeft` / `ChevronRight` buttons (absolute positioned, left/right edges)
  - `X` close button (top-right)
  - `Download` button (top-left) — calls `/api/photos/download?key=...`, redirects to presigned URL
  - `useEffect` listens for `ArrowLeft`, `ArrowRight`, `Escape` key events
  - `onTouchStart` / `onTouchEnd` delta > 50px → prev/next
  - Index wraps: `(current - 1 + total) % total` and `(current + 1) % total`
- `components/gallery/PhotoGrid.tsx` — manages `lightboxIndex` state, renders `<PhotoLightbox>`
- `app/api/photos/download/route.ts` — `GET ?key=originals/...`:
  - Verify guest session (`getSession()`)
  - Call `getDownloadUrl(key)`
  - Return `{ url }` — the presigned S3 URL, expires in 1 hour

Acceptance criteria:
- [ ] Clicking a thumbnail opens the lightbox at the correct photo
- [ ] Prev / Next navigate correctly, wraps at ends
- [ ] Left / Right arrow keys navigate; Escape closes
- [ ] Swipe left / right works on mobile
- [ ] Download button triggers download of the full-resolution original
- [ ] Unauthenticated request to `/api/photos/download` → 401
- [ ] Lightbox closes on Escape or clicking the backdrop
- [ ] No new entry in `package.json` dependencies

---

**T4.5.d — Production notes (cross-reference T7.0.c)**

Before go-live:
- Create a real S3 bucket (or Cloudflare R2) and set the production env vars
- Upload compressed thumbnails to `thumbnails/` and originals to `originals/` using the AWS CLI or console
- Consider making the bucket private (only accessible via presigned URLs) so photo URLs can't be shared publicly outside the app
- Remove Unsplash remote image domain from `next.config.ts` `remotePatterns` if no longer used

---

**Acceptance criteria (overall T4.5):**
- [ ] Gallery page accessible at `/{locale}/gallery`
- [ ] Empty state shows correctly in both languages
- [ ] Grid, lightbox, and download all work end-to-end in local dev with MinIO
- [ ] No TypeScript errors, no lint warnings
- [ ] `@aws-sdk` packages added to `package.json`, MinIO in `docker-compose.yml`
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized
