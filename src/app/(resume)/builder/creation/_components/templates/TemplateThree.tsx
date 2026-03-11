"use client";
import React from "react";
import { ResumeData, ResumeStyle, useResume } from "../../_context/ResumeContext";
import AutoPaginator from "./AutoPaginator";
import { ExternalLink } from "lucide-react";

interface Props {
  data: ResumeData;
  style: ResumeStyle;
  onPageCountChange?: (count: number) => void;
}

const TemplateThree: React.FC<Props> = ({ data, onPageCountChange }) => {
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

    if (/^[A-Za-z]{3}\s\d{2}$/.test(dateString)) {
      return dateString;
    }

    if (/^\d{4}-\d{2}$/.test(dateString)) {
      const [year, month] = dateString.split("-");
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]} ${year.slice(-2)}`;
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

  const headingStyle: React.CSSProperties = {
    color: resumeStyle.headingColor,
    fontSize: resumeStyle.headingFontSize,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const nameStyle: React.CSSProperties = {
    fontSize: resumeStyle.nameFontSize,
    fontWeight: "bold",
    color: resumeStyle.headingColor,
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

  const descriptionStyle: React.CSSProperties = {
    ...baseTextStyle,
  };

  const headingContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    width: "100%",
    marginBottom: "0.75rem",
  };

  const headingLineStyle: React.CSSProperties = {
    flex: 1,
    borderTop: `1px solid #808080`,
    marginLeft: "1rem",
  };

  const renderSection = (section: string) => {
    switch (section) {
      case "Personal Info":
        return (
          <header className="mb-6 page-break-inside-avoid" data-section="personal-info">
            <div className="mb-2">
              <h1 className="uppercase font-bold" style={nameStyle}>
                {personalInfo.fullname || "FULL NAME"}
              </h1>
            </div>

            <div className="flex items-center text-sm mb-4 flex-wrap" style={baseTextStyle}>
              {personalInfo.email && (
                <>
                  <span>{personalInfo.email}</span>
                </>
              )}
              {personalInfo.phone && (
                <>
                  {personalInfo.email && <span className="mx-2">|</span>}
                  <span>{personalInfo.countryCode}{personalInfo.phone}</span>
                </>
              )}
              {personalInfo.location && (
                <>
                  {(personalInfo.email || personalInfo.phone) && <span className="mx-2">|</span>}
                  <span>{personalInfo.location}</span>
                </>
              )}
              {personalInfo.linkedinUrl && (
                <>
                  {(personalInfo.email || personalInfo.phone || personalInfo.location) && <span className="mx-2">|</span>}
                  {/* <span>in</span> */}
                  <a
                    href={personalInfo.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                    className="hover:underline ml-1"
                  >
                    {personalInfo.linkedinUrl.replace('https://', '').replace('http://', '')}
                  </a>
                </>
              )}
              {personalInfo.portfolioUrl && (
                <>
                  {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedinUrl) && <span className="mx-2">|</span>}
                  <a
                    href={personalInfo.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                    className="hover:underline"
                  >
                    {personalInfo.portfolioUrl.replace('https://', '').replace('http://', '')}
                  </a>
                </>
              )}
            </div>
          </header>
        );

      case "Professional Summary":
        return (
          professionalSummary?.summary && (
            <section className="mb-6 page-break-inside-avoid" data-section="summary">
              <div style={headingContainerStyle}>
                <h2 style={headingStyle}>SUMMARY</h2>
                <div style={headingLineStyle}></div>
              </div>
              {/* ✅ Changed to support HTML formatting */}
              <div
                className="text-justify resume-description"
                style={baseTextStyle}
                dangerouslySetInnerHTML={{ __html: professionalSummary.summary }}
              />
            </section>
          )
        );

      case "Work Experience":
        return (
          workExperience.length > 0 && (
            <section className="mb-6" data-section="work-experience">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>EXPERIENCE</h2>
                <div style={headingLineStyle}></div>
              </div>
              {workExperience.map((exp, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold" style={baseTextStyle}>
                      {exp.company}
                    </h3>
                    <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                      {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <div className="font-semibold mb-2" style={titleStyle}>
                    {exp.role}
                  </div>
                  {/* ✅ Changed to support HTML formatting */}
                  {exp.description && (
                    <div 
                      className="resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: exp.description }}
                    />
                  )}
                </div>
              ))}
            </section>
          )
        );

      case "Education":
        return (
          education.length > 0 && (
            <section className="mb-6" data-section="education">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>EDUCATION</h2>
                <div style={headingLineStyle}></div>
              </div>
              {education.map((edu, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <div className="flex-1">
                      <div className="font-bold" style={titleStyle}>
                        {edu.degree}
                      </div>
                      <div className="text-sm" style={baseTextStyle}>
                        {edu.school}
                      </div>
                      {edu.scoreType && edu.scoreValue && (
                        <div className="text-xs mt-1" style={baseTextStyle}>
                          {edu.scoreType}: {edu.scoreValue}{edu.scoreType === "Percentage" ? "%" : ""}
                        </div>
                      )}
                    </div>
                    <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                      {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
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
            <section className="mb-6" data-section="projects">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>PROJECTS</h2>
                <div style={headingLineStyle}></div>
              </div>
              {projects.map((proj, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="font-bold flex items-center" style={titleStyle}>
                      <span>{proj.title}</span>
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={linkIconStyle}
                          className="hover:opacity-70"
                          title={proj.link}
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    {(proj.startDate || proj.endDate) && (
                      <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                        {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                      </span>
                    )}
                  </div>
                  {/* ✅ Changed to support HTML formatting */}
                  {proj.description && (
                    <div 
                      className="mb-2 resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: proj.description }}
                    />
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="text-sm" style={baseTextStyle}>
                      <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )
        );

      case "Skills":
        return (
          skills.length > 0 && (
            <section className="mb-6 page-break-inside-avoid" data-section="skills">
              <div style={headingContainerStyle}>
                <h2 style={headingStyle}>SKILLS</h2>
                <div style={headingLineStyle}></div>
              </div>
              <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
                {skills.map((skill, idx) => (
                  <li key={idx}>{skill}</li>
                ))}
              </ul>
            </section>
          )
        );

      case "Internships":
        return (
          internships.length > 0 && (
            <section className="mb-6" data-section="internships">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>INTERNSHIPS</h2>
                <div style={headingLineStyle}></div>
              </div>
              {internships.map((intern, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold" style={baseTextStyle}>
                      {intern.company}
                    </h3>
                    <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                      {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                    </span>
                  </div>
                  <div className="font-semibold mb-2" style={titleStyle}>
                    {intern.role}
                  </div>
                  {/* ✅ Changed to support HTML formatting */}
                  {intern.description && (
                    <div 
                      className="resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: intern.description }}
                    />
                  )}
                </div>
              ))}
            </section>
          )
        );

      case "Certifications":
        return (
          certifications.length > 0 && (
            <section className="mb-6" data-section="certifications">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>CERTIFICATIONS</h2>
                <div style={headingLineStyle}></div>
              </div>
              {certifications.map((cert, idx) => (
                <div key={idx} className="mb-3 flex items-start">
                  <span className="mr-2" style={baseTextStyle}>•</span>
                  <div style={baseTextStyle}>
                    <div>
                      <span className="font-medium" style={titleStyle}>{cert.name}</span>
                      <span style={baseTextStyle}> - {cert.issuedBy}</span>
                    </div>
                    <div className="text-xs mt-1">
                      <span>Issued: {cert.year}</span>
                      {cert.expiryDate && (
                        <span className="ml-3">
                          Expires: {cert.expiryDate}
                        </span>
                      )}
                    </div>
                    {cert.credentialId && (
                      <div className="text-xs mt-1">
                        Credential ID: {cert.credentialId}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )
        );

      case "Achievements":
        return (
          achievements.length > 0 && (
            <section className="mb-6" data-section="achievements">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>ACHIEVEMENTS</h2>
                <div style={headingLineStyle}></div>
              </div>
              {achievements.map((achievement, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold" style={titleStyle}>
                      {achievement.title}
                    </span>
                    {achievement.date && (
                      <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                        {formatDate(achievement.date)}
                      </span>
                    )}
                  </div>
                  {/* ✅ Changed to support HTML formatting */}
                  {achievement.description && (
                    <div 
                      className="resume-description"
                      style={baseTextStyle}
                      dangerouslySetInnerHTML={{ __html: achievement.description }}
                    />
                  )}
                </div>
              ))}
            </section>
          )
        );

      case "Awards":
        return (
          awards.length > 0 && (
            <section className="mb-6" data-section="awards">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>AWARDS</h2>
                <div style={headingLineStyle}></div>
              </div>
              {awards.map((award, idx) => (
                <div key={idx} className="mb-2 flex items-start" style={baseTextStyle}>
                  <span className="mr-2">•</span>
                  <div>
                    <span className="font-semibold" style={titleStyle}>{award.title}</span>
                    <span style={baseTextStyle}>
                      {award.issuedBy && <> — {award.issuedBy}</>}
                      {award.year && <> ({award.year})</>}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          )
        );

      case "Volunteering":
        return (
          volunteering.length > 0 && (
            <section className="mb-6" data-section="volunteering">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>VOLUNTEERING</h2>
                <div style={headingLineStyle}></div>
              </div>
              {volunteering.map((vol, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <div className="font-bold" style={titleStyle}>
                        {vol.role}
                      </div>
                      <div className="text-sm" style={baseTextStyle}>
                        {vol.organization}
                      </div>
                    </div>
                    <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                      {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )
        );

      case "Hobbies":
        return (
          hobbies.length > 0 && (
            <section className="mb-6 page-break-inside-avoid" data-section="hobbies">
              <div style={headingContainerStyle}>
                <h2 style={headingStyle}>HOBBIES</h2>
                <div style={headingLineStyle}></div>
              </div>
              {hobbies.map((hobby, idx) => (
                <div key={idx} className="mb-2">
                  <span className="font-semibold" style={titleStyle}>{hobby.name}</span>
                  {/* ✅ Changed to support HTML formatting */}
                  {hobby.description && (
                    <span 
                      className="resume-description"
                      style={baseTextStyle}
                      dangerouslySetInnerHTML={{ __html: ` — ${hobby.description}` }}
                    />
                  )}
                  {hobby.proficiencyLevel && <span className="text-sm" style={baseTextStyle}> ({hobby.proficiencyLevel})</span>}
                </div>
              ))}
            </section>
          )
        );

      case "Interests":
        return (
          interests.length > 0 && (
            <section className="mb-6 page-break-inside-avoid" data-section="interests">
              <div style={headingContainerStyle}>
                <h2 style={headingStyle}>INTERESTS</h2>
                <div style={headingLineStyle}></div>
              </div>
              {interests.map((interest, idx) => (
                <div key={idx} className="mb-2">
                  <span className="font-semibold" style={titleStyle}>{interest.name}</span>
                  {interest.category && <span className="text-sm" style={baseTextStyle}> ({interest.category})</span>}
                  {/* ✅ Changed to support HTML formatting */}
                  {interest.description && (
                    <span 
                      className="resume-description"
                      style={baseTextStyle}
                      dangerouslySetInnerHTML={{ __html: ` — ${interest.description}` }}
                    />
                  )}
                </div>
              ))}
            </section>
          )
        );

      case "Languages":
        return (
          languages.length > 0 && (
            <section className="mb-6 page-break-inside-avoid" data-section="languages">
              <div style={headingContainerStyle}>
                <h2 style={headingStyle}>LANGUAGES</h2>
                <div style={headingLineStyle}></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang, idx) => (
                  <div key={idx} className="flex items-start" style={baseTextStyle}>
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-semibold" style={titleStyle}>{lang.language}</span>
                      {lang.proficiency && <span style={baseTextStyle}> — {lang.proficiency}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        );

      case "Publications":
        return (
          publications.length > 0 && (
            <section className="mb-6" data-section="publications">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>PUBLICATIONS</h2>
                <div style={headingLineStyle}></div>
              </div>
              {publications.map((pub, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="font-semibold flex items-center" style={titleStyle}>
                    <span>{pub.title}</span>
                    {pub.url && (
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkIconStyle}
                        className="hover:opacity-70"
                        title={pub.url}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <div className="text-sm" style={baseTextStyle}>
                    {pub.authors}
                  </div>
                  <div className="text-sm" style={baseTextStyle}>
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
            <section className="mb-6 page-break-inside-avoid" data-section="references">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>REFERENCES</h2>
                <div style={headingLineStyle}></div>
              </div>
              {references.map((ref, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="font-semibold" style={titleStyle}>
                    {ref.name}
                  </div>
                  {ref.relation && <div className="text-sm" style={baseTextStyle}>{ref.relation}</div>}
                  {ref.contact && <div className="text-sm" style={baseTextStyle}>{ref.contact}</div>}
                </div>
              ))}
            </section>
          )
        );

      default:
        // Check if it's a custom section
        const customSection = customSections?.find(cs => cs.id === section || cs.sectionName === section);
        if (customSection && customSection.fields.length > 0) {
          return (
            <section className="mb-6">
              <div style={headingContainerStyle}>
                <h2 style={headingStyle}>{customSection.sectionName.toUpperCase()}</h2>
                <div style={headingLineStyle}></div>
              </div>
              <div className="space-y-3">
                {customSection.fields.map((field) => {
                  const hasValue = field.fieldType === "list"
                    ? (field.value as string[]).some(v => v.trim() !== "")
                    : field.value && field.value.toString().trim() !== "";

                  if (!hasValue) return null;

                  return (
                    <div key={field.id} className="mb-2">
                      {field.fieldType === "list" ? (
                        <ul className="list-disc pl-5" style={baseTextStyle}>
                          {(field.value as string[])
                            .filter(v => v.trim() !== "")
                            .map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                        </ul>
                      ) : field.fieldType === "url" ? (
                        <a
                          href={field.value as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={linkStyle}
                          className="hover:underline"
                        >
                          {field.value as string}
                        </a>
                      ) : field.fieldType === "textarea" ? (
                        <div
                          className="resume-description"
                          style={descriptionStyle}
                          dangerouslySetInnerHTML={{ __html: field.value as string }}
                        />
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
  };

  return (
    <>
      {/* ✅ Global CSS for bold/italic/underline visibility across ALL sections */}
      <style jsx global>{`
        .resume-description b,
        .resume-description strong {
          font-weight: 700 !important;
          color: #1a1a1a !important;
        }
        
        .resume-description i,
        .resume-description em {
          font-style: italic !important;
        }
        
        .resume-description u {
          text-decoration: underline !important;
        }
        
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
        
        .resume-description li {
          margin-bottom: 0.25rem;
        }
      `}</style>
      
      <AutoPaginator onPageCountChange={onPageCountChange}>
        {sectionOrder.map((section, idx) => (
          <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
        ))}
      </AutoPaginator>
    </>
  );
};

export default TemplateThree;

