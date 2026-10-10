# Movents — campus event agent

> One prompt plans your event the way your university requires it, and only the right people can approve it.

Dormathon 2026 · Track 2 (Tencent WorkBuddy). **WorkBuddy is the agent**; this repo is the web app shell and the
MCP tool server it drives: SOP knowledge base, role-based access, approval queue, audit log, integrations and the
views that show WorkBuddy's outputs. A built-in executor runs the same pipeline from the web prompt box, so the app
also works on its own.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000, pick **Wei Ling Chong (Committee member)**, and run:

> Plan a 150-pax AI talk at Sunway on 15 Nov, budget RM3,000.

Then switch to **Aisyah Rahman (President)** → Approvals → approve. Then run:

> Generate the post-event report for the AI talk.

No keys are needed — every integration has a working demo mode and the trace says which mode ran.
Copy `.env.example` to `.env.local` to turn integrations on.

## What one prompt does

1. **Plan** — parse the goal, read the university SOP + lessons from past events, back-calculate a 5-phase timeline.
2. **Research** — WorkBuddy searches the web for speakers and suppliers (food, T-shirts, lanyards, card holders), cheapest first.
3. **Draft** — proposal in the SOP's section format (PDF + Word), budget sheet (XLSX/CSV with quote links),
   risk register with weather/contingency plan (Open-Meteo), run sheet, promotion plan, reminders, roster.
4. **Validate** — budget ≤ cap incl. 10% contingency; every SOP section present; SOP lead times met; venue free.
5. **Adapt** — venue clash → next room; over budget → swap to cheaper suppliers, then cut in priority order;
   lead time missed → flag and suggest the earliest compliant date. Every adaptation is logged.
6. **Act (role-gated)** — speaker outreach, vendor quote requests, budget approval, faculty submission, Google
   Calendar, Luma page. Blocked actions go to the approval queue and notify the approver.
7. **Report** — live trace with links to every output; post-event report feeds lessons back into the SOP.

## Feature map (spec → where)

| Spec item | Where |
|---|---|
| SOP knowledge base per university, upload/view | `/sop` (upload .md/.txt, structure auto-detected) |
| Multi-university onboarding (out of scope → built) | `/universities/new` |
| Proposal generator in SOP format | `/api/outputs/:id/proposal.pdf|docx` |
| Approval routing, approval queue, audit log | `/approvals`, `/audit`, `src/lib/rbac.ts`, `src/lib/actions.ts` |
| Faculty approves via link | `/faculty/:approvalId?t=…` (signed) |
| Phased timeline | Event → Overview (5 phases, click to progress) + `.ics` / Google Calendar |
| Speaker finder (WorkBuddy web search) + outreach + auto follow-up | Event → Speakers & vendors; scheduler |
| Risk register + weather/contingency | Event → Overview; `risks.xlsx|pdf` |
| Venue tracker + clash detection | `/venues`, agent step "Match venue" |
| Budget: line items, 10% contingency, est. vs actual, funding | Event → Budget; `budget.xlsx|csv` |
| Supplier search, cheapest first | agent step + Budget → Supplier quotes |
| Vendor registry: category, quote, contract, deposit, rating | `/vendors` |
| 90% spend alert | Budget bar, notification, scheduler |
| Vendor reminders 7 days before | scheduler |
| Luma / Meetup page + RSVP sync | Event → Registration (live API with keys, mock without) |
| Real Luma/Meetup API calls (out of scope → built) | `src/lib/integrations/ticketing.ts` |
| Promotion checklist | Event → Promotion |
| Reminder cadence 6w/4w/2w/3d/day-of | Event → Registration; scheduler |
| Waitlist, dietary, accessibility | `/e/:id` public registration; Registration page |
| Attendance prediction to size food and venue | Event → Registration (show rate learned from past events) |
| Run sheet in 15-minute blocks | Event → Event day (editable) + PDF |
| Volunteer roster, emergency contacts | Event → Event day |
| Post-event report | second prompt; `report.pdf|docx` |
| Feedback survey + NPS | `/f/:id` |
| Lessons learned fed back into SOP | report step "Feed lessons into SOP knowledge base" |
| Real payments / vendor deposits (out of scope → built) | Stripe Checkout (test keys) or mock checkout, gated by President |
| Mobile app (out of scope → built as PWA) | installable PWA, bottom nav, `/checkin/:id` QR door check-in |
| Posters, Instagram/LinkedIn posts & captions, Reels storyboard (new) | Event → Promotion → Marketing kit; Nano Banana via WorkBuddy (`attach_creative_media`) or `GEMINI_API_KEY`; approval-gated |
| WorkBuddy integration | `/api/mcp` (MCP), `/api/agent/tools/*` (REST), `workbuddy/` skill |

## Roles

| Role | Can do without approval |
|---|---|
| President / VP | Everything |
| Director / HOD | Speaker & vendor emails; approve requests for own department; budget ≤ threshold |
| Committee member | Drafts, agent runs, internal calendar. Everything outbound → approval queue |
| Faculty advisor | Approves/rejects the proposal from the emailed link |

## Stack

Next.js 15 (App Router) · Tailwind 4 · components from the team's library · PGlite (embedded Postgres) or any
Postgres via `DATABASE_URL` · `docx`, `pdf-lib`, `exceljs` for outputs · MCP over Streamable HTTP.

## Deploy (Vercel)

Set `DATABASE_URL` (e.g. Supabase Postgres) — without it the embedded DB lives in `/tmp` and resets.
Set `APP_URL`, `APP_SECRET`, `CRON_SECRET`, plus any integration keys. `vercel.json` schedules the daily cron.

## Tests

```bash
npm test
```

Planning engine, budget adapt loop, lead-time checks, venue clash, run sheet, NPS/themes, RBAC table, SOP parser.
