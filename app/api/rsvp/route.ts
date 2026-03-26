import { NextRequest, NextResponse } from "next/server";
import { getGuestSession } from "@/lib/session";
import { getSettings, prisma } from "@/lib/prisma";

interface AttendeePayload {
  id: string;
  attending: boolean;
  dietaryRestrictions: string;
}

interface PlusOnePayload {
  name: string;
  attending: boolean;
  dietaryRestrictions: string;
}

interface RsvpBody {
  attendees: AttendeePayload[];
  plusOne: PlusOnePayload | null;
}

export async function POST(request: NextRequest) {
  const session = await getGuestSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check RSVP lock
  const settings = await getSettings();
  if (settings.rsvpLocked === true) {
    return NextResponse.json({ error: "RSVP is locked" }, { status: 423 });
  }

  // Parse body
  let body: RsvpBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { attendees, plusOne } = body;

  if (!Array.isArray(attendees) || attendees.length === 0) {
    return NextResponse.json({ error: "attendees is required" }, { status: 400 });
  }

  if (plusOne != null) {
    if (typeof plusOne.name !== "string" || plusOne.name.trim() === "") {
      return NextResponse.json({ error: "plusOne.name is required" }, { status: 400 });
    }
    if (plusOne.dietaryRestrictions?.length > 500) {
      return NextResponse.json({ error: "dietaryRestrictions too long" }, { status: 400 });
    }
  }

  for (const a of attendees) {
    if (typeof a.attending !== "boolean") {
      return NextResponse.json({ error: "attending must be boolean" }, { status: 400 });
    }
    if (typeof a.dietaryRestrictions === "string" && a.dietaryRestrictions.length > 500) {
      return NextResponse.json({ error: "dietaryRestrictions too long" }, { status: 400 });
    }
  }

  // Verify ownership: all attendee IDs must belong to session's invitation
  const invitation = await prisma.invitation.findUnique({
    where: { id: session.invitationId },
    include: { attendees: true },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  const ownedIds = new Set(
    invitation.attendees.filter((a) => !a.isPlusOne).map((a) => a.id)
  );
  for (const a of attendees) {
    if (!ownedIds.has(a.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Compute new rsvpStatus
  const anyAttending =
    attendees.some((a) => a.attending) ||
    (plusOne != null && plusOne.attending);
  const rsvpStatus = anyAttending ? "confirmed" : "declined";

  // Persist everything in a transaction
  await prisma.$transaction(async (tx) => {
    // Update pre-registered attendees
    for (const a of attendees) {
      await tx.attendee.update({
        where: { id: a.id },
        data: {
          attending: a.attending,
          dietaryRestrictions: a.dietaryRestrictions || null,
        },
      });
    }

    // Handle +1
    const existingPlusOne = invitation.attendees.find((a) => a.isPlusOne);
    if (plusOne) {
      if (existingPlusOne) {
        await tx.attendee.update({
          where: { id: existingPlusOne.id },
          data: {
            name: plusOne.name.trim(),
            attending: plusOne.attending,
            dietaryRestrictions: plusOne.dietaryRestrictions || null,
          },
        });
      } else {
        await tx.attendee.create({
          data: {
            invitationId: invitation.id,
            name: plusOne.name.trim(),
            isPlusOne: true,
            attending: plusOne.attending,
            dietaryRestrictions: plusOne.dietaryRestrictions || null,
          },
        });
      }
    } else if (existingPlusOne) {
      await tx.attendee.delete({ where: { id: existingPlusOne.id } });
    }

    // Update invitation status
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { rsvpStatus, rsvpSubmittedAt: new Date() },
    });
  });

  return NextResponse.json({ ok: true });
}
