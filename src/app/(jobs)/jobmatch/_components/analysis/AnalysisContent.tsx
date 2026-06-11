"use client";

import React from "react";
import MultiColorCircularScore from "@/app/(resume)/builder/creation/_components/score/MultiColorCircularScore";
import ResumePreview from "../resume/ResumePreview";
import PDFPreviewError from "./PDFPreviewError";
import { AnalysisContentProps } from "../_types";
import {
  FileText, Download, Pencil, User, Briefcase, GraduationCap,
  Star, Award, ArrowLeft, ChevronRight, BookOpen, Trophy,
  Heart, Building2, Plus, Globe, AlignLeft, Users,
} from "lucide-react";
import { FaCheckCircle } from "react-icons/fa";
import { RiSparkling2Fill } from "react-icons/ri";
import JobMatchSectionEditor from "../resume/JobMatchSectionEditor";
import JDHighlighter from "../highlighter/JDHighlighter";
import { matcherEnhanceApply, matcherEnhanceRemove, downloadResumePdf, parserAddSkills, parserRemoveSkills } from "@/api/parserApi";
import ScoreBreakdown from "./ScoreBreakdown";
import MatchPenalties from "./MatchPenalties";

// All possible predefined sections
const ALL_SECTIONS = [
  { id: "contact",          label: "Personal Info",         icon: User,         hasAI: false },
  { id: "summary",          label: "Professional Summary",  icon: Briefcase,    hasAI: true  },
  { id: "education",        label: "Education",             icon: GraduationCap,hasAI: false },
  { id: "skills",           label: "Skills",                icon: Star,         hasAI: false },
  { id: "softSkills",       label: "Soft Skills",           icon: Heart,        hasAI: false },
  { id: "experience",       label: "Work Experience",       icon: Briefcase,    hasAI: true  },
  { id: "internships",      label: "Internships",           icon: Building2,    hasAI: true  },
  { id: "projects",         label: "Projects",              icon: Award,        hasAI: true  },
  { id: "certifications",   label: "Certifications",        icon: BookOpen,     hasAI: false },
  { id: "achievements",     label: "Achievements",          icon: Trophy,       hasAI: false },
  { id: "languages",        label: "Languages",             icon: Globe,        hasAI: false },
  { id: "hobbies",          label: "Hobbies",               icon: AlignLeft,    hasAI: true  },
  { id: "references",       label: "References",            icon: Users,        hasAI: false },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasData(val: any): boolean {
  if (!val) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "string") return val.trim().length > 0;
  if (typeof val === "object") return Object.keys(val).length > 0;
  return true;
}

// Detect which sections exist in parsed resume data - supports all field name variations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectActiveSections(parsed: any): string[] {
  if (!parsed) return ["contact", "summary"];

  // Unwrap nested structure like { parsed_data: { ... } }
  const d = parsed?.parsed_data || parsed;
  const llm = d?.llm_data || {};

  const active: string[] = [];

  // contact / personal info
  if (hasData(d.contact) || hasData(d.personalInfo) || hasData(llm.contact) || hasData(llm.personal_info))
    active.push("contact");

  // professional summary
  if (hasData(d.professionalSummary) || hasData(d.professional_summary) || hasData(d.career_objective) ||
      hasData(d.objective) || hasData(d.summary) || hasData(llm.professionalSummary) || hasData(llm.summary))
    active.push("summary");

  // education
  if (hasData(d.education) || hasData(d.educational_qualifications) || hasData(llm.education))
    active.push("education");

  // skills
  if (hasData(d.skills) || hasData(d.technical_skills) || hasData(llm.skills) || hasData(llm.technical_skills))
    active.push("skills");

  // soft skills
  if (hasData(d.soft_skills) || hasData(d.softSkills) || hasData(llm.soft_skills))
    active.push("softSkills");

  // work experience
  if (hasData(d.workExperience) || hasData(d.work_experience) || hasData(d.experience) ||
      hasData(d.professional_experience) || hasData(llm.workExperience) || hasData(llm.work_experience))
    active.push("experience");

  // internships
  if (hasData(d.internships) || hasData(llm.internships))
    active.push("internships");

  // projects
  if (hasData(d.projects) || hasData(d.project_details) || hasData(llm.projects))
    active.push("projects");

  // certifications
  if (hasData(d.certifications) || hasData(d.certificates) || hasData(llm.certifications))
    active.push("certifications");

  // achievements
  if (hasData(d.achievements) || hasData(d.accomplishments) || hasData(llm.achievements))
    active.push("achievements");

  // languages
  if (hasData(d.languages) || hasData(llm.languages))
    active.push("languages");

  // hobbies
  if (hasData(d.hobbies) || hasData(d.interests) || hasData(llm.hobbies))
    active.push("hobbies");

  // references
  if (hasData(d.references) || hasData(llm.references))
    active.push("references");

  return active.length ? active : ["contact", "summary"];
}

