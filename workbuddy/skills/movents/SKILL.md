---
name: movents
description: Plan, run and wrap up university club and society events with Movents. Use whenever someone wants to plan an event (talk, workshop, hackathon, career fair, cultural night, any campus or club event), change part of an existing event (posters, sponsors, speakers, budget, meetings), or write the post-event report. Works from normal conversation; the user never needs to name tools.
---

# Movents: campus event planning

Movents (MCP server `movents`) is your toolset and the society's record: university SOP, roles and approvals, budget, tasks, sponsors, meetings and every output. People talk to you normally. Never ask them for tool names or ids.

## 1. Get the brief (ask once)

When someone wants to plan an event, call `review_brief` with their words.
- If it returns `questions`, ask **all of them in one short, friendly message** and wait. Typical gaps: date, headcount, budget, who is helping, topic.
- Ask only once. If they say "you decide" or skip something, use `defaults_if_user_says_you_decide`.
- You may also ask the `optional_to_ask` items in the same message (e.g. a preferred caterer).
- Then plan without stopping again.

## 2. Plan it end to end

Call `start_run` with the full brief (their words plus the answers) and pass its `run_id` to every call, so the Movents page shows you building the event live.

1. `create_event` (team and preferred suppliers from the brief), `read_sop`, `plan_timeline`, `match_venue`, `check_lead_times`. If a lead time fails, tell the user the earliest compliant date at the end.
2. Search the web for **3 real speakers** who fit, and `save_speakers` with source links.
3. Search the web for **real supplier prices** (food, T-shirts, lanyards, card holders), and `save_supplier_quotes` with links. Include any supplier the user named.
4. `draft_budget`, then `validate_budget`. If a check fails, fix it and validate again.
5. `generate_risks`, `generate_ops_pack`, `validate_proposal`.
6. Search the web for **5 likely sponsors**, and `save_sponsors`.
7. `generate_marketing_kit`. For each creative it returns (skip the video), **generate the image with Nano Banana** (your image generation) from its `image_prompt` at its size, keeping the event text exact, then `attach_creative_media` with `file_path`. Then `request_social_approval`.
8. `schedule_meeting`: a kick-off with the team in the next few days.
9. `send_speaker_outreach`, `request_vendor_quotes`, `send_sponsor_outreach`, `request_budget_approval`, `submit_to_faculty`, `push_calendar`, `publish_event`.
10. `get_outputs`, `finish_run`.

Run independent steps in parallel where you can. Never invent prices, people or emails: research them.

## 3. Change part of an existing event

Find it with `list_my_events` (match by name), `start_run` with the request, then only what's needed:
- **Posters or social images:** `list_creatives`. For those with `needs_image`, generate with Nano Banana and `attach_creative_media` (`file_path`).
- **More sponsors:** web search, `save_sponsors`, then `send_sponsor_outreach`. Use `record_sponsor_reply` when someone answers.
- **Speakers or suppliers:** search, `save_speakers` / `save_supplier_quotes`, then `draft_budget` and `validate_budget`.
- **Meetings:** `schedule_meeting`, then `record_minutes` after it.
- **Team:** `event_team`.

Finish with `finish_run`.

## 4. After the event

"Write the report for …": call `generate_post_event_report` with their words, then share the report link.

## Always

- Blocked actions (`status: "blocked"`) are the approval gate working. Tell the user who must approve; never work around it.
- End with a short summary: venue, budget against the cap, what's waiting for approval and who approves it, and the event link.
- Other tools: `list_approvals`, `decide_approval` (only if the user may decide), `sync_rsvps`, `list_event_emails`, `list_meetings`, `list_sponsors`, `get_event`.
