// "use client"
// import { CircleCheckBig, Plus, Upload } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { useState } from "react";
// import { createResumeWithAuth, getAllResumesUnified } from "@/api/resumeApi";
// import logger from "@/lib/logger";
// import UploadResumeModal from "./UploadResumeModal";


// const EmptyState = ({ selected, onSelect }: {
//   selected: string | null;
//   onSelect: (id: string) => void;
// }) => {
//   const router = useRouter();
//   const [isCreating, setIsCreating] = useState(false);
//   const [showUploadModal, setShowUploadModal] = useState(false);


//   const handleBuilderClick = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     onSelect("builder");
//     setIsCreating(true);

//     try {
//       const { builder_resumes } = await getAllResumesUnified();

//       if (builder_resumes.length > 0) {
//         const resume = builder_resumes[0] as { id: string };
//         localStorage.setItem("cached_resume_data", JSON.stringify({ resumeId: resume.id, data: resume }));
//         localStorage.setItem("current_resume_id", resume.id);
//       } else {
//         const newResume = await createResumeWithAuth();
//         localStorage.setItem("cached_resume_data", JSON.stringify({ resumeId: newResume.id, data: newResume }));
//         localStorage.setItem("current_resume_id", newResume.id);
//       }

//       router.push("/templates");
//     } catch (error: unknown) {
//       logger.error("Error:", error);
//       const axiosError = error as { response?: { status?: number } };
//       if (axiosError?.response?.status === 401 || axiosError?.response?.status === 403) {
//         toast.error("Please sign in to create a resume");
//         router.push("/signup");
//       } else if (error instanceof Error) {
//         toast.error(error.message);
//       } else {
//         toast.error("Failed to create resume. Please try again.");
//       }
//       setIsCreating(false);
//     }
//   };

//   const handleUploadClick = (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     onSelect("upload");
//     setShowUploadModal(true);
//   };

//   return (
//     <>
//       <UploadResumeModal
//         isOpen={showUploadModal}
//         onClose={() => { setShowUploadModal(false); onSelect(""); }}
//       />

//       <div className="flex flex-col items-center px-6 pb-10">

//         {/* Cards */}
//         <div className="grid md:grid-cols-2 gap-5 w-full max-w-3xl">

//           {/* ── Build from scratch ── */}
//           <div
//             onClick={handleBuilderClick}
//             className={`relative cursor-pointer bg-white rounded-2xl flex flex-col justify-between overflow-hidden transition-all
//               border-2 shadow-sm hover:shadow-md
//               ${selected === "builder" ? "border-[#2557a7]" : "border-gray-200 hover:border-blue-200"}
//               ${isCreating ? "opacity-75 pointer-events-none" : ""}`}
//           >
//             {/* Top accent bar */}
//             <div
//               className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
//               style={{ background: "linear-gradient(to right,#5896d7,#1f4e98)" }}
//             />

//             <div className="p-6 pt-7">
//               {/* Icon + badge row */}
//               <div className="flex items-start justify-between mb-4">
//                 <div
//                   className="w-11 h-11 flex items-center justify-center rounded-xl"
//                   style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}
//                 >
//                   {isCreating ? (
//                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   ) : (
//                     <Plus className="text-white w-5 h-5" />
//                   )}
//                 </div>
//                 <span
//                   className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
//                   style={{ background: "rgba(88,150,215,0.12)", color: "#1f4e98", border: "1px solid rgba(31,78,152,0.2)" }}
//                 >
//                   Recommended
//                 </span>
//               </div>

//               <h2 className="text-base font-bold text-gray-900 leading-snug mb-1">
//                 Build from Scratch
//               </h2>
//               <p className="text-xs text-gray-500 mb-5 leading-relaxed">
//                 {isCreating
//                   ? "Creating your resume…"
//                   : "Step-by-step builder with AI assistance to craft a standout resume."}
//               </p>

