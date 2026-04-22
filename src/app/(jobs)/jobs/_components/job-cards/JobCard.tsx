// "use client";

// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import { Bookmark, Bot } from "lucide-react";
// import MatchScoreCircle from "./MatchScoreCircle";

// interface JobCardProps {
//   id: string; // ✅ ADD THIS
//   title: string;
//   company: string;
//   location: string;
//   logo: string;
//   type: string;
//   salary: string;
//   time: string;
//   matchScore: number;
//   matchText: string;
//   highlights?: string[];
// }

// export default function JobCard(props: JobCardProps) {
//   const router = useRouter();
//   // router.push(`/jobs/${job.id}`);

//   return (
//     <div className="bg-white border rounded-xl px-5 py-4 flex justify-between items-center">
//       {/* LEFT SIDE — NO CHANGE */}
//       <div className="flex gap-4">
//         <div className="w-10 h-10 rounded-lg border flex items-center justify-center">
//           <Image src={props.logo} alt={props.company} width={26} height={26} />
//         </div>

//         <div>
//           <h3 className="font-semibold text-sm">{props.title}</h3>
//           <p className="text-sm text-gray-500">
//             {props.company} • {props.location}
//           </p>

//           <div className="flex gap-2 mt-2 text-xs">
//             <span className="px-2 py-0.5 bg-gray-100 rounded-full">{props.type}</span>
//             <span className="px-2 py-0.5 bg-gray-100 rounded-full">{props.salary}</span>
//             <span className="px-2 py-0.5 bg-gray-100 rounded-full">{props.time}</span>
//           </div>
//         </div>
//       </div>

//       {/* RIGHT SIDE — NO UI CHANGE */}
//       <div className="flex items-center gap-3">
//         <MatchScoreCircle value={props.matchScore} />

//         <div className="text-sm">
//           <p className="font-medium">Match Score</p>
//           <p className="text-gray-500">{props.matchText}</p>
//         </div>

//         <Bookmark className="w-5 h-5 text-gray-400" />

//         {/* ✅ ONLY THIS CLICK ADDED */}
//         <button
//         // onClick={() => router.push(`/jobs/${job.id}`)}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
//           onClick={() => router.push(`/jobs/${props.id}`)}
//         >
//           Apply Now
//         </button>

//         <Bot className="w-5 h-5 text-blue-600" />
//       </div>
//     </div>
//   );
// }













// "use client";

// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import { Bookmark, Bot, TrendingUp, Zap } from "lucide-react";
// import MatchScoreCircle from "./MatchScoreCircle";

// interface JobCardProps {
//   id: string;
//   title: string;
//   company: string;
//   location: string;
//   logo: string;
//   type: string;
//   salary: string;
//   time: string;
//   matchScore: number;
//   matchText: string;
//   highlights?: string[];

//   // ✅ ADDED ONLY
//   roleTrending?: boolean;
//   highHiring?: boolean;
// }

// export default function JobCard(props: JobCardProps) {
//   const router = useRouter();

//   return (
//     <div className="bg-white border rounded-xl px-5 py-4 flex justify-between items-center">
//       {/* LEFT SIDE */}
//       <div className="flex gap-4">
//         <div className="w-10 h-10 rounded-lg border flex items-center justify-center">
//           <Image src={props.logo} alt={props.company} width={26} height={26} />
//         </div>

//         <div>
//           <h3 className="font-semibold text-sm">{props.title}</h3>
//           <p className="text-sm text-gray-500">
//             {props.company} • {props.location}
//           </p>

//           {/* EXISTING PILLS */}
//           <div className="flex gap-2 mt-2 text-xs">
//             <span className="px-2 py-0.5 bg-gray-100 rounded-full">
//               {props.type}
//             </span>
//             <span className="px-2 py-0.5 bg-gray-100 rounded-full">
//               {props.salary}
//             </span>
//             <span className="px-2 py-0.5 bg-gray-100 rounded-full">
//               {props.time}
//             </span>
//           </div>

