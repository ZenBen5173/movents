import { BrandMark } from "@/components/app/brand-mark";
import { Button } from "@/components/ui/button";
import { confirmLoginLink } from "@/app/auth-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

/** Email scanners open links automatically; spending the token needs a click. */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <BrandMark />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Finish signing in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Confirm it&apos;s you to continue to Movents.</p>
        <form action={confirmLoginLink} className="mt-6">
          <input type="hidden" name="token" value={token ?? ""} />
          <Button type="submit" className="h-11 w-full">Continue to Movents</Button>
        </form>
      </div>
    </main>
  );
}
