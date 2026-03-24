import { NextRequest } from "next/server";

/**
 * Returns the effective origin for redirects.
 * `request.url` uses the bind address (e.g. 0.0.0.0 in Docker) which browsers
 * cannot follow. Prefer BASE_URL env var, then fall back to the Host header.
 */
export function requestOrigin(request: NextRequest): string {
  return (
    process.env.BASE_URL ??
    `http://${request.headers.get("host") ?? "localhost:3000"}`
  );
}
