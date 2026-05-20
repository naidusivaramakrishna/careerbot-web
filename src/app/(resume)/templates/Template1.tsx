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
}

const Template1: React.FC<Props> = ({ data, style, careerLevel = "Mid-Level", domainFamily = "core_engineering", sectionOrder = [] }) => {
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
      return domainFamily === "education" ? "TEACHING EXPERIENCE" : "PROFESSIONAL EXPERIENCE";
    }
    if (section === "Publications") {
      if (domainFamily === "education") return "PUBLICATIONS AND RESEARCH";
      if (domainFamily === "cybersecurity") return "PUBLICATIONS AND CONFERENCES";
      return "PUBLICATIONS";
    }
    if (section === "Certifications") {
      return domainFamily === "cybersecurity" ? "CERTIFICATES AND CLEARANCES" : "CERTIFICATIONS";
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

  const headingStyle: React.CSSProperties = {
    color: style.headingColor,
    fontSize: style.headingFontSize,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.4rem",
  };

  const nameStyle: React.CSSProperties = {
    fontSize: style.nameFontSize,
    fontWeight: "bold",
    color: style.headingColor,
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
    return parts.join(" | ");
  };

  const extractTextFromHTML = (html: string): string => {
    // Replace closing block tags with a space to separate text
    const text = html
      .replace(/<\/div>/g, ' ')
      .replace(/<\/p>/g, ' ')
      .replace(/<\/li>/g, ' ')
      .replace(/<br\s*\/?>/g, ' ');

    // Create a div element and extract text
    const div = document.createElement('div');
    div.innerHTML = text;
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  };

  const renderSection = (sectionName: string) => {
    switch (sectionName) {
      case "Professional Summary":
        return professionalSummary?.summary ? (
          <div style={{ marginBottom: "16px" }}>
            <h2 style={headingStyle}>{getSectionTitle("Professional Summary")}</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "8px" }}></div>
            <div style={{ textAlign: "justify", fontSize: '12px' }}>
              <SafeHTML content={professionalSummary.summary} className="resume-description" />
            </div>
          </div>
        ) : null;

      case "Skills":
        return (data.categorizedSkills && Object.keys(data.categorizedSkills).some(key => {
          const skillArray = data.categorizedSkills![key as keyof typeof data.categorizedSkills];
          return skillArray && skillArray.length > 0;
        })) || (skills && skills.length > 0) ? (
          <div style={{ marginBottom: "16px" }}>
            <h2 style={headingStyle}>{getSectionTitle("Skills")}</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
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
                      const categoryLabel = category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                      return (
                        <div key={category} style={{ marginBottom: "6px" }}>
                          <span style={{ fontWeight: "600", fontSize: "10px" }}>{categoryLabel}:</span>
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
            <h2 style={headingStyle}>{getSectionTitle("Work Experience")}</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
            {workExperience.map((exp, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <h3 style={{ ...headingStyle, margin: 0, textTransform: "capitalize" }}>{exp.role}</h3>
                  <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                    {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                  </span>
                </div>
                <p style={{ ...baseTextStyle, fontWeight: "500", margin: "4px 0", fontSize: "12px", fontStyle: "italic" }}>
                  {exp.company}
                  {exp.location && <span> | {exp.location}</span>}
                </p>
                {exp.description && (
                  <div style={{ paddingLeft: "20px", marginTop: "4px" }}>
                    {extractTextFromHTML(exp.description).split(/\n|(?<=[.!?])\s+(?=[A-Z])/).filter(line => line.trim()).map((line, lineIdx) => (
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

      case "Education":
        return education.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            <h2 style={headingStyle}>EDUCATION</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
            {education.map((edu, idx) => (
              <div key={idx} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <h3 style={{ ...headingStyle, margin: 0, textTransform: "capitalize" }}>{edu.degree}</h3>
                  <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                    {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                  </span>
                </div>
                <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px", fontWeight: "500", fontStyle: "italic" }}>
                  {edu.school}
                </p>
                {edu.scoreValue && (
                  <p style={{ ...baseTextStyle, margin: "2px 0", fontSize: "12px" }}>
                    {edu.scoreType}: {edu.scoreValue}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case "Certifications":
        return certifications.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            <h2 style={headingStyle}>{getSectionTitle("Certifications")}</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
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
            <h2 style={headingStyle}>INTERNSHIPS</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
            {internships.map((intern, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <h3 style={{ ...headingStyle, margin: 0, textTransform: "capitalize" }}>{intern.role}</h3>
                  <span style={{ ...baseTextStyle, fontSize: "12px" }}>
                    {formatDate(intern.startDate)} – {formatDate(intern.endDate)}
                  </span>
                </div>
                <p style={{ ...baseTextStyle, fontWeight: "500", margin: "4px 0", fontSize: "12px", fontStyle: "italic" }}>
                  {intern.company}
                  {intern.location && <span> | {intern.location}</span>}
                </p>
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
            <h2 style={headingStyle}>{getSectionTitle("Projects")}</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
            {projects.map((proj, idx) => (
              <div key={idx} style={{ marginBottom: "4px" }}>
                <h3 style={{ ...headingStyle, margin: 0, textTransform: "capitalize" }}>{proj.title}</h3>
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
            <h2 style={headingStyle}>LANGUAGES</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", fontSize: "11px", ...baseTextStyle }}>
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
            <h2 style={headingStyle}>AWARDS</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
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
            <h2 style={headingStyle}>{getSectionTitle("Achievements")}</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
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
            <h2 style={headingStyle}>{getSectionTitle("Publications")}</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
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
            <h2 style={headingStyle}>HOBBIES</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
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
            <h2 style={headingStyle}>INTERESTS</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
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
            <h2 style={headingStyle}>VOLUNTEERING</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
            {volunteering.map((vol, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <h3 style={{ ...titleStyle, margin: 0, fontSize: "12px", fontWeight: "600" }}>{vol.role}</h3>
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
            <h2 style={headingStyle}>REFERENCES</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
            {references.map((ref, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <h3 style={{ ...titleStyle, margin: 0, fontSize: "12px", fontWeight: "600" }}>{ref.name}</h3>
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

  return (
    <div style={{ ...baseTextStyle, padding: "32px", maxWidth: "900px", minHeight: "100vh", width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <h1 className="text-4xl font-bold uppercase" style={nameStyle}>{personalInfo.fullname || "Full Name"}</h1>
        {professionalSummary?.targetRole && (
          <p style={{ ...baseTextStyle, fontSize: "12px", margin: 0, textAlign: "center", fontWeight: "500", marginBottom: "8px" }}>
            {professionalSummary.targetRole}
          </p>
        )}
        <p style={{ ...baseTextStyle, fontSize: "10px", margin: 0, textAlign: "center" }}>
          {getContactInfo()}
        </p>
      </div>

      {/* Render sections in order */}
      {sectionOrder && sectionOrder.length > 0
        ? sectionOrder.filter(s => s !== "Personal Info").map(section => (
          <div key={section}>{renderSection(section)}</div>
        ))
        : null
      }

      {/* Custom Sections */}
      {customSections && customSections.map((section, sectionIdx) => (
        section.fields && section.fields.some(f => f.value && (typeof f.value === 'string' ? f.value.trim() !== '' : Array.isArray(f.value) ? f.value.some(v => v?.trim?.() !== '') : false)) && (
          <div key={sectionIdx} style={{ marginBottom: "16px" }}>
            <h2 style={headingStyle}>{section.sectionName.toUpperCase()}</h2>
            <div style={{ borderBottom: `1px solid ${style.headingColor}`, marginBottom: "12px" }}></div>
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

export default Template1;
