"use client";
import "../../../globals.css";
import { ResumeProvider } from "./_context/ResumeContext";
import { ScoreProvider } from "./_context/ScoreContext";
import Sidebar from "../../../../components/layout/Sidebar";
import Header from "../../../../components/layout/Header";
import { Montserrat } from "next/font/google";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const [resumeId, setResumeId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Get resumeId from URL params if available (dynamic route)
    if (params?.resumeId && typeof params.resumeId === 'string') {
      setResumeId(params.resumeId);
      // Store in localStorage for consistency
      localStorage.setItem("current_resume_id", params.resumeId);
    }
    // Fallback to localStorage for static route
    else if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem("current_resume_id");
      if (storedId && storedId !== 'null' && storedId !== 'undefined') {
        setResumeId(storedId);
      }
    }
  }, [params, pathname]);

  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased font-montserrat`}>
        <ResumeProvider resumeId={resumeId}>
          <ScoreProvider>
            <Header />
            <div className="flex pt-13 bg-blue-100 ">
              <Sidebar />
              <div className="flex-1 ml-20 overflow-auto">{children}</div>
            </div>
          </ScoreProvider>
        </ResumeProvider>
      </body>
    </html>
  );
}
