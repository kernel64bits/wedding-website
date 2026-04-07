import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionValue, GUEST_COOKIE } from "@/lib/session";
import { requestOrigin } from "@/lib/request";

const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const invalidUrl = new URL("/fr?error=invalid_token", requestOrigin(request));

  if (!token) {
    return NextResponse.redirect(invalidUrl);
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    return NextResponse.redirect(invalidUrl);
  }

  const destination = invitation.invitationViewedAt === null
    ? "/fr/invitation"
    : "/fr/home";

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { lastLoginAt: new Date() },
  });

  const response = NextResponse.redirect(new URL(destination, requestOrigin(request)));
  response.cookies.set(GUEST_COOKIE, await createSessionValue(invitation.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_S,
    path: "/",
  });

  return response;
}
