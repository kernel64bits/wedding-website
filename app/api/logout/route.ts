import { NextResponse } from "next/server";
import { GUEST_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/fr", origin));
  response.cookies.set(GUEST_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
