// Pack the local demo database into snapshot/demo-db.tar.gz so every Vercel
// instance starts from the same data: node scripts/snapshot-db.mjs
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
const db = new PGlite(".data/pglite");
await db.waitReady;
const n = (await db.query("SELECT count(*)::int AS n FROM events")).rows[0].n;
const blob = await db.dumpDataDir("gzip");
fs.writeFileSync("snapshot/demo-db.tar.gz", Buffer.from(await blob.arrayBuffer()));
await db.close();
console.log(`snapshot: ${n} events, ${(blob.size / 1e6).toFixed(1)} MB`);
