// "use client";

// import Footer from "@/app/Footer/page";
// import Sidebar from "@/components/layout/Sidebar";
// import { usePathname } from "next/navigation";
// import { useState } from "react";

// export default function ClientLayout({
//     children,
// }: {
//     children: React.ReactNode;
// }) {
//     const pathname = usePathname();
//     // Hide header/footer for auth pages
//     const hideLayout =
//         pathname.startsWith("/signup") ||
//         pathname.startsWith("/auth");
//     return (
//         <>
//             <div className="flex gap-2 ">
//                 <div className="fixed top-0 left-0  h-full transition-all duration-300 w-22">
//                     <Sidebar/>
//                 </div>
//                 <div className={`flex-1 transition-all duration-300 pt-6 ml-22`}>
//                     {children}
//                     {!hideLayout && <Footer />}
//                 </div>
//             </div>
//         </>
//     );
// }


// "use client";

// import Footer from "@/app/Footer/page";
// import Sidebar from "@/components/layout/Sidebar";
// import Header from "@/components/layout/Header";
// import { usePathname } from "next/navigation";

// export default function ClientLayout({
//     children,
// }: {
//     children: React.ReactNode;
// }) {
//     const pathname = usePathname();
    
//     // Hide header/footer for auth pages
//     const hideLayout =
//         pathname.startsWith("/signup") ||
//         pathname.startsWith("/auth");

//     return (
//         <>
//             {/* Header - Fixed at top, hidden for auth pages */}
//             {!hideLayout && <Header />}
            
//             <div className="flex ">
//                 {/* Sidebar - Fixed at left, hidden for auth pages */}
//                 {!hideLayout && (
//                     <div className="flex-1 overflow-auto">
//                         <Sidebar />
//                     </div>
//                 )}
                
//                 {/* Main Content Area */}
//                 <div 
//                     className={` transition-all duration-300 ${
//                         !hideLayout ? "ml-22 pt-20" : ""
//                     }`}
//                 >
//                     {children}
//                     {!hideLayout && <Footer />}
//                 </div>
//             </div>
//         </>
//     );
// } before issue



"use client";
 
import Footer from "@/app/Footer/page";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
 
export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <div className="flex gap-2 ">
                <div className="fixed top-0 left-0  h-full transition-all duration-300 w-20">
                    <Sidebar />
                </div>
                <div className={`flex-1 transition-all duration-300  ml-25`}>
                    <Header />
                    <div className="mt-15">
                        {children}
                    </div>
                    <Footer />
                </div>
            </div>
        </>
    );
}
 
