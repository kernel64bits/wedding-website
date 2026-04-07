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

// Explicit allowlist of guest-accessible sub-routes under /{locale}/.
// Adding a new page requires a conscious entry here — secure by default.
const GUEST_ROUTES = new Set([
  "home",
  "invitation",
  "gallery",
  "info",
  "rsvp",
  "seating",
]);

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── 1 & 2. Admin routes ───────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const raw = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!raw || !(await verifyAdminToken(raw)))
      return NextResponse.redirect(new URL("/admin/login", request.url));
    return NextResponse.next();
  }

  // Parse locale prefix
  const segments = pathname.split("/").filter(Boolean); // e.g. ["fr", "home"]
  const locale = segments[0];
  const sub = segments[1]; // "home" | "dev" | undefined
  const isKnownLocale = routing.locales.includes(
    locale as (typeof routing.locales)[number]
  );

  // ── 3. Dev routes — guest session required; hidden in production ──────────
  if (isKnownLocale && sub === "dev") {
    if (process.env.NODE_ENV === "production")
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    const raw = request.cookies.get(GUEST_COOKIE)?.value;
    if (!raw || !(await verifyGuestToken(raw)))
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    return intlMiddleware(request) as NextResponse;
  }

  // ── 4. Gate page — public ─────────────────────────────────────────────────
  if (isKnownLocale && !sub) {
    return intlMiddleware(request) as NextResponse;
  }

  // ── 5. Guest routes — explicit allowlist ─────────────────────────────────
  if (isKnownLocale && sub && GUEST_ROUTES.has(sub)) {
    const raw = request.cookies.get(GUEST_COOKIE)?.value;
    if (!raw || !(await verifyGuestToken(raw)))
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    return intlMiddleware(request) as NextResponse;
  }

  // ── 6. Default deny ───────────────────────────────────────────────────────
  const fallback = isKnownLocale ? locale : routing.defaultLocale;
  return NextResponse.redirect(new URL(`/${fallback}`, request.url));
}

export const config = {
  // Run on all paths except Next.js internals, Vercel internals, API routes,
  // and static files (anything with a file extension).
  matcher: ["/((?!_next|_vercel|api|.*\\..*).*)",],
};
