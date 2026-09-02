"use client";
import React, { Suspense, use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useResume } from "../../_context/ResumeContext";

import { AppBar } from "../_v2/AppBar";
import { SectionRail } from "../_v2/SectionRail";
import { ContextRail, type ContextTab } from "../_v2/ContextRail";
import { EditorCanvas } from "../_v2/EditorCanvas";
import { PreviewShell } from "../_v2/PreviewShell";
import { BottomTabBar, type MobileSurface } from "../_v2/BottomTabBar";
import { useSectionStats, useOverallCompletion } from "../_v2/hooks";
import type { SaveState } from "../_v2/_ui";

type Props = { params: Promise<{ resumeId: string }> };

/* ──────────────────────────────────────────────────────────────────────────────
   Skeleton — non-blocking while the resume data hydrates
   ────────────────────────────────────────────────────────────────────────────── */
function BuilderSkeleton() {
  return (
    <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-surface-muted">
      <div className="flex h-14 items-center gap-3 border-b border-line bg-white px-5">
        <div className="h-7 w-7 animate-pulse rounded-md bg-line" />
        <div className="h-4 w-48 animate-pulse rounded bg-line" />
        <div className="flex-1" />
        <div className="h-7 w-20 animate-pulse rounded-full bg-line" />
        <div className="h-8 w-24 animate-pulse rounded-md bg-line" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-[240px] border-r border-line bg-white p-3 lg:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mb-1.5 h-9 animate-pulse rounded-lg bg-line/60" />
          ))}
        </div>
        <div className="flex-1 p-6">
          <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-line" />
          <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-line/70" />
          <div className="mb-6 h-3 w-1/3 animate-pulse rounded bg-line/70" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-line/60" />
            ))}
          </div>
        </div>
        <div className="hidden w-[420px] border-l border-line bg-white p-6 xl:block">
          <div className="aspect-[3/4] animate-pulse rounded-lg bg-line/60" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────────────────────────────────────── */
