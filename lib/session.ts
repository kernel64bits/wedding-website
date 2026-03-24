import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const GUEST_COOKIE = "wedding_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface GuestSession {
  invitationId: string;
  expiresAt: number; // Unix ms
}

function sign(payload: GuestSession): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", process.env.SESSION_SECRET!)
    .update(b64)
    .digest("hex");
  return `${b64}.${sig}`;
}

function verify(token: string): GuestSession | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;

  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", process.env.SESSION_SECRET!)
    .update(b64)
    .digest("hex");

  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex")))
      return null;
  } catch {
    return null;
  }

  const payload = JSON.parse(
    Buffer.from(b64, "base64url").toString()
  ) as GuestSession;

  if (Date.now() > payload.expiresAt) return null;
  return payload;
}

export function createSessionValue(invitationId: string): string {
  return sign({ invitationId, expiresAt: Date.now() + SESSION_DURATION_MS });
}

export async function getGuestSession(): Promise<GuestSession | null> {
  const jar = await cookies();
  const raw = jar.get(GUEST_COOKIE)?.value;
  if (!raw) return null;
  return verify(raw);
}
