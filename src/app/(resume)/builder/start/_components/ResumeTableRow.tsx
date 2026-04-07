// import { CircleCheck, Download, EllipsisVertical, Share2, Sparkles, SquarePen, Star, Trash2 } from "lucide-react";
// import { Resume } from "../page";

// const ResumeTableRow = ({ 
//   resume, 
//   index,
//   isDropdownOpen,
//   onToggleDropdown,
//   onDelete,
//   onDownload,
//   downloading
// }: { 
//   resume: Resume;
//   index: number;
//   isDropdownOpen: boolean;
//   onToggleDropdown: () => void;
//   onDelete: () => void;
//   onDownload: () => void;
//   downloading: boolean;
// }) => (
//   <tr className="border-t border-gray-400 hover:bg-gray-50 transition">
//     <td className="p-4">
//       <div className="flex items-center gap-4">
//         <div className="w-10 h-10 bg-[#2200ff]/10 text-[#2200ff] rounded-lg flex text-sm items-center justify-center font-semibold">
//           {resume.initials}
//         </div>
//         <div>
//           <div className='flex gap-2'>
//             <p className="font-semibold block">{resume.name}</p>
//             {resume.primary && <CircleCheck className='w-4 h-4 text-[#2200ff]' />}
//           </div>
//           <div className="flex items-center gap-2 mt-1">
//             {resume.primary && (
//               <span className="flex items-center gap-1 text-xs text-[#2200ff] font-bold px-2 py-0.5 rounded-full">
//                 Primary
//               </span>
//             )}
//             <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
//               <Sparkles className="w-3 h-3" />
//               AI Analysis Complete
//             </span>
//           </div>
//         </div>
//       </div>
//     </td>

//     <td className="p-4 text-black">{resume.job}</td>

//     <td className="p-4">
//       <div className="flex gap-2 items-center">
//         <div className="relative w-16 h-16">
//           <svg viewBox="0 0 36 36" className="w-full h-full">
//             <path
//               className="text-gray-200"
//               strokeWidth="3"
//               fill="none"
//               stroke="currentColor"
//               d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
//             />
//             <path
//               className="text-[#008957]"
//               strokeWidth="3"
//               strokeDasharray={`${resume.score}, 100`}
//               fill="none"
//               strokeLinecap="round"
//               stroke="currentColor"
//               d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
//             />
//           </svg>
//           <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-700">
//             {resume.score}%
//           </div>
//         </div>
//         <button className='bg-[#2200ff]/60 px-2 py-1.5 cursor-pointer text-sm rounded-lg text-white hover:bg-[#2200ff]/80'>
//           Optimize
//         </button>
//       </div>
//     </td>

//     <td className="p-4 text-gray-600">{resume.modified}</td>
//     <td className="p-4 text-gray-600">{resume.created}</td>
//     <td className="p-4 relative">
//       <button
//         onClick={onToggleDropdown}
//         className="p-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition"
//       >
//         <EllipsisVertical className="w-5 h-5 text-gray-600" />
//       </button>
//       {isDropdownOpen && (
//         <div className="absolute right-10 top-12 bg-white border border-gray-200 rounded-xl shadow-lg w-56 z-20">
//           <ul className="py-1 text-sm text-gray-700">
//             <li className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer">
//               <Star className="w-4 h-4" /> Set as Primary
//             </li>
//             <li className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer">
//               <SquarePen className="w-4 h-4" /> Edit Resume Info
//             </li>
//             <li className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer">
//               <Sparkles className="w-4 h-4" /> Optimize for Job
//             </li>
//             <li className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer">
//               <Share2 className="w-4 h-4" /> Share
//             </li>
//             <li
//               onClick={onDownload}
//               className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer transition"
//             >
//               {downloading ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//                   <span>Downloading...</span>
//                 </>
//               ) : (
//                 <>
//                   <Download className="w-4 h-4" />
//                   <span>Download</span>
//                 </>
//               )}
//             </li>
//             <li
//               onClick={onDelete}
//               className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 text-red-600 cursor-pointer"
//             >
//               <Trash2 className="w-4 h-4" /> Delete
//             </li>
//           </ul>
//         </div>
//       )}
//     </td>
//   </tr>
// );

// export default ResumeTableRow


"use client";
import { CircleCheck, Download, EllipsisVertical, Share2, Sparkles, SquarePen, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Resume } from "../page";
import { formatDateResume } from "@/utils/formatDateResume";
import logger from "@/lib/logger";

