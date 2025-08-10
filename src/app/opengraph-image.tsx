import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
          fontSize: 64,
          color: "#0f172a",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.6, marginBottom: 12 }}>QuantFident Mentorship</div>
        <div style={{ fontWeight: 700, textAlign: "center", maxWidth: 900 }}>
          Think Smart. Be QuantFident
        </div>
      </div>
    ),
    { ...size }
  );
}

