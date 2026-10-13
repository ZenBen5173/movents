"use server";

import { revalidatePath } from "next/cache";
import { id, insert, one, query, transaction, update } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { addMembers, assertMember, assertMemberOf, isMember, removeMember, seesAll } from "@/lib/members";
import { audit } from "@/lib/audit";
import { decideApproval, facultyDecision, gate } from "@/lib/actions";
import { canManageSop, isFinal } from "@/lib/rbac";
import { verifyToken } from "@/lib/appurl";
import * as T from "@/lib/agent/tools";
import { runScheduler } from "@/lib/scheduler";
import { parseSopText } from "@/lib/sop-parse";
import { SUNWAY_SOP } from "@/lib/sop-default";
import { paymentsMode, retrieveCheckout } from "@/lib/integrations/payments";
import { forwardNote, vendorRecipient } from "@/lib/vendor-contact";
import type { ApprovalRequest, EventRow, Rsvp, Sop, User, Vendor, Venue } from "@/lib/types";

/** Signed-in user who is on the team of the event this row belongs to. */
async function onTeam(table: string, rowId: string) {
  const user = await requireUser();
  await assertMemberOf(user, table, rowId);
  return user;
}
async function onEvent(eventId: string | null | undefined) {
  const user = await requireUser();
  await assertMember(user, eventId);
  return user;
}

type Res = { ok: true; message?: string; data?: unknown } | { ok: false; error: string };

