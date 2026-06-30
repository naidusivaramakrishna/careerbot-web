"use client";

import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

interface ATSResumePreviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toStr = (v: any): string => {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    if (typeof v.value === "string") return v.value.trim();
    if (typeof v.text  === "string") return v.text.trim();
    if (typeof v.name  === "string") return v.name.trim();
  }
  return "";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isEmpty = (v: any): boolean => {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
};

// Extract URL from social link object { url, valid, ... } or plain string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractUrl = (link: any): string => {
  if (!link) return "";
  if (typeof link === "string") return link;
  return toStr(link.url || link.href || link.value || "");
};

// Convert any value to bullet-renderable string array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toBullets = (v: any): string[] => {
  if (!v) return [];
  if (typeof v === "string") {
    return v.split(/\n+|•|\*|-(?=\s)/).map(s => s.trim()).filter(Boolean);
  }
  if (Array.isArray(v)) {
    return v
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => {
        if (typeof item === "string") return item.trim();
        if (typeof item === "object" && item !== null) {
          return toStr(item.text || item.value || item.name || item.description || item.achievement || "");
        }
        return "";
      })
      .filter(Boolean);
  }
  return [];
};

// ─── Style constants ───────────────────────────────────────────────────────────

const FONT = "Arial, Helvetica, sans-serif";
const bodyText  = { fontSize: "13px",   color: "#1f2937", lineHeight: 1.65, fontFamily: FONT } as const;
const metaText  = { fontSize: "12.5px", color: "#4b5563", fontFamily: FONT } as const;
const smallText = { fontSize: "12.5px", color: "#6b7280", fontFamily: FONT } as const;

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionHeading = ({ label }: { label: string }) => (
  <div style={{ marginBottom: "10px", marginTop: "4px" }}>
    <h2 style={{
      fontSize: "14px", fontWeight: 700, letterSpacing: "0.10em",
      textTransform: "uppercase", color: "#111827",
      margin: 0, paddingBottom: "5px", borderBottom: "1.5px solid #111827",
      fontFamily: FONT,
    }}>
      {label}
    </h2>
  </div>
);

const BulletList = ({ items }: { items: string[] }) => {
  if (!items.length) return null;
  if (items.length === 1) return (
    <p style={{ ...bodyText, margin: "3px 0 0" }}>{items[0]}</p>
  );
  return (
    <ul style={{ margin: "4px 0 0", paddingLeft: "16px", listStyleType: "disc", fontFamily: FONT }}>
      {items.map((item, i) => (
        <li key={i} style={{ ...bodyText, marginBottom: "2px" }}>{item}</li>
      ))}
    </ul>
  );
};

// ─── Renderer types ───────────────────────────────────────────────────────────

type RendererKey =
  | "text"
  | "experience_list"
  | "education_list"
  | "project_list"
  | "skills_grouped"
  | "simple_list"
  | "bullet_list"
  | "hobbies_list"
  | "cert_list"
  | "kv_list"
  | "generic";

// ─── Auto-detect renderer from data shape ─────────────────────────────────────
// This is the core of the "render everything automatically" approach.
// The renderer is inferred from what the data actually looks like, so new backend
// fields render correctly without any code changes.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const autoDetectRenderer = (value: any): RendererKey => {
  if (value == null) return "generic";

  // Plain string
  if (typeof value === "string") return "text";

  // Non-array object (e.g. personal_details { items: [...] })
  if (!Array.isArray(value)) {
    if (value.items && Array.isArray(value.items)) return "kv_list";
    return "generic";
  }

  // Empty array
  if (value.length === 0) return "generic";

  const first = value[0];

  // Array of plain strings → bullet list
  if (typeof first === "string") return "bullet_list";

  if (typeof first !== "object" || first === null) return "generic";

  // Language objects: { language: "English" }
  if ("language" in first) return "simple_list";

  // Skills: has skill field + optional category
  if ("skill" in first || ("name" in first && "category" in first)) return "skills_grouped";

  // Education: degree or college/institution fields
  if ("degree" in first || "college" in first || "institution" in first || "university" in first || "qualification" in first) {
    return "education_list";
  }

  // Projects: title + (tech_stack OR achievements OR repo_url) — check before experience
  if (("title" in first || "project_name" in first) &&
      ("tech_stack" in first || "repo_url" in first || "github_url" in first || "github_link" in first)) {
    return "project_list";
  }

  // Experience: company or employer/organization + role
  if ("company" in first || "employer" in first || ("organization" in first && "role" in first)) {
    return "experience_list";
  }

  // Certifications: full_name or name + domain/year/issuing_organization
  if ("full_name" in first || ("name" in first && ("issuing_organization" in first || "domain" in first || "year" in first || "confidence" in first))) {
    return "cert_list";
  }

  // Objects with just a text field → bullet list
  if ("text" in first) return "bullet_list";

  // Key-value pairs: { label, value } or { key, value }
  if (("label" in first || "key" in first) && ("value" in first || "val" in first)) return "kv_list";

  // Default: treat as bullet list (extract text from each object)
  return "bullet_list";
};

