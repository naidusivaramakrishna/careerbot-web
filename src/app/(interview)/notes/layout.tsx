"use client";

import NotesSidebar from "./_components/NotesSidebar";
import { MockInterviewProvider } from "@/app/(interview)/mock-interview/_context/MockInterviewContext";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <MockInterviewProvider>
      <div className={`${montserrat.variable} antialiased font-(family-name:--font-montserrat) min-h-screen bg-gray-50`}>
        <div className="flex flex-col min-h-screen">
          <NotesSidebar />
          <div className="flex-1 overflow-auto min-w-0">
            {children}
          </div>
        </div>
      </div>
    </MockInterviewProvider>
  );
}