async function wrap(fn: () => Promise<string | void | { message?: string; data?: unknown }>, paths: string[] = []): Promise<Res> {
  try {
    const r = await fn();
    for (const p of paths) revalidatePath(p, "layout");
    if (paths.length) revalidatePath("/", "layout");
    if (typeof r === "string") return { ok: true, message: r };
    return { ok: true, ...(r ?? {}) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ------------------------------------------------------------------ approvals

export async function decide(approvalId: string, decision: "approve" | "reject", note?: string) {
  return wrap(async () => {
    const user = await requireUser();
    const r = await decideApproval(user, approvalId, decision, note);
    if (r.status === "failed") throw new Error(`Approved, but execution failed: ${"error" in r ? r.error : ""}`);
    return decision === "approve" ? (r.status === "awaiting_faculty" ? "Approved, proposal emailed to the faculty advisor" : "Approved and executed") : "Rejected";
  }, ["/"]);
}

export async function decideAll(ids: string[]) {
  return wrap(async () => {
    const user = await requireUser();
    let ok = 0;
    const errors: string[] = [];
    for (const a of ids) {
      try {
        await decideApproval(user, a, "approve");
        ok++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    if (errors.length && !ok) throw new Error(errors[0]);
    return `Approved ${ok} request(s)${errors.length ? `, ${errors.length} skipped` : ""}`;
  }, ["/"]);
}

export async function facultyDecide(approvalId: string, token: string, decision: "approve" | "reject", note?: string) {
  return wrap(async () => {
    const user = await (async () => {
      try {
        return await requireUser();
      } catch {
        return null;
      }
    })();
    if (!verifyToken(approvalId, token) && user?.role !== "faculty_advisor") throw new Error("Invalid or expired link");
    const r = await facultyDecision(approvalId, decision, note);
    return `Proposal ${r.status}`;
  }, ["/"]);
}

// ------------------------------------------------------------------ suppliers

/** Pick a different supplier for a category: flips "selected" and reprices the budget line. */
export async function swapSupplier(vendorId: string) {
  return wrap(async () => {
    const user = await onTeam("vendors", vendorId);
    const next = await one<Vendor>("SELECT * FROM vendors WHERE id = $1", [vendorId]);
    if (!next?.event_id) throw new Error("Supplier not found");
    const prev = await one<Vendor>("SELECT * FROM vendors WHERE event_id = $1 AND category = $2 AND selected = true", [next.event_id, next.category]);
    if (prev?.id === next.id) return "Already chosen";
    if (prev && (prev.contract_status === "signed" || prev.deposit_status === "paid")) throw new Error(`${prev.name.split(" — ")[0]} is signed or paid. Cancel that first.`);
    await query("UPDATE vendors SET selected = (id = $1) WHERE event_id = $2 AND category = $3", [next.id, next.event_id, next.category]);
    const line = await one<{ id: string; qty: number; unit_cost: number; description: string }>("SELECT * FROM budget_lines WHERE event_id = $1 AND vendor_id = $2", [next.event_id, prev?.id ?? ""]);
    if (line) {
      const ratio = prev?.unit_price ? line.unit_cost / prev.unit_price : 1;
      const unit = Math.round((next.unit_price ?? 0) * ratio * 100) / 100;
      const oldName = prev?.name ?? "";
      await update("budget_lines", line.id, {
        vendor_id: next.id,
        unit_cost: unit,
        estimated: Math.round(unit * line.qty * 100) / 100,
        source_url: next.url,
        description: oldName && line.description.includes(oldName) ? line.description.replace(oldName, next.name) : line.description,
      });
      await update("vendors", next.id, { quote: Math.round(unit * line.qty * 100) / 100 });
    }
    await audit(user, "budget.supplier_changed", { category: next.category, from: prev?.name, to: next.name }, { eventId: next.event_id });
    return `Switched to ${next.name.split(" — ")[0]}`;
  }, ["/events"]);
}

// ------------------------------------------------------------------ event team

export async function setEventMember(eventId: string, userId: string, on: boolean) {
  return wrap(async () => {
    const user = await requireUser();
    if (!(await isMember(user, eventId))) throw new Error("Only people on this event can change its team");
    const lead = await one<{ user_id: string }>("SELECT user_id FROM event_members WHERE event_id = $1 AND role IN ('lead','colead') AND user_id = $2", [eventId, user.id]);
    if (!lead && !seesAll(user) && userId !== user.id) throw new Error("Only the event lead can change the team");
    const target = await one<User>("SELECT * FROM society_members WHERE id = $1 AND society_id = $2", [userId, user.society_id]);
    if (!target) throw new Error("Person not found");
    if (on) await addMembers(eventId, [userId], user.id);
    else {
      const lead = await one<{ user_id: string }>("SELECT user_id FROM event_members WHERE event_id = $1 AND role = 'lead'", [eventId]);
      if (lead?.user_id === userId) throw new Error("The event lead stays on the team");
      if (userId === user.id && !seesAll(user)) throw new Error("Ask the lead to remove you");
      await removeMember(eventId, userId);
    }
    await audit(user, on ? "event.member_added" : "event.member_removed", { person: target.name }, { eventId });
    return on ? `${target.name} added` : `${target.name} removed`;
  }, ["/events"]);
}

// ------------------------------------------------------------------ tasks / budget / risks

export async function setTaskStatus(taskId: string, status: "todo" | "doing" | "done") {
  return wrap(async () => {
    const user = await onTeam("tasks", taskId);
    const t = await update<{ event_id: string; title: string }>("tasks", taskId, { status });
    await audit(user, "task.status", { task: t?.title, status }, { eventId: t?.event_id });
  }, ["/events"]);
}

export async function setActual(lineId: string, actual: number | null) {
  return wrap(async () => {
    const user = await onTeam("budget_lines", lineId);
    const l = await update<{ event_id: string; description: string }>("budget_lines", lineId, { actual });
    await audit(user, "budget.actual_entered", { line: l?.description, actual }, { eventId: l?.event_id });
    if (l) {
      const ev = await one<EventRow>("SELECT * FROM events WHERE id = $1", [l.event_id]);
      const spent = Number((await one<{ s: number }>("SELECT coalesce(sum(actual),0)::float AS s FROM budget_lines WHERE event_id = $1", [l.event_id]))?.s ?? 0);
      const approved = ev?.approved_budget ?? ev?.budget_cap ?? 0;
      if (ev && approved && spent >= approved * 0.9 && !ev.flags.some((f) => f.message.startsWith("Spend alert"))) {
        const msg = `Spend alert: RM${spent.toFixed(2)} is ${Math.round((spent / approved) * 100)}% of the approved RM${approved}.`;
        await update("events", ev.id, { flags: [...ev.flags, { level: "warn", message: msg }] });
        await insert("notifications", { id: id("ntf"), role: "president", title: `Budget 90% alert, ${ev.title}`, body: msg, link: `/events/${ev.id}/budget` });
        await audit(user, "budget.alert", { spent, approved }, { eventId: ev.id });
        return { message: msg };
      }
    }
  }, ["/events"]);
}

export async function setFunding(lineId: string, funding: string) {
  return wrap(async () => {
    await onTeam("budget_lines", lineId);
    await update("budget_lines", lineId, { funding_source: funding });
  }, ["/events"]);
}

export async function rerunBudget(eventId: string) {
  return wrap(async () => {
    const user = await onEvent(eventId);
    const sop = await T.readSop(eventId);
    const r = await T.draftBudget(eventId, sop.signals);
    await audit(user, "budget.recomposed", { total: r.final.total, iterations: r.iterations.length }, { eventId });
    return `Budget recomposed: ${r.iterations.map((i) => i.total).join(" → ")}`;
  }, ["/events"]);
}

// ------------------------------------------------------------------ speakers & vendors

export async function speakerAction(speakerId: string, action: "outreach" | "replied" | "confirm" | "declined") {
  return wrap(async () => {
    const user = await onTeam("speakers", speakerId);
    const sp = await one<{ id: string; event_id: string; name: string; email: string | null }>("SELECT * FROM speakers WHERE id = $1", [speakerId]);
    if (!sp) throw new Error("Speaker not found");
    if (action === "outreach") {
      await query("UPDATE speakers SET status = 'found' WHERE id = $1 AND status NOT IN ('contacted','followed_up','confirmed')", [speakerId]);
      const r = await T.outreachSpeakers(user, sp.event_id, null);
      return r.map((x) => `${x.speaker}: ${x.status}`).join("; ") || "No speakers waiting for outreach";
    }
    if (action === "confirm") {
      const r = await gate(user, "speaker.confirm", `Confirm ${sp.name} as speaker`, { speaker_id: sp.id }, { eventId: sp.event_id });
      return r.status === "blocked" ? `Sent for approval: ${r.reason}` : r.status === "executed" ? `${sp.name} confirmed` : r.error;
    }
    await update("speakers", speakerId, { status: action, replied_at: new Date() });
    await audit(user, `speaker.${action}`, { speaker: sp.name }, { eventId: sp.event_id });
    return `${sp.name} marked ${action}`;
  }, ["/events"]);
}

export async function addSpeaker(eventId: string, data: { name: string; email: string; headline: string; source_url: string }) {
  return wrap(async () => {
    const user = await onEvent(eventId);
    await insert("speakers", { id: id("spk"), event_id: eventId, name: data.name, email: data.email || null, headline: data.headline || null, source_url: data.source_url || null, status: "found", source: "manual" });
    await audit(user, "speaker.added", { name: data.name }, { eventId });
  }, ["/events"]);
}

export async function findMoreSpeakers(eventId: string) {
  return wrap(async () => {
    await onEvent(eventId);
    const r = await T.researchSpeakers(eventId, 3);
    return `${r.speakers.length} speakers (${r.mode})`;
  }, ["/events"]);
}

export async function vendorUpdate(vendorId: string, data: Partial<Pick<Vendor, "rating" | "contract_status" | "contact_email" | "quote" | "name" | "category" | "unit_price" | "unit" | "url">>) {
  return wrap(async () => {
    const user = await requireUser();
    const v = await update<Vendor>("vendors", vendorId, data);
    await audit(user, "vendor.updated", { vendor: v?.name, ...data }, { eventId: v?.event_id });
  }, ["/vendors", "/events"]);
}

export async function addVendor(data: { category: string; name: string; url: string; unit_price: number; unit: string; contact_email: string; rating: number | null; university_id?: string }) {
  return wrap(async () => {
    const user = await requireUser();
    await insert("vendors", { id: id("vnd"), event_id: null, ...data, source: "registry", contract_status: "none" });
    await audit(user, "vendor.added", { name: data.name, category: data.category });
  }, ["/vendors"]);
}

export async function emailVendor(vendorId: string, eventId: string, subject: string, body: string) {
  return wrap(async () => {
    const user = await onEvent(eventId);
    const v = await one<Vendor>("SELECT * FROM vendors WHERE id = $1", [vendorId]);
    if (!v) throw new Error("Vendor not found");
    const rcpt = await vendorRecipient(v, user.society_id);
    const to = rcpt.to;
    const r = await gate(user, "email.vendor", `Email ${v.name}: ${subject}`, { vendor_id: v.id, event_id: eventId || null, to, subject: `${rcpt.forward ? "[Forward to vendor] " : ""}${subject}`, html: `${rcpt.forward ? forwardNote(v.name) : ""}<p>${body.replace(/\n/g, "<br>")}</p><p>${user.name}</p>`, kind: "vendor" }, { eventId: eventId || null });
    return r.status === "blocked" ? `Sent for approval: ${r.reason}` : r.status === "executed" ? "Email sent" : r.error;
  }, ["/vendors", "/events"]);
}

export async function payDeposit(vendorId: string, eventId: string | null, amount: number) {
  return wrap(async () => {
    const user = await requireUser();
    const v = await one<Vendor>("SELECT * FROM vendors WHERE id = $1", [vendorId]);
    if (!v) throw new Error("Vendor not found");
    const r = await gate(user, "payment.deposit", `Pay RM${amount} deposit to ${v.name}`, { vendor_id: vendorId, event_id: eventId, amount }, { eventId, amount });
    if (r.status === "blocked") return `Sent for approval: ${r.reason}`;
    if (r.status === "failed") throw new Error(r.error);
    return { message: "Checkout created", data: { url: r.result.checkout_url } };
  }, ["/vendors", "/events"]);
}

export async function completeMockPayment(paymentId: string) {
  return wrap(async () => {
    const p = await one<{ id: string; vendor_id: string; event_id: string; amount: number; provider: string; provider_ref: string; status: string }>("SELECT * FROM payments WHERE id = $1", [paymentId]);
    if (!p) throw new Error("Payment not found");
    if (p.status === "paid") return "Already paid";
    if (p.provider === "stripe") {
      const s = await retrieveCheckout(p.provider_ref);
      if (s.payment_status !== "paid") throw new Error(`Stripe says: ${s.payment_status}`);
    }
    await update("payments", p.id, { status: "paid", paid_at: new Date() });
    await update("vendors", p.vendor_id, { deposit_status: "paid" });
    await audit({ id: null, name: p.provider === "stripe" ? "Stripe" : "Mock checkout" }, "payment.deposit_paid", { payment_id: p.id, amount: p.amount, mode: paymentsMode() }, { eventId: p.event_id });
    return "Deposit paid";
  }, ["/vendors"]);
}

// ------------------------------------------------------------------ registration

export async function publish(eventId: string, platform: "luma" | "meetup") {
  return wrap(async () => {
    const user = await onEvent(eventId);
    const r = await T.publishEvent(user, eventId, null, platform);
    return r.status === "blocked" ? `Sent for approval: ${r.reason}` : r.status === "executed" ? `Published: ${String(r.result.url)}` : r.error;
  }, ["/events"]);
}

export async function sync(eventId: string, platform: "luma" | "meetup") {
  return wrap(async () => {
    const user = await onEvent(eventId);
    const r = await T.syncRsvps(eventId, platform);
    await audit(user, "rsvp.synced", { platform, ...r }, { eventId });
    return `${platform}: ${r.added} new, ${r.updated} updated (${r.mode})`;
  }, ["/events"]);
}

export async function checkIn(rsvpId: string, value = true) {
  return wrap(async () => {
    const user = await requireUser();
    const r = await update<Rsvp>("rsvps", rsvpId, { checked_in: value, checked_in_at: value ? new Date() : null });
    await audit(user, value ? "rsvp.checked_in" : "rsvp.check_in_undone", { name: r?.name, ticket: r?.ticket }, { eventId: r?.event_id });
    return r ? `${r.name} ${value ? "checked in" : "unchecked"}` : "Not found";
  }, ["/events", "/checkin"]);
}

export async function checkInByTicket(eventId: string, ticket: string) {
  return wrap(async () => {
    const r = await one<Rsvp>("SELECT * FROM rsvps WHERE event_id = $1 AND upper(ticket) = upper($2)", [eventId, ticket.trim()]);
    if (!r) throw new Error(`No ticket ${ticket}`);
    if (r.checked_in) return `${r.name} was already checked in`;
    const user = await requireUser();
    await update("rsvps", r.id, { checked_in: true, checked_in_at: new Date() });
    await audit(user, "rsvp.checked_in", { name: r.name, ticket: r.ticket }, { eventId });
    return `${r.name} checked in`;
  }, ["/checkin"]);
}

export async function promoteWaitlist(eventId: string) {
  return wrap(async () => {
    const user = await onEvent(eventId);
    const ev = await one<EventRow>("SELECT * FROM events WHERE id = $1", [eventId]);
    const venue = ev?.venue_id ? await one<Venue>("SELECT * FROM venues WHERE id = $1", [ev.venue_id]) : null;
    const going = Number((await one<{ n: number }>("SELECT count(*)::int AS n FROM rsvps WHERE event_id = $1 AND status = 'going'", [eventId]))?.n ?? 0);
    const free = Math.max(0, (venue?.capacity ?? ev?.pax ?? 0) - going);
    const rows = await query<{ id: string }>("SELECT id FROM rsvps WHERE event_id = $1 AND status = 'waitlist' ORDER BY created_at LIMIT $2", [eventId, free]);
    for (const r of rows) await update("rsvps", r.id, { status: "going" });
    await audit(user, "rsvp.waitlist_promoted", { count: rows.length }, { eventId });
    return `Promoted ${rows.length} from waitlist (${free} seats were free)`;
  }, ["/events"]);
}

export async function setPromo(itemId: string, status: string, link?: string) {
  return wrap(async () => {
    await onTeam("promo_items", itemId);
    await update("promo_items", itemId, { status, link: link ?? undefined });
  }, ["/events"]);
}

export async function pushCal(eventId: string) {
  return wrap(async () => {
    const user = await onEvent(eventId);
    const r = await T.pushToCalendar(user, eventId, null);
    return r.status === "executed" ? `${String(r.result.created)} calendar events (${String(r.result.provider)})` : r.status === "blocked" ? r.reason : r.error;
  }, ["/events"]);
}

export async function runSchedulerNow() {
  return wrap(async () => {
    const user = await requireUser();
    if (!isFinal(user)) throw new Error("Only the President/VP can run the scheduler manually");
    const r = await runScheduler({ societyId: user.society_id });
    await audit(user, "scheduler.run", { actions: r.actions.length, today: r.today });
    return { message: r.actions.length ? r.actions.join(" · ") : "Nothing due today", data: r };
  }, ["/"]);
}

export async function updateRunsheetItem(itemId: string, data: { activity?: string; owner?: string; notes?: string }) {
  return wrap(async () => {
    await onTeam("runsheet_items", itemId);
    await update("runsheet_items", itemId, data);
  }, ["/events"]);
}

export async function updateVolunteer(volId: string, data: { name?: string; phone?: string; emergency?: boolean }) {
  return wrap(async () => {
    await onTeam("volunteers", volId);
    await update("volunteers", volId, data);
  }, ["/events"]);
}

// ------------------------------------------------------------------ public forms

export async function registerRsvp(eventId: string, data: { name: string; email: string; dietary: string; accessibility: string }) {
  return wrap(async () => {
    if (!data.name.trim() || !/\S+@\S+\.\S+/.test(data.email)) throw new Error("Name and a valid email are required");
    const ev = await one<EventRow>("SELECT * FROM events WHERE id = $1", [eventId]);
    if (!ev) throw new Error("Event not found");
    const existing = await one<Rsvp>("SELECT * FROM rsvps WHERE event_id = $1 AND lower(email) = lower($2)", [eventId, data.email]);
    if (existing) return { message: "You're already registered", data: existing };
    const venue = ev.venue_id ? await one<Venue>("SELECT capacity FROM venues WHERE id = $1", [ev.venue_id]) : null;
    const going = Number((await one<{ n: number }>("SELECT count(*)::int AS n FROM rsvps WHERE event_id = $1 AND status = 'going'", [eventId]))?.n ?? 0);
    const status = going >= (venue?.capacity ?? ev.pax) ? "waitlist" : "going";
    const r = await insert<Rsvp>("rsvps", { id: id("rsv"), event_id: eventId, name: data.name.trim(), email: data.email.trim(), source: "direct", status, ticket: T.ticketCode(), dietary: data.dietary || null, accessibility: data.accessibility || null });
    await audit({ id: null, name: data.name }, "rsvp.registered", { status, source: "direct" }, { eventId });
    return { message: status === "waitlist" ? "Event is full, you're on the waitlist" : "You're registered!", data: r };
  });
}

export async function submitFeedback(eventId: string, data: { name: string; nps: number; rating: number; liked: string; improve: string }) {
  return wrap(async () => {
    if (data.nps < 0 || data.nps > 10 || data.rating < 1 || data.rating > 5) throw new Error("Please answer both scores");
    await insert("feedback", { id: id("fb"), event_id: eventId, name: data.name || null, nps: data.nps, rating: data.rating, liked: data.liked || null, improve: data.improve || null });
    return "Thanks for your feedback!";
  });
}

// ------------------------------------------------------------------ SOP & universities

export async function uploadSop(universityId: string, title: string, content: string, applyStructure: boolean) {
  return wrap(async () => {
    const user = await requireUser();
    if (!canManageSop(user)) throw new Error("Only the President/VP can change the SOP");
    if (!content.trim()) throw new Error("The document is empty");
    await insert("sop_documents", { id: id("sop"), university_id: universityId, title, kind: "sop", content, uploaded_by: user.id });
    let msg = "SOP document saved";
    if (applyStructure) {
      const uni = await one<{ sop: Sop }>("SELECT sop FROM universities WHERE id = $1", [universityId]);
      const parsed = parseSopText(content, uni?.sop ?? SUNWAY_SOP);
      await update("universities", universityId, { sop: parsed.sop });
      msg = `SOP saved and applied: ${parsed.found.sections} sections, ${parsed.found.leadTimes} lead times, ${parsed.found.rules} rules detected`;
    }
    await audit(user, "sop.uploaded", { title, applied: applyStructure });
    return msg;
  }, ["/sop"]);
}

export async function saveSopStructure(universityId: string, sop: Sop) {
  return wrap(async () => {
    const user = await requireUser();
    if (!canManageSop(user)) throw new Error("Only the President/VP can change the SOP");
    await update("universities", universityId, { sop });
    await audit(user, "sop.structure_updated", { version: sop.version });
    return "SOP updated";
  }, ["/sop"]);
}

export async function onboardUniversity(data: {
  name: string;
  short_name: string;
  sopText: string;
  venues: { name: string; capacity: number; booking_lead_weeks: number }[];
}) {
  return wrap(async () => {
    const user = await requireUser();
    if (!isFinal(user)) throw new Error("Only a President/VP can add a university");
    const name = String(data.name ?? "").trim().slice(0, 160);
    const short = String(data.short_name ?? "").trim().slice(0, 40);
    if (!name || !short) throw new Error("University name and short name are required");
    const uid = `uni_${short.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20)}_${crypto.randomUUID().slice(0, 6)}`;
    const sopText = String(data.sopText ?? "").slice(0, 200_000);
    const parsed = parseSopText(sopText, { ...SUNWAY_SOP, version: "1.0" });
    await transaction(async () => {
      await insert("universities", { id: uid, name, short_name: short, sop: parsed.sop, created_by_society: user.society_id });
      if (sopText.trim()) await insert("sop_documents", { id: id("sop"), university_id: uid, title: `${short} event SOP`, kind: "sop", content: sopText, uploaded_by: user.id });
      for (const v of (Array.isArray(data.venues) ? data.venues : []).filter((x) => x?.name).slice(0, 100)) {
        await insert("venues", { id: id("ven"), university_id: uid, name: String(v.name).slice(0, 120), capacity: Number(v.capacity) || 100, setup_styles: ["theatre"], av: ["projector"], cost: 0, booking_lead_weeks: Number(v.booking_lead_weeks) || 2 });
      }
    });
    await audit(user, "university.onboarded", { university: name, sections: parsed.found.sections, lead_times: parsed.found.leadTimes });
    return { message: `${name} added`, data: { id: uid } };
  }, ["/universities", "/sop"]);
}

export async function markNotificationsRead() {
  return wrap(async () => {
    const u = await requireUser();
    await query("UPDATE notifications SET read = true WHERE user_id = $1 OR (role = $2 AND society_id = $3)", [u.id, u.role, u.society_id]);
  }, ["/"]);
}

// ------------------------------------------------------------------ marketing kit

export async function genKit(eventId: string) {
  return wrap(async () => {
    const user = await onEvent(eventId);
    const { generateKit } = await import("@/lib/marketing");
    const r = await generateKit(eventId, { withImages: true });
    await audit(user, "marketing.kit_generated", { creatives: r.creatives.length, mode: r.mode, images: r.generated }, { eventId });
    return r.errors.length ? `Kit refreshed; ${r.errors.length} image(s) failed: ${r.errors[0]}` : `Marketing kit ready (${r.mode === "nano-banana" ? `${r.generated} Nano Banana images` : "template images"})`;
  }, ["/events"]);
}

export async function regenCreative(creativeId: string) {
  return wrap(async () => {
    const user = await onTeam("creatives", creativeId);
    const { regenerateImage } = await import("@/lib/marketing");
    const c = await regenerateImage(creativeId);
    await audit(user, "marketing.image_generated", { creative: c?.kind, model: "nano-banana" }, { eventId: c?.event_id });
    return "New image generated with Nano Banana";
  }, ["/events"]);
}

export async function uploadCreative(creativeId: string, dataUrl: string) {
  return wrap(async () => {
    const user = await onTeam("creatives", creativeId);
    const { setImage } = await import("@/lib/marketing");
    const c = await setImage(creativeId, dataUrl, "upload");
    await audit(user, "marketing.media_uploaded", { creative: c?.kind }, { eventId: c?.event_id });
    return "Media attached";
  }, ["/events"]);
}

export async function saveCreativeCopy(creativeId: string, caption: string, hashtags: string) {
  return wrap(async () => {
    await onTeam("creatives", creativeId);
    await update("creatives", creativeId, { caption, hashtags, updated_at: new Date() });
  }, ["/events"]);
}

export async function requestSocial(eventId: string) {
  return wrap(async () => {
    const user = await onEvent(eventId);
    const r = await T.requestSocialApproval(user, eventId, null);
    return r.status === "blocked" ? `Sent for approval: ${r.reason}` : r.status === "executed" ? "Creatives approved" : r.error;
  }, ["/events"]);
}

export async function markCreativePosted(creativeId: string, url: string) {
  return wrap(async () => {
    const user = await onTeam("creatives", creativeId);
    const c = await one<{ status: string; event_id: string; kind: string }>("SELECT status, event_id, kind FROM creatives WHERE id = $1", [creativeId]);
    if (!c) throw new Error("Creative not found");
    if (c.status !== "approved" && c.status !== "posted") throw new Error("Get it approved first (SOP: publicity approval before posting)");
    await update("creatives", creativeId, { status: "posted", posted_url: url || null, updated_at: new Date() });
    await audit(user, "marketing.posted", { creative: c.kind, url }, { eventId: c.event_id });
    return "Marked as posted";
  }, ["/events"]);
}

// ------------------------------------------------------------------ project management: tasks & risks

type TaskPatch = Partial<{ title: string; status: "todo" | "doing" | "done"; owner_id: string | null; due_date: string; start_date: string | null; priority: string; phase: string; depends_on: string[]; description: string | null }>;

function wouldCycle(taskId: string, deps: string[], all: { id: string; depends_on: string[] }[]) {
  const byId = new Map(all.map((t) => [t.id, t.depends_on]));
  const stack = [...deps];
  const seen = new Set<string>();
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === taskId) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    stack.push(...(byId.get(cur) ?? []));
  }
  return false;
}

export async function updateTask(taskId: string, patch: TaskPatch) {
  return wrap(async () => {
    const user = await onTeam("tasks", taskId);
    const t = await one<{ id: string; event_id: string; title: string; status: string; depends_on: string[]; risk_id: string | null }>("SELECT * FROM tasks WHERE id = $1", [taskId]);
    if (!t) throw new Error("Task not found");
    const all = await query<{ id: string; title: string; status: string; depends_on: string[] }>("SELECT id, title, status, depends_on FROM tasks WHERE event_id = $1", [t.event_id]);
    if (patch.depends_on) {
      patch.depends_on = [...new Set(patch.depends_on.filter((d) => d !== taskId && all.some((a) => a.id === d)))];
      if (wouldCycle(taskId, patch.depends_on, all)) throw new Error("That dependency would create a loop");
    }
    if (patch.status === "done" || patch.status === "doing") {
      const deps = patch.depends_on ?? t.depends_on;
      const open = deps.map((d) => all.find((a) => a.id === d)).filter((a) => a && a.status !== "done");
      if (open.length) throw new Error(`Blocked by: ${open.map((o) => o!.title.replace(/^SOP: /, "")).join(", ")}`);
    }
    await update("tasks", taskId, patch);
    if (t.risk_id && patch.status) await update("risks", t.risk_id, { status: patch.status === "done" ? "closed" : "mitigating" });
    const changes = Object.keys(patch).join(", ");
    await audit(user, "task.updated", { task: patch.title ?? t.title, changes, status: patch.status }, { eventId: t.event_id });
  }, ["/events"]);
}

export async function createTask(eventId: string, data: { title: string; phase: string; due_date: string; owner_id?: string | null; priority?: string; depends_on?: string[] }) {
  return wrap(async () => {
    const user = await onEvent(eventId);
    if (!data.title.trim()) throw new Error("Give the task a title");
    const tid = id("tsk");
    await insert("tasks", { id: tid, event_id: eventId, title: data.title.trim(), phase: data.phase, due_date: data.due_date, start_date: data.due_date, owner_id: data.owner_id ?? user.id, priority: data.priority ?? "medium", depends_on: data.depends_on ?? [], status: "todo", sort: 500 });
    await audit(user, "task.created", { task: data.title }, { eventId });
    return { message: "Task added", data: { id: tid } };
  }, ["/events"]);
}

export async function deleteTask(taskId: string) {
  return wrap(async () => {
    const user = await onTeam("tasks", taskId);
    const t = await one<{ event_id: string; title: string; key: string | null }>("SELECT event_id, title, key FROM tasks WHERE id = $1", [taskId]);
    if (!t) throw new Error("Task not found");
    await query("DELETE FROM tasks WHERE id = $1", [taskId]);
    await query("UPDATE tasks SET depends_on = depends_on - $1 WHERE event_id = $2", [taskId, t.event_id]);
    await query("UPDATE risks SET mitigation_task_id = NULL, status = 'open' WHERE mitigation_task_id = $1", [taskId]);
    await audit(user, "task.deleted", { task: t.title }, { eventId: t.event_id });
    return "Task deleted";
  }, ["/events"]);
}

export async function updateRisk(riskId: string, patch: Partial<{ status: string; likelihood: number; impact: number; mitigation: string; contingency: string; owner_id: string | null; description: string }>) {
  return wrap(async () => {
    const user = await onTeam("risks", riskId);
    const r = await update<{ event_id: string; category: string }>("risks", riskId, patch);
    await audit(user, "risk.updated", { risk: r?.category, ...patch }, { eventId: r?.event_id });
  }, ["/events"]);
}

export async function createRisk(eventId: string, data: { category: string; description: string; likelihood: number; impact: number; mitigation: string }) {
  return wrap(async () => {
    const user = await onEvent(eventId);
    if (!data.description.trim()) throw new Error("Describe the risk");
    await insert("risks", { id: id("rsk"), event_id: eventId, category: data.category || "General", description: data.description, likelihood: data.likelihood, impact: data.impact, mitigation: data.mitigation || "TBD", contingency: null, owner_id: user.id, status: "open" });
    await audit(user, "risk.created", { risk: data.description }, { eventId });
    return "Risk added";
  }, ["/events"]);
}

export async function addMitigationTask(riskId: string) {
  return wrap(async () => {
    const user = await onTeam("risks", riskId);
    const r = await one<{ id: string; event_id: string; category: string; mitigation: string; owner_id: string | null; mitigation_task_id: string | null }>("SELECT * FROM risks WHERE id = $1", [riskId]);
    if (!r) throw new Error("Risk not found");
    if (r.mitigation_task_id) return "Already has a mitigation task";
    const ev = await one<{ date: string }>("SELECT date FROM events WHERE id = $1", [r.event_id]);
    const tid = id("tsk");
    const due = ev ? new Date(Date.parse(ev.date) - 7 * 86400000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    await insert("tasks", { id: tid, event_id: r.event_id, title: `Mitigate: ${r.category} — ${r.mitigation.split(/[;.]/)[0]}`, phase: "execution", due_date: due, start_date: due, owner_id: r.owner_id ?? user.id, priority: "high", risk_id: r.id, depends_on: [], status: "todo", sort: 950 });
    await update("risks", r.id, { mitigation_task_id: tid, status: "mitigating" });
    await audit(user, "risk.mitigation_task_created", { risk: r.category }, { eventId: r.event_id });
    return "Mitigation task added to the board";
  }, ["/events"]);
}

export async function deleteVendors(ids: string[]) {
  return wrap(async () => {
    const user = await requireUser();
    for (const v of ids) await query("DELETE FROM vendors WHERE id = $1 AND event_id IS NULL", [v]);
    await audit(user, "vendor.removed", { count: ids.length });
    return `Removed ${ids.length} vendor(s)`;
  }, ["/universities"]);
}

export async function setRsvpStatus(rsvpId: string, status: string) {
  return wrap(async () => {
    const user = await requireUser();
    if (!["going", "waitlist", "cancelled"].includes(status)) throw new Error("Unknown status");
    const r = await update<Rsvp>("rsvps", rsvpId, { status });
    await audit(user, "rsvp.status", { name: r?.name, status }, { eventId: r?.event_id });
  }, ["/events"]);
}

export async function saveTemplate(universityId: string, kind: string, title: string, sectionsText: string, key?: string) {
  return wrap(async () => {
    const user = await requireUser();
    if (!canManageSop(user)) throw new Error("Only the President/VP can change templates");
    const { parseSections } = await import("@/lib/templates");
    const sections = parseSections(sectionsText);
    if (!sections.length) throw new Error("Add at least one section");
    const uni = await one<{ sop: Sop & { templates?: { key: string; kind: string; title: string; sections: unknown[] }[] } }>("SELECT sop FROM universities WHERE id = $1", [universityId]);
    if (!uni) throw new Error("University not found");
    const sop = uni.sop;
    if (kind === "pre_event") {
      sop.required_sections = sections;
    } else {
      const k = key ?? (kind === "custom" ? `custom_${Date.now().toString(36)}` : kind);
      const list = (sop.templates ?? []).filter((t) => t.key !== k);
      list.push({ key: k, kind, title: title || k, sections });
      sop.templates = list;
    }
    await update("universities", universityId, { sop });
    await audit(user, "sop.template_saved", { kind, title, sections: sections.length });
    return "Template saved";
  }, ["/universities"]);
}
