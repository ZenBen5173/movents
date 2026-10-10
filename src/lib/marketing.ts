import "server-only";
import { id, insert, one, query, update } from "./db";
import { appUrl, fmtDate } from "./appurl";
import { generateImage, nanoBananaEnabled } from "./integrations/nanobanana";
import type { Creative, EventRow, Speaker, Venue } from "./types";

type Ctx = { ev: EventRow; venue: Venue | null; society: string; speakers: Speaker[]; uni: string };

export const KINDS: { kind: Creative["kind"]; channel: string; title: string; width: number; height: number }[] = [
  { kind: "poster", channel: "Poster", title: "Campus poster (4:5)", width: 1080, height: 1350 },
  { kind: "ig_post", channel: "Instagram", title: "Instagram feed post (1:1)", width: 1080, height: 1080 },
  { kind: "ig_story", channel: "Instagram", title: "Instagram story (9:16)", width: 1080, height: 1920 },
  { kind: "linkedin", channel: "LinkedIn", title: "LinkedIn post image (1.91:1)", width: 1200, height: 627 },
  { kind: "video", channel: "Instagram Reels / TikTok", title: "15-second teaser video (9:16)", width: 1080, height: 1920 },
];

async function context(eventId: string): Promise<Ctx> {
  const ev = await one<EventRow>("SELECT * FROM events WHERE id = $1", [eventId]);
  if (!ev) throw new Error("Event not found");
  const venue = ev.venue_id ? await one<Venue>("SELECT * FROM venues WHERE id = $1", [ev.venue_id]) : null;
  const s = await one<{ name: string; uni: string }>("SELECT s.name, u.name AS uni FROM societies s JOIN universities u ON u.id = s.university_id WHERE s.id = $1", [ev.society_id]);
  const speakers = await query<Speaker>("SELECT * FROM speakers WHERE event_id = $1 ORDER BY status = 'confirmed' DESC, name", [eventId]);
  return { ev, venue, society: s?.name ?? "", speakers, uni: s?.uni ?? "" };
}

function weekday(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
}

function tags(c: Ctx) {
  const topic = (c.ev.topic ?? "").replace(/[^A-Za-z0-9]/g, "");
  const uni = c.uni.split(" ")[0];
  return [`#${uni}`, `#${uni}University`, topic && `#${topic}`, topic && `#${topic}Malaysia`, "#StudentLife", "#CampusEvents", "#KLevents"].filter(Boolean).join(" ");
}

/** Channel-specific copy. Written to be posted as-is; WorkBuddy may rewrite it via update_creative_copy. */
export function copyFor(kind: Creative["kind"], c: Ctx) {
  const when = `${weekday(c.ev.date)}, ${fmtDate(c.ev.date)} · ${c.ev.start_time} to ${c.ev.end_time}`;
  const where = c.venue ? `${c.venue.name}, ${c.uni}` : c.uni;
  const link = `${appUrl()}/e/${c.ev.id}`;
  const named = c.speakers.filter((s) => !/^Sample Speaker/.test(s.name)).map((s) => s.name);
  const lineup = named.length ? named.join(", ") : "speakers from industry and research";
  switch (kind) {
    case "poster":
      return { caption: `${c.ev.title}\n${when}\n${where}\nFree entry · register: ${link}\nOrganised by ${c.society}`, hashtags: null };
    case "ig_post":
      return {
        caption: `🚀 ${c.ev.title} is happening!\n\nWant to know where ${c.ev.topic ?? "the field"} is heading, and how to get into it? Join ${lineup} for talks, live demos and an open Q&A.\n\n📅 ${when}\n📍 ${where}\n🎟️ Free, seats are limited, link in bio\n\nTag a friend who needs to be there 👇`,
        hashtags: tags(c),
      };
    case "ig_story":
      return { caption: `${c.ev.title}, ${fmtDate(c.ev.date)}. Swipe up / tap the link sticker to register: ${link}`, hashtags: tags(c) };
    case "linkedin":
      return {
        caption: `We're excited to announce ${c.ev.title}, hosted by the ${c.society}.\n\n${c.ev.topic ?? "This field"} is changing how every industry works. This session brings ${lineup} to ${c.uni} to share what they're building, what skills matter, and where students can start.\n\n🗓 ${when}\n📍 ${where}\n🔗 Register (free): ${link}\n\nIndustry partners interested in supporting future events, please reach out.`,
        hashtags: tags(c).split(" ").slice(0, 4).join(" "),
      };
    case "video":
      return {
        caption: `Storyboard (15s, 9:16):\n0 to 3s  Fast cuts of students on campus, text: "Curious about ${c.ev.topic ?? "the future"}?"\n3 to 7s  Title card "${c.ev.title}" with animated gradient\n7 to 11s  Speaker lineup / "Talks · Live demos · Q&A"\n11 to 15s  "${fmtDate(c.ev.date)} · ${c.venue?.name ?? c.uni}" + "Register free, link in bio"\nMusic: upbeat, royalty-free. On-screen text large, safe margins for Reels UI.`,
        hashtags: tags(c),
      };
  }
}

