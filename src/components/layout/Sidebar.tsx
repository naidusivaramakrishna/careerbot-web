// "use client"
// import { Briefcase, ScanLine, LogOut, ArrowLeftRight } from "lucide-react";
// import Image from "next/image";
// import Link from "next/link";
// import { usePathname, useRouter } from "next/navigation";
// import React, { useState, useEffect } from "react";
// import { signOut } from "@/api/authApi";
// import { getProfile, UserProfile } from "@/api/userApi";
// import { toast } from "sonner";
// import { FaRegUser } from "react-icons/fa6";
// import { FiFileText } from "react-icons/fi";
// import { RiRobot2Fill } from "react-icons/ri";
// const menu = [
//     { label: "Profile", href: "/dashboard/profile", icon: FaRegUser },
//     { label: "Resume", href: "/dashboard/resume", icon: FiFileText },
//     { label: "ATS Scan", href: "/dashboard/atsscan", icon: ScanLine },
//     { label: "Job Match", href: "/dashboard/job-match", icon: ArrowLeftRight },
//     { label: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
// ];

// const Sidebar = () => {
//     const pathname = usePathname();
//     const router = useRouter();
//     const [showIconOnHover, setShowIconOnHover] = useState(false);
//     const [isLoggedIn, setIsLoggedIn] = useState(false);
//     const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//     const [isLoggingOut, setIsLoggingOut] = useState(false);
//     const [isLoadingProfile, setIsLoadingProfile] = useState(true);

//     // Check authentication status and fetch profile
//     useEffect(() => {
//         const checkAuthAndFetchProfile = async () => {
//             const token = localStorage.getItem('access_token');
//             if (!token) {
//                 console.log('❌ No token found');
//                 setIsLoggedIn(false);
//                 setIsLoadingProfile(false);
//                 return;
//             }

//             setIsLoggedIn(true);

//             try {
//                 // Fetch user profile
//                 const profile = await getProfile();
//                 console.log('✅ Profile fetched successfully:', profile);
//                 setUserProfile(profile);

//                 // Store username in localStorage for quick access
//                 if (profile.username) {
//                     localStorage.setItem('username', profile.username);
//                 }
//             } catch (error: any) {
//                 console.error('❌ Failed to fetch profile:', error);

//                 // If it's an authentication error, clear tokens and redirect
//                 if (error.response?.status === 401 || error.response?.status === 403) {
//                     localStorage.removeItem('access_token');
//                     localStorage.removeItem('refresh_token');
//                     localStorage.removeItem('username');
//                     setIsLoggedIn(false);
//                     toast.error('Session expired. Please login again.');
//                     router.push('/signup');
//                 } else {
//                     toast.error('Failed to load profile. Please refresh the page.');
//                 }
//             } finally {
//                 setIsLoadingProfile(false);
//             }
//         };

//         checkAuthAndFetchProfile();

//         // Listen for storage changes (when token is updated in another tab or after OAuth)
//         const handleStorageChange = (e: StorageEvent) => {
//             if (e.key === 'access_token' || e.key === null) {
//                 console.log('🔄 Token changed, refetching profile...');
//                 checkAuthAndFetchProfile();
//             }
//         };

//         window.addEventListener('storage', handleStorageChange);

//         // Also listen for custom event for same-tab token updates
//         const handleTokenUpdate = () => {
//             console.log('🔄 Token updated event received, refetching profile...');
//             checkAuthAndFetchProfile();
//         };

//         window.addEventListener('tokenUpdated', handleTokenUpdate);

//         return () => {
//             window.removeEventListener('storage', handleStorageChange);
//             window.removeEventListener('tokenUpdated', handleTokenUpdate);
//         };
//     }, [router]);


//     const handleLogout = async () => {
//         if (isLoggingOut) return;
//         try {
//             setIsLoggingOut(true);

//             // Call backend signout
//             await signOut();

//             // Clear state
//             setIsLoggedIn(false);
//             setUserProfile(null);
//             toast.success('Logged out successfully');

//             // Redirect to signup page
//             router.push('/');
//         } catch (error) {
//             console.error('❌ Logout error:', error);
//             toast.error('Failed to logout. Please try again.');
//         } finally {
//             setIsLoggingOut(false);
//         }
//     };

//     return (
//         <div
//             className={`bg-white p-4 h-screen flex flex-col justify-between transition-all duration-300`}
//         >
//             {/* Top Section */}
//             <div>
//                 <div
//                     className="flex items-center justify-between py-4 relative"
//                 >
//                     <div className="flex items-center gap-4 relative w-full">
//                         <div
//                             className={`flex items-center gap-4 transition-opacity duration-300 
//                                 }`}
//                         >
//                             <div className="rounded-sm mb-8">
//                                 <RiRobot2Fill size={50} className="text-[#2557a7]" />
//                             </div>
//                             {/* <h1 className="text-2xl font-bold cursor-pointer whitespace-nowrap">
//                                 CareerBot
//                             </h1> */}
//                         </div>
//                     </div>
//                 </div>

//                 {/* Menu */}
//                 <nav className="flex flex-col mt-6 gap-1">
//                     {menu.map((item, idx) => {
//                         const Icon = item.icon;
//                         const active = pathname === item.href;
//                         return (
//                             <Link
//                                 key={idx}
//                                 href={item.href}
//                                 className={`group flex flex-col items-center gap-3 px-3 py-2 rounded-lg text-base transition
//                   ${active ? "bg-[#e8eff9] text-[#2557a7]" : " text-gray-600 hover:text-[#2557a7]"}`}
//                             >
//                                 <Icon className="w-4 h-4 shrink-0" />
//                                 <span className="text-xs">{item.label}</span>
//                             </Link>
//                         );
//                     })}
//                 </nav>
//             </div>

//             <div className="flex flex-col gap-2">
//                 {/* Logout Button */}
//                 <button
//                     onClick={handleLogout}
//                     disabled={isLoggingOut || !isLoggedIn}
//                     className="flex flex-col items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-base hover:bg-red-100 hover:text-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                     <LogOut className="w-4 h-4" />
//                     <span className="text-xs">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
//                 </button>

//                 {/* User Profile */}
//                 <div className="flex items-center gap-3 border-t pt-4">
//                     {/* Profile Picture */}
//                     <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-[#2200FF] overflow-hidden shrink-0">
//                         {isLoadingProfile ? (
//                             <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                         ) : (
//                             <span className="text-white font-bold text-sm">
//                                 {userProfile?.full_name?.[0]?.toUpperCase() ||
//                                     userProfile?.username?.[0]?.toUpperCase() ||
//                                     userProfile?.email?.[0]?.toUpperCase() ||
//                                     'U'}
//                             </span>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Sidebar;





// "use client";
// import { useState, useEffect } from "react";
// import { FaUser, FaCog } from "react-icons/fa";
// import { RiRobot2Fill, RiFileEditFill } from "react-icons/ri";
// import Image from "next/image";
// import { FaArrowRightArrowLeft } from "react-icons/fa6";
// import { MdOutlineWork } from "react-icons/md";
// import { useRouter } from "next/navigation";
// import { getProfile, UserProfile } from "@/api/userApi";
// import { toast } from "sonner";

// const navItems = [
//   { id: "profile", icon: <FaUser />, label: "Profile", path: "/dashboard/profile" },
//   { id: "resume", icon: <RiFileEditFill />, label: "Resume", path: "/dashboard/resume" },
//   {
//     id: "ats",
//     icon: (
//       <Image
//         src="/assets/icons/ATS_Scan.svg"
//         alt="ATS Icon"
//         width={20}
//         height={20}
//         className="text-[#2557a7]"
//       />
//     ),
//     label: "ATS Scan",
//     path: "/ats",
//   },
//   { id: "jd_match", icon: <FaArrowRightArrowLeft />, label: "Job Match", path: "/job-match" },
//   { id: "jobs", icon: <MdOutlineWork />, label: "Jobs", path: "/jobs" },
// ];

// export default function Sidebar() {
//   const router = useRouter();
//   const [active, setActive] = useState("profile");
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [isLoadingProfile, setIsLoadingProfile] = useState(true);

//   // Check authentication status and fetch profile
//   useEffect(() => {
//     const checkAuthAndFetchProfile = async () => {
//       const token = localStorage.getItem('access_token');
//       if (!token) {
//         console.log('❌ No token found');
//         setIsLoggedIn(false);
//         setIsLoadingProfile(false);
//         return;
//       }

//       setIsLoggedIn(true);

//       try {
//         // Fetch user profile
//         const profile = await getProfile();
//         console.log('✅ Profile fetched successfully:', profile);
//         setUserProfile(profile);

//         // Store username in localStorage for quick access
//         if (profile.username) {
//           localStorage.setItem('username', profile.username);
//         }
//       } catch (error: any) {
//         console.error('❌ Failed to fetch profile:', error);

