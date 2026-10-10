import "server-only";
import { cookies, headers } from "next/headers";
import { one } from "./db";
import type { User } from "./types";

export const SESSION_COOKIE = "ep_uid";

/** Cookie session for the web app, or `Authorization: Bearer <api_key>` for WorkBuddy / API clients. */
export async function currentUser(): Promise<User | null> {
  const h = await headers();
  const auth = h.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const key = auth.slice(7).trim();
    const u = await one<User>("SELECT * FROM users WHERE api_key = $1", [key]);
    if (u) return u;
  }
  const c = await cookies();
  const uid = c.get(SESSION_COOKIE)?.value;
  if (!uid) return null;
  return one<User>("SELECT * FROM users WHERE id = $1", [uid]);
}

export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "Not signed in");
  return u;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
