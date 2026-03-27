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

  if (!groupLabel || !Array.isArray(attendees) || attendees.length === 0) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const created = await prisma.invitation.create({
      data: {
        token: randomBytes(16).toString("hex"),
        groupLabel,
        allowPlusOne: allowPlusOne ?? false,
        tableNumber: tableNumber ?? null,
        attendees: {
          create: (attendees as AttendeeInput[]).map((a) => ({
            name: a.name,
            isPrimary: a.isPrimary,
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