//         // If it's an authentication error, clear tokens and redirect
//         if (error.response?.status === 401 || error.response?.status === 403) {
//           localStorage.removeItem('access_token');
//           localStorage.removeItem('refresh_token');
//           localStorage.removeItem('username');
//           setIsLoggedIn(false);
//           toast.error('Session expired. Please login again.');
//           router.push('/signup');
//         } else {
//           toast.error('Failed to load profile. Please refresh the page.');
//         }
//       } finally {
//         setIsLoadingProfile(false);
//       }
//     };

//     checkAuthAndFetchProfile();

//     // Listen for storage changes (when token is updated in another tab or after OAuth)
//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === 'access_token' || e.key === null) {
//         console.log('🔄 Token changed, refetching profile...');
//         checkAuthAndFetchProfile();
//       }
//     };

//     window.addEventListener('storage', handleStorageChange);

//     // Also listen for custom event for same-tab token updates
//     const handleTokenUpdate = () => {
//       console.log('🔄 Token updated event received, refetching profile...');
//       checkAuthAndFetchProfile();
//     };

//     window.addEventListener('tokenUpdated', handleTokenUpdate);

//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//       window.removeEventListener('tokenUpdated', handleTokenUpdate);
//     };
//   }, [router]);

//   const handleNavigation = (path: string, id: string) => {
//     setActive(id);
//     router.push(path);
//   };

//   return (
//     <div className="fixed top-0 left-0 right-0 h-screen w-full pointer-events-none">

//       {/* Sidebar */}
//       <div className="absolute top-0 left-0 h-full w-22 bg-white shadow-sm flex flex-col justify-between items-center overflow-visible z-50 pointer-events-auto">
//         {/* Top Section (Logo + Nav) */}
//         <div className="flex flex-col items-center mt-5">
//           {/* Logo */}
//           <div className="rounded-sm mb-8">
//             <RiRobot2Fill size={50} className="text-[#2557a7]" />
//           </div>

//           {/* Navigation Icons */}
//           <nav className="flex flex-col gap-2">
//             {navItems.map((item) => (
//               <button
//                 key={item.id}
//                 onClick={() => handleNavigation(item.path, item.id)}
//                 className={`flex flex-col items-center text-xs p-1 pt-2 pb-2 rounded-lg transition-all ${
//                   active === item.id
//                     ? "bg-[#e8eff9] text-[#2557a7]"
//                     : "text-gray-600 hover:text-[#2557a7]"
//                 }`}
//               >
//                 <div
//                   className={`text-xl ${
//                     active === item.id
//                       ? "fill-[#2557a7]"
//                       : "fill-none stroke-gray-800"
//                   } hover:fill-[#2557a7]`}
//                 >
//                   {item.icon}
//                 </div>
//                 <span
//                   className={`text-xs mt-1 ${
//                     active === item.id ? "text-xs text-[#2557a7]" : "text-gray-800"
//                   } `}
//                 >
//                   {item.label}
//                 </span>
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Bottom Section (Settings + Profile) */}
//         <div className="flex flex-col items-center gap-4 mb-4">
//           {/* Settings Button */}
//           <button
//             onClick={() => handleNavigation("/settings", "settings")}
//             className={`flex flex-col items-center text-xs p-1.5 pt-2 pb-2 rounded-lg transition-all  ${
//               active === "settings"
//                 ? "bg-[#e8eff9] text-[#2557a7]"
//                 : "text-gray-600 hover:text-[#2557a7]"
//             }`}
//           >
//             <div
//               className={`text-xl ${
//                 active === "settings"
//                   ? "fill-[#2557a7]"
//                   : "fill-none stroke-gray-800"
//               } hover:fill-[#2557a7]`}
//             >
//               <FaCog />
//             </div>
//             <span className="mt-1 text-xs text-gray-800">Settings</span>
//           </button>

//           {/* Profile Picture */}
//           <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-[#2557a7] overflow-hidden">
//             {isLoadingProfile ? (
//               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//             ) : (
//               <span className="text-white font-bold text-sm">
//                 {userProfile?.full_name?.[0]?.toUpperCase() ||
//                   userProfile?.username?.[0]?.toUpperCase() ||
//                   userProfile?.email?.[0]?.toUpperCase() ||
//                   'U'}
//               </span>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }




// "use client";
// import { useState, useEffect } from "react";
// import { FaUser, FaCog } from "react-icons/fa";
// import { RiRobot2Fill, RiFileEditFill } from "react-icons/ri";
// import Image from "next/image";
// import { FaArrowRightArrowLeft } from "react-icons/fa6";
// import { MdOutlineWork } from "react-icons/md";
// import { useRouter, usePathname } from "next/navigation";
// import { getProfile, UserProfile } from "@/api/userApi";
// import { toast } from "sonner";

// const navItems = [
//   { id: "profile", icon: <FaUser />, label: "Profile", path: "/dashboard/profile" },
//   { id: "resume", icon: <RiFileEditFill />, label: "Resume", path: "/dashboard/resume" },
//   {
//     id: "ats",
//     icon: (
//       <Image
//         src="/assets/icons/ATS_Scan.svg"
//         alt="ATS Icon"
//         width={20}
//         height={20}
//         className="text-[#2557a7]"
//       />
//     ),
//     label: "ATS Scan",
//     path: "/ats",
//   },
//   { id: "jd_match", icon: <FaArrowRightArrowLeft />, label: "Job Match", path: "/job-match" },
//   { id: "jobs", icon: <MdOutlineWork />, label: "Jobs", path: "/jobs" },
// ];

// export default function Sidebar() {
//   const router = useRouter();
//   const pathname = usePathname(); // ✅ Get current path
//   const [active, setActive] = useState("profile");
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [isLoadingProfile, setIsLoadingProfile] = useState(true);

//   // ✅ Set active state based on current pathname
//   useEffect(() => {
//     const currentNavItem = navItems.find(item => pathname.startsWith(item.path));
//     if (currentNavItem) {
//       setActive(currentNavItem.id);
//     } else if (pathname === "/settings") {
//       setActive("settings");
//     }
//   }, [pathname]);

//   // Check authentication status and fetch profile
//   useEffect(() => {
//     const checkAuthAndFetchProfile = async () => {
//       const token = localStorage.getItem('access_token');
//       if (!token) {
//         console.log('❌ No token found');
//         setIsLoggedIn(false);
//         setIsLoadingProfile(false);
//         return;
//       }

//       setIsLoggedIn(true);

//       try {
//         // Fetch user profile
//         const profile = await getProfile();
//         console.log('✅ Profile fetched successfully:', profile);
//         setUserProfile(profile);

//         // Store username in localStorage for quick access
//         if (profile.username) {
//           localStorage.setItem('username', profile.username);
//         }
//       } catch (error: any) {
//         console.error('❌ Failed to fetch profile:', error);

//         // If it's an authentication error, clear tokens and redirect
//         if (error.response?.status === 401 || error.response?.status === 403) {
//           localStorage.removeItem('access_token');
//           localStorage.removeItem('refresh_token');
//           localStorage.removeItem('username');
//           setIsLoggedIn(false);
//           toast.error('Session expired. Please login again.');
//           router.push('/signup');
//         } else {
//           toast.error('Failed to load profile. Please refresh the page.');
//         }
//       } finally {
//         setIsLoadingProfile(false);
//       }
//     };

//     checkAuthAndFetchProfile();

//     // Listen for storage changes (when token is updated in another tab or after OAuth)
//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === 'access_token' || e.key === null) {
//         console.log('🔄 Token changed, refetching profile...');
//         checkAuthAndFetchProfile();
//       }
//     };

//     window.addEventListener('storage', handleStorageChange);

//     // Also listen for custom event for same-tab token updates
//     const handleTokenUpdate = () => {
//       console.log('🔄 Token updated event received, refetching profile...');
//       checkAuthAndFetchProfile();
//     };

//     window.addEventListener('tokenUpdated', handleTokenUpdate);

//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//       window.removeEventListener('tokenUpdated', handleTokenUpdate);
//     };
//   }, [router]);

//   const handleNavigation = (path: string, id: string) => {
//     setActive(id);
//     router.push(path);
//   };

//   return (
//     <div className="fixed top-0 left-0 right-0 h-screen w-full pointer-events-none">

//       {/* Sidebar */}
//       <div className="absolute top-0 left-0 h-full w-22 bg-white shadow-sm flex flex-col justify-between items-center overflow-visible z-50 pointer-events-auto">
//         {/* Top Section (Logo + Nav) */}
//         <div className="flex flex-col items-center mt-5">
//           {/* Logo */}
//           <div className="rounded-sm mb-8">
//             <RiRobot2Fill size={50} className="text-[#2557a7]" />
//           </div>

