import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const invitations = await prisma.invitation.findMany({
    include: { attendees: true },
    orderBy: { createdAt: "asc" },
  });

  const header =
    "Group,Attendee,Plus One,Attending,Dietary,RSVP Status,Table,Last Login";

  const rows = invitations.flatMap((inv) =>
    inv.attendees.map((att) =>
      [
        `"${inv.groupLabel.replace(/"/g, '""')}"`,
        `"${att.name.replace(/"/g, '""')}"`,
        att.isPlusOne ? "yes" : "no",
        att.attending === true
          ? "yes"
          : att.attending === false
            ? "no"
            : "pending",
        `"${(att.dietaryRestrictions ?? "").replace(/"/g, '""')}"`,
        inv.rsvpStatus,
        inv.tableNumber ?? "",
        inv.lastLoginAt ? inv.lastLoginAt.toISOString() : "never",
      ].join(",")
    )
  );

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="guests.csv"',
    },
  });
}
