import { C } from "./theme";

export type Brief = {
  title: string;
  task: string;
  prompt: string;
  reply: string;
  steps: string[];
  /** index of a step that ends "waiting for approval" instead of done */
  waitStep?: number;
};

/** Older tasks already in the WorkBuddy sidebar. */
export const OLD_TASKS = [
  { title: "Plan event automation workflow", time: "4h" },
  { title: "Draft sponsor email", time: "7h" },
];

export const BRIEFS: Brief[] = [
  {
    title: "AI Talk @ Sunway",
    task: "Plan AI Talk @ Sunway",
    prompt: "Plan a 150-pax AI talk at Sunway on 15 Nov. Budget RM3,000. Team: Priya, Jason, Arjun. Use Mix Mix Catering for food.",
    reply: "On it. Planning AI Talk @ Sunway in Movents.",
    steps: [
      "Using connector: Movents (MCP)",
      "create_event · team: Priya, Jason, Arjun",
      "read_sop · Sunway University",
      "plan_timeline · 24 tasks",
      "web search · speakers & supplier quotes",
      "draft_budget · RM2,725 of RM3,000",
      "generate_risks · 5 risks",
      "send_speaker_outreach · waiting for approval",
    ],
    waitStep: 7,
  },
  {
    title: "Hackathon 2026",
    task: "Plan Hackathon 2026",
    prompt: "Hackathon 2026, 200 pax, 22 Nov. Budget RM5,000. 24 hours, we need mentors and pizza.",
    reply: "Got it. Planning Hackathon 2026 in Movents.",
    steps: ["Using connector: Movents (MCP)", "create_event · 200 pax, RM5,000", "read_sop · Sunway University", "plan_timeline · 28 tasks", "web search · mentors & pizza quotes", "draft_budget · RM4,600 of RM5,000"],
  },
  {
    title: "Career Fair",
    task: "Plan Career Fair",
    prompt: "Career fair for 300 pax on 29 Nov. Budget RM8,000. Invite 20 companies.",
    reply: "On it. Planning Career Fair in Movents.",
    steps: ["Using connector: Movents (MCP)", "create_event · 300 pax, RM8,000", "read_sop · Sunway University", "plan_timeline · 32 tasks", "web search · 20 hiring companies", "draft_budget · RM7,400 of RM8,000"],
  },
  {
    title: "Cultural Night",
    task: "Plan Cultural Night",
    prompt: "Cultural night, 250 pax, 6 Dec. Budget RM6,000. Food stalls and performances.",
    reply: "On it. Planning Cultural Night in Movents.",
    steps: ["Using connector: Movents (MCP)", "create_event · 250 pax, RM6,000", "read_sop · Sunway University", "plan_timeline · 26 tasks", "web search · food stalls & performers", "draft_budget · RM5,500 of RM6,000"],
  },
];

export const BOX_ROWS = [
  { title: "AI Talk @ Sunway", meta: "15 NOV · Rooftop Terrace", days: 36, progress: 0.48, budgetUsed: 29, found: 5, reached: 3, budget: 3000, dot: C.green, status: "Planning" },
  { title: "Hackathon 2026", meta: "22 NOV · JC1 Auditorium", days: 43, progress: 0.24, budgetUsed: 12, found: 8, reached: 2, budget: 5000, dot: C.tomato, status: "Planning" },
  { title: "Career Fair", meta: "29 NOV · Jeffrey Cheah Hall", days: 50, progress: 0.16, budgetUsed: 8, found: 20, reached: 6, budget: 8000, dot: C.sun, status: "Planning" },
  { title: "Cultural Night", meta: "6 DEC · Student Life Centre", days: 57, progress: 0.11, budgetUsed: 5, found: 8, reached: 1, budget: 6000, dot: C.blue, status: "Planning" },
];

export const TEAM = [
  { name: "Wei Ling Chong", role: "Lead" },
  { name: "Priya Nair", role: "Programme" },
  { name: "Jason Tan", role: "Logistics" },
  { name: "Arjun Menon", role: "Publicity" },
];

