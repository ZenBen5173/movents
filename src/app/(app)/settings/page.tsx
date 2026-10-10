import { currentUser } from "@/lib/session";
import { appUrl } from "@/lib/appurl";
import { isFinal } from "@/lib/rbac";
import { emailProvider } from "@/lib/integrations/email";
import { calendarMode } from "@/lib/integrations/gcal";
import { lumaMode, meetupMode } from "@/lib/integrations/ticketing";
import { paymentsMode } from "@/lib/integrations/payments";
import { nanoBananaEnabled } from "@/lib/integrations/nanobanana";
import { PageHeader } from "@/components/app/ui";
import { SettingsClient, type Integration } from "@/components/app/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = (await currentUser())!;
  const email = emailProvider();
  const integrations: Integration[] = [
    { name: "Email", mark: "@", tone: "bg-tomato", live: email !== "outbox", mode: email === "outbox" ? "Stored in inboxes" : email, why: "Speaker, supplier and faculty mail", env: "GRAPH_* (Outlook), SMTP_* or RESEND_API_KEY" },
    { name: "Calendar", mark: "G", tone: "bg-sky", live: calendarMode() === "google", mode: calendarMode() === "google" ? "Google Calendar" : ".ics feed", why: "Timeline milestones", env: "GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_CALENDAR_ID" },
    { name: "Luma", mark: "L", tone: "bg-peach", live: lumaMode() === "live", mode: lumaMode(), why: "Event page and RSVPs", env: "LUMA_API_KEY" },
    { name: "Meetup", mark: "M", tone: "bg-tomato", live: meetupMode() === "live", mode: meetupMode(), why: "Event page and RSVPs", env: "MEETUP_ACCESS_TOKEN + MEETUP_GROUP_URLNAME" },
    { name: "Payments", mark: "S", tone: "bg-ticket-blue text-white", live: paymentsMode() === "stripe", mode: paymentsMode() === "stripe" ? "Stripe" : "Mock checkout", why: "Supplier deposits", env: "STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET" },
    { name: "Images", mark: "N", tone: "bg-sun", live: nanoBananaEnabled(), mode: nanoBananaEnabled() ? "Gemini" : "WorkBuddy", why: "Posters and social images", env: "GEMINI_API_KEY (optional)" },
    { name: "Weather", mark: "W", tone: "bg-mint", live: true, mode: "Open-Meteo", why: "Risk contingency plans", env: "VENUE_LAT / VENUE_LON (optional)" },
    { name: "Database", mark: "DB", tone: "bg-sand", live: Boolean(process.env.DATABASE_URL), mode: process.env.DATABASE_URL ? "Postgres" : "Embedded", why: "Everything", env: "DATABASE_URL" },
  ];
  const mcpUrl = `${appUrl()}/api/mcp`;
  const mcpConfig = JSON.stringify({ mcpServers: { movents: { type: "streamable-http", url: mcpUrl, headers: { Authorization: `Bearer ${user.api_key}` } } } }, null, 2);
  return (
    <div>
      <PageHeader eyebrow="Admin" title="Settings" />
      <SettingsClient apiKey={user.api_key ?? ""} mcpConfig={mcpConfig} mcpUrl={mcpUrl} integrations={integrations} isFinal={isFinal(user)} />
    </div>
  );
}
