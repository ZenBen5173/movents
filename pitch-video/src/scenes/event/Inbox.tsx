import { C, border } from "../../theme";
import { blink, lerp, pop, soft, typed } from "../../ui/anim";
import { F } from "../../ui/fonts";
import { Generate, SkCircle, SkLine, type GenTarget } from "../../ui/Generate";
import { Icon } from "../../ui/Icon";
import { Avatar, Mono, Skel, card } from "../../ui/kit";

const MAILS = [
  { from: "Jonathan Lee", photo: "jonathan.jpg", subj: "Re: Invitation to speak at AI Talk", snip: "Happy to join on 15 Nov...", time: "9:42", tag: "Speaker", tagBg: C.sky },
  { from: "Mix Mix Catering", subj: "Quotation for 150 pax", snip: "Halal set, RM20/pax incl. drinks", time: "9:10", tag: "Supplier", tagBg: C.peach },
  { from: "Student LIFE Office", subj: "Pre-event proposal received", snip: "We will review within 5 days", time: "Fri", tag: "Approval", tagBg: C.mint },
  { from: "Dr. Aisha Kamal", photo: "aisha.jpg", subj: "Confirmed for 15 Nov", snip: "Sending my bio and photo now", time: "Thu", tag: "Speaker", tagBg: C.sky },
  { from: "Priyanka Raman", photo: "priyanka.jpg", subj: "Re: Following up", snip: "Checking my calendar this week", time: "Wed", tag: "Speaker", tagBg: C.sky },
];

const BODY = "Hi Wei Ling, thanks for the invite! I'd be glad to speak on 15 Nov. Working title: From student project to AI startup. Do you need my slides by a certain date?";
const REPLY = "Hi Jonathan, wonderful! Slides by 10 Nov would be perfect. I've attached the speaker profile form for Student LIFE. See you on the rooftop!";

export const INBOX_GEN: GenTarget[] = [
  { at: 14, x: 270, y: 210, chip: "sorting the inbox…" },
  { at: 32, x: 960, y: 120 },
  { at: 48, x: 960, y: 500, chip: "drafting a reply…" },
];
const [A_LIST, A_PANE, A_DRAFT] = INBOX_GEN.map((g) => g.at);
const TYPE_SPEED = 4.4;

