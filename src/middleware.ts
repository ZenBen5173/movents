import { NextResponse, type NextRequest } from "next/server";

/**
 * No sign-in screen: anyone opening the app lands as the default demo account
 * (the committee member who runs the agent). Switch accounts from the sidebar.
 */
const DEFAULT_USER = process.env.DEFAULT_USER_ID ?? "usr_committee";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/login") {
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set("ep_uid", DEFAULT_USER, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 14 });
    return res;
  }
  if (req.cookies.get("ep_uid") || req.headers.get("authorization")) return NextResponse.next();
  // Make the cookie visible to this very request too, then persist it.
  const headers = new Headers(req.headers);
  const existing = req.headers.get("cookie");
  headers.set("cookie", existing ? `${existing}; ep_uid=${DEFAULT_USER}` : `ep_uid=${DEFAULT_USER}`);
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set("ep_uid", DEFAULT_USER, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 14 });
  return res;
}

export const config = {
  matcher: ["/((?!api/|_next/|icons/|icon|apple-icon|manifest|sw.js|e/|f/|faculty/|pay/|favicon).*)"],
};
