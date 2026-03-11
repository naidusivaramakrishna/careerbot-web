"use client";

import Footer from "@/app/Footer/page";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardProvider>
            <div className="flex">
                <div className="fixed top-0 left-0 h-full transition-all duration-300" style={{ width: 'var(--sidebar-width, 64px)' }}>
                    <Sidebar />
                </div>
                <div className="flex-1 transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 64px)' }}>
                    <Header />
                    <div className="mt-15">
                        {children}
                    </div>
                    <Footer />
                </div>
            </div>
        </DashboardProvider>
    );
}
 