//           {/* Navigation Icons */}
//           <nav className="flex flex-col gap-2">
//             {navItems.map((item) => (
//               <button
//                 key={item.id}
//                 onClick={() => handleNavigation(item.path, item.id)}
//                 className={`flex flex-col items-center text-xs p-1 pt-2 pb-2 rounded-lg transition-all ${
//                   active === item.id
//                     ? "bg-[#e8eff9] text-[#2557a7]"
//                     : "text-gray-600 hover:text-[#2557a7]"
//                 }`}
//               >
//                 <div
//                   className={`text-xl ${
//                     active === item.id
//                       ? "fill-[#2557a7]"
//                       : "fill-none stroke-gray-800"
//                   } hover:fill-[#2557a7]`}
//                 >
//                   {item.icon}
//                 </div>
//                 <span
//                   className={`text-xs mt-1 ${
//                     active === item.id ? "text-xs text-[#2557a7]" : "text-gray-800"
//                   } `}
//                 >
//                   {item.label}
//                 </span>
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Bottom Section (Settings + Profile) */}
//         <div className="flex flex-col items-center gap-4 mb-4">
//           {/* Settings Button */}
//           <button
//             onClick={() => handleNavigation("/settings", "settings")}
//             className={`flex flex-col items-center text-xs p-1.5 pt-2 pb-2 rounded-lg transition-all  ${
//               active === "settings"
//                 ? "bg-[#e8eff9] text-[#2557a7]"
//                 : "text-gray-600 hover:text-[#2557a7]"
//             }`}
//           >
//             <div
//               className={`text-xl ${
//                 active === "settings"
//                   ? "fill-[#2557a7]"
//                   : "fill-none stroke-gray-800"
//               } hover:fill-[#2557a7]`}
//             >
//               <FaCog />
//             </div>
//             <span className="mt-1 text-xs text-gray-800">Settings</span>
//           </button>

//           {/* Profile Picture */}
//           <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-[#2557a7] overflow-hidden">
//             {isLoadingProfile ? (
//               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//             ) : (
//               <span className="text-white font-bold text-sm">
//                 {userProfile?.full_name?.[0]?.toUpperCase() ||
//                   userProfile?.username?.[0]?.toUpperCase() ||
//                   userProfile?.email?.[0]?.toUpperCase() ||
//                   'U'}
//               </span>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }




// "use client";
// import { useState, useEffect, useRef } from "react";
// import { FaUser, FaCog } from "react-icons/fa";
// import { RiRobot2Fill, RiFileEditFill } from "react-icons/ri";
// import Image from "next/image";
// import { FaArrowRightArrowLeft } from "react-icons/fa6";
// import { MdOutlineWork } from "react-icons/md";
// import { LogOut } from "lucide-react";
// import { useRouter, usePathname } from "next/navigation";
// import { getProfile, UserProfile } from "@/api/userApi";
// import { signOut } from "@/api/authApi";
// import { toast } from "sonner";

// const navItems = [
//   { id: "profile", icon: <FaUser />, label: "Profile", path: "/dashboard/profile" },
//   { id: "resume", icon: <RiFileEditFill />, label: "Resume", path: "/dashboard/resume" },
//   {
//     id: "ats",
//     icon: (
//       <Image
//         src="/assets/icons/ATS_Scan.svg"
//         alt="ATS Icon"
//         width={20}
//         height={20}
//         className="text-[#2557a7]"
//       />
//     ),
//     label: "ATS Scan",
//     path: "/ats",
//   },
//   { id: "jd_match", icon: <FaArrowRightArrowLeft />, label: "Job Match", path: "/job-match" },
//   { id: "jobs", icon: <MdOutlineWork />, label: "Jobs", path: "/jobs" },
// ];

// export default function Sidebar() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [active, setActive] = useState("profile");
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [isLoadingProfile, setIsLoadingProfile] = useState(true);
//   const [isLoggingOut, setIsLoggingOut] = useState(false);
//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Set active state based on current pathname
//   useEffect(() => {
//     const currentNavItem = navItems.find(item => pathname.startsWith(item.path));
//     if (currentNavItem) {
//       setActive(currentNavItem.id);
//     } else if (pathname === "/settings") {
//       setActive("settings");
//     }
//   }, [pathname]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowProfileDropdown(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Check authentication status and fetch profile
//   useEffect(() => {
//     const checkAuthAndFetchProfile = async () => {
//       const token = localStorage.getItem('access_token');
//       if (!token) {
//         console.log('❌ No token found');
//         setIsLoggedIn(false);
//         setIsLoadingProfile(false);
//         return;
//       }

//       setIsLoggedIn(true);

//       try {
//         const profile = await getProfile();
//         console.log('✅ Profile fetched successfully:', profile);
//         setUserProfile(profile);

//         if (profile.username) {
//           localStorage.setItem('username', profile.username);
//         }
//       } catch (error: any) {
//         console.error('❌ Failed to fetch profile:', error);

//         if (error.response?.status === 401 || error.response?.status === 403) {
//           localStorage.removeItem('access_token');
//           localStorage.removeItem('refresh_token');
//           localStorage.removeItem('username');
//           setIsLoggedIn(false);
//           toast.error('Session expired. Please login again.');
//           router.push('/signup');
//         } else {
//           toast.error('Failed to load profile. Please refresh the page.');
//         }
//       } finally {
//         setIsLoadingProfile(false);
//       }
//     };

//     checkAuthAndFetchProfile();

//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === 'access_token' || e.key === null) {
//         console.log('🔄 Token changed, refetching profile...');
//         checkAuthAndFetchProfile();
//       }
//     };

//     window.addEventListener('storage', handleStorageChange);

//     const handleTokenUpdate = () => {
//       console.log('🔄 Token updated event received, refetching profile...');
//       checkAuthAndFetchProfile();
//     };

//     window.addEventListener('tokenUpdated', handleTokenUpdate);

//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//       window.removeEventListener('tokenUpdated', handleTokenUpdate);
//     };
//   }, [router]);

//   const handleNavigation = (path: string, id: string) => {
//     setActive(id);
//     router.push(path);
//   };

//   const handleLogout = async () => {
//     if (isLoggingOut) return;
//     try {
//       setIsLoggingOut(true);
//       setShowProfileDropdown(false);

//       await signOut();

//       setIsLoggedIn(false);
//       setUserProfile(null);
//       toast.success('Logged out successfully');

//       router.push('/');
//     } catch (error) {
//       console.error('❌ Logout error:', error);
//       toast.error('Failed to logout. Please try again.');
//     } finally {
//       setIsLoggingOut(false);
//     }
//   };

//   // ✅ Use only userProfile - removed ProfileContext dependency
//   const displayName = 
//     userProfile?.full_name || 
//     userProfile?.username || 
//     'User';
  
//   const displayEmail = 
//     userProfile?.email || 
//     'No email';

//   const displayInitial = displayName?.[0]?.toUpperCase() || 'U';

//   return (
//     <div className="fixed top-0 left-0 right-0 h-screen w-full pointer-events-none">
//       {/* Sidebar */}
//       <div className="absolute top-0 left-0 h-full w-22 bg-white shadow-sm flex flex-col justify-between items-center overflow-visible z-50 pointer-events-auto">
//         {/* Top Section (Logo + Nav) */}
//         <div className="flex flex-col items-center mt-5">
//           {/* Logo */}
//           <div className="rounded-sm mb-8">
//             <RiRobot2Fill size={50} className="text-[#2557a7]" />
//           </div>

//           {/* Navigation Icons */}
//           <nav className="flex flex-col gap-2">
//             {navItems.map((item) => (
//               <button
//                 key={item.id}
//                 onClick={() => handleNavigation(item.path, item.id)}
//                 className={`flex flex-col items-center text-xs p-1 pt-2 pb-2 rounded-lg transition-all ${
//                   active === item.id
//                     ? "bg-[#e8eff9] text-[#2557a7]"
//                     : "text-gray-600 hover:text-[#2557a7]"
//                 }`}
//               >
//                 <div
//                   className={`text-xl ${
//                     active === item.id
//                       ? "fill-[#2557a7]"
//                       : "fill-none stroke-gray-800"
//                   } hover:fill-[#2557a7]`}
//                 >
//                   {item.icon}
//                 </div>
//                 <span
//                   className={`text-xs mt-1 ${
//                     active === item.id ? "text-xs text-[#2557a7]" : "text-gray-800"
//                   } `}
//                 >
//                   {item.label}
//                 </span>
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Bottom Section (Settings + Profile) */}
//         <div className="flex flex-col items-center gap-4 mb-4">
//           {/* Settings Button */}
//           <button
//             onClick={() => handleNavigation("/settings", "settings")}
//             className={`flex flex-col items-center text-xs p-1.5 pt-2 pb-2 rounded-lg transition-all  ${
//               active === "settings"
//                 ? "bg-[#e8eff9] text-[#2557a7]"
//                 : "text-gray-600 hover:text-[#2557a7]"
//             }`}
//           >
//             <div
//               className={`text-xl ${
//                 active === "settings"
//                   ? "fill-[#2557a7]"
//                   : "fill-none stroke-gray-800"
//               } hover:fill-[#2557a7]`}
//             >
//               <FaCog />
//             </div>
//             <span className="mt-1 text-xs text-gray-800">Settings</span>
//           </button>

