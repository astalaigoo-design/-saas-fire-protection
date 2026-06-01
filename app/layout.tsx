import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import { OfflinePrecache } from "@/components/offline/offline-precache";
import { ChunkErrorRecovery } from "@/components/pwa/chunk-error-recovery";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { buildRootMetadata } from "@/lib/seo/site-metadata";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={cn("dark font-sans", inter.variable)}>
        <body>
          <ServiceWorkerRegistration />
          <ChunkErrorRecovery />
          <OfflinePrecache />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
