"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { ResumeProvider } from "../_components/ResumeContext";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function EnhancerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <ResumeProvider>
        <div className="flex min-h-screen">
          <Header />
          <Sidebar />
          <main
            className="flex-1 mt-14"
            style={{ marginLeft: "var(--sidebar-width, 64px)", transition: "margin 300ms" }}
          >
            {children}
          </main>
        </div>
      </ResumeProvider>
    </DashboardProvider>
  );
}
