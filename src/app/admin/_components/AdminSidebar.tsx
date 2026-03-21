"use client"
import { adminLogout } from '@/api/adminAuthApi';
import { Activity, Briefcase, LayoutDashboard, LogOut, Settings, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react'

const menu = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/dashboard/user-management", icon: Users },
    { label: "Admin Management", href: "/admin/dashboard/admin-management", icon: UserPlus },
    { label: "Job Management", href: "/admin/dashboard/job-management", icon: Briefcase },
    { label: "System Monitoring", href: "/admin/dashboard/system-monitoring", icon: Activity },
    { label: "Settings", href: "/admin/dashboard/settings", icon: Settings },
];


const AdminSidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        try {
            await adminLogout();
            // The adminLogout function already handles redirect to /admin/login
        } catch {
            // Even if the API call fails, still clear local data and redirect
            if (typeof window !== 'undefined') {
                localStorage.removeItem('admin_access_token');
                localStorage.removeItem('admin_refresh_token');
                localStorage.removeItem('admin_id');
                localStorage.removeItem('admin_role');
                router.push('/admin/login');
            }
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <h1 className='font-semibold p-4 border-b border-[#E5E7EB] text-gray-800'>
                Admin Portal
            </h1>

            {/* Main flex container to push logout to bottom */}
            <div className="flex flex-col justify-between flex-1">
                <nav className="flex flex-col mt-4 gap-1 px-2">
                    {menu.map((item, idx) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
                                    ${active
                                        ? "bg-[#E9F2FF] text-[#004FFF] font-medium"
                                        : "text-gray-600 hover:text-[#2557a7] hover:bg-gray-50"
                                    }`}
                            >
                                {active && (
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-1.5 bg-[#004FFF] rounded-full shadow-[0_0_8px_0_#155DFC]" />
                                )}
                                <Icon className="w-4 h-4 shrink-0" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout sticks to the bottom now */}
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className='flex items-center gap-3 text-[#E7000B] text-sm px-5 py-4 cursor-pointer mb-12 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
