import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/dashboard/session";

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

export default async function InspectLayout({ children }: { children: React.ReactNode }) {
  const session = await getDashboardSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-50 antialiased">{children}</div>
  );
}