//           {/* Profile Picture with Dropdown */}
//           <div className="relative" ref={dropdownRef}>
//             <button
//               onClick={() => setShowProfileDropdown(!showProfileDropdown)}
//               className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-[#2557a7] overflow-hidden cursor-pointer hover:opacity-90 transition"
//             >
//               {isLoadingProfile ? (
//                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//               ) : (
//                 <span className="text-white font-bold text-sm">
//                   {displayInitial}
//                 </span>
//               )}
//             </button>

//             {/* Dropdown Menu */}
//             {showProfileDropdown && (
//               <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
//                 {/* User Info */}
//                 <div className="px-4 py-3 border-b border-gray-100">
//                   <p className="text-sm font-semibold text-gray-900 truncate">
//                     {displayName}
//                   </p>
//                   <p className="text-xs text-gray-500 truncate">
//                     {displayEmail}
//                   </p>
//                 </div>

//                 {/* Logout Button */}
//                 <button
//                   onClick={handleLogout}
//                   disabled={isLoggingOut}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <LogOut className="w-4 h-4" />
//                   <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



// "use client";
// import { useState, useEffect, useRef } from "react";
// import { FaUser, FaCog } from "react-icons/fa";
// import { RiRobot2Fill, RiFileEditFill } from "react-icons/ri";
// import Image from "next/image";
// import { FaArrowRightArrowLeft } from "react-icons/fa6";
// import { MdOutlineWork } from "react-icons/md";
// import { LogOut } from "lucide-react";
// import { useRouter, usePathname } from "next/navigation";
// import { getProfile, UserProfile } from "@/api/userApi";
// import { signOut } from "@/api/authApi";
// import { toast } from "sonner";
// import axios from "axios";

// const navItems = [
//   { id: "profile", icon: <FaUser />, label: "Profile", path: "/dashboard/profile" },
//   { id: "resume", icon: <RiFileEditFill />, label: "Resume", path: "/builder/start" },
//   {
//     id: "ats",
//     icon: (
//       <Image
//         src="/assets/icons/ATS_Scan.svg"
//         alt="ATS Icon"
//         width={20}
//         height={20}
//         className="text-[#2557a7]"
//       />
//     ),
//     label: "ATS Scan",
//     path: "/ats",
//   },
//   { id: "jd_match", icon: <FaArrowRightArrowLeft />, label: "Job Match", path: "/job-match" },
//   { id: "jobs", icon: <MdOutlineWork />, label: "Jobs", path: "/jobs" },
// ];

// export default function Sidebar() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [active, setActive] = useState("profile");
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [isLoadingProfile, setIsLoadingProfile] = useState(true);
//   const [isLoggingOut, setIsLoggingOut] = useState(false);
//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Set active state based on current pathname
//   useEffect(() => {
//     const currentNavItem = navItems.find(item => pathname.startsWith(item.path));
//     if (currentNavItem) {
//       setActive(currentNavItem.id);
//     } else if (pathname === "/settings") {
//       setActive("settings");
//     }
//   }, [pathname]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowProfileDropdown(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Check authentication status and fetch profile
//   useEffect(() => {
//     const checkAuthAndFetchProfile = async () => {
//       const token = localStorage.getItem('access_token');
//       if (!token) {
//         console.log('❌ No token found');
//         setIsLoadingProfile(false);
//         return;
//       }

//       try {
//         const profile = await getProfile();
//         console.log('✅ Profile fetched successfully:', profile);
//         setUserProfile(profile);

//         if (profile.username) {
//           localStorage.setItem('username', profile.username);
//         }
//       } catch (error: unknown) {
//         console.error('❌ Failed to fetch profile:', error);

//         if (axios.isAxiosError(error)) {
//           if (error.response?.status === 401 || error.response?.status === 403) {
//             localStorage.removeItem('access_token');
//             localStorage.removeItem('refresh_token');
//             localStorage.removeItem('username');
//             toast.error('Session expired. Please login again.');
//             router.push('/signup');
//           } else {
//             toast.error('Failed to load profile. Please refresh the page.');
//           }
//         }
//       } finally {
//         setIsLoadingProfile(false);
//       }
//     };

//     checkAuthAndFetchProfile();

//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === 'access_token' || e.key === null) {
//         console.log('🔄 Token changed, refetching profile...');
//         checkAuthAndFetchProfile();
//       }
//     };

//     window.addEventListener('storage', handleStorageChange);

//     const handleTokenUpdate = () => {
//       console.log('🔄 Token updated event received, refetching profile...');
//       checkAuthAndFetchProfile();
//     };

//     window.addEventListener('tokenUpdated', handleTokenUpdate);

//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//       window.removeEventListener('tokenUpdated', handleTokenUpdate);
//     };
//   }, [router]);

//   const handleNavigation = (path: string, id: string) => {
//     setActive(id);
//     router.push(path);
//   };

//   const handleLogout = async () => {
//     if (isLoggingOut) return;
//     try {
//       setIsLoggingOut(true);
//       setShowProfileDropdown(false);

//       await signOut();

//       setUserProfile(null);
//       toast.success('Logged out successfully');

//       router.push('/');
//     } catch (error) {
//       console.error('❌ Logout error:', error);
//       toast.error('Failed to logout. Please try again.');
//     } finally {
//       setIsLoggingOut(false);
//     }
//   };

//   const displayName = 
//     userProfile?.full_name || 
//     userProfile?.username || 
//     'User';
  
//   const displayEmail = 
//     userProfile?.email || 
//     'No email';

//   const displayInitial = displayName?.[0]?.toUpperCase() || 'U';

//   return (
//     <div className="fixed top-0 left-0 right-0 h-screen w-full pointer-events-none">
//       {/* Sidebar */}
//       <div className="absolute top-0 left-0 h-full w-22 bg-white shadow-sm flex flex-col justify-between items-center overflow-visible z-50 pointer-events-auto">
//         {/* Top Section (Logo + Nav) */}
//         <div className="flex flex-col items-center mt-5">
//           {/* Logo */}
//           <div className="rounded-sm mb-8">
//             <RiRobot2Fill size={50} className="text-[#2557a7]" />
//           </div>

//           {/* Navigation Icons */}
//           <nav className="flex flex-col gap-2">
//             {navItems.map((item) => (
//               <button
//                 key={item.id}
//                 onClick={() => handleNavigation(item.path, item.id)}
//                 className={`flex flex-col items-center text-xs p-1 pt-2 pb-2 rounded-lg transition-all ${
//                   active === item.id
//                     ? "bg-[#e8eff9] text-[#2557a7]"
//                     : "text-gray-600 hover:text-[#2557a7]"
//                 }`}
//               >
//                 <div
//                   className={`text-xl ${
//                     active === item.id
//                       ? "fill-[#2557a7]"
//                       : "fill-none stroke-gray-800"
//                   } hover:fill-[#2557a7]`}
//                 >
//                   {item.icon}
//                 </div>
//                 <span
//                   className={`text-xs mt-1 ${
//                     active === item.id ? "text-xs text-[#2557a7]" : "text-gray-800"
//                   } `}
//                 >
//                   {item.label}
//                 </span>
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Bottom Section (Settings + Profile) */}
//         <div className="flex flex-col items-center gap-4 mb-4">
//           {/* Settings Button */}
//           <button
//             onClick={() => handleNavigation("/settings", "settings")}
//             className={`flex flex-col items-center text-xs p-1.5 pt-2 pb-2 rounded-lg transition-all  ${
//               active === "settings"
//                 ? "bg-[#e8eff9] text-[#2557a7]"
//                 : "text-gray-600 hover:text-[#2557a7]"
//             }`}
//           >
//             <div
//               className={`text-xl ${
//                 active === "settings"
//                   ? "fill-[#2557a7]"
//                   : "fill-none stroke-gray-800"
//               } hover:fill-[#2557a7]`}
//             >
//               <FaCog />
//             </div>
//             <span className="mt-1 text-xs text-gray-800">Settings</span>
//           </button>

