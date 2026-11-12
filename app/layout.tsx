import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mono",
    template: "%s | Mono",
  },
  description: "A minimal, private base for your next app.",
  manifest: "/manifest.webmanifest",
  applicationName: "Mono",
  appleWebApp: {
    capable: true,
    title: "Mono",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
