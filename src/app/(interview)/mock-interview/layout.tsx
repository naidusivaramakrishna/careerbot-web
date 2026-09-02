"use client";

import MockSidebar from "./_components/MockSidebar";
import { MockInterviewProvider } from "./_context/MockInterviewContext";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export default function MockInterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MockInterviewProvider>
      <div className={`${inter.variable} antialiased font-(family-name:--font-inter) h-screen overflow-hidden bg-gray-50`}>
        <div className="flex h-full">
          <MockSidebar />
          <div className="flex-1 min-h-0 overflow-auto min-w-0">
            {children}
          </div>
        </div>
      </div>
    </MockInterviewProvider>
  );
}