//           {/* ✅ NEW PILLS (ONLY ADDITION) */}
//           <div className="flex gap-2 mt-2 text-xs">
//             {props.roleTrending && (
//               <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
//                 <TrendingUp className="w-3 h-3" />
//                 Role trending in Hyderabad
//               </span>
//             )}

//             {props.highHiring && (
//               <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
//                 <Zap className="w-3 h-3" />
//                 High hiring probability
//               </span>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* RIGHT SIDE */}
//       <div className="flex items-center gap-3">
//         <MatchScoreCircle value={props.matchScore} />

//         <div className="text-sm">
//           <p className="font-medium">Match Score</p>
//           <p className="text-gray-500">{props.matchText}</p>
//         </div>

//         <Bookmark className="w-5 h-5 text-gray-400" />

//         <button
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
//           onClick={() => router.push(`/jobs/${props.id}`)}
//         >
//           Apply Now
//         </button>

//         <Bot className="w-5 h-5 text-blue-600" />
//       </div>
//     </div>
//   );
// }





// "use client";

// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import { Bookmark, Bot, TrendingUp, Zap } from "lucide-react";
// import MatchScoreCircle from "./MatchScoreCircle";
// import { useEffect, useState } from "react";

// interface JobCardProps {
//   id: string;
//   title: string;
//   company: string;
//   location: string;
//   logo: string;
//   type: string;
//   salary: string;
//   time: string;
//   matchScore: number;
//   matchText: string;
//   highlights?: string[];
//   roleTrending?: boolean;
//   highHiring?: boolean;
// }

// export default function JobCard(props: JobCardProps) {
//   const router = useRouter();
//   const [isApplied, setIsApplied] = useState(false);

//   // ✅ CHECK IF JOB IS APPLIED
//   useEffect(() => {
//     const stored = localStorage.getItem("appliedJobs");
//     const appliedJobs = stored ? JSON.parse(stored) : [];

//     setIsApplied(appliedJobs.includes(props.id));
//   }, [props.id]);

//   return (
//     <div className="bg-white border rounded-xl px-5 py-4 flex justify-between items-center">
//       {/* LEFT SIDE */}
//       <div className="flex gap-4">
//         <div className="w-10 h-10 rounded-lg border flex items-center justify-center">
//           <Image src={props.logo} alt={props.company} width={26} height={26} />
//         </div>

//         <div>
//           <h3 className="font-semibold text-sm">{props.title}</h3>
//           <p className="text-sm text-gray-500">
//             {props.company} • {props.location}
//           </p>

//           <div className="flex gap-2 mt-2 text-xs">
//             <span className="px-2 py-0.5 bg-gray-100 rounded-full">
//               {props.type}
//             </span>
//             <span className="px-2 py-0.5 bg-gray-100 rounded-full">
//               {props.salary}
//             </span>
//             <span className="px-2 py-0.5 bg-gray-100 rounded-full">
//               {props.time}
//             </span>
//           </div>

//           <div className="flex gap-2 mt-2 text-xs">
//             {props.roleTrending && (
//               <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
//                 <TrendingUp className="w-3 h-3" />
//                 Role trending in Hyderabad
//               </span>
//             )}

//             {props.highHiring && (
//               <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
//                 <Zap className="w-3 h-3" />
//                 High hiring probability
//               </span>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* RIGHT SIDE */}
//       <div className="flex items-center gap-3">
//         <MatchScoreCircle value={props.matchScore} />

//         <div className="text-sm">
//           <p className="font-medium">Match Score</p>
//           <p className="text-gray-500">{props.matchText}</p>
//         </div>

//         <Bookmark className="w-5 h-5 text-gray-400" />

//         {/* ✅ BUTTON UI SAME, TEXT CHANGES */}
//         <button
//           className={`px-4 py-2 rounded-lg text-sm ${
//             isApplied
//               ? "bg-blue-200 text-black"
//               : "bg-blue-600 text-white"
//           }`}
//           onClick={() => {
//             if (!isApplied) {
//               router.push(`/jobs/${props.id}`);
//             }
//           }}
//         >
//           {isApplied ? "Applied" : "Apply Now"}
//         </button>

