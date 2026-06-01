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




import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
