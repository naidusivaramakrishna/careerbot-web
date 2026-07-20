// import LeftSidebar from "./_components/LeftSidebar";

// export default function JobsLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html>
//       <body>
//         <div className="flex min-h-screen bg-[#f5f6f7]">
          
//           {/* LEFT SIDEBAR */}
//           <aside className="w-[72px] bg-white border-r">
//             <LeftSidebar />
//           </aside>

//           {/* PAGE CONTENT */}
//           <main className="flex-1">
//             {children}
//           </main>

//         </div>
//       </body>
//     </html>
//   );
// }




"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // The Jobs marketing home page (/jobs) is public and renders its own
  // header/footer — same pattern as /ats and /jobmatch. Every other route
  // under /jobs (search, tracking, applications) is the authenticated
  // app tool and keeps the Sidebar/Header chrome.
  if (pathname === "/jobs") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6f7]" style={{ "--header-h": "56px" } as React.CSSProperties}>
      {/* LEFT SIDEBAR */}
      <aside
        className="shrink-0 bg-white transition-[width] duration-300"
        style={{ width: "var(--sidebar-width, 64px)" }}
      >
        <Sidebar />
      </aside>

      {/* PAGE CONTENT */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1" style={{ paddingTop: "var(--header-h)" }}>{children}</main>
      </div>
    </div>
  );
}
