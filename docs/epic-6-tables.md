# Epic 6 — Table Assignment (Bonus)

#### T6.1 — Table management CRUD
**Description:** Admin can create, edit and delete tables.
**Acceptance criteria:**
- Admin page at `/admin/tables`
- Create table: number, label, capacity, position (x, y)
- Edit and delete existing tables
- Validation: table number must be unique
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized

---

#### T6.2 — Drag-and-drop table assignment
**Description:** Visual interface to assign invitations to tables.
**Acceptance criteria:**
- Left panel: unassigned invitations list with attendee count
- Right panel: visual table map (same layout as T4.4)
- Drag an invitation onto a table to assign it
- Table shows current occupancy vs capacity
- Warning indicator when a table exceeds capacity
- Changes saved to DB on drop (`PATCH /api/admin/invitations/[id]`)
- [ ] Post-ticket check: acceptance criteria verified (functional test)
- [ ] Post-ticket check: code quality reviewed
- [ ] Post-ticket check: refactor opportunities identified and addressed
- [ ] Post-ticket check: directory layout is clean and well-organized
