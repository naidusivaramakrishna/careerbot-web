"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import JDHighlighter from "../highlighter/JDHighlighter";
import JDHeader from "../highlighter/JDHeader";
import ResumePreview from "../resume/ResumePreview";
import PDFPreviewError from "./PDFPreviewError";
import { useMatchAnalysis } from "../_hooks/useMatchAnalysis";
import { useResumePDF } from "../_hooks/useResumePDF";
import { useSkillUpdate } from "../_hooks/useSkillUpdate";
import { AnalysisContentProps } from "../_types";
import httpClient from "@/lib/http";
import { Eye, Plus, Check, ChevronLeft, User, AlignLeft, Code2, Heart, GraduationCap, FolderOpen, Building2, Award, Star, Globe, Edit3, Download, HelpCircle, Target, Briefcase, FileText } from "lucide-react";
import JobMatchSectionEditor from "../resume/JobMatchSectionEditor";

/* ── resume section definitions ── */
const RESUME_SECTIONS = [
  { key: "contact",        label: "Contact",            Icon: User },
  { key: "summary",        label: "Summary",            Icon: AlignLeft },
  { key: "skills",         label: "Technical Skills",   Icon: Code2 },
  { key: "softSkills",     label: "Soft Skills",        Icon: Heart },
  { key: "experience",     label: "Experience",         Icon: Briefcase },
  { key: "education",      label: "Education",          Icon: GraduationCap },
  { key: "projects",       label: "Projects",           Icon: FolderOpen },
  { key: "internships",    label: "Internships",        Icon: Building2 },
  { key: "certifications", label: "Certifications",     Icon: Award },
  { key: "achievements",   label: "Achievements",       Icon: Star },
  { key: "awards",         label: "Awards",             Icon: Award },
  { key: "languages",      label: "Languages",          Icon: Globe },
  { key: "volunteering",   label: "Volunteering",       Icon: Heart },
  { key: "publications",   label: "Publications",       Icon: FileText },
  { key: "references",     label: "References",         Icon: User },
  { key: "extracurricular",label: "Extracurricular",    Icon: Star },
  { key: "hobbies",        label: "Hobbies",            Icon: Star },
  { key: "interests",      label: "Interests",          Icon: Target },
] as const;

/* ── helpers ── */
const clamp01 = (x: number) => Math.max(0, Math.min(100, x));
const scoreLabel = (s: number) => {
  if (s >= 80) return { text: "Excellent Match", color: "text-emerald-600", ring: "#10b981" };
  if (s >= 60) return { text: "Good Match",      color: "text-amber-500",   ring: "#f59e0b" };
  if (s >= 40) return { text: "Fair Match",       color: "text-orange-500",  ring: "#f97316" };
  return             { text: "Needs Improvement", color: "text-red-500",     ring: "#ef4444" };
};
const toStrArr = (arr: any[]) =>
  arr.map((x: any) => (typeof x === "string" ? x : x?.skill)).filter(Boolean);