export function InboxTab({ f }: { f: number }) {
  const m = f - A_LIST;
  const p = f - A_PANE;
  const d = f - A_DRAFT;
  return (
    <div style={{ display: "flex", gap: 22, height: 600 }}>
      <Generate
        f={f}
        at={A_LIST}
        pad="0"
        seed="mails"
        wipe={18}
        sparks={20}
        style={{ width: 540 }}
        skel={
          <div>
            <div style={{ height: 46, background: "#f1ede4", borderBottom: `2px solid ${C.line}`, display: "flex", alignItems: "center", padding: "0 18px" }}>
              <Skel w={180} h={10} f={f} />
            </div>
            {MAILS.map((_, k) => (
              <div key={k} style={{ display: "flex", gap: 14, padding: "16px 18px", borderTop: k ? `1.5px solid ${C.line}` : undefined }}>
                <SkCircle f={f} size={44} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                  <SkLine f={f} ws={[130, 60]} h={13} gap={10} />
                  <Skel w={240} h={11} f={f} />
                  <Skel w={200} h={10} f={f} />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <div style={{ ...card(5), overflow: "hidden", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: C.sand, borderBottom: border(2) }}>
            <Icon name="inbox" size={18} />
            <Mono size={12} color={C.ink}>aitalk@movents.app</Mono>
            <span style={{ marginLeft: "auto", fontFamily: F.mono, fontWeight: 700, fontSize: 12, background: C.tomato, border: border(1.5), borderRadius: 99, padding: "1px 8px" }}>3 new</span>
          </div>
          {MAILS.map((ml, i) => {
            const q = soft(m, 2 + i * 3);
            const sel = i === 0;
            return (
              <div key={i} style={{ display: "flex", gap: 14, padding: "14px 18px", borderTop: i ? `1.5px solid ${C.line}` : undefined, background: sel ? "#fff6d6" : "transparent", borderLeft: sel ? `5px solid ${C.tomato}` : "5px solid transparent", opacity: q, transform: `translateX(${(1 - q) * -30}px)` }}>
                <Avatar name={ml.from} photo={ml.photo} size={44} i={i} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 16.5 }}>{ml.from}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: ml.tagBg, border: border(1.2), borderRadius: 99, padding: "1px 7px", display: "inline-block", transform: `scale(${pop(m, 8 + i * 3)})` }}>{ml.tag}</span>
                    <span style={{ marginLeft: "auto", fontSize: 13.5, color: C.muted }}>{ml.time}</span>
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: i < 3 ? 700 : 500, marginTop: 2 }}>{ml.subj}</div>
                  <div style={{ fontSize: 14.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ml.snip}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Generate>
      <Generate
        f={f}
        at={A_PANE}
        pad="22px 28px"
        seed="pane"
        style={{ flex: 1 }}
        skel={
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Skel w={420} h={24} f={f} />
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <SkCircle f={f} size={40} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skel w={140} h={13} f={f} />
                <Skel w={300} h={10} f={f} />
              </div>
            </div>
            <Skel w="100%" h={13} f={f} />
            <Skel w="95%" h={13} f={f} />
            <Skel w="60%" h={13} f={f} />
          </div>
        }
      >
        <div style={{ ...card(5), padding: "22px 28px", display: "flex", flexDirection: "column", height: "100%", transform: `translateX(${(1 - soft(p, 0)) * 20}px)` }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 28 }}>Re: Invitation to speak at AI Talk</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <Avatar name="Jonathan Lee" photo="jonathan.jpg" size={40} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Jonathan Lee</div>
              <div style={{ fontSize: 14, color: C.muted }}>Founder, Petaling Robotics · to aitalk@movents.app</div>
            </div>
          </div>
          <div style={{ fontSize: 18, lineHeight: 1.55, marginTop: 18 }}>{BODY}</div>
          <Generate
            f={f}
            at={A_DRAFT}
            radius={14}
            pad="14px 18px"
            seed="draft"
            style={{ marginTop: "auto" }}
            skel={
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SkLine f={f} ws={[26, 200]} h={12} gap={10} />
                <Skel w="100%" h={12} f={f} />
                <Skel w="92%" h={12} f={f} />
                <Skel w="70%" h={12} f={f} />
                <SkLine f={f} ws={[90, 170]} h={30} gap={10} />
              </div>
            }
          >
            <div style={{ border: `2px dashed ${C.blue}`, borderRadius: 14, padding: "14px 18px", background: "#f2f6ff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: C.wb, color: "#fff", display: "grid", placeItems: "center", fontFamily: F.display, fontWeight: 700, fontSize: 11 }}>WB</div>
                <Mono size={11.5} color={C.blue}>WorkBuddy drafted a reply</Mono>
              </div>
              <div style={{ fontSize: 17, lineHeight: 1.5, marginTop: 8, minHeight: 78 }}>
                {typed(REPLY, d, 2, TYPE_SPEED)}
                {d > 2 && d < 2 + REPLY.length / TYPE_SPEED + 6 && blink(f) && <span style={{ display: "inline-block", width: 2.5, height: 19, background: C.blue, marginLeft: 2, verticalAlign: "text-bottom" }} />}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10, opacity: lerp(d, 30, 36) }}>
                <span style={{ background: C.ink, color: "#fff", borderRadius: 10, padding: "7px 16px", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="send" size={15} color="#fff" /> Send
                </span>
                <span style={{ border: border(1.5), borderRadius: 10, padding: "7px 14px", fontWeight: 500, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="attach" size={15} /> speaker-profile.pdf
                </span>
              </div>
            </div>
          </Generate>
        </div>
      </Generate>
    </div>
  );
}
