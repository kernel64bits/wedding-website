import { NextRequest, NextResponse } from "next/server";
import { GUEST_COOKIE } from "@/lib/session";
import { requestOrigin } from "@/lib/request";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/fr", requestOrigin(request)));
  response.cookies.set(GUEST_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
