import { ImageResponse } from "next/og";

export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const s = Math.min(1024, Math.max(32, Number(size) || 192));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ff5a36", color: "#161514", fontSize: s * 0.42, fontWeight: 700, letterSpacing: -s * 0.02 }}>
        M
      </div>
    ),
    { width: s, height: s },
  );
}
