import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap gate for app pages: no session cookie → sign-in page. The session
 * itself is validated against the database by currentUser() on the server.
 */
export function middleware(req: NextRequest) {
  if (req.cookies.get("mv_session")) return NextResponse.next();
  const login = new URL("/login", req.url);
  const next = req.nextUrl.pathname + req.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Public: sign-in, API (own auth), OAuth discovery, static assets, and the
  // guest pages (event registration, feedback, faculty approval, payments, invites).
  matcher: [
    "/((?!login|auth/|invite/|oauth/|api/|\\.well-known/|_next/|icons/|venues/|unis/|icon|apple-icon|manifest|sw.js|robots.txt|favicon|e/|f/|faculty/|pay/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)",
  ],
};
