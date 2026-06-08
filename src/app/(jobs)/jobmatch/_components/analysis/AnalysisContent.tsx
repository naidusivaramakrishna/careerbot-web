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
import { matcherAddSkill } from "@/api/parserApi";
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
      skills:         d.skills ?? d.technical_skills ?? llm.skills ?? llm.technical_skills ?? [],
      softSkills:     d.soft_skills ?? d.softSkills ?? llm.soft_skills ?? [],
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

  // Directly add a skill to the resume (no pending step)
  const directAddSkill = React.useCallback(async (skill: string) => {
    const s = skill.trim();
    if (!s) return;
    setAddedSkillFields((prev) => prev.includes(s) ? prev : [...prev, s]);
    setResumeSections((prev: Record<string, unknown>) => {
      const existing: string[] = Array.isArray(prev.skills) ? prev.skills as string[] : [];
      if (existing.includes(s)) return prev;
      return { ...prev, skills: [...existing, s] };
    });
    if (matchId) {
      try { await matcherAddSkill(matchId, s); } catch { /* local state already updated */ }
    }
  }, [matchId]);

  const score = Math.min(100, Math.max(0, parseInt(String(matchResults?.data?.ats_score || "0"))));

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
    <div className="w-full h-screen bg-gray-50 overflow-hidden flex flex-col">
      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #f3f4f6; border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: #e5e7eb; }
      `}</style>
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Section list sidebar (edit mode only) */}
        {isEditMode && (
          <div className="w-[320px] shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-50 scrollbar-track-transparent flex flex-col">
            <div className="px-4 pt-5 pb-3">
              <button
                onClick={() => setIsEditMode(false)}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 hover:text-[#2557a7] mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Preview
              </button>
              <p className="text-[18px] font-bold text-gray-900">Resume Sections</p>
              <p className="text-xs text-gray-500 mt-0.5">Complete each section to build a perfect resume</p>
            </div>

            {/* Active sections */}
            <div className="px-3 pb-2 space-y-2">
              {allActiveSections.map((section) => (
                <div
                  key={section.id}
                  onClick={() => setOpenSection(section.id)}
                  className="group relative py-1.5 overflow-hidden rounded-lg bg-white border border-gray-300 shadow-sm cursor-pointer hover:border-blue-200 transition-all duration-200"
                >
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-100 text-[#2d2d2d] group-hover:text-[#2557a7] transition-all duration-200">
                        <section.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[15px] font-semibold text-gray-800 group-hover:text-[#2557a7] transition-colors duration-200">
                        {section.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {section.hasAI && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] bg-[#efedf2] font-semibold text-black rounded-full">
                          <RiSparkling2Fill size={12} className="text-[#2557a7] mr-0.5" />AI
                        </span>
                      )}
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#d9f7be]">
                        <FaCheckCircle size={13} className="text-green-600" />
                      </div>
                      <div className="text-gray-400 group-hover:text-[#2557a7] group-hover:bg-blue-100 p-1 rounded-md transition-all duration-200">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Sections */}
            <div className="px-3 pt-2 pb-2 border-t border-gray-200 mt-1">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 mb-2 mt-2">
                <Plus className="w-4 h-4" /> Add New Sections
              </p>
              <div className="space-y-2">
                {additionalPredefined.map((section) => (
                  <div
                    key={section.id}
                    className="group flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-blue-200 transition-all cursor-pointer"
                    onClick={() => addSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-100 text-[#2d2d2d] group-hover:text-[#2557a7] transition-all duration-200">
                        <section.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[14px] font-semibold text-gray-700 group-hover:text-[#2557a7]">
                        {section.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {section.hasAI && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-[#efedf2] font-semibold text-black rounded-full">
                          <RiSparkling2Fill size={10} className="text-[#2557a7] mr-0.5" />AI
                        </span>
                      )}
                      <Plus size={16} className="text-gray-400 group-hover:text-[#2557a7]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Sections */}
            <div className="px-3 pt-2 pb-4 border-t border-gray-200 mt-1">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 mb-2 mt-2">
                <AlignLeft className="w-4 h-4" /> Custom Sections
              </p>
              {showCustomInput ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCustomSection(); if (e.key === "Escape") setShowCustomInput(false); }}
                    placeholder="Section name (e.g., Patents, Awards)"
                    className="flex-1 px-3 py-2 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                  <button
                    onClick={addCustomSection}
                    className="px-3 py-2 text-sm font-semibold bg-[#2557a7] text-white rounded-lg hover:bg-[#1f4e98]"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowCustomInput(false); setCustomName(""); }}
                    className="px-3 py-2 text-sm font-semibold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#2557a7] border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus size={14} /> Add Custom Section
                </button>
              )}
            </div>
          </div>
        )}

        {/* CENTER — Resume Preview (always visible) */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-50 scrollbar-track-transparent bg-gray-50 border-r border-gray-200 px-18 py-5 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                {onBackToUpload && (
                  <button
                    onClick={onBackToUpload}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded border border-gray-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                <h3 className="text-[12px] font-bold text-gray-600 uppercase">Resume Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded border border-gray-200">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={() => setIsEditMode((v) => !v)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded border border-gray-200"
                >
                  <Pencil className="w-4 h-4" />
                  {isEditMode ? "Close Editor" : "Edit"}
                </button>
              </div>
            </div>
            <div className="overflow-auto p-4" style={{ zoom: 1.1, scrollbarWidth: "thin", scrollbarColor: "#f3f4f6 transparent" }}>
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
          />
        </div>

        {/* RIGHT — ATS Score + Job Description */}
        <div className="w-125 shrink-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-50 scrollbar-track-transparent bg-white border-l border-gray-200 p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-[11px] font-bold text-gray-600 mb-2 uppercase tracking-wide">ATS Match Score</h3>
            <div className="flex flex-col items-center mb-3">
              <div className="w-28 h-28">
                <MultiColorCircularScore value={score} />
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">Overall Score</p>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="text-center">
                <p className="text-[16px] font-bold text-red-600">{totalMissingCount}</p>
                <p className="text-[10px] text-gray-500">Missing Skills</p>
              </div>
              <div className="text-center">
                <p className="text-[16px] font-bold text-green-600">{totalMatchedCount}</p>
                <p className="text-[10px] text-gray-500">Matched Skills</p>
              </div>
              <div className="text-center">
                <p className="text-[16px] font-bold text-blue-600">{activeSectionIds.length}</p>
                <p className="text-[10px] text-gray-500">Sections</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
              <p className="text-[12px] font-bold text-gray-600 uppercase">Job Description</p>
              <button
                onClick={() => { try { navigator.clipboard.writeText(jdText); } catch {} }}
                className="text-[10px] font-semibold text-gray-400 hover:text-blue-600 flex items-center gap-1"
              >
                <FileText className="w-3 h-3" /> Copy
              </button>
            </div>
            <div className="p-3 max-h-[32rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-50 scrollbar-track-transparent">
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
