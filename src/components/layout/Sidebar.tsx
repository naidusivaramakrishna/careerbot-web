"use client";

import { useState, useEffect, useRef } from "react";
import { FaUser, FaRegUser, FaCog } from "react-icons/fa";
import { RiFileEditFill, RiFileEditLine } from "react-icons/ri";
import Image from "next/image";
import { Wand2, LogOut, MessageSquare } from "lucide-react";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { MdOutlineWork } from "react-icons/md";
import { useRouter, usePathname } from "next/navigation";
import { getProfile, getProfilePicture, UserProfile } from "@/api/userApi";
import { signOut } from "@/api/authApi";
import { toast } from "sonner";
import axios from "axios";

const navItems = [
  { id: "profile", icon: "profile_icon", label: "Profile", path: "/dashboard/profile" },
  { id: "resume", icon: "resume_icon", label: "Resume", path: "/builder" },

  // ATS Login Page (Updated)
  {
    id: "ats",
    icon: "ats_scan",
    label: "ATS Scan",
    path: "/atslogin",
  },

  // Enhancer
  {
    id: "enhancer",
    icon: <Wand2 size={24} />,
    label: "Enhancer",
    path: "/enhancer",
  },

  { id: "jd_match", icon: <FaArrowRightArrowLeft size={24} />, label: "Job Match", path: "/jobmatch" },
  { id: "jobs", icon: <MdOutlineWork size={24} />, label: "Jobs", path: "/jobs" },
  {
    id: "communication",
    icon: <MessageSquare size={24} />,
    label: "Comm.",
    path: "/communication"
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState("profile");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect current page with better path matching
  useEffect(() => {
    const current = navItems.find((item) => {
      // Handle root path separately
      if (item.path === "/" && pathname !== item.path) {
        return false;
      }
      // Check if current pathname starts with the item path
      return pathname.startsWith(item.path);
    });

    if (current) setActive(current.id);
    else if (pathname === "/settings") setActive("settings");
  }, [pathname]);

  // Outside click: close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        setUserProfile(profile);
        // Fetch profile picture
        const picRes = await getProfilePicture();
        if (picRes?.picture_url) {
          const fullUrl = picRes.picture_url.startsWith("http")
            ? picRes.picture_url
            : `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000'}${picRes.picture_url}`;
          setProfilePicUrl(fullUrl);
        }
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          if ([401, 403].includes(error.response?.status ?? 0)) {
            // ✅ Backend clears httpOnly cookies automatically
            // ❌ No manual localStorage cleanup needed
            toast.error("Session expired. Please login again.");
            // router.push("/signup");
          } else {
            // toast.error("Failed to load profile image.");
          }
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();

    const handleTokenUpdate = () => {
      fetchProfile();
    };

    // Listen for profile picture updates from MainSection
    const handleProfilePictureUpdate = (event: CustomEvent) => {
      const newPicUrl = event.detail?.profilePicUrl;
      if (newPicUrl !== undefined) {
        setProfilePicUrl(newPicUrl);
      }
    };

    window.addEventListener('tokenUpdated', handleTokenUpdate);
    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);

    return () => {
      window.removeEventListener('tokenUpdated', handleTokenUpdate);
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener);
    };
  }, [router]);

  const handleNavigation = (path: string, id: string) => {
    setActive(id);

    if (id === "resume") router.push("/builder/start");
    else router.push(path);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setShowProfileDropdown(false);

    try {
      await signOut();

      // Clear state
      setUserProfile(null);
      toast.success("Logged out successfully");
      // Note: signOut() already redirects to "/"
    } catch {
      toast.error("Logout failed.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Dynamic icon renderer with hover support
  const renderIcon = (item: typeof navItems[0]) => {
    const isActive = active === item.id;
    const isHovered = hoveredItem === item.id;

    // Profile icon - filled when active, outline when inactive
    if (item.icon === "profile_icon") {
      return isActive || isHovered ? (
        <FaUser size={24} />
      ) : (
        <FaRegUser size={24} />
      );
    }

    // Resume icon - filled when active, outline when inactive
    if (item.icon === "resume_icon") {
      return isActive || isHovered ? (
        <RiFileEditFill size={24} />
      ) : (
        <RiFileEditLine size={24} />
      );
    }

    // ATS icon
    if (item.icon === "ats_scan") {
      return (
        <Image
          src={
            isActive
              ? "/assets/icons/ATS_Scan_Selected.svg"
              : "/assets/icons/ATS_Scan.svg"
          }
          alt="ATS Icon"
          width={22}
          height={22}
          className={
            isActive || isHovered
              ? "brightness-0 saturate-100 transition-all duration-200"
              : "transition-all duration-200"
          }
          style={
            isActive || isHovered
              ? {
                filter:
                  "invert(26%) sepia(88%) saturate(1567%) hue-rotate(197deg) brightness(91%) contrast(91%)",
              }
              : {}
          }
        />
      );
    }

    return item.icon;
  };

  const displayName = userProfile?.full_name || userProfile?.username || "User";
  const displayEmail = userProfile?.email || "No email";
  const displayInitial = displayName?.[0]?.toUpperCase() || "U";

  return (
    <div className="fixed top-0 left-0 bottom-0 w-20 bg-white flex flex-col items-center z-50 shadow-sm">

      {/* Logo */}
      <div className="py-4">
        <Image
          src="/assets/icons/image.svg"
          alt="Logo"
          width={55}
          height={55}
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-1 w-full px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path, item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`flex flex-col items-center justify-center py-2  w-full rounded-lg transition-all ${active === item.id
                ? "bg-[#e8eff9] text-[#2557a7]"
                : "text-gray-600 hover:text-[#2557a7] hover:bg-gray-50"
              }`}
          >
            <div>
              {renderIcon(item)}
            </div>
            <span
              className={`text-[10px] font-medium transition-colors duration-200 ${active === item.id || hoveredItem === item.id
                  ? "text-[#2557a7]"
                  : "text-gray-800"
                }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Settings + Profile */}
      <div className="mt-auto flex flex-col items-center gap-2 pb-4 w-full px-1">

        {/* Settings */}
        <button
          onClick={() => handleNavigation("/settings", "settings")}
          onMouseEnter={() => setHoveredItem("settings")}
          onMouseLeave={() => setHoveredItem(null)}
          className={`flex flex-col items-center justify-center gap-1 py-3 px-2 w-full rounded-lg transition-all ${active === "settings"
              ? "bg-[#e8eff9] text-[#2557a7]"
              : "text-gray-600 hover:text-[#2557a7] hover:bg-gray-50"
            }`}
        >
          <FaCog size={24} />
          <span
            className={`text-[10px] font-medium transition-colors duration-200 ${active === "settings" || hoveredItem === "settings"
                ? "text-[#2557a7]"
                : "text-gray-800"
              }`}
          >
            Settings
          </span>
        </button>

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full hover:opacity-90 transition"
          >
            {isLoadingProfile ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : profilePicUrl ? (
              <Image
                src={profilePicUrl}
                alt="Profile"
                width={48}
                height={48}
                className="object-cover w-full h-full cursor-pointer rounded-full"
              />
            ) : (
                <span className="text-white font-bold text-sm">{displayInitial}</span>
              )}
          </button>

          {showProfileDropdown && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs">{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
