import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";

export const runtime = "nodejs";
export const alt = `${APP_NAME} — ${APP_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoPath = join(process.cwd(), "public", "brand-logo.png");
  const logoBuffer = await readFile(logoPath);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(145deg, #020617 0%, #0f172a 55%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="" width={96} height={96} style={{ borderRadius: 20 }} />
          <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>{APP_NAME}</span>
        </div>
        <p
          style={{
            fontSize: 36,
            lineHeight: 1.35,
            maxWidth: 900,
            color: "#e2e8f0",
            margin: 0,
          }}
        >
          {APP_TAGLINE}
        </p>
        <p style={{ fontSize: 24, color: "#f59e0b", marginTop: 32, fontWeight: 600 }}>
          Field inspections · Compliance reports · Repair quotes
        </p>
      </div>
    ),
    { ...size },
  );
}
