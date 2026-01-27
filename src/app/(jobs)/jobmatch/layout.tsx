"use client";

import Sidebar from "@/components/layout/Sidebar";

export default function JobMatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-20">
        {children}
      </main>
    </div>
  );
}
