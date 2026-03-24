/**
 * Login URL builder for guest invitations.
 *
 * Each invitation has a unique token stored in the DB. This function builds
 * the full URL that a guest uses to log in — it will be embedded in their QR
 * code (image generation added in T5.5).
 *
 * BASE_URL env var:
 *   - dev:  http://localhost:3000  (default fallback)
 *   - prod: https://yourwedding.com
 */
export function buildLoginUrl(token: string): string {
  const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/login?token=${encodeURIComponent(token)}`;
}
