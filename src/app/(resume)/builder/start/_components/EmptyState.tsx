"use client"
import { CircleCheckBig, Plus, Upload, Zap, ShieldCheck, LayoutTemplate } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { createResumeWithAuth, getAllResumesUnified } from "@/api/resumeApi";
import logger from "@/lib/logger";
import UploadResumeModal from "./UploadResumeModal";

const ResumeMockup = () => (
  <div className="relative w-48 mx-auto">
    <div className="rounded-xl overflow-hidden bg-white shadow-lg">
      <div className="px-3 py-2.5 flex items-center gap-2 bg-[#2557a7]">
        <div className="w-6 h-6 rounded-full bg-white/25 shrink-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-1.5 rounded-full bg-white/80 w-3/4" />
          <div className="h-1 rounded-full bg-white/45 w-1/2" />
        </div>
      </div>
      <div className="px-3 py-1.5 flex gap-2 border-b border-gray-100">
        {["w-10","w-14","w-8"].map((w,i) => (
          <div key={i} className={`h-1 rounded-full bg-gray-200 ${w}`} />
        ))}
      </div>
      <div className="px-3 py-2.5 space-y-3">
        <div>
          <div className="h-1.5 rounded-full w-14 mb-1.5 bg-[#2557a7]/30" />
          <div className="space-y-1">
            <div className="h-1 rounded-full bg-gray-200 w-full" />
            <div className="h-1 rounded-full bg-gray-200 w-5/6" />
            <div className="h-1 rounded-full bg-gray-200 w-3/5" />
          </div>
        </div>
        <div>
          <div className="h-1.5 rounded-full w-9 mb-1.5 bg-[#2557a7]/30" />
          <div className="flex flex-wrap gap-1">
            {["w-8","w-10","w-7","w-9","w-6"].map((w,i) => (
              <div key={i} className={`h-2 rounded-full ${w} bg-blue-50 border border-blue-100`} />
            ))}
          </div>
        </div>
        <div>
          <div className="h-1.5 rounded-full w-12 mb-1.5 bg-[#2557a7]/30" />
          <div className="space-y-1">
            <div className="h-1 rounded-full bg-gray-200 w-full" />
            <div className="h-1 rounded-full bg-gray-200 w-3/5" />
          </div>
        </div>
      </div>
    </div>
    <div className="absolute -top-2 -right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-[#2557a7] border-2 border-white shadow-md">
      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="text-white text-[10px] font-black">92 ATS</span>
    </div>
    <div className="absolute -bottom-2 -left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-white text-[#2557a7] text-[9px] font-bold border border-blue-100 shadow-sm">
      ✦ AI-powered
    </div>
  </div>
);