export default function AnalysisContent({
  jdText,
  matchResults,
  parsedResumeData,
  onBackToUpload,
}: AnalysisContentProps) {
  const [pdfBlobUrl]  = React.useState<string>("");
  const [isLoading]   = React.useState(false);
  const [pdfError]    = React.useState<string | null>(null);
  const [isUpdating]  = React.useState(false);
  const [isDocx]      = React.useState(false);
  const [docxBlob]    = React.useState<Blob | null>(null);

  const [isEditMode, setIsEditMode] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<string | null>(null);

  // Track which skills were added (for green highlight in resume template)
  const [addedSkillFields, setAddedSkillFields] = React.useState<string[]>([]);

  // Active section IDs (from parsed data + user-added)
  const [activeSectionIds, setActiveSectionIds] = React.useState<string[]>(
    () => detectActiveSections(parsedResumeData)
  );

  const [deletedSectionIds, setDeletedSectionIds] = React.useState<string[]>([]);

  // Custom sections added by user
  const [customSections, setCustomSections] = React.useState<{ id: string; label: string }[]>([]);
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [customName, setCustomName] = React.useState("");

  // Resume section data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resumeSections, setResumeSections] = React.useState<Record<string, any>>(() => {
    const d = parsedResumeData?.parsed_data || parsedResumeData || {};
    const llm = d?.llm_data || {};
    return {
      contact:        d.contact ?? d.personalInfo ?? llm.contact ?? llm.personal_info ?? {},
      summary:        d.professionalSummary ?? d.professional_summary ?? d.summary ?? d.career_objective ?? llm.professionalSummary ?? llm.summary ?? "",
      education:      d.education ?? d.educational_qualifications ?? llm.education ?? [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skills:         (d.skills ?? d.technical_skills ?? llm.skills ?? llm.technical_skills ?? []).map((s: any) => typeof s === "string" ? s : (s?.skill ?? s?.name ?? "")).filter(Boolean),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      softSkills:     (d.soft_skills ?? d.softSkills ?? llm.soft_skills ?? []).map((s: any) => typeof s === "string" ? s : (s?.skill ?? s?.name ?? "")).filter(Boolean),
      experience:     d.workExperience ?? d.work_experience ?? d.experience ?? llm.workExperience ?? llm.work_experience ?? [],
      internships:    d.internships ?? llm.internships ?? [],
      projects:       d.projects ?? d.project_details ?? llm.projects ?? [],
      certifications: d.certifications ?? d.certificates ?? llm.certifications ?? [],
      achievements:   d.achievements ?? d.accomplishments ?? llm.achievements ?? [],
      languages:      d.languages ?? llm.languages ?? [],
      hobbies:        d.hobbies ?? d.interests ?? llm.hobbies ?? [],
      references:     d.references ?? llm.references ?? [],
    };
  });

  const matchId: string | undefined =
    matchResults?.data?.id ?? matchResults?.data?._id ?? matchResults?.data?.match_id;

  const resumeId: string | undefined =
    matchResults?.data?.resume_id ??
    matchResults?.resume_id ??
    parsedResumeData?.resume_id ??
    parsedResumeData?.parsed_data?.resume_id ??
    parsedResumeData?.data?.resume_id;

  // Live ATS score — updates when skills are added/removed
  const initialScore = Math.min(100, Math.max(0, parseFloat(String(matchResults?.data?.ats_score || "0"))));
  const [liveScore, setLiveScore] = React.useState<number>(initialScore);

  // Add a skill: call enhance/apply (updates match score) + parserAddSkills (persists to resume doc for download)
  const directAddSkill = React.useCallback(async (skill: string, suggestion_id?: string) => {
    const s = skill.trim();
    if (!s) return;
    // Optimistic local update
    setAddedSkillFields((prev) => prev.includes(s) ? prev : [...prev, s]);
    setResumeSections((prev: Record<string, unknown>) => {
      const existing: string[] = Array.isArray(prev.skills) ? prev.skills as string[] : [];
      if (existing.includes(s)) return prev;
      return { ...prev, skills: [...existing, s] };
    });
    // Update match score in backend and read new score from response
    if (matchId && suggestion_id) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await matcherEnhanceApply(matchId, suggestion_id) as any;
        const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after ?? res?.match_result?.ats_score;
        if (typeof newScore === "number") setLiveScore(Math.min(100, Math.max(0, newScore)));
        else if (typeof newScore === "string") {
          const n = parseFloat(newScore);
          if (!isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
        }
      } catch { /* local state already updated */ }
    }
    // Always persist skill directly to resume document so download includes it
    if (resumeId) {
      try { await parserAddSkills(resumeId, s); } catch { /* best effort */ }
    }
  }, [matchId, resumeId]);

  // Remove a skill: call enhance/remove + parserRemoveSkills
  const directRemoveSkill = React.useCallback(async (skill: string, suggestion_id?: string) => {
    const s = skill.trim();
    setAddedSkillFields((prev) => prev.filter((x) => x !== s));
    setResumeSections((prev: Record<string, unknown>) => {
      const existing: string[] = Array.isArray(prev.skills) ? prev.skills as string[] : [];
      return { ...prev, skills: existing.filter((x) => x !== s) };
    });
    if (matchId && suggestion_id) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await matcherEnhanceRemove(matchId, suggestion_id) as any;
        const newScore = res?.score_diff?.after ?? res?.data?.score_diff?.after ?? res?.match_result?.ats_score;
        if (typeof newScore === "number") setLiveScore(Math.min(100, Math.max(0, newScore)));
        else if (typeof newScore === "string") {
          const n = parseFloat(newScore);
          if (!isNaN(n)) setLiveScore(Math.min(100, Math.max(0, n)));
        }
      } catch { /* local state already updated */ }
    }
    if (resumeId) {
      try { await parserRemoveSkills(resumeId, s); } catch { /* best effort */ }
    }
  }, [matchId, resumeId]);

  const handleDownload = React.useCallback(async () => {
    if (!resumeId) return;
    try { await downloadResumePdf(resumeId); } catch { /* silent */ }
  }, [resumeId]);

  const score = liveScore;

  // Merge newly-added skills back into parsedData so the template renders them
  const mergedParsedData = React.useMemo(() => {
    if (!addedSkillFields.length) return parsedResumeData;
    const base = parsedResumeData?.parsed_data ?? parsedResumeData ?? {};
    const existing: string[] = Array.isArray(base.skills)
      ? base.skills
      : Array.isArray(base.technical_skills)
      ? base.technical_skills
      : [];
    const merged = Array.from(new Set([...existing, ...addedSkillFields]));
    return { ...parsedResumeData, parsed_data: { ...base, skills: merged } };
  }, [parsedResumeData, addedSkillFields]);

  const matchResult = matchResults?.data?.match_result ?? {};
  const techSkills   = matchResult?.Technical_Skills ?? {};
  const softSkills   = matchResult?.Soft_Skills ?? {};

  const matchedTechSkills: string[] = [
    ...(techSkills.matched_critical_skills ?? []).map((s: { skill: string }) => s.skill),
    ...(techSkills.matched_important_skills ?? []).map((s: { skill: string }) => s.skill),
    ...(techSkills.matched_nice_to_have    ?? []).map((s: { skill: string }) => s.skill),
  ];
  const missingTechSkills: string[] = [
    ...(techSkills.missing_critical_skills  ?? []).map((s: { skill: string }) => s.skill),
    ...(techSkills.missing_important_skills ?? []).map((s: { skill: string }) => s.skill),
    ...(techSkills.missing_nice_to_have     ?? []).map((s: { skill: string }) => s.skill),
  ];
  const matchedSoftSkills: string[] = softSkills.matched_skills ?? [];
  const missingSoftSkills: string[] = softSkills.missing_skills ?? [];
  const capSkills   = matchResult?.Capabilities_Check ?? {};
  const certSkills  = matchResult?.Certifications_Check ?? {};
  const jobTitle    = matchResult?.Job_Title_Check ?? {};
  const starCheck   = matchResult?.STAR_Pattern_Check ?? {};

  const matchedCapabilities: string[] = [
    // Capabilities
    ...(capSkills.matched_capabilities ?? []).map((c: { capability: string }) => c.capability),
    // Certifications
    ...(certSkills.matched_certifications ?? []).map((c: { certification?: string; name?: string }) => c.certification ?? c.name ?? "").filter(Boolean),
    // Job title
    ...(jobTitle.matched_title ? [jobTitle.matched_title] : []),
    ...(jobTitle.jd_title ? [jobTitle.jd_title] : []),
    // STAR matched bullets (first few words as phrase)
    ...(starCheck.strong_bullets ?? []).map((b: { text?: string; bullet?: string }) => b.text ?? b.bullet ?? "").filter(Boolean),
  ];

  const totalMatchedCount = matchedTechSkills.length + matchedSoftSkills.length;
  const totalMissingCount = missingTechSkills.length + missingSoftSkills.length;

  // Sections shown in the active list
  const activePredefined = ALL_SECTIONS.filter((s) => activeSectionIds.includes(s.id));
  // Sections available to add
  const additionalPredefined = ALL_SECTIONS.filter((s) => !activeSectionIds.includes(s.id));

  const addSection = (id: string) => {
    setActiveSectionIds((prev) => [...prev, id]);
  };

  const addCustomSection = () => {
    const name = customName.trim();
    if (!name) return;
    const id = `custom_${Date.now()}`;
    setCustomSections((prev) => [...prev, { id, label: name }]);
    setActiveSectionIds((prev) => [...prev, id]);
    setResumeSections((prev) => ({ ...prev, [id]: [] }));
    setCustomName("");
    setShowCustomInput(false);
  };

  const openSectionLabel =
    ALL_SECTIONS.find((s) => s.id === openSection)?.label ??
    customSections.find((s) => s.id === openSection)?.label ?? "";

  // All sections in the active list (predefined + custom)
  const allActiveSections = [
    ...activePredefined,
    ...customSections.filter((c) => activeSectionIds.includes(c.id)).map((c) => ({
      id: c.id, label: c.label, icon: AlignLeft, hasAI: false,
    })),
  ];

  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden flex flex-col">
      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #f3f4f6; border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: #e5e7eb; }
      `}</style>
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Section list sidebar (edit mode only) — fixed overlay, does not disturb layout */}
        {isEditMode && (
          <>
            {/* Backdrop blur — only within the content area */}
            <div
              className="absolute inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setIsEditMode(false)}
            />
          <div className="absolute top-0 left-0 h-full z-50 w-[320px] bg-white border-r border-gray-100 overflow-y-auto flex flex-col animate-slide-in-left shadow-2xl" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
            {/* Sidebar Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 bg-white shrink-0">
              <button
                onClick={() => setIsEditMode(false)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 hover:text-[#2557a7] mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Preview
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-6 rounded-full bg-[#2557a7]" />
                <div>
                  <p className="text-[16px] font-bold text-gray-900">Resume Sections</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Click a section to edit its content</p>
                </div>
              </div>
            </div>

            {/* Active sections */}
            <div className="px-4 py-3 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your Sections</p>
              {allActiveSections.map((section) => (
                <div
                  key={section.id}
                  onClick={() => setOpenSection(section.id)}
                  className="group flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all duration-150"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-gray-200 group-hover:border-blue-200 group-hover:bg-blue-100 text-gray-500 group-hover:text-[#2557a7] transition-all">
                      <section.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-700 group-hover:text-[#2557a7] transition-colors">
                      {section.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {section.hasAI && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-violet-50 font-semibold text-violet-600 rounded-full border border-violet-100">
                        <RiSparkling2Fill size={10} className="mr-0.5" />AI
                      </span>
                    )}
                    <FaCheckCircle size={12} className="text-emerald-400" />
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-[#2557a7] transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Sections */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Add Sections</p>
              <div className="space-y-1.5">
                {additionalPredefined.map((section) => (
                  <div
                    key={section.id}
                    className="group flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                    onClick={() => addSection(section.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-blue-100 group-hover:border-blue-200 text-gray-400 group-hover:text-[#2557a7] transition-all">
                        <section.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[13px] font-semibold text-gray-500 group-hover:text-[#2557a7]">
                        {section.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {section.hasAI && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-violet-50 font-semibold text-violet-600 rounded-full border border-violet-100">
                          <RiSparkling2Fill size={10} className="mr-0.5" />AI
                        </span>
                      )}
                      <Plus size={14} className="text-gray-300 group-hover:text-[#2557a7] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Sections */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Custom Sections</p>
              {showCustomInput ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCustomSection(); if (e.key === "Escape") setShowCustomInput(false); }}
                    placeholder="e.g. Patents, Volunteer Work"
                    className="w-full px-3 py-2 text-[13px] border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                  <div className="flex gap-2">
                    <button onClick={addCustomSection} className="flex-1 py-2 text-[12px] font-semibold bg-[#2557a7] text-white rounded-xl hover:bg-[#1f4e98] transition-colors">Add</button>
                    <button onClick={() => { setShowCustomInput(false); setCustomName(""); }} className="flex-1 py-2 text-[12px] font-semibold border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold text-[#2557a7] border border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <Plus size={13} /> Add Custom Section
                </button>
              )}
            </div>
          </div>
          </>
        )}

        {/* CENTER — Resume Preview (always visible) */}
        <div className="flex-1 overflow-y-auto bg-[#f1f5f9] border-r border-gray-200 px-8 py-6 space-y-5" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                {onBackToUpload && (
                  <button
                    onClick={onBackToUpload}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-gray-500 hover:text-[#2557a7] hover:bg-blue-50 rounded-lg border border-gray-200 transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-[#2557a7]" />
                  <h3 className="text-[13px] font-bold text-gray-700 tracking-wide uppercase">Resume Preview</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDownload} disabled={!resumeId} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:text-[#2557a7] hover:bg-blue-50 rounded-lg border border-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={() => setIsEditMode((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-lg border transition-all ${isEditMode ? "bg-[#2557a7] text-white border-[#2557a7] hover:bg-[#1e4a96]" : "text-gray-600 border-gray-200 hover:text-[#2557a7] hover:bg-blue-50"}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {isEditMode ? "Close Editor" : "Edit"}
                </button>
              </div>
            </div>
            <div className="overflow-auto p-5" style={{ zoom: 1.1, scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
              {pdfError ? (
                <PDFPreviewError error={pdfError} />
              ) : (
                <ResumePreview
                  pdfBlobUrl={pdfBlobUrl}
                  pdfError={pdfError}
                  isLoading={isLoading}
                  isUpdating={isUpdating}
                  isDocx={isDocx}
                  docxBlob={docxBlob}
                  parsedData={mergedParsedData}
                  resumeId=""
                  addedFields={{ skills: addedSkillFields }}
                  editOverrides={resumeSections}
                  onEditSection={(key) => { setIsEditMode(true); setOpenSection(key); }}
                  onDeleteSection={(key) => { setDeletedSectionIds((prev) => [...prev, key]); setActiveSectionIds((prev) => prev.filter((id) => id !== key)); }}
                  deletedSections={deletedSectionIds}
                />
              )}
            </div>

          </div>

          {/* Score Breakdown — below resume preview */}
          <ScoreBreakdown matchResult={matchResult} />

          {/* Match Penalties — improvement suggestions */}
          <MatchPenalties
            matchResult={matchResult}
            onAddSkill={directAddSkill}
            onRemoveSkill={directRemoveSkill}
          />
        </div>

        {/* RIGHT — ATS Score + Job Description */}
        <div className="w-[520px] shrink-0 overflow-y-auto bg-white border-l border-gray-100 p-5 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>

          {/* ATS Score Card */}
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-[#f8faff] to-white shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 rounded-full bg-[#2557a7]" />
              <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">ATS Match Score</h3>
            </div>
            <div className="flex flex-col items-center mb-4">
              <div className="w-32 h-32">
                <MultiColorCircularScore value={score} />
              </div>
              <p className="text-[11px] text-gray-400 mt-2 font-medium">Overall Score</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center bg-red-50 rounded-xl py-2.5 border border-red-100">
                <p className="text-[18px] font-bold text-red-500">{totalMissingCount}</p>
                <p className="text-[10px] text-red-400 font-semibold mt-0.5">Missing</p>
              </div>
              <div className="text-center bg-green-50 rounded-xl py-2.5 border border-green-100">
                <p className="text-[18px] font-bold text-green-600">{totalMatchedCount}</p>
                <p className="text-[10px] text-green-500 font-semibold mt-0.5">Matched</p>
              </div>
              <div className="text-center bg-blue-50 rounded-xl py-2.5 border border-blue-100">
                <p className="text-[18px] font-bold text-[#2557a7]">{activeSectionIds.length}</p>
                <p className="text-[10px] text-blue-400 font-semibold mt-0.5">Sections</p>
              </div>
            </div>
          </div>

          {/* Job Description Card */}
          <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f8faff] border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-[#2557a7]" />
                <p className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">Job Description</p>
              </div>
              <button
                onClick={() => { try { navigator.clipboard.writeText(jdText); } catch {} }}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-gray-400 hover:text-[#2557a7] hover:bg-blue-50 rounded-lg transition-all"
              >
                <FileText className="w-3 h-3" /> Copy
              </button>
            </div>
            <div className="p-4 max-h-[32rem] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
              {jdText ? (
                <JDHighlighter
                  text={jdText}
                  matchedSkills={matchedTechSkills}
                  missingSkills={missingTechSkills}
                  matchedSoftSkills={matchedSoftSkills}
                  missingSoftSkills={missingSoftSkills}
                  matchedCapabilities={matchedCapabilities}
                  onMissingSkillClick={directAddSkill}
                />
              ) : (
                <p className="text-gray-400 text-sm">No job description available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Editor Modal — popup with blur like Resume Builder */}
      {openSection && (
        <JobMatchSectionEditor
          sectionKey={openSection}
          sectionLabel={openSectionLabel}
          initialData={resumeSections[openSection] ?? []}
          onSave={(key, data) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setResumeSections((prev: Record<string, any>) => ({ ...prev, [key]: data }));
            setOpenSection(null);
          }}
          onClose={() => setOpenSection(null)}
        />
      )}
    </div>
  );
}
