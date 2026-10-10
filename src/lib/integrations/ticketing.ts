import "server-only";

/**
 * Luma + Meetup clients. Each has a real API path (used when its key is set)
 * and a mock path that behaves the same way against our own public event page.
 */

export type PublishResult = { id: string; url: string; mode: "live" | "mock" };
export type RemoteGuest = { name: string; email: string; status: "going" | "waitlist" | "cancelled"; checked_in: boolean; dietary?: string | null; accessibility?: string | null };

type EventInput = { id: string; title: string; description: string; date: string; startTime: string; endTime: string; venue: string; capacity: number };

const TZ_OFFSET = "+08:00";

function appUrl() {
  return process.env.APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
}

// ---------------------------------------------------------------- Luma

const LUMA_BASE = () => process.env.LUMA_API_BASE ?? "https://public-api.lu.ma/public/v1";

export function lumaMode() {
  return process.env.LUMA_API_KEY ? "live" : "mock";
}

export async function lumaCreateEvent(ev: EventInput): Promise<PublishResult> {
  if (lumaMode() === "mock") {
    return { id: `luma_mock_${ev.id}`, url: `${appUrl()}/e/${ev.id}?via=luma`, mode: "mock" };
  }
  const res = await fetch(`${LUMA_BASE()}/event/create`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-luma-api-key": process.env.LUMA_API_KEY! },
    body: JSON.stringify({
      name: ev.title,
      description_md: ev.description,
      start_at: `${ev.date}T${ev.startTime}:00${TZ_OFFSET}`,
      end_at: `${ev.date}T${ev.endTime}:00${TZ_OFFSET}`,
      timezone: "Asia/Kuala_Lumpur",
      geo_address_json: { type: "manual", address: ev.venue },
      max_capacity: ev.capacity,
    }),
  });
  if (!res.ok) throw new Error(`Luma ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { api_id?: string; event?: { api_id: string; url: string } };
  const apiId = json.api_id ?? json.event?.api_id ?? "";
  return { id: apiId, url: json.event?.url ?? `https://lu.ma/event/${apiId}`, mode: "live" };
}

export async function lumaGuests(apiId: string): Promise<RemoteGuest[]> {
  const out: RemoteGuest[] = [];
  let cursor: string | undefined;
  do {
    const url = new URL(`${LUMA_BASE()}/event/get-guests`);
    url.searchParams.set("event_api_id", apiId);
    if (cursor) url.searchParams.set("pagination_cursor", cursor);
    const res = await fetch(url, { headers: { "x-luma-api-key": process.env.LUMA_API_KEY! } });
    if (!res.ok) throw new Error(`Luma guests ${res.status}`);
    const json = (await res.json()) as {
      entries: { guest: { name: string; email: string; approval_status: string; checked_in_at: string | null } }[];
      has_more: boolean;
      next_cursor?: string;
    };
    for (const e of json.entries) {
      out.push({
        name: e.guest.name,
        email: e.guest.email,
        status: e.guest.approval_status === "waitlist" ? "waitlist" : e.guest.approval_status === "declined" ? "cancelled" : "going",
        checked_in: Boolean(e.guest.checked_in_at),
      });
    }
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);
  return out;
}

// ---------------------------------------------------------------- Meetup

export function meetupMode() {
  return process.env.MEETUP_ACCESS_TOKEN && process.env.MEETUP_GROUP_URLNAME ? "live" : "mock";
}

async function meetupGql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch("https://api.meetup.com/gql-ext", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.MEETUP_ACCESS_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Meetup ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { data: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(`Meetup: ${json.errors[0].message}`);
  return json.data;
}

export async function meetupCreateEvent(ev: EventInput): Promise<PublishResult> {
  if (meetupMode() === "mock") {
    return { id: `meetup_mock_${ev.id}`, url: `${appUrl()}/e/${ev.id}?via=meetup`, mode: "mock" };
  }
  const [sh, sm] = ev.startTime.split(":").map(Number);
  const [eh, em] = ev.endTime.split(":").map(Number);
  const minutes = eh * 60 + em - (sh * 60 + sm);
  const data = await meetupGql<{ createEvent: { event: { id: string; eventUrl: string } | null; errors: { message: string }[] } }>(
    `mutation($input: CreateEventInput!) { createEvent(input: $input) { event { id eventUrl } errors { message } } }`,
    {
      input: {
        groupUrlname: process.env.MEETUP_GROUP_URLNAME,
        title: ev.title,
        description: ev.description,
        startDateTime: `${ev.date}T${ev.startTime}`,
        duration: `PT${Math.floor(minutes / 60)}H${minutes % 60}M`,
        publishStatus: "PUBLISHED",
        rsvpSettings: { rsvpLimit: ev.capacity },
      },
    },
  );
  if (!data.createEvent.event) throw new Error(`Meetup: ${data.createEvent.errors?.[0]?.message ?? "create failed"}`);
  return { id: data.createEvent.event.id, url: data.createEvent.event.eventUrl, mode: "live" };
}

export async function meetupGuests(eventId: string): Promise<RemoteGuest[]> {
  const data = await meetupGql<{ event: { rsvps: { edges: { node: { status: string; member: { name: string; email?: string } } }[] } } }>(
    `query($id: ID!) { event(id: $id) { rsvps(first: 500) { edges { node { status member { name } } } } } }`,
    { id: eventId },
  );
  return data.event.rsvps.edges.map((e, i) => ({
    name: e.node.member.name,
    email: e.node.member.email ?? `meetup-member-${i}@members.meetup.com`,
    status: e.node.status === "WAITLIST" ? "waitlist" : e.node.status === "NO" ? "cancelled" : "going",
    checked_in: e.node.status === "ATTENDED",
  }));
}

// ---------------------------------------------------------------- Mock guests

const FIRST = ["Aiman", "Mei Ling", "Ravi", "Nur", "Jun Hao", "Siti", "Kavitha", "Hafiz", "Chloe", "Darren", "Farah", "Ganesh", "Hui Min", "Irfan", "Jasmine", "Kumar", "Li Wei", "Marcus", "Nadia", "Omar", "Pei Shan", "Qistina", "Rajesh", "Sarah", "Tan", "Umar", "Vanessa", "Wan", "Xin Yi", "Yusuf", "Zara"];
const LAST = ["Abdullah", "Tan", "Lim", "Wong", "Raj", "Ismail", "Lee", "Chong", "Krishnan", "Ng", "Hassan", "Ong", "Yap", "Rahman", "Teo", "Goh"];
const DIET = [null, null, null, null, null, null, "Vegetarian", "No beef", "Vegan", "Nut allergy", "Halal"];
const ACCESS = [null, null, null, null, null, null, null, null, null, null, null, null, "Wheelchair access", "Hearing loop"];

/** Deterministic pseudo-random so a re-sync does not duplicate or reshuffle guests. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

export function mockGuests(eventId: string, count: number, source: "luma" | "meetup", showRate = 0.68): RemoteGuest[] {
  const r = rng([...eventId + source].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  return Array.from({ length: count }, (_, i) => {
    const name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    return {
      name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}.${source}${i}@student.example.edu.my`,
      ...(() => {
        const status: RemoteGuest["status"] = r() < 0.06 ? "cancelled" : "going";
        return { status, checked_in: status === "going" && r() < showRate };
      })(),
      dietary: DIET[Math.floor(r() * DIET.length)],
      accessibility: ACCESS[Math.floor(r() * ACCESS.length)],
    };
  });
}
