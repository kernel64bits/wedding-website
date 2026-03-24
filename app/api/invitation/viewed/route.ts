import { NextResponse } from "next/server";
import { getGuestSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  const session = await getGuestSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.invitation.update({
    where: { id: session.invitationId },
    data: { invitationViewedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
