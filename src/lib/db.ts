import "server-only";
import { createHash } from "node:crypto";
import { SCHEMA_SQL } from "./schema";

/**
 * One SQL interface, two engines.
 *
 * - DATABASE_URL set (Supabase / any Postgres) → the `postgres` driver.
 * - Not set → PGlite, an in-process Postgres stored under .data/ (or /tmp on
 *   serverless). Same SQL dialect, so every query below runs on both.
 */

type Row = Record<string, unknown>;
type Engine = { query: (sql: string, params?: unknown[]) => Promise<Row[]> };

const g = globalThis as unknown as { __epDb?: Promise<Engine> };

async function createEngine(): Promise<Engine> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { prepare: false, max: 5, idle_timeout: 20 });
    return {
      query: async (text, params = []) =>
        (await sql.unsafe(text, params as never[])) as unknown as Row[],
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const path = await import("node:path");
  const fs = await import("node:fs");
  const dir =
    process.env.PGLITE_DIR ||
    (process.env.VERCEL ? "/tmp/movents-pglite" : path.join(process.cwd(), ".data", "pglite"));
  // Serverless: every instance starts from the same pre-built demo snapshot,
  // so ids and links match whichever instance answers.
  const snapshot = path.join(process.cwd(), "snapshot", "demo-db.tar.gz");
  const fresh = !fs.existsSync(path.join(dir, "PG_VERSION"));
  fs.mkdirSync(dir, { recursive: true });
  const db =
    process.env.VERCEL && fresh && fs.existsSync(snapshot)
      ? new PGlite(dir, { loadDataDir: new Blob([fs.readFileSync(snapshot)]) })
      : new PGlite(dir);
  await db.waitReady;
  return {
    query: async (text, params = []) => (await db.query<Row>(text, params as unknown[])).rows,
  };
}

async function init(): Promise<Engine> {
  const engine = await createEngine();
  await engine.query("SELECT 1");
  for (const stmt of SCHEMA_SQL.split(";\n").map((s) => s.trim()).filter(Boolean)) {
    await engine.query(stmt);
  }
  const { seedIfEmpty } = await import("./seed");
  await seedIfEmpty(engine.query);
  return engine;
}

function engine(): Promise<Engine> {
  if (!g.__epDb) {
    g.__epDb = init().catch((err) => {
      g.__epDb = undefined;
      throw err;
    });
  }
  return g.__epDb;
}

export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const e = await engine();
  return (await e.query(sql, params)) as T[];
}

export async function one<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * On serverless with the embedded DB, every instance seeds its own copy. Make
 * those copies identical (same ids, same API keys) so a link or key from one
 * instance works on the next. With a real DATABASE_URL ids stay random.
 */
const SAME_EVERYWHERE = Boolean(process.env.VERCEL) && !process.env.DATABASE_URL;
let seq = 0;
export function stableToken(prefix: string, bytes = 6) {
  seq += 1;
  return createHash("sha256").update(`${process.env.APP_SECRET ?? ""}:${prefix}:${seq}`).digest("hex").slice(0, bytes * 2);
}

export function id(prefix: string) {
  if (SAME_EVERYWHERE) return `${prefix}_${stableToken(prefix)}`;
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export const sameEverywhere = SAME_EVERYWHERE;

/** Insert a row from an object; JSON-able objects are stored as jsonb. */
export async function insert<T = Row>(table: string, data: Record<string, unknown>): Promise<T> {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  const vals = keys.map((k) => toDb(data[k]));
  const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys
    .map((_, i) => `$${i + 1}`)
    .join(", ")}) RETURNING *`;
  const rows = await query<T>(sql, vals);
  return rows[0];
}

export async function update<T = Row>(
  table: string,
  rowId: string,
  data: Record<string, unknown>,
): Promise<T | null> {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined);
  if (keys.length === 0) return one<T>(`SELECT * FROM ${table} WHERE id = $1`, [rowId]);
  const sql = `UPDATE ${table} SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(", ")} WHERE id = $${
    keys.length + 1
  } RETURNING *`;
  const rows = await query<T>(sql, [...keys.map((k) => toDb(data[k])), rowId]);
  return rows[0] ?? null;
}

function toDb(v: unknown) {
  if (v === null) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") return JSON.stringify(v);
  return v;
}
