import crypto from "node:crypto";
import { SUNWAY_SOP, SUNWAY_SOP_TEXT } from "./sop-default";
import { REFERENCE_SUPPLIERS } from "./integrations/reference-data";
import { mockGuests } from "./integrations/ticketing";
import { sameEverywhere, stableToken } from "./db";

type Q = (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export const DEMO = {
  university: "uni_sunway",
  society: "soc_aitech",
  otherSociety: "soc_robotics",
  users: {
    president: "usr_president",
    vp: "usr_vp",
    dirProgrammes: "usr_dir_prog",
    dirLogistics: "usr_dir_log",
    committee: "usr_committee",
    committee2: "usr_committee2",
    faculty: "usr_faculty",
  },
  pastEvent: "evt_ds_workshop",
};

function ins(q: Q, table: string, row: Record<string, unknown>) {
  const keys = Object.keys(row);
  const vals = keys.map((k) => {
    const v = row[k];
    return v !== null && typeof v === "object" ? JSON.stringify(v) : v;
  });
  return q(
    `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")}) ON CONFLICT (id) DO NOTHING`,
    vals,
  );
}

const key = () => (sameEverywhere ? `ep_${stableToken("key", 18)}` : `ep_${crypto.randomBytes(18).toString("base64url")}`);
const rid = (p: string) => (sameEverywhere ? `${p}_${stableToken(p)}` : `${p}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`);

// Sunway's own photos where they exist; Auditorium 1 and 2 have none online.
const SW = "https://sunwayuniversity.edu.my/sites/default/files/mediaimage/2025/";
export const VENUE_PHOTOS: Record<string, string> = {
  ven_aud1: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/BI_Norwegian_Business_School_Auditorium_7DM29184.jpg/960px-BI_Norwegian_Business_School_Auditorium_7DM29184.jpg",
  ven_aud2: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
  ven_jc2: SW + "jc2_jc3_auditoriums.jpg",
  ven_jc3: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Sunway_University_Hall.jpg/960px-Sunway_University_Hall.jpg",
  ven_lt5: SW + "lecture_theatres.jpg",
  ven_jc1: SW + "jc1_auditorium.jpg",
  ven_jch: SW + "jeffrey_cheah_hall.jpg",
  ven_slc: SW + "student_hub.jpg",
  ven_rooftop: "/venues/rooftop-terrace.jpg",
};

/** Classes, exams and other clubs, so each venue calendar looks like a real room. */
function venueBookings() {
  const rows: Record<string, unknown>[] = [];
  const weekly: [string, string, number, string, string][] = [
    ["ven_aud1", "Lecture: Business Analytics", 1, "10:00", "12:00"],
    ["ven_aud1", "Lecture: Marketing 101", 3, "14:00", "16:00"],
    ["ven_aud2", "Lecture: Accounting", 2, "09:00", "11:00"],
    ["ven_jc2", "Lecture: Data Structures", 2, "14:00", "16:00"],
    ["ven_jc2", "Lecture: Operating Systems", 4, "10:00", "12:00"],
    ["ven_jc3", "Lecture: Calculus II", 1, "09:00", "11:00"],
    ["ven_lt5", "Lecture: Psychology", 3, "10:00", "13:00"],
    ["ven_jc1", "Public lecture series", 4, "17:00", "19:00"],
    ["ven_slc", "Club fair booth setup", 5, "12:00", "14:00"],
    ["ven_rooftop", "Sunset networking", 4, "18:00", "21:00"],
  ];
  const start = Date.parse("2026-10-01T00:00:00Z");
  for (let d = 0; d < 92; d++) {
    const day = new Date(start + d * 86400000);
    const date = day.toISOString().slice(0, 10);
    for (const [venue_id, title, dow, st, et] of weekly) {
      if (day.getUTCDay() === dow && date < "2026-11-30") rows.push({ id: `vbk_${venue_id}_${date}_${st.slice(0, 2)}`, venue_id, title, holder: "Academic timetable", kind: "class", date, start_time: st, end_time: et });
    }
  }
  const once: [string, string, string, string, string, string, string][] = [
    ["ven_jch", "Convocation rehearsal", "Registry", "exam", "2026-10-17", "08:00", "17:00"],
    ["ven_jch", "Final exams", "Examinations Office", "exam", "2026-12-01", "08:00", "18:00"],
    ["ven_jch", "Final exams", "Examinations Office", "exam", "2026-12-02", "08:00", "18:00"],
    ["ven_jch", "Cultural Night", "Malaysian Indian Society", "society", "2026-10-31", "18:00", "23:00"],
    ["ven_jc1", "Startup Pitch Day", "Entrepreneurship Club", "society", "2026-10-24", "09:00", "17:00"],
    ["ven_jc1", "Hackathon Finals", "Google Developer Group", "society", "2026-11-21", "09:00", "20:00"],
    ["ven_jc3", "Debate Open", "Debate Society", "society", "2026-11-07", "09:00", "18:00"],
    ["ven_aud1", "Career Talk: Big 4", "Accounting Society", "society", "2026-10-22", "18:00", "20:00"],
    ["ven_aud2", "Film Screening", "Film Club", "society", "2026-11-13", "19:00", "22:00"],
    ["ven_lt5", "Mid term test", "School of Business", "exam", "2026-10-28", "09:00", "12:00"],
    ["ven_rooftop", "Alumni mixer", "Alumni Relations", "society", "2026-10-23", "18:30", "22:00"],
    ["ven_rooftop", "Photography walk", "Photography Club", "society", "2026-11-08", "16:00", "19:00"],
    ["ven_slc", "Board games night", "Games Society", "society", "2026-10-16", "19:00", "22:00"],
    ["ven_slc", "Mental health workshop", "Student LIFE", "society", "2026-11-04", "14:00", "16:00"],
  ];
  for (const [venue_id, title, holder, kind, date, st, et] of once) rows.push({ id: `vbk_${venue_id}_${date}_${st.slice(0, 2)}x`, venue_id, title, holder, kind, date, start_time: st, end_time: et });
  return rows;
}

export async function seedIfEmpty(q: Q) {
  const existing = await q("SELECT count(*)::int AS n FROM universities");
  if (Number(existing[0]?.n ?? 0) > 0) return;
  await seed(q);
}

export async function seed(q: Q) {
  const U = DEMO.users;
  await ins(q, "universities", { id: DEMO.university, name: "Sunway University", short_name: "Sunway", sop: SUNWAY_SOP });
  await ins(q, "sop_documents", {
    id: "sop_sunway_main",
    university_id: DEMO.university,
    title: "Clubs & Societies Event SOP (seed template)",
    kind: "sop",
    content: SUNWAY_SOP_TEXT,
    uploaded_by: U.president,
  });
  await ins(q, "societies", { id: DEMO.society, university_id: DEMO.university, name: "Sunway AI & Tech Society" });
  await ins(q, "societies", { id: DEMO.otherSociety, university_id: DEMO.university, name: "Sunway Robotics Club" });

  const people: [string, string, string, string, string | null, string][] = [
    [U.president, "Aisyah Rahman", "aisyah.president@movents.test", "president", "Executive", "+60 12-301 1101"],
    [U.vp, "Daniel Lim", "daniel.vp@movents.test", "vp", "Executive", "+60 12-301 1102"],
    [U.dirProgrammes, "Priya Nair", "priya.programmes@movents.test", "director", "Programmes", "+60 12-301 1103"],
    [U.dirLogistics, "Jason Tan", "jason.logistics@movents.test", "director", "Logistics", "+60 12-301 1104"],
    [U.committee, "Wei Ling Chong", "weiling.committee@movents.test", "committee", "Programmes", "+60 12-301 1105"],
    [U.committee2, "Arjun Menon", "arjun.marketing@movents.test", "committee", "Marketing", "+60 12-301 1106"],
    [U.faculty, "Dr. Farah Hassan", "farah.advisor@movents.test", "faculty_advisor", null, "+60 3-7491 8600"],
  ];
  for (const [uid, name, email, role, department, phone] of people) {
    await ins(q, "users", { id: uid, society_id: DEMO.society, name, email, role, department, phone, api_key: key() });
  }

  // Capacities are estimates — Sunway does not publish seat counts.
  const venues: [string, string, number, string[], string[], number, number, string][] = [
    ["ven_aud1", "Auditorium 1", 120, ["theatre"], ["projector", "PA system", "2 wireless mics"], 0, 4, "Sunway College South West, Level G"],
    ["ven_aud2", "Auditorium 2", 120, ["theatre"], ["projector", "PA system", "2 wireless mics"], 0, 4, "Sunway College South West, Level G"],
    ["ven_jc2", "JC2", 160, ["theatre"], ["dual projectors", "PA system", "lectern mic", "lecture capture"], 0, 6, "University Building, Level 1"],
    ["ven_jc3", "JC3", 160, ["theatre"], ["dual projectors", "PA system", "lectern mic"], 0, 6, "University Building, Level 1"],
    ["ven_lt5", "Lecture Theatre 5", 200, ["theatre"], ["projector", "PA system", "lecture capture"], 0, 6, "University Building"],
    ["ven_jc1", "JC1 Auditorium", 300, ["theatre"], ["dual projectors", "line array PA", "4 wireless mics", "stage lighting", "livestream"], 0, 8, "University Building, Level 1"],
    ["ven_jch", "Jeffrey Cheah Hall", 600, ["theatre", "banquet", "cocktail", "classroom"], ["stage", "full PA", "lighting rig", "LED wall"], 1500, 10, "Sunway College North building, Level 4"],
    ["ven_rooftop", "Rooftop Terrace", 78, ["banquet", "workshop clusters"], ["portable TV", "2 speakers"], 0, 2, "University Building, Rooftop"],
    ["ven_slc", "Student Life Centre", 80, ["cocktail", "classroom", "workshop clusters"], ["TV screen", "portable speaker"], 0, 2, "Student Life Centre"],
  ];
  for (const [vid, name, capacity, setup_styles, av, cost, lead, location] of venues) {
    await ins(q, "venues", { id: vid, university_id: DEMO.university, name, capacity, setup_styles, av, cost, booking_lead_weeks: lead, location, photo_url: VENUE_PHOTOS[vid] ?? null });
  }
  for (const b of venueBookings()) await ins(q, "venue_bookings", b);

  // Vendor registry: society ratings from past use.
  for (const s of REFERENCE_SUPPLIERS) {
    await ins(q, "vendors", {
      id: rid("ven"),
      event_id: null,
      category: s.category,
      name: s.name,
      url: s.url,
      unit: s.unit,
      unit_price: s.unit_price,
      rating: s.rating,
      snippet: s.snippet,
      source: "registry",
      contract_status: "none",
    });
  }

  // Another society's booking — gives the venue clash check something real to find.
  await ins(q, "events", {
    id: "evt_robowars",
    society_id: DEMO.otherSociety,
    title: "RoboWars Prelims",
    topic: "Robotics",
    date: "2026-11-15",
    start_time: "09:00",
    end_time: "18:00",
    pax: 140,
    budget_cap: 4000,
    approved_budget: 4000,
    status: "approved",
    venue_id: "ven_jc2",
    setup_style: "theatre",
    flags: [],
  });

  await seedPastEvent(q);
}

async function seedPastEvent(q: Q) {
  const U = DEMO.users;
  const e = DEMO.pastEvent;
  await ins(q, "events", {
    id: e,
    society_id: DEMO.society,
    title: "Intro to Data Science Workshop",
    topic: "Data science",
    date: "2026-06-20",
    start_time: "10:00",
    end_time: "13:00",
    pax: 120,
    budget_cap: 2000,
    approved_budget: 2000,
    status: "completed",
    venue_id: "ven_aud1",
    setup_style: "theatre",
    created_by: U.committee,
    flags: [],
  });
  for (const [uid, role] of [[U.committee, "lead"], [U.committee2, "member"], [U.dirProgrammes, "member"]]) {
    await q("INSERT INTO event_members (event_id, user_id, role, added_by) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING", [e, uid, role, U.committee]);
  }
  const lines: [string, string, number, number, number, number][] = [
    ["Food", "Packed lunch, Mix Mix Catering", 110, 20, 2200 / 1, 0],
    ["Merchandise", "Lanyards for all attendees", 120, 2.5, 300, 300],
    ["Speaker", "Token of appreciation", 2, 80, 160, 150],
    ["Printing", "Posters & banners", 1, 150, 150, 132],
  ];
  // Food estimate was 110 × RM20 = RM2,200 but cap was RM2,000 — real event trimmed to 88 packs.
  lines[0][4] = 88 * 20;
  lines[0][5] = 88 * 20;
  let sort = 0;
  for (const [category, description, qty, unit_cost, estimated, actual] of lines) {
    await ins(q, "budget_lines", { id: rid("bl"), event_id: e, category, description, qty, unit_cost, estimated, actual, funding_source: "Society fund", sort: sort++ });
  }
  const guests = mockGuests(e, 120, "luma", 1);
  let i = 0;
  for (const gst of guests) {
    await ins(q, "rsvps", {
      id: rid("rsv"),
      event_id: e,
      name: gst.name,
      email: gst.email,
      source: "luma",
      status: "going",
      ticket: `T-${e.slice(-4).toUpperCase()}-${String(i + 1).padStart(4, "0")}`,
      checked_in: i < 82,
      checked_in_at: i < 82 ? "2026-06-20T09:55:00+08:00" : null,
      dietary: gst.dietary,
      accessibility: gst.accessibility,
    });
    i++;
  }
  const comments: [number, number, string, string][] = [
    [9, 5, "Hands-on notebooks were great", "More time for Q&A"],
    [10, 5, "Speaker was very clear", "Food ran out early"],
    [8, 4, "Practical examples", "Room was too cold"],
    [6, 3, "Good intro", "Too basic for me, wanted advanced content"],
    [9, 5, "Loved the live demo", "Share slides after"],
    [7, 4, "Networking session", "Start on time"],
    [10, 5, "Best workshop this sem", "More workshops please"],
    [5, 3, "Content ok", "Audio was hard to hear at the back"],
  ];
  for (let k = 0; k < 40; k++) {
    const [nps, rating, liked, improve] = comments[k % comments.length];
    await ins(q, "feedback", { id: rid("fb"), event_id: e, name: null, nps, rating, liked, improve, created_at: "2026-06-21T10:00:00+08:00" });
  }
  await ins(q, "sop_documents", {
    id: "sop_lessons_ds",
    university_id: DEMO.university,
    title: "Lessons learned, Intro to Data Science Workshop (Jun 2026)",
    kind: "lessons",
    source_event_id: e,
    uploaded_by: U.president,
    content: `# Lessons learned, Intro to Data Science Workshop (20 Jun 2026)

- Show rate: 82 of 120 registered attended (68%). Size food at ~70% of registrations plus a 5% buffer.
- Venue confirmation took 5 weeks, submit venue requests at least 6 weeks ahead.
- 2 of 3 speakers replied only after a follow-up, follow up 3 days after outreach.
- Lanyards for every attendee were mostly left behind, limit lanyards to committee and speakers.
- Audio was hard to hear at the back, book a venue with a proper PA and test mics at T-30 min.

\`\`\`signals
{"show_rate":0.68,"follow_up_days":3,"lanyards_attendees":false,"av_check":true}
\`\`\``,
  });
  await ins(q, "audit_logs", {
    id: rid("aud"),
    event_id: e,
    user_id: U.president,
    actor: "Aisyah Rahman",
    action: "event.completed",
    details: { note: "Seeded historical event" },
  });
}
