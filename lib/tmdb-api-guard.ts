import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_DISABLED } from "@/lib/auth-flags";
import { enforceTmdbRateLimit } from "@/lib/tmdb-rate-limit";

/**
 * Auth + rate-limit gate for `/api/tmdb/*`.
 * Returns a response to short-circuit, or `null` when the request may proceed.
 */
export async function guardTmdbApi(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (!AUTH_DISABLED) {
    const token = await convexAuthNextjsToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return enforceTmdbRateLimit(request);
}
