import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { groupLabel, allowPlusOne, tableNumber } = await request.json();

  const updated = await prisma.invitation.update({
    where: { id },
    data: { groupLabel, allowPlusOne, tableNumber },
    include: { attendees: { orderBy: { isPrimary: "desc" } } },
  });

  return Response.json(updated);
}