const UploadVisual = () => (
  <div className="flex items-center gap-3 w-full">
    <div className="relative w-14 h-16 shrink-0">
      <div className="absolute top-1.5 left-1.5 right-0 bottom-0 rounded-xl bg-gray-100" />
      <div className="absolute top-0 left-0 right-1.5 bottom-1.5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-1.5">
        <div className="w-5 h-6 rounded flex items-center justify-center bg-red-50">
          <span className="text-[7px] font-black text-red-400">PDF</span>
        </div>
        <div className="space-y-0.5 w-7">
          <div className="h-0.5 rounded-full bg-gray-200 w-full" />
          <div className="h-0.5 rounded-full bg-gray-200 w-4/5" />
          <div className="h-0.5 rounded-full bg-gray-200 w-3/5" />
        </div>
      </div>
    </div>

    <div className="flex-1 flex flex-col items-center gap-1.5">
      <div className="w-full flex items-center gap-1">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-blue-200" />
        <div className="px-2 py-0.5 rounded-full text-[8px] font-black text-white bg-[#2557a7]">✦ AI</div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-blue-200" />
      </div>
      <div className="flex gap-1">
        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">PDF</span>
        <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500">DOCX</span>
      </div>
    </div>

    <div className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 shrink-0 bg-blue-50 border border-blue-100">
      <div className="relative w-9 h-9">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <path strokeWidth="3.5" fill="none" stroke="#dbeafe"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path strokeWidth="3.5" strokeDasharray="92,100" fill="none" strokeLinecap="round" stroke="#2557a7"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-[#2557a7]">92</div>
      </div>
      <span className="text-[7px] font-semibold text-[#2557a7]">ATS Score</span>
    </div>
  </div>
);

const EmptyState = ({ selected, onSelect }: {
  selected: string | null;
  onSelect: (id: string) => void;
}) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleBuilderClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect("builder");
    setIsCreating(true);
    try {
      const { builder_resumes } = await getAllResumesUnified();
      if (builder_resumes.length > 0) {
        const resume = builder_resumes[0] as { id: string };
        localStorage.setItem("cached_resume_data", JSON.stringify({ resumeId: resume.id, data: resume }));
        localStorage.setItem("current_resume_id", resume.id);
      } else {
        const newResume = await createResumeWithAuth();
        localStorage.setItem("cached_resume_data", JSON.stringify({ resumeId: newResume.id, data: newResume }));
        localStorage.setItem("current_resume_id", newResume.id);
      }
      router.push("/templates");
    } catch (error: unknown) {
      logger.error("Error:", error);
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 401 || axiosError?.response?.status === 403) {
        toast.error("Please sign in to create a resume");
        router.push("/signup");
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

  return (
    <>
      <UploadResumeModal
        isOpen={showUploadModal}
        onClose={() => { setShowUploadModal(false); onSelect(""); }}
      />

      <div className="flex flex-col items-center px-6 pb-12">

        {/* Welcome */}
        <div className="text-center mb-8 max-w-lg">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Build your perfect resume
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Choose how you&apos;d like to get started. Our AI will guide you every step of the way.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-5 w-full max-w-3xl">

          {/* Build from Scratch */}
          <div
            onClick={handleBuilderClick}
            className={`
              relative cursor-pointer bg-white rounded-2xl flex flex-col overflow-hidden
              transition-all duration-200 hover:-translate-y-0.5
              ${selected === "builder" ? "ring-2 ring-[#2557a7]" : ""}
              ${isCreating ? "opacity-70 pointer-events-none" : ""}
            `}
            style={{
              boxShadow: selected === "builder"
                ? "0 8px 28px rgba(37,87,167,0.14), 0 2px 8px rgba(0,0,0,0.06)"
                : "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-[#2557a7]" />

            <div className="p-6 pt-7">
              <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#2557a7]">
                  {isCreating
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Plus className="text-white w-5 h-5" />
                  }
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide text-[#2557a7] bg-blue-50 border border-blue-100">
                  RECOMMENDED
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-1.5">Build from Scratch</h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                {isCreating
                  ? "Setting up your workspace…"
                  : "Step-by-step builder with AI assistance to craft a standout, ATS-optimized resume."}
              </p>

              <ul className="space-y-2">
                {["ATS-friendly formatting","Pre-designed templates","AI-powered suggestions"].map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-gray-600">
                    <CircleCheckBig className="h-3.5 w-3.5 text-[#2557a7] shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-5 pb-7 pt-3 mt-auto bg-gradient-to-b from-white to-blue-50/40">
              <ResumeMockup />
            </div>
          </div>

          {/* Upload Existing */}
          <div
            onClick={handleUploadClick}
            className={`
              relative cursor-pointer bg-white rounded-2xl flex flex-col overflow-hidden
              transition-all duration-200 hover:-translate-y-0.5
              ${selected === "upload" ? "ring-2 ring-[#2557a7]" : ""}
            `}
            style={{
              boxShadow: selected === "upload"
                ? "0 8px 28px rgba(37,87,167,0.14), 0 2px 8px rgba(0,0,0,0.06)"
                : "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gray-200" />

            <div className="p-6 pt-7">
              <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                  <Upload className="text-[#2557a7] w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide text-gray-500 bg-gray-50 border border-gray-200">
                  PDF · DOCX
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-1.5">Upload Existing Resume</h3>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                Already have a resume? Let AI enhance and optimize it for your next opportunity.
              </p>

              <ul className="space-y-2">
                {["AI-powered enhancement","Instant ATS score","Smart suggestions"].map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-gray-600">
                    <CircleCheckBig className="h-3.5 w-3.5 text-[#2557a7] shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-5 pb-4 pt-3 mt-auto bg-gradient-to-b from-white to-gray-50">
              <UploadVisual />
            </div>

            <div className="px-5 pb-5 flex gap-1.5">
              {["+24 Keywords","12 Fixes","+3 Sections"].map(label => (
                <span key={label} className="text-[9px] font-semibold px-2 py-0.5 rounded-full text-[#2557a7] bg-blue-50 border border-blue-100">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-8 flex items-center gap-6 flex-wrap justify-center">
          {[
            { icon: ShieldCheck,    label: "100% ATS Friendly" },
            { icon: Zap,            label: "AI-Powered"         },
            { icon: LayoutTemplate, label: "100+ Templates"     },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
              <Icon className="w-3.5 h-3.5 text-gray-300" />
              {label}
            </div>
          ))}
        </div>

      </div>
    </>
  );
};

export default EmptyState;
