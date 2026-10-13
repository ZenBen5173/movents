import { NextResponse, type NextRequest } from "next/server";

const SESSION = "mv_session";

/**
 * 1. App pages: no session cookie → sign-in page. The session itself is
 *    validated against the database by currentUser() on the server.
 * 2. API writes authenticated by cookie must come from this site (CSRF).
 *    Bearer-token clients (MCP, scripts) and webhooks carry no cookie.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    const write = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    if (write && req.cookies.get(SESSION) && !req.headers.get("authorization")) {
      const origin = req.headers.get("origin");
      if (!origin || new URL(origin).host !== req.headers.get("host")) {
        return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }
  if (req.cookies.get(SESSION)) return NextResponse.next();
  const login = new URL("/login", req.url);
  const next = pathname + req.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Public: sign-in, OAuth, static assets, and the guest pages (event
  // registration, feedback, faculty approval, payments, invites).
  matcher: [
    "/api/:path*",
    "/((?!login|auth/|invite/|oauth/|api/|\\.well-known/|_next/|icons/|venues/|unis/|icon|apple-icon|manifest|sw.js|robots.txt|favicon|e/|f/|faculty/|pay/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)",
  ],
};
