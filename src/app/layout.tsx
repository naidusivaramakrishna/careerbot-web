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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