//           {/* Profile Picture with Dropdown */}
//           <div className="relative" ref={dropdownRef}>
//             <button
//               onClick={() => setShowProfileDropdown(!showProfileDropdown)}
//               className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-[#2557a7] overflow-hidden cursor-pointer hover:opacity-90 transition"
//             >
//               {isLoadingProfile ? (
//                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//               ) : (
//                 <span className="text-white font-bold text-sm">
//                   {displayInitial}
//                 </span>
//               )}
//             </button>

//             {/* Dropdown Menu */}
//             {showProfileDropdown && (
//               <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
//                 {/* User Info */}
//                 <div className="px-4 py-3 border-b border-gray-100">
//                   <p className="text-sm font-semibold text-gray-900 truncate">
//                     {displayName}
//                   </p>
//                   <p className="text-xs text-gray-500 truncate">
//                     {displayEmail}
//                   </p>
//                 </div>

//                 {/* Logout Button */}
//                 <button
//                   onClick={handleLogout}
//                   disabled={isLoggingOut}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <LogOut className="w-4 h-4" />
//                   <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// } before builder creation profile active issue solve




// "use client";
// import { useState, useEffect, useRef } from "react";
// import { FaUser, FaCog } from "react-icons/fa";
// import { RiRobot2Fill, RiFileEditFill } from "react-icons/ri";
// import Image from "next/image";
// import { FaArrowRightArrowLeft } from "react-icons/fa6";
// import { MdOutlineWork } from "react-icons/md";
// import { LogOut } from "lucide-react";
// import { useRouter, usePathname } from "next/navigation";
// import { getProfile, UserProfile } from "@/api/userApi";
// import { signOut } from "@/api/authApi";
// import { toast } from "sonner";
// import axios from "axios";

// const navItems = [
//   { id: "profile", icon: <FaUser />, label: "Profile", path: "/dashboard/profile" },
//   { 
//     id: "resume", 
//     icon: <RiFileEditFill />, 
//     label: "Resume", 
//     path: "/builder", // ✅ Changed from /builder/start to /builder
//   },
//   {
//     id: "ats",
//     icon: (
//       <Image
//         src="/assets/icons/ATS_Scan.svg"
//         alt="ATS Icon"
//         width={20}
//         height={20}
//         className="text-[#2557a7]"
//       />
//     ),
//     label: "ATS Scan",
//     path: "/ats",
//   },
//   { id: "jd_match", icon: <FaArrowRightArrowLeft />, label: "Job Match", path: "/job-match" },
//   { id: "jobs", icon: <MdOutlineWork />, label: "Jobs", path: "/jobs" },
// ];

// export default function Sidebar() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [active, setActive] = useState("profile");
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [isLoadingProfile, setIsLoadingProfile] = useState(true);
//   const [isLoggingOut, setIsLoggingOut] = useState(false);
//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // ✅ Set active state based on current pathname
//   useEffect(() => {
//     // Check if current path matches any nav item
//     const currentNavItem = navItems.find(item => pathname.startsWith(item.path));
    
//     if (currentNavItem) {
//       setActive(currentNavItem.id);
//     } else if (pathname === "/settings") {
//       setActive("settings");
//     } else {
//       // ✅ Default to profile if no match
//       setActive("profile");
//     }
    
//     // ✅ Log for debugging
//     console.log("📍 Current pathname:", pathname);
//     console.log("🎯 Active nav item:", currentNavItem?.id || "none");
//   }, [pathname]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowProfileDropdown(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Check authentication status and fetch profile
//   useEffect(() => {
//     const checkAuthAndFetchProfile = async () => {
//       const token = localStorage.getItem('access_token');
//       if (!token) {
//         console.log('❌ No token found');
//         setIsLoadingProfile(false);
//         return;
//       }

//       try {
//         const profile = await getProfile();
//         console.log('✅ Profile fetched successfully:', profile);
//         setUserProfile(profile);

//         if (profile.username) {
//           localStorage.setItem('username', profile.username);
//         }
//       } catch (error: unknown) {
//         console.error('❌ Failed to fetch profile:', error);

//         if (axios.isAxiosError(error)) {
//           if (error.response?.status === 401 || error.response?.status === 403) {
//             localStorage.removeItem('access_token');
//             localStorage.removeItem('refresh_token');
//             localStorage.removeItem('username');
//             toast.error('Session expired. Please login again.');
//             router.push('/signup');
//           } else {
//             toast.error('Failed to load profile. Please refresh the page.');
//           }
//         }
//       } finally {
//         setIsLoadingProfile(false);
//       }
//     };

//     checkAuthAndFetchProfile();

//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === 'access_token' || e.key === null) {
//         console.log('🔄 Token changed, refetching profile...');
//         checkAuthAndFetchProfile();
//       }
//     };

//     window.addEventListener('storage', handleStorageChange);

//     const handleTokenUpdate = () => {
//       console.log('🔄 Token updated event received, refetching profile...');
//       checkAuthAndFetchProfile();
//     };

//     window.addEventListener('tokenUpdated', handleTokenUpdate);

//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//       window.removeEventListener('tokenUpdated', handleTokenUpdate);
//     };
//   }, [router]);

//   const handleNavigation = (path: string, id: string) => {
//     setActive(id);
//     // ✅ Navigate to /builder/start when clicking Resume
//     if (id === "resume") {
//       router.push("/builder/start");
//     } else {
//       router.push(path);
//     }
//   };

//   const handleLogout = async () => {
//     if (isLoggingOut) return;
//     try {
//       setIsLoggingOut(true);
//       setShowProfileDropdown(false);

//       await signOut();

//       setUserProfile(null);
//       toast.success('Logged out successfully');

//       router.push('/');
//     } catch (error) {
//       console.error('❌ Logout error:', error);
//       toast.error('Failed to logout. Please try again.');
//     } finally {
//       setIsLoggingOut(false);
//     }
//   };

//   const displayName = 
//     userProfile?.full_name || 
//     userProfile?.username || 
//     'User';
  
//   const displayEmail = 
//     userProfile?.email || 
//     'No email';

//   const displayInitial = displayName?.[0]?.toUpperCase() || 'U';

//   return (
//     <div className="fixed top-0 left-0 right-0 h-screen w-full pointer-events-none">
//       {/* Sidebar */}
//       <div className="absolute top-0 left-0 h-full w-20 bg-white shadow-sm flex flex-col justify-between items-center overflow-visible z-50 pointer-events-auto">
//         {/* Top Section (Logo + Nav) */}
//         <div className="flex flex-col items-center mt-1">
//           {/* Logo */}
//           <div className="rounded-sm mb-5">
//             <RiRobot2Fill size={50} className="text-[#2557a7]" />
//           </div>

//           {/* Navigation Icons */}
//           <nav className="flex flex-col gap-2">
//             {navItems.map((item) => (
//               <button
//                 key={item.id}
//                 onClick={() => handleNavigation(item.path, item.id)}
//                 className={`flex flex-col items-center text-xs p-1 pt-2 pb-2 rounded-lg transition-all ${
//                   active === item.id
//                     ? "bg-[#e8eff9] text-[#2557a7]"
//                     : "text-gray-600 hover:text-[#2557a7]"
//                 }`}
//               >
//                 <div
//                   className={`text-xl ${
//                     active === item.id
//                       ? "fill-[#2557a7]"
//                       : "fill-none stroke-gray-800"
//                   } hover:fill-[#2557a7]`}
//                 >
//                   {item.icon}
//                 </div>
//                 <span
//                   className={`text-xs mt-1 ${
//                     active === item.id ? "text-xs text-[#2557a7]" : "text-gray-800"
//                   } `}
//                 >
//                   {item.label}
//                 </span>
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Bottom Section (Settings + Profile) */}
//         <div className="flex flex-col items-center gap-4 mb-4">
//           {/* Settings Button */}
//           <button
//             onClick={() => handleNavigation("/settings", "settings")}
//             className={`flex flex-col items-center text-xs p-1.5 pt-2 pb-2 rounded-lg transition-all  ${
//               active === "settings"
//                 ? "bg-[#e8eff9] text-[#2557a7]"
//                 : "text-gray-600 hover:text-[#2557a7]"
//             }`}
//           >
//             <div
//               className={`text-xl ${
//                 active === "settings"
//                   ? "fill-[#2557a7]"
//                   : "fill-none stroke-gray-800"
//               } hover:fill-[#2557a7]`}
//             >
//               <FaCog />
//             </div>
//             <span className="mt-1 text-xs text-gray-800">Settings</span>
//           </button>

//           {/* Profile Picture with Dropdown */}
//           <div className="relative" ref={dropdownRef}>
//             <button
//               onClick={() => setShowProfileDropdown(!showProfileDropdown)}
//               className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-[#2557a7] overflow-hidden cursor-pointer hover:opacity-90 transition"
//             >
//               {isLoadingProfile ? (
//                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//               ) : (
//                 <span className="text-white font-bold text-sm">
//                   {displayInitial}
//                 </span>
//               )}
//             </button>

