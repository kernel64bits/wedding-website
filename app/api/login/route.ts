import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionValue, GUEST_COOKIE } from "@/lib/session";
import { requestOrigin } from "@/lib/request";
import { routing } from "@/i18n/routing";

const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

/**
 * Pick the best supported locale from the Accept-Language header.
 * Falls back to the default locale if no match.
 */
function pickLocale(request: NextRequest): string {
  const header = request.headers.get("accept-language") ?? "";
  // Parse "en-US,en;q=0.9,fr;q=0.8" → primary language tags in order.
  const tags = header
    .split(",")
    .map((part) => part.trim().split(";")[0].toLowerCase().split("-")[0])
    .filter(Boolean);
  const supported = routing.locales as readonly string[];
  for (const tag of tags) {
    if (supported.includes(tag)) return tag;
  }
  return routing.defaultLocale;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const locale = pickLocale(request);
  const invalidUrl = new URL(`/${locale}?error=invalid_token`, requestOrigin(request));

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
    ? `/${locale}/invitation`
    : `/${locale}/home`;

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
