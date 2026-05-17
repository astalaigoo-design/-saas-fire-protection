import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Field inspection",
  description: "Mobile inspection checklist",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default function InspectLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-50 antialiased">{children}</div>
  );
}