const ResumeTableRow = ({
  resume,
  index,
  isDropdownOpen,
  onToggleDropdown,
  onDelete,
  onDownload,
  downloading
}: {
  resume: Resume;
  index: number;
  isDropdownOpen: boolean;
  onToggleDropdown: () => void;
  onDelete: () => void;
  onDownload: () => void;
  downloading: boolean;
}) => {
  const router = useRouter();
  const displayScore = resume.score || 0;

  // ✅ Dynamic time formatting that updates every minute
  const [createdTime, setCreatedTime] = useState(formatDateResume(resume.createdAt ?? resume.created));
  const [modifiedTime, setModifiedTime] = useState(formatDateResume(resume.updatedAt ?? resume.modified));

  useEffect(() => {
    // Update the time display every minute
    const interval = setInterval(() => {
      setCreatedTime(formatDateResume(resume.createdAt ?? resume.created));
      setModifiedTime(formatDateResume(resume.updatedAt ?? resume.modified));
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, [resume.createdAt, resume.updatedAt]);

  // ✅ Handle Edit Resume Info click
  const handleEditResume = () => {
    logger.info("Editing resume:", resume.id);

    // ✅ Clear any cached resume data to force fresh load from backend
    localStorage.removeItem("resumeData");

    // Store the resume ID in localStorage for consistency
    localStorage.setItem("current_resume_id", resume.id);

    // Navigate to builder page with resume ID in URL
    router.push(`/builder/creation/${resume.id}`);

    // Close the dropdown
    onToggleDropdown();
  };
  const getInitials = (fullname: string) => {
    return fullname.charAt(0).toUpperCase();
  };

  const displayInitials = getInitials(resume.name || '');

  return (
    <tr className="border-t border-gray-400 hover:bg-gray-50 transition">
      <td className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#2200ff]/10 text-[#2200ff] rounded-lg flex text-sm items-center justify-center font-semibold">
            {displayInitials}
          </div>
          <div>
            <div className='flex gap-2'>
              <p className="font-semibold block">
  {resume.name}
</p>
              {resume.primary && <CircleCheck className='w-4 h-4 text-[#2200ff]' />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {resume.primary && (
                <span className="flex items-center gap-1 text-xs text-[#2200ff] font-bold px-2 py-0.5 rounded-full">
                  Primary
                </span>
              )}
              {/* <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                AI Analysis Complete
              </span> */}
            </div>
          </div>
        </div>
      </td>

      {/* <td className="p-4 text-black">{resume.job}</td> */}

      <td className="p-4">
        <div className="flex gap-2 items-center">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <path
                className="text-gray-200"
                strokeWidth="3"
                fill="none"
                stroke="currentColor"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#008957]"
                strokeWidth="3"
                strokeDasharray={`${displayScore}, 100`}
                fill="none"
                strokeLinecap="round"
                stroke="currentColor"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-700">
              {displayScore}%
            </div>
          </div>
          {/* <button className='bg-[#2200ff]/60 px-2 py-1.5 cursor-pointer text-sm rounded-lg text-white hover:bg-[#2200ff]/80'>
            Optimize
          </button> */}
        </div>
      </td>

      <td className="p-4 text-gray-600">{modifiedTime}</td>
      <td className="p-4 text-gray-600">{createdTime}</td>
      <td className="p-4 relative">
        <button
          onClick={onToggleDropdown}
          className="p-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition"
        >
          <EllipsisVertical className="w-5 h-5 text-gray-600" />
        </button>
        {isDropdownOpen && (
          <div className="absolute right-10 top-12 bg-white border border-gray-200 rounded-xl shadow-lg w-56 z-20">
            <ul className="py-1 text-sm text-gray-700">
              <li className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer">
                <Star className="w-4 h-4" /> Set as Primary
              </li>
              
              {/* ✅ Edit Resume Info - Now navigates to builder */}
              <li 
                onClick={handleEditResume}
                className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
              >
                <SquarePen className="w-4 h-4" /> Edit Resume Info
              </li>
              
              <li className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer">
                <Sparkles className="w-4 h-4" /> Optimize for Job
              </li>
              <li className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer">
                <Share2 className="w-4 h-4" /> Share
              </li>
              <li
                onClick={onDownload}
                className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer transition"
              >
                {downloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </>
                )}
              </li>
              {/* <li
                onClick={onDelete}
                className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 text-red-600 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </li> */}
            </ul>
          </div>
        )}
      </td>
    </tr>
  );
};

export default ResumeTableRow;