const AnalysisContent: React.FC<AnalysisContentProps> = ({
  jdText,
  matchResults: initialMatchResults,
  parsedResumeData,
  onBackToUpload,
}) => {
  const [activeView, setActiveView] = useState<"resume" | "jd">("resume");
  const [activeResumeSection, setActiveResumeSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editOverrides, setEditOverrides] = useState<Record<string, any>>({});
  const [addedFields, setAddedFields] = useState<Record<string, string[]>>({});
  const [deletedSections, setDeletedSections] = useState<string[]>([]);
  const [localAdded, setLocalAdded] = useState<Set<string>>(new Set());
  const [resumeFont] = useState<string>("Inter, ui-sans-serif, sans-serif");
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const docScrollRef = useRef<HTMLDivElement>(null);

  /* ── extract current section data for the editor modal ── */
  const getSectionData = useCallback((key: string): any => {
    if (editOverrides[key] !== undefined) return editOverrides[key];
    const d = ((parsedResumeData as any)?.parsed_data ?? parsedResumeData ?? {}) as any;
    const llm = d?.llm_data ?? {};
    switch (key) {
      case "contact": {
        const c = d.contact || llm.contact || llm.personal_info || {};
        const sl = d.social_links || llm.social_links || {};
        return {
          name: c.name || c.full_name || d.name || "",
          title: c.title || c.role || c.designation || c.job_title || d.title || llm.title || "",
          email: c.email || "",
          phone: c.phone || c.phone_number || c.mobile || "",
          location: c.location || c.address || "",
          linkedin: sl.linkedIn || sl.linkedin || c.linkedin || "",
          github: sl.github || sl.GitHub || c.github || "",
          portfolio: sl.portfolio || sl.website || c.website || "",
        };
      }
      case "summary":
        return d.professionalSummary || d.professional_summary || d.career_objective || d.objective || d.summary ||
               llm.professionalSummary || llm.professional_summary || llm.summary || "";
      case "skills": {
        let s = d.skills || d.technical_skills || llm.skills || llm.technical_skills || [];
        if (!Array.isArray(s)) s = typeof s === "object" ? Object.values(s).flat() : [];
        return (s as any[]).map((x: any) => typeof x === "string" ? x : (x?.skill || x?.name || "")).filter(Boolean);
      }
      case "softSkills": {
        let s = d.soft_skills || llm.soft_skills || [];
        if (!Array.isArray(s)) s = [];
        return (s as any[]).map((x: any) => typeof x === "string" ? x : (x?.skill || x?.name || "")).filter(Boolean);
      }
      case "experience":     return d.workExperience || d.work_experience || d.experience || llm.workExperience || llm.work_experience || [];
      case "education":      return d.education || d.educational_qualifications || llm.education || [];
      case "projects":       return d.projects || d.project_details || llm.projects || [];
      case "internships":    return d.internships || llm.internships || [];
      case "certifications":  return d.certifications || d.certificates || llm.certifications || [];
      case "achievements":    return d.achievements || llm.achievements || [];
      case "awards":          return d.awards || llm.awards || [];
      case "languages":       return d.languages || d.languages_known || llm.languages || [];
      case "volunteering":    return d.volunteering || llm.volunteering || [];
      case "publications":    return d.publications || llm.publications || [];
      case "references":      return d.references || llm.references || [];
      case "extracurricular": return d.certificate_of_participation || llm.certificate_of_participation || d.extracurricular_activities || llm.extracurricular_activities || d.activities || llm.activities || [];
      case "hobbies":         return d.hobbies || llm.hobbies || d.hobbies_and_interests || llm.hobbies_and_interests || [];
      case "interests":       return d.interests || llm.interests || [];
      default: return null;
    }
  }, [parsedResumeData, editOverrides]);

  /* ── show toolbar on scroll ── */
  useEffect(() => {
    const el = docScrollRef.current;
    if (!el) return;
    const onScroll = () => setToolbarVisible(el.scrollTop > 10);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  /* ── save section edits ── */
  const handleSaveSection = useCallback((key: string, data: any) => {
    const original = getSectionData(key);
    setEditOverrides(prev => ({ ...prev, [key]: data }));

    const changed: string[] = [];
    if (key === 'contact') {
      const fields = ['name', 'title', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio'];
      for (const f of fields) {
        const oldVal = (original as any)?.[f] || '';
        const newVal = (data as any)?.[f] || '';
        if (newVal && newVal !== oldVal) changed.push(f);
      }
    } else if (key === 'summary') {
      const oldVal = typeof original === 'string' ? original : '';
      const newVal = typeof data === 'string' ? data : '';
      if (newVal && newVal !== oldVal) changed.push('text');
    } else if (key === 'skills' || key === 'softSkills') {
      const origSet = new Set((Array.isArray(original) ? original : []).map((s: string) => s.toLowerCase()));
      for (const skill of (Array.isArray(data) ? data : [])) {
        if (!origSet.has(skill.toLowerCase())) changed.push(skill);
      }
    } else if (Array.isArray(data)) {
      const orig = Array.isArray(original) ? original : [];
      for (let i = 0; i < data.length; i++) {
        if (JSON.stringify(data[i]) !== JSON.stringify(orig[i])) changed.push(String(i));
      }
    }

    if (changed.length) {
      setAddedFields(prev => ({
        ...prev,
        [key]: [...new Set([...(prev[key] || []), ...changed])],
      }));
    }
  }, [getSectionData]);

  /* ── delete / restore section ── */
  const handleDeleteSection = useCallback((key: string) => {
    setDeletedSections(prev => prev.includes(key) ? prev : [...prev, key]);
    if (activeResumeSection === key) setActiveResumeSection(null);
  }, [activeResumeSection]);

  /* ── available resume sections (derived from parsedResumeData) ── */
  const availableSections = useMemo(() => {
    if (!parsedResumeData) return [];
    const d = (parsedResumeData?.parsed_data ?? parsedResumeData) as any;
    const llm = d?.llm_data ?? {};
    const hasData = (keys: string[]) =>
      keys.some(k => { const v = d[k] ?? llm[k]; return Array.isArray(v) ? v.length > 0 : !!v; });
    return RESUME_SECTIONS.filter(({ key }) => {
      switch (key) {
        case "contact":        return hasData(["contact", "personal_info"]);
        case "summary":        return hasData(["professionalSummary", "professional_summary", "summary", "career_objective", "objective"]);
        case "skills":         return hasData(["skills", "technical_skills"]);
        case "softSkills":     return hasData(["soft_skills"]);
        case "experience":     return hasData(["workExperience", "work_experience", "experience", "professional_experience"]);
        case "education":      return hasData(["education", "educational_qualifications"]);
        case "projects":       return hasData(["projects", "project_details"]);
        case "internships":    return hasData(["internships"]);
        case "certifications":  return hasData(["certifications", "certificates"]);
        case "achievements":    return hasData(["achievements"]);
        case "awards":          return hasData(["awards", "honors"]);
        case "languages":       return hasData(["languages", "languages_known"]);
        case "volunteering":    return hasData(["volunteering", "volunteer", "volunteer_work"]);
        case "publications":    return hasData(["publications", "research_papers", "papers"]);
        case "references":      return hasData(["references"]);
        case "extracurricular": return hasData(["certificate_of_participation", "extracurricular_activities", "activities", "extracurricular"]);
        case "hobbies":         return hasData(["hobbies", "hobbies_and_interests"]);
        case "interests":       return hasData(["interests"]);
        default: return false;
      }
    });
  }, [parsedResumeData]);

  const { matchResults, setMatchResults, resolveResumeId, score } = useMatchAnalysis(initialMatchResults);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [matchId, setMatchId]   = useState<string | null>(null);

  useEffect(() => {
    const id = resolveResumeId(parsedResumeData);
    if (id) setResumeId(id);
    const mid =
      matchResults?.match_id || matchResults?.data?.match_id ||
      initialMatchResults?.match_id || initialMatchResults?.data?.match_id || null;
    if (mid) setMatchId(mid);
  }, [resolveResumeId, parsedResumeData, initialMatchResults, matchResults]);

  const { pdfBlobUrl, pdfError, isLoading, isDocx, docxBlob, refetch } = useResumePDF(resumeId, matchId);

  // Persist matchResults to sessionStorage after every skill add/remove so reload restores correct state
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!matchResults) return;
    try { sessionStorage.setItem('jm_matchResults', JSON.stringify(matchResults)); } catch {}
  }, [matchResults]);
  const { handleAddSingleSkill, handleRemoveSingleSkill, isUpdating } = useSkillUpdate(
    resumeId, matchResults, () => resolveResumeId(parsedResumeData), setMatchResults, refetch
  );

  const addSkill = useCallback(async (skill: string, type: "technical" | "soft") => {
    setLocalAdded(prev => new Set([...prev, skill]));
    await handleAddSingleSkill(skill, type);
  }, [handleAddSingleSkill]);

  const removeSkill = useCallback(async (skill: string, type: "technical" | "soft") => {
    setLocalAdded(prev => { const s = new Set(prev); s.delete(skill); return s; });
    await handleRemoveSingleSkill(skill, type);
  }, [handleRemoveSingleSkill]);

  /* ── skill arrays ── */
  const missingCritical   = useMemo(() => toStrArr(matchResults?.data?.match_result?.Technical_Skills?.missing_critical_skills   || []), [matchResults]);
  const missingImportant  = useMemo(() => toStrArr(matchResults?.data?.match_result?.Technical_Skills?.missing_important_skills  || []), [matchResults]);
  const missingNiceToHave = useMemo(() => toStrArr(matchResults?.data?.match_result?.Technical_Skills?.missing_nice_to_have      || []), [matchResults]);
  const missingSoft       = useMemo(() => toStrArr(matchResults?.data?.match_result?.Soft_Skills?.missing_skills                 || []), [matchResults]);
  const matchedCritical   = useMemo(() => toStrArr(matchResults?.data?.match_result?.Technical_Skills?.matched_critical_skills   || []), [matchResults]);
  const matchedImportant  = useMemo(() => toStrArr(matchResults?.data?.match_result?.Technical_Skills?.matched_important_skills  || []), [matchResults]);
  const matchedNiceToHave = useMemo(() => toStrArr(matchResults?.data?.match_result?.Technical_Skills?.matched_nice_to_have      || []), [matchResults]);
  const matchedSoft       = useMemo(() => toStrArr(matchResults?.data?.match_result?.Soft_Skills?.matched_skills                 || []), [matchResults]);

  const allMatched = useMemo(() => [...matchedCritical, ...matchedImportant, ...matchedNiceToHave, ...matchedSoft], [matchedCritical, matchedImportant, matchedNiceToHave, matchedSoft]);
  const allMissing = useMemo(() => [...missingCritical, ...missingImportant, ...missingNiceToHave, ...missingSoft], [missingCritical, missingImportant, missingNiceToHave, missingSoft]);
  const totalMissing = allMissing.length;

  const resumeDataWithSkills = useMemo(() => {
    const t = matchResults?.data?.newly_added_skills || [];
    const s = matchResults?.data?.newly_added_soft_skills || [];
    if (!t.length && !s.length) return parsedResumeData;
    return { ...parsedResumeData, newly_added_skills: t, newly_added_soft_skills: s };
  }, [parsedResumeData, matchResults?.data?.newly_added_skills, matchResults?.data?.newly_added_soft_skills]);


  /* ── gauge ── */
  const sl = scoreLabel(score);
  const gR = 90, gS = 12, gNR = gR - gS / 2;
  const gC = gNR * 2 * Math.PI;
  const gOff = gC - (clamp01(score) / 100) * gC;

  /* ── skill breakdown percentages ── */
  const techMatched = matchedCritical.length + matchedImportant.length + matchedNiceToHave.length;
  const techTotal   = techMatched + missingCritical.length + missingImportant.length + missingNiceToHave.length;
  const softTotal   = matchedSoft.length + missingSoft.length;
  const techPct     = techTotal  > 0 ? Math.round((techMatched      / techTotal)  * 100) : 0;
  const softPct     = softTotal  > 0 ? Math.round((matchedSoft.length / softTotal) * 100) : 0;

  /* ── download ── */
  const [downloading, setDownloading] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const handleDownload = useCallback(async (fmt: "pdf" | "docx" = "pdf") => {
    if (!resumeId) return;
    setDownloading(true);
    try {
      const res = await httpClient.get(`/parser/download/${resumeId}?format=${fmt}`, { responseType: "blob" });
      const ct = res.headers["content-type"] || "";
      const ext = fmt === "docx" || ct.includes("openxml") || ct.includes("wordprocessingml") ? "docx" : "pdf";
      const cd = res.headers["content-disposition"];
      let fn = `resume_${Date.now()}.${ext}`;
      if (cd) { const m = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/); if (m?.[1]) fn = m[1].replace(/['"]/g, ""); }
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a"); a.href = url; a.download = fn;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { /* silent */ }
    finally { setDownloading(false); }
  }, [resumeId]);

  /* ── skill tag ── */
  const Tag = ({ skill, type, hover }: { skill: string; type: "technical" | "soft"; hover: string }) => {
    const added = localAdded.has(skill);
    return (
      <button
        onClick={() => added ? removeSkill(skill, type) : addSkill(skill, type)}
        title={added ? `Remove "${skill}"` : `Add "${skill}" to resume`}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
          added ? "bg-emerald-50 border-emerald-300 text-emerald-700" : `border-gray-200 text-gray-600 ${hover}`
        }`}
      >
        {added ? <Check className="w-2.5 h-2.5 shrink-0" /> : <Plus className="w-2.5 h-2.5 shrink-0" />}
        {skill}
      </button>
    );
  };

  /* ── opportunity group ── */
  const OpGroup = ({ title, count, color, skills, type, hover }: {
    title: string; count: number; color: string;
    skills: string[]; type: "technical" | "soft"; hover: string;
  }) => {
    if (!skills.length) return null;
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{title}</span>
          <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${color.replace("text-", "bg-").replace("-500", "-100").replace("-600", "-100")} ${color}`}>{count}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {skills.map(s => <Tag key={s} skill={s} type={type} hover={hover} />)}
        </div>
      </div>
    );
  };

  return (
    <>
    {/* Full-page layout — fills viewport below the fixed header (h-14 = 56px) */}
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-white">

      {/* ══ LEFT SIDEBAR ══ */}
      <div className="w-72 shrink-0 flex flex-col bg-white border-r border-gray-200">

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-800">Job Match</span>
          </div>
          {onBackToUpload && (
            <button
              onClick={onBackToUpload}
              title="New Analysis"
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-lg px-2 py-1 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />New
            </button>
          )}
        </div>

        {/* Sections nav */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {activeView === "resume" && availableSections.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Resume Sections</p>
              <nav className="space-y-0.5">
                {availableSections.filter(s => !deletedSections.includes(s.key)).map(({ key, label, Icon }) => {
                  const active = activeResumeSection === key;
                  return (
                    <div key={key} className={`group flex items-center rounded-xl transition-all ${active ? "bg-blue-600 shadow-sm" : "hover:bg-gray-300"}`}>
                      <button
                        onClick={() => setActiveResumeSection(active ? null : key)}
                        className={`flex-1 flex items-center gap-3 px-3 py-2.5 transition-colors`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-white/20" : "bg-white border border-gray-200 group-hover:border-blue-100"}`}>
                          <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-gray-500"}`} />
                        </div>
                        <span className={`text-sm font-medium truncate ${active ? "text-white" : "text-gray-600 group-hover:text-gray-800"}`}>{label}</span>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setActiveResumeSection(key); setEditingSection(key); }}
                        title={`Edit ${label}`}
                        className={`mr-2 p-1.5 rounded-lg transition-colors ${active ? "text-white/70 hover:text-white hover:bg-white/20" : "text-gray-400 hover:text-gray-700 hover:bg-gray-200"}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </nav>
            </>
          )}
        </div>
      </div>

      {/* ══ CENTER — document viewer ══ */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col bg-[#fafafa]">

        {/* ── Top toolbar — always visible, becomes floating card on scroll ── */}
        <div className="shrink-0 flex items-center justify-center py-3 px-4 bg-[#fafafa]">
          <div className={`flex items-center gap-1 px-3 py-2 transition-all duration-300 ${
            toolbarVisible
              ? "bg-white border border-gray-200 rounded-2xl shadow-lg"
              : "bg-transparent"
          }`}>
            <button
              onClick={() => setActiveView("resume")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeView === "resume" ? "border border-rose-400 text-rose-500" : "text-gray-500 hover:bg-gray-100"}`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={() => { setActiveView("jd"); setActiveResumeSection(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeView === "jd" ? "border border-blue-400 text-blue-600 font-semibold" : "text-gray-500 hover:bg-gray-100"}`}
            >
              <Target className="w-3.5 h-3.5" />
              Resume Tailoring
              <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded ml-0.5">Beta</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 text-xs font-medium hover:bg-gray-100 rounded-full transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
              Help Center
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 relative overflow-hidden">

          {/* Document area — single scroll container */}
          <div ref={docScrollRef} className="h-full overflow-y-auto p-6 flex flex-col items-center">
            {activeView === "resume" && (
              <div className="w-full max-w-4xl flex gap-3 items-start">
                {/* Eye + Download icons beside the card */}
                <div className="flex flex-col gap-3 pt-3 shrink-0">
                  <button title="Preview" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                    <Eye className="w-9 h-9" />
                  </button>
                  <div className="relative">
                    <button
                      title="Download"
                      onClick={() => setDownloadMenuOpen(o => !o)}
                      disabled={downloading}
                      className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
                    >
                      {downloading
                        ? <div className="w-9 h-9 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        : <Download className="w-9 h-9" />
                      }
                    </button>
                    {downloadMenuOpen && (
                      <div className="absolute left-full top-0 ml-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[130px] py-1" onMouseLeave={() => setDownloadMenuOpen(false)}>
                        <button
                          onClick={() => { setDownloadMenuOpen(false); handleDownload("pdf"); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Download className="w-4 h-4 text-red-500" />
                          Download PDF
                        </button>
                        <button
                          onClick={() => { setDownloadMenuOpen(false); handleDownload("docx"); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-blue-500" />
                          Download DOCX
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Resume card */}
                <div className="flex-1 bg-white rounded-xl border border-gray-100 relative" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                {isUpdating && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#2557a7] border-t-transparent" />
                      <p className="text-sm font-semibold text-slate-600">Updating resume…</p>
                    </div>
                  </div>
                )}
                {pdfError
                  ? <div className="flex items-center justify-center p-10"><PDFPreviewError error={pdfError} /></div>
                  : <ResumePreview pdfBlobUrl={pdfBlobUrl} pdfError={pdfError} isLoading={isLoading} isUpdating={isUpdating} isDocx={isDocx} docxBlob={docxBlob} parsedData={resumeDataWithSkills} resumeId={resumeId} activeSection={activeResumeSection} editOverrides={editOverrides} addedFields={addedFields} onEditSection={key => { setActiveResumeSection(key); setEditingSection(key); }} onDeleteSection={handleDeleteSection} deletedSections={deletedSections} fontFamily={resumeFont} />
                }
                </div>
              </div>
            )}

            {activeView === "jd" && (
              <div className="w-full max-w-4xl bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <JDHeader />
                <div className="p-5">
                  <JDHighlighter text={jdText} matchedSkills={allMatched} missingSkills={allMissing} />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div className="w-110 shrink-0 flex flex-col border-l border-gray-200 bg-white">

        {/* Header row */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-gray-100 shrink-0">
          <span className="text-sm font-bold text-gray-800">Fit Score</span>
          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
            score >= 80 ? "bg-emerald-100 text-emerald-700"
            : score >= 60 ? "bg-amber-100 text-amber-700"
            : score >= 40 ? "bg-orange-100 text-orange-700"
            : "bg-red-100 text-red-700"
          }`}>{clamp01(score)} / 100</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* Score donut + quick stats */}
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center" style={{ width: gR * 2, height: gR * 2 }}>
                <svg width={gR * 2} height={gR * 2} className="-rotate-90">
                  <circle stroke="#F3F4F6" fill="transparent" strokeWidth={gS} r={gNR} cx={gR} cy={gR} />
                  <circle stroke={sl.ring} fill="transparent" strokeWidth={gS}
                    strokeDasharray={`${gC} ${gC}`}
                    style={{ strokeDashoffset: gOff, transition: "stroke-dashoffset 1.2s ease-out", filter: `drop-shadow(0 0 6px ${sl.ring}55)` }}
                    strokeLinecap="round" r={gNR} cx={gR} cy={gR}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-gray-900 leading-none">{clamp01(score)}</span>
                  <span className="text-[9px] text-gray-400 tracking-wide mt-0.5">/ 100</span>
                </div>
              </div>

              <p className={`mt-2 text-sm font-bold ${sl.color}`}>{sl.text}</p>
              <p className="mt-1 text-[11px] text-gray-400 text-center leading-snug px-4">
                {score >= 80 ? "Great match for this role."
                  : score >= 60 ? "Let's sharpen it for this specific role."
                  : "Add relevant skills to improve your score."}
              </p>

              {/* Quick stats row */}
              <div className="flex gap-3 mt-4 w-full items-stretch">
                <div className="flex-1 flex flex-col items-center justify-center bg-emerald-50 border border-emerald-100 rounded-xl py-3 min-h-15">
                  <span className="text-xl font-black text-emerald-600 leading-none">{allMatched.length}</span>
                  <span className="text-[10px] text-emerald-500 font-semibold mt-1">Matched</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center bg-red-50 border border-red-100 rounded-xl py-3 min-h-15">
                  <span className="text-xl font-black text-red-500 leading-none">{totalMissing}</span>
                  <span className="text-[10px] text-red-400 font-semibold mt-1">Missing</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center bg-blue-50 border border-blue-100 rounded-xl py-3 min-h-15">
                  <span className="text-xl font-black text-blue-600 leading-none">{allMatched.length + totalMissing}</span>
                  <span className="text-[10px] text-blue-400 font-semibold mt-1">Total</span>
                </div>
              </div>
            </div>

            {/* Skill breakdown bars */}
            {(techTotal > 0 || softTotal > 0) && (
              <>
                <hr className="border-gray-100" />
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKILL BREAKDOWN</p>
                  {techTotal > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-600">Technical Skills</span>
                        <span className="text-xs font-bold text-gray-800">{techPct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                          style={{ width: `${techPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{techMatched} of {techTotal} matched</p>
                    </div>
                  )}
                  {softTotal > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-600">Soft Skills</span>
                        <span className="text-xs font-bold text-gray-800">{softPct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                          style={{ width: `${softPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{matchedSoft.length} of {softTotal} matched</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <hr className="border-gray-100" />

            {/* Opportunities */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OPPORTUNITIES</p>
                {totalMissing > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-500 rounded-full border border-red-100">
                    {totalMissing} to add
                  </span>
                )}
              </div>
              {totalMissing === 0 ? (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-700 font-semibold">All skills matched!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <OpGroup title="High Priority"   count={missingCritical.length}   color="text-red-500"    skills={missingCritical}   type="technical" hover="hover:bg-red-50 hover:text-red-700 hover:border-red-300" />
                  <OpGroup title="Medium Priority" count={missingImportant.length}  color="text-amber-500"  skills={missingImportant}  type="technical" hover="hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300" />
                  <OpGroup title="Nice to Have"    count={missingNiceToHave.length} color="text-blue-500"   skills={missingNiceToHave} type="technical" hover="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300" />
                  <OpGroup title="Soft Skills"     count={missingSoft.length}       color="text-purple-500" skills={missingSoft}       type="soft"      hover="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300" />
                </div>
              )}
            </div>

            {/* Matched skills */}
            {allMatched.length > 0 && (
              <>
                <hr className="border-gray-100" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">MUST-HAVES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allMatched.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <Check className="w-2.5 h-2.5 shrink-0" />{s}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

    </div>

    {/* ══ SECTION EDIT MODAL ══ */}
    {editingSection && (
      <JobMatchSectionEditor
        sectionKey={editingSection}
        sectionLabel={RESUME_SECTIONS.find(s => s.key === editingSection)?.label ?? editingSection}
        initialData={getSectionData(editingSection)}
        onSave={handleSaveSection}
        onClose={() => setEditingSection(null)}
      />
    )}
    </>
  );
};

export default AnalysisContent;