//         <Bot className="w-5 h-5 text-blue-600" />
//       </div>
//     </div>
//   );
// }







"use client";
import { Heart, MapPin, Sparkles, Clock, Briefcase, IndianRupee, Layers } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  isJobSaved,
  toggleJobSaved,
} from "@/utils/jobTracking";
import ApplicationModal, { ApplicationData } from "./ApplicationModal";
import { applyToJob } from "@/utils/jobApplication";

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  logo?: string;
  type: string;
  mode?: string;
  salary?: string;
  time: string;
  posted_date?: string;
  created_at?: string | null;
  matchScore?: number;
  matchText?: string;
  url?: string;
  application_url?: string;
  recruiter_id?: string;
  source?: string;
  company_website?: string;
  skills?: string;
  experience?: string;
  experience_level?: string;
  description?: string;
  roleTrending?: boolean;
  highHiring?: boolean;
  is_applied?: boolean;
  onBotClick: () => void;
}

export default function JobCard(props: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Map experience level to color classes
  const getExperienceLevelColors = (level?: string): { bg: string; text: string } => {
    if (!level) return { bg: '', text: '' };
    const levelLower = level.toLowerCase();

    if (levelLower.includes('intern') || levelLower.includes('new grad')) {
      return { bg: 'bg-blue-50', text: 'text-blue-700' };
    } else if (levelLower.includes('entry')) {
      return { bg: 'bg-sky-50', text: 'text-sky-700' };
    } else if (levelLower.includes('mid')) {
      return { bg: 'bg-indigo-50', text: 'text-indigo-700' };
    } else if (levelLower.includes('senior')) {
      return { bg: 'bg-purple-50', text: 'text-purple-700' };
    } else if (levelLower.includes('lead') || levelLower.includes('staff')) {
      return { bg: 'bg-orange-50', text: 'text-orange-700' };
    } else if (levelLower.includes('director') || levelLower.includes('executive')) {
      return { bg: 'bg-red-50', text: 'text-red-700' };
    }
    return { bg: '', text: '' };
  };

  // Derive experience level from years string (e.g., "3-5 years" → "Mid Level")
  const deriveExperienceLevelFromYears = (yearsStr?: string): string | null => {
    if (!yearsStr) return null;

    // Extract the LAST number from the string to handle ranges like "3-5 years"
    const matches = yearsStr.match(/\d+/g);
    if (!matches || matches.length === 0) return null;

    // Use the last number (highest end of range)
    const years = parseInt(matches[matches.length - 1], 10);

    if (years <= 1) return 'Intern/New Grad';
    if (years <= 3) return 'Entry Level';
    if (years <= 6) return 'Mid Level';
    if (years <= 10) return 'Senior Level';
    return 'Lead/Staff';
  };

  // Format posted date to relative time (e.g., "6 hours ago")
  const formatPostedTime = (dateStr?: string | null): string => {
    if (!dateStr) return 'Recently';

    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor(diffMs / (1000 * 60));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
      const weeks = Math.floor(diffDays / 7);
      if (diffDays < 30) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } catch {
      return 'Recently';
    }
  };

  // Load applied state from backend API response (props.is_applied)
  // Backend is the source of truth - don't use localStorage
  useEffect(() => {
    setIsSaved(isJobSaved(props.id));

    // Determine job type
    const externalUrl = props.url || props.application_url;
    const isPortalJob = !!props.recruiter_id && !externalUrl;

    // Aggregated jobs should NEVER show "Applied"
    if (externalUrl) {
      setIsApplied(false);
      return;
    }

    // Portal jobs: Trust backend's is_applied flag from API
    if (isPortalJob) {
      // Backend tells us applied status via props.is_applied
      setIsApplied(!!props.is_applied);
    }
  }, [props.id, props.url, props.application_url, props.recruiter_id, props.is_applied]);

  // No need for storage event listener - backend is the source of truth
  // When backend updates applied status, props.is_applied will be updated via API refetch

  // Restore scroll when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      document.body.style.overflow = "unset";
    }
  }, [isModalOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleApplyNow = async () => {
    // Don't block if already applied - let API handle it
    if (isSubmitting) return;

    // Step 1: Determine job type based on URL availability
    const externalUrl = props.url || props.application_url;
    const isPortalJob = !!props.recruiter_id && !externalUrl;

    // Step 2a: External job (aggregated) → Redirect only (no applied tracking)
    if (externalUrl) {
      const opened = window.open(externalUrl, "_blank");
      if (!opened) {
        toast.error("Could not open link. Please check popup blocker settings.");
        return;
      }
      toast.success(`Redirecting to ${props.source || "Company Site"}...`);
      return;
    }

    // Step 2b: Portal job (recruiter with no URL) → Open modal
    if (isPortalJob) {
      setIsModalOpen(true);
      // Prevent background scroll
      document.body.style.overflow = "hidden";
      return;
    }

    toast.error("Job application method not configured");
  };

  const handleModalSubmit = async (applicationData: ApplicationData) => {
    setIsSubmitting(true);
    try {
      // Backend is source of truth - follow its response
      const result = await applyToJob(props.id, applicationData);

      if (result?.success && result.applied === true) {
        // Application was successful
        setIsApplied(true);
        setIsModalOpen(false);
        // Restore background scroll
        document.body.style.overflow = "unset";
        toast.success("Application submitted successfully!");
      } else if (result?.success && result.applied === false) {
        // Already applied (409)
        setIsApplied(true);
        setIsModalOpen(false);
        document.body.style.overflow = "unset";
        toast.info("You've already applied to this job");
      } else {
        // Application failed
        toast.error("Application failed. Please try again.");
      }
    } catch (error) {
      console.error("Error in modal submission:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveJob = () => {
    const newSavedState = toggleJobSaved(
      props.id,
      props.title,
      props.company,
      props.location,
      props.type
    );
    setIsSaved(newSavedState);

    if (newSavedState) {
      toast.success("Job saved!");
    } else {
      toast.info("Job removed from saved");
    }
  };

  const level = deriveExperienceLevelFromYears(props.experience) || props.experience_level;
  const levelColors = getExperienceLevelColors(level);

  // Parse skills string into an array (comma-separated), show first 4
  const skillChips = props.skills
    ? props.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4)
    : [];

  // "New" badge if posted within last 24 hours
  const isNew = (() => {
    const dateStr = props.posted_date || props.created_at;
    if (!dateStr) return false;
    try {
      return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  })();

  // Source label (LinkedIn, Indeed, etc.)
  const sourceLabel = props.source && props.source !== "portal" ? props.source : "";

  // Work mode → color mapping
  const getModeStyle = (mode?: string) => {
    if (!mode) return null;
    const m = mode.toLowerCase();
    if (m.includes("remote")) return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" };
    if (m.includes("hybrid")) return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" };
    return { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
  };
  const modeStyle = getModeStyle(props.mode);

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 hover:border-[#2557a7]/25 hover:shadow-[0_8px_30px_rgba(37,87,167,0.10)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">

      {/* Left accent bar — appears on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-[#2557a7] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-l-2xl" />

      <div className="p-5 pl-6">

        {/* ── ROW 1: Logo · Title · Time · Save ── */}
        <div className="flex gap-3.5">

          {/* Company Logo */}
          <div className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border border-gray-100 bg-linear-to-br from-gray-50 to-gray-100 shadow-sm overflow-hidden">
            {props.logo && props.logo.trim() && !logoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={props.logo} alt={props.company} width={40} height={40}
                onError={() => setLogoError(true)} className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-base font-extrabold text-[#2557a7] select-none">
                {(props.company || "J").charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Title + Company */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug truncate group-hover:text-[#2557a7] transition-colors duration-150">
                  {props.title || "Job Title"}
                </h3>
                <p className="text-[13px] text-gray-400 mt-0.5 truncate">
                  {props.company || "Company"}
                </p>
              </div>

              {/* Right: New badge · Time · Save */}
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                {isNew && (
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full tracking-widest uppercase">
                    New
                  </span>
                )}
                {(props.posted_date || props.created_at) && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400 whitespace-nowrap">
                    <Clock size={10} className="text-gray-300" />
                    {formatPostedTime(props.posted_date || props.created_at)}
                  </span>
                )}
                <button type="button" onClick={handleSaveJob}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors ml-0.5"
                  title={isSaved ? "Remove from saved" : "Save job"}>
                  <Heart size={15} className={`transition-all ${isSaved ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-red-400"}`} />
                </button>
              </div>
            </div>

            {/* ── Chips row: Location · Type · Mode · Level ── */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {props.location && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.75 bg-gray-50 border border-gray-100 rounded-full text-[11px] text-gray-500 font-medium">
                  <MapPin size={10} className="text-gray-400" />{props.location}
                </span>
              )}
              {props.type && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.75 bg-blue-50 border border-blue-100 rounded-full text-[11px] text-[#2557a7] font-semibold">
                  <Briefcase size={10} />{props.type}
                </span>
              )}
              {props.mode && modeStyle && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.75 ${modeStyle.bg} border border-opacity-20 rounded-full text-[11px] ${modeStyle.text} font-semibold`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${modeStyle.dot}`} />
                  {props.mode}
                </span>
              )}
              {level && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.75 rounded-full text-[11px] font-semibold border border-opacity-10 ${levelColors.bg || "bg-gray-50"} ${levelColors.text || "text-gray-500"}`}>
                  <Layers size={10} />{level}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── ROW 2: Experience · Salary ── */}
        {(props.experience || props.salary) && (
          <div className="flex items-center gap-4 mt-3 px-3 py-2 bg-gray-50 rounded-xl">
            {props.experience && (
              <span className="flex items-center gap-1.5 text-[12px] text-gray-600 font-medium">
                <Briefcase size={12} className="text-gray-400 shrink-0" />{props.experience}
              </span>
            )}
            {props.salary && (
              <span className="flex items-center gap-1 text-[13px] font-extrabold text-gray-900">
                <IndianRupee size={13} className="text-[#2557a7] shrink-0" />
                <span className="text-gray-800">{props.salary}</span>
              </span>
            )}
            {sourceLabel && (
              <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                via {sourceLabel}
              </span>
            )}
          </div>
        )}

        {/* ── ROW 3: Skills ── */}
        {skillChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {skillChips.map((skill) => (
              <span key={skill}
                className="px-2.5 py-0.75 bg-[#f0f4ff] text-[#2557a7] text-[11px] font-semibold rounded-full border border-[#dce8ff]">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* ── ROW 4: Actions ── */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-gray-100">
          <button type="button" onClick={props.onBotClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.75 rounded-xl text-[11px] font-bold text-[#2557a7] border border-[#2557a7]/20 bg-[#f5f8ff] hover:bg-[#eaf0ff] hover:border-[#2557a7]/40 transition-all"
            title="Chat with Nancy">
            <Sparkles size={12} />Ask Nancy
          </button>

          <button type="button" onClick={handleApplyNow}
            disabled={isSubmitting || isApplied}
            className={`px-6 py-1.75 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all duration-150 ${
              isSubmitting
                ? "bg-[#2557a7]/50 text-white cursor-wait"
                : isApplied
                ? "bg-green-50 text-green-600 border border-green-200 cursor-default"
                : "bg-[#2557a7] hover:bg-[#1e4a96] text-white shadow-md shadow-[#2557a7]/20 hover:shadow-[#2557a7]/30 active:scale-[0.98]"
            }`}>
            {isSubmitting ? "Applying…" : isApplied ? "Applied ✓" : "Apply Now"}
          </button>
        </div>
      </div>

      <ApplicationModal
        isOpen={isModalOpen}
        jobTitle={props.title}
        jobCompany={props.company}
        location={props.location}
        jobType={props.type}
        recruiterName={props.recruiter_id ? `Recruiter ID: ${props.recruiter_id}` : "Available"}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}












