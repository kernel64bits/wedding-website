import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// ── Guest session ─────────────────────────────────────────────────────────────

export const GUEST_COOKIE = "wedding_session";
const GUEST_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface GuestSession {
  invitationId: string;
  expiresAt: number; // Unix ms
}

// ── Admin session ─────────────────────────────────────────────────────────────

export const ADMIN_COOKIE = "wedding_admin_session";
export const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface AdminSession {
  adminId: string;
  expiresAt: number; // Unix ms
}

// ── HMAC signing (shared) ─────────────────────────────────────────────────────

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET environment variable is not set");
  return s;
}

function hmacSign(payload: object): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

function hmacVerify<T extends { expiresAt: number }>(token: string): T | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;

  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(b64).digest("hex");

  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex")))
      return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString()) as T;
    if (typeof payload.expiresAt !== "number" || Date.now() > payload.expiresAt)
      return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Guest session API ─────────────────────────────────────────────────────────

export function createSessionValue(invitationId: string): string {
  return hmacSign({
    invitationId,
    expiresAt: Date.now() + GUEST_SESSION_DURATION_MS,
  });
}

/** Verify a raw guest cookie string. Safe to call in proxy.ts (no next/headers). */
export function verifyGuestToken(raw: string): GuestSession | null {
  return hmacVerify<GuestSession>(raw);
}

/** Read and verify the guest session from the request cookie jar (server components). */
export async function getGuestSession(): Promise<GuestSession | null> {
  const jar = await cookies();
  const raw = jar.get(GUEST_COOKIE)?.value;
  if (!raw) return null;
  return verifyGuestToken(raw);
}

// ── Admin session API ─────────────────────────────────────────────────────────

export function createAdminSessionValue(adminId: string): string {
  return hmacSign({
    adminId,
    expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS,
  });
}

/** Verify a raw admin cookie string. Safe to call in proxy.ts (no next/headers). */
export function verifyAdminToken(raw: string): AdminSession | null {
  return hmacVerify<AdminSession>(raw);
}

/** Read and verify the admin session from the request cookie jar (server components). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const raw = jar.get(ADMIN_COOKIE)?.value;
  if (!raw) return null;
  return verifyAdminToken(raw);
}
