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

  // Debug: Log logo prop to see what's being passed
  useEffect(() => {
    if (props.logo) {
      console.log(`✅ Job "${props.title}" has logo:`, props.logo);
    } else {
      console.log(`❌ Job "${props.title}" has NO logo (using company initial)`);
    }
  }, [props.title, props.logo]);

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

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(37,87,167,0.10)] hover:border-[#2557a7]/25 transition-all duration-250 overflow-hidden">

      {/* TOP ACCENT BAR — subtle brand line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#2557a7]/60 via-[#2557a7]/20 to-transparent" />

      <div className="p-4">
        {/* ROW 1: Logo + Title + Company + Save + Time */}
        <div className="flex gap-3">
          {/* Logo */}
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
            {props.logo && props.logo.trim() && !logoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={props.logo}
                alt={props.company}
                width={38}
                height={38}
                onError={() => setLogoError(true)}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-[15px] font-bold text-[#2557a7] select-none">
                {(props.company || "J").charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Title + Company + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-gray-900 leading-snug capitalize truncate group-hover:text-[#2557a7] transition-colors duration-150">
                  {props.title || "Job Title"}
                </h3>
                <p className="text-[13px] text-gray-400 mt-0.5 font-medium truncate">
                  {props.company || "Company"}
                </p>
              </div>

              {/* Right: Time + Save */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {(props.posted_date || props.created_at) && (
                  <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {formatPostedTime(props.posted_date || props.created_at)}
                  </span>
                )}
                <button
                  type="button"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors duration-150"
                  title={isSaved ? "Remove from saved" : "Save job"}
                  onClick={handleSaveJob}
                >
                  <Heart
                    size={15}
                    className={`transition-all duration-200 ${
                      isSaved ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-red-400"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Info chips — location, type, mode */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {props.location && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-[11px] text-gray-500 font-medium">
              <MapPin size={10} className="text-gray-400" />
              {props.location}
            </span>
          )}
          {props.type && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-[11px] text-gray-500 font-medium">
              <Clock size={10} className="text-gray-400" />
              {props.type}
            </span>
          )}
          {props.mode && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2557a7]/5 border border-[#2557a7]/12 rounded-full text-[11px] text-[#2557a7] font-medium">
              {props.mode}
            </span>
          )}
          {level && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${levelColors.bg || "bg-gray-50"} ${levelColors.text || "text-gray-500"} border-current/10`}>
              <Layers size={10} />
              {level}
            </span>
          )}
        </div>

        {/* ROW 3: Experience + Salary */}
        {(props.experience || props.salary) && (
          <div className="flex items-center gap-3 mt-2">
            {props.experience && (
              <span className="flex items-center gap-1.5 text-[12px] text-gray-500">
                <Briefcase size={12} className="text-gray-400" />
                {props.experience}
              </span>
            )}
            {props.salary && (
              <span className="flex items-center gap-1 text-[12px] font-semibold text-gray-700">
                <IndianRupee size={12} className="text-gray-500" />
                {props.salary}
              </span>
            )}
          </div>
        )}

        {/* ROW 4: Action Buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          {/* Ask Nancy */}
          <button
            type="button"
            onClick={props.onBotClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium text-[#2557a7] border border-[#2557a7]/20 hover:bg-[#2557a7]/5 hover:border-[#2557a7]/40 transition-all duration-150"
            title="Chat with Nancy"
          >
            <Sparkles size={12} className="text-[#2557a7]" />
            Ask Nancy
          </button>

          {/* Apply Now */}
          <button
            type="button"
            className={`px-5 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all duration-150 ${
              isSubmitting
                ? "bg-[#2557a7]/50 text-white cursor-wait"
                : isApplied
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-default"
                : "bg-[#2557a7] text-white hover:bg-[#1a4a96] shadow-sm hover:shadow-md"
            }`}
            onClick={handleApplyNow}
            disabled={isSubmitting || isApplied}
            title={isApplied ? "Already applied" : "Apply to this job"}
          >
            {isSubmitting ? "Applying..." : isApplied ? "Applied ✓" : "Apply Now"}
          </button>
        </div>
      </div>

      {/* Application Modal */}
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












