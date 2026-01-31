// src/app/layout.tsx
import React from "react";
import type { Metadata } from "next";
import "@/app/globals.css";
import "@/app/(jobs)/jobmatch/_components/_styles/docx-preview.css";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "Careerbot",
  description: "AI-powered resume analysis, ATS score checking, and intelligent job matching.",
  // viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
