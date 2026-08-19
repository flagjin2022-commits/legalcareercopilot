import { NextResponse } from "next/server";

import { ADMIN_ACCESS_COOKIE, createAccessToken, getAccessCookieOptions, isAdminAccessConfigured, verifyAccessCode } from "@/lib/server/accessControl";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { rateLimitResponse, rejectOversizedRequest } from "@/lib/server/requestGuards";

export async function POST(request: Request) {
  const oversized = rejectOversizedRequest(request, 2_000);
  if (oversized) return oversized;
  const rateLimit = checkRateLimit(request, "admin-access", { limit: 10, windowMs: 15 * 60_000 });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);
  if (!isAdminAccessConfigured()) {
    return Response.json({ error: { message: "内部反馈入口尚未配置" } }, { status: 503 });
  }
  const body = await request.json().catch(() => null) as { code?: unknown } | null;
  if (typeof body?.code !== "string" || !(await verifyAccessCode(body.code, "admin"))) {
    return Response.json({ error: { message: "访问密码不正确" } }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_ACCESS_COOKIE, await createAccessToken("admin"), getAccessCookieOptions());
  return response;
}
