import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

type AttendeeInput = { name: string; isPrimary: boolean };

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { groupLabel, allowPlusOne, tableNumber, attendees } =
    await request.json();

  if (typeof groupLabel !== "string" || groupLabel.trim().length === 0)
    return Response.json({ error: "groupLabel must be a non-empty string" }, { status: 400 });
  if (allowPlusOne !== undefined && typeof allowPlusOne !== "boolean")
    return Response.json({ error: "allowPlusOne must be a boolean" }, { status: 400 });
  if (tableNumber !== undefined && tableNumber !== null && (typeof tableNumber !== "number" || !Number.isInteger(tableNumber)))
    return Response.json({ error: "tableNumber must be an integer or null" }, { status: 400 });
  if (!Array.isArray(attendees) || attendees.length === 0)
    return Response.json({ error: "attendees must be a non-empty array" }, { status: 400 });

  const validAttendees = attendees.filter(
    (a: unknown): a is AttendeeInput =>
      typeof a === "object" && a !== null &&
      typeof (a as AttendeeInput).name === "string" &&
      (a as AttendeeInput).name.trim().length > 0
  );
  if (validAttendees.length === 0)
    return Response.json({ error: "At least one attendee with a non-empty name is required" }, { status: 400 });

  try {
    const created = await prisma.invitation.create({
      data: {
        token: randomBytes(16).toString("hex"),
        groupLabel: groupLabel.trim(),
        allowPlusOne: allowPlusOne ?? false,
        tableNumber: tableNumber ?? null,
        attendees: {
          create: validAttendees.map((a) => ({
            name: a.name.trim(),
            isPrimary: !!a.isPrimary,
            isPlusOne: false,
          })),
        },
      },
      include: { attendees: { orderBy: { isPrimary: "desc" } } },
    });

    return Response.json(created, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
