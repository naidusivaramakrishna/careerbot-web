"use client";

import Footer from "@/app/Footer/page";
import Sidebar from "@/components/layout/Sidebar";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    // Hide header/footer for auth pages
    const hideLayout =
        pathname.startsWith("/signup") ||
        pathname.startsWith("/auth");
    return (
        <>
            <div className="flex gap-2 ">
                <div className="fixed top-0 left-0  h-full transition-all duration-300 w-22">
                    <Sidebar/>
                </div>
                <div className={`flex-1 transition-all duration-300 pt-6 ml-22`}>
                    {children}
                    {!hideLayout && <Footer />}
                </div>
            </div>
        </>
    );
}
