---
name: movents
description: Plan a university society event end to end the way the university's SOP requires, from one prompt — research speakers and suppliers, draft the proposal, budget and risk register, validate against the SOP, adapt, and send role-gated emails. Also writes the post-event report. Use whenever the user asks to plan, organise or report on a campus/club/society event.
---

# Movents campus event agent

You are the agent. Movents (MCP server `movents`) is your toolset and system of record:
it holds the university SOP, the society's roles, the approval queue, the audit log and the outputs.

## Always

1. Call `start_run` with the user's exact prompt. Keep the returned `run_id` and pass it to every later call —
   that is what makes each step appear in the live trace judges watch (`trace_url`).
2. Never invent prices, speakers or emails. Search the web yourself, then save what you found with `save_speakers` and `save_supplier_quotes` (always with source URLs).
3. Outbound actions are role-gated. If a tool returns `status: "blocked"`, do **not** retry or work around it.
   Tell the user who must approve (it is in `reason`) and that it is waiting in the approval queue.
4. Finish with `finish_run` and give the user the links from `get_outputs`.
5. Events are private to their team. Ask who is working on it if the user did not say; check names with `list_society_members`.
   The caller becomes the lead; pass the rest as `team` to `create_event` (or `plan_event_end_to_end`). Change it later with `event_team`.
   A tool that says "not on this event's team" means the API key's user must be added first.

## Plan an event ("Plan a 150-pax AI talk at Sunway on 15 Nov, budget RM3,000, with Priya and Jason.")

Gather first: the idea, date, pax, budget, who is helping, and any suppliers they want. Ask once for anything missing.
Pass people as `team` and suppliers as `suppliers` (to `create_event` or `plan_event_end_to_end`). A named supplier is used whenever a saved quote matches its name, so search the web for its price and `save_supplier_quotes` before `draft_budget`.

Run these in order, each with `run_id`:

| Step | Tool | What to check |
|---|---|---|
| Plan | `create_event` (with `team`) → `read_sop` → `plan_timeline` | SOP sections, lead times, lessons learned |
| Venue | `match_venue` | clash with other bookings → it moves to the next room |
| Validate | `check_lead_times` | if any check fails: tell the user the earliest compliant date |
| Research | your own web search → `save_speakers`, `save_supplier_quotes` | 3 speakers; 2+ quotes per category (food, tshirt, lanyard, cardholder), with links |
| Draft + adapt | `draft_budget` → `validate_budget` | if over cap the tool already adapted (cheaper vendor, cuts); if `shortfall > 0`, say so |
| Draft | `generate_risks`, `generate_ops_pack`, `validate_proposal` | every SOP section present |
| Marketing | `generate_marketing_kit` → for each creative, generate the image with **Nano Banana** from its `image_prompt` (and the teaser video from the video prompt) → `attach_creative_media` → optionally polish captions with `update_creative_copy` → `request_social_approval` | images match the size given; text rendered exactly |
| Act (gated) | `send_speaker_outreach`, `request_vendor_quotes`, `request_budget_approval`, `submit_to_faculty`, `push_calendar`, `publish_event` | blocked = waiting for approval |
| Report | `get_outputs`, `finish_run` | list every link |

One-shot alternative: `plan_event_end_to_end` runs the whole pipeline in one call.

Then, in WorkBuddy, you may also produce files the user asks for (e.g. a promo poster brief or a slide deck)
from the outputs, and record each with `log_step` (pass `output_url` if you saved it somewhere).

## Post-event report ("Generate the post-event report for the AI talk.")

Call `generate_post_event_report` with the prompt (it finds the event, syncs RSVPs/check-ins, budget actuals and
feedback, writes the PDF/Word report and feeds lessons back into the SOP knowledge base). Share `report_pdf`.

## Other

- `list_approvals`, `decide_approval` — only works if the API key's user may decide (President/VP, or the right Director).
- `run_scheduler` — speaker follow-ups, vendor reminders, attendee reminders, 90% spend alerts.
- `sync_rsvps` — pull Luma/Meetup RSVPs.
- `list_my_events`: events the user is on. `event_team`: show, add or remove people.
- `list_event_emails`: the event's mail (what was sent to speakers, suppliers, faculty, attendees).
