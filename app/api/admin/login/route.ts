import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAdminSessionValue, ADMIN_COOKIE } from "@/lib/session";
import { requestOrigin } from "@/lib/request";

const ADMIN_SESSION_MAX_AGE_S = 8 * 60 * 60;

export async function POST(request: NextRequest) {
  const origin = requestOrigin(request);
  const invalidUrl = new URL("/admin/login?error=invalid", origin);

  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  if (typeof username !== "string" || typeof password !== "string")
    return NextResponse.redirect(invalidUrl);

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) return NextResponse.redirect(invalidUrl);

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return NextResponse.redirect(invalidUrl);

  const response = NextResponse.redirect(new URL("/admin/guests", origin));
  response.cookies.set(ADMIN_COOKIE, createAdminSessionValue(admin.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_MAX_AGE_S,
    path: "/",
  });
  return response;
}
