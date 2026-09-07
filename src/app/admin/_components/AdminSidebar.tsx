"use client"
import { adminLogout, getCurrentAdmin } from '@/api/adminAuthApi';
import { getAdminRoleCache, setAdminRoleCache } from '../_hooks/adminRoleCache';
import type { AdminRole } from '../_utils/permissions';
import { Activity, BarChart3, Building2, DollarSign, Gauge, LayoutDashboard, LogOut, Settings, UserPlus, UserRoundPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

// A PLATFORM ADMIN RUNS THE COLLEGES AND SEES NO MONEY.
//
// `hideFor` lists the roles that must not see an item. Hiding, not disabling:
// a greyed-out "AI spend" still tells the person that revenue lives behind it,
// and the point of the role is that the estate can be delegated without
// exposing what the business earns.
//
// Roles here are UPPER CASE because that is what useAdminAccess stores after
// normalising -- comparing against the lower-case wire value silently matches
// nothing, which is how this hid nothing at all the first time.
//
// This is presentation only. Every one of these pages is enforced server-side
// by require_permissions(), and a platform admin who types the URL is refused
// with a 403 whatever this array says. Never treat it as the control.
const menu = [
    { label: "College overview", href: "/admin/dashboard/colleges/overview", icon: LayoutDashboard, hideFor: [] as string[] },
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, hideFor: ["PLATFORM_ADMIN"] },
    { label: "User Management", href: "/admin/dashboard/user-management", icon: Users, hideFor: ["PLATFORM_ADMIN"] },
    { label: "Admin Management", href: "/admin/dashboard/admin-management", icon: UserPlus, hideFor: ["PLATFORM_ADMIN"] },
    { label: "System Monitoring", href: "/admin/dashboard/system-monitoring", icon: Activity, hideFor: [] as string[] },
    { label: "Colleges", href: "/admin/dashboard/colleges", icon: Building2, hideFor: [] as string[] },
    { label: "Onboarding", href: "/admin/dashboard/colleges/onboarding", icon: UserRoundPlus, hideFor: [] as string[] },
    { label: "Reports", href: "/admin/dashboard/colleges/reports", icon: BarChart3, hideFor: [] as string[] },
    { label: "AI spend", href: "/admin/dashboard/ai-spend", icon: DollarSign, hideFor: ["PLATFORM_ADMIN"] },
    // VISIBLE TO A PLATFORM ADMIN, unlike "AI spend" directly above. This one
    // shows tokens and call counts with every cost field stripped server-side,
    // which is what lets the role police usage without seeing the cost base.
    { label: "AI usage", href: "/admin/dashboard/ai-usage", icon: Gauge, hideFor: [] as string[] },
    { label: "Settings", href: "/admin/dashboard/settings", icon: Settings, hideFor: ["PLATFORM_ADMIN"] },
];


const AdminSidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    // THE ROLE LIVES IN adminRoleCache, NOT sessionStorage.
    //
    // An earlier version of this read sessionStorage.getItem('admin_role'),
    // which is never written -- the cache is a module-level variable so it
    // cannot be edited from DevTools. The read returned null on every load, so
    // `role` stayed null and NOTHING was ever hidden: a platform admin saw AI
    // spend, User Management, Admin Management and Settings in the menu. The
    // pages themselves still refused, but the menu advertised them.
    //
    // Resolved after mount, never during render: the server has no cache, and
    // deciding the menu during render would make the first client paint
    // disagree with the server HTML. Until it resolves nothing is hidden,
    // which is the safe direction -- the server is the actual control.
    useEffect(() => {
        let alive = true;
        const cached = getAdminRoleCache();
        if (cached) { setRole(cached.role); return; }
        void (async () => {
            try {
                const admin = await getCurrentAdmin();
                if (!alive || !admin?.role) return;
                const normalised = admin.role.toUpperCase() as AdminRole;
                setAdminRoleCache(normalised);
                setRole(normalised);
            } catch { /* not signed in yet, or offline: hide nothing */ }
        })();
        return () => { alive = false; };
    }, []);

    const visible = menu.filter((item) => !(role && item.hideFor.includes(role)));

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        try {
            await adminLogout();
            // The adminLogout function already handles redirect to /admin/login
        } catch {
            // Even if the API call fails, clear session cache and redirect
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('admin_role');
                sessionStorage.removeItem('admin_role_at');
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
                    {visible.map((item, idx) => {
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