//             {/* Dropdown Menu */}
//             {showProfileDropdown && (
//               <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
//                 {/* User Info */}
//                 <div className="px-4 py-3 border-b border-gray-100">
//                   <p className="text-sm font-semibold text-gray-900 truncate">
//                     {displayName}
//                   </p>
//                   <p className="text-xs text-gray-500 truncate">
//                     {displayEmail}
//                   </p>
//                 </div>

//                 {/* Logout Button */}
//                 <button
//                   onClick={handleLogout}
//                   disabled={isLoggingOut}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <LogOut className="w-4 h-4" />
//                   <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// "use client";
// import { useState, useEffect, useRef } from "react";
// import { FaUser, FaCog } from "react-icons/fa";
// import { RiFileEditFill } from "react-icons/ri";
// import Image from "next/image";
// import { FaArrowRightArrowLeft } from "react-icons/fa6";
// import { MdOutlineWork } from "react-icons/md";
// import { LogOut } from "lucide-react";
// import { useRouter, usePathname } from "next/navigation";
// import { getProfile, UserProfile } from "@/api/userApi";
// import { signOut } from "@/api/authApi";
// import { toast } from "sonner";
// import axios from "axios";

// const navItems = [
//   { id: "profile", icon: <FaUser />, label: "Profile", path: "/dashboard/profile" },
//   { 
//     id: "resume", 
//     icon: <RiFileEditFill />, 
//     label: "Resume", 
//     path: "/builder",
//   },
//   {
//     id: "ats",
//     icon: "ats_scan", // Special identifier for conditional SVG
//     label: "ATS Scan",
//     path: "/ats",
//   },
//   { id: "jd_match", icon: <FaArrowRightArrowLeft />, label: "Job Match", path: "/job-match" },
//   { id: "jobs", icon: <MdOutlineWork />, label: "Jobs", path: "/jobs" },
// ];

// export default function Sidebar() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [active, setActive] = useState("profile");
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [isLoadingProfile, setIsLoadingProfile] = useState(true);
//   const [isLoggingOut, setIsLoggingOut] = useState(false);
//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Set active state based on current pathname
//   useEffect(() => {
//     const currentNavItem = navItems.find(item => pathname.startsWith(item.path));
    
//     if (currentNavItem) {
//       setActive(currentNavItem.id);
//     } else if (pathname === "/settings") {
//       setActive("settings");
//     } else {
//       setActive("profile");
//     }
    
//     console.log("📍 Current pathname:", pathname);
//     console.log("🎯 Active nav item:", currentNavItem?.id || "none");
//   }, [pathname]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowProfileDropdown(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Check authentication status and fetch profile
//   useEffect(() => {
//     const checkAuthAndFetchProfile = async () => {
//       const token = localStorage.getItem('access_token');
//       if (!token) {
//         console.log('❌ No token found');
//         setIsLoadingProfile(false);
//         return;
//       }

//       try {
//         const profile = await getProfile();
//         console.log('✅ Profile fetched successfully:', profile);
//         setUserProfile(profile);

//         if (profile.username) {
//           localStorage.setItem('username', profile.username);
//         }
//       } catch (error: unknown) {
//         console.error('❌ Failed to fetch profile:', error);

//         if (axios.isAxiosError(error)) {
//           if (error.response?.status === 401 || error.response?.status === 403) {
//             localStorage.removeItem('access_token');
//             localStorage.removeItem('refresh_token');
//             localStorage.removeItem('username');
//             toast.error('Session expired. Please login again.');
//             router.push('/signup');
//           } else {
//             toast.error('Failed to load profile. Please refresh the page.');
//           }
//         }
//       } finally {
//         setIsLoadingProfile(false);
//       }
//     };

//     checkAuthAndFetchProfile();

//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === 'access_token' || e.key === null) {
//         console.log('🔄 Token changed, refetching profile...');
//         checkAuthAndFetchProfile();
//       }
//     };

//     window.addEventListener('storage', handleStorageChange);

//     const handleTokenUpdate = () => {
//       console.log('🔄 Token updated event received, refetching profile...');
//       checkAuthAndFetchProfile();
//     };

//     window.addEventListener('tokenUpdated', handleTokenUpdate);

//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//       window.removeEventListener('tokenUpdated', handleTokenUpdate);
//     };
//   }, [router]);

//   const handleNavigation = (path: string, id: string) => {
//     setActive(id);
//     if (id === "resume") {
//       router.push("/builder/start");
//     } else {
//       router.push(path);
//     }
//   };

//   const handleLogout = async () => {
//     if (isLoggingOut) return;
//     try {
//       setIsLoggingOut(true);
//       setShowProfileDropdown(false);

//       await signOut();

//       setUserProfile(null);
//       toast.success('Logged out successfully');

//       router.push('/');
//     } catch (error) {
//       console.error('❌ Logout error:', error);
//       toast.error('Failed to logout. Please try again.');
//     } finally {
//       setIsLoggingOut(false);
//     }
//   };

//   // ✅ Helper function to render icon conditionally
//   const renderIcon = (item: typeof navItems[0]) => {
//     // Handle ATS icon with conditional SVG
//     if (item.icon === "ats_scan") {
//       return (
//         <Image
//           src={active === item.id 
//             ? "/assets/icons/ATS_Scan_Selected.svg" 
//             : "/assets/icons/ATS_Scan.svg"
//           }
//           alt="ATS Icon"
//           width={20}
//           height={20}
//           // className={active === item.id ? "fill-[#2557a7]" : "fill-none stroke-gray-800"}
//           className={
//           active === item.id
//             ? "brightness-0 saturate-100" // Makes it black first
//             : ""
//         }
//         style={
//           active === item.id
//             ? { filter: "invert(26%) sepia(88%) saturate(1567%) hue-rotate(197deg) brightness(91%) contrast(91%)" }
//             : {}
//         }
//         />
//       );
//     }
    
//     // Handle all other icons (React components)
//     return item.icon;
//   };

//   const displayName = 
//     userProfile?.full_name || 
//     userProfile?.username || 
//     'User';
  
//   const displayEmail = 
//     userProfile?.email || 
//     'No email';

//   const displayInitial = displayName?.[0]?.toUpperCase() || 'U';

//   return (
//     <div className="fixed top-0 left-0 right-0 h-screen w-full pointer-events-none">
//       {/* Sidebar */}
//       <div className="absolute top-0 left-0 h-full w-20 bg-white shadow-sm flex flex-col justify-between items-center overflow-visible z-50 pointer-events-auto">
//         {/* Top Section (Logo + Nav) */}
//         <div className="flex flex-col items-center mt-1">
//           {/* ✅ Logo - Using SVG Image */}
//           <div className="rounded-sm mb-5">
//             <Image
//               src="/assets/icons/robot.svg"
//               alt="Logo"
//               width={50}
//               height={50}
//               priority
//             />
//           </div>

//           {/* Navigation Icons */}
//           <nav className="flex flex-col gap-2">
//             {navItems.map((item) => (
//               <button
//                 key={item.id}
//                 onClick={() => handleNavigation(item.path, item.id)}
//                 className={`flex flex-col items-center text-xs p-1 pt-2 pb-2 rounded-lg transition-all ${
//                   active === item.id
//                     ? "bg-[#e8eff9] text-[#2557a7]"
//                     : "text-gray-600 hover:text-[#2557a7]"
//                 }`}
//               >
//                 <div
//                   className={`text-xl ${
//                     active === item.id
//                       ? "fill-[#2557a7]"
//                       : "fill-none stroke-gray-800"
//                   } hover:fill-[#2557a7]`}
//                 >
//                   {renderIcon(item)}
//                 </div>
//                 <span
//                   className={`text-xs mt-1 ${
//                     active === item.id ? "text-xs text-[#2557a7]" : "text-gray-800"
//                   }`}
//                 >
//                   {item.label}
//                 </span>
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Bottom Section (Settings + Profile) */}
//         <div className="flex flex-col items-center gap-4 mb-4">
//           {/* Settings Button */}
//           <button
//             onClick={() => handleNavigation("/settings", "settings")}
//             className={`flex flex-col items-center text-xs p-1.5 pt-2 pb-2 rounded-lg transition-all  ${
//               active === "settings"
//                 ? "bg-[#e8eff9] text-[#2557a7]"
//                 : "text-gray-600 hover:text-[#2557a7]"
//             }`}
//           >
//             <div
//               className={`text-xl ${
//                 active === "settings"
//                   ? "fill-[#2557a7]"
//                   : "fill-none stroke-gray-800"
//               } hover:fill-[#2557a7]`}
//             >
//               <FaCog />
//             </div>
//             <span className="mt-1 text-xs text-gray-800">Settings</span>
//           </button>

