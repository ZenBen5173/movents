# Running Movents on Tencent WorkBuddy

WorkBuddy is the agent. Movents is the web app + tool server it drives.

1. Deploy Movents (see main README) and sign in as **Wei Ling Chong (Committee member)**.
2. Settings → copy the **MCP server config** (it already contains your URL and API key).
3. In WorkBuddy, add a custom MCP connector with that config (or edit `mcp.json` here and import it).
4. Add the skill in `skills/movents/SKILL.md` to WorkBuddy (Skills → import from folder).
5. Ask WorkBuddy, in one prompt:
   > Plan a 150-pax AI talk at Sunway on 15 Nov, budget RM3,000.
6. Open the `trace_url` it returns — each WorkBuddy tool call appears live, marked `workbuddy → <tool>`.
7. Switch to **Aisyah Rahman (President)** in the app → Approvals → approve. Emails send; the audit log shows the chain.
8. Second prompt in WorkBuddy:
   > Generate the post-event report for the AI talk.

Because the API key belongs to a committee member, WorkBuddy is subject to the same role gates as a person —
it cannot send the faculty email until the President approves.

Plain REST is also available for every tool: `POST /api/agent/tools/<name>` (OpenAPI at `/api/openapi.json`).

## Slides and documentation (must be made in WorkBuddy)

Give WorkBuddy `slides-brief.md` and ask: "Make a 7-slide pitch deck and export to PDF from this brief,
using screenshots from the deployed app." Do the same with `../docs/USER_GUIDE.md` for the documentation.
