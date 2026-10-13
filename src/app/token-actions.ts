"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { createApiToken, revokeApiToken, revokeOAuthGrant } from "@/lib/auth/api-tokens";
import { audit } from "@/lib/audit";

type Res<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function me() {
  const u = await currentUser();
  if (!u) throw new Error("Not signed in");
  return u;
}

export async function createTokenAction(name: string): Promise<Res<string>> {
  try {
    const u = await me();
    const token = await createApiToken(u.id, String(name ?? ""));
    await audit(u, "api_token.created", { name });
    revalidatePath("/settings");
    return { ok: true, data: token };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create token" };
  }
}

export async function revokeTokenAction(tokenId: string): Promise<Res> {
  try {
    const u = await me();
    await revokeApiToken(u.id, String(tokenId));
    await audit(u, "api_token.revoked", { token_id: tokenId });
    revalidatePath("/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not revoke token" };
  }
}

export async function revokeGrantAction(clientId: string): Promise<Res> {
  try {
    const u = await me();
    await revokeOAuthGrant(u.id, String(clientId));
    await audit(u, "oauth.revoked", { client_id: clientId });
    revalidatePath("/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not disconnect" };
  }
}
