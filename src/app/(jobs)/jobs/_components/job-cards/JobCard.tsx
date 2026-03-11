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


  return (
    <div className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-300 hover:cursor-pointer transition-all duration-200">
      {/* HEADER: Logo + Title/Company + Save Button */}
      <div className="flex gap-4 mb-4">
        {/* Logo */}
        <div className="h-12 w-12 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 font-semibold rounded-lg flex-shrink-0">
          {props.logo && props.logo.trim() && !logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.logo}
              alt={props.company}
              width={40}
              height={40}
              onError={() => setLogoError(true)}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <span className="text-lg font-bold text-blue-600">
              {(props.company || "J").charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Title + Company Name + Save Button + Posted Time */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {props.title || "Job Title"}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(props.posted_date || props.created_at) && (
                <p className="text-xs text-green-600 font-medium whitespace-nowrap">
                  {formatPostedTime(props.posted_date || props.created_at)}
                </p>
              )}
              <button
                type="button"
                className="p-1 transition-all duration-200"
                title={isSaved ? "Remove from saved" : "Save job"}
                onClick={handleSaveJob}
              >
                <Heart
                  className={`w-5 h-5 transition-all duration-200 ${
                    isSaved
                      ? "fill-red-600 text-red-600"
                      : "text-gray-400 hover:text-red-600 hover:scale-110"
                  }`}
                />
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              {props.company || "Company"}
            </p>
          </div>
        </div>
      </div>

      {/* Job Details: Type • Location */}
      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm text-gray-700">
        {props.type && (
          <>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{props.type}</span>
            </div>
            {props.location && <span className="mx-1.5">•</span>}
          </>
        )}
        {props.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>{props.location}</span>
          </div>
        )}
      </div>

      {/* Meta Info: Entry Level • Experience • Salary */}
      <div className="mb-6 text-sm text-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          {(() => {
            const level = deriveExperienceLevelFromYears(props.experience) || props.experience_level;
            return level ? (
              <>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{level}</span>
                </div>
                {(props.experience || props.salary) && <span className="mx-1.5">•</span>}
              </>
            ) : null;
          })()}
          {props.experience && (
            <>
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span>{props.experience}</span>
              </div>
              {props.salary && <span className="mx-1.5">•</span>}
            </>
          )}
          {props.salary && (
            <div className="flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-gray-500" />
              <span>{props.salary}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 mt-4">
        {/* Ask Nancy Button */}
        <button
          type="button"
          onClick={props.onBotClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-sm whitespace-nowrap transition-all duration-200"
          title="Chat with Nancy"
        >
          <Sparkles className="h-4 w-4 text-indigo-600" />
          Ask Nancy
        </button>

        {/* Apply Now Button */}
        <button
          type="button"
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-center ${
            isSubmitting
              ? "bg-blue-400 text-white cursor-wait"
              : isApplied
              ? "bg-gray-200 text-gray-700 cursor-not-allowed opacity-60"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          onClick={handleApplyNow}
          disabled={isSubmitting || isApplied}
          title={isApplied ? "You've already applied to this job" : "Apply to this job"}
        >
          {isSubmitting ? "Applying..." : isApplied ? "Applied ✓" : "Apply Now"}
        </button>
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












