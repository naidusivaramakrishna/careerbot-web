"use client";
import React, { useState, useEffect, useRef, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Download, Eye, FileDown, FileText, Mail, Minus, Plus, X } from "lucide-react";
import Header, { useCoverLetterHandoff } from "../_components/Header";
import FindMatchingJobsPanel from "../_components/job/FindMatchingJobsPanel";
import ResumeSide from "../_components/resumeSidebar/ResumeSide";
import PreviewPanel, { type PreviewExportApi } from "../_components/PreviewPanel";
import { useResume } from "../_context/ResumeContext";
import { useBuilderDisplayScore } from "../_hooks/useBuilderDisplayScore";
import { clearBuilderFixUnits } from "../_lib/builderFixHighlights";

interface BuilderPageProps {
  params: Promise<{
    resumeId: string;
  }>;
}

const noop = () => undefined;

function BuilderPageInner({ resumeId }: { resumeId: string }) {
  const searchParams = useSearchParams();
  const fromAts = searchParams.get("from_ats") === "true";
  const initialTab = fromAts ? "Editor" : undefined;
  const isEnhancedResume = searchParams.get("source") === "enhanced";
  const openSection = searchParams.get("open_section") ?? undefined;

  // ✅ Get loading state from context to prevent rendering before data loads
  const { isLoadingResume, resumeData } = useResume();
  const ownName = (resumeData?.personalInfo?.fullname ?? "").trim();

  const displayScore = useBuilderDisplayScore(isEnhancedResume);
  const [zoom, setZoom] = useState(1);
  // The "Score NN%" button brings the Score tab forward in the editor panel
  const [tabRequest, setTabRequest] = useState<{ tab: string; id: number } | null>(null);
  // Which editor tab is open: on Job Match the right-hand side is the "Find your matching jobs" card, not the preview
  const [builderTab, setBuilderTab] = useState("Editor");
  const isJobMatchTab = builderTab === "Job Match";

  const [showFullPreview, setShowFullPreview] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { handleUseForCoverLetter, isUsingForCoverLetter } = useCoverLetterHandoff();
  const [isDownloading, setIsDownloading] = useState(false);
  const exportApiRef = useRef<PreviewExportApi | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);

  // The green fix highlights of a from-scratch resume live in a module-wide store: leaving this resume (or
  // the page) must not carry them to the next one. Cleared here, not by a preview, so closing the
  // full-preview window (a second preview) leaves the main preview's highlights alone.
  useEffect(() => clearBuilderFixUnits, [resumeId]);

  // The wheel scrolls the page first, wherever the pointer is (including over the editor and
  // preview panels). Once the page cannot move any further in that direction, the event is left
  // alone so the panel under the pointer scrolls inside itself.
  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.deltaY === 0) return; // pinch-zoom / horizontal gestures
      // A window over the page (the full preview) scrolls itself; the page behind it must not take the wheel
      if (e.target instanceof Element && e.target.closest('[role="dialog"]')) return;
      const max = root.scrollHeight - root.clientHeight;
      const canMove = e.deltaY > 0 ? root.scrollTop < max - 1 : root.scrollTop > 0;
      if (!canMove) return;
      e.preventDefault();
      root.scrollTop += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [isLoadingResume]);

  // Close the full-view preview with Escape
  useEffect(() => {
    if (!showFullPreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowFullPreview(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showFullPreview]);

  // Close the download menu when clicking elsewhere
  useEffect(() => {
    if (!showExportMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!exportMenuRef.current?.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showExportMenu]);

  const handleExport = (type: "PDF" | "DOCX") => {
    setShowExportMenu(false);
    void exportApiRef.current?.exportAs(type);
  };

  // ✅ Show loading state while resume data is being fetched from backend
  // This prevents form components from initializing with empty data
  if (isLoadingResume) {
    return (
      <>
        <div className="px-5 pt-4">
          <Header />
        </div>
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#2200ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">Loading resume data...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your resume</p>
          </div>
        </div>
      </>
    );
  }

  // Top left of the preview panel (where the "Resume Preview" title was): the score, which opens the Score tab
  const scoreButton = (
    <button
      type="button"
      onClick={() => setTabRequest((current) => ({ tab: "Score", id: (current?.id ?? 0) + 1 }))}
      className="inline-flex h-8 items-center rounded-lg bg-[#dce9fb] px-3.5 text-[13px] font-semibold text-[#1d4fa8] transition hover:bg-[#cfe0f8]"
    >
      Score {Math.round(displayScore)}%
    </button>
  );

  return (
    <div
      ref={scrollRootRef}
      data-testid="builder-scroll-root"
      className="h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#f1f6fc] px-8 pt-4 pb-6"
    >
      <Header showCoverLetter={false} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Left: Editor / Score / Customize / Job Match */}
        <div className="min-w-0 lg:col-span-5 lg:h-[calc(100vh-3.5rem-2rem)]">
          <ResumeSide
            builderLayout
            resumeId={resumeId}
            initialTab={isEnhancedResume ? "Score" : initialTab}
            defaultOpen={true}
            openSection={openSection}
            tabRequest={tabRequest}
            onActiveTabChange={setBuilderTab}
          />
        </div>

        {/* Right: live resume preview */}
        <section className="flex h-[640px] min-w-0 flex-col gap-2 lg:col-span-7 lg:h-[calc(100vh-3.5rem-2rem)]">
          {/* Toolbar card, separate from the resume card below it (same height as the tab strip on the left). Hidden on Job Match, where the card below takes its place; kept mounted so Export keeps working. */}
          <div className={`${isJobMatchTab ? "hidden" : "grid"} grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-[#e3e9f2] bg-white px-3 py-2 lg:h-[44px] lg:py-0`}>
            <div className="justify-self-start">{scoreButton}</div>

            {/* Zoom sits in the middle of the bar */}
            <div className={`justify-self-center ${isJobMatchTab ? "invisible" : ""}`}>
              <div className="flex h-8 items-center overflow-hidden rounded-lg border border-[#d5deec] bg-white" aria-label="Preview zoom">
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}
                  disabled={zoom <= 0.5}
                  className="flex h-full w-7 items-center justify-center text-[#1d4fa8] transition hover:bg-[#f4f7fc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={14} />
                </button>
                <span className="flex h-full min-w-[44px] items-center justify-center border-x border-[#d5deec] px-1.5 text-xs font-semibold text-gray-900">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(1)))}
                  disabled={zoom >= 1.5}
                  className="flex h-full w-7 items-center justify-center text-[#1d4fa8] transition hover:bg-[#f4f7fc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Preview and export (PDF, DOCX, Use for Cover Letter) on the right */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                aria-label="Preview"
                title="Preview"
                onClick={() => setShowFullPreview(true)}
                className={`${isJobMatchTab ? "hidden" : "flex"} h-8 w-8 items-center justify-center rounded-lg border border-[#d5deec] bg-white text-[#1d4fa8] transition hover:bg-[#f4f7fc]`}
              >
                <Eye size={16} />
              </button>

              <div ref={exportMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu((v) => !v)}
                  disabled={isDownloading}
                  aria-haspopup="menu"
                  aria-expanded={showExportMenu}
                  aria-label={isDownloading ? "Exporting..." : "Export"}
                  title={isDownloading ? "Exporting..." : "Export"}
                  className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#1d4fa8] px-3 text-[13px] font-semibold text-white transition hover:bg-[#184488] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download size={15} className={isDownloading ? "animate-pulse" : undefined} />
                  {isDownloading ? "Exporting..." : "Export"}
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                {showExportMenu && !isDownloading && (
                  <div role="menu" className="absolute right-0 z-50 mt-2 w-auto min-w-[10rem] overflow-hidden rounded-lg border border-[#e3e9f2] bg-white py-1 shadow-lg">
                    <button
                      role="menuitem"
                      onClick={() => handleExport("PDF")}
                      className="flex w-full items-center gap-2.5 whitespace-nowrap px-3 py-2 text-left text-sm font-medium text-[#1d4fa8] hover:bg-[#f4f7fc]"
                    >
                      <FileDown size={16} aria-hidden="true" className="shrink-0" />
                      PDF
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => handleExport("DOCX")}
                      className="flex w-full items-center gap-2.5 whitespace-nowrap px-3 py-2 text-left text-sm font-medium text-[#1d4fa8] hover:bg-[#f4f7fc]"
                    >
                      <FileText size={16} aria-hidden="true" className="shrink-0" />
                      DOCX
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => { setShowExportMenu(false); void handleUseForCoverLetter(); }}
                      disabled={isUsingForCoverLetter}
                      className="flex w-full items-center gap-2.5 whitespace-nowrap border-t border-[#e3e9f2] px-3 py-2 text-left text-sm font-medium text-[#1d4fa8] hover:bg-[#f4f7fc] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Mail size={16} aria-hidden="true" className="shrink-0" />
                      {isUsingForCoverLetter ? "Selecting..." : "Use for Cover Letter"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isJobMatchTab && <FindMatchingJobsPanel />}
          {/* kept mounted (hidden) on Job Match so Export keeps working */}
          <div className={`min-h-0 flex-1 overflow-y-auto rounded-xl ${isJobMatchTab ? "hidden" : ""}`}>
            <PreviewPanel
              hideToolbar
              pageScrollPreview
              expandPreview
              isTemplateSidebarOpen={false}
              onTabClick={noop}
              resumeId={resumeId}
              isEnhancedResume={isEnhancedResume}
              exportApiRef={exportApiRef}
              onDownloadingChange={setIsDownloading}
              zoom={zoom}
            />
          </div>
        </section>
      </div>

      {/* Full view: the resume only */}
      {showFullPreview && (
        // A window over the page (not a full-screen takeover); the light blue backdrop is translucent so the builder shows through
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#e9eef6]/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Resume full preview"
          onClick={() => setShowFullPreview(false)}
        >
          <div
            className="flex max-h-full w-full max-w-[600px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* "Name — Resume", with the close button in the header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#e3e9f2] px-5 py-3.5">
              <h2 className="min-w-0 truncate text-[16px] font-semibold text-gray-900">
                {ownName ? `${ownName} — Resume` : "Resume"}
              </h2>
              <button
                type="button"
                onClick={() => setShowFullPreview(false)}
                aria-label="Close preview"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e3e9f2] bg-white text-gray-800 transition hover:bg-gray-50"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            {/* The resume, scaled to fit the narrow window, scrolling inside it */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-4">
              <div className="overflow-hidden rounded-md border border-[#e3e9f2]" style={{ zoom: 0.62 }}>
                <PreviewPanel
                  hideToolbar
                  pageScrollPreview
                  expandPreview
                  isTemplateSidebarOpen={false}
                  onTabClick={noop}
                  resumeId={resumeId}
                  isEnhancedResume={isEnhancedResume}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const BuilderPage: React.FC<BuilderPageProps> = ({ params }) => {
  const { resumeId } = use(params);
  return (
    <Suspense>
      <BuilderPageInner resumeId={resumeId} />
    </Suspense>
  );
};

export default BuilderPage;
