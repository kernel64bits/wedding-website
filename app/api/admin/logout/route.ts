import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/session";
import { requestOrigin } from "@/lib/request";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/admin/login", requestOrigin(request))
  );
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
