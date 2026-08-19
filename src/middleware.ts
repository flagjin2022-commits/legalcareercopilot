import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_ACCESS_COOKIE, BETA_ACCESS_COOKIE, isAdminAccessConfigured, isBetaAccessConfigured, verifyAccessToken } from "@/lib/server/accessControl";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isInternal = path.startsWith("/internal/") || path.startsWith("/api/internal/");
  const isInternalLogin = path === "/internal/beta-feedback/login" || path === "/api/internal/login";

  if (isInternal && !isInternalLogin) {
    const configured = isAdminAccessConfigured();
    const authorized = configured && await verifyAccessToken(request.cookies.get(ADMIN_ACCESS_COOKIE)?.value, "admin");
    if (!authorized) {
      if (path.startsWith("/api/")) return Response.json({ error: { message: "无权访问" } }, { status: 401 });
      return NextResponse.redirect(new URL("/internal/beta-feedback/login", request.url));
    }
    return NextResponse.next();
  }

  if (isInternalLogin || path === "/beta-access" || path === "/api/beta-access") return NextResponse.next();
  if (!isBetaAccessConfigured() && process.env.NODE_ENV !== "production") return NextResponse.next();

  const authorized = await verifyAccessToken(request.cookies.get(BETA_ACCESS_COOKIE)?.value, "beta");
  if (!authorized) {
    if (path.startsWith("/api/")) return Response.json({ error: { message: "请先输入 Beta 内测码" } }, { status: 401 });
    return NextResponse.redirect(new URL("/beta-access", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
