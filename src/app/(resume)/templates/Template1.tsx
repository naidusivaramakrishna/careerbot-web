"use client";
import React from "react";
import { ResumeData, ResumeStyle } from "../builder/creation/_context/ResumeContext";
import { DEFAULT_DECLARATION } from "../builder/creation/_components/editor/sections/Declaration";
import SafeHTML from "@/components/common/SafeHTML";

interface Props {
  data: ResumeData;
  style: ResumeStyle;
  careerLevel?: "Fresher" | "Early Career" | "Mid-Level" | "Senior-Level" | "Lead" | "Architect" | "Manager" | "Director" | "Vice President";
  domainFamily?: string;
  sectionOrder?: string[];
  onPageCountChange?: (count: number) => void;
  layoutVariant?: "centered" | "left-right" | "left-stacked" | "classic-formal" | "classic" | "executive" | "slate" | "aether" | "pillar" | "ember";
}

const CORPORATE_DOMAINS = ['software_engineering', 'cybersecurity', 'finance', 'sales_business_development', 'core_engineering', 'electronics_and_vlsi', 'customer_support_service', 'product_engineering_leadership', 'marketing_creative', 'operations_management', 'human_resources', 'logistics_warehouse_operations'];

const Template1: React.FC<Props> = ({ data, style, careerLevel = "Mid-Level", domainFamily = "core_engineering", sectionOrder = [], layoutVariant = "centered" }) => {
  const {
    personalInfo,
    professionalSummary,
    education,
    workExperience,
    projects,
    skills,
    certifications,
    internships,
    languages,
    achievements,
    volunteering,
    references,
    awards,
    hobbies,
    interests,
    publications,
    patents,
    customSections,
    declaration,
  } = data;

  const getSectionTitle = (section: string): string => {
    if (section === "Professional Summary") {
      if (careerLevel === "Fresher") return "OBJECTIVE";
      if (careerLevel === "Architect" || careerLevel === "Manager" || careerLevel === "Director" || careerLevel === "Vice President") return "EXECUTIVE SUMMARY";
      return "PROFESSIONAL SUMMARY";
    }
    if (section === "Skills") {
      const isCorporateDomain = CORPORATE_DOMAINS.includes(domainFamily || '');
      const isSeniorLevel = careerLevel === "Senior-Level" || careerLevel === "Lead" || careerLevel === "Architect" || careerLevel === "Manager" || careerLevel === "Director" || careerLevel === "Vice President";
      return isCorporateDomain && isSeniorLevel ? "CORE COMPETENCIES" : "SKILLS";
    }
    if (section === "Projects") {
      return domainFamily === "core_engineering" ? "KEY PROJECTS" : "PROJECTS";
    }
    if (section === "Work Experience") {
      if (domainFamily === "marine_merchant_navy") return "SEA SERVICE RECORD";
      if (domainFamily === "education") return "TEACHING EXPERIENCE";
      return "PROFESSIONAL EXPERIENCE";
    }
    if (section === "Publications") {
      if (domainFamily === "education") return "PUBLICATIONS AND RESEARCH";
      if (domainFamily === "cybersecurity") return "PUBLICATIONS AND CONFERENCES";
      return "PUBLICATIONS";
    }
    if (section === "Certifications") {
      if (domainFamily === "healthcare") return "LICENSES AND CREDENTIALS";
      if (domainFamily === "marine_merchant_navy") return "CERTIFICATES AND LICENSES";
      if (domainFamily === "cybersecurity") return "CERTIFICATES AND CLEARANCES";
      if (domainFamily === "government_standard") return "CERTIFICATIONS AND TRAINING";
      return "CERTIFICATIONS";
    }
    if (section === "Achievements") {
      return domainFamily === "sales_business_development" ? "KEY ACHIEVEMENTS" : "ACHIEVEMENTS";
    }
    return section;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    if (/^[A-Za-z]{3}\s\d{2}$/.test(dateString)) {
      const [mon, yr] = dateString.split(' ');
      return `${mon} ${parseInt(yr) < 50 ? '20' : '19'}${yr}`;
    }
    if (/^\d{4}-\d{2}$/.test(dateString)) {
      const [year, month] = dateString.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]} ${year}`;
    }
    return dateString;
  };

  const baseTextStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: style.bodyFontSize,
    lineHeight: style.lineSpacing,
    color: style.bodyColor,
  };

  // accent = palette color restricted to name + section headers only (when accentColor is set).
  // headingColor is used for job titles, education degrees, and other heading elements.
  const accent = style.accentColor ?? style.headingColor;

  const titleStyle: React.CSSProperties = {
    ...baseTextStyle,
    color: style.headingColor,
    fontWeight: "bold",
  };

  const sectionHeadingStyle: React.CSSProperties = {
    color: accent,
    fontSize: style.headingFontSize,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.4rem",
  };

  const nameStyle: React.CSSProperties = {
    fontSize: style.nameFontSize,
    fontWeight: "bold",
    color: accent,
    textAlign: "center",
    marginBottom: "4px",
  };

  const renderHTMLToReact = (html: string) => {
    if (!html) return null;

    // Handle escaped newlines (\n as two characters) by converting to actual newlines
    const processedHtml = html.replace(/\\n/g, '\n');

    // Check if this is plain text with newlines (no HTML tags)
    if (!processedHtml.includes('<')) {
      // Split by newlines and render as bullets
      const lines = processedHtml.split('\n').filter(line => line.trim());
      return lines.map((line, idx) => (
        <div key={idx} style={{ ...baseTextStyle, color: style.bodyColor, margin: "4px 0", fontSize: "12px" }}>
          • {line.trim()}
        </div>
      ));
    }

    // Otherwise, parse as HTML
    const doc = new DOMParser().parseFromString(processedHtml, 'text/html');

    const processNode = (node: Node, key: number): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        return text ? <span key={key}>{text}</span> : null;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as HTMLElement;
        const children = Array.from(elem.childNodes).map((child, idx) => processNode(child, idx)).filter(Boolean);

        if (elem.tagName === 'B' || elem.tagName === 'STRONG') {
          return <strong key={key}>{children}</strong>;
        }
        if (elem.tagName === 'I' || elem.tagName === 'EM') {
          return <em key={key}>{children}</em>;
        }
        if (elem.tagName === 'U') {
          return <u key={key}>{children}</u>;
        }
        if (elem.tagName === 'LI') {
          return (
            <div key={key} style={{ ...baseTextStyle, color: style.bodyColor, margin: "4px 0", fontSize: "12px" }}>
              • {children}
            </div>
          );
        }
        if (elem.tagName === 'UL' || elem.tagName === 'OL') {
          return <div key={key}>{children}</div>;
        }
        if (['DIV', 'P'].includes(elem.tagName)) {
          const text = elem.textContent?.trim();
          return text ? (
            <div key={key} style={{ ...baseTextStyle, color: style.bodyColor, margin: "4px 0", fontSize: "12px" }}>
              • {children}
            </div>
          ) : null;
        }
        return children;
      }

      return null;
    };

    return Array.from(doc.body.childNodes).map((node, idx) => processNode(node, idx)).filter(Boolean);
  };

  const renderSection = (sectionName: string) => {
    switch (sectionName) {
      case "Professional Summary":
        return professionalSummary?.summary ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading(getSectionTitle("Professional Summary"))}
            <div style={sectionBorderStyle("8px")} />
            <div style={{ textAlign: "justify", fontSize: '12px' }}>
              <SafeHTML
                content={professionalSummary.summary}
                className="resume-description"
                style={{ ...baseTextStyle, textAlign: "justify", fontSize: "12px" }}
              />
            </div>
          </div>
        ) : null;

      case "Skills":
        return (data.categorizedSkills && Object.keys(data.categorizedSkills).some(key => {
          const skillArray = data.categorizedSkills![key as keyof typeof data.categorizedSkills];
          return Array.isArray(skillArray) && skillArray.length > 0;
        })) || (skills && skills.length > 0) ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading(getSectionTitle("Skills"))}
            <div style={sectionBorderStyle("12px")} />
            <div style={{ ...baseTextStyle }}>
              {(careerLevel === 'Senior-Level' || careerLevel === 'Lead' || careerLevel === 'Architect' || careerLevel === 'Manager' || careerLevel === 'Director' || careerLevel === 'Vice President') && ['software_engineering', 'cybersecurity', 'logistics_warehouse_operations', 'sales_business_development', 'customer_support_service', 'product_engineering_leadership', 'marketing_creative', 'operations_management', 'human_resources'].includes(domainFamily || '') && data.categorizedSkills ? (() => {
                const allSkills: string[] = [];
                Object.entries(data.categorizedSkills!)
                  .filter(([cat]) => !['custom_categories', 'hidden_predefined_categories', 'skill_id_map'].includes(cat))
                  .forEach(([, arr]) => { if (Array.isArray(arr)) allSkills.push(...(arr as string[]).filter(s => typeof s === 'string')); });
                (data.categorizedSkills!.custom_categories || []).forEach(cat => { if (cat.skills) allSkills.push(...cat.skills); });
                return allSkills.length > 0 ? <div style={{ ...baseTextStyle, fontSize: '11px', lineHeight: '1.7' }}>{allSkills.join(' | ')}</div> : null;
              })() : data.categorizedSkills && Object.keys(data.categorizedSkills).length > 0 ? (
                <>
                  {Object.entries(data.categorizedSkills)
                    .filter(([category]) => category !== 'custom_categories')
                    .map(([category, categorySkills]) => {
                      const skillArr = Array.isArray(categorySkills)
                        ? (categorySkills as string[]).filter(s => typeof s === "string")
                        : [];
                      if (skillArr.length === 0) return null;
                      const categoryLabel = category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                      return (
                        <div key={category} style={{ marginBottom: "6px" }}>
                          <span style={{ ...titleStyle, fontSize: "10px" }}>{categoryLabel}:</span>
                          <span style={{ marginLeft: "4px", fontSize: "10px" }}>{skillArr.join(", ")}</span>
                        </div>
                      );
                    })}
                  {data.categorizedSkills.custom_categories && data.categorizedSkills.custom_categories.length > 0 && (
                    <>
                      {data.categorizedSkills.custom_categories.map((customCat, idx) => {
                        if (!customCat.name || !customCat.skills || customCat.skills.length === 0) return null;
                        return (
                          <div key={`custom-${idx}`} style={{ marginBottom: "6px" }}>
                            <span style={{ fontWeight: "600", fontSize: "10px" }}>{customCat.name}:</span>
                            <span style={{ marginLeft: "4px", fontSize: "10px" }}>{customCat.skills.join(", ")}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              ) : layoutVariant === "aether" ? (
                <div style={{ ...baseTextStyle, fontSize: "10px" }}>{skills.join(", ")}</div>
              ) : (
                skills.map((skill, idx) => (
                  <div key={idx} style={{ marginBottom: "6px" }}>
                    <span style={{ fontWeight: "600" }}>{skill}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null;

      case "Work Experience":
        return workExperience.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading(getSectionTitle("Work Experience"))}
            <div style={sectionBorderStyle("12px")} />
            {workExperience.map((exp, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                {layoutVariant === "executive" ? (
                  <>
                    <div style={{ marginBottom: "2px" }}>
                      <span style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "12px" }}>{exp.role}</span>
                      <span style={{ ...baseTextStyle, fontSize: "11px" }}>, {formatDate(exp.startDate)} - {exp.currentlyWorking ? "Current" : formatDate(exp.endDate)}</span>
                    </div>
                    <div style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "11px", marginBottom: "4px" }}>
                      {exp.company}{exp.location ? <span style={{ fontWeight: "normal" }}>{`, ${exp.location}`}</span> : ""}
                    </div>
                  </>
                ) : layoutVariant === "classic" ? (
                  <>
                    <div style={{ marginBottom: "2px" }}>
                      <span style={{ ...titleStyle, fontSize: "12px", color: style.headingColor }}>{exp.role}</span>
                      <span style={{ ...baseTextStyle, fontSize: "11px" }}> | {formatDate(exp.startDate)} — {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}</span>
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "11px", marginBottom: "4px" }}>
                      {exp.company}{exp.location ? ` - ${exp.location}` : ""}
                    </div>
                  </>
                ) : layoutVariant === "classic-formal" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <h3 style={{ ...titleStyle, margin: 0, fontSize: "12px" }}>{exp.role}</h3>
                      <span style={{ ...baseTextStyle, fontSize: "12px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {formatDate(exp.startDate)} — {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                      </span>
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "12px", marginBottom: "4px" }}>
                      {exp.company}{exp.location ? ` | ${exp.location}` : ""}
                    </div>
                  </>
                ) : layoutVariant === "slate" ? (
                  <>
                    <h3 style={{ ...titleStyle, fontSize: "12px", margin: "0 0 2px 0" }}>{exp.role}</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                      <span style={{ ...baseTextStyle, fontSize: "11px", fontStyle: "italic" }}>
                        {exp.company}{exp.location ? `, ${exp.location}` : ""}
                      </span>
                      <span style={{ ...baseTextStyle, fontSize: "11px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {formatDate(exp.startDate)} — {exp.currentlyWorking ? "Current" : formatDate(exp.endDate)}
                      </span>
                    </div>
                  </>
                ) : layoutVariant === "pillar" || layoutVariant === "ember" ? (
                  <>
                    <div style={{ ...titleStyle, fontSize: "12px", marginBottom: "2px" }}>{exp.role}</div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "2px" }}>
                      {exp.company}{exp.location ? ` | ${exp.location}` : ""}
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "4px" }}>
                      {formatDate(exp.startDate)} - {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <h3 style={{ ...titleStyle, margin: 0, textTransform: "capitalize" }}>{exp.role}</h3>
                      <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                        {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                      </span>
                    </div>
                    <p style={{ ...baseTextStyle, fontWeight: "500", margin: "4px 0", fontSize: "12px", fontStyle: "italic" }}>
                      {exp.company && <span style={{ ...titleStyle }}>{exp.company}</span>}
                      {exp.location && <span> | {exp.location}</span>}
                    </p>
                  </>
                )}
                {exp.technologies && exp.technologies.length > 0 && (
                  <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px" }}>
                    <span style={{ fontWeight: "600", fontStyle: "italic" }}>Tech Stack:</span> <span className="italic">{exp.technologies.join(", ")}</span>
                  </p>
                )}
                {exp.description && (
                  <div style={{ paddingLeft: "20px", marginTop: "4px" }}>
                    {renderHTMLToReact(exp.description)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case "Education":
        return education.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading("EDUCATION")}
            <div style={sectionBorderStyle("12px")} />
            {domainFamily === 'government_standard' ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', ...baseTextStyle, fontSize: '11px', fontWeight: 600, borderBottom: `1px solid ${style.headingColor}`, paddingBottom: '4px', marginBottom: '4px' }}>
                  <span>Degree / Course</span><span>Institution</span><span>Year</span><span>Score</span>
                </div>
                {education.map((edu, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', ...baseTextStyle, fontSize: '11px', padding: '3px 0', borderBottom: '1px solid #e5e5e5' }}>
                    <span>{edu.degree}</span>
                    <span>{edu.school}</span>
                    <span>{edu.endDate ? formatDate(edu.endDate) : (edu.startDate ? formatDate(edu.startDate) : '')}</span>
                    <span>{edu.scoreValue ? `${edu.scoreValue}${edu.scoreType === 'Percentage' ? '%' : (edu.scoreType ? ` ${edu.scoreType}` : '')}` : ''}</span>
                  </div>
                ))}
              </div>
            ) : education.map((edu, idx) => (
              <div key={idx} style={{ marginBottom: "8px" }}>
                {layoutVariant === "executive" ? (
                  <>
                    <div style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "12px", marginBottom: "2px" }}>
                      {edu.degree}{edu.startDate ? <span style={{ fontWeight: "normal" }}>{`, ${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`}</span> : ""}
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "11px", marginBottom: "2px" }}>{edu.school}</div>
                    {edu.scoreValue && <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "11px" }}>{edu.scoreType}: {edu.scoreValue}</p>}
                  </>
                ) : layoutVariant === "classic" ? (
                  <>
                    <div style={{ ...titleStyle, fontSize: "12px", marginBottom: "2px", color: style.headingColor }}>
                      {edu.school} | {edu.degree}
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "11px", marginBottom: "2px" }}>
                      {formatDate(edu.startDate)}{edu.endDate ? ` - ${formatDate(edu.endDate)}` : ""}
                    </div>
                    {edu.scoreValue && <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "11px" }}>{edu.scoreType}: {edu.scoreValue}</p>}
                  </>
                ) : layoutVariant === "classic-formal" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <h3 style={{ ...titleStyle, margin: 0, fontSize: "12px" }}>{edu.school}</h3>
                      <span style={{ ...baseTextStyle, fontSize: "12px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                      </span>
                    </div>
                    <p style={{ ...baseTextStyle, fontSize: "11px", fontStyle: "italic", margin: "2px 0" }}>{edu.degree}</p>
                    {edu.scoreValue && <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "11px" }}>{edu.scoreType}: {edu.scoreValue}</p>}
                  </>
                ) : layoutVariant === "slate" ? (
                  <>
                    <div style={{ ...baseTextStyle, fontSize: "12px", marginBottom: "2px" }}>
                      {edu.degree}{edu.startDate ? `, ${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}` : ""}
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "11px", marginBottom: "2px" }}>{edu.school}</div>
                    {edu.scoreValue && <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "11px" }}>{edu.scoreType}: {edu.scoreValue}</p>}
                  </>
                ) : layoutVariant === "pillar" || layoutVariant === "ember" ? (
                  <>
                    <div style={{ ...titleStyle, fontSize: "12px", marginBottom: "2px" }}>{edu.degree}</div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "2px" }}>{edu.school}</div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "4px" }}>
                      {formatDate(edu.startDate)}{edu.endDate ? ` - ${formatDate(edu.endDate)}` : ""}
                      {edu.scoreValue && ` | ${edu.scoreType}: ${edu.scoreValue}`}
                    </div>
                  </>
                ) : layoutVariant === "aether" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <h3 style={{ ...titleStyle, margin: 0, fontSize: "12px" }}>{edu.degree}</h3>
                      <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                        {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                      </span>
                    </div>
                    <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px", fontStyle: "italic" }}>{edu.school}</p>
                    {edu.scoreValue && (
                      <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px" }}>{edu.scoreType}: {edu.scoreValue}</p>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <h3 style={{ ...titleStyle, margin: 0, textTransform: "capitalize" }}>{edu.degree}</h3>
                      <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                        {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                      </span>
                    </div>
                    <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px", fontWeight: "500", fontStyle: "italic" }}>{edu.school}</p>
                    {edu.scoreValue && (
                      <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px" }}>{edu.scoreType}: {edu.scoreValue}</p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case "Certifications":
        return certifications.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading(getSectionTitle("Certifications"))}
            <div style={sectionBorderStyle("12px")} />
            <div style={{ paddingLeft: "20px" }}>
              {certifications.map((cert, idx) => (
                <div key={idx} style={{ ...baseTextStyle, marginBottom: "4px", fontSize: "12px" }}>
                  • <span style={{ ...titleStyle }}>{cert.name}</span>
                  {(cert.issuer) && <span> - {cert.issuer}</span>}
                  {((cert.issueDate) || cert.expiryDate) && <span> | </span>}
                  {(cert.issueDate) && <span>{cert.issueDate}</span>}
                  {(cert.issueDate) && cert.expiryDate && <span> – </span>}
                  {cert.expiryDate && <span>{cert.expiryDate}</span>}
                </div>
              ))}
            </div>
          </div>
        ) : null;

      case "Internships":
        return internships.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading("INTERNSHIPS")}
            <div style={sectionBorderStyle("12px")} />
            {internships.map((intern, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                {layoutVariant === "executive" ? (
                  <>
                    <div style={{ marginBottom: "2px" }}>
                      <span style={{ ...titleStyle, fontSize: "12px" }}>{intern.role}</span>
                      <span style={{ ...baseTextStyle, fontSize: "11px" }}>, {formatDate(intern.startDate)} - {intern.currentlyWorking ? "Current" : formatDate(intern.endDate)}</span>
                    </div>
                    <div style={{ ...titleStyle, fontSize: "11px", marginBottom: "4px" }}>
                      {intern.company}{intern.location ? <span style={{ fontWeight: "normal" }}>{`, ${intern.location}`}</span> : ""}
                    </div>
                  </>
                ) : layoutVariant === "classic" ? (
                  <>
                    <div style={{ marginBottom: "2px" }}>
                      <span style={{ ...titleStyle, fontSize: "12px", color: style.headingColor }}>{intern.role}</span>
                      <span style={{ ...baseTextStyle, fontSize: "11px" }}> | {formatDate(intern.startDate)} — {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}</span>
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "11px", marginBottom: "4px" }}>
                      {intern.company}{intern.location ? ` - ${intern.location}` : ""}
                    </div>
                  </>
                ) : layoutVariant === "classic-formal" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <h3 style={{ ...titleStyle, margin: 0, fontSize: "12px" }}>{intern.role}</h3>
                      <span style={{ ...baseTextStyle, fontSize: "12px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {formatDate(intern.startDate)} — {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                      </span>
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "12px", marginBottom: "4px" }}>
                      {intern.company}{intern.location ? ` | ${intern.location}` : ""}
                    </div>
                  </>
                ) : layoutVariant === "slate" ? (
                  <>
                    <h3 style={{ ...titleStyle, fontSize: "12px", margin: "0 0 2px 0" }}>{intern.role}</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                      <span style={{ ...baseTextStyle, fontSize: "11px", fontStyle: "italic" }}>
                        {intern.company}{intern.location ? `, ${intern.location}` : ""}
                      </span>
                      <span style={{ ...baseTextStyle, fontSize: "11px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {formatDate(intern.startDate)} — {intern.currentlyWorking ? "Current" : formatDate(intern.endDate)}
                      </span>
                    </div>
                  </>
                ) : layoutVariant === "pillar" || layoutVariant === "ember" ? (
                  <>
                    <div style={{ ...titleStyle, fontSize: "12px", marginBottom: "2px" }}>{intern.role}</div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "2px" }}>
                      {intern.company}{intern.location ? ` | ${intern.location}` : ""}
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "4px" }}>
                      {formatDate(intern.startDate)} - {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <h3 style={{ ...titleStyle, margin: 0, textTransform: "capitalize" }}>{intern.role}</h3>
                      <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                        {formatDate(intern.startDate)} – {formatDate(intern.endDate)}
                      </span>
                    </div>
                    <p style={{ ...baseTextStyle, fontWeight: "500", margin: "4px 0", fontSize: "12px", fontStyle: "italic" }}>
                      {intern.company}
                      {intern.location && <span> | {intern.location}</span>}
                    </p>
                  </>
                )}
                {intern.technologies && intern.technologies.length > 0 && (
                  <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px" }}>
                    <span style={{ ...titleStyle, fontStyle: "italic" }}>Tech Stack:</span> <span className="italic">{intern.technologies.join(", ")}</span>
                  </p>
                )}
                {intern.description && (
                  <div style={{ paddingLeft: "20px", marginTop: "4px" }}>
                    {renderHTMLToReact(intern.description)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case "Projects":
        return projects.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading(getSectionTitle("Projects"))}
            <div style={sectionBorderStyle("12px")} />
            {projects.map((proj, idx) => (
              <div key={idx} style={{ marginBottom: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                  <h3 style={{ ...titleStyle, fontSize: "12px", margin: 0, textTransform: "capitalize" }}>{proj.title}</h3>
                  {(proj.startDate || proj.endDate || proj.link) && (
                    <span style={{ ...baseTextStyle, fontSize: "11px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                      {(proj.startDate || proj.endDate) && (
                        <>{formatDate(proj.startDate)}{proj.startDate && proj.endDate ? " — " : ""}{formatDate(proj.endDate)}</>
                      )}
                      {(proj.startDate || proj.endDate) && proj.link && " | "}
                      {proj.link && (
                        <a href={proj.link} style={{ color: "#2563eb", textDecoration: "underline", fontWeight: "bold" }}>GitHub</a>
                      )}
                    </span>
                  )}
                </div>
                {proj.technologies.length > 0 && (
                  <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px" }}>
                    <span style={{ ...titleStyle, fontStyle: "italic" }}>Tech Stack:</span> <span className="italic">{proj.technologies.join(", ")}</span>
                  </p>
                )}
                {proj.description && (
                  <div style={{ paddingLeft: "20px", marginTop: "4px", marginBottom: "4px", fontSize: "12px" }}>
                    {renderHTMLToReact(proj.description)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case "Languages":
        return languages.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading("LANGUAGES")}
            <div style={sectionBorderStyle("12px")} />
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", fontSize: "11px", ...baseTextStyle }}>
                  <span style={{ marginRight: "6px" }}>•</span>
                  <span>
                    <span style={{ ...titleStyle, fontSize: "11px" }}>{lang.language} </span> <span style={{ fontSize: "11px" }}> - {lang.proficiency}</span>
                  </span>
                </div>
              ))}
            </div>
          </div >
        ) : null;

      case "Awards":
        return awards && awards.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading("AWARDS")}
            <div style={sectionBorderStyle("12px")} />
            {awards.map((award, idx) => (
              <div key={idx} style={{ marginBottom: "8px", display: "flex", alignItems: "flex-start" }}>
                <span style={{ marginRight: "8px", ...baseTextStyle }}>•</span>
                <div style={baseTextStyle}>
                  <span style={{ ...titleStyle, fontSize: "12px" }}>{award.title}</span>
                  <span style={{ fontSize: "12px" }}> - {award.issuedBy} ({award.year})</span>
                </div>
              </div>
            ))}
          </div>
        ) : null;

      case "Achievements":
        return achievements && achievements.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading(getSectionTitle("Achievements"))}
            <div style={sectionBorderStyle("12px")} />
            {achievements.map((achievement, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", alignItems: "baseline" }}>
                  <h3 style={{ ...titleStyle, margin: 0, fontSize: "12px" }}>{achievement.title}</h3>
                  {achievement.date && (
                    <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                      {formatDate(achievement.date)}
                    </span>
                  )}
                </div>
                {
                  achievement.description && (
                    <div style={{ paddingLeft: "20px", marginTop: "4px" }}>
                      {renderHTMLToReact(achievement.description)}
                    </div>
                  )
                }
              </div>
            ))
            }
          </div >
        ) : null;

      case "Publications":
        return publications && publications.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading(getSectionTitle("Publications"))}
            <div style={sectionBorderStyle("12px")} />
            {publications.map((pub, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <h3 style={{ ...titleStyle, margin: "0 0 4px 0", fontSize: "12px" }}>
                  {pub.title}
                </h3>
                {pub.authors && (
                  <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0" }}>
                    <span style={{ fontWeight: "600" }}>Authors:</span> {pub.authors}
                  </p>
                )}
                {(pub.publicationName || pub.date) && (
                  <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0" }}>
                    <span style={{ fontStyle: "italic" }}>{pub.publicationName}</span>{pub.publicationName && pub.date ? ` | ${formatDate(pub.date)}` : formatDate(pub.date)}
                  </p>
                )}
                {pub.url && (
                  <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0" }}>
                    <span style={{ fontWeight: "600" }}>URL:</span>{" "}
                    <a href={pub.url} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>{pub.url}</a>
                  </p>
                )}
                {pub.doi && (
                  <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0" }}>
                    <span style={{ fontWeight: "600" }}>DOI:</span>{" "}
                    <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>{pub.doi}</a>
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case "Patents":
        return patents && patents.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading("PATENTS")}
            <div style={sectionBorderStyle("12px")} />
            {patents.map((pat, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <h3 style={{ ...titleStyle, margin: "0 0 4px 0", fontSize: "12px" }}>
                  {pat.title}
                </h3>
                {pat.patentNumber && (
                  <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0" }}>
                    <span style={{ ...titleStyle, fontSize: "12px", fontWeight: "600" }}>Patent No:</span> {pat.patentNumber}
                  </p>
                )}
                {pat.status && (
                  <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0" }}>
                    <span style={{ ...titleStyle, fontSize: "12px", fontWeight: "600" }}>Status:</span> {pat.status}
                  </p>
                )}
                {pat.date && (
                  <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0", color: accent }}>
                    <span style={{ ...titleStyle, fontSize: "12px", fontWeight: "600" }}>Date:</span> {formatDate(pat.date)}
                  </p>
                )}
                {pat.description && (
                  <div style={{ paddingLeft: "12px", marginTop: "4px" }}>
                    {renderHTMLToReact(pat.description)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case "Hobbies":
        return hobbies && hobbies.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading("HOBBIES")}
            <div style={sectionBorderStyle("12px")} />
            {hobbies.map((hobby, idx) => (
              <div key={idx} style={{ marginBottom: "10px" }}>
                <div className="flex gap-2">
                  <h3 style={{ ...titleStyle, fontWeight: "bold", fontSize: "12px", margin: "0 0 4px 0" }}>{hobby.name}</h3>
                  {hobby.proficiencyLevel && (
                    <span style={{ ...baseTextStyle, fontSize: "11px" }}> - ({hobby.proficiencyLevel})</span>
                  )}
                </div>
                {hobby.description && (
                  <div style={{ paddingLeft: "20px" }}>
                    {renderHTMLToReact(hobby.description)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case "Interests":
        return interests && interests.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading("INTERESTS")}
            <div style={sectionBorderStyle("12px")} />
            {interests.map((interest, idx) => (
              <div key={idx} style={{ ...baseTextStyle }}>
                <div className="flex gap-2">
                  <div style={{ ...titleStyle, fontSize: "12px" }}>{interest.name}</div>
                  {interest.category && (
                    <div style={{ fontSize: "11px" }}> - ({interest.category})</div>
                  )}
                </div>
                {interest.description && (
                  <div style={{ marginTop: "4px", paddingLeft: "20px" }}>
                    {renderHTMLToReact(interest.description)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case "Volunteering":
        return volunteering && volunteering.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading("VOLUNTEERING")}
            <div style={sectionBorderStyle("12px")} />
            {volunteering.map((vol, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <h3 style={{ ...titleStyle, margin: 0, fontSize: "12px" }}>{vol.role}</h3>
                    <p style={{ ...baseTextStyle, fontSize: "12px", margin: "4px 0 0 0" }}>
                      {vol.organization}
                    </p>
                  </div>
                  <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                    {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null;

      case "References":
        return references && references.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading("REFERENCES")}
            <div style={sectionBorderStyle("12px")} />
            {references.map((ref, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <h3 style={{ ...titleStyle, margin: 0, fontSize: "12px" }}>{ref.name}</h3>
                <p style={{ ...baseTextStyle, fontSize: "12px", margin: "4px 0 2px 0" }}>{ref.relation}</p>
                <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0" }}>{ref.contact}</p>
              </div>
            ))}
          </div>
        ) : null;

      case "Declaration":
        return (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading("DECLARATION")}
            <div style={sectionBorderStyle("12px")} />
            <p style={{ ...baseTextStyle, fontSize: "12px", margin: "0 0 12px 0" }}>
              {declaration || DEFAULT_DECLARATION}
            </p>
            <div style={{ display: "flex", gap: "40px", marginTop: "8px" }}>
              <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                <strong>Date:</strong> {data.declarationDate || "_______________"}
              </span>
              <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                <strong>Place:</strong> {data.declarationPlace || "_______________"}
              </span>
              <span style={{ ...baseTextStyle, fontSize: "12px" }}><strong>Signature:</strong> _______________</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const displayName = personalInfo.fullname || "Full Name";

  const sectionBorderStyle = (mb: string): React.CSSProperties =>
    layoutVariant === "centered"
      ? { borderBottom: `1px solid ${style.headingColor}`, paddingTop: "8px", marginBottom: mb }
      : layoutVariant === "slate"
        ? { borderBottom: `1px solid ${accent}`, paddingTop: "4px", marginBottom: mb }
        : { marginBottom: mb };

  const renderSectionHeading = (title: string) => {
    if (layoutVariant === "classic-formal") {
      return (
        <h2 style={{ color: accent, fontSize: style.headingFontSize, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center", backgroundColor: style.sectionHeaderBg || "#f0f0f0", paddingTop: "6px", paddingBottom: "6px", paddingLeft: "8px", paddingRight: "8px", marginTop: 0, marginRight: 0, marginBottom: "10px", marginLeft: 0, lineHeight: 1.2, display: "block" }}>
          {title}
        </h2>
      );
    }
    if (layoutVariant === "executive" || layoutVariant === "slate") {
      return (
        <h2 style={{ color: accent, fontSize: style.headingFontSize, fontWeight: "bold", marginBottom: "6px" }}>
          {title.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
        </h2>
      );
    }
    if (layoutVariant === "centered") {
      return <h2 style={{ ...sectionHeadingStyle, marginBottom: 0 }}>{title}</h2>;
    }
    if (layoutVariant === "aether") {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
          <span style={{ color: accent, fontSize: style.headingFontSize, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
            {title}
          </span>
          <div style={{ height: "1px", width: "100%", backgroundColor: accent }} />
        </div>
      );
    }
    if (layoutVariant === "pillar" || layoutVariant === "ember") {
      return (
        <h2 style={{ fontSize: style.headingFontSize, fontWeight: "bold", color: accent, textTransform: "none", letterSpacing: "0.01em", margin: "0 0 8px 0" }}>
          {title.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
        </h2>
      );
    }
    return <h2 style={sectionHeadingStyle}>{title}</h2>;
  };

  const renderDomainPersonalInfo = () => {
    const fields: { label: string; value?: string; isUrl?: boolean }[] = [];
    if (domainFamily === 'healthcare') {
      // specialisation and medicalRegNo are shown in the header line
    } else if (domainFamily === 'legal') {
      if (personalInfo.barEnrollmentNo) fields.push({ label: 'Bar Enrollment No.', value: personalInfo.barEnrollmentNo });
      if (personalInfo.yearOfEnrollment) fields.push({ label: 'Year of Enrollment', value: personalInfo.yearOfEnrollment });
      if (personalInfo.courtsOfPractise) fields.push({ label: 'Courts Practised In', value: personalInfo.courtsOfPractise });
    } else if (domainFamily === 'marine_merchant_navy') {
      if (personalInfo.rank) fields.push({ label: 'Rank', value: personalInfo.rank });
      if (personalInfo.cocNumber) fields.push({ label: 'CoC Number', value: personalInfo.cocNumber });
      if (personalInfo.vesselTypes) fields.push({ label: 'Vessel Types', value: personalInfo.vesselTypes });
      if (personalInfo.stcwCertificates) fields.push({ label: 'STCW Certificates', value: personalInfo.stcwCertificates });
    } else if (domainFamily === 'research_scholar') {
      if (personalInfo.orcidId) fields.push({ label: 'ORCID', value: personalInfo.orcidId });
      if (personalInfo.hIndex) fields.push({ label: 'h-index', value: personalInfo.hIndex });
      if (personalInfo.googleScholarUrl) fields.push({ label: 'Google Scholar', value: personalInfo.googleScholarUrl, isUrl: true });
    }
    if (fields.length === 0) return null;
    const _hdrDivider = ['ember', 'classic-formal', 'classic', 'pillar', 'left-right', 'left-stacked'].includes(layoutVariant || '');
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: '12px', padding: '8px 0', borderTop: _hdrDivider ? 'none' : `1px solid ${style.headingColor}`, borderBottom: `1px solid ${style.headingColor}` }}>
        {fields.map(({ label, value, isUrl }) => (
          <div key={label} style={{ ...baseTextStyle, fontSize: '11px', display: 'flex', gap: '4px' }}>
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{label}:</span>
            {isUrl
              ? <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline', wordBreak: 'break-all' }}>{value}</a>
              : <span style={{ wordBreak: 'break-word' }}>{value}</span>}
          </div>
        ))}
      </div>
    );
  };

  const renderHeader = () => {
    if (layoutVariant === "classic-formal") {
      return (
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          <h1 style={{ ...nameStyle, textAlign: "center" }}>{displayName}</h1>
          {professionalSummary?.targetRole && <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0" }}>{professionalSummary.targetRole}</p>}
          {domainFamily === 'healthcare' && (personalInfo.specialisation || personalInfo.medicalRegNo) && (
            <p style={{ ...baseTextStyle, fontSize: "11px", margin: "2px 0", fontWeight: "500", textAlign: "center" }}>
              {[personalInfo.specialisation, personalInfo.medicalRegNo ? `Reg. No. ${personalInfo.medicalRegNo}` : ''].filter(Boolean).join(' | ')}
            </p>
          )}
          {personalInfo.location && <p style={{ ...baseTextStyle, fontSize: "11px", margin: "2px 0" }}>{personalInfo.location}</p>}
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", margin: "6px 0" }}>
            {personalInfo.email && <span style={{ ...baseTextStyle, fontSize: "11px" }}>{personalInfo.email}</span>}
            {personalInfo.phone && <span style={{ ...baseTextStyle, fontSize: "11px" }}>{personalInfo.countryCode}{personalInfo.phone}</span>}
            {personalInfo.linkedinUrl && <a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ ...baseTextStyle, fontSize: "11px", color: "blue", textDecoration: "underline" }}>LinkedIn</a>}
            {personalInfo.portfolioUrl && <a href={personalInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ ...baseTextStyle, fontSize: "11px", color: "blue", textDecoration: "underline" }}>Portfolio</a>}
            {personalInfo.githubUrl && <a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" style={{ ...baseTextStyle, fontSize: "11px", color: "blue", textDecoration: "underline" }}>GitHub</a>}
          </div>
          <hr style={{ border: "none", borderTop: `1px solid ${style.bodyColor}`, margin: "8px 0 16px 0" }} />
        </div>
      );
    }
    if (layoutVariant === "executive") {
      const contactParts: string[] = [];
      if (personalInfo.email) contactParts.push(personalInfo.email);
      if (personalInfo.location) contactParts.push(personalInfo.location);
      if (personalInfo.phone) contactParts.push(`${personalInfo.countryCode}${personalInfo.phone}`);
      return (
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          <h1 style={{ ...nameStyle, textAlign: "center", fontSize: "26px", marginBottom: "4px", textTransform: "none" }}>{displayName}</h1>
          {professionalSummary?.targetRole && <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 6px 0" }}>{professionalSummary.targetRole}</p>}
          {domainFamily === 'healthcare' && (personalInfo.specialisation || personalInfo.medicalRegNo) && (
            <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 6px 0", fontWeight: "500", textAlign: "center" }}>
              {[personalInfo.specialisation, personalInfo.medicalRegNo ? `Reg. No. ${personalInfo.medicalRegNo}` : ''].filter(Boolean).join(' | ')}
            </p>
          )}
          <hr style={{ border: "none", borderTop: `3px solid ${style.accentColor}`, margin: "6px 0" }} />
          <p style={{ ...baseTextStyle, fontSize: "10px", margin: "6px 0 16px 0" }}>
            {contactParts.join(" • ")}
            {personalInfo.linkedinUrl && <>{contactParts.length > 0 ? " • " : ""}<a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>LinkedIn</a></>}
            {personalInfo.portfolioUrl && <>{(contactParts.length > 0 || personalInfo.linkedinUrl) ? " • " : ""}<a href={personalInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>Portfolio</a></>}
            {personalInfo.githubUrl && <>{(contactParts.length > 0 || personalInfo.linkedinUrl || personalInfo.portfolioUrl) ? " • " : ""}<a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>GitHub</a></>}
          </p>
        </div>
      );
    }
    if (layoutVariant === "classic") {
      return (
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          <h1 style={{ ...nameStyle, textAlign: "center", fontSize: "26px", marginBottom: "6px" }}>{displayName}</h1>
          {professionalSummary?.targetRole && <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 4px 0" }}>{professionalSummary.targetRole}</p>}
          {domainFamily === 'healthcare' && (personalInfo.specialisation || personalInfo.medicalRegNo) && (
            <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 4px 0", fontWeight: "500", textAlign: "center" }}>
              {[personalInfo.specialisation, personalInfo.medicalRegNo ? `Reg. No. ${personalInfo.medicalRegNo}` : ''].filter(Boolean).join(' | ')}
            </p>
          )}
          {personalInfo.location && <p style={{ ...baseTextStyle, fontSize: "11px", margin: "2px 0" }}>{personalInfo.location}</p>}
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", margin: "4px 0", ...baseTextStyle, fontSize: "11px" }}>
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.countryCode}{personalInfo.phone}</span>}
            {personalInfo.linkedinUrl && <a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>LinkedIn</a>}
            {personalInfo.portfolioUrl && <a href={personalInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>Portfolio</a>}
            {personalInfo.githubUrl && <a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>GitHub</a>}
          </div>
          <hr style={{ border: "none", borderTop: `1px solid #d1d5db`, margin: "10px 0 16px 0" }} />
        </div>
      );
    }
    if (layoutVariant === "aether") {
      const contactParts: string[] = [];
      if (personalInfo.email) contactParts.push(personalInfo.email);
      if (personalInfo.phone) contactParts.push(`${personalInfo.countryCode}${personalInfo.phone}`);
      if (personalInfo.location) contactParts.push(personalInfo.location);
      return (
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "bold", color: accent, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            {displayName}
          </h1>
          {professionalSummary?.targetRole && <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 4px 0", fontWeight: "500" }}>{professionalSummary.targetRole}</p>}
          {domainFamily === 'healthcare' && (personalInfo.specialisation || personalInfo.medicalRegNo) && (
            <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 4px 0", fontWeight: "500" }}>
              {[personalInfo.specialisation, personalInfo.medicalRegNo ? `Reg. No. ${personalInfo.medicalRegNo}` : ''].filter(Boolean).join(' | ')}
            </p>
          )}
          {contactParts.length > 0 && (
            <p style={{ ...baseTextStyle, fontSize: "10px", margin: "0 0 2px 0" }}>
              {contactParts.join(" | ")}
            </p>
          )}
          {(personalInfo.linkedinUrl || personalInfo.portfolioUrl || personalInfo.githubUrl) && (
            <p style={{ ...baseTextStyle, fontSize: "10px", margin: "0 0 12px 0" }}>
              {personalInfo.linkedinUrl && <a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>LinkedIn</a>}
              {personalInfo.portfolioUrl && <>{personalInfo.linkedinUrl ? " | " : ""}<a href={personalInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>Portfolio</a></>}
              {personalInfo.githubUrl && <>{(personalInfo.linkedinUrl || personalInfo.portfolioUrl) ? " | " : ""}<a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>GitHub</a></>}
            </p>
          )}
        </div>
      );
    }
    if (layoutVariant === "pillar") {
      return (
        <div>
          <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "12px", marginBottom: "10px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "bold", color: accent, margin: "0 0 4px 0" }}>
              {displayName}
            </h1>
            {professionalSummary?.targetRole && <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 6px 0", fontWeight: "500" }}>{professionalSummary.targetRole}</p>}
            {domainFamily === 'healthcare' && (personalInfo.specialisation || personalInfo.medicalRegNo) && (
              <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 6px 0", fontWeight: "500" }}>
                {[personalInfo.specialisation, personalInfo.medicalRegNo ? `Reg. No. ${personalInfo.medicalRegNo}` : ''].filter(Boolean).join(' | ')}
              </p>
            )}
            {personalInfo.email && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.email}
              </p>
            )}
            {personalInfo.phone && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.countryCode}{personalInfo.phone}
              </p>
            )}
            {personalInfo.location && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.location}
              </p>
            )}
            {personalInfo.linkedinUrl && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                <a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>LinkedIn</a>
              </p>
            )}
            {personalInfo.portfolioUrl && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                <a href={personalInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>Portfolio</a>
              </p>
            )}
            {personalInfo.githubUrl && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                <a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>GitHub</a>
              </p>
            )}
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #d1d5db", margin: "0 0 16px 0" }} />
        </div>
      );
    }
    if (layoutVariant === "ember") {
      return (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "bold", color: accent, margin: "0 0 4px 0" }}>
              {displayName}
            </h1>
            {professionalSummary?.targetRole && <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 6px 0", fontWeight: "500" }}>{professionalSummary.targetRole}</p>}
            {domainFamily === 'healthcare' && (personalInfo.specialisation || personalInfo.medicalRegNo) && (
              <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 6px 0", fontWeight: "500", textAlign: "right" }}>
                {[personalInfo.specialisation, personalInfo.medicalRegNo ? `Reg. No. ${personalInfo.medicalRegNo}` : ''].filter(Boolean).join(' | ')}
              </p>
            )}
            {personalInfo.email && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.email}
              </p>
            )}
            {personalInfo.phone && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.countryCode}{personalInfo.phone}
              </p>
            )}
            {personalInfo.location && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.location}
              </p>
            )}
            {personalInfo.linkedinUrl && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                <a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>LinkedIn</a>
              </p>
            )}
            {personalInfo.portfolioUrl && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                <a href={personalInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>Portfolio</a>
              </p>
            )}
            {personalInfo.githubUrl && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                <a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>GitHub</a>
              </p>
            )}
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #d1d5db", margin: "10px 0 16px 0" }} />
        </div>
      );
    }
    if (layoutVariant === "slate") {
      return (
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ ...nameStyle, textAlign: "left", fontSize: "24px", marginBottom: "2px", textTransform: "none" }}>{displayName}</h1>
          {professionalSummary?.targetRole && <p style={{ ...baseTextStyle, fontSize: "12px", margin: "0 0 4px 0" }}>{professionalSummary.targetRole}</p>}
          {domainFamily === 'healthcare' && (personalInfo.specialisation || personalInfo.medicalRegNo) && (
            <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 4px 0", fontWeight: "500" }}>
              {[personalInfo.specialisation, personalInfo.medicalRegNo ? `Reg. No. ${personalInfo.medicalRegNo}` : ''].filter(Boolean).join(' | ')}
            </p>
          )}
          {(personalInfo.location || personalInfo.phone || personalInfo.linkedinUrl || personalInfo.portfolioUrl || personalInfo.githubUrl || personalInfo.email) && (
            <div style={{ display: "flex", justifyContent: "space-between", ...baseTextStyle, fontSize: "11px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                {personalInfo.location && <span>{personalInfo.location}</span>}
                {personalInfo.phone && <span>{personalInfo.countryCode}{personalInfo.phone}</span>}
                {personalInfo.linkedinUrl && <a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>LinkedIn</a>}
                {personalInfo.portfolioUrl && <a href={personalInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>Portfolio</a>}
                {personalInfo.githubUrl && <a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>GitHub</a>}
              </div>
              {personalInfo.email && <span>{personalInfo.email}</span>}
            </div>
          )}
        </div>
      );
    }
    if (layoutVariant === "left-right") {
      return (
        <div style={{ marginBottom: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <h1 className="text-4xl font-bold uppercase" style={{ ...nameStyle, textAlign: "left" }}>{displayName}</h1>
              {professionalSummary?.targetRole && <p style={{ ...baseTextStyle, fontSize: "12px", margin: 0, fontWeight: "500" }}>{professionalSummary.targetRole}</p>}
              {domainFamily === 'healthcare' && (personalInfo.specialisation || personalInfo.medicalRegNo) && (
                <p style={{ ...baseTextStyle, fontSize: "11px", margin: "2px 0 0", fontWeight: "500" }}>
                  {[personalInfo.specialisation, personalInfo.medicalRegNo ? `Reg. No. ${personalInfo.medicalRegNo}` : ''].filter(Boolean).join(' | ')}
                </p>
              )}
            </div>
            <div style={{ textAlign: "right", ...baseTextStyle, fontSize: "10px" }}>
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.countryCode}{personalInfo.phone}</div>}
              {personalInfo.location && <div>{personalInfo.location}</div>}
              {personalInfo.linkedinUrl && <div><a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>LinkedIn</a></div>}
              {personalInfo.portfolioUrl && <div><a href={personalInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>Portfolio</a></div>}
              {personalInfo.githubUrl && <div><a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>GitHub</a></div>}
            </div>
          </div>
          <hr style={{ border: "none", borderTop: `2px solid ${style.headingColor}`, margin: "0 0 16px 0" }} />
        </div>
      );
    }
    if (layoutVariant === "left-stacked") {
      return (
        <div style={{ marginBottom: "4px" }}>
          <div style={{ marginBottom: "12px" }}>
            <h1 className="text-4xl font-bold uppercase" style={{ ...nameStyle, textAlign: "left" }}>{displayName}</h1>
            {professionalSummary?.targetRole && <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0 6px", fontWeight: "500" }}>{professionalSummary.targetRole}</p>}
            {domainFamily === 'healthcare' && (personalInfo.specialisation || personalInfo.medicalRegNo) && (
              <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 6px", fontWeight: "500" }}>
                {[personalInfo.specialisation, personalInfo.medicalRegNo ? `Reg. No. ${personalInfo.medicalRegNo}` : ''].filter(Boolean).join(' | ')}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", ...baseTextStyle, fontSize: "10px" }}>
              <div>
                {personalInfo.email && <div>{personalInfo.email}</div>}
                {personalInfo.location && <div>{personalInfo.location}</div>}
                {personalInfo.portfolioUrl && <div><a href={personalInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>Portfolio</a></div>}
              </div>
              <div>
                {personalInfo.phone && <div>{personalInfo.countryCode}{personalInfo.phone}</div>}
                {personalInfo.linkedinUrl && <div><a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>LinkedIn</a></div>}
                {personalInfo.githubUrl && <div><a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>GitHub</a></div>}
              </div>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: `2px solid ${style.headingColor}`, margin: "0 0 16px 0" }} />
        </div>
      );
    }
    return (
      <div style={{ marginBottom: "16px" }}>
        <h1 className="text-4xl font-bold uppercase" style={nameStyle}>{displayName}</h1>
        {professionalSummary?.targetRole && <p style={{ ...baseTextStyle, fontSize: "12px", margin: 0, textAlign: "center", fontWeight: "500", marginBottom: "4px" }}>{professionalSummary.targetRole}</p>}
        {domainFamily === 'healthcare' && (personalInfo.specialisation || personalInfo.medicalRegNo) && (
          <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 4px", textAlign: "center", fontWeight: "500" }}>
            {[personalInfo.specialisation, personalInfo.medicalRegNo ? `Reg. No. ${personalInfo.medicalRegNo}` : ''].filter(Boolean).join(' | ')}
          </p>
        )}
        <p style={{ ...baseTextStyle, fontSize: "10px", margin: 0, textAlign: "center" }}>
          {[personalInfo.email, personalInfo.location, personalInfo.phone ? `${personalInfo.countryCode}${personalInfo.phone}` : ""].filter(Boolean).join(" | ")}
          {personalInfo.linkedinUrl && <>{(personalInfo.location || personalInfo.email || personalInfo.phone) ? " | " : ""}<a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>LinkedIn</a></>}
          {personalInfo.portfolioUrl && <>{(personalInfo.location || personalInfo.email || personalInfo.phone || personalInfo.linkedinUrl) ? " | " : ""}<a href={personalInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>Portfolio</a></>}
          {personalInfo.githubUrl && <>{(personalInfo.location || personalInfo.email || personalInfo.phone || personalInfo.linkedinUrl || personalInfo.portfolioUrl) ? " | " : ""}<a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "blue", textDecoration: "underline" }}>GitHub</a></>}
        </p>
      </div>
    );
  };

  return (
    <div style={{ ...baseTextStyle, padding: "32px", maxWidth: "900px", minHeight: "100vh", width: "100%" }}>
      {/* Header */}
      {renderHeader()}
      {renderDomainPersonalInfo()}

      {/* Render sections in order */}
      {sectionOrder && sectionOrder.length > 0 ? (() => {
        const items = sectionOrder
          .filter(s => s !== "Personal Info")
          .map(section => ({ section, rendered: renderSection(section) }))
          .filter(({ rendered }) => rendered !== null);
        return items.map(({ section, rendered }, idx) => {
          const isLast = idx === items.length - 1;
          if (layoutVariant === "left-right" || layoutVariant === "left-stacked") {
            return (
              <React.Fragment key={section}>
                {rendered}
                {!isLast && <div style={{ borderBottom: `1px solid ${style.headingColor}`, margin: "0 0 16px 0" }} />}
              </React.Fragment>
            );
          }
          if (layoutVariant === "pillar" || layoutVariant === "ember") {
            return (
              <React.Fragment key={section}>
                {rendered}
                {!isLast && <hr style={{ border: "none", borderTop: "1px solid #d1d5db", margin: "6px 0 16px 0" }} />}
              </React.Fragment>
            );
          }
          // aether, classic, executive, slate, centered, and any other variant
          return (
            <React.Fragment key={section}>
              {rendered}
              {!isLast && <div style={{ height: "14px" }} />}
            </React.Fragment>
          );
        });
      })() : null}

      {/* Custom Sections */}
      {customSections && customSections.map((section, sectionIdx) => (
        section.fields && section.fields.some(f => f.value && (typeof f.value === 'string' ? f.value.trim() !== '' : Array.isArray(f.value) ? f.value.some(v => v?.trim?.() !== '') : false)) && (
          <div key={sectionIdx} style={{ marginBottom: "16px" }}>
            {renderSectionHeading(section.sectionName.toUpperCase())}
            <div style={sectionBorderStyle("12px")} />
            <div style={{ ...baseTextStyle }}>
              {section.fields.map((field) => {
                const hasValue = Array.isArray(field.value)
                  ? (field.value as string[]).some(v => v?.trim?.() !== '')
                  : field.value && field.value.toString().trim() !== '';

                if (!hasValue) return null;

                return (
                  <div key={field.id} style={{ marginBottom: "8px" }}>
                    {Array.isArray(field.value) ? (
                      <ul style={{ ...baseTextStyle, margin: 0, paddingLeft: "20px", fontSize: "12px" }}>
                        {(field.value as string[])
                          .filter(v => v?.trim?.() !== '')
                          .map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                      </ul>
                    ) : (
                      <div style={{ paddingLeft: "20px" }}>
                        {renderHTMLToReact(field.value?.toString() || '')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      ))}
    </div>
  );
};

export default Template1;