//               <ul className="space-y-2">
//                 {["ATS-friendly formatting", "Pre-designed templates", "AI-powered suggestions"].map((feat) => (
//                   <li key={feat} className="flex items-center gap-2 text-xs text-gray-600">
//                     <CircleCheckBig className="h-3.5 w-3.5 text-[#2557a7] shrink-0" />
//                     {feat}
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             {/* Resume document mockup */}
//             <div className="px-5 pb-5 pt-2 bg-linear-to-b from-white to-blue-50/50 flex justify-center">
//               <div className="relative w-52">

//                 {/* Resume card */}
//                 <div className="rounded-xl border border-gray-100 shadow-md overflow-hidden bg-white">

//                   {/* Header: avatar + name + title */}
//                   <div className="px-3 py-2.5 flex items-center gap-2"
//                     style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}>
//                     <div className="w-7 h-7 rounded-full bg-white/25 shrink-0 flex items-center justify-center">
//                       <div className="w-3 h-3 rounded-full bg-white/60" />
//                     </div>
//                     <div className="flex-1 space-y-1">
//                       <div className="h-1.5 rounded-full bg-white/80 w-3/4" />
//                       <div className="h-1 rounded-full bg-white/50 w-1/2" />
//                     </div>
//                   </div>

//                   {/* Contact row */}
//                   <div className="px-3 py-1.5 flex gap-2 border-b border-gray-100">
//                     {["w-10","w-14","w-10"].map((w,i) => (
//                       <div key={i} className={`h-1 rounded-full bg-gray-200 ${w}`} />
//                     ))}
//                   </div>

//                   <div className="px-3 py-2 space-y-2.5">
//                     {/* Experience section */}
//                     <div>
//                       <div className="h-1.5 rounded-full w-16 mb-1.5"
//                         style={{ background: "rgba(37,87,167,0.5)" }} />
//                       <div className="space-y-1">
//                         <div className="h-1 rounded-full bg-gray-200 w-full" />
//                         <div className="h-1 rounded-full bg-gray-150 w-5/6" />
//                         <div className="h-1 rounded-full bg-gray-200 w-4/6" />
//                       </div>
//                     </div>

//                     {/* Skills section */}
//                     <div>
//                       <div className="h-1.5 rounded-full w-10 mb-1.5"
//                         style={{ background: "rgba(37,87,167,0.5)" }} />
//                       <div className="flex flex-wrap gap-1">
//                         {["w-8","w-10","w-7","w-9","w-6"].map((w,i) => (
//                           <div key={i} className={`h-2.5 rounded-full ${w}`}
//                             style={{ background: "rgba(88,150,215,0.15)", border: "1px solid rgba(37,87,167,0.2)" }} />
//                         ))}
//                       </div>
//                     </div>

//                     {/* Education section */}
//                     <div>
//                       <div className="h-1.5 rounded-full w-14 mb-1.5"
//                         style={{ background: "rgba(37,87,167,0.5)" }} />
//                       <div className="space-y-1">
//                         <div className="h-1 rounded-full bg-gray-200 w-full" />
//                         <div className="h-1 rounded-full bg-gray-200 w-3/5" />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* ATS score badge — top-right corner overlay */}
//                 <div
//                   className="absolute -top-2 -right-3 flex items-center gap-1 px-2 py-1 rounded-full shadow-md"
//                   style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)", border: "2px solid #fff" }}
//                 >
//                   <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
//                     <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                   </svg>
//                   <span className="text-white text-[10px] font-black">92 ATS</span>
//                 </div>

//                 {/* AI chip — bottom-left overlay */}
//                 <div
//                   className="absolute -bottom-2 -left-2 flex items-center gap-1 px-2 py-1 rounded-full shadow-sm text-[9px] font-bold"
//                   style={{ background: "#fff", color: "#2557a7", border: "1px solid rgba(37,87,167,0.25)" }}
//                 >
//                   ✦ AI-powered
//                 </div>

//               </div>
//             </div>
//           </div>