function BuilderV2Page({ resumeId }: { resumeId: string }) {
  const sp = useSearchParams();
  const fromAts = sp.get("from_ats") === "true";
  const isEnhanced = sp.get("source") === "enhanced";
  const initialTab = fromAts ? "Enhance" : undefined;

  const {
    resumeData,
    setResumeData,
    selectedTemplate,
    setSelectedTemplate,
    isLoadingResume,
    lastUpdated,
    enhancedAtsScore,
    enhancedSuggestions,
  } = useResume();

  const sections = useSectionStats();
  const overallCompletion = useOverallCompletion();

  /* ── UI state ───────────────────────────────────────────────────────────── */
  const [activeKey, setActiveKey] = useState<string>(() => sections[0]?.key ?? "personalInfo");
  const [contextOpen, setContextOpen] = useState(false);
  const [contextTab, setContextTab] = useState<ContextTab>("templates");
  const [mobileSurface, setMobileSurface] = useState<MobileSurface>("edit");
  const [previewFocus, setPreviewFocus] = useState(false);

  // Keep activeKey valid when sections list changes
  useEffect(() => {
    if (sections.length === 0) return;
    if (!sections.some((s) => s.key === activeKey || s.label === activeKey)) {
      setActiveKey(sections[0].key);
    }
  }, [sections, activeKey]);

  /* ── Save state — derive a sensible placeholder until the autosave hook ships ─ */
  const saveState: SaveState = useMemo(() => {
    if (isLoadingResume) return { kind: "idle" };
    if (lastUpdated) return { kind: "saved", at: lastUpdated };
    return { kind: "idle" };
  }, [isLoadingResume, lastUpdated]);

  /* ── Title — derived from personalInfo, editable inline ─────────────────── */
  const initialTitle =
    (resumeData?.personalInfo?.fullname ?? "").trim() ||
    (isEnhanced ? "Enhanced Resume" : "Untitled Resume");

  const [title, setTitle] = useState(initialTitle);
  useEffect(() => setTitle(initialTitle), [initialTitle]);

  /* ── ATS score & top fixes (mapped from enhanced data) ──────────────────── */
  const atsScore: number | null =
    typeof enhancedAtsScore === "object" && enhancedAtsScore !== null
      ? Number((enhancedAtsScore as { overall_score?: number; score?: number }).overall_score ??
                (enhancedAtsScore as { score?: number }).score ?? null) || null
      : null;

  const atsBreakdown = useMemo(() => {
    const obj = enhancedAtsScore as unknown as Record<string, { score?: number } | number> | null;
    if (!obj || typeof obj !== "object") return [];
    const candidates: { label: string; key: string }[] = [
      { label: "Keywords",   key: "keywords" },
      { label: "Structure",  key: "structure" },
      { label: "Length",     key: "length" },
      { label: "Readability", key: "readability" },
    ];
    return candidates
      .map((c) => {
        const v = obj[c.key];
        const value = typeof v === "number" ? v : typeof v === "object" && v ? Number(v.score ?? 0) : 0;
        return value > 0 ? { label: c.label, value } : null;
      })
      .filter(Boolean) as { label: string; value: number }[];
  }, [enhancedAtsScore]);

  const topFixes = useMemo(
    () =>
      (enhancedSuggestions ?? []).slice(0, 5).map((s, i) => ({
        id: (s as { id?: string }).id ?? `fix-${i}`,
        severity: ((s as { severity?: string }).severity === "critical" ? "bad" : "warn") as "bad" | "warn",
        text: (s as { text?: string; message?: string }).text ?? (s as { message?: string }).message ?? "Improve this section",
        targetSection: (s as { section?: string }).section,
      })),
    [enhancedSuggestions]
  );

  /* ── Actions ────────────────────────────────────────────────────────────── */
  const openContext = (tab: ContextTab) => {
    setContextTab(tab);
    setContextOpen(true);
  };

  const handleDownload = (fmt: "pdf" | "docx" | "linkedin") => {
    toast.info(
      fmt === "pdf"
        ? "Generating PDF…"
        : fmt === "docx"
          ? "Generating Word document…"
          : "Preparing LinkedIn JSON…"
    );
    // The actual download flow already exists inside PreviewPanel; in Phase 2
    // we lift it out of PreviewPanel into a shared hook and invoke it here.
  };

  const handleAskAI = () => openContext("ai");

  if (isLoadingResume) {
    return <BuilderSkeleton />;
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-[calc(100vh-56px)] w-full flex-col bg-surface-muted">
      <AppBar
        title={title}
        onTitleChange={setTitle}
        saveState={saveState}
        atsScore={atsScore}
        onScoreClick={() => openContext("score")}
        canUndo={false}
        canRedo={false}
        onTogglePreview={() => setPreviewFocus((v) => !v)}
        isPreviewFocus={previewFocus}
        onDownload={handleDownload}
        isEnhanced={isEnhanced}
        fileNameBase={title}
      />

      {/* Desktop / tablet layout */}
      <div className="hidden flex-1 overflow-hidden md:flex">
        <SectionRail
          sections={sections}
          activeKey={activeKey}
          onPick={setActiveKey}
          onAddSection={() => openContext("templates")}
          overallCompletion={overallCompletion}
          atsScore={atsScore}
          density={previewFocus ? "icons" : "comfortable"}
          className="hidden md:flex lg:flex"
        />

        {!previewFocus ? (
          <EditorCanvas
            resumeId={resumeId}
            sections={sections}
            activeKey={activeKey}
            onPickSection={setActiveKey}
            onAskAI={handleAskAI}
            initialEditorTab={initialTab}
          />
        ) : null}

        <PreviewShell
          resumeId={resumeId}
          isContextRailOpen={contextOpen}
          onOpenContextRail={openContext}
          isEnhancedResume={isEnhanced}
        />

        <ContextRail
          open={contextOpen}
          onClose={() => setContextOpen(false)}
          tab={contextTab}
          onTabChange={setContextTab}
          atsScore={atsScore}
          atsBreakdown={atsBreakdown}
          topFixes={topFixes}
          onJumpToSection={(k) => {
            setActiveKey(k);
            setContextOpen(false);
          }}
          activeTemplateId={String(selectedTemplate ?? "")}
          onPickTemplate={(id) => setSelectedTemplate(id)}
        />
      </div>

      {/* Mobile layout — single full-bleed surface, bottom tabs */}
      <div className="flex flex-1 overflow-hidden md:hidden">
        <div className="flex flex-1 flex-col overflow-hidden pb-16">
          {mobileSurface === "edit" ? (
            <EditorCanvas
              resumeId={resumeId}
              sections={sections}
              activeKey={activeKey}
              onPickSection={setActiveKey}
              onAskAI={handleAskAI}
              initialEditorTab={initialTab}
            />
          ) : null}

          {mobileSurface === "preview" ? (
            <PreviewShell
              resumeId={resumeId}
              isContextRailOpen={false}
              onOpenContextRail={() => setMobileSurface("edit")}
              isEnhancedResume={isEnhanced}
            />
          ) : null}

          {mobileSurface === "score" || mobileSurface === "ai" ? (
            <div className="flex-1 bg-white">
              <ContextRail
                open
                onClose={() => setMobileSurface("edit")}
                tab={mobileSurface === "score" ? "score" : "ai"}
                onTabChange={(t) =>
                  t === "score" || t === "ai" ? setMobileSurface(t) : setMobileSurface("edit")
                }
                atsScore={atsScore}
                atsBreakdown={atsBreakdown}
                topFixes={topFixes}
                onJumpToSection={(k) => {
                  setActiveKey(k);
                  setMobileSurface("edit");
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <BottomTabBar
        value={mobileSurface}
        onChange={(v) => setMobileSurface(v)}
        scoreBadge={topFixes.length}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Route shell
   ────────────────────────────────────────────────────────────────────────────── */
export default function Page({ params }: Props) {
  const { resumeId } = use(params);
  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <BuilderV2Page resumeId={resumeId} />
    </Suspense>
  );
}