/** Prompt for Nano Banana (image) or a video model — brand-consistent, with the exact text to render. */
export function promptFor(kind: Creative["kind"], c: Ctx, w: number, h: number) {
  const base = `Event: "${c.ev.title}". Organiser: ${c.society} (${c.uni}). Date: ${fmtDate(c.ev.date)}, ${c.ev.start_time} to ${c.ev.end_time}. Venue: ${c.venue?.name ?? c.uni}. Topic: ${c.ev.topic ?? c.ev.title}.`;
  const style = "Playful event-pass style on a warm off-white (#f7f5ef) background: tomato orange (#ff5a36), electric blue (#3d6cf5) and sunny yellow (#ffd84d) accents, bold black grotesk headline, monospace uppercase labels, an \"admit one\" ticket with a dashed tear line and barcode, a little bunting across the top. Flat, clean, generous margins, no gradients, no logos of real companies. Render all text exactly and legibly.";
  if (kind === "video") return `Generate a 15-second vertical (9:16) teaser video. ${base} Follow this storyboard: ${copyFor("video", c).caption.replace(/\n/g, " ")} ${style}`;
  const what = { poster: "a printable campus event poster", ig_post: "a square Instagram feed post", ig_story: "a vertical Instagram story with space at the bottom for a link sticker", linkedin: "a professional LinkedIn post banner" }[kind];
  return `Create ${what}, ${w}x${h}px. ${base} Text to include: headline "${c.ev.title}", line "${fmtDate(c.ev.date)} · ${c.venue?.name ?? c.uni}", line "Free entry · Register now". ${style}`;
}

export async function generateKit(eventId: string, opts: { withImages?: boolean } = {}) {
  const c = await context(eventId);
  const existing = await query<Creative>("SELECT * FROM creatives WHERE event_id = $1", [eventId]);
  const out: Creative[] = [];
  for (const k of KINDS) {
    const copy = copyFor(k.kind, c);
    const prompt = promptFor(k.kind, c, k.width, k.height);
    const prev = existing.find((e) => e.kind === k.kind);
    const row = prev
      ? (await update<Creative>("creatives", prev.id, { caption: copy.caption, hashtags: copy.hashtags, image_prompt: prompt, updated_at: new Date() }))!
      : await insert<Creative>("creatives", { id: id("crv"), event_id: eventId, kind: k.kind, channel: k.channel, title: k.title, caption: copy.caption, hashtags: copy.hashtags, image_prompt: prompt, width: k.width, height: k.height, image_source: "template" });
    out.push(row);
  }
  let generated = 0;
  const errors: string[] = [];
  if (opts.withImages && nanoBananaEnabled()) {
    for (const r of out.filter((x) => x.kind !== "video" && x.image_source === "template")) {
      try {
        await setImage(r.id, await generateImage(r.image_prompt!, r.width, r.height), "nano-banana");
        generated++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
  }
  return { creatives: out, generated, mode: nanoBananaEnabled() ? "nano-banana" : "template", errors };
}

export async function setImage(creativeId: string, image: string, source: Creative["image_source"]) {
  const isData = /^data:(image|video)\//.test(image);
  if (!isData && !/^https:\/\//.test(image)) throw new Error("Media must be an https URL or a data:image/… / data:video/… base64 URL");
  if (isData && image.length > 40_000_000) throw new Error("Media too large (max ~30 MB)");
  return update<Creative>("creatives", creativeId, { image_data: isData ? image : null, image_url: isData ? null : image, image_source: source, updated_at: new Date() });
}

export async function regenerateImage(creativeId: string) {
  const r = await one<Creative>("SELECT * FROM creatives WHERE id = $1", [creativeId]);
  if (!r) throw new Error("Creative not found");
  if (r.kind === "video") throw new Error("Video is generated in WorkBuddy and attached back with attach_creative_media");
  if (!nanoBananaEnabled()) throw new Error("Set GEMINI_API_KEY to generate with Nano Banana here, or let WorkBuddy generate and attach the image");
  return setImage(r.id, await generateImage(r.image_prompt!, r.width, r.height), "nano-banana");
}

export function imageHref(c: Pick<Creative, "id" | "updated_at">) {
  return `/api/creatives/${c.id}/image?v=${new Date(c.updated_at).getTime()}`;
}

export function isVideo(c: Pick<Creative, "image_data" | "image_url">) {
  return Boolean(c.image_data?.startsWith("data:video/") || (c.image_url && /\.(mp4|webm|mov)(\?|$)/i.test(c.image_url)));
}
