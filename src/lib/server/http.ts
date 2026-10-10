import { NextResponse } from "next/server";
import { HttpError } from "../session";

export function handle(fn: () => Promise<unknown>) {
  return fn()
    .then((data) => NextResponse.json(data))
    .catch((err) => {
      const status = err instanceof HttpError ? err.status : 400;
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status });
    });
}
