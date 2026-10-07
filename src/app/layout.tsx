// src/app/layout.tsx
import React from "react";
import type { Metadata } from "next";
// Inter + JetBrains Mono for the entire UI — bundled in node_modules via
// @fontsource-variable, so the build never fetches fonts over the network.
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
// import "@/app/(jobs)/jobmatch/_components/_styles/docx-preview.css";
import ClientLayout from "./ClientLayout";
import ClientErrorReporter from "@/components/ClientErrorReporter";

export const metadata: Metadata = {
  title: "Careerbot",
  description: "AI-powered resume analysis, ATS score checking, and intelligent job matching.",
  // viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: [
      { url: "/assets/icons/favicon-48.png?v=6", sizes: "48x48", type: "image/png" },
      { url: "/assets/icons/favicon-512.png?v=6", sizes: "512x512", type: "image/png" },
      { url: "/assets/icons/favicon-192.png?v=6", sizes: "192x192", type: "image/png" },
      { url: "/assets/icons/favicon-32.png?v=6", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/assets/icons/favicon-48.png?v=6",
    apple: { url: "/assets/icons/favicon-180.png?v=6", sizes: "180x180" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="min-h-screen bg-white antialiased" style={{ fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
        <ClientErrorReporter />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
