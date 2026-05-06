// import "../../../globals.css";
// import Sidebar from "../../../../components/layout/Sidebar";
// import Header from "../../../../components/layout/Header";
// import { Montserrat } from "next/font/google";

// const montserrat = Montserrat({
//   variable: "--font-montserrat",
//   subsets: ["latin"],
//   weight: ["400", "500", "700", "900"],
// });

// export default function ResumeLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body className="antialiased font-montserrat">
//         <Header />
//         <div className="flex pt-14 bg-white min-h-screen">
//           <Sidebar />
//           <div className="flex-1 ml-60 overflow-auto">{children}</div>
//         </div>
//       </body>
//     </html>
//   );
// }


"use client";

import "../../../globals.css";
import Sidebar from "../../../../components/layout/Sidebar";
import Header from "../../../../components/layout/Header";
import { ResumeProvider } from "../creation/_context/ResumeContext";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function ResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DashboardProvider>
          <Header />
          <div className="flex pt-14 bg-white min-h-screen">
            <Sidebar />
            <div className="flex-1 overflow-auto" style={{ marginLeft: "var(--sidebar-width, 64px)", transition: "margin 300ms" }}>
              <ResumeProvider>
                {children}
              </ResumeProvider>
            </div>
          </div>
        </DashboardProvider>
      </body>
    </html>
  );
}

