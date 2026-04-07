# Epic 9 — Data Model: Group/Attendee Redesign

**Status:** Design / In Progress
**Priority:** High — affects Epic 5 (admin), Epic 3 (RSVP), Epic 6 (seating)

---

## Problem

The current `Invitation` model conflates two distinct concepts:
- The **household unit** that receives an invite (token, login, group label)
- The **RSVP state** rolled up from individual attendee decisions

This creates ambiguity: `Invitation.rsvpStatus` is a string that duplicates/conflicts with
`Attendee.attending` booleans. It's also unclear what `isPrimary` means in the UI.

---

## Proposed Model

### Core concept: Group + Attendee

A **Group** is the household that receives a single invitation (token, login link).
An **Attendee** is an individual person within the group.

```
Group (currently: Invitation)
  ├── token           ← login link, one per group
  ├── groupLabel      ← household name ("Famille Martin", "Sophie & Marc")
  ├── email           ← contact email for the group
  ├── language        ← preferred language (fr/en)
  ├── allowPlusOne    ← whether the group can add a +1
  ├── tableNumber     ← assigned table (from admin)
  └── Attendee[]
        ├── name
        ├── isPrimary   ← ONE per group: this person can log in and submit for everyone
        ├── isPlusOne   ← was added as +1 (by primary member)
        ├── attending   ← individual decision (true/false/null=pending)
        └── dietaryRestrictions

Settings
  ├── rsvpLocked
  └── seatingEnabled
```

### What `isPrimary` means
- The primary attendee is the **account holder** for the group
- They log in via the token link
- They can **edit all attendees** in the group (add/remove +1, answer for children)
- Non-primary attendees are dependents: children, +1s, partners who share the same invite

### What happens to `Invitation.rsvpStatus`
Two options to decide:
- **Option A (derived)**: Remove `rsvpStatus` from Group. Derive status from attendees:
  - `pending` = at least one attendee has `attending = null`
  - `partial` = some attending, some not
  - `confirmed` = all non-null and at least one attending
  - `declined` = all attendees attending=false
- **Option B (submitted flag)**: Keep a `rsvpSubmittedAt` timestamp only. Status is derived
  from attendees. The admin sees "submitted on [date]" vs "not yet submitted".

**Recommendation: Option B** — keep `rsvpSubmittedAt` to know if the group has actively
responded, then derive confirmed/declined/pending from attendees.

---

## Dashboard implications

### Guest list view (T5.2)
Currently shows one row per invitation with a single RSVP badge.
With this model:
- Show group name + number of attendees
- Show derived status: `3 confirmed / 1 declined` or `pending`
- Dietary column: show count summary (e.g. `1 vegan, 1 sans gluten`)

### Guest detail view (T5.3)
- Edit group-level fields (label, email, language, allowPlusOne, table)
- List all attendees with individual attending + dietary
- Add attendee inline (for admin to pre-populate children/partners)
- Mark an attendee as `isPrimary` (only one allowed)

### RSVP flow (Epic 3) implications
- Primary attendee logs in, sees form for all group members
- Can add a +1 if `allowPlusOne=true` and no +1 exists yet
- Submits for everyone → sets `rsvpSubmittedAt`

---

## Migration plan

### Schema changes
1. Rename `Invitation` → `Group` in schema (or keep as `Invitation` but align conceptually)
   - **Decision needed**: rename or keep? Renaming requires a migration + updating all imports
2. Remove `Invitation.rsvpStatus` (string) → derive from attendees
   - Or: keep as a cache field that gets recomputed on RSVP submit
3. Keep `rsvpSubmittedAt` (already exists)
4. `isPrimary` stays as-is on Attendee — semantics clarified in code

### Breaking changes
- All places reading `invitation.rsvpStatus` must switch to derived logic
- Admin guest list badge logic changes
- RSVP API: no longer writes `rsvpStatus`, only writes `rsvpSubmittedAt` + individual attendees

---

## Tickets

| ID | Title | Status |
|----|-------|--------|
| T9.1 | Decide on rename: Invitation → Group | 🔵 To Do |
| T9.2 | Remove rsvpStatus — derive from attendees | 🔵 To Do |
| T9.3 | Update guest list dashboard for new derived status | 🔵 To Do |
| T9.4 | Update RSVP API and flow for new model | 🔵 To Do |
| T9.5 | Update admin guest detail for new model | 🔵 To Do |

---

## Open questions

1. **Rename `Invitation` → `Group` in the DB?**
   Pro: clearer semantics. Con: migration + all files change.
   Alternative: keep DB model as `Invitation`, rename only in UI labels.

2. **Can a group have multiple primaries?**
   Probably not — token is one per group, so one login = one primary.

3. **What if all attendees decline — is the group status "declined"?**
   Yes. Derived: all `attending=false` → group = declined.

4. **Should dietary breakdown be stored or always computed on read?**
   Always computed on read — no denormalization needed at this scale.
