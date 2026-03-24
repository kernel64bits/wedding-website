import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import {
  ADMIN_COOKIE,
  GUEST_COOKIE,
  verifyAdminToken,
  verifyGuestToken,
} from "./lib/session";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // ── Admin routes ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const raw = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!raw || !verifyAdminToken(raw)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // ── Protected guest routes ──────────────────────────────────────────────────
  // The gate page lives at /{locale} (segments.length === 1) and is public.
  // Everything deeper (/{locale}/home, /{locale}/invitation, …) requires a
  // valid guest session.
  const segments = pathname.split("/").filter(Boolean); // e.g. ["fr", "home"]
  const locale = segments[0];
  const isKnownLocale = routing.locales.includes(
    locale as (typeof routing.locales)[number]
  );
  const isProtectedGuestRoute = isKnownLocale && segments.length > 1;

  if (isProtectedGuestRoute) {
    const raw = request.cookies.get(GUEST_COOKIE)?.value;
    if (!raw || !verifyGuestToken(raw)) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  // ── i18n routing (locale prefix, redirects, …) ─────────────────────────────
  return intlMiddleware(request) as NextResponse;
}

export const config = {
  // Run on locale routes and admin routes; skip Next.js internals, API, and static files
  matcher: [
    "/((?!_next|_vercel|api|.*\\..*).*)",
  ],
};
