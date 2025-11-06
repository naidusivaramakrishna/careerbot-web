"use client"
import { Briefcase, ScanLine, LogOut, ArrowLeftRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { signOut } from "@/api/authApi";
import { getProfile, UserProfile } from "@/api/userApi";
import { toast } from "sonner";
import { FaRegUser } from "react-icons/fa6";
import { FiFileText } from "react-icons/fi";
import { RiRobot2Fill } from "react-icons/ri";
const menu = [
    { label: "Profile", href: "/dashboard/profile", icon: FaRegUser },
    { label: "Resume", href: "/dashboard/resume", icon: FiFileText },
    { label: "ATS Scan", href: "/dashboard/atsscan", icon: ScanLine },
    { label: "Job Match", href: "/dashboard/job-match", icon: ArrowLeftRight },
    { label: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
];

const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [showIconOnHover, setShowIconOnHover] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Check authentication status and fetch profile
    useEffect(() => {
        const checkAuthAndFetchProfile = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                console.log('❌ No token found');
                setIsLoggedIn(false);
                setIsLoadingProfile(false);
                return;
            }

            setIsLoggedIn(true);

            try {
                // Fetch user profile
                const profile = await getProfile();
                console.log('✅ Profile fetched successfully:', profile);
                setUserProfile(profile);

                // Store username in localStorage for quick access
                if (profile.username) {
                    localStorage.setItem('username', profile.username);
                }
            } catch (error: any) {
                console.error('❌ Failed to fetch profile:', error);

                // If it's an authentication error, clear tokens and redirect
                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('username');
                    setIsLoggedIn(false);
                    toast.error('Session expired. Please login again.');
                    router.push('/signup');
                } else {
                    toast.error('Failed to load profile. Please refresh the page.');
                }
            } finally {
                setIsLoadingProfile(false);
            }
        };

        checkAuthAndFetchProfile();

        // Listen for storage changes (when token is updated in another tab or after OAuth)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token' || e.key === null) {
                console.log('🔄 Token changed, refetching profile...');
                checkAuthAndFetchProfile();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also listen for custom event for same-tab token updates
        const handleTokenUpdate = () => {
            console.log('🔄 Token updated event received, refetching profile...');
            checkAuthAndFetchProfile();
        };

        window.addEventListener('tokenUpdated', handleTokenUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('tokenUpdated', handleTokenUpdate);
        };
    }, [router]);


    const handleLogout = async () => {
        if (isLoggingOut) return;
        try {
            setIsLoggingOut(true);

            // Call backend signout
            await signOut();

            // Clear state
            setIsLoggedIn(false);
            setUserProfile(null);
            toast.success('Logged out successfully');

            // Redirect to signup page
            router.push('/');
        } catch (error) {
            console.error('❌ Logout error:', error);
            toast.error('Failed to logout. Please try again.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div
            className={`bg-white p-4 h-screen flex flex-col justify-between transition-all duration-300`}
        >
            {/* Top Section */}
            <div>
                <div
                    className="flex items-center justify-between py-4 relative"
                >
                    <div className="flex items-center gap-4 relative w-full">
                        <div
                            className={`flex items-center gap-4 transition-opacity duration-300 
                                }`}
                        >
                            <div className="rounded-sm mb-8">
                                <RiRobot2Fill size={50} className="text-[#2557a7]" />
                            </div>
                            {/* <h1 className="text-2xl font-bold cursor-pointer whitespace-nowrap">
                                CareerBot
                            </h1> */}
                        </div>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex flex-col mt-6 gap-1">
                    {menu.map((item, idx) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                className={`group flex flex-col items-center gap-3 px-3 py-2 rounded-lg text-base transition
                  ${active ? "bg-[#e8eff9] text-[#2557a7]" : " text-gray-600 hover:text-[#2557a7]"}`}
                            >
                                <Icon className="w-6 h-6 shrink-0" />
                                <span className="text-xs">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="flex flex-col gap-2">
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut || !isLoggedIn}
                    className="flex flex-col items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-base hover:bg-red-100 hover:text-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <LogOut className="w-6 h-6" />
                    <span className="text-xs">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3 border-t pt-4">
                    {/* Profile Picture */}
                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-[#2200FF] overflow-hidden shrink-0">
                        {isLoadingProfile ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <span className="text-white font-bold text-lg">
                                {userProfile?.full_name?.[0]?.toUpperCase() ||
                                    userProfile?.username?.[0]?.toUpperCase() ||
                                    userProfile?.email?.[0]?.toUpperCase() ||
                                    'U'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;





