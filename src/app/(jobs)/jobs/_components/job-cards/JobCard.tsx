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

import Image from "next/image";
import { Bookmark, Bot, TrendingUp, Zap } from "lucide-react";
import MatchScoreCircle from "./MatchScoreCircle";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  isJobSaved,
  toggleJobSaved,
} from "@/utils/jobTracking";

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  logo?: string;
  type: string;
  salary?: string;
  time: string;
  matchScore?: number;
  matchText?: string;
  url?: string;
  roleTrending?: boolean;
  highHiring?: boolean;
  onBotClick: () => void;
}

export default function JobCard(props: JobCardProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(isJobSaved(props.id));
  }, [props.id]);

  const handleApplyNow = () => {
    if (!props.url) {
      toast.error("Job application link not available");
      return;
    }

    toast.success("Application submitted! Redirecting to job portal...");

    // ✅ OPEN JOB URL IN NEW TAB
    window.open(props.url, "_blank");
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
    <div className="bg-white border rounded-xl px-5 py-4 flex justify-between items-center hover:shadow-md transition-shadow">
      {/* LEFT */}
      <div className="flex gap-4 flex-1">
        <div className="w-10 h-10 rounded-lg border flex items-center justify-center bg-gray-50 flex-shrink-0">
          {props.logo ? (
            <Image
              src={props.logo}
              alt={props.company}
              width={26}
              height={26}
              onError={(e) => {
                e.currentTarget.src = "/company.png";
              }}
            />
          ) : (
            <span className="text-xs font-bold text-gray-600">
              {props.company.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-900">{props.title}</h3>
          <p className="text-sm text-gray-500">
            {props.company} • {props.location}
          </p>

          <div className="flex gap-2 mt-2 text-xs flex-wrap">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
              {props.type}
            </span>
            {props.salary && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                {props.salary}
              </span>
            )}
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
              {props.time}
            </span>
          </div>

          <div className="flex gap-2 mt-2 text-xs flex-wrap">
            {props.roleTrending && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                <TrendingUp className="w-3 h-3" />
                Role trending
              </span>
            )}
            {props.highHiring && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                <Zap className="w-3 h-3" />
                High hiring
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {props.matchScore && (
          <>
            <MatchScoreCircle value={props.matchScore} />
            <div className="text-sm text-center w-16">
              <p className="font-medium text-gray-900">{props.matchScore}%</p>
              <p className="text-xs text-gray-500">Match</p>
            </div>
          </>
        )}

        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title={isSaved ? "Remove from saved" : "Save job"}
          onClick={handleSaveJob}
        >
          <Bookmark 
            className={`w-5 h-5 transition ${
              isSaved
                ? "fill-blue-600 text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          />
        </button>

        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700`}
          onClick={handleApplyNow}
          title="Apply to this job"
        >
          Apply Now
        </button>

        <button
          onClick={props.onBotClick}
          className="p-2 hover:bg-blue-50 rounded-lg transition"
          title="Chat with assistant"
        >
          <Bot className="w-5 h-5 text-blue-600 hover:text-blue-700" />
        </button>
      </div>
    </div>
  );
}












