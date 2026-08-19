import { NextResponse } from "next/server";

import { BETA_ACCESS_COOKIE, createAccessToken, getAccessCookieOptions, isBetaAccessConfigured, verifyAccessCode } from "@/lib/server/accessControl";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { rateLimitResponse, rejectOversizedRequest } from "@/lib/server/requestGuards";

export async function POST(request: Request) {
  const oversized = rejectOversizedRequest(request, 2_000);
  if (oversized) return oversized;
  const rateLimit = checkRateLimit(request, "beta-access", { limit: 10, windowMs: 15 * 60_000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);
  if (!isBetaAccessConfigured()) {
    return Response.json({ error: { message: "Beta 内测入口尚未配置" } }, { status: 503 });
  }
  const body = await request.json().catch(() => null) as { code?: unknown } | null;
  if (typeof body?.code !== "string" || !(await verifyAccessCode(body.code, "beta"))) {
    return Response.json({ error: { message: "内测码不正确" } }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(BETA_ACCESS_COOKIE, await createAccessToken("beta"), getAccessCookieOptions());
  return response;
}
