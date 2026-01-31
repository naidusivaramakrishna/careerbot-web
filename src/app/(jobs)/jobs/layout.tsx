// import LeftSidebar from "./_components/LeftSidebar";

// export default function JobsLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html>
//       <body>
//         <div className="flex min-h-screen bg-[#f5f6fa]">
          
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

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f5f6fa]">
      {/* LEFT SIDEBAR */}
      <aside className="w-[80px] bg-white border-r">
        <Sidebar />
      </aside>

      {/* PAGE CONTENT */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
