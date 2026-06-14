import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import { DeferredAppShell } from "@/components/pwa/deferred-app-shell";
import { buildRootMetadata, buildRootViewport } from "@/lib/seo/site-metadata";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = buildRootMetadata();
export const viewport: Viewport = buildRootViewport();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={cn("dark font-sans", inter.variable)}>
        <body>
          <DeferredAppShell />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
