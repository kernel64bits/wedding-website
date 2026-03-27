import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { groupLabel, allowPlusOne, tableNumber, attendees } =
    await request.json();

  const created = await prisma.invitation.create({
    data: {
      token: randomBytes(16).toString("hex"),
      groupLabel,
      allowPlusOne: allowPlusOne ?? false,
      tableNumber: tableNumber ?? null,
      attendees: {
        create: attendees.map(
          (a: { name: string; isPrimary: boolean }) => ({
            name: a.name,
            isPrimary: a.isPrimary,
            isPlusOne: false,
          })
        ),
      },
    },
    include: { attendees: { orderBy: { isPrimary: "desc" } } },
  });

  return Response.json(created, { status: 201 });
}