//           {/* ── Upload existing ── */}
//           <div
//             onClick={handleUploadClick}
//             className={`relative cursor-pointer bg-white rounded-2xl flex flex-col justify-between overflow-hidden transition-all
//               border-2 shadow-sm hover:shadow-md
//               ${selected === "upload" ? "border-[#2557a7]" : "border-gray-200 hover:border-blue-200"}`}
//           >
//             {/* Top accent bar */}
//             <div
//               className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
//               style={{ background: "linear-gradient(to right,#94a3b8,#2557a7)" }}
//             />

//             <div className="p-6 pt-7">
//               {/* Icon + badge row */}
//               <div className="flex items-start justify-between mb-4">
//                 <div
//                   className="w-11 h-11 flex items-center justify-center rounded-xl"
//                   style={{ background: "linear-gradient(135deg,rgba(88,150,215,0.15),rgba(31,78,152,0.15))", border: "1px solid rgba(37,87,167,0.2)" }}
//                 >
//                   <Upload className="text-[#2557a7] w-5 h-5" />
//                 </div>
//                 <span
//                   className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-gray-500"
//                   style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}
//                 >
//                   PDF · DOCX
//                 </span>
//               </div>

//               <h2 className="text-base font-bold text-gray-900 leading-snug mb-1">
//                 Upload Existing Resume
//               </h2>
//               <p className="text-xs text-gray-500 mb-5 leading-relaxed">
//                 Already have a resume? Let AI enhance and optimize it for your next opportunity.
//               </p>

//               <ul className="space-y-2">
//                 {["AI-powered enhancement", "Instant ATS score", "Smart suggestions"].map((feat) => (
//                   <li key={feat} className="flex items-center gap-2 text-xs text-gray-600">
//                     <CircleCheckBig className="h-3.5 w-3.5 text-[#2557a7] shrink-0" />
//                     {feat}
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             {/* Upload transform visual */}
//             <div className="px-5 pb-5 pt-2 bg-linear-to-b from-white to-slate-50/60 flex justify-center">
//               <div className="relative w-full flex items-center gap-3">

//                 {/* Source file stack */}
//                 <div className="relative w-14 h-17 shrink-0">
//                   {/* Back card */}
//                   <div className="absolute top-1.5 left-1.5 right-0 bottom-0 rounded-xl border border-gray-100 bg-gray-50/80" />
//                   {/* Front card */}
//                   <div className="absolute top-0 left-0 right-1.5 bottom-1.5 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center gap-1.5">
//                     <div
//                       className="w-6 h-7 rounded flex items-center justify-center"
//                       style={{ background: "#fee2e2" }}
//                     >
//                       <span className="text-[7px] font-black text-red-400 leading-none">PDF</span>
//                     </div>
//                     <div className="space-y-0.5 w-7">
//                       <div className="h-0.5 rounded-full bg-gray-200 w-full" />
//                       <div className="h-0.5 rounded-full bg-gray-200 w-4/5" />
//                       <div className="h-0.5 rounded-full bg-gray-200 w-3/5" />
//                     </div>
//                   </div>
//                 </div>

//                 {/* AI transform arrow */}
//                 <div className="flex-1 flex flex-col items-center gap-1.5">
//                   <div className="w-full flex items-center gap-1">
//                     <div className="flex-1 h-px" style={{ background: "linear-gradient(to right,transparent,rgba(37,87,167,0.4))" }} />
//                     <div
//                       className="px-2 py-0.5 rounded-full text-[8px] font-black text-white shrink-0"
//                       style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}
//                     >
//                       ✦ AI
//                     </div>
//                     <div className="flex-1 h-px" style={{ background: "linear-gradient(to left,transparent,rgba(37,87,167,0.4))" }} />
//                   </div>
//                   {/* Format chips */}
//                   <div className="flex items-center gap-1">
//                     <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#fee2e2", color: "#ef4444" }}>PDF</span>
//                     <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#dbeafe", color: "#3b82f6" }}>DOCX</span>
//                   </div>
//                 </div>

