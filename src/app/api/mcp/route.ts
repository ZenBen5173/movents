import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { TOOLS, findTool } from "@/lib/agent/registry";
import { MCP_INSTRUCTIONS } from "@/lib/agent/guide";
import type { User } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * MCP server (Streamable HTTP, stateless JSON responses) so Tencent WorkBuddy —
 * or any MCP client — can drive Movents as its toolset.
 * Auth: `Authorization: Bearer <api key>` (Settings page). The key's user role
 * applies: a committee member's outbound actions land in the approval queue.
 */
type RpcReq = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

const PROTOCOL = "2025-06-18";

async function authUser(req: Request): Promise<User | null> {
  const u = await currentUser();
  if (u) return u;
  const key = new URL(req.url).searchParams.get("key");
  return key ? one<User>("SELECT * FROM users WHERE api_key = $1", [key]) : null;
}

async function handleOne(msg: RpcReq, user: User | null) {
  const reply = (result: unknown) => ({ jsonrpc: "2.0", id: msg.id ?? null, result });
  const error = (code: number, message: string) => ({ jsonrpc: "2.0", id: msg.id ?? null, error: { code, message } });
  switch (msg.method) {
    case "initialize":
      return reply({
        protocolVersion: (msg.params?.protocolVersion as string) ?? PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "movents", title: "Movents, campus event agent tools", version: "1.0.0" },
        instructions: MCP_INSTRUCTIONS,
      });
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) });
    case "tools/call": {
      if (!user) return error(-32001, "Unauthorized: pass Authorization: Bearer <Movents API key>");
      const name = String(msg.params?.name ?? "");
      const tool = findTool(name);
      if (!tool) return error(-32602, `Unknown tool: ${name}`);
      try {
        const out = await tool.run((msg.params?.arguments as Record<string, unknown>) ?? {}, user);
        const structured = out && typeof out === "object" && !Array.isArray(out) ? (out as Record<string, unknown>) : { result: out };
        return reply({ content: [{ type: "text", text: JSON.stringify(out, null, 2) }], structuredContent: structured, isError: false });
      } catch (err) {
        return reply({ content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true });
      }
    }
    default:
      if (msg.method.startsWith("notifications/")) return null;
      return error(-32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  let body: RpcReq | RpcReq[];
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }
  const user = await authUser(req);
  const headers = { "mcp-protocol-version": PROTOCOL };
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handleOne(m, user)))).filter(Boolean);
    return out.length ? NextResponse.json(out, { headers }) : new NextResponse(null, { status: 202, headers });
  }
  const out = await handleOne(body, user);
  return out ? NextResponse.json(out, { headers }) : new NextResponse(null, { status: 202, headers });
}

export async function GET(req: Request) {
  // MCP clients open a GET to listen for server events; we don't stream, so say so per spec.
  if ((req.headers.get("accept") ?? "").includes("text/event-stream")) return new NextResponse(null, { status: 405, headers: { allow: "POST" } });
  return NextResponse.json({ name: "movents", transport: "streamable-http (POST JSON-RPC)", tools: TOOLS.map((t) => t.name) });
}

export async function DELETE() {
  return new NextResponse(null, { status: 204 });
}
