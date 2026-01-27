"use client";

import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import { ResumeProvider } from "./_components/ResumeContext";

export default function EnhancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResumeProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-15">{children}</main>
      </div>
    </ResumeProvider>
  );
}