import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session";
import { audit } from "@/lib/audit";
import type { User } from "@/lib/types";

export async function POST(req: Request) {
  const { userId, email } = (await req.json()) as { userId?: string; email?: string };
  const user = userId
    ? await one<User>("SELECT * FROM users WHERE id = $1", [userId])
    : await one<User>("SELECT * FROM users WHERE lower(email) = lower($1)", [email ?? ""]);
  if (!user) return NextResponse.json({ error: "No user with that email" }, { status: 404 });
  await audit(user, "session.sign_in", { role: user.role });
  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  res.cookies.set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14, secure: process.env.NODE_ENV === "production" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