// ─── Section registry ──────────────────────────────────────────────────────────
// Only stores label and display priority. Renderer is auto-detected from data.
// Override renderer with `forcedRenderer` only when auto-detection would pick wrong type.

interface SectionDef {
  label: string;
  priority: number;
  forcedRenderer?: RendererKey; // override auto-detection for specific sections
}

// ATS-friendly fixed order. Unknown fields (declaration etc.) auto-append at the end.
const SECTION_REGISTRY: Record<string, SectionDef> = {
  summary:                    { label: "Professional Summary",     priority: 1  },
  professional_summary:       { label: "Professional Summary",     priority: 1  },
  career_objective:           { label: "Career Objective",         priority: 2  },
  objective:                  { label: "Objective",                priority: 2  },
  technical_skills:           { label: "Skills",                   priority: 3  },
  skills:                     { label: "Skills",                   priority: 3  },
  core_competencies:          { label: "Core Competencies",        priority: 3  },
  experience:                 { label: "Work Experience",          priority: 4  },
  work_experience:            { label: "Work Experience",          priority: 4  },
  projects:                   { label: "Projects",                 priority: 5  },
  education:                  { label: "Education",                priority: 6  },
  educational_qualifications: { label: "Education",                priority: 6  },
  certifications:             { label: "Certifications",           priority: 7  },
  certificates:               { label: "Certifications",           priority: 7  },
  internships:                { label: "Internships",              priority: 8  },
  achievements:               { label: "Achievements",             priority: 9  },
  awards:                     { label: "Awards",                   priority: 10 },
  strengths:                  { label: "Strengths",                priority: 11 },
  volunteering:               { label: "Volunteer Experience",     priority: 12 },
  volunteer:                  { label: "Volunteer Experience",     priority: 12 },
  publications:               { label: "Publications",             priority: 13 },
  workshops:                  { label: "Workshops & Training",     priority: 14 },
  languages:                  { label: "Languages",                priority: 15 },
  hobbies_and_interests:      { label: "Hobbies & Interests",      priority: 16, forcedRenderer: "hobbies_list" },
  soft_skills:                { label: "Soft Skills",              priority: 17 },
  references:                 { label: "References",               priority: 18 },
  personal_details:           { label: "Personal Details",         priority: 19 },
};

// Fields in parsed_data we never render as sections
const SKIP_KEYS = new Set([
  "contact", "social_links", "image_warning", "image_message",
  "parse_warnings", "warnings", "field_confidence", "field_sources",
  "section_metadata", "additional_sections", "parser_diagnostics_summary",
  "format_analysis", "summary_analysis", "overall_experience",
  "parser_schema_version", "metadata", "parse_metadata",
  "quality", "routing_flags", "user_id", "detected_stacks",
  "verb_inferred_skills", "career_progression",
  "achievements_metrics", "parser_mode",
  "kpi_metrics", "reliability_metrics",
  // headline shown in header, not as section
  "headline",
  // internal parser metadata
  "domain_experience",
  // parser internal / diagnostic fields — never show in resume preview
  "fallbacks_used",
  "degraded_sections",
  "provenance",
  "soft_skills_covered_by_technical",
]);

