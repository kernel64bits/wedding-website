"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Invitation, Attendee } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, X } from "lucide-react";

type InvitationWithAttendees = Invitation & { attendees: Attendee[] };

type SaveStatus = "idle" | "saving" | "saved" | "error";

const selectClassName =
  "rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

function statusBadge(status: string) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  if (status === "confirmed")
    return <span className={`${base} bg-green-100 text-green-800`}>Confirmed</span>;
  if (status === "declined")
    return <span className={`${base} bg-red-100 text-red-800`}>Declined</span>;
  return <span className={`${base} bg-gray-100 text-gray-600`}>Pending</span>;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function GuestListClient({
  invitations,
  baseUrl,
}: {
  invitations: InvitationWithAttendees[];
  baseUrl: string;
}) {
  const router = useRouter();

  // List state
  const [search, setSearch] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");

  // Sheet state
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const selectedInv =
    selectedId && selectedId !== "new"
      ? (invitations.find((i) => i.id === selectedId) ?? null)
      : null;

  // Edit form
  const [editGroupLabel, setEditGroupLabel] = useState("");
  const [editAllowPlusOne, setEditAllowPlusOne] = useState(false);
  const [editTableNumber, setEditTableNumber] = useState("");

  // Create form
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [newAllowPlusOne, setNewAllowPlusOne] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newAttendees, setNewAttendees] = useState([
    { name: "", isPrimary: true },
  ]);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    setSaveStatus("idle");
    if (selectedId === "new") {
      setNewGroupLabel("");
      setNewAllowPlusOne(false);
      setNewTableNumber("");
      setNewAttendees([{ name: "", isPrimary: true }]);
    } else if (selectedInv) {
      setEditGroupLabel(selectedInv.groupLabel);
      setEditAllowPlusOne(selectedInv.allowPlusOne);
      setEditTableNumber(selectedInv.tableNumber?.toString() ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const filtered = invitations.filter((inv) => {
    if (rsvpFilter !== "all" && inv.rsvpStatus !== rsvpFilter) return false;
    if (tableFilter === "assigned" && inv.tableNumber === null) return false;
    if (tableFilter === "unassigned" && inv.tableNumber !== null) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesGroup = inv.groupLabel.toLowerCase().includes(q);
      const matchesAttendee = inv.attendees.some((a) =>
        a.name.toLowerCase().includes(q)
      );
      if (!matchesGroup && !matchesAttendee) return false;
    }
    return true;
  });

  async function handleSaveEdit() {
    if (!selectedId || selectedId === "new") return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/admin/invitations/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupLabel: editGroupLabel,
          allowPlusOne: editAllowPlusOne,
          tableNumber: editTableNumber !== "" ? Number(editTableNumber) : null,
        }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus("saved");
      router.refresh();
      setTimeout(() => setSelectedId(null), 600);
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleCreate() {
    const attendees = newAttendees.filter((a) => a.name.trim());
    if (!newGroupLabel.trim() || attendees.length === 0) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupLabel: newGroupLabel,
          allowPlusOne: newAllowPlusOne,
          tableNumber: newTableNumber !== "" ? Number(newTableNumber) : null,
          attendees,
        }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus("saved");
      router.refresh();
      setTimeout(() => setSelectedId(null), 600);
    } catch {
      setSaveStatus("error");
    }
  }

  function saveLabel() {
    if (saveStatus === "saving") return "Saving…";
    if (saveStatus === "saved") return "Saved ✓";
    if (saveStatus === "error") return "Error — try again";
    return selectedId === "new" ? "Create" : "Save Changes";
  }

  const loginUrl = selectedInv
    ? `${baseUrl}/api/login?token=${selectedInv.token}`
    : "";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or group…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={rsvpFilter}
          onChange={(e) => setRsvpFilter(e.target.value)}
          className={selectClassName}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
        </select>
        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className={selectClassName}
        >
          <option value="all">All tables</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <span className="self-center text-sm text-muted-foreground">
          {filtered.length} / {invitations.length}
        </span>
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => setSelectedId("new")}
        >
          <Plus className="mr-1 h-4 w-4" />
          New
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Group</TableHead>
              <TableHead>Attendees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Headcount</TableHead>
              <TableHead>Dietary</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Last Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No guests match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => {
                const attending = inv.attendees.filter(
                  (a) => a.attending === true
                ).length;
                const total = inv.attendees.length;
                const dietary = inv.attendees
                  .map((a) => a.dietaryRestrictions)
                  .filter(Boolean)
                  .join(", ");

                return (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(inv.id)}
                  >
                    <TableCell className="font-medium">
                      {inv.groupLabel}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.attendees.map((a) => a.name).join(", ")}
                    </TableCell>
                    <TableCell>{statusBadge(inv.rsvpStatus)}</TableCell>
                    <TableCell>
                      {inv.rsvpStatus === "pending"
                        ? "—"
                        : `${attending} / ${total}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dietary || "—"}
                    </TableCell>
                    <TableCell>
                      {inv.tableNumber ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(inv.lastLoginAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Side Sheet */}
      <Sheet
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-md"
          aria-describedby={undefined}
        >
          {selectedId === "new" ? (
            /* ── Create form ── */
            <>
              <SheetHeader className="px-6 pt-6">
                <SheetTitle>New Invitation</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 px-6 pb-6">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Group label <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={newGroupLabel}
                    onChange={(e) => setNewGroupLabel(e.target.value)}
                    placeholder="e.g. Famille Dupont"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="new-plus-one"
                    type="checkbox"
                    checked={newAllowPlusOne}
                    onChange={(e) => setNewAllowPlusOne(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label htmlFor="new-plus-one" className="text-sm">
                    Allow +1
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Table # <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    placeholder="—"
                    className="w-28"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Attendees <span className="text-destructive">*</span>
                  </label>
                  <div className="space-y-2">
                    {newAttendees.map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={a.name}
                          onChange={(e) => {
                            const next = [...newAttendees];
                            next[i] = { ...next[i], name: e.target.value };
                            setNewAttendees(next);
                          }}
                          placeholder="Full name"
                          className="flex-1"
                        />
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <input
                            type="radio"
                            name="primary"
                            checked={a.isPrimary}
                            onChange={() => {
                              setNewAttendees(
                                newAttendees.map((att, j) => ({
                                  ...att,
                                  isPrimary: j === i,
                                }))
                              );
                            }}
                          />
                          Primary
                        </label>
                        {newAttendees.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setNewAttendees(
                                newAttendees
                                  .filter((_, j) => j !== i)
                                  .map((att, j) =>
                                    j === 0
                                      ? { ...att, isPrimary: true }
                                      : att
                                  )
                              )
                            }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setNewAttendees([
                          ...newAttendees,
                          { name: "", isPrimary: false },
                        ])
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add attendee
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    disabled={saveStatus === "saving"}
                    onClick={handleCreate}
                  >
                    {saveLabel()}
                  </Button>
                  {saveStatus === "error" && (
                    <p className="text-sm text-destructive">
                      Something went wrong.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : selectedInv ? (
            /* ── Edit form ── */
            <>
              <SheetHeader className="px-6 pt-6">
                <SheetTitle>{selectedInv.groupLabel}</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 px-6 pb-6">
                {/* Table number — only editable field */}
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Table #
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={editTableNumber}
                    onChange={(e) => setEditTableNumber(e.target.value)}
                    placeholder="—"
                    className="w-28"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    disabled={saveStatus === "saving"}
                    onClick={handleSaveEdit}
                  >
                    {saveLabel()}
                  </Button>
                  {saveStatus === "error" && (
                    <p className="text-sm text-destructive">
                      Something went wrong.
                    </p>
                  )}
                </div>

                {/* Read-only info */}
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invitation viewed</span>
                    <span>{formatDate(selectedInv.invitationViewedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RSVP submitted</span>
                    <span>{formatDate(selectedInv.rsvpSubmittedAt)}</span>
                  </div>
                  <div className="mt-2">
                    <p className="mb-1 text-muted-foreground">Login URL</p>
                    <Input
                      readOnly
                      value={loginUrl}
                      className="bg-muted text-xs"
                      onClick={(e) =>
                        (e.target as HTMLInputElement).select()
                      }
                    />
                  </div>
                </div>

                {/* Attendees */}
                <div className="border-t pt-4">
                  <p className="mb-2 text-sm font-medium">Attendees</p>
                  <div className="space-y-1">
                    {selectedInv.attendees.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {a.name}
                          {a.isPrimary && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (primary)
                            </span>
                          )}
                          {a.isPlusOne && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (+1)
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground">
                          {a.attending === true
                            ? "✓"
                            : a.attending === false
                            ? "✗"
                            : "—"}
                          {a.dietaryRestrictions
                            ? ` · ${a.dietaryRestrictions}`
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
