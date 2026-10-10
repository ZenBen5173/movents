import { C, border } from "../../theme";
import { blink, lerp, soft, typed } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Icon } from "../../ui/Icon";
import { Avatar, Mono, card } from "../../ui/kit";

const MAILS = [
  { from: "Jonathan Lee", photo: "jonathan.jpg", subj: "Re: Invitation to speak at AI Talk", snip: "Happy to join on 15 Nov...", time: "9:42", tag: "Speaker", tagBg: C.sky },
  { from: "Mix Mix Catering", subj: "Quotation for 150 pax", snip: "Halal set, RM20/pax incl. drinks", time: "9:10", tag: "Supplier", tagBg: C.peach },
  { from: "Student LIFE Office", subj: "Pre-event proposal received", snip: "We will review within 5 days", time: "Fri", tag: "Approval", tagBg: C.mint },
  { from: "Dr. Aisha Kamal", photo: "aisha.jpg", subj: "Confirmed for 15 Nov", snip: "Sending my bio and photo now", time: "Thu", tag: "Speaker", tagBg: C.sky },
  { from: "Priyanka Raman", photo: "priyanka.jpg", subj: "Re: Following up", snip: "Checking my calendar this week", time: "Wed", tag: "Speaker", tagBg: C.sky },
];

const BODY = "Hi Wei Ling, thanks for the invite! I'd be glad to speak on 15 Nov. Working title: From student project to AI startup. Do you need my slides by a certain date?";
const REPLY = "Hi Jonathan, wonderful! Slides by 10 Nov would be perfect. I've attached the speaker profile form for Student LIFE. See you on the rooftop!";

export function InboxTab({ f }: { f: number }) {
  const pane = soft(f, 14);
  const draft = soft(f, 34);
  return (
    <div style={{ display: "flex", gap: 22, height: 600 }}>
      <div style={{ width: 540, ...card(5), overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: C.sand, borderBottom: border(2) }}>
          <Icon name="inbox" size={18} />
          <Mono size={12} color={C.ink}>aitalk@movents.app</Mono>
          <span style={{ marginLeft: "auto", fontFamily: F.mono, fontWeight: 700, fontSize: 12, background: C.tomato, border: border(1.5), borderRadius: 99, padding: "1px 8px" }}>3 new</span>
        </div>
        {MAILS.map((m, i) => {
          const p = soft(f, 2 + i * 4);
          const sel = i === 0;
          return (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 18px", borderTop: i ? `1.5px solid ${C.line}` : undefined, background: sel ? "#fff6d6" : "transparent", borderLeft: sel ? `5px solid ${C.tomato}` : "5px solid transparent", opacity: p, transform: `translateX(${(1 - p) * -30}px)` }}>
              <Avatar name={m.from} photo={m.photo} size={44} i={i} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16.5 }}>{m.from}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: m.tagBg, border: border(1.2), borderRadius: 99, padding: "1px 7px" }}>{m.tag}</span>
                  <span style={{ marginLeft: "auto", fontSize: 13.5, color: C.muted }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 15.5, fontWeight: i < 3 ? 700 : 500, marginTop: 2 }}>{m.subj}</div>
                <div style={{ fontSize: 14.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.snip}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, ...card(5), padding: "22px 28px", opacity: pane, transform: `translateX(${(1 - pane) * 40}px)`, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 28 }}>Re: Invitation to speak at AI Talk</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <Avatar name="Jonathan Lee" photo="jonathan.jpg" size={40} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Jonathan Lee</div>
            <div style={{ fontSize: 14, color: C.muted }}>Founder, Petaling Robotics · to aitalk@movents.app</div>
          </div>
        </div>
        <div style={{ fontSize: 18, lineHeight: 1.55, marginTop: 18 }}>{BODY}</div>
        <div style={{ marginTop: "auto", border: `2px dashed ${C.blue}`, borderRadius: 14, padding: "14px 18px", background: "#f2f6ff", opacity: draft, transform: `translateY(${(1 - draft) * 30}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "#0052D9", color: "#fff", display: "grid", placeItems: "center", fontFamily: F.display, fontWeight: 700, fontSize: 11 }}>WB</div>
            <Mono size={11.5} color={C.blue}>WorkBuddy drafted a reply</Mono>
          </div>
          <div style={{ fontSize: 17, lineHeight: 1.5, marginTop: 8, minHeight: 78 }}>
            {typed(REPLY, f, 34, 2.9)}
            {f > 34 && f < 34 + REPLY.length / 2.9 + 8 && blink(f) && <span style={{ display: "inline-block", width: 2.5, height: 19, background: C.blue, marginLeft: 2, verticalAlign: "text-bottom" }} />}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10, opacity: lerp(f, 80, 88) }}>
            <span style={{ background: C.ink, color: "#fff", borderRadius: 10, padding: "7px 16px", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="send" size={15} color="#fff" /> Send
            </span>
            <span style={{ border: border(1.5), borderRadius: 10, padding: "7px 14px", fontWeight: 500, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="attach" size={15} /> speaker-profile.pdf
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
