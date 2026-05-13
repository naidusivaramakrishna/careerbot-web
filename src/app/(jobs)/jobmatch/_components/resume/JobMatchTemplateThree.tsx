"use client";

import React from "react";
import { Edit3, Trash2 } from "lucide-react";
import SafeHTML from "@/components/common/SafeHTML";
import AutoPaginator from "@/components/common/AutoPaginator";

interface JobMatchTemplateTHREEProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  activeSection?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editOverrides?: Record<string, any>;
  addedFields?: Record<string, string[]>;
  onEditSection?: (key: string) => void;
  onDeleteSection?: (key: string) => void;
  deletedSections?: string[];
  fontFamily?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepSanitize(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(deepSanitize);
  if ("source" in val && "value" in val) {
    const v = val.value;
    if (v === null || v === undefined) return "";
    return deepSanitize(v);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  for (const key of Object.keys(val)) result[key] = deepSanitize(val[key]);
  return result;
}

const JobMatchTemplateThree: React.FC<JobMatchTemplateTHREEProps> = ({
  data: rawData,
  activeSection,
  editOverrides,
  addedFields,
  onEditSection,
  onDeleteSection,
  deletedSections,
  fontFamily,
}) => {
  const data = deepSanitize(rawData);
  const deleted = deletedSections ?? [];
  const af = addedFields ?? {};
  const ov = editOverrides ?? {};

  const hlStyle: React.CSSProperties = {
    backgroundColor: "rgba(34,197,94,0.25)",
    borderRadius: "3px",
    padding: "0 2px",
  };
  const hl = (section: string, field: string, value: React.ReactNode): React.ReactNode =>
    (af[section] || []).includes(field) ? <span style={hlStyle}>{value}</span> : <>{value}</>;
  const hlIdx = (section: string, idx: number): boolean =>
    (af[section] || []).includes(String(idx));

  const parsedData = data?.parsed_data || data || {};
  const llmData = parsedData?.llm_data || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enhancedResume: Record<string, any> = data?.enhanced_resume || {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toStr = (v: any): string => {
    if (typeof v === "string") return v;
    if (v && typeof v === "object") {
      if (typeof v.value === "string") return v.value;
      if (typeof v.text === "string") return v.text;
      if (typeof v.name === "string") return v.name;
    }
    return "";
  };

  const contact = data?.contact || parsedData.contact || llmData.contact || llmData.personal_info || {};
  const name = toStr(
    ov.contact?.name || data?.contact?.name || data?.contact?.full_name ||
    contact.name || contact.full_name || parsedData.name || llmData.name ||
    llmData.personal_info?.name || parsedData.personalInfo?.fullName
  ) || "Your Name";

  const title = toStr(
    ov.contact?.title || contact.title || contact.role || contact.designation ||
    contact.job_title || parsedData.title || llmData.title
  );
  const email = toStr(ov.contact?.email || data?.contact?.email || contact.email || parsedData.email || parsedData.personalInfo?.email);
  const phone = toStr(ov.contact?.phone || data?.contact?.phone || contact.phone || contact.phone_number || parsedData.personalInfo?.phone);
  const location = toStr(ov.contact?.location || data?.contact?.location || contact.location || parsedData.personalInfo?.location);
  const socialLinks = parsedData.social_links || llmData.social_links || parsedData.personalInfo || {};
  const linkedin = toStr(ov.contact?.linkedin || socialLinks.linkedIn || socialLinks.linkedin || socialLinks.linkedinUrl || contact.linkedin);
  const github = toStr(ov.contact?.github || socialLinks.github || socialLinks.GitHub || socialLinks.githubUrl || contact.github);
  const portfolio = toStr(ov.contact?.portfolio || socialLinks.portfolio || socialLinks.website || socialLinks.portifolioUrl || contact.website);

  let professionalSummary = ov.summary ?? (
    parsedData.professionalSummary || parsedData.professional_summary ||
    parsedData.career_objective || parsedData.objective || parsedData.summary ||
    llmData.professionalSummary || llmData.professional_summary || llmData.summary || ""
  );
  if (professionalSummary && typeof professionalSummary === "object") professionalSummary = toStr(professionalSummary);
  if (typeof professionalSummary === "string" && professionalSummary.startsWith("{")) {
    try { const p = JSON.parse(professionalSummary); professionalSummary = p.summary || p.objective || professionalSummary; } catch { /* keep */ }
  }

  let education = ov.education ?? (parsedData.education || parsedData.educational_qualifications || llmData.education || []);
  if (!Array.isArray(education)) education = [];

  let workExperience = ov.experience ?? (
    parsedData.workExperience || parsedData.work_experience || parsedData.experience ||
    parsedData.professional_experience || llmData.workExperience || llmData.work_experience || llmData.experience || []
  );
  if (!Array.isArray(workExperience)) workExperience = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workExperience = workExperience.filter((e: any) => e.company || e.role || e.title || e.position || e.organization);

  let projects = ov.projects ?? (parsedData.projects || parsedData.project_details || llmData.projects || []);
  if (!Array.isArray(projects)) projects = [];

  let skills = ov.skills ?? (parsedData.skills || parsedData.technical_skills || llmData.skills || llmData.technical_skills || []);
  if (!Array.isArray(skills)) { if (typeof skills === "object") skills = Object.values(skills).flat(); else skills = []; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skills = (skills as any[]).map((s: any) => {
    if (typeof s === "object" && s !== null) return toStr(s.skill || s.name || s.value || s);
    return toStr(s);
  }).filter(Boolean);

  const newlyAddedSkills: string[] = ov.skills ? [] : (data?.newly_added_skills || []);
  const newlyAddedSkillsSet = new Set(newlyAddedSkills.map((s: string) => s.toLowerCase()));
  if (newlyAddedSkills.length > 0) skills = [...skills, ...newlyAddedSkills];

  let softSkills = ov.softSkills ?? (parsedData.soft_skills || llmData.soft_skills || []);
  if (!Array.isArray(softSkills)) softSkills = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  softSkills = (softSkills as any[]).map((s: any) => {
    if (typeof s === "object" && s !== null) return toStr(s.skill || s.name || s.value || s);
    return toStr(s);
  }).filter(Boolean);

  const newlyAddedSoftSkills: string[] = data?.newly_added_soft_skills || [];
  const newlyAddedSoftSkillsSet = new Set(newlyAddedSoftSkills.map((s: string) => s.toLowerCase()));
  if (newlyAddedSoftSkills.length > 0) softSkills = [...softSkills, ...newlyAddedSoftSkills];

  let internships = ov.internships ?? (parsedData.internships || parsedData.internship_details || llmData.internships || []);
  if (!Array.isArray(internships)) internships = [];

  let certifications = ov.certifications ?? (
    parsedData.certifications || parsedData.certificates || parsedData.certification_details ||
    parsedData.professional_certifications || parsedData.courses || parsedData.training ||
    llmData.certifications || llmData.certificates || llmData.certification_details ||
    llmData.professional_certifications || llmData.courses || llmData.training ||
    enhancedResume.certifications || enhancedResume.certificates || []
  );
  if (!Array.isArray(certifications)) certifications = [];
  // Filter out items that have no extractable name (null-value placeholders from raw parse)
  certifications = certifications.filter((c: unknown) => {
    if (!c) return false;
    if (typeof c === "string") return c.trim() !== "";
    if (typeof c === "object") {
      const o = c as Record<string, unknown>;
      return !!(o.name || o.title || o.certification || o.course_name || o.course ||
                o.certification_name || o.certificate_name || o.cert_name);
    }
    return false;
  });

  let achievements = ov.achievements ?? (parsedData.achievements || llmData.achievements || []);
  if (!Array.isArray(achievements)) achievements = [];

  let awards = parsedData.awards || llmData.awards || [];
  if (!Array.isArray(awards)) awards = [];

  let volunteering = parsedData.volunteering || llmData.volunteering || [];
  if (!Array.isArray(volunteering)) volunteering = [];

  let languages = ov.languages ?? (parsedData.languages || parsedData.languages_known || llmData.languages || []);
  if (typeof languages === "string") languages = languages.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
  if (!Array.isArray(languages)) languages = [];

  let publications = parsedData.publications || llmData.publications || [];
  if (!Array.isArray(publications)) publications = [];

  let references = parsedData.references || llmData.references || [];
  if (!Array.isArray(references)) references = [];

  let hobbies = parsedData.hobbies || llmData.hobbies || [];
  if (!Array.isArray(hobbies)) hobbies = [];

  let interests = parsedData.interests || llmData.interests || [];
  if (!Array.isArray(interests)) interests = [];

  const personalDetails = parsedData.personal_details || llmData.personal_details || {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseDescription = (desc: any): string[] => {
    if (!desc) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unwrap = (item: any): string => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        if (typeof item.value === "string") return item.value;
        if (typeof item.text === "string") return item.text;
      }
      return String(item ?? "");
    };
    if (Array.isArray(desc)) return desc.map(unwrap).filter(Boolean);
    if (typeof desc === "string") return desc.split(/\n+|•|\*|-(?=\s)/).map((s: string) => s.trim()).filter(Boolean);
    if (desc && typeof desc === "object" && typeof desc.value === "string") return desc.value ? [desc.value] : [];
    return [];
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    if (/^[A-Za-z]{3}\s\d{2,4}$/.test(dateString)) return dateString;
    if (/^\d{4}-\d{2}$/.test(dateString)) {
      const [year, month] = dateString.split("-");
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${months[parseInt(month, 10) - 1]} ${year}`;
    }
    return dateString;
  };

  const baseFont = fontFamily || "Arial, Helvetica, sans-serif";

  const sc = (key: string) =>
    `relative group/section${activeSection === key ? " bg-blue-50 rounded px-1 -mx-1" : ""}`;

  const SectionActions = ({ sectionKey }: { sectionKey: string }) =>
    onEditSection || onDeleteSection ? (
      <div className="absolute top-0 right-0 flex gap-1.5 opacity-0 group-hover/section:opacity-100 transition-opacity duration-200 z-20">
        {onEditSection && (
          <button onClick={() => onEditSection(sectionKey)} title="Edit section"
            className="bg-blue-500 rounded-full p-1.5 shadow hover:bg-blue-600 transition-colors">
            <Edit3 className="w-3 h-3 text-white" />
          </button>
        )}
        {onDeleteSection && (
          <button onClick={() => onDeleteSection(sectionKey)} title="Remove section"
            className="bg-red-500 rounded-full p-1.5 shadow hover:bg-red-600 transition-colors">
            <Trash2 className="w-3 h-3 text-white" />
          </button>
        )}
      </div>
    ) : null;

  /* ── ATS-safe section divider ── */
  const SectionDivider = ({ label }: { label: string }) => (
    <div style={{ marginBottom: "9px", marginTop: "2px" }}>
      <h2 style={{
        fontSize: "13px",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#111827",
        margin: 0,
        paddingBottom: "5px",
        borderBottom: "2px solid #111827",
        fontFamily: baseFont,
      }}>
        {label}
      </h2>
    </div>
  );

  const renderBullets = (desc: string | string[] | null | undefined) => {
    if (!desc) return null;
    if (typeof desc === "string" && desc.includes("<")) {
      return <SafeHTML content={desc} className="ats-desc" />;
    }
    const items = parseDescription(desc);
    if (!items.length) return null;
    if (items.length === 1) return (
      <p style={{ margin: "3px 0 0", fontSize: "13.5px", color: "#1f2937", lineHeight: 1.65 }}>{items[0]}</p>
    );
    return (
      <ul style={{ margin: "4px 0 0", paddingLeft: "18px", listStyleType: "disc" }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.65, marginBottom: "2px" }}>{item}</li>
        ))}
      </ul>
    );
  };

  /* ── contact items ── */
  const contactParts: React.ReactNode[] = [];
  if (email) contactParts.push(<span key="email">{hl("contact", "email", email)}</span>);
  if (phone) contactParts.push(<span key="phone">{hl("contact", "phone", phone)}</span>);
  if (location) contactParts.push(<span key="loc">{hl("contact", "location", location)}</span>);
  if (linkedin) contactParts.push(
    <a key="li" href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
      target="_blank" rel="noopener noreferrer"
      style={{ color: "#1d4ed8", textDecoration: "none" }}>
      {hl("contact", "linkedin", "LinkedIn")}
    </a>
  );
  if (github) contactParts.push(
    <a key="gh" href={github.startsWith("http") ? github : `https://${github}`}
      target="_blank" rel="noopener noreferrer"
      style={{ color: "#1d4ed8", textDecoration: "none" }}>
      {hl("contact", "github", "GitHub")}
    </a>
  );
  if (portfolio) contactParts.push(
    <a key="pf" href={portfolio.startsWith("http") ? portfolio : `https://${portfolio}`}
      target="_blank" rel="noopener noreferrer"
      style={{ color: "#1d4ed8", textDecoration: "none" }}>
      {hl("contact", "portfolio", "Portfolio")}
    </a>
  );

  return (
    <>
      <style jsx global>{`
        .ats-desc b, .ats-desc strong { font-weight: 700; }
        .ats-desc i, .ats-desc em { font-style: italic; }
        .ats-desc ul { list-style-type: disc; padding-left: 1rem; margin-top: 3px; }
        .ats-desc li { font-size: 13.5px; line-height: 1.65; margin-bottom: 2px; color: #1f2937; }
      `}</style>

      <div style={{ background: "#f0f2f5", fontFamily: baseFont, padding: "12px 24px 32px" }}>
        <div style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "36px 48px 40px",
          background: "#fff",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        }}>

          {/* ══ HEADER ══ */}
          <div
            id="resume-section-contact"
            className={`${sc("contact")} mb-4 text-center`}
            style={{ marginBottom: "16px" }}
          >
            <SectionActions sectionKey="contact" />

            <h1 style={{
              fontSize: "30px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#111827",
              margin: "0 0 5px",
              fontFamily: baseFont,
            }}>
              {hl("contact", "name", name)}
            </h1>

            {title && (
              <p style={{ fontSize: "14.5px", color: "#4b5563", fontWeight: 500, margin: "0 0 9px", letterSpacing: "0.03em" }}>
                {hl("contact", "title", title)}
              </p>
            )}

            {/* Contact row — pipe-separated, single line, ATS safe */}
            {contactParts.length > 0 && (
              <div style={{ fontSize: "13px", color: "#374151", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 4px", lineHeight: 1.6 }}>
                {contactParts.map((part, i) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < contactParts.length - 1 && (
                      <span style={{ color: "#9ca3af", userSelect: "none" }}> • </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            <hr style={{ border: "none", borderTop: "2px solid #111827", margin: "12px 0 0" }} />
          </div>

          <AutoPaginator>

            {/* ══ SUMMARY ══ */}
            {!deleted.includes("summary") && professionalSummary && (
              <div id="resume-section-summary" className={sc("summary")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="summary" />
                <SectionDivider label="Summary" />
                <p style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.65, textAlign: "justify", margin: 0 }}>
                  {hl("summary", "text", professionalSummary)}
                </p>
              </div>
            )}

            {/* ══ WORK EXPERIENCE ══ */}
            {!deleted.includes("experience") && workExperience.length > 0 && (
              <div id="resume-section-experience" className={sc("experience")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="experience" />
                <SectionDivider label="Work Experience" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {workExperience.map((exp: any, idx: number) => {
                  const company = toStr(exp.company || exp.organization || exp.employer || "");
                  const role = toStr(exp.role || exp.title || exp.position || exp.job_title || "");
                  const duration = toStr(exp.duration || exp.period || exp.dates || "");
                  const loc = toStr(exp.location || "");
                  const startDate = toStr(exp.startDate || exp.start_date || exp.from || exp.start || "");
                  const endDate = exp.currentlyWorking ? "Present" : toStr(exp.endDate || exp.end_date || exp.to || exp.end || "");
                  const dateStr = duration || (startDate ? `${formatDate(startDate)}${endDate ? ` – ${formatDate(endDate)}` : ""}` : "");
                  const desc = exp.description || exp.responsibilities || exp.details || null;
                  const isModified = hlIdx("experience", idx);
                  return (
                    <div key={idx} className="page-break-inside-avoid" style={{
                      marginBottom: "10px",
                      paddingLeft: isModified ? "8px" : 0,
                      borderLeft: isModified ? "3px solid rgba(34,197,94,0.5)" : "none",
                    }}>
                      {/* Row 1: Company | Date */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827" }}>{company}</span>
                        {dateStr && <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                      </div>
                      {/* Row 2: Role | Location */}
                      {(role || loc) && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "1px" }}>
                          <span style={{ fontSize: "13.5px", fontStyle: "italic", color: "#374151" }}>{role}</span>
                          {loc && <span style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap", marginLeft: "8px" }}>{loc}</span>}
                        </div>
                      )}
                      {desc && renderBullets(desc)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ EDUCATION ══ */}
            {!deleted.includes("education") && education.length > 0 && (
              <div id="resume-section-education" className={sc("education")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="education" />
                <SectionDivider label="Education" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {education.map((edu: any, idx: number) => {
                  const degree = toStr(edu.degree || edu.qualification || edu.course || "");
                  const college = toStr(edu.college || edu.institution || edu.university || edu.school || "");
                  const branch = toStr(edu.branch || edu.specialization || edu.major || edu.field_of_study || "");
                  const duration = toStr(edu.duration || edu.period || "");
                  const startDate = toStr(edu.startDate || edu.start_date || edu.from || "");
                  const endDate = toStr(edu.endDate || edu.end_date || edu.to || edu.graduation_year || edu.passed_out || edu.year || "");
                  const dateStr = duration || (startDate && endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : formatDate(startDate || endDate));
                  const grade = toStr(edu.grade || edu.gpa || edu.cgpa || edu.percentage || "");
                  const gradeType = toStr(edu.gradeType || edu.grade_type || "Grade");
                  const itemChanged = hlIdx("education", idx);
                  return (
                    <div key={idx} className="page-break-inside-avoid" style={{
                      marginBottom: "8px",
                      paddingLeft: itemChanged ? "8px" : 0,
                      borderLeft: itemChanged ? "3px solid rgba(34,197,94,0.5)" : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827" }}>
                          {degree}{branch ? `, ${branch}` : ""}
                        </span>
                        {dateStr && <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                      </div>
                      <div style={{ fontSize: "13.5px", color: "#374151", marginTop: "1px" }}>{college}</div>
                      {grade && <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "1px" }}>{gradeType}: {grade}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ PROJECTS ══ */}
            {!deleted.includes("projects") && projects.length > 0 && (
              <div id="resume-section-projects" className={sc("projects")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="projects" />
                <SectionDivider label="Projects" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {projects.map((proj: any, idx: number) => {
                  const projTitle = toStr(proj.title || proj.name || proj.project_name || "");
                  const link = toStr(proj.link || proj.url || proj.github_link || "");
                  const startDate = toStr(proj.startDate || proj.start_date || "");
                  const endDate = toStr(proj.endDate || proj.end_date || proj.date || proj.period || "");
                  const dateStr = startDate || endDate ? `${formatDate(startDate)}${startDate && endDate ? " – " : ""}${formatDate(endDate)}` : "";
                  const desc = proj.description || proj.details || null;
                  const rawTech = proj.technologies || proj.techStack || proj.tools;
                  const tech: string[] = Array.isArray(rawTech) ? rawTech.map((t: unknown) => toStr(t)).filter(Boolean) : rawTech ? [toStr(rawTech)].filter(Boolean) : [];
                  const isModified = hlIdx("projects", idx);
                  return (
                    <div key={idx} className="page-break-inside-avoid" style={{
                      marginBottom: "10px",
                      paddingLeft: isModified ? "8px" : 0,
                      borderLeft: isModified ? "3px solid rgba(34,197,94,0.5)" : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827" }}>{projTitle}</span>
                          {link && (
                            <a href={link.startsWith("http") ? link : `https://${link}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: "12.5px", color: "#1d4ed8", textDecoration: "none" }}>
                              [Link]
                            </a>
                          )}
                        </div>
                        {dateStr && <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                      </div>
                      {desc && renderBullets(desc)}
                      {tech.length > 0 && (
                        <p style={{ fontSize: "13px", color: "#4b5563", margin: "3px 0 0" }}>
                          <strong>Technologies:</strong> {tech.join(", ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ TECHNICAL SKILLS ══ */}
            {!deleted.includes("skills") && skills.length > 0 && (
              <div id="resume-section-skills" className={sc("skills")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="skills" />
                <SectionDivider label="Technical Skills" />
                <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", columns: 3, columnGap: "20px" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(skills as any[]).map((skill: string, idx: number) => {
                    const editorAdded = new Set((af.skills || []).map((s: string) => s.toLowerCase()));
                    const isNew = newlyAddedSkillsSet.has(skill.toLowerCase()) || editorAdded.has(skill.toLowerCase());
                    return (
                      <li key={idx} style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.7, breakInside: "avoid" }}>
                        {isNew ? <span style={hlStyle}>{skill}</span> : skill}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ══ SOFT SKILLS ══ */}
            {!deleted.includes("softSkills") && softSkills.length > 0 && (
              <div id="resume-section-softSkills" className={sc("softSkills")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="softSkills" />
                <SectionDivider label="Soft Skills" />
                <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", columns: 3, columnGap: "20px" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(softSkills as any[]).map((skill: string, idx: number) => {
                    const editorAdded = new Set((af.softSkills || []).map((s: string) => s.toLowerCase()));
                    const isNew = newlyAddedSoftSkillsSet.has(skill.toLowerCase()) || editorAdded.has(skill.toLowerCase());
                    return (
                      <li key={idx} style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.7, breakInside: "avoid" }}>
                        {isNew ? <span style={hlStyle}>{skill}</span> : skill}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ══ INTERNSHIPS ══ */}
            {!deleted.includes("internships") && internships.length > 0 && (
              <div id="resume-section-internships" className={sc("internships")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="internships" />
                <SectionDivider label="Internships" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {internships.map((intern: any, idx: number) => {
                  const company = toStr(intern.company || intern.organization || "");
                  const role = toStr(intern.role || intern.title || intern.position || "");
                  const duration = toStr(intern.duration || intern.period || "");
                  const startDate = toStr(intern.startDate || intern.start_date || intern.from || "");
                  const endDate = intern.currentlyWorking ? "Present" : toStr(intern.endDate || intern.end_date || intern.to || "");
                  const dateStr = duration || (startDate ? `${formatDate(startDate)}${endDate ? ` – ${formatDate(endDate)}` : ""}` : "");
                  const desc = intern.description || intern.responsibilities || null;
                  const isModified = hlIdx("internships", idx);
                  return (
                    <div key={idx} className="page-break-inside-avoid" style={{
                      marginBottom: "10px",
                      paddingLeft: isModified ? "8px" : 0,
                      borderLeft: isModified ? "3px solid rgba(34,197,94,0.5)" : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827" }}>{company}</span>
                        {dateStr && <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                      </div>
                      {role && <div style={{ fontSize: "13.5px", fontStyle: "italic", color: "#374151", marginTop: "1px" }}>{role}</div>}
                      {desc && renderBullets(desc)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ CERTIFICATIONS ══ */}
            {!deleted.includes("certifications") && certifications.length > 0 && (
              <div id="resume-section-certifications" className={sc("certifications")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="certifications" />
                <SectionDivider label="Certifications" />
                <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {certifications.map((cert: any, idx: number) => {
                    const certName = typeof cert === "string"
                      ? cert
                      : toStr(cert.name || cert.title || cert.certification || cert.course_name || cert.course || cert.certification_name || cert.certificate_name || cert.cert_name || "");
                    const issuedBy = typeof cert === "object" ? toStr(cert.issuedBy || cert.issued_by || cert.organization || cert.issuer || cert.institution || "") : "";
                    const year = typeof cert === "object" ? toStr(cert.year || cert.date || cert.issue_date || cert.completion_date || "") : "";
                    if (!certName) return null;
                    const isModified = hlIdx("certifications", idx);
                    return (
                      <li key={idx} style={{
                        fontSize: "13.5px", color: "#1f2937", lineHeight: 1.7, marginBottom: "2px",
                        backgroundColor: isModified ? "rgba(34,197,94,0.1)" : undefined,
                      }}>
                        <span style={{ fontWeight: 600 }}>{certName}</span>
                        {issuedBy && <span style={{ color: "#4b5563" }}>{" — "}{issuedBy}</span>}
                        {year && <span style={{ color: "#6b7280" }}>{" ("}{year}{")"}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ══ ACHIEVEMENTS ══ */}
            {!deleted.includes("achievements") && achievements.length > 0 && (
              <div id="resume-section-achievements" className={sc("achievements")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="achievements" />
                <SectionDivider label="Achievements" />
                <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {achievements.map((achievement: any, idx: number) => {
                    const achieveTitle = typeof achievement === "string"
                      ? achievement
                      : toStr(achievement.title || achievement.name || achievement.achievement || "");
                    const desc = typeof achievement === "object" ? toStr(achievement.description || "") : "";
                    const date = typeof achievement === "object" ? toStr(achievement.date || achievement.year || "") : "";
                    if (!achieveTitle) return null;
                    return (
                      <li key={idx} style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.7, marginBottom: "2px" }}>
                        <span style={{ fontWeight: 600 }}>{achieveTitle}</span>
                        {date && <span style={{ color: "#6b7280" }}>{" ("}{formatDate(date)}{")"}</span>}
                        {desc && <span style={{ color: "#374151" }}>{" — "}{desc}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ══ AWARDS ══ */}
            {!deleted.includes("awards") && awards.length > 0 && (
              <div id="resume-section-awards" className={sc("awards")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="awards" />
                <SectionDivider label="Awards" />
                <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {awards.map((award: any, idx: number) => {
                    const awardTitle = toStr(award.title || award.name || "");
                    const issuedBy = toStr(award.issuedBy || award.issued_by || award.organization || "");
                    const year = toStr(award.year || award.date || "");
                    if (!awardTitle) return null;
                    return (
                      <li key={idx} style={{ fontSize: "13.5px", color: "#1f2937", lineHeight: 1.7, marginBottom: "2px" }}>
                        <span style={{ fontWeight: 600 }}>{awardTitle}</span>
                        {issuedBy && <span style={{ color: "#4b5563" }}>{" — "}{issuedBy}</span>}
                        {year && <span style={{ color: "#6b7280" }}>{" ("}{year}{")"}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ══ LANGUAGES ══ */}
            {!deleted.includes("languages") && languages.length > 0 && (
              <div id="resume-section-languages" className={sc("languages")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="languages" />
                <SectionDivider label="Languages" />
                <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", columns: 3, columnGap: "20px" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {languages.map((lang: any, idx: number) => {
                    const langName = typeof lang === "string" ? lang : toStr(lang.language || lang.name || lang);
                    const proficiency = typeof lang === "string" ? "" : toStr(lang.proficiency || lang.level || "");
                    const itemChanged = hlIdx("languages", idx);
                    return (
                      <li key={idx} style={{
                        fontSize: "13.5px", color: "#1f2937", lineHeight: 1.7, breakInside: "avoid",
                        backgroundColor: itemChanged ? "rgba(34,197,94,0.1)" : undefined,
                      }}>
                        <span style={{ fontWeight: 600 }}>{langName}</span>
                        {proficiency && <span style={{ color: "#6b7280" }}>{" — "}{proficiency}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ══ VOLUNTEERING ══ */}
            {!deleted.includes("volunteering") && volunteering.length > 0 && (
              <div id="resume-section-volunteering" className={sc("volunteering")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="volunteering" />
                <SectionDivider label="Volunteering" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {volunteering.map((vol: any, idx: number) => {
                  const role = toStr(vol.role || vol.title || vol.position || "");
                  const org = toStr(vol.organization || vol.org || vol.company || "");
                  const duration = toStr(vol.duration || vol.period || "");
                  const desc = vol.description || null;
                  return (
                    <div key={idx} style={{ marginBottom: "8px" }} className="page-break-inside-avoid">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "14.5px", fontWeight: 700, color: "#111827" }}>{role}</span>
                        {duration && <span style={{ fontSize: "13px", color: "#4b5563", whiteSpace: "nowrap", marginLeft: "8px" }}>{duration}</span>}
                      </div>
                      {org && <div style={{ fontSize: "13.5px", color: "#374151", fontStyle: "italic", marginTop: "1px" }}>{org}</div>}
                      {desc && renderBullets(desc)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ PUBLICATIONS ══ */}
            {!deleted.includes("publications") && publications.length > 0 && (
              <div id="resume-section-publications" className={sc("publications")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="publications" />
                <SectionDivider label="Publications" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {publications.map((pub: any, idx: number) => {
                  const pubTitle = toStr(pub.title || pub.name || "");
                  const url = toStr(pub.url || pub.link || "");
                  const authors = toStr(pub.authors || pub.author || "");
                  const pubName = toStr(pub.publicationName || pub.publication_name || pub.journal || "");
                  const date = toStr(pub.date || pub.year || "");
                  return (
                    <div key={idx} style={{ marginBottom: "8px" }} className="page-break-inside-avoid">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{pubTitle}</span>
                        {url && (
                          <a href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: "12.5px", color: "#1d4ed8", textDecoration: "none" }}>[Link]</a>
                        )}
                      </div>
                      {authors && <div style={{ fontSize: "13px", color: "#4b5563" }}>{authors}</div>}
                      {(pubName || date) && (
                        <div style={{ fontSize: "13px", color: "#6b7280" }}>
                          {pubName && <em>{pubName}</em>}{pubName && date && " · "}{date && formatDate(date)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ══ HOBBIES ══ */}
            {!deleted.includes("hobbies") && hobbies.length > 0 && (
              <div id="resume-section-hobbies" className={sc("hobbies")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="hobbies" />
                <SectionDivider label="Hobbies & Interests" />
                <p style={{ fontSize: "13.5px", color: "#1f2937", margin: 0, lineHeight: 1.7 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {hobbies.map((hobby: any) => {
                    const hobbyName = typeof hobby === "string" ? hobby : toStr(hobby.name || hobby.hobby || "");
                    return hobbyName;
                  }).filter(Boolean).join(" · ")}
                </p>
              </div>
            )}

            {/* ══ INTERESTS ══ */}
            {!deleted.includes("interests") && interests.length > 0 && !hobbies.length && (
              <div id="resume-section-interests" className={sc("interests")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="interests" />
                <SectionDivider label="Interests" />
                <p style={{ fontSize: "13.5px", color: "#1f2937", margin: 0, lineHeight: 1.7 }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {interests.map((interest: any) => {
                    const interestName = typeof interest === "string" ? interest : toStr(interest.name || interest.interest || "");
                    return interestName;
                  }).filter(Boolean).join(" · ")}
                </p>
              </div>
            )}

            {/* ══ REFERENCES ══ */}
            {!deleted.includes("references") && references.length > 0 && (
              <div id="resume-section-references" className={sc("references")} style={{ marginBottom: "14px" }}>
                <SectionActions sectionKey="references" />
                <SectionDivider label="References" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {references.map((ref: any, idx: number) => {
                    const refName = toStr(ref.name || ref.referee || "");
                    const relation = toStr(ref.relation || ref.designation || ref.title || "");
                    const refContact = toStr(ref.contact || ref.email || ref.phone || "");
                    return (
                      <div key={idx}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{refName}</div>
                        {relation && <div style={{ fontSize: "13px", color: "#4b5563" }}>{relation}</div>}
                        {refContact && <div style={{ fontSize: "13px", color: "#6b7280" }}>{refContact}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ PERSONAL DETAILS ══ */}
            {(personalDetails.father_name || personalDetails.mother_name || personalDetails.dob || personalDetails.date_of_birth) && (
              <div style={{ marginBottom: "14px" }}>
                <SectionDivider label="Personal Details" />
                <table style={{ fontSize: "13.5px", color: "#1f2937", borderCollapse: "collapse" }}>
                  <tbody>
                    {personalDetails.father_name && (
                      <tr>
                        <td style={{ paddingRight: "16px", paddingBottom: "3px", color: "#4b5563", whiteSpace: "nowrap" }}>Father&apos;s Name</td>
                        <td style={{ paddingBottom: "3px" }}>: {toStr(personalDetails.father_name)}</td>
                      </tr>
                    )}
                    {personalDetails.mother_name && (
                      <tr>
                        <td style={{ paddingRight: "16px", paddingBottom: "3px", color: "#4b5563", whiteSpace: "nowrap" }}>Mother&apos;s Name</td>
                        <td style={{ paddingBottom: "3px" }}>: {toStr(personalDetails.mother_name)}</td>
                      </tr>
                    )}
                    {(personalDetails.dob || personalDetails.date_of_birth) && (
                      <tr>
                        <td style={{ paddingRight: "16px", paddingBottom: "3px", color: "#4b5563", whiteSpace: "nowrap" }}>Date of Birth</td>
                        <td style={{ paddingBottom: "3px" }}>: {toStr(personalDetails.dob || personalDetails.date_of_birth)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </AutoPaginator>
        </div>
      </div>
    </>
  );
};

export default JobMatchTemplateThree;
