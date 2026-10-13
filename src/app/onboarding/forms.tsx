"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { acceptInviteAction, createSocietyAction } from "@/app/workspace-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateSocietyForm({ universities }: { universities: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createSocietyAction, null);
  return (
    <form action={action} className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4">
      <label className="block text-sm font-medium" htmlFor="name">Society name</label>
      <Input id="name" name="name" required minLength={2} maxLength={120} placeholder="e.g. AI & Tech Society" />
      <label className="block text-sm font-medium" htmlFor="university">University</label>
      <select id="university" name="university" required className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
        {universities.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
      {state && !state.ok && <p role="alert" className="text-sm text-[var(--red-11)]">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Creating…" : "Create society"}</Button>
    </form>
  );
}

export function AcceptInviteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await acceptInviteAction(id);
          if (r && !r.ok) toast.error(r.error);
        })
      }
    >
      {pending ? "Joining…" : "Join"}
    </Button>
  );
}