// ─── Typed renderers ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderText = (value: any): React.ReactNode => {
  const s = toStr(value);
  if (!s) return null;
  return <p style={{ ...bodyText, textAlign: "justify", margin: 0 }}>{s}</p>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderExperienceList = (items: any[]): React.ReactNode => (
  <>
    {items.map((item: AnyObj, idx: number) => {
      const company  = toStr(item.company || item.organization || item.employer || "");
      const role     = toStr(item.role || item.title || item.position || item.job_title || "");
      const location = toStr(item.location || "");
      const start    = toStr(item.startDate || item.start_date || item.from || item.start || "");
      const end      = item.currentlyWorking ? "Present" : toStr(item.endDate || item.end_date || item.to || item.end || "");
      const duration = toStr(item.duration || item.period || item.dates || "");
      const dateStr  = duration || (start ? `${formatDate(start)}${end ? ` – ${formatDate(end)}` : ""}` : "");
      // Merge achievements + responsibilities (both can appear)
      const mergedBullets = [
        ...(Array.isArray(item.achievements)     ? item.achievements     : []),
        ...(Array.isArray(item.responsibilities) ? item.responsibilities : []),
      ];
      const bullets = mergedBullets.length > 0
        ? toBullets(mergedBullets)
        : toBullets(item.description || item.details || []);
      return (
        <div key={idx} style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", fontFamily: FONT }}>
              {company || role}
            </span>
            {dateStr && <span style={{ ...metaText, whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
          </div>
          {company && role && <div style={{ ...bodyText, color: "#374151", marginTop: "1px" }}>{role}</div>}
          {location && <div style={smallText}>{location}</div>}
          <BulletList items={bullets} />
        </div>
      );
    })}
  </>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderEducationList = (items: any[]): React.ReactNode => (
  <>
    {items.map((item: AnyObj, idx: number) => {
      const degree   = toStr(item.degree || item.qualification || item.course || "");
      const branch   = toStr(item.branch || item.specialization || item.major || item.field_of_study || "");
      const college  = toStr(item.college || item.institution || item.university || item.school || "");
      const start    = toStr(item.startDate || item.start_date || item.from || "");
      const end      = toStr(item.endDate || item.end_date || item.to || item.graduation_year || item.passed_out || item.year || "");
      const duration = toStr(item.duration || item.period || "");
      const dateStr  = duration || (start && end ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start || end));

      const gradeType = toStr(item.grade_type || item.gradeType || "");
      const gradeVal  = toStr(item.grade || item.gpa || item.cgpa || item.percentage || "");
      const gradePct  = item.grade_percentage != null ? String(item.grade_percentage) : "";
      let gradeDisplay = "";
      if (gradeType && (gradeType.toUpperCase() === "CGPA" || gradeType.toUpperCase() === "GPA")) {
        gradeDisplay = gradeVal && gradePct ? `${gradeType.toUpperCase()} ${gradeVal} - ${gradePct}%` : gradeVal ? `${gradeType.toUpperCase()} ${gradeVal}` : "";
      } else if (gradeType === "Percentage") {
        gradeDisplay = gradeVal ? `${gradeVal}%` : "";
      } else if (gradeVal) {
        gradeDisplay = `Grade: ${gradeVal}`;
      }

      return (
        <div key={idx} style={{ marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", fontFamily: FONT }}>
              {degree}{branch ? ` in ${branch}` : ""}
            </span>
            {dateStr && <span style={{ ...metaText, whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
          </div>
          {college && <div style={{ ...bodyText, fontStyle: "italic", color: "#374151", marginTop: "1px" }}>{college}</div>}
          {gradeDisplay && <div style={{ ...smallText, marginTop: "1px" }}>{gradeDisplay}</div>}
        </div>
      );
    })}
  </>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderProjectList = (items: any[]): React.ReactNode => (
  <>
    {items.map((item: AnyObj, idx: number) => {
      const title   = toStr(item.title || item.name || item.project_name || "");
      const repoUrl  = toStr(item.repo_url || item.link || item.url || item.github_link || item.github_url || "");
      const duration = toStr(item.duration || item.period || "");
      const start    = toStr(item.startDate || item.start_date || "");
      const end      = toStr(item.endDate || item.end_date || item.date || "");
      const dateStr  = duration || (start || end ? `${formatDate(start)}${start && end ? " – " : ""}${formatDate(end)}` : "");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawTech: any[] = Array.isArray(item.tech_stack || item.technologies || item.techStack || item.tools)
        ? (item.tech_stack || item.technologies || item.techStack || item.tools)
        : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tech = rawTech.map((t: any) => toStr(t)).filter(Boolean);

      const bulletSource = item.achievements?.length ? item.achievements
        : item.responsibilities?.length ? item.responsibilities
        : (item.description || item.details || []);
      const bullets = toBullets(bulletSource);

      if (!title) return null;
      return (
        <div key={idx} style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#111827", fontFamily: FONT }}>{title}</span>
            {dateStr && <span style={{ ...metaText, whiteSpace: "nowrap", marginLeft: "8px" }}>{dateStr}</span>}
          </div>
          {tech.length > 0 && (
            <p style={{ ...metaText, margin: "2px 0 3px", fontStyle: "italic" }}>
              <span style={{ fontWeight: 600 }}>Tech Stack:</span> {tech.join(", ")}
            </p>
          )}
          <BulletList items={bullets} />
          {repoUrl && (
            <a href={repoUrl.startsWith("http") ? repoUrl : `https://${repoUrl}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "12.5px", color: "#1d4ed8", textDecoration: "none", fontFamily: FONT, display: "inline-block", marginTop: "4px" }}>
              GitHub
            </a>
          )}
        </div>
      );
    })}
  </>
);

// Technical skills — group by category (backend logic: category.replace('_',' ').title())
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderSkillsGrouped = (items: any[]): React.ReactNode => {
  const groupOrder: string[] = [];
  const grouped: Record<string, string[]> = {};
  const flat: string[] = [];

  items.forEach((s: AnyObj | string) => {
    const name = typeof s === "string" ? s : toStr(s.skill || s.name || s.value || "");
    if (!name) return;
    if (typeof s === "object" && s !== null) {
      const rawCat = toStr(s.category || "");
      const heading = rawCat
        ? rawCat.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
        : toStr(s.source_heading || "");
      if (heading) {
        if (!grouped[heading]) { grouped[heading] = []; groupOrder.push(heading); }
        grouped[heading].push(name);
        return;
      }
    }
    flat.push(name);
  });

  const hasGroups = groupOrder.length > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {hasGroups && groupOrder.map((heading, i) => (
        <p key={i} style={{ ...bodyText, margin: 0 }}>
          <span style={{ fontWeight: 600 }}>{heading}:</span>{" "}{grouped[heading].join(", ")}
        </p>
      ))}
      {flat.length > 0 && (
        <ul style={{ margin: hasGroups ? "4px 0 0" : 0, paddingLeft: "16px", listStyleType: "disc", columns: 3, columnGap: "20px", fontFamily: FONT }}>
          {flat.map((skill, i) => (
            <li key={i} style={{ ...bodyText, lineHeight: 1.7, breakInside: "avoid" }}>{skill}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Certifications
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCertList = (items: any[]): React.ReactNode => (
  <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", fontFamily: FONT }}>
    {items.map((cert: AnyObj | string, idx: number) => {
      const name = typeof cert === "string" ? cert
        : toStr(cert.full_name || cert.name || cert.title || cert.certification ||
                 cert.course_name || cert.course || cert.certification_name || cert.cert_name || "");
      const issuer = typeof cert === "object"
        ? toStr(cert.issuing_organization || cert.issuedBy || cert.issued_by || cert.organization || cert.issuer || cert.institution || "")
        : "";
      const year = typeof cert === "object"
        ? toStr(cert.year || cert.date || cert.issue_date || cert.completion_date || "")
        : "";
      if (!name) return null;
      return (
        <li key={idx} style={{ ...bodyText, marginBottom: "2px" }}>
          <span style={{ fontWeight: 600 }}>{name}</span>
          {issuer && <span style={metaText}>{" | "}{issuer}</span>}
          {year && <span style={smallText}>{" ("}{year}{")"}</span>}
        </li>
      );
    })}
  </ul>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toLines = (items: any[]): string[] =>
  items.map((item: any) => {
    if (typeof item === "string") return item;
    return toStr(item.text || item.value || item.name || item.title || item.achievement || item.description || "");
  }).filter(Boolean);

// Languages
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderLanguages = (items: any[]): React.ReactNode => (
  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    {items.map((lang: any, i: number) => {
      const langName    = typeof lang === "string" ? lang : toStr(lang.language || lang.name || "");
      const proficiency = typeof lang === "object" ? toStr(lang.proficiency || lang.level || "") : "";
      if (!langName) return null;
      return (
        <span key={i} style={{ ...bodyText }}>
          {langName}
          {proficiency && <span style={smallText}>{" — "}{proficiency}</span>}
        </span>
      );
    })}
  </div>
);

// Simple list (soft skills, references, workshops, etc.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderSimpleList = (items: any[]): React.ReactNode => {
  if (typeof items === "string") return <p style={{ ...bodyText, margin: 0 }}>{items}</p>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isLang = Array.isArray(items) && items.some((i: any) => typeof i === "object" && i?.language);
  if (isLang) return renderLanguages(items);
  const lines = toLines(Array.isArray(items) ? items : [items]);
  if (!lines.length) return null;
  return (
    <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", fontFamily: FONT }}>
      {lines.map((line, i) => (
        <li key={i} style={{ ...bodyText, marginBottom: "2px" }}>{line}</li>
      ))}
    </ul>
  );
};

// Bullet list — for achievements, awards, publications
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderBulletList = (items: any[]): React.ReactNode => {
  const lines = toLines(Array.isArray(items) ? items : [items]);
  if (!lines.length) return null;
  return (
    <ul style={{ margin: 0, paddingLeft: "16px", listStyleType: "disc", fontFamily: FONT }}>
      {lines.map((line, i) => (
        <li key={i} style={{ ...bodyText, marginBottom: "2px" }}>{line}</li>
      ))}
    </ul>
  );
};

// Hobbies — one per line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderHobbiesList = (items: any[]): React.ReactNode => {
  const lines = toLines(Array.isArray(items) ? items : [items]);
  if (!lines.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {lines.map((line, i) => (
        <span key={i} style={{ ...bodyText }}>{line}</span>
      ))}
    </div>
  );
};

// Key-value list for personal_details
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderKvList = (value: any): React.ReactNode => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : [];
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {items.map((item: any, i: number) => {
        const k = toStr(item.label || item.key || item.field || "");
        const v = toStr(item.value || item.val || "");
        if (!k && !v) return null;
        return (
          <span key={i} style={{ ...bodyText }}>
            {k && <span style={{ fontWeight: 600 }}>{k}: </span>}
            {v}
          </span>
        );
      })}
    </div>
  );
};

// Generic fallback
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderGeneric = (value: any): React.ReactNode => {
  if (typeof value === "string") return renderText(value);
  if (Array.isArray(value)) {
    const bullets = toBullets(value);
    return <BulletList items={bullets} />;
  }
  if (typeof value === "object" && value !== null) {
    const text = toStr(value.text || value.value || value.description || "");
    if (text) return renderText(text);
    const pairs = Object.entries(value)
      .filter(([, v]) => v != null && !Array.isArray(v) && typeof v !== "object")
      .map(([k, v]) => `${k}: ${v}`);
    if (pairs.length) return <BulletList items={pairs} />;
  }
  return null;
};

// ─── Dispatch render by renderer key ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderSection = (renderer: RendererKey, value: any): React.ReactNode => {
  switch (renderer) {
    case "text":            return renderText(value);
    case "experience_list": return renderExperienceList(Array.isArray(value) ? value : []);
    case "education_list":  return renderEducationList(Array.isArray(value) ? value : []);
    case "project_list":    return renderProjectList(Array.isArray(value) ? value : []);
    case "skills_grouped":  return renderSkillsGrouped(Array.isArray(value) ? value : []);
    case "cert_list":       return renderCertList(Array.isArray(value) ? value : []);
    case "simple_list":     return renderSimpleList(Array.isArray(value) ? value : [value]);
    case "bullet_list":     return renderBulletList(Array.isArray(value) ? value : [value]);
    case "hobbies_list":    return renderHobbiesList(Array.isArray(value) ? value : [value]);
    case "kv_list":         return renderKvList(value);
    case "generic":         return renderGeneric(value);
    default:                return renderGeneric(value);
  }
};

// ─── Build the ordered list of sections to render ────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildSectionOrder = (parsedData: AnyObj): Array<{ key: string; label: string; renderer: RendererKey }> => {
  const result: Array<{ key: string; label: string; renderer: RendererKey }> = [];
  const seen = new Set<string>();

  const getRenderer = (key: string): RendererKey => {
    const def = SECTION_REGISTRY[key];
    // Use forcedRenderer if explicitly set in registry
    if (def?.forcedRenderer) return def.forcedRenderer;
    // Otherwise auto-detect from actual data shape
    return autoDetectRenderer(parsedData[key]);
  };

  const addKey = (key: string, overrideLabel?: string) => {
    if (seen.has(key) || SKIP_KEYS.has(key)) return;
    const value = parsedData[key];
    if (isEmpty(value)) return;
    seen.add(key);
    const def = SECTION_REGISTRY[key];
    result.push({
      key,
      label: overrideLabel || def?.label || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      renderer: getRenderer(key),
    });
  };

  // 1. Known sections in fixed ATS-friendly priority order (never follows original PDF order)
  const knownByPriority = Object.entries(SECTION_REGISTRY)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([key]) => key);
  knownByPriority.forEach(key => addKey(key));

  // 2. Auto-discover any remaining unknown fields (declaration, extra sections, etc.) — appended last
  Object.keys(parsedData).forEach(key => {
    if (!seen.has(key) && !SKIP_KEYS.has(key) && !isEmpty(parsedData[key])) {
      seen.add(key);
      result.push({
        key,
        label: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        renderer: autoDetectRenderer(parsedData[key]),
      });
    }
  });

  return result;
};

// ─── Main component ────────────────────────────────────────────────────────────

const ATSResumePreview: React.FC<ATSResumePreviewProps> = ({ data: rawData }) => {
  const parsedData: AnyObj = rawData?.parsed_data ?? rawData ?? {};

  const contact: AnyObj = parsedData.contact ?? {};
  const socialLinks: AnyObj = parsedData.social_links ?? {};

  const name     = toStr(contact.name || contact.full_name || parsedData.name || "") || "Your Name";
  const title    = toStr(contact.title || contact.designation || contact.job_title || parsedData.headline || "");
  const email    = toStr(contact.email || "");
  const phone    = toStr(contact.phone || contact.phone_number || "");
  const location = toStr(contact.location || "");

  const linkedin   = extractUrl(socialLinks.linkedin   || socialLinks.linkedIn);
  const github     = extractUrl(socialLinks.github     || socialLinks.GitHub);
  const portfolio  = extractUrl(socialLinks.portfolio  || socialLinks.Portfolio);
  const hackerrank = extractUrl(socialLinks.hackerrank);

  const sections = buildSectionOrder(parsedData);

  return (
    <div style={{ background: "#f0f2f5", fontFamily: FONT, padding: "28px 20px" }}>
      <div style={{
        maxWidth: "760px", margin: "0 auto", background: "#fff",
        padding: "36px 48px 40px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 10px 40px rgba(0,0,0,0.10)",
        fontFamily: FONT,
      }}>

        {/* ══ HEADER ══ */}
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <h1 style={{
            fontSize: "26px", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "#111827", margin: "0 0 4px", fontFamily: FONT,
          }}>
            {name}
          </h1>
          {title && (
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#111827", margin: "4px 0 6px", fontFamily: FONT }}>
              {title}
            </p>
          )}
          <p style={{ fontSize: "12px", color: "#374151", margin: 0, lineHeight: 1.8, fontFamily: FONT }}>
            {[email, phone, location].filter(Boolean).map((part, i) => (
              <span key={i}>
                {i > 0 && <span style={{ margin: "0 5px", color: "#9ca3af" }}>|</span>}
                {part.includes("@")
                  ? <a href={`mailto:${part}`} style={{ color: "#1d4ed8", textDecoration: "none" }}>{part}</a>
                  : part}
              </span>
            ))}
            {linkedin && (
              <span>
                {(email || phone || location) && <span style={{ margin: "0 5px", color: "#9ca3af" }}>|</span>}
                <a href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: "#1d4ed8", textDecoration: "none" }}>LinkedIn</a>
              </span>
            )}
            {github && (
              <span>
                <span style={{ margin: "0 5px", color: "#9ca3af" }}>|</span>
                <a href={github.startsWith("http") ? github : `https://${github}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: "#1d4ed8", textDecoration: "none" }}>GitHub</a>
              </span>
            )}
            {portfolio && (
              <span>
                <span style={{ margin: "0 5px", color: "#9ca3af" }}>|</span>
                <a href={portfolio.startsWith("http") ? portfolio : `https://${portfolio}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: "#1d4ed8", textDecoration: "none" }}>Portfolio</a>
              </span>
            )}
            {hackerrank && (
              <span>
                <span style={{ margin: "0 5px", color: "#9ca3af" }}>|</span>
                <a href={hackerrank.startsWith("http") ? hackerrank : `https://${hackerrank}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: "#1d4ed8", textDecoration: "none" }}>HackerRank</a>
              </span>
            )}
          </p>
          <hr style={{ border: "none", borderTop: "1.5px solid #111827", margin: "10px 0 0" }} />
        </div>

        {/* ══ DYNAMIC SECTIONS ══ */}
        {sections.map(({ key, label, renderer }) => {
          const value = parsedData[key];
          const content = renderSection(renderer, value);
          if (!content) return null;
          return (
            <div key={key} style={{ marginBottom: "14px" }}>
              <SectionHeading label={label} />
              {content}
            </div>
          );
        })}

      </div>
    </div>
  );
};

export default ATSResumePreview;
