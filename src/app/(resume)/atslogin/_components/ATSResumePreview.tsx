"use client";

import React from "react";

interface ATSResumePreviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
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

const formatDate = (d?: string): string => {
  if (!d) return "";
  if (/^[A-Za-z]{3}\s\d{2,4}$/.test(d)) return d;
  if (/^\d{4}-\d{2}$/.test(d)) {
    const [year, month] = d.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }
  return d;
};

const FONT = "Arial, Helvetica, sans-serif";

/* ── Section heading ── */
const SectionHeading = ({ label }: { label: string }) => (
  <div style={{ marginBottom: "10px", marginTop: "4px" }}>
    <h2 style={{
      fontSize: "14px",
      fontWeight: 700,
      letterSpacing: "0.10em",
      textTransform: "uppercase",
      color: "#111827",
      margin: 0,
      paddingBottom: "5px",
      borderBottom: "1.5px solid #111827",
      fontFamily: FONT,
    }}>
      {label}
    </h2>
  </div>
);

/* ── Bullet list renderer ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderBullets = (desc: any) => {
  if (!desc) return null;
  const items = parseDescription(desc);
  if (!items.length) return null;
  const s = { fontSize: "13px", color: "#1f2937", lineHeight: 1.6, fontFamily: FONT } as const;
  if (items.length === 1) return (
    <p style={{ ...s, margin: "3px 0 0" }}>{items[0]}</p>
  );
  return (
    <ul style={{ margin: "4px 0 0", paddingLeft: "16px", listStyleType: "disc", fontFamily: FONT }}>
      {items.map((item, i) => (
        <li key={i} style={{ ...s, marginBottom: "2px" }}>{item}</li>
      ))}
    </ul>
  );
};

const ATSResumePreview: React.FC<ATSResumePreviewProps> = ({ data: rawData }) => {
  const data = deepSanitize(rawData);

  // ── Data sources (highest → lowest priority) ──
  // resume_data = full MongoDB document fetched after LLM enhancement (most complete)
  // enhanced_resume = enhancer API response (LLM-normalised)
  // parsed_data = raw parse response (may have incomplete sections)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumeDoc: Record<string, any> = data?.resume_data || {};
  const parsedData = data?.parsed_data || {};
  const llmData = parsedData?.llm_data || resumeDoc?.llm_data || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enhanced: Record<string, any> = data?.enhanced_resume || {};

  const font = FONT;

  // ── Contact ──
  const contact = resumeDoc.contact || data?.contact || parsedData.contact ||
    llmData.contact || llmData.personal_info || {};
  const socialLinks = resumeDoc.social_links || parsedData.social_links || llmData.social_links || {};

  const name = toStr(
    resumeDoc.contact?.name || resumeDoc.contact?.full_name ||
    contact.name || contact.full_name || parsedData.name || llmData.name ||
    llmData.personal_info?.name || enhanced.contact?.name ||
    parsedData.personalInfo?.fullName
  ) || "Your Name";

  const title = toStr(
    resumeDoc.contact?.title || resumeDoc.contact?.designation ||
    contact.title || contact.role || contact.designation || contact.job_title ||
    llmData.title || enhanced.contact?.title
  );

  const email    = toStr(resumeDoc.contact?.email || contact.email || parsedData.personalInfo?.email || enhanced.contact?.email);
  const phone    = toStr(resumeDoc.contact?.phone || contact.phone || contact.phone_number || parsedData.personalInfo?.phone || enhanced.contact?.phone);
  const location = toStr(resumeDoc.contact?.location || contact.location || parsedData.personalInfo?.location || enhanced.contact?.location);
  const linkedin = toStr(socialLinks.linkedIn || socialLinks.linkedin || contact.linkedin || enhanced.contact?.linkedinUrl);
  const github   = toStr(socialLinks.github || socialLinks.GitHub || contact.github || enhanced.contact?.githubUrl);

  // ── Summary ──
  const summary = toStr(
    resumeDoc.professionalSummary || resumeDoc.professional_summary || resumeDoc.summary ||
    parsedData.professionalSummary || parsedData.professional_summary ||
    parsedData.career_objective || parsedData.objective || parsedData.summary ||
    llmData.professionalSummary || llmData.professional_summary || llmData.summary ||
    enhanced.professionalSummary || enhanced.summary || ""
  );

  // ── Work Experience ──
  let workExp: unknown[] =
    resumeDoc.workExperience || resumeDoc.work_experience || resumeDoc.experience ||
    parsedData.workExperience || parsedData.work_experience || parsedData.experience ||
    parsedData.professional_experience || llmData.workExperience || llmData.work_experience ||
    llmData.experience || enhanced.workExperience || enhanced.work_experience || enhanced.experience || [];
  if (!Array.isArray(workExp)) workExp = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workExp = workExp.filter((e: any) => e.company || e.role || e.title || e.position || e.organization);

  // ── Education ──
  let education: unknown[] =
    resumeDoc.education || resumeDoc.educational_qualifications ||
    parsedData.education || parsedData.educational_qualifications ||
    llmData.education || enhanced.education || [];
  if (!Array.isArray(education)) education = [];

  // ── Projects ──
  let projects: unknown[] =
    resumeDoc.projects || resumeDoc.project_details ||
    parsedData.projects || parsedData.project_details ||
    llmData.projects || enhanced.projects || [];
  if (!Array.isArray(projects)) projects = [];

  // ── Skills ──
  let skills: string[] =
    resumeDoc.skills || resumeDoc.technical_skills ||
    parsedData.skills || parsedData.technical_skills ||
    llmData.skills || llmData.technical_skills || enhanced.skills || [];
  if (!Array.isArray(skills)) {
    if (typeof skills === "object") skills = Object.values(skills as Record<string, unknown>).flat() as string[];
    else skills = [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skills = (skills as any[]).map((s: any) => {
    if (typeof s === "object" && s !== null) return toStr(s.skill || s.name || s.value || s);
    return toStr(s);
  }).filter(Boolean);

  // ── Soft Skills ──
  let softSkills: string[] =
    resumeDoc.soft_skills || parsedData.soft_skills || llmData.soft_skills || enhanced.soft_skills || [];
  if (!Array.isArray(softSkills)) softSkills = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  softSkills = (softSkills as any[]).map((s: any) => {
    if (typeof s === "object" && s !== null) return toStr(s.skill || s.name || s.value || s);
    return toStr(s);
  }).filter(Boolean);

  // ── Internships ──
  let internships: unknown[] =
    resumeDoc.internships || resumeDoc.internship_details ||
    parsedData.internships || parsedData.internship_details ||
    llmData.internships || enhanced.internships || [];
  if (!Array.isArray(internships)) internships = [];

  // ── Certifications — resumeDoc is highest priority (full MongoDB document) ──
  // getResume() returns { parsed_data: {...} }, so check resumeDoc.parsed_data first
  const resumeDocParsed = resumeDoc.parsed_data || resumeDoc;
  let certifications: unknown[] = (
    resumeDocParsed.certifications || resumeDocParsed.certificates || resumeDocParsed.certification_details ||
    parsedData.certifications || parsedData.certificates || parsedData.certification_details ||
    parsedData.professional_certifications ||
    llmData.certifications || llmData.certificates || llmData.certification_details ||
    llmData.professional_certifications ||
    enhanced.certifications || enhanced.certificates || []
  );
  if (!Array.isArray(certifications)) certifications = [];
  // Remove null-value placeholder items from raw parse
  certifications = certifications.filter((c: unknown) => {
    if (!c) return false;
    if (typeof c === "string") return (c as string).trim() !== "";
    if (typeof c === "object") {
      const o = c as Record<string, unknown>;
      return !!(o.full_name || o.name || o.title || o.certification || o.course_name ||
                o.course || o.certification_name || o.certificate_name || o.cert_name);
    }
    return false;
  });

  // ── Achievements ──
  let achievements: unknown[] =
    resumeDoc.achievements || parsedData.achievements || llmData.achievements || enhanced.achievements || [];
  if (!Array.isArray(achievements)) achievements = [];

  // ── Languages ──
  let languages: unknown[] =
    resumeDoc.languages || resumeDoc.languages_known ||
    parsedData.languages || parsedData.languages_known ||
    llmData.languages || enhanced.languages || [];
  if (typeof languages === "string") languages = (languages as string).split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
  if (!Array.isArray(languages)) languages = [];

  // ── Hobbies ──
  let hobbies: unknown[] =
    resumeDoc.hobbies_and_interests || resumeDoc.hobbies ||
    parsedData.hobbies_and_interests || parsedData.hobbies ||
    llmData.hobbies_and_interests || llmData.hobbies || enhanced.hobbies || [];
  if (!Array.isArray(hobbies)) hobbies = [];

  // ── Contact row ──
  const contactParts: string[] = [];
  if (email)    contactParts.push(email);
  if (phone)    contactParts.push(phone);
  if (location) contactParts.push(location);
  if (linkedin) contactParts.push(linkedin.replace(/^https?:\/\//, ""));
  if (github)   contactParts.push(github.replace(/^https?:\/\//, ""));

  const bodyText  = { fontSize: "13px", color: "#1f2937", lineHeight: 1.65, fontFamily: font } as const;
  const metaText  = { fontSize: "12.5px", color: "#4b5563", fontFamily: font } as const;
  const smallText = { fontSize: "12.5px", color: "#6b7280", fontFamily: font } as const;
  const liStyle   = { ...bodyText, marginBottom: "2px" } as const;

  return (
    <div style={{ background: "#f0f2f5", fontFamily: font, padding: "28px 20px" }}>
      <div style={{
        maxWidth: "760px",
        margin: "0 auto",
        background: "#fff",
        padding: "36px 48px 40px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.10)",
        fontFamily: font,
      }}>

        {/* ══ HEADER ══ */}
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <h1 style={{
            fontSize: "26px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#111827",
            margin: "0 0 4px",
            fontFamily: font,
          }}>
            {name}
          </h1>
          {title && (
            <p style={{ fontSize: "13px", color: "#4b5563", fontWeight: 400, margin: "0 0 6px", fontFamily: font }}>
              {title}
            </p>
          )}
          {contactParts.length > 0 && (
            <p style={{ fontSize: "12px", color: "#374151", margin: 0, lineHeight: 1.6, fontFamily: font }}>
              {contactParts.join(" • ")}
            </p>
          )}
          <hr style={{ border: "none", borderTop: "1.5px solid #111827", margin: "10px 0 0" }} />
        </div>

        {/* ══ SUMMARY ══ */}
        {summary && (
          <div style={{ marginBottom: "14px" }}>
            <SectionHeading label="Summary" />
            <p style={{ ...bodyText, textAlign: "justify", margin: 0 }}>{summary}</p>
          </div>
        )}

        {/* ══ WORK EXPERIENCE ══ */}
        {workExp.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <SectionHeading label="Work Experience" />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {workExp.map((exp: any, idx: number) => {
              const company  = toStr(exp.company || exp.organization || exp.employer || "");
              const role     = toStr(exp.role || exp.title || exp.position || exp.job_title || "");
              const duration = toStr(exp.duration || exp.period || exp.dates || "");
              const loc      = toStr(exp.location || "");
              const start    = toStr(exp.startDate || exp.start_date || exp.from || exp.start || "");
              const end      = exp.currentlyWorking ? "Present" : toStr(exp.endDate || exp.end_date || exp.to || exp.end || "");
              const dateStr  = duration || (start ? `${formatDate(start)}${end ? ` – ${formatDate(end)}` : ""}` : "");
              const desc     = exp.description || exp.responsibilities || exp.details || null;
              return (
                <div key={idx} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 400, color: "#111827", fontFamily: font }}>{company || role}</span>
                    {dateStr && <span style={{ ...metaText, whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                  </div>
                  {company && role && (
                    <div style={{ ...bodyText, color: "#374151", marginTop: "1px" }}>{role}</div>
                  )}
                  {loc && <div style={smallText}>{loc}</div>}
                  {desc && renderBullets(desc)}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ EDUCATION ══ */}
        {education.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <SectionHeading label="Education" />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {education.map((edu: any, idx: number) => {
              const degree   = toStr(edu.degree || edu.qualification || edu.course || "");
              const college  = toStr(edu.college || edu.institution || edu.university || edu.school || "");
              const branch   = toStr(edu.branch || edu.specialization || edu.major || edu.field_of_study || "");
              const duration = toStr(edu.duration || edu.period || "");
              const start    = toStr(edu.startDate || edu.start_date || edu.from || "");
              const end      = toStr(edu.endDate || edu.end_date || edu.to || edu.graduation_year || edu.passed_out || edu.year || "");
              const dateStr  = duration || (start && end ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start || end));
              const grade    = toStr(edu.grade || edu.gpa || edu.cgpa || edu.percentage || "");
              return (
                <div key={idx} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 400, color: "#111827", fontFamily: font }}>
                      {degree}{branch ? `, ${branch}` : ""}
                    </span>
                    {dateStr && <span style={{ ...metaText, whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                  </div>
                  {college && <div style={{ ...bodyText, color: "#374151", marginTop: "1px" }}>{college}</div>}
                  {grade && <div style={{ ...smallText, marginTop: "1px" }}>Grade: {grade}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ PROJECTS ══ */}
        {projects.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <SectionHeading label="Projects" />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {projects.map((proj: any, idx: number) => {
              const projTitle = toStr(proj.title || proj.name || proj.project_name || "");
              const link      = toStr(proj.link || proj.url || proj.github_link || "");
              const start     = toStr(proj.startDate || proj.start_date || "");
              const end       = toStr(proj.endDate || proj.end_date || proj.date || proj.period || "");
              const dateStr   = start || end ? `${formatDate(start)}${start && end ? " – " : ""}${formatDate(end)}` : "";
              const desc      = proj.description || proj.details || null;
              const rawTech   = proj.technologies || proj.techStack || proj.tools;
              const tech: string[] = Array.isArray(rawTech) ? rawTech.map((t: unknown) => toStr(t)).filter(Boolean)
                : rawTech ? [toStr(rawTech)].filter(Boolean) : [];
              if (!projTitle) return null;
              return (
                <div key={idx} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 400, color: "#111827", fontFamily: font }}>{projTitle}</span>
                      {link && (
                        <a href={link.startsWith("http") ? link : `https://${link}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: "12px", color: "#1d4ed8", textDecoration: "none", fontFamily: font }}>
                          [Link]
                        </a>
                      )}
                    </div>
                    {dateStr && <span style={{ ...metaText, whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                  </div>
                  {desc && renderBullets(desc)}
                  {tech.length > 0 && (
                    <p style={{ ...metaText, margin: "3px 0 0" }}>
                      <span style={{ fontWeight: 600 }}>Tech:</span> {tech.join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ TECHNICAL SKILLS ══ */}
        {skills.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <SectionHeading label="Technical Skills" />
            <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", columns: 3, columnGap: "20px", fontFamily: font }}>
              {skills.map((skill: string, idx: number) => (
                <li key={idx} style={{ ...bodyText, lineHeight: 1.7, breakInside: "avoid" }}>{skill}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ══ SOFT SKILLS ══ */}
        {softSkills.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <SectionHeading label="Soft Skills" />
            <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", columns: 3, columnGap: "20px", fontFamily: font }}>
              {softSkills.map((skill: string, idx: number) => (
                <li key={idx} style={{ ...bodyText, lineHeight: 1.7, breakInside: "avoid" }}>{skill}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ══ INTERNSHIPS ══ */}
        {internships.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <SectionHeading label="Internships" />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {internships.map((intern: any, idx: number) => {
              const company  = toStr(intern.company || intern.organization || "");
              const role     = toStr(intern.role || intern.title || intern.position || "");
              const duration = toStr(intern.duration || intern.period || "");
              const start    = toStr(intern.startDate || intern.start_date || intern.from || "");
              const end      = intern.currentlyWorking ? "Present" : toStr(intern.endDate || intern.end_date || intern.to || "");
              const dateStr  = duration || (start ? `${formatDate(start)}${end ? ` – ${formatDate(end)}` : ""}` : "");
              const desc     = intern.description || intern.responsibilities || null;
              return (
                <div key={idx} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 400, color: "#111827", fontFamily: font }}>{company}</span>
                    {dateStr && <span style={{ ...metaText, whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
                  </div>
                  {role && <div style={{ ...bodyText, color: "#374151", marginTop: "1px" }}>{role}</div>}
                  {desc && renderBullets(desc)}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ CERTIFICATIONS ══ */}
        {certifications.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <SectionHeading label="Certifications" />
            <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", fontFamily: font }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {certifications.map((cert: any, idx: number) => {
                const certName = typeof cert === "string"
                  ? cert
                  : toStr(cert.full_name || cert.name || cert.title || cert.certification ||
                          cert.course_name || cert.course || cert.certification_name ||
                          cert.certificate_name || cert.cert_name || "");
                const issuedBy = typeof cert === "object"
                  ? toStr(cert.issuedBy || cert.issued_by || cert.organization || cert.issuer || cert.institution || "")
                  : "";
                const year = typeof cert === "object"
                  ? toStr(cert.year || cert.date || cert.issue_date || cert.completion_date || "")
                  : "";
                if (!certName) return null;
                return (
                  <li key={idx} style={liStyle}>
                    <span style={{ fontFamily: font }}>{certName}</span>
                    {issuedBy && <span style={{ color: "#4b5563", fontFamily: font }}>{" — "}{issuedBy}</span>}
                    {year && <span style={{ ...smallText }}>{" ("}{year}{")"}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ══ ACHIEVEMENTS ══ */}
        {achievements.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <SectionHeading label="Achievements" />
            <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", fontFamily: font }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {achievements.map((item: any, idx: number) => {
                const achText = typeof item === "string" ? item : toStr(item.title || item.name || item.achievement || "");
                const desc    = typeof item === "object" ? toStr(item.description || "") : "";
                const date    = typeof item === "object" ? toStr(item.date || item.year || "") : "";
                if (!achText) return null;
                return (
                  <li key={idx} style={liStyle}>
                    <span style={{ fontFamily: font }}>{achText}</span>
                    {date && <span style={smallText}>{" ("}{formatDate(date)}{")"}</span>}
                    {desc && <span style={{ color: "#374151", fontFamily: font }}>{" — "}{desc}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ══ LANGUAGES ══ */}
        {languages.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <SectionHeading label="Languages" />
            <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", columns: 3, columnGap: "20px", fontFamily: font }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {languages.map((lang: any, idx: number) => {
                const langName    = typeof lang === "string" ? lang : toStr(lang.language || lang.name || lang);
                const proficiency = typeof lang === "string" ? "" : toStr(lang.proficiency || lang.level || "");
                if (!langName) return null;
                return (
                  <li key={idx} style={{ ...bodyText, lineHeight: 1.7, breakInside: "avoid" }}>
                    {langName}
                    {proficiency && <span style={smallText}>{" — "}{proficiency}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ══ HOBBIES ══ */}
        {hobbies.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <SectionHeading label="Hobbies & Interests" />
            <p style={{ ...bodyText, margin: 0 }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {hobbies.map((h: any) => typeof h === "string" ? h : toStr(h.name || h.hobby || ""))
                .filter(Boolean).join(" · ")}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default ATSResumePreview;
