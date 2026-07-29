"use client";
import React from "react";
import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
import { useResume } from "../../_context/ResumeContext";
import AutoPaginator from "./AutoPaginator";
import { ExternalLink } from "lucide-react";

// TemplateFive — classic_professional
// Backend config: Times-Roman, 18pt name, 12pt section heading, 11pt body, 1.6 line-height
// Header style: left_header_block | Skills style: labeled_groups | Bullets: dash

interface Props {
  data: ResumeData;
  style: ResumeStyle;
  onPageCountChange?: (count: number) => void;
}

const TemplateFive: React.FC<Props> = ({ data, onPageCountChange }) => {
  const { resumeStyle, sectionOrder } = useResume();

  const {
    personalInfo,
    professionalSummary,
    education,
    workExperience,
    projects,
    skills,
    certifications,
    achievements,
    volunteering,
    references,
    internships,
    awards,
    hobbies,
    interests,
    languages,
    publications,
    customSections,
  } = data;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    if (/^[A-Za-z]{3}\s\d{2}$/.test(dateString)) return dateString;
    if (/^\d{4}-\d{2}$/.test(dateString)) {
      const [year, month] = dateString.split("-");
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${monthNames[parseInt(month, 10) - 1]} ${year.slice(-2)}`;
    }
    return dateString;
  };

  const baseTextStyle: React.CSSProperties = {
    fontFamily: resumeStyle.fontFamily,
    fontSize: resumeStyle.bodyFontSize,
    lineHeight: resumeStyle.lineSpacing,
    fontWeight: resumeStyle.bold ? "bold" : "normal",
    fontStyle: resumeStyle.italic ? "italic" : "normal",
    color: resumeStyle.bodyColor,
  };

  // Section headings: uppercase, full-width bottom border
  const headingStyle: React.CSSProperties = {
    fontFamily: resumeStyle.fontFamily,
    color: resumeStyle.headingColor,
    fontSize: resumeStyle.headingFontSize,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    borderBottom: `2px solid ${resumeStyle.headingColor}`,
    paddingBottom: "3px",
    marginBottom: "6px",
  };

  // Name: large, left-aligned block
  const nameStyle: React.CSSProperties = {
    fontFamily: resumeStyle.fontFamily,
    fontSize: resumeStyle.nameFontSize,
    fontWeight: "700",
    color: resumeStyle.headingColor,
    letterSpacing: "1px",
    textTransform: "uppercase",
  };

  const linkStyle: React.CSSProperties = {
    color: resumeStyle.bodyColor,
    textDecoration: "none",
  };

  const linkIconStyle: React.CSSProperties = {
    display: "inline-block",
    marginLeft: "6px",
    verticalAlign: "middle",
    color: resumeStyle.headingColor,
  };

  const titleStyle: React.CSSProperties = {
    ...baseTextStyle,
    color: resumeStyle.headingColor,
    fontWeight: "bold",
  };

  const descriptionStyle: React.CSSProperties = { ...baseTextStyle };

  const renderSection = (section: string) => {
    switch (section) {
      case "Personal Info":
        return (
          <header className="mb-5 page-break-inside-avoid" data-section="personal-info">
            {/* Left-aligned name block (left_header_block) */}
            <h1 style={nameStyle} className="mb-1">
              {personalInfo.fullname || "FULL NAME"}
            </h1>
            {/* Single-line contact row separated by " | " */}
            <div style={{ ...baseTextStyle, fontSize: "9px" }} className="flex flex-wrap gap-x-3">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && (
                <span>{personalInfo.countryCode}{personalInfo.phone}</span>
              )}
              {personalInfo.location && <span>{personalInfo.location}</span>}
              {personalInfo.linkedinUrl && (
                <a href={personalInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" style={linkStyle} className="hover:underline">
                  {personalInfo.linkedinUrl.replace(/https?:\/\//,"").replace(/\/$/,"")}
                </a>
              )}
              {personalInfo.githubUrl && (
                <a href={personalInfo.githubUrl} target="_blank" rel="noopener noreferrer" style={linkStyle} className="hover:underline">
                  {personalInfo.githubUrl.replace(/https?:\/\//,"").replace(/\/$/,"")}
                </a>
              )}
              {personalInfo.portfolioUrl && (
                <a href={personalInfo.portfolioUrl} target="_blank" rel="noopener noreferrer" style={linkStyle} className="hover:underline">
                  {personalInfo.portfolioUrl.replace(/https?:\/\//,"").replace(/\/$/,"")}
                </a>
              )}
            </div>
            <hr style={{ borderColor: resumeStyle.headingColor, borderTopWidth: "2px", marginTop: "6px" }} />
          </header>
        );

      case "Professional Summary":
        return (
          professionalSummary?.summary && (
            <section className="mb-5 page-break-inside-avoid" data-section="summary">
              <h2 style={headingStyle}>SUMMARY</h2>
              <div
                className="resume-description"
                style={baseTextStyle}
                dangerouslySetInnerHTML={{ __html: professionalSummary.summary }}
              />
            </section>
          )
        );

      case "Skills":
        return (
          skills.length > 0 && (
            <section className="mb-5 page-break-inside-avoid" data-section="skills">
              <h2 style={headingStyle}>SKILLS</h2>
              {/* labeled_groups: "Category: skill1, skill2" per line */}
              {data.categorizedSkills ? (
                <div className="space-y-1">
                  {(["programming_languages","frameworks","databases","tools","cloud_platforms","soft_skills"] as const).map((key) => {
                    const categorySkills = data.categorizedSkills![key];
                    if (!categorySkills || categorySkills.length === 0) return null;
                    const label = key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                    return (
                      <div key={key} style={baseTextStyle}>
                        <span className="font-semibold" style={titleStyle}>{label}: </span>
                        <span>{categorySkills.join(", ")}</span>
                      </div>
                    );
                  })}
                  {(data.categorizedSkills.custom_categories || []).map((custom) => {
                    if (!custom.skills || custom.skills.length === 0) return null;
                    return (
                      <div key={custom.id} style={baseTextStyle}>
                        <span className="font-semibold" style={titleStyle}>{custom.name || "Other"}: </span>
                        <span>{custom.skills.join(", ")}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={baseTextStyle}>
                  {skills.map((skill, idx) => (
                    <span key={idx}>{skill}{idx < skills.length - 1 ? ", " : ""}</span>
                  ))}
                </div>
              )}
            </section>
          )
        );

      case "Work Experience":
        return (
          workExperience.length > 0 && (
            <section className="mb-5" data-section="work-experience">
              <h2 style={headingStyle} className="page-break-after-avoid">EXPERIENCE</h2>
              {workExperience.map((exp, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-bold" style={titleStyle}>{exp.role}</span>
                    <span className="whitespace-nowrap ml-4" style={{ ...baseTextStyle, fontSize: "9px" }}>
                      {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <div className="font-semibold mb-1" style={baseTextStyle}>{exp.company}</div>
                  {exp.description && (
                    <div className="resume-description" style={descriptionStyle} dangerouslySetInnerHTML={{ __html: exp.description }} />
                  )}
                </div>
              ))}
            </section>
          )
        );

      case "Education":
        return (
          education.length > 0 && (
            <section className="mb-5" data-section="education">
              <h2 style={headingStyle} className="page-break-after-avoid">EDUCATION</h2>
              {education.map((edu, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <div className="flex-1">
                      <div className="font-bold" style={titleStyle}>{edu.degree}</div>
                      <div style={baseTextStyle}>{edu.school}</div>
                      {edu.scoreType && edu.scoreValue && (
                        <div style={{ ...baseTextStyle, fontSize: "9px" }}>
                          {edu.scoreType}: {edu.scoreValue}{edu.scoreType === "Percentage" ? "%" : ""}
                        </div>
                      )}
                    </div>
                    <div className="whitespace-nowrap ml-4" style={{ ...baseTextStyle, fontSize: "9px" }}>
                      {edu.startDate ? `${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}` : formatDate(edu.endDate)}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )
        );

      case "Projects":
        return (
          projects.length > 0 && (
            <section className="mb-5" data-section="projects">
              <h2 style={headingStyle} className="page-break-after-avoid">PROJECTS</h2>
              {projects.map((proj, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="font-bold flex items-center" style={titleStyle}>
                      <span>{proj.title}</span>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noopener noreferrer" style={linkIconStyle} className="hover:opacity-70">
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                    {(proj.startDate || proj.endDate) && (
                      <span className="whitespace-nowrap ml-4" style={{ ...baseTextStyle, fontSize: "9px" }}>
                        {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <div className="resume-description" style={descriptionStyle} dangerouslySetInnerHTML={{ __html: proj.description }} />
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div style={baseTextStyle}>
                      <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )
        );

      case "Internships":
        return (
          internships.length > 0 && (
            <section className="mb-5" data-section="internships">
              <h2 style={headingStyle} className="page-break-after-avoid">INTERNSHIPS</h2>
              {internships.map((intern, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-bold" style={titleStyle}>{intern.role}</span>
                    <span className="whitespace-nowrap ml-4" style={{ ...baseTextStyle, fontSize: "9px" }}>
                      {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                    </span>
                  </div>
                  <div className="font-semibold mb-1" style={baseTextStyle}>{intern.company}</div>
                  {intern.description && (
                    <div className="resume-description" style={descriptionStyle} dangerouslySetInnerHTML={{ __html: intern.description }} />
                  )}
                </div>
              ))}
            </section>
          )
        );

      case "Certifications":
        return (
          certifications.length > 0 && (
            <section className="mb-5" data-section="certifications">
              <h2 style={headingStyle}>CERTIFICATIONS</h2>
              {certifications.map((cert, idx) => (
                <div key={idx} className="mb-2 flex items-start">
                  <span className="mr-2" style={baseTextStyle}>–</span>
                  <div style={baseTextStyle}>
                    <span className="font-semibold" style={titleStyle}>{cert.name}</span>
                    {cert.issuer && <span> — {cert.issuer}</span>}
                    {cert.issueDate && <span> ({cert.issueDate})</span>}
                  </div>
                </div>
              ))}
            </section>
          )
        );

      case "Achievements":
        return (
          achievements.length > 0 && (
            <section className="mb-5" data-section="achievements">
              <h2 style={headingStyle} className="page-break-after-avoid">ACHIEVEMENTS</h2>
              {achievements.map((achievement, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold" style={titleStyle}>{achievement.title}</span>
                    {achievement.date && (
                      <span className="whitespace-nowrap ml-4" style={{ ...baseTextStyle, fontSize: "9px" }}>
                        {formatDate(achievement.date)}
                      </span>
                    )}
                  </div>
                  {achievement.description && (
                    <div className="resume-description" style={baseTextStyle} dangerouslySetInnerHTML={{ __html: achievement.description }} />
                  )}
                </div>
              ))}
            </section>
          )
        );

      case "Awards":
        return (
          awards.length > 0 && (
            <section className="mb-5" data-section="awards">
              <h2 style={headingStyle} className="page-break-after-avoid">AWARDS</h2>
              {awards.map((award, idx) => (
                <div key={idx} className="mb-2 flex items-start" style={baseTextStyle}>
                  <span className="mr-2">–</span>
                  <div>
                    <span className="font-semibold" style={titleStyle}>{award.title}</span>
                    {award.issuedBy && <span> — {award.issuedBy}</span>}
                    {award.year && <span> ({award.year})</span>}
                  </div>
                </div>
              ))}
            </section>
          )
        );

      case "Volunteering":
        return (
          volunteering.length > 0 && (
            <section className="mb-5" data-section="volunteering">
              <h2 style={headingStyle} className="page-break-after-avoid">VOLUNTEERING</h2>
              {volunteering.map((vol, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <div className="font-bold" style={titleStyle}>{vol.role}</div>
                      <div style={baseTextStyle}>{vol.organization}</div>
                    </div>
                    <div className="whitespace-nowrap ml-4" style={{ ...baseTextStyle, fontSize: "9px" }}>
                      {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )
        );

      case "Languages":
        return (
          languages.length > 0 && (
            <section className="mb-5 page-break-inside-avoid" data-section="languages">
              <h2 style={headingStyle}>LANGUAGES</h2>
              <div style={baseTextStyle}>
                {languages.map((lang, idx) => (
                  <span key={idx}>
                    <span className="font-semibold" style={titleStyle}>{lang.language}</span>
                    {lang.proficiency && <span> ({lang.proficiency})</span>}
                    {idx < languages.length - 1 ? " | " : ""}
                  </span>
                ))}
              </div>
            </section>
          )
        );

      case "Hobbies":
        return (
          hobbies.length > 0 && (
            <section className="mb-5 page-break-inside-avoid" data-section="hobbies">
              <h2 style={headingStyle}>HOBBIES</h2>
              {hobbies.map((hobby, idx) => (
                <div key={idx} className="mb-1">
                  <span className="font-semibold" style={titleStyle}>{hobby.name}</span>
                  {hobby.description && (
                    <span className="resume-description" style={baseTextStyle} dangerouslySetInnerHTML={{ __html: ` — ${hobby.description}` }} />
                  )}
                </div>
              ))}
            </section>
          )
        );

      case "Interests":
        return (
          interests.length > 0 && (
            <section className="mb-5 page-break-inside-avoid" data-section="interests">
              <h2 style={headingStyle}>INTERESTS</h2>
              {interests.map((interest, idx) => (
                <div key={idx} className="mb-1">
                  <span className="font-semibold" style={titleStyle}>{interest.name}</span>
                  {interest.category && <span style={baseTextStyle}> ({interest.category})</span>}
                  {interest.description && (
                    <span className="resume-description" style={baseTextStyle} dangerouslySetInnerHTML={{ __html: ` — ${interest.description}` }} />
                  )}
                </div>
              ))}
            </section>
          )
        );

      case "Publications":
        return (
          publications.length > 0 && (
            <section className="mb-5" data-section="publications">
              <h2 style={headingStyle} className="page-break-after-avoid">PUBLICATIONS</h2>
              {publications.map((pub, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="font-semibold flex items-center" style={titleStyle}>
                    <span>{pub.title}</span>
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noopener noreferrer" style={linkIconStyle} className="hover:opacity-70">
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                  <div style={baseTextStyle}>{pub.authors}</div>
                  <div style={baseTextStyle}>
                    <span className="italic">{pub.publicationName}</span>
                    {pub.date && <> • {formatDate(pub.date)}</>}
                  </div>
                </div>
              ))}
            </section>
          )
        );

      case "References":
        return (
          references.length > 0 && (
            <section className="mb-5 page-break-inside-avoid" data-section="references">
              <h2 style={headingStyle} className="page-break-after-avoid">REFERENCES</h2>
              {references.map((ref, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="font-semibold" style={titleStyle}>{ref.name}</div>
                  {ref.relation && <div style={baseTextStyle}>{ref.relation}</div>}
                  {ref.contact && <div style={baseTextStyle}>{ref.contact}</div>}
                </div>
              ))}
            </section>
          )
        );

      default: {
        const customSection = customSections?.find(cs => cs.id === section || cs.sectionName === section);
        if (customSection && customSection.fields.length > 0) {
          return (
            <section className="mb-5">
              <h2 style={headingStyle}>{customSection.sectionName.toUpperCase()}</h2>
              <div className="space-y-2">
                {customSection.fields.map((field) => {
                  const hasValue = field.fieldType === "list"
                    ? (field.value as string[]).some(v => v.trim() !== "")
                    : field.value && field.value.toString().trim() !== "";
                  if (!hasValue) return null;
                  return (
                    <div key={field.id}>
                      {field.fieldType === "list" ? (
                        <ul className="list-disc pl-5" style={baseTextStyle}>
                          {(field.value as string[]).filter(v => v.trim() !== "").map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : field.fieldType === "url" ? (
                        <a href={field.value as string} target="_blank" rel="noopener noreferrer" style={linkStyle} className="hover:underline">
                          {field.value as string}
                        </a>
                      ) : field.fieldType === "textarea" ? (
                        <div className="resume-description" style={descriptionStyle} dangerouslySetInnerHTML={{ __html: field.value as string }} />
                      ) : (
                        <div style={baseTextStyle}>{field.value as string}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        return null;
      }
    }
  };

  return (
    <>
      <style jsx global>{`
        .resume-description b,
        .resume-description strong {
          font-weight: 700 !important;
          color: #1a1a1a !important;
        }
        .resume-description i,
        .resume-description em { font-style: italic !important; }
        .resume-description u { text-decoration: underline !important; }
        .resume-description ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
        }
        .resume-description ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
        }
        .resume-description li { margin-bottom: 0.25rem; }
      `}</style>

      <AutoPaginator onPageCountChange={onPageCountChange}>
        {sectionOrder.map((section, idx) => (
          <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
        ))}
      </AutoPaginator>
    </>
  );
};

export default TemplateFive;
