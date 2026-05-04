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
  const body = await request.json();

  // PATCH semantics — only validate and update fields that are present.
  const { groupLabel, allowPlusOne, tableNumber } = body;
  const data: {
    groupLabel?: string;
    allowPlusOne?: boolean;
    tableNumber?: number | null;
  } = {};

  if (groupLabel !== undefined) {
    if (typeof groupLabel !== "string" || groupLabel.trim().length === 0)
      return Response.json({ error: "groupLabel must be a non-empty string" }, { status: 400 });
    data.groupLabel = groupLabel.trim();
  }
  if (allowPlusOne !== undefined) {
    if (typeof allowPlusOne !== "boolean")
      return Response.json({ error: "allowPlusOne must be a boolean" }, { status: 400 });
    data.allowPlusOne = allowPlusOne;
  }
  if (tableNumber !== undefined) {
    if (tableNumber !== null && (typeof tableNumber !== "number" || !Number.isInteger(tableNumber)))
      return Response.json({ error: "tableNumber must be an integer or null" }, { status: 400 });
    data.tableNumber = tableNumber;
  }

  if (Object.keys(data).length === 0)
    return Response.json({ error: "No fields to update" }, { status: 400 });

  try {
    const updated = await prisma.invitation.update({
      where: { id },
      data,
      include: { attendees: { orderBy: { isPrimary: "desc" } } },
    });
    return Response.json(updated);
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.invitation.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