export const SPEAKERS = [
  { name: "Dr. Aisha Kamal", headline: "Principal ML Scientist", org: "Nusantara AI Labs", photo: "aisha.jpg", talk: "Building AI for Malaysian languages", status: "Confirmed", tone: C.green },
  { name: "Jonathan Lee", headline: "Founder", org: "Petaling Robotics", photo: "jonathan.jpg", talk: "From student project to AI startup", status: "Replied", tone: C.blue },
  { name: "Priyanka Raman", headline: "AI Product Lead", org: "Selangor Digital Bank", photo: "priyanka.jpg", talk: "Shipping responsible AI in finance", status: "Followed up", tone: C.sun },
];

export const VENUES = [
  { name: "Student Life Centre", seats: 80, img: "student-life-centre.jpg", kind: "Lounge" },
  { name: "Rooftop Terrace", seats: 78, img: "rooftop-terrace.jpg", kind: "Outdoor rooftop" },
  { name: "Auditorium 1", seats: 120, img: "auditorium-1.jpg", kind: "Lecture theatre" },
  { name: "JC2", seats: 160, img: "jc2.jpg", kind: "Auditorium" },
  { name: "JC1 Auditorium", seats: 300, img: "jc1.jpg", kind: "Auditorium" },
  { name: "Jeffrey Cheah Hall", seats: 600, img: "jeffrey-cheah-hall.jpg", kind: "Main hall" },
];

export type Vendor = { name: string; sub: string; price: string; rating: number; img: string; used?: number; crop?: { s: number; x: string; y: string } };

export const VENDOR_TABS: { label: string; items: Vendor[] }[] = [
  {
    label: "Food",
    items: [
      { name: "Mix Mix Catering", sub: "Halal caterer, Klang Valley", price: "RM20/pax", rating: 4.1, img: "vendors/food-1.jpg", used: 3 },
      { name: "Tastytouch Catering", sub: "Buffet (promo)", price: "RM30/pax", rating: 4.6, img: "vendors/food-2.jpg" },
      { name: "Tastytouch Catering", sub: "Bento sets, min 50 pax", price: "RM19.50/pax", rating: 4.3, img: "vendors/food-3.jpg" },
      { name: "The Humble Food Company", sub: "Western buffet", price: "RM35/pax", rating: 4.5, img: "vendors/food-4.jpg" },
    ],
  },
  {
    label: "T-shirts",
    items: [
      { name: "e-print.my", sub: "Microfiber silkscreen", price: "RM9.50/pc", rating: 4.2, img: "vendors/tee-1.jpg", used: 1 },
      { name: "Juara Print Shop", sub: "Cotton silkscreen", price: "RM14.50/pc", rating: 4.4, img: "vendors/tee-2.jpg" },
      { name: "TMaker", sub: "51 to 100 pcs", price: "RM16/pc", rating: 4.2, img: "vendors/tee-3.jpg" },
      { name: "Tshirtprint-KL", sub: "1-colour silkscreen", price: "RM15/pc", rating: 4.1, img: "vendors/tee-4.jpg" },
    ],
  },
  {
    label: "Lanyards",
    items: [
      { name: "Lanyards.com.my", sub: "20mm full colour", price: "RM4.50/pc", rating: 4.5, img: "vendors/lan-1.jpg" },
      { name: "CUSTA", sub: "20mm sublimation", price: "RM2.22/pc", rating: 4.2, img: "vendors/lan-2.jpg", used: 1 },
      { name: "The Lanyards Factory", sub: "From 100 pcs", price: "RM3.90/pc", rating: 4.1, img: "vendors/lan-3.jpg" },
    ],
  },
  {
    label: "Card holders",
    items: [
      { name: "CUSTA", sub: "PVC ID holder", price: "RM0.79/pc", rating: 4.2, img: "vendors/hold-1.jpg", used: 1 },
      { name: "CUSTA", sub: "PU leather holder", price: "RM1.90/pc", rating: 4.4, img: "vendors/hold-2.jpg" },
      { name: "Lapasar", sub: "PVC name card holder", price: "RM0.95/pc", rating: 4.1, img: "vendors/hold-1.jpg", crop: { s: 2.3, x: "38%", y: "58%" } },
    ],
  },
];
