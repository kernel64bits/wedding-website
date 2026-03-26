"use client";

import { useState } from "react";
import Link from "next/link";
import type { Invitation, Attendee } from "@prisma/client";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type InvitationWithAttendees = Invitation & { attendees: Attendee[] };

function statusBadge(status: string) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  if (status === "confirmed")
    return <span className={`${base} bg-green-100 text-green-800`}>Confirmed</span>;
  if (status === "declined")
    return <span className={`${base} bg-red-100 text-red-800`}>Declined</span>;
  return <span className={`${base} bg-gray-100 text-gray-600`}>Pending</span>;
}

function formatDate(date: Date | null) {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function GuestListClient({
  invitations,
}: {
  invitations: InvitationWithAttendees[];
}) {
  const [search, setSearch] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");

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
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
        </select>
        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All tables</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <span className="ml-auto self-center text-sm text-muted-foreground">
          {filtered.length} / {invitations.length}
        </span>
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
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/guests/${inv.id}`}
                        className="hover:underline"
                      >
                        {inv.groupLabel}
                      </Link>
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
    </div>
  );
}
