import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthorization } from "@/lib/admin-auth";

// Must match SESSION_COOKIE in lib/session.ts (kept here so proxy stays free of DB/Node-only imports).
const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-psa_session" : "psa_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dashboard: cheap presence check only; pages and server actions validate the session in the DB.
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    if (request.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Owner-only pages require HTTP Basic auth (ADMIN_USER / ADMIN_PASSWORD).
  if (isAdminAuthorization(request.headers.get("authorization"))) {
    return NextResponse.next();
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="PSA Admin", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/app", "/app/:path*"],
};