//           {/* Profile Picture with Dropdown */}
//           <div className="relative" ref={dropdownRef}>
//             <button
//               onClick={() => setShowProfileDropdown(!showProfileDropdown)}
//               className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-[#2557a7] overflow-hidden cursor-pointer hover:opacity-90 transition"
//             >
//               {isLoadingProfile ? (
//                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//               ) : (
//                 <span className="text-white font-bold text-sm">
//                   {displayInitial}
//                 </span>
//               )}
//             </button>

//             {/* Dropdown Menu */}
//             {showProfileDropdown && (
//               <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
//                 {/* User Info */}
//                 <div className="px-4 py-3 border-b border-gray-100">
//                   <p className="text-sm font-semibold text-gray-900 truncate">
//                     {displayName}
//                   </p>
//                   <p className="text-xs text-gray-500 truncate">
//                     {displayEmail}
//                   </p>
//                 </div>

//                 {/* Logout Button */}
//                 <button
//                   onClick={handleLogout}
//                   disabled={isLoggingOut}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <LogOut className="w-4 h-4" />
//                   <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// } ats scan selected added


// "use client";
// import { useState, useEffect, useRef } from "react";
// import { FaUser, FaCog } from "react-icons/fa";
// import { RiFileEditFill } from "react-icons/ri";
// import Image from "next/image";
// import { FaArrowRightArrowLeft } from "react-icons/fa6";
// import { MdOutlineWork } from "react-icons/md";
// import { LogOut } from "lucide-react";
// import { useRouter, usePathname } from "next/navigation";
// import { getProfile, UserProfile } from "@/api/userApi";
// import { signOut } from "@/api/authApi";
// import { toast } from "sonner";
// import axios from "axios";

// const navItems = [
//   { id: "profile", icon: <FaUser />, label: "Profile", path: "/dashboard/profile" },
//   { 
//     id: "resume", 
//     icon: <RiFileEditFill />, 
//     label: "Resume", 
//     path: "/builder",
//   },
//   {
//     id: "ats",
//     icon: "ats_scan", // Special identifier for conditional SVG
//     label: "ATS Scan",
//     path: "/ats",
//   },
//   { id: "jd_match", icon: <FaArrowRightArrowLeft />, label: "Job Match", path: "/job-match" },
//   { id: "jobs", icon: <MdOutlineWork />, label: "Jobs", path: "/jobs" },
// ];

// export default function Sidebar() {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [active, setActive] = useState("profile");
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [isLoadingProfile, setIsLoadingProfile] = useState(true);
//   const [isLoggingOut, setIsLoggingOut] = useState(false);
//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
//   const [hoveredItem, setHoveredItem] = useState<string | null>(null); // ✅ Track hover state
  
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Set active state based on current pathname
//   useEffect(() => {
//     const currentNavItem = navItems.find(item => pathname.startsWith(item.path));
    
//     if (currentNavItem) {
//       setActive(currentNavItem.id);
//     } else if (pathname === "/settings") {
//       setActive("settings");
//     } else {
//       setActive("profile");
//     }
    
//     console.log("📍 Current pathname:", pathname);
//     console.log("🎯 Active nav item:", currentNavItem?.id || "none");
//   }, [pathname]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setShowProfileDropdown(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Check authentication status and fetch profile
//   useEffect(() => {
//     const checkAuthAndFetchProfile = async () => {
//       const token = localStorage.getItem('access_token');
//       if (!token) {
//         console.log('❌ No token found');
//         setIsLoadingProfile(false);
//         return;
//       }

//       try {
//         const profile = await getProfile();
//         console.log('✅ Profile fetched successfully:', profile);
//         setUserProfile(profile);

//         if (profile.username) {
//           localStorage.setItem('username', profile.username);
//         }
//       } catch (error: unknown) {
//         console.error('❌ Failed to fetch profile:', error);

//         if (axios.isAxiosError(error)) {
//           if (error.response?.status === 401 || error.response?.status === 403) {
//             localStorage.removeItem('access_token');
//             localStorage.removeItem('refresh_token');
//             localStorage.removeItem('username');
//             toast.error('Session expired. Please login again.');
//             router.push('/signup');
//           } else {
//             toast.error('Failed to load profile. Please refresh the page.');
//           }
//         }
//       } finally {
//         setIsLoadingProfile(false);
//       }
//     };

//     checkAuthAndFetchProfile();

//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === 'access_token' || e.key === null) {
//         console.log('🔄 Token changed, refetching profile...');
//         checkAuthAndFetchProfile();
//       }
//     };

//     window.addEventListener('storage', handleStorageChange);

//     const handleTokenUpdate = () => {
//       console.log('🔄 Token updated event received, refetching profile...');
//       checkAuthAndFetchProfile();
//     };

//     window.addEventListener('tokenUpdated', handleTokenUpdate);

//     return () => {
//       window.removeEventListener('storage', handleStorageChange);
//       window.removeEventListener('tokenUpdated', handleTokenUpdate);
//     };
//   }, [router]);

//   const handleNavigation = (path: string, id: string) => {
//     setActive(id);
//     if (id === "resume") {
//       router.push("/builder/start");
//     } else {
//       router.push(path);
//     }
//   };

//   const handleLogout = async () => {
//     if (isLoggingOut) return;
//     try {
//       setIsLoggingOut(true);
//       setShowProfileDropdown(false);

//       await signOut();

//       setUserProfile(null);
//       toast.success('Logged out successfully');

//       router.push('/');
//     } catch (error) {
//       console.error('❌ Logout error:', error);
//       toast.error('Failed to logout. Please try again.');
//     } finally {
//       setIsLoggingOut(false);
//     }
//   };

//   // ✅ Updated helper function with hover support
//   const renderIcon = (item: typeof navItems[0]) => {
//     // Handle ATS icon with conditional SVG
//     if (item.icon === "ats_scan") {
//       const isActive = active === item.id;
//       const isHovered = hoveredItem === item.id;
      
//       return (
//         <Image
//           src={isActive 
//             ? "/assets/icons/ATS_Scan_Selected.svg" 
//             : "/assets/icons/ATS_Scan.svg"
//           }
//           alt="ATS Icon"
//           width={20}
//           height={20}
//           className={
//             isActive || isHovered
//               ? "brightness-0 saturate-100 transition-all duration-200"
//               : "transition-all duration-200"
//           }
//           style={
//             isActive || isHovered
//               ? { filter: "invert(26%) sepia(88%) saturate(1567%) hue-rotate(197deg) brightness(91%) contrast(91%)" }
//               : {}
//           }
//         />
//       );
//     }
    
//     // Handle all other icons (React components)
//     return item.icon;
//   };

//   const displayName = 
//     userProfile?.full_name || 
//     userProfile?.username || 
//     'User';
  
//   const displayEmail = 
//     userProfile?.email || 
//     'No email';

//   const displayInitial = displayName?.[0]?.toUpperCase() || 'U';

//   return (
//     <div className="fixed top-0 left-0 right-0 h-screen w-full pointer-events-none">
//       {/* Sidebar */}
//       <div className="absolute top-0 left-0 h-full w-20 bg-white shadow-sm flex flex-col justify-between items-center overflow-visible z-50 pointer-events-auto">
//         {/* Top Section (Logo + Nav) */}
//         <div className="flex flex-col items-center mt-1">
//           {/* ✅ Logo - Using SVG Image */}
//           <div className="rounded-sm mb-5">
//             <Image
//               src="/assets/icons/robot.svg"
//               alt="Logo"
//               width={50}
//               height={50}
//               priority
//             />
//           </div>

//           {/* Navigation Icons */}
//           <nav className="flex flex-col gap-2">
//             {navItems.map((item) => (
//               <button
//                 key={item.id}
//                 onClick={() => handleNavigation(item.path, item.id)}
//                 onMouseEnter={() => setHoveredItem(item.id)} // ✅ Add hover state
//                 onMouseLeave={() => setHoveredItem(null)} // ✅ Remove hover state
//                 className={`flex flex-col items-center text-xs p-1 pt-2 pb-2 rounded-lg transition-all ${
//                   active === item.id
//                     ? "bg-[#e8eff9] text-[#2557a7]"
//                     : "text-gray-600 hover:text-[#2557a7]"
//                 }`}
//               >
//                 <div
//                   className={`text-xl ${
//                     active === item.id
//                       ? "fill-[#2557a7]"
//                       : "fill-none stroke-gray-800"
//                   } hover:fill-[#2557a7]`}
//                 >
//                   {renderIcon(item)}
//                 </div>
//                 <span
//                   className={`text-xs mt-1 ${
//                     active === item.id ? "text-xs text-[#2557a7]" : "text-gray-800"
//                   }`}
//                 >
//                   {item.label}
//                 </span>
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* Bottom Section (Settings + Profile) */}
//         <div className="flex flex-col items-center gap-4 mb-4">
//           {/* Settings Button */}
//           <button
//             onClick={() => handleNavigation("/settings", "settings")}
//             className={`flex flex-col items-center text-xs p-1.5 pt-2 pb-2 rounded-lg transition-all  ${
//               active === "settings"
//                 ? "bg-[#e8eff9] text-[#2557a7]"
//                 : "text-gray-600 hover:text-[#2557a7]"
//             }`}
//           >
//             <div
//               className={`text-xl ${
//                 active === "settings"
//                   ? "fill-[#2557a7]"
//                   : "fill-none stroke-gray-800"
//               } hover:fill-[#2557a7]`}
//             >
//               <FaCog />
//             </div>
//             <span className="mt-1 text-xs text-gray-800">Settings</span>
//           </button>

