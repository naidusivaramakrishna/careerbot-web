"use client";

import React, { useState, useRef, useCallback } from "react";
import { X, Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { parseResumeForEnhancer, enhanceResume, getEnhancedResume } from "@/api/enhancerApi";
import PriorFixesDialog from "@/components/common/PriorFixesDialog";
import { clearStoredFixedSuggestions } from "@/app/(resume)/builder/creation/_utils/fixedSuggestionsStorage";
import { forgetFixedTextFor } from "@/app/(resume)/builder/creation/_hooks/useFixedTextHighlights";
import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";
import { verifyFreshEnhancement } from "@/utils/verifyEnhancedRefresh";

interface UploadResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UploadStep = "upload" | "parsing" | "enhancing";

type EnhanceResult = Awaited<ReturnType<typeof enhanceResume>>;

/** Fixes the returned record already carries: from the response, else the saved record. */
async function countAppliedFixes(result: EnhanceResult): Promise<number> {
  const inline = result.applied_fixes;
  if (Array.isArray(inline)) return inline.length;
  try {
    const record = await getEnhancedResume(result.enhanced_resume_id);
    return Array.isArray(record?.applied_fixes) ? record.applied_fixes.length : 0;
  } catch {
    return 0; // informational only: never block opening the editor on it
  }
}

const MAX_FILE_SIZE_MB = 10;

export default function UploadResumeModal({ isOpen, onClose }: UploadResumeModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<UploadStep>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Set when the uploaded file already has fixes saved: asks "continue or start fresh".
  const [prior, setPrior] = useState<{ count: number; resumeId: string; result: EnhanceResult } | null>(null);
  const [startingFresh, setStartingFresh] = useState(false);

  const reset = () => {
    setPrior(null);
    setStartingFresh(false);
    setStep("upload");
    setDragActive(false);
    setFileName(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File exceeds ${MAX_FILE_SIZE_MB}MB limit.`;
    }
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      return "Only PDF or DOCX files are accepted.";
    }
    return null;
  };

  const finishImport = (enhanceResult: EnhanceResult) => {
    const enhancedResumeId = enhanceResult.enhanced_resume_id;

    // Backend may return resume data in enhanced_resume OR enhancer_state.resume — use whichever is present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enhancedResumeSource = (enhanceResult as any).enhanced_resume
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      || (enhanceResult as any).enhancer_state?.resume
      || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedData = mapParserOutputToBuilderData(enhancedResumeSource as any);

    // Cache full mapped data so ResumeContext populates all sections on first load
    localStorage.setItem(
      "cached_resume_data",
      JSON.stringify({ resumeId: enhancedResumeId, data: { ...mappedData, id: enhancedResumeId } })
    );
    localStorage.setItem("current_resume_id", enhancedResumeId);

    // Track all enhanced IDs so the resume list can fetch them individually
    const existingIds: string[] = JSON.parse(localStorage.getItem("enhanced_resume_ids") || "[]");
    if (!existingIds.includes(enhancedResumeId)) {
      localStorage.setItem("enhanced_resume_ids", JSON.stringify([...existingIds, enhancedResumeId]));
    }

    toast.success("Resume imported! Opening editor…");
    handleClose();
    router.push(`/builder/creation/${enhancedResumeId}?source=enhanced`);
  };

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFileName(file.name);
    setError(null);
    setStep("parsing");

    try {
      // Call 1: parse the uploaded file
      const parseResult = await parseResumeForEnhancer(file);
      const resumeId = parseResult.resume_id;

      // Call 2: enhance with AI using the parsed resume_id
      setStep("enhancing");
      const enhanceResult = await enhanceResume({ resume_id: resumeId });

      // Re-uploading the same file returns its saved record, fixes included: ask which to use.
      const fixCount = await countAppliedFixes(enhanceResult);
      if (fixCount > 0) {
        setPrior({ count: fixCount, resumeId, result: enhanceResult });
        return;
      }
      finishImport(enhanceResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to import resume. Please try again.";
      toast.error(msg);
      reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const continueWithChanges = () => {
    if (!prior) return;
    const { result } = prior;
    setPrior(null);
    finishImport(result);
  };

  const startWithFreshData = async () => {
    if (!prior || startingFresh) return;
    setStartingFresh(true);
    try {
      const fresh = await enhanceResume({ resume_id: prior.resumeId, force_refresh: true });
      const verification = await verifyFreshEnhancement(fresh);
      if (verification === "retained") {
        // Keep the latest server response, not the pre-refresh browser copy.
        // If the service declined the refresh, Continue must still open its
        // current data rather than resurrecting an older cached snapshot.
        setPrior({
          count: Math.max(1, await countAppliedFixes(fresh)),
          resumeId: prior.resumeId,
          result: fresh,
        });
        toast.error("The saved fixes are still present. Please try again.");
        setStartingFresh(false);
        return;
      }
      // The fresh record reuses the same ID, and this browser keeps its green "fixed"
      // cards and highlights under that ID: forget them or the editor reloads old fixes.
      // If the optional GET check is unavailable, the successful POST is still
      // newer than the browser cache; clearing that cache is safer than showing
      // old fixed cards over the latest server response.
      for (const id of new Set([fresh.enhanced_resume_id, prior.result.enhanced_resume_id])) {
        clearStoredFixedSuggestions(id);
        forgetFixedTextFor(id);
      }
      if (verification === "unknown") {
        toast.warning("Opened the latest scan, but could not verify its saved-fix list.");
      }
      setPrior(null);
      finishImport(fresh);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not scan the original file again.";
      // A failed refresh can still have reset the saved record (the enhance
      // endpoint saves the rescan before it charges credits, then answers 402).
      // If the record now lists no fixes, "Continue with my changes" would open a
      // stale copy: drop the browser's fixed state and leave the dialog. Only an
      // explicit empty list counts; a missing list or a failed GET keeps it as is.
      const recordId = prior.result.enhanced_resume_id;
      const record = await getEnhancedResume(recordId).catch(() => null);
      if (Array.isArray(record?.applied_fixes) && record.applied_fixes.length === 0) {
        clearStoredFixedSuggestions(recordId);
        forgetFixedTextFor(recordId);
        toast.error(`${message} The earlier fixes were already removed from this resume.`);
        reset();
        return;
      }
      toast.error(message);
      setStartingFresh(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  };

  if (!isOpen) return null;

  return (
    <>
    {prior && (
      <PriorFixesDialog
        count={prior.count}
        busy={startingFresh}
        onContinue={continueWithChanges}
        onStartFresh={startWithFreshData}
      />
    )}
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget && step === "upload") handleClose(); }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}
            >
              <Upload className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Upload Existing Resume</h2>
          </div>
          {step === "upload" && (
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">

          {/* STEP: Upload */}
          {step === "upload" && (
            <>
              <div
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all py-10 px-6
                  ${dragActive
                    ? "border-[#2557a7] bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(37,87,167,0.08)" }}
                >
                  <Upload className="w-5 h-5 text-[#2557a7]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-800">
                    {dragActive ? "Drop your file here" : "Drag & drop your resume"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF or DOCX · Max {MAX_FILE_SIZE_MB}MB</p>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                  style={{ background: "linear-gradient(135deg,#5896d7,#1f4e98)" }}
                >
                  Browse Files
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <p className="text-xs text-gray-400 text-center mt-4">
                Your resume will be parsed and enhanced by AI, then pre-filled in the builder.
              </p>
            </>
          )}

          {/* STEP: Parsing */}
          {step === "parsing" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(37,87,167,0.08)" }}
              >
                <Loader2 className="w-7 h-7 text-[#2557a7] animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">Parsing your resume…</p>
                {fileName && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {fileName}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">Extracting your experience, skills, and more</p>
              </div>
            </div>
          )}

          {/* STEP: Enhancing */}
          {step === "enhancing" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(37,87,167,0.08)" }}
              >
                <Loader2 className="w-7 h-7 text-[#2557a7] animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">Enhancing with AI…</p>
                <p className="text-xs text-gray-400 mt-2">Optimising content and improving ATS score</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
    </>
  );
}