//                 {/* Result: ATS score ring */}
//                 <div
//                   className="w-17 h-17 rounded-xl flex flex-col items-center justify-center gap-0.5 shrink-0 border"
//                   style={{ background: "linear-gradient(135deg,rgba(88,150,215,0.06),rgba(31,78,152,0.1))", borderColor: "rgba(37,87,167,0.2)" }}
//                 >
//                   <div className="relative w-9 h-9">
//                     <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
//                       <path strokeWidth="3.5" fill="none" stroke="#eff6ff"
//                         d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
//                       <path strokeWidth="3.5" strokeDasharray="92, 100" fill="none" strokeLinecap="round" stroke="#2557a7"
//                         d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
//                     </svg>
//                     <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color: "#1f4e98" }}>92</div>
//                   </div>
//                   <span className="text-[7px] font-semibold" style={{ color: "#2557a7" }}>ATS Score</span>
//                 </div>

//               </div>
//             </div>

//             {/* Bottom metric chips */}
//             <div className="px-5 pb-5 pt-0 flex gap-1.5">
//               {[
//                 { label: "+24 Keywords", bg: "rgba(88,150,215,0.12)", color: "#1f4e98" },
//                 { label: "12 Fixes",     bg: "rgba(37,87,167,0.10)",  color: "#2557a7" },
//                 { label: "+3 Sections",  bg: "rgba(31,78,152,0.08)",  color: "#1f4e98" },
//               ].map(({ label, bg, color }) => (
//                 <span key={label} className="text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: bg, color }}>
//                   {label}
//                 </span>
//               ))}
//             </div>
//           </div>

//         </div>
//       </div>
//     </>
//   );
// };


// export default EmptyState;