//           {/* Profile Picture with Dropdown */}
//           <div className="relative" ref={dropdownRef}>
//             <button
//               onClick={() => setShowProfileDropdown(!showProfileDropdown)}
//               className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-[#2557a7] overflow-hidden cursor-pointer hover:opacity-90 transition"
//             >
//               {isLoadingProfile ? (
//                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//               ) : (
//                 <span className="text-white font-bold text-sm">
//                   {displayInitial}
//                 </span>
//               )}
//             </button>

//             {/* Dropdown Menu */}
//             {showProfileDropdown && (
//               <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
//                 {/* User Info */}
//                 <div className="px-4 py-3 border-b border-gray-100">
//                   <p className="text-sm font-semibold text-gray-900 truncate">
//                     {displayName}
//                   </p>
//                   <p className="text-xs text-gray-500 truncate">
//                     {displayEmail}
//                   </p>
//                 </div>

//                 {/* Logout Button */}
//                 <button
//                   onClick={handleLogout}
//                   disabled={isLoggingOut}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   <LogOut className="w-4 h-4" />
//                   <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// } label automatic hover


"use client";
import { useState, useEffect, useRef } from "react";
import { FaUser, FaCog } from "react-icons/fa";
import { RiFileEditFill } from "react-icons/ri";
import Image from "next/image";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { MdOutlineWork } from "react-icons/md";
import { LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getProfile, UserProfile } from "@/api/userApi";
import { signOut } from "@/api/authApi";
import { toast } from "sonner";
import axios from "axios";

const navItems = [
  { id: "profile", icon: <FaUser />, label: "Profile", path: "/dashboard/profile" },
  { 
    id: "resume", 
    icon: <RiFileEditFill />, 
    label: "Resume", 
    path: "/builder",
  },
  {
    id: "ats",
    icon: "ats_scan", // Special identifier for conditional SVG
    label: "ATS Scan",
    path: "/ats",
  },
  { id: "jd_match", icon: <FaArrowRightArrowLeft />, label: "Job Match", path: "/job-match" },
  { id: "jobs", icon: <MdOutlineWork />, label: "Jobs", path: "/jobs" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState("profile");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null); // ✅ Track hover state
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set active state based on current pathname
  useEffect(() => {
    const currentNavItem = navItems.find(item => pathname.startsWith(item.path));
    
    if (currentNavItem) {
      setActive(currentNavItem.id);
    } else if (pathname === "/settings") {
      setActive("settings");
    } else {
      setActive("profile");
    }
    
    console.log("📍 Current pathname:", pathname);
    console.log("🎯 Active nav item:", currentNavItem?.id || "none");
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check authentication status and fetch profile
  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('❌ No token found');
        setIsLoadingProfile(false);
        return;
      }

      try {
        const profile = await getProfile();
        console.log('✅ Profile fetched successfully:', profile);
        setUserProfile(profile);

        if (profile.username) {
          localStorage.setItem('username', profile.username);
        }
      } catch (error: unknown) {
        console.error('❌ Failed to fetch profile:', error);

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('username');
            toast.error('Session expired. Please login again.');
            router.push('/signup');
          } else {
            toast.error('Failed to load profile. Please refresh the page.');
          }
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    checkAuthAndFetchProfile();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === null) {
        console.log('🔄 Token changed, refetching profile...');
        checkAuthAndFetchProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);

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

  const handleNavigation = (path: string, id: string) => {
    setActive(id);
    if (id === "resume") {
      router.push("/builder/start");
    } else {
      router.push(path);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      setShowProfileDropdown(false);

      await signOut();

      setUserProfile(null);
      toast.success('Logged out successfully');

      router.push('/');
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ✅ Updated helper function with hover support
  const renderIcon = (item: typeof navItems[0]) => {
    // Handle ATS icon with conditional SVG
    if (item.icon === "ats_scan") {
      const isActive = active === item.id;
      const isHovered = hoveredItem === item.id;
      
      return (
        <Image
          src={isActive 
            ? "/assets/icons/ATS_Scan_Selected.svg" 
            : "/assets/icons/ATS_Scan.svg"
          }
          alt="ATS Icon"
          width={20}
          height={20}
          className={
            isActive || isHovered
              ? "brightness-0 saturate-100 transition-all duration-200"
              : "transition-all duration-200"
          }
          style={
            isActive || isHovered
              ? { filter: "invert(26%) sepia(88%) saturate(1567%) hue-rotate(197deg) brightness(91%) contrast(91%)" }
              : {}
          }
        />
      );
    }
    
    // Handle all other icons (React components)
    return item.icon;
  };

  const displayName = 
    userProfile?.full_name || 
    userProfile?.username || 
    'User';
  
  const displayEmail = 
    userProfile?.email || 
    'No email';

  const displayInitial = displayName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="fixed top-0 left-0 right-0 h-screen w-full pointer-events-none">
      {/* Sidebar */}
      <div className="absolute top-0 left-0 h-full w-20 bg-white shadow-sm flex flex-col justify-between items-center overflow-visible z-50 pointer-events-auto">
        {/* Top Section (Logo + Nav) */}
        <div className="flex flex-col items-center mt-2">
          {/* ✅ Logo - Using SVG Image */}
          <div className="rounded-sm mb-5">
            <Image
              src="/assets/icons/image.svg"
              alt="Logo"
              width={55}
              height={55}
              priority
            />
          </div>

          {/* Navigation Icons */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path, item.id)}
                onMouseEnter={() => setHoveredItem(item.id)} // ✅ Add hover state
                onMouseLeave={() => setHoveredItem(null)} // ✅ Remove hover state
                className={`flex flex-col items-center text-xs p-1 pt-2 pb-2 rounded-lg transition-all ${
                  active === item.id
                    ? "bg-[#e8eff9] text-[#2557a7]"
                    : "text-gray-600 hover:text-[#2557a7]"
                }`}
              >
                <div
                  className={`text-xl ${
                    active === item.id
                      ? "fill-[#2557a7]"
                      : "fill-none stroke-gray-800"
                  } hover:fill-[#2557a7]`}
                >
                  {renderIcon(item)}
                </div>
                {/* ✅ Updated label with hover color */}
                <span
                  className={`text-xs mt-1 transition-colors duration-200 ${
                    active === item.id || hoveredItem === item.id
                      ? "text-[#2557a7]" 
                      : "text-gray-800"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Section (Settings + Profile) */}
        <div className="flex flex-col items-center gap-4 mb-4">
          {/* Settings Button */}
          <button
            onClick={() => handleNavigation("/settings", "settings")}
            onMouseEnter={() => setHoveredItem("settings")} // ✅ Add hover for settings
            onMouseLeave={() => setHoveredItem(null)} // ✅ Remove hover
            className={`flex flex-col items-center text-xs p-1.5 pt-2 pb-2 rounded-lg transition-all  ${
              active === "settings"
                ? "bg-[#e8eff9] text-[#2557a7]"
                : "text-gray-600 hover:text-[#2557a7]"
            }`}
          >
            <div
              className={`text-xl ${
                active === "settings"
                  ? "fill-[#2557a7]"
                  : "fill-none stroke-gray-800"
              } hover:fill-[#2557a7]`}
            >
              <FaCog />
            </div>
            {/* ✅ Updated settings label with hover color */}
            <span 
              className={`mt-1 text-xs transition-colors duration-200 ${
                active === "settings" || hoveredItem === "settings"
                  ? "text-[#2557a7]" 
                  : "text-gray-800"
              }`}
            >
              Settings
            </span>
          </button>

          {/* Profile Picture with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-[#2557a7] overflow-hidden cursor-pointer hover:opacity-90 transition"
            >
              {isLoadingProfile ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-white font-bold text-sm">
                  {displayInitial}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {displayEmail}
                  </p>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


