"use client";
import React from "react";
import { ResumeData, ResumeStyle } from "../builder/creation/_context/ResumeContext";
import SafeHTML from "@/components/common/SafeHTML";
import { ExternalLink } from "lucide-react";

interface Props {
  data: ResumeData;
  style: ResumeStyle;
  careerLevel?: "Fresher" | "Early Career" | "Mid-Level" | "Senior-Level";
  domainFamily?: string;
  sectionOrder?: string[];
  onPageCountChange?: (count: number) => void;
  layoutVariant?: "centered" | "left-right" | "left-stacked" | "classic-formal" | "classic" | "executive" | "slate" | "aether" | "pillar" | "ember";
}

const Template2: React.FC<Props> = ({ data, style, careerLevel = "Mid-Level", domainFamily = "healthcare", sectionOrder = [], layoutVariant = "centered" }) => {
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
    customSections,
  } = data;

  const getSectionTitle = (section: string): string => {
    if (section === "Professional Summary") {
      return careerLevel === "Fresher" ? "OBJECTIVE" : "PROFESSIONAL SUMMARY";
    }
    if (section === "Skills") {
      return careerLevel === "Senior-Level" ? "CORE COMPETENCIES" : "SKILLS";
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
      if (domainFamily === "marine_merchant") return "CERTIFICATES AND LICENSES";
      if (domainFamily === "cybersecurity") return "CERTIFICATES AND CLEARANCES";
      return "CERTIFICATIONS";
    }
    if (section === "Achievements") {
      return domainFamily === "sales_business_development" ? "KEY ACHIEVEMENTS" : "ACHIEVEMENTS";
    }
    return section;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    if (/^[A-Za-z]{3}\s\d{2}$/.test(dateString)) return dateString;
    if (/^\d{4}-\d{2}$/.test(dateString)) {
      const [year, month] = dateString.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]} ${year.slice(-2)}`;
    }
    return dateString;
  };

  const baseTextStyle: React.CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: style.bodyFontSize,
    lineHeight: style.lineSpacing,
    color: style.bodyColor,
  };

  const titleStyle: React.CSSProperties = {
    ...baseTextStyle,
    color: style.headingColor,
    fontWeight: "bold",
  };

  const accent = style.accentColor ?? style.headingColor;

  const headingStyle: React.CSSProperties = {
    color: style.headingColor,
    fontSize: style.headingFontSize,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.4rem",
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

  const getContactInfo = () => {
    const parts = [];
    if (personalInfo.location) parts.push(personalInfo.location);
    if (personalInfo.email) parts.push(personalInfo.email);
    if (personalInfo.phone) parts.push(`${personalInfo.countryCode}${personalInfo.phone}`);
    if (personalInfo.linkedinUrl) parts.push(personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''));
    if (personalInfo.portfolioUrl) parts.push(personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, ''));
    if (personalInfo.githubUrl) parts.push(personalInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, ''));
    return parts.join(" | ");
  };

  const extractTextFromHTML = (html: string): string => {
    const text = html
      .replace(/<\/div>/g, ' ')
      .replace(/<\/p>/g, ' ')
      .replace(/<\/li>/g, ' ')
      .replace(/<br\s*\/?>/g, ' ');

    // Parse inertly — DOMParser does NOT execute scripts or load resources,
    // so a malicious <img onerror> in resume HTML cannot fire here.
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  };

  const renderSection = (sectionName: string) => {
    switch (sectionName) {
      case "Professional Summary":
        return professionalSummary?.summary ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading(getSectionTitle("Professional Summary"))}
            <div style={sectionBorderStyle("8px")} />
            <div style={{ textAlign: "justify", fontSize: '12px' }}>
              <SafeHTML content={professionalSummary.summary} className="resume-description" />
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
              {data.categorizedSkills && Object.keys(data.categorizedSkills).length > 0 ? (
                <>
                  {Object.entries(data.categorizedSkills)
                    .filter(([category]) => category !== 'custom_categories')
                    .map(([category, categorySkills]) => {
                      const skillArr = Array.isArray(categorySkills)
                        ? (categorySkills as string[]).filter(s => typeof s === "string")
                        : [];
                      if (skillArr.length === 0) return null;
                      const categoryLabel = category
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                      return (
                        <div key={category} style={{ marginBottom: "6px" }}>
                          <span style={{ fontWeight: "600", fontSize: "10px" }}>{categoryLabel}:</span>
                          <span style={{ marginLeft: "4px", fontSize: "10px" }}>{skillArr.join(", ")}</span>
                        </div>
                      );
                    })}
                  {data.categorizedSkills.custom_categories && data.categorizedSkills.custom_categories.length > 0 && (
                    <>
                      {data.categorizedSkills.custom_categories.map((customCat: { id: string; name: string; skills: string[] }, idx: number) => {
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
                      {exp.company}{exp.location ? `, ${exp.location}` : ""}
                    </div>
                  </>
                ) : layoutVariant === "classic" ? (
                  <>
                    <div style={{ marginBottom: "2px" }}>
                      <span style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "12px", textTransform: "uppercase", color: style.headingColor }}>{exp.role}</span>
                      <span style={{ ...baseTextStyle, fontSize: "11px" }}> | {formatDate(exp.startDate)} — {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}</span>
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "11px", marginBottom: "4px" }}>
                      {exp.company}{exp.location ? ` - ${exp.location}` : ""}
                    </div>
                  </>
                ) : layoutVariant === "classic-formal" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <h3 style={{ ...baseTextStyle, fontWeight: "bold", margin: 0, fontSize: "12px" }}>{exp.role}</h3>
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
                    <h3 style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "12px", margin: "0 0 2px 0" }}>{exp.role}</h3>
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
                    <div style={{ fontWeight: "bold", fontSize: "12px", color: style.headingColor, marginBottom: "2px" }}>{exp.role}</div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "2px" }}>
                      {exp.company}{exp.location ? ` | ${exp.location}` : ""}
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "4px" }}>
                      {formatDate(exp.startDate)} - {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                    </div>
                  </>
                ) : layoutVariant !== "centered" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <h3 style={{ ...baseTextStyle, fontWeight: "bold", margin: 0, fontSize: "12px" }}>{exp.role}</h3>
                      <span style={{ ...baseTextStyle, fontSize: "12px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                      </span>
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "12px", marginBottom: "4px" }}>
                      {exp.company}{exp.location ? ` | ${exp.location}` : ""}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: "4px" }} className="flex items-center gap-2">
                      <h3 style={{ ...headingStyle, margin: 0, textTransform: "capitalize", fontSize: "12px" }}>{exp.company}</h3>
                      {exp.location && <span className="text-[12px]"> | {exp.location}</span>}
                    </div>
                    <p style={{ ...baseTextStyle, fontWeight: "bold", margin: "4px 0", fontSize: "12px" }} className="flex items-center gap-2">
                      {exp.role}
                      <span style={{ ...baseTextStyle, fontSize: "12px", fontWeight: "500" }}>
                        | {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                      </span>
                    </p>
                  </>
                )}
                {exp.description && (
                  <div style={{ paddingLeft: "20px", marginTop: "4px" }}>
                    {extractTextFromHTML(exp.description).split(/\n|(?<=[.!?])\s+(?=[A-Z])/).filter(line => line.trim()).map((line, lineIdx) => (
                      <div key={lineIdx} style={{ ...baseTextStyle, color: style.bodyColor, margin: "4px 0", fontSize: "12px" }}>
                        • {line.trim()}
                      </div>
                    ))}
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
            {education.map((edu, idx) => (
              <div key={idx} style={{ marginBottom: "8px" }}>
                {layoutVariant === "executive" ? (
                  <>
                    <div style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "12px", marginBottom: "2px" }}>
                      {edu.degree}{edu.startDate ? `, ${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}` : ""}
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "11px", marginBottom: "2px" }}>
                      {edu.school}
                    </div>
                    {edu.scoreValue && (
                      <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "11px" }}>{edu.scoreType}: {edu.scoreValue}</p>
                    )}
                  </>
                ) : layoutVariant === "classic" ? (
                  <>
                    <div style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "12px", marginBottom: "2px", color: style.headingColor }}>
                      {edu.school} | {edu.degree}
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "11px", marginBottom: "2px" }}>
                      {formatDate(edu.startDate)}{edu.endDate ? ` - ${formatDate(edu.endDate)}` : ""}
                    </div>
                    {edu.scoreValue && (
                      <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "11px" }}>{edu.scoreType}: {edu.scoreValue}</p>
                    )}
                  </>
                ) : layoutVariant === "classic-formal" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <h3 style={{ ...baseTextStyle, fontWeight: "bold", margin: 0, fontSize: "12px" }}>{edu.school}</h3>
                      <span style={{ ...baseTextStyle, fontSize: "12px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                      </span>
                    </div>
                    <p style={{ ...baseTextStyle, fontSize: "11px", fontStyle: "italic", margin: "2px 0" }}>{edu.degree}</p>
                    {edu.scoreValue && (
                      <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "11px" }}>{edu.scoreType}: {edu.scoreValue}</p>
                    )}
                  </>
                ) : layoutVariant === "slate" ? (
                  <>
                    <div style={{ ...baseTextStyle, fontSize: "12px", marginBottom: "2px" }}>
                      {edu.degree}{edu.startDate ? `, ${formatDate(edu.startDate)} — ${formatDate(edu.endDate)}` : ""}
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "11px", marginBottom: "2px" }}>{edu.school}</div>
                    {edu.scoreValue && (
                      <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "11px" }}>{edu.scoreType}: {edu.scoreValue}</p>
                    )}
                  </>
                ) : layoutVariant === "pillar" || layoutVariant === "ember" ? (
                  <>
                    <div style={{ fontWeight: "bold", fontSize: "12px", color: style.headingColor, marginBottom: "2px" }}>{edu.degree}</div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "2px" }}>{edu.school}</div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "4px" }}>
                      {formatDate(edu.startDate)}{edu.endDate ? ` - ${formatDate(edu.endDate)}` : ""}
                      {edu.scoreValue && ` | ${edu.scoreType}: ${edu.scoreValue}`}
                    </div>
                  </>
                ) : layoutVariant === "aether" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                      <h3 style={{ ...baseTextStyle, fontWeight: "bold", margin: 0, fontSize: "12px" }}>{edu.degree}</h3>
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
                      <h3 style={{ ...headingStyle, margin: 0, textTransform: "capitalize" }}>{edu.degree}</h3>
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
                  • <span style={{ fontWeight: "600" }}>{cert.name}</span>
                  {cert.issuer && <span> - {cert.issuer}</span>}
                  {(cert.issueDate || cert.expiryDate) && <span> | </span>}
                  {cert.issueDate && <span>{cert.issueDate}</span>}
                  {cert.issueDate && cert.expiryDate && <span> – </span>}
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
                      <span style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "12px" }}>{intern.role}</span>
                      <span style={{ ...baseTextStyle, fontSize: "11px" }}>, {formatDate(intern.startDate)} - {intern.currentlyWorking ? "Current" : formatDate(intern.endDate)}</span>
                    </div>
                    <div style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "11px", marginBottom: "4px" }}>
                      {intern.company}{intern.location ? `, ${intern.location}` : ""}
                    </div>
                  </>
                ) : layoutVariant === "classic" ? (
                  <>
                    <div style={{ marginBottom: "2px" }}>
                      <span style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "12px", textTransform: "uppercase" }}>{intern.role}</span>
                      <span style={{ ...baseTextStyle, fontSize: "11px" }}> | {formatDate(intern.startDate)} — {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}</span>
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "11px", marginBottom: "4px" }}>
                      {intern.company}{intern.location ? ` - ${intern.location}` : ""}
                    </div>
                  </>
                ) : layoutVariant === "classic-formal" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <h3 style={{ ...baseTextStyle, fontWeight: "bold", margin: 0, fontSize: "12px" }}>{intern.role}</h3>
                      <span style={{ ...baseTextStyle, fontSize: "12px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {formatDate(intern.startDate)} — {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                      </span>
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "12px", marginBottom: "4px" }}>
                      {intern.company}{intern.location ? `, ${intern.location}` : ""}
                    </div>
                  </>
                ) : layoutVariant === "slate" ? (
                  <>
                    <h3 style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "12px", margin: "0 0 2px 0" }}>{intern.role}</h3>
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
                    <div style={{ fontWeight: "bold", fontSize: "12px", color: style.headingColor, marginBottom: "2px" }}>{intern.role}</div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "2px" }}>
                      {intern.company}{intern.location ? ` | ${intern.location}` : ""}
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "10px", marginBottom: "4px" }}>
                      {formatDate(intern.startDate)} - {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                    </div>
                  </>
                ) : layoutVariant !== "centered" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <h3 style={{ ...baseTextStyle, fontWeight: "bold", margin: 0, fontSize: "12px" }}>{intern.role}</h3>
                      <span style={{ ...baseTextStyle, fontSize: "12px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                      </span>
                    </div>
                    <div style={{ ...baseTextStyle, fontSize: "12px", marginBottom: "4px" }}>
                      {intern.company}{intern.location ? ` • ${intern.location}` : ""}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: "4px" }} className="flex items-center gap-2">
                      <h3 style={{ ...headingStyle, margin: 0, textTransform: "capitalize", fontSize: "12px" }}>{intern.company}</h3>
                      {intern.location && <span className="text-[12px]"> | {intern.location}</span>}
                    </div>
                    <p style={{ ...baseTextStyle, fontWeight: "bold", margin: "4px 0", fontSize: "12px" }} className="flex items-center gap-2">
                      {intern.role}
                      <span style={{ ...baseTextStyle, fontSize: "12px", fontWeight: "500" }}>
                        | {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                      </span>
                    </p>
                  </>
                )}
                {intern.description && (
                  <div style={{ paddingLeft: "20px", marginTop: "4px" }}>
                    {extractTextFromHTML(intern.description).split(/\n|(?<=[.!?])\s+(?=[A-Z])/).filter(line => line.trim()).map((line, lineIdx) => (
                      <div key={lineIdx} style={{ ...baseTextStyle, margin: "4px 0", fontSize: "12px" }}>
                        • {line.trim()}
                      </div>
                    ))}
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
                <h3 style={{ ...headingStyle, margin: 0, textTransform: "capitalize" }}>
                  {proj.title}
                </h3>
                {proj.technologies.length > 0 && (
                  <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px" }}>
                    <span style={{ fontWeight: "600", fontStyle: "italic" }}>Technologies:</span> <span className="italic">{proj.technologies.join(", ")}</span>
                  </p>
                )}
                {proj.description && (
                  <div style={{ paddingLeft: "20px", marginTop: "4px", marginBottom: "4px", fontSize: "12px" }}>
                    {extractTextFromHTML(proj.description).split(/\n|(?<=[.!?])\s+(?=[A-Z])/).filter(line => line.trim()).map((line, lineIdx) => (
                      <div key={lineIdx} style={{ ...baseTextStyle, margin: "4px 0", fontSize: "12px" }}>
                        • {line.trim()}
                      </div>
                    ))}
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
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", fontSize:"11px", ...baseTextStyle }}>
                  <span style={{ marginRight: "6px" }}>•</span>
                  <span>
                    <span style={{ fontWeight: "600", fontSize: "11px" }}>{lang.language} </span> <span style={{ fontSize: "11px" }}> - {lang.proficiency}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
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
                  <span style={{ fontWeight: "600", fontSize: "12px" }}>{award.title}</span>
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
                  <h3 style={{ ...titleStyle, margin: 0, fontWeight: "600", fontSize: "12px" }}>{achievement.title}</h3>
                  {achievement.date && (
                    <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                      {formatDate(achievement.date)}
                    </span>
                  )}
                </div>
                {achievement.description && (
                  <div style={{ paddingLeft: "20px", marginTop: "4px" }}>
                    {extractTextFromHTML(achievement.description).split(/\n|(?<=[.!?])\s+(?=[A-Z])/).filter(line => line.trim()).map((line, lineIdx) => (
                      <div key={lineIdx} style={{ ...baseTextStyle, margin: "4px 0", fontSize: "12px" }}>
                        • {line.trim()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case "Publications":
        return publications && publications.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            {renderSectionHeading(getSectionTitle("Publications"))}
            <div style={sectionBorderStyle("12px")} />
            {publications.map((pub, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <h3 style={{ ...titleStyle, margin: "0 0 4px 0", fontWeight: "600", fontSize: "12px", display: "flex", alignItems: "center" }}>
                  <span>{pub.title}</span>
                  {pub.url && (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={pub.url}
                      style={{ marginLeft: "6px", color: style.headingColor, display: "flex", alignItems: "center", opacity: 0.7 }}
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </h3>
                <p style={{ ...baseTextStyle, fontSize: "12px", margin: "4px 0" }}>
                  {pub.authors}
                </p>
                <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0" }}>
                  <span style={{ fontStyle: "italic" }}>{pub.publicationName}</span> | {formatDate(pub.date)}
                </p>
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
                  <h3 style={{ ...titleStyle, fontSize: "12px", fontWeight: "600", margin: "0 0 4px 0" }}>{hobby.name}</h3>
                  {hobby.proficiencyLevel && (
                    <span style={{ ...baseTextStyle, fontSize: "11px" }}> - ({hobby.proficiencyLevel})</span>
                  )}
                </div>
                {hobby.description && (
                  <div style={{ paddingLeft: "20px" }}>
                    {extractTextFromHTML(hobby.description).split(/\n|(?<=[.!?])\s+(?=[A-Z])/).filter(line => line.trim()).map((line, lineIdx) => (
                      <div key={lineIdx} style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px" }}>
                        • {line.trim()}
                      </div>
                    ))}
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {interests.map((interest, idx) => (
                <div key={idx} style={{ ...baseTextStyle }}>
                  <div className="flex gap-2">
                    <div style={{ ...titleStyle, fontWeight: "600", fontSize: "12px" }}>{interest.name}</div>
                    {interest.category && (
                      <div style={{ fontSize: "11px" }}> - ({interest.category})</div>
                    )}
                  </div>
                  {interest.description && (
                    <div style={{ marginTop: "4px", paddingLeft: "20px" }}>
                      {extractTextFromHTML(interest.description).split(/\n|(?<=[.!?])\s+(?=[A-Z])/).filter(line => line.trim()).map((line, lineIdx) => (
                        <div key={lineIdx} style={{ ...baseTextStyle, margin: "2px 0", fontSize: "11px" }}>
                          • {line.trim()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
                    <h3 style={{ ...titleStyle, margin: 0, fontSize: "13px", fontWeight: "600" }}>{vol.role}</h3>
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
                <h3 style={{ ...titleStyle, margin: 0, fontSize: "13px", fontWeight: "600" }}>{ref.name}</h3>
                <p style={{ ...baseTextStyle, fontSize: "12px", margin: "4px 0 2px 0" }}>{ref.relation}</p>
                <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0" }}>{ref.contact}</p>
              </div>
            ))}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const displayName = domainFamily === "healthcare" && personalInfo.titlePrefix
    ? `${personalInfo.titlePrefix} ${personalInfo.fullname}${personalInfo.qualifications ? `, ${personalInfo.qualifications}` : ""}`
    : personalInfo.fullname || "Full Name";

  const sectionBorderStyle = (mb: string): React.CSSProperties =>
    layoutVariant === "centered" || layoutVariant === "slate"
      ? { borderBottom: `1px solid ${style.headingColor}`, paddingTop: "8px", marginBottom: mb }
      : { marginBottom: mb };

  const renderSectionHeading = (title: string) => {
    if (layoutVariant === "classic-formal") {
      return (
        <h2 style={{ color: accent, fontSize: style.headingFontSize, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center", backgroundColor: style.sectionHeaderBg || "#f0f0f0", paddingTop: "6px", paddingBottom: "6px", paddingLeft: "8px", paddingRight: "8px", marginTop: 0, marginRight: 0, marginBottom: "10px", marginLeft: 0, lineHeight: 1.2, display: "block" }}>
          {title}
        </h2>
      );
    }
    if (layoutVariant === "executive") {
      return (
        <h2 style={{
          color: accent,
          fontSize: style.headingFontSize,
          fontWeight: "bold",
          marginBottom: "6px",
        }}>
          {title.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
        </h2>
      );
    }
    if (layoutVariant === "slate") {
      return (
        <div style={{ color: accent, fontSize: style.headingFontSize, fontWeight: "bold", margin: 0 }}>
          {title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()}
        </div>
      );
    }
    if (layoutVariant === "centered") {
      return <h2 style={{ ...sectionHeadingStyle, marginBottom: 0 }}>{title}</h2>;
    }
    if (layoutVariant === "aether") {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
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

  const renderHeader = () => {
    if (layoutVariant === "ember") {
      return (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "bold", color: accent, margin: "0 0 6px 0" }}>
              {displayName}
            </h1>
            {personalInfo.email && (
              <p style={{ ...baseTextStyle, color: style.headingColor, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.email}
              </p>
            )}
            {personalInfo.phone && (
              <p style={{ ...baseTextStyle, color: style.headingColor, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.countryCode}{personalInfo.phone}
              </p>
            )}
            {personalInfo.location && (
              <p style={{ ...baseTextStyle, color: style.headingColor, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.location}
              </p>
            )}
            {personalInfo.linkedinUrl && (
              <p style={{ ...baseTextStyle, color: style.headingColor, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}
              </p>
            )}
            {personalInfo.portfolioUrl && (
              <p style={{ ...baseTextStyle, color: style.headingColor, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')}
              </p>
            )}
            {personalInfo.githubUrl && (
              <p style={{ ...baseTextStyle, color: style.headingColor, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, '')}
              </p>
            )}
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #d1d5db", margin: "10px 0 16px 0" }} />
        </div>
      );
    }
    if (layoutVariant === "classic-formal") {
      return (
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          <h1 style={{ ...nameStyle, textAlign: "center" }}>{displayName}</h1>
          {professionalSummary?.targetRole && (
            <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0" }}>
              {professionalSummary.targetRole}
            </p>
          )}
          {personalInfo.location && (
            <p style={{ ...baseTextStyle, fontSize: "11px", margin: "2px 0" }}>
              {personalInfo.location}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", margin: "6px 0" }}>
            {personalInfo.email && (
              <span style={{ ...baseTextStyle, fontSize: "11px", fontWeight: "600" }}>{personalInfo.email}</span>
            )}
            {personalInfo.phone && (
              <span style={{ ...baseTextStyle, fontSize: "11px" }}>{personalInfo.countryCode}{personalInfo.phone}</span>
            )}
            {personalInfo.linkedinUrl && (
              <span style={{ ...baseTextStyle, fontSize: "11px" }}>{personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
            )}
            {personalInfo.portfolioUrl && (
              <span style={{ ...baseTextStyle, fontSize: "11px" }}>{personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
            )}
            {personalInfo.githubUrl && (
              <span style={{ ...baseTextStyle, fontSize: "11px" }}>{personalInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
            )}
          </div>
          <hr style={{ border: "none", borderTop: `1px solid ${style.bodyColor}`, margin: "8px 0 16px 0" }} />
        </div>
      );
    }

    if (layoutVariant === "executive") {
      const contactParts = [];
      if (personalInfo.location) contactParts.push(personalInfo.location);
      if (personalInfo.phone) contactParts.push(`${personalInfo.countryCode}${personalInfo.phone}`);
      if (personalInfo.email) contactParts.push(personalInfo.email);
      if (personalInfo.linkedinUrl) contactParts.push(personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''));
      if (personalInfo.portfolioUrl) contactParts.push(personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, ''));
      if (personalInfo.githubUrl) contactParts.push(personalInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, ''));
      return (
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          <h1 style={{ ...nameStyle, textAlign: "center", fontSize: "26px", marginBottom: "4px", textTransform: "none" }}>{displayName}</h1>
          {professionalSummary?.targetRole && (
            <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 6px 0" }}>
              {professionalSummary.targetRole}
            </p>
          )}
          <hr style={{ border: "none", borderTop: `3px solid ${style.headingColor}`, margin: "6px 0" }} />
          <p style={{ ...baseTextStyle, fontSize: "10px", margin: "6px 0 16px 0" }}>
            {contactParts.join(" • ")}
          </p>
        </div>
      );
    }

    if (layoutVariant === "classic") {
      return (
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          {professionalSummary?.targetRole && (
            <p style={{ ...baseTextStyle, fontSize: "11px", margin: "0 0 4px 0" }}>
              {professionalSummary.targetRole}
            </p>
          )}
          <h1 style={{ ...nameStyle, textAlign: "center", fontSize: "26px", marginBottom: "6px" }}>{displayName}</h1>
          {personalInfo.location && (
            <p style={{ ...baseTextStyle, fontSize: "11px", margin: "2px 0" }}>
              {personalInfo.location}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", margin: "4px 0", ...baseTextStyle, fontSize: "11px" }}>
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.countryCode}{personalInfo.phone}</span>}
            {personalInfo.linkedinUrl && <span>{personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>}
            {personalInfo.portfolioUrl && <span>{personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>}
            {personalInfo.githubUrl && <span>{personalInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>}
          </div>
          <hr style={{ border: "none", borderTop: `1px solid #d1d5db`, margin: "10px 0 16px 0" }} />
        </div>
      );
    }

    if (layoutVariant === "aether") {
      const contactParts: string[] = [];
      const urlParts: string[] = [];
      if (personalInfo.email) contactParts.push(personalInfo.email);
      if (personalInfo.phone) contactParts.push(`${personalInfo.countryCode}${personalInfo.phone}`);
      if (personalInfo.location) contactParts.push(personalInfo.location);
      if (personalInfo.linkedinUrl) urlParts.push(personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''));
      if (personalInfo.portfolioUrl) urlParts.push(personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, ''));
      if (personalInfo.githubUrl) urlParts.push(personalInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, ''));
      return (
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "bold", color: accent, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
            {displayName}
          </h1>
          {contactParts.length > 0 && (
            <p style={{ ...baseTextStyle, fontSize: "10px", margin: "0 0 2px 0" }}>
              {contactParts.join(" | ")}
            </p>
          )}
          {urlParts.length > 0 && (
            <p style={{ ...baseTextStyle, fontSize: "10px", margin: "0 0 12px 0" }}>
              {urlParts.join(" | ")}
            </p>
          )}
        </div>
      );
    }
    if (layoutVariant === "pillar") {
      return (
        <div>
          <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: "12px", marginBottom: "10px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "bold", color: accent, margin: "0 0 6px 0" }}>
              {displayName}
            </h1>
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
                {personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}
              </p>
            )}
            {personalInfo.portfolioUrl && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')}
              </p>
            )}
            {personalInfo.githubUrl && (
              <p style={{ ...baseTextStyle, fontSize: "10px", margin: "1px 0" }}>
                {personalInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, '')}
              </p>
            )}
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #d1d5db", margin: "0 0 16px 0" }} />
        </div>
      );
    }

    if (layoutVariant === "slate") {
      return (
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ ...nameStyle, textAlign: "left", fontSize: "24px", marginBottom: "2px", textTransform: "none" }}>{displayName}</h1>
          {professionalSummary?.targetRole && (
            <p style={{ ...baseTextStyle, fontWeight: "bold", fontSize: "12px", margin: "0 0 4px 0" }}>
              {professionalSummary.targetRole}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", ...baseTextStyle, fontSize: "11px", marginBottom: "2px" }}>
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.email && <span>{personalInfo.email}</span>}
          </div>
          {(personalInfo.phone || personalInfo.linkedinUrl || personalInfo.portfolioUrl || personalInfo.githubUrl) && (
            <div style={{ display: "flex", gap: "16px", ...baseTextStyle, fontSize: "11px" }}>
              {personalInfo.phone && <span>{personalInfo.countryCode}{personalInfo.phone}</span>}
              {personalInfo.linkedinUrl && <span>{personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>}
              {personalInfo.portfolioUrl && <span>{personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>}
              {personalInfo.githubUrl && <span>{personalInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>}
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
              <h1 className="text-4xl font-bold uppercase" style={{ ...nameStyle, textAlign: "left" }}>
                {displayName}
              </h1>
              {professionalSummary?.targetRole && (
                <p style={{ ...baseTextStyle, fontSize: "12px", margin: 0, fontWeight: "500" }}>
                  {professionalSummary.targetRole}
                </p>
              )}
            </div>
            <div style={{ textAlign: "right", ...baseTextStyle, fontSize: "10px" }}>
              {personalInfo.email && <div>{personalInfo.email}</div>}
              {personalInfo.phone && <div>{personalInfo.countryCode}{personalInfo.phone}</div>}
              {personalInfo.location && <div>{personalInfo.location}</div>}
              {personalInfo.linkedinUrl && <div>{personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}</div>}
              {personalInfo.portfolioUrl && <div>{personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')}</div>}
              {personalInfo.githubUrl && <div>{personalInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, '')}</div>}
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
            <h1 className="text-4xl font-bold uppercase" style={{ ...nameStyle, textAlign: "left" }}>
              {displayName}
            </h1>
            {professionalSummary?.targetRole && (
              <p style={{ ...baseTextStyle, fontSize: "12px", margin: "2px 0 6px", fontWeight: "500" }}>
                {professionalSummary.targetRole}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", ...baseTextStyle, fontSize: "10px" }}>
              <div>
                {personalInfo.email && <div>{personalInfo.email}</div>}
                {personalInfo.location && <div>{personalInfo.location}</div>}
                {personalInfo.portfolioUrl && <div>{personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')}</div>}
              </div>
              <div>
                {personalInfo.phone && <div>{personalInfo.countryCode}{personalInfo.phone}</div>}
                {personalInfo.linkedinUrl && <div>{personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}</div>}
                {personalInfo.githubUrl && <div>{personalInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, '')}</div>}
              </div>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: `2px solid ${style.headingColor}`, margin: "0 0 16px 0" }} />
        </div>
      );
    }

    // Default: centered
    return (
      <div style={{ marginBottom: "16px" }}>
        <h1 className="text-4xl font-bold uppercase" style={nameStyle}>
          {displayName}
        </h1>
        {professionalSummary?.targetRole && (
          <p style={{ ...baseTextStyle, fontSize: "12px", margin: 0, textAlign: "center", fontWeight: "500", marginBottom: "8px" }}>
            {professionalSummary.targetRole}
          </p>
        )}
        <p style={{ ...baseTextStyle, fontSize: "10px", margin: 0, textAlign: "center" }}>
          {getContactInfo()}
        </p>
      </div>
    );
  };

  return (
    <div style={{ ...baseTextStyle, padding: "32px", maxWidth: "900px", minHeight: "100vh", width: "100%" }}>
      {/* Header */}
      {renderHeader()}

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
                        {extractTextFromHTML(field.value?.toString() || '').split(/\n|(?<=[.!?])\s+(?=[A-Z])/).filter(line => line.trim()).map((line, lineIdx) => (
                          <div key={lineIdx} style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px" }}>
                            • {line.trim()}
                          </div>
                        ))}
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

export default Template2;