"use client"
import { ArrowRight, CircleCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { createResumeWithAuth, getAllResumesUnified } from "@/api/resumeApi";
import logger from "@/lib/logger";
import UploadResumeModal from "./UploadResumeModal";


const ALREADY_HAS_RESUME_MESSAGE =
  "You already have a resume in the builder. Free access allows only one builder resume — open it from Your Resumes below, or from View All.";

const iconProps = {
  width: 34, height: 34, viewBox: "0 0 24 24", fill: "none", stroke: "#1d4fa8", strokeWidth: 1.8,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
};

/** Build from Scratch tile: document with a line and a filled "+" badge */
const BuildResumeIcon = () => (
  <svg {...iconProps}>
    <path d="M12 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6l6 6v3" />
    <path d="M13 3v5a1 1 0 0 0 1 1h5" fill="#1d4fa8" />
    <path d="M8.5 13h4" />
    <circle cx="17.5" cy="17.5" r="4.5" fill="#1d4fa8" stroke="#eaf1fb" strokeWidth="1.5" />
    <path d="M17.5 15.3v4.4M15.3 17.5h4.4" stroke="#fff" strokeWidth="1.6" />
  </svg>
);

/** Upload Existing Resume tile: document with a "+" and an upload arrow */
const UploadResumeIcon = () => (
  <svg {...iconProps}>
    <path d="M13 2.5H5.5A1.5 1.5 0 0 0 4 4v15.5A1.5 1.5 0 0 0 5.5 21H12" />
    <path d="M13 2.5 18.5 8v4" />
    <path d="M13 2.5v4.5a1 1 0 0 0 1 1h4.5" />
    <path d="M6.5 13.5h5M9 11v5" />
    <path d="M17.5 22v-8M14.5 17l3-3 3 3" />
  </svg>
);

const EmptyState = ({ selected, onSelect }: {
  selected: string | null;
  onSelect: (id: string) => void;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const buildCreationUrl = (resumeId: string) => {
    const returnTo = searchParams.get("return_to");
    const params = new URLSearchParams();

    if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
      params.set("return_to", returnTo);
    }

    const query = params.toString();
    return `/builder/creation/${encodeURIComponent(resumeId)}${query ? `?${query}` : ""}`;
  };


  const handleBuilderClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect("builder");
    setIsCreating(true);

    try {
      const { builder_resumes } = await getAllResumesUnified();

      // One builder resume per user: don't open or create another one.
      if (builder_resumes.length > 0) {
        toast.info(ALREADY_HAS_RESUME_MESSAGE, { duration: 6000 });
        setIsCreating(false);
        onSelect("");
        return;
      }

      const newResume = await createResumeWithAuth();
      localStorage.setItem("cached_resume_data", JSON.stringify({ resumeId: newResume.id, data: newResume }));
      localStorage.setItem("current_resume_id", newResume.id);

      // Signal to the builder that this is a fresh start so PreviewPanel
      // skips stale localStorage template values for this render only.
      sessionStorage.setItem('builder_fresh_start', 'true');

      router.push(buildCreationUrl(newResume.id));
    } catch (error: unknown) {
      logger.error("Error:", error);
      const axiosError = error as { response?: { status?: number; data?: { detail?: unknown } } };
      const status = axiosError?.response?.status;
      // The API sends `detail` as a string, an object ({ error, message }) or an array (422). A string, or the
      // `message` of an object, is the readable reason; anything else falls back to the error's own message.
      const rawDetail = axiosError?.response?.data?.detail;
      const objectMessage = rawDetail && typeof rawDetail === "object" && !Array.isArray(rawDetail)
        ? (rawDetail as { message?: unknown }).message
        : undefined;
      const readableDetail = typeof rawDetail === "string" && rawDetail
        ? rawDetail
        : typeof objectMessage === "string" ? objectMessage : "";
      const detail = (readableDetail || (error instanceof Error ? error.message : "")).toLowerCase();
      // A 429 is a rate limit, never "you already have a resume" even if its text says "limit".
      const looksLikeSecondResume = status !== 429 && (
        detail.includes("already") ||
        detail.includes("limit") ||
        detail.includes("maximum") ||
        detail.includes("one resume") ||
        detail.includes("exists")
      );
      if (status === 401 || status === 403) {
        toast.error("Please sign in to create a resume");
        router.push("/signup");
      } else if (status === 409 || looksLikeSecondResume) {
        toast.info(ALREADY_HAS_RESUME_MESSAGE, { duration: 6000 });
        onSelect("");
      } else if (typeof objectMessage === "string" && objectMessage) {
        toast.error(objectMessage);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create resume. Please try again.");
      }
      setIsCreating(false);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect("upload");
    setShowUploadModal(true);
  };

  const features = {
    builder: ["ATS-friendly formatting", "Pre-designed templates", "AI-powered suggestions"],
    upload: ["AI-powered enhancement", "Instant ATS score", "Smart suggestions"],
  };

  const cardBase =
    "relative bg-white rounded-xl flex flex-col overflow-hidden transition-all border shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-md";

  const Checklist = ({ items }: { items: string[] }) => (
    <ul className="space-y-2.5">
      {items.map((feat) => (
        <li key={feat} className="flex items-center gap-2.5 text-[13px] text-gray-700">
          <CircleCheck className="h-4.5 w-4.5 fill-[#1d4fa8] text-white shrink-0" />
          {feat}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <UploadResumeModal
        isOpen={showUploadModal}
        onClose={() => { setShowUploadModal(false); onSelect(""); }}
      />

      <div className="grid md:grid-cols-2 gap-5 w-full">

        {/* ── Build from scratch ── */}
        <div
          className={`${cardBase}
            ${selected === "builder" ? "border-[#2557a7]" : "border-[#e3e9f2] hover:border-blue-200"}
            ${isCreating ? "opacity-75 pointer-events-none" : ""}`}
        >
          <div className="flex items-start gap-4 p-5 pb-0">
            <div className="w-14 h-14 shrink-0 flex items-center justify-center rounded-xl bg-[#eaf1fb]">
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-[#1d4fa8] border-t-transparent rounded-full animate-spin" />
              ) : (
                <BuildResumeIcon />
              )}
            </div>
            <div className="pt-0.5">
              <h2 className="text-[17px] font-semibold text-gray-900 leading-snug">Build from Scratch</h2>
              <p className="text-[13px] text-gray-600 mt-1 leading-relaxed max-w-[210px]">
                {isCreating ? "Creating your resume…" : "Create your resume step by step with AI assistance."}
              </p>
            </div>
          </div>

          <div className="relative flex-1 px-5 pt-5 pb-5 min-h-[160px]">
            <Checklist items={features.builder} />

            {/* Resume document illustration */}
            <div className="hidden sm:block absolute right-6 top-3 w-[150px]">
              <div className="absolute -left-6 top-14 w-24 h-24 rounded-full bg-[#eaf1fb]" />
              <div className="relative rounded-xl border border-[#e3e9f2] bg-white shadow-[0_8px_24px_rgba(37,87,167,0.12)] px-3.5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded bg-[#c9d6ea]" />
                  <div className="h-1.5 w-16 rounded-full bg-[#d5deec]" />
                </div>
                {["w-full", "w-11/12", "w-full", "w-3/5"].map((w, i) => (
                  <div key={i} className={`h-1.5 rounded-full bg-[#e3e9f2] mb-2 ${w}`} />
                ))}
                <div className="h-1.5 w-2/5 rounded-full bg-[#d5deec] mt-3 mb-2" />
                {["w-full", "w-4/5"].map((w, i) => (
                  <div key={i} className={`h-1.5 rounded-full bg-[#e3e9f2] mb-2 ${w}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={handleBuilderClick}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 min-w-[185px] rounded-md bg-[#1d4fa8] hover:bg-[#184488] text-white text-[13px] font-semibold transition-colors"
            >
              Build from Scratch <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Upload existing ── */}
        <div
          className={`${cardBase}
            ${selected === "upload" ? "border-[#2557a7]" : "border-[#e3e9f2] hover:border-blue-200"}`}
        >
          <div className="flex items-start gap-4 p-5 pb-0">
            <div className="w-14 h-14 shrink-0 flex items-center justify-center rounded-xl bg-[#eaf1fb]">
              <UploadResumeIcon />
            </div>
            <div className="pt-0.5">
              <h2 className="text-[17px] font-semibold text-gray-900 leading-snug">Upload Existing Resume</h2>
              <p className="text-[13px] text-gray-600 mt-1 leading-relaxed max-w-[210px]">
                Upload your resume and let AI enhance it for better results.
              </p>
            </div>
          </div>

          <div className="relative flex-1 px-5 pt-5 pb-5 min-h-[160px]">
            <Checklist items={features.upload} />

            {/* Upload illustration */}
            <svg
              className="hidden sm:block absolute right-4 top-1"
              width="150" height="160" viewBox="0 0 126 134" fill="none" aria-hidden="true"
            >
              <rect x="1" y="33" width="104" height="99" rx="7" stroke="#c5d1e6" strokeWidth="1" strokeDasharray="3 3" />
              <rect x="31" y="0" width="94" height="116" rx="10" fill="#eaf1fb" />
              <path d="M60 16H83L98 31V66A4 4 0 0 1 94 70H60A4 4 0 0 1 56 66V20A4 4 0 0 1 60 16Z" fill="#fff" stroke="#8fa3c0" strokeWidth="2" strokeLinejoin="round" />
              <path d="M83 16V27A4 4 0 0 0 87 31H98" fill="#eaf1fb" stroke="#8fa3c0" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="94" cy="61" r="15" fill="#1d4fa8" />
              <path d="M94 68V54M88 59.5 94 53.5 100 59.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="46" y="86" width="65" height="4" rx="2" fill="#c9d4e8" />
              <rect x="46" y="98" width="43" height="4" rx="2" fill="#c9d4e8" />
            </svg>
            <span className="sr-only">PDF · DOCX</span>
          </div>

          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={handleUploadClick}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 min-w-[185px] rounded-md bg-[#1d4fa8] hover:bg-[#184488] text-white text-[13px] font-semibold transition-colors"
            >
              Upload Resume <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </>
  );
};


export default EmptyState;
