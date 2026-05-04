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

// ── HMAC signing (Web Crypto — works in both Edge and Node.js) ───────────────

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET environment variable is not set");
  return s;
}

const encoder = new TextEncoder();

// HMAC-SHA256 → 32 bytes → 64 hex chars. Used to constant-time-validate
// signature length up-front in hmacVerify (T11.9).
const EXPECTED_SIG_HEX_LEN = 64;

// Singleton CryptoKey — same pattern as lib/prisma.ts and lib/storage.ts.
// Cache the import promise (not the resolved key) so concurrent first calls
// share one importKey() instead of racing.
const globalForKey = globalThis as unknown as {
  __sessionKey?: Promise<CryptoKey>;
};

function getCryptoKey(): Promise<CryptoKey> {
  if (!globalForKey.__sessionKey) {
    globalForKey.__sessionKey = crypto.subtle.importKey(
      "raw",
      encoder.encode(secret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }
  return globalForKey.__sessionKey;
}

function hexFromBuffer(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSign(payload: object): Promise<string> {
  const b64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const key = await getCryptoKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(b64));
  return `${b64}.${hexFromBuffer(sig)}`;
}

async function hmacVerify<T extends { expiresAt: number }>(
  token: string,
): Promise<T | null> {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;

  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  // Reject anything that doesn't have the expected signature length up-front,
  // so timingSafeCompare below only ever sees equal-length hex strings (T11.9).
  if (sig.length !== EXPECTED_SIG_HEX_LEN) return null;

  try {
    const key = await getCryptoKey();
    const expectedBuf = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(b64),
    );
    const expected = hexFromBuffer(expectedBuf);

    if (!timingSafeCompare(sig, expected)) return null;
  } catch {
    return null;
  }

  try {
    const json = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as T;
    if (typeof payload.expiresAt !== "number" || Date.now() > payload.expiresAt)
      return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Guest session API ─────────────────────────────────────────────────────────

export async function createSessionValue(
  invitationId: string,
): Promise<string> {
  return hmacSign({
    invitationId,
    expiresAt: Date.now() + GUEST_SESSION_DURATION_MS,
  });
}

/** Verify a raw guest cookie string. Edge-compatible (no next/headers). */
export async function verifyGuestToken(
  raw: string,
): Promise<GuestSession | null> {
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

export async function createAdminSessionValue(
  adminId: string,
): Promise<string> {
  return hmacSign({
    adminId,
    expiresAt: Date.now() + ADMIN_SESSION_DURATION_MS,
  });
}

/** Verify a raw admin cookie string. Edge-compatible (no next/headers). */
export async function verifyAdminToken(
  raw: string,
): Promise<AdminSession | null> {
  return hmacVerify<AdminSession>(raw);
}

/** Read and verify the admin session from the request cookie jar (server components). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const raw = jar.get(ADMIN_COOKIE)?.value;
  if (!raw) return null;
  return verifyAdminToken(raw);
}
