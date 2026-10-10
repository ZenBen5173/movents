import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { one, query } from "@/lib/db";
import { fmtDate } from "@/lib/appurl";
import type { EventRow, Venue } from "@/lib/types";
import { RsvpForm } from "./rsvp-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ev = await one<EventRow>("SELECT title FROM events WHERE id = $1", [id]);
  return { title: ev ? `Register, ${ev.title}` : "Event" };
}

export default async function PublicEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ via?: string }> }) {
  const { id } = await params;
  const { via } = await searchParams;
  const ev = await one<EventRow & { society: string }>("SELECT e.*, s.name AS society FROM events e JOIN societies s ON s.id = e.society_id WHERE e.id = $1", [id]);
  if (!ev) notFound();
  const venue = ev.venue_id ? await one<Venue>("SELECT * FROM venues WHERE id = $1", [ev.venue_id]) : null;
  const going = Number((await one<{ n: number }>("SELECT count(*)::int AS n FROM rsvps WHERE event_id = $1 AND status = 'going'", [id]))?.n ?? 0);
  const speakers = await query<{ name: string; headline: string | null }>("SELECT name, headline FROM speakers WHERE event_id = $1 AND status = 'confirmed'", [id]);
  const poster = await one<{ id: string; updated_at: string; status: string }>("SELECT id, updated_at, status FROM creatives WHERE event_id = $1 AND kind = 'poster' AND status IN ('approved','posted')", [id]);
  const cap = venue?.capacity ?? ev.pax;
  const left = Math.max(0, cap - going);
  return (
    <div className="min-h-dvh bg-background">
      <div className="relative overflow-hidden border-b border-border bg-[radial-gradient(70%_80%_at_20%_0%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent)]">
        <div className="mx-auto max-w-3xl px-5 pb-10 pt-12">
          {via && <p className="mb-3 inline-flex rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground">via {via === "luma" ? "Luma" : "Meetup"} (demo page)</p>}
          <p className="text-sm font-medium text-primary">{ev.society}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{ev.title}</h1>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <span className="inline-flex items-center gap-2"><CalendarDays className="size-4" />{fmtDate(ev.date)}</span>
            <span className="inline-flex items-center gap-2"><Clock className="size-4" />{ev.start_time} to {ev.end_time}</span>
            <span className="inline-flex items-center gap-2"><MapPin className="size-4" />{venue ? `${venue.name}, ${venue.location ?? "Sunway University"}` : "Venue TBC"}</span>
            <span className="inline-flex items-center gap-2"><Users className="size-4" />{left > 0 ? `${left} seats left` : "Full, join the waitlist"}</span>
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-3xl gap-8 px-5 py-8 md:grid-cols-[1fr_320px]">
        <div className="text-sm leading-relaxed text-muted-foreground">
          <h2 className="mb-2 text-base font-semibold text-foreground">About</h2>
          <p>Join us for {/^[aeiou]/i.test(ev.topic ?? "") ? "an" : "a"} {ev.topic ?? ""} session with practitioners and researchers, followed by an open Q&amp;A and networking. Free entry — registration required. Refreshments provided (halal).</p>
          {speakers.length > 0 && (
            <>
              <h2 className="mb-2 mt-6 text-base font-semibold text-foreground">Speakers</h2>
              <ul className="space-y-1">{speakers.map((s) => <li key={s.name}><b className="text-foreground">{s.name}</b>, {s.headline}</li>)}</ul>
            </>
          )}
        </div>
        <div className="flex flex-col-reverse gap-4 md:flex-col">
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/creatives/${poster.id}/image?v=${new Date(poster.updated_at).getTime()}`} alt={`${ev.title} poster`} className="w-full rounded-2xl border border-border shadow-sm" />
          )}
          <RsvpForm eventId={id} full={left === 0} />
        </div>
      </div>
    </div>
  );
}
