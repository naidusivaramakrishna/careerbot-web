import type { Metadata } from "next";
import AdminHeader from "./header/page";
import AdminSidebar from "../_components/AdminSidebar";

export const metadata: Metadata = {
    title: "Admin Dashboard",
    description: "Careerbot Admin Dashboard",
};

export default function AdminDashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div className="flex gap-2 ">
                <div className="fixed border-r border-[#E5E7EB] top-0 left-0  h-full transition-all duration-300 w-60">
                    <AdminSidebar />
                </div>
                <div className={`flex-1 ml-60`}>
                    <AdminHeader />
                    <div className="min-h-screen bg-gray-100 p-8">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}
