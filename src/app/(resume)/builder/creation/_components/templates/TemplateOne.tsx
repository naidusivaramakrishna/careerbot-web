"use client";
import React from "react";
import { ResumeData, ResumeStyle, useResume } from "../../_context/ResumeContext";
import AutoPaginator from "./AutoPaginator";
import { ExternalLink } from "lucide-react";
import SafeHTML from "@/components/common/SafeHTML";

interface Props {
  data: ResumeData;
  style: ResumeStyle;
  onPageCountChange?: (count: number) => void;
}

const TemplateOne: React.FC<Props> = ({ data, onPageCountChange  }) => {
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
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.75rem",
  };

  const nameStyle: React.CSSProperties = {
    fontSize: resumeStyle.nameFontSize,
    fontWeight: "bold",
    color: resumeStyle.headingColor,
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

  const renderSection = (section: string) => {
    switch (section) {
      case "Personal Info":
        return (
          <header className="mb-2">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold uppercase" style={nameStyle}>
                {personalInfo.fullname || "Full Name"}
              </h1>

              <div className="text-right flex flex-col gap-1">
                {personalInfo.phone && (
                  <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
                    <span>{personalInfo.countryCode}{personalInfo.phone}</span>
                  </div>
                )}
                {personalInfo.email && (
                  <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
                    <span>{personalInfo.email}</span>
                  </div>
                )}
                {personalInfo.location && (
                  <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
                    <span>{personalInfo.location}</span>
                  </div>
                )}
                {personalInfo.linkedinUrl && (
                  <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
                    <a
                      href={personalInfo.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                      className="hover:underline"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
                {personalInfo.githubUrl && (
                  <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
                    <a
                      href={personalInfo.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                      className="hover:underline"
                    >
                      GitHub
                    </a>
                  </div>
                )}
                {personalInfo.portfolioUrl && (
                  <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
                    <a 
                      href={personalInfo.portfolioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={linkStyle}
                      className="hover:underline"
                    >
                      Portfolio
                    </a>
                  </div>
                )}
              </div>
            </div>
            <hr className="border-t-2 border-gray-600 mt-4" />
          </header>
        );

      case "Professional Summary":
        return (
          professionalSummary?.summary && (
            <section className="mb-0">
              <h2 style={headingStyle}>SUMMARY</h2>
              {/* ✅ Changed to support HTML formatting */}
              <SafeHTML content={professionalSummary.summary} className="text-justify resume-description" />
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      // case "Skills":
      //   return (
      //     skills.length > 0 && (
      //       <section className="page-break-inside-avoid" data-section="skills">
      //         <h2 className="mb-3" style={headingStyle}>
      //           SKILLS
      //         </h2>
              
      //         {data.categorizedSkills ? (
      //           <div className="space-y-3">
      //             {Object.entries(data.categorizedSkills).map(([category, categorySkills]) => {
      //               if (!categorySkills || categorySkills.length === 0) return null;
                    
      //               const categoryLabel = category
      //                 .split('_')
      //                 .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      //                 .join(' ');
                    
      //               return (
      //                 <div key={category}>
      //                   <div className="font-semibold mb-1" style={baseTextStyle}>
      //                     {categoryLabel}: {(categorySkills as string[]).join(", ")}
      //                   </div>
      //                 </div>
      //               );
      //             })}
      //           </div>
      //         ) : (
      //           <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
      //             {skills.map((skill, idx) => (
      //               <li key={idx}>{skill}</li>
      //             ))}
      //           </ul>
      //         )}
              
      //         <hr className="border-t border-gray-800 mt-4" />
      //       </section>
      //     )
      //   );


  //     case "Skills":
  // return (
  //   skills.length > 0 && (
  //     <section className="page-break-inside-avoid" data-section="skills">
  //       <h2 className="mb-3" style={headingStyle}>
  //         SKILLS
  //       </h2>
        
  //       {data.categorizedSkills ? (
  //         <div className="space-y-0.5">
  //           {Object.entries(data.categorizedSkills).map(([category, categorySkills]) => {
  //             if (!categorySkills || categorySkills.length === 0) return null;
              
  //             const categoryLabel = category
  //               .split('_')
  //               .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  //               .join(' ');
              
  //             return (
  //               <div key={category}>
  //                 <div className="mb-1">
  //                   <span className="font-semibold" style={titleStyle}>
  //                     {categoryLabel}:
  //                   </span>
  //                   <span style={baseTextStyle}>
  //                     {" "}{(categorySkills as string[]).join(", ")}
  //                   </span>
  //                 </div>
  //               </div>
  //             );
  //           })}
  //         </div>
  //       ) : (
  //         <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
  //           {skills.map((skill, idx) => (
  //             <li key={idx}>{skill}</li>
  //           ))}
  //         </ul>
  //       )}
        
  //       <hr className="border-t border-gray-800 mt-4" />
  //     </section>
  //   )
  // );

      case "Skills":
        return (
          (skills.length > 0 || !!data.categorizedSkills) && (
            <section className="mb-4 page-break-inside-avoid" data-section="skills">
              <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
                SKILLS
              </h3>
              {data.categorizedSkills ? (
                <div className="space-y-0.5" style={baseTextStyle}>
                  {(["programming_languages","frameworks","databases","tools","cloud_platforms","soft_skills"] as const).map((key) => {
                    const categorySkills = data.categorizedSkills![key];
                    if (!categorySkills || categorySkills.length === 0) return null;
                    const label = key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                    return (
                      <div key={key} className="flex items-start gap-1">
                        <span style={{ color: resumeStyle.headingColor, fontSize: "8px", marginTop: "2px" }}>▸</span>
                        <span><span className="font-semibold">{label}: </span>{categorySkills.join(", ")}</span>
                      </div>
                    );
                  })}
                  {(data.categorizedSkills.custom_categories || []).map((custom) => {
                    if (!custom.skills || custom.skills.length === 0) return null;
                    return (
                      <div key={custom.id} className="flex items-start gap-1">
                        <span style={{ color: resumeStyle.headingColor, fontSize: "8px", marginTop: "2px" }}>▸</span>
                        <span><span className="font-semibold">{custom.name || "Other"}: </span>{custom.skills.join(", ")}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5" style={baseTextStyle}>
                  {skills.map((skill, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span style={{ color: resumeStyle.headingColor, fontSize: "8px", marginTop: "2px" }}>▸</span>
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        );


      case "Work Experience":
        return (
          workExperience.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>EXPERIENCE</h2>
              {workExperience.map((exp, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold flex items-center" style={titleStyle}>
                      {exp.role}
                    </h3>
                    <span className="text-sm" style={baseTextStyle}>
                      {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center" style={baseTextStyle}>
                    <span className="font-medium">{exp.company}</span>
                    {exp.location && <span className="text-sm"> • {exp.location}</span>}
                  </div>
                  {exp.description && (
                    <SafeHTML content={exp.description} className="resume-description" />
                  )}
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Internships":
        return (
          internships.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>INTERNSHIPS</h2>
              {internships.map((intern, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold flex items-center" style={titleStyle}>
                      {intern.role}
                    </h3>
                    <span className="text-sm" style={baseTextStyle}>
                      {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center" style={baseTextStyle}>
                    <span className="font-medium">{intern.company}</span>
                    {intern.location && <span className="text-sm"> • {intern.location}</span>}
                  </div>
                  {intern.description && (
                    <SafeHTML content={intern.description} className="resume-description" />
                  )}
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Education":
        return (
          education.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>EDUCATION</h2>
              {education.map((edu, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-baseline">
                    <div className="flex-1">
                      <h3 className="font-semibold" style={titleStyle}>
                        {edu.degree}
                      </h3>
                      <p className="text-sm" style={baseTextStyle}>
                        {edu.school}
                      </p>
                      {edu.scoreType && edu.scoreValue && (
                        <p className="text-xs mt-1" style={baseTextStyle}>
                          {edu.scoreType}: {edu.scoreValue}{edu.scoreType === "Percentage" ? "%" : ""}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-right ml-4" style={baseTextStyle}>
                      {edu.startDate ? `${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}` : formatDate(edu.endDate)}
                    </span>
                  </div>
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Projects":
        return (
          projects.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>PROJECTS</h2>
              {projects.map((proj, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold flex items-center" style={titleStyle}>
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
                    </h3>
                    {(proj.startDate || proj.endDate) && (
                      <span className="text-sm" style={baseTextStyle}>
                        {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <SafeHTML content={proj.description} className="mb-2 resume-description" />
                  )}
                  {proj.technologies.length > 0 && (
                    <p className="text-sm" style={baseTextStyle}>
                      <span className="font-medium">Technologies:</span> {proj.technologies.join(", ")}
                    </p>
                  )}
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Certifications":
        return (
          certifications.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>CERTIFICATIONS</h2>
              {certifications.map((cert, idx) => (
                <div key={idx} className="mb-3 flex items-start">
                  <span className="mr-2" style={baseTextStyle}>•</span>
                  <div style={baseTextStyle}>
                    <div>
                      <span className="font-medium" style={titleStyle}>{cert.name}</span>
                      {cert.issuer && <span style={baseTextStyle}> - {cert.issuer}</span>}
                    </div>
                    <div className="text-xs mt-1">
                      {cert.issueDate && <span>Issued: {cert.issueDate}</span>}
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
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Awards":
        return (
          awards.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>AWARDS</h2>
              {awards.map((award, idx) => (
                <div key={idx} className="mb-2 flex items-start">
                  <span className="mr-2" style={baseTextStyle}>•</span>
                  <div style={baseTextStyle}>
                    <span className="font-medium" style={titleStyle}>{award.title}</span>
                    {(award.issuedBy || award.year) && (
                      <span style={baseTextStyle}>
                        {award.issuedBy && ` — ${award.issuedBy}`}
                        {award.year && ` (${award.year})`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Achievements":
        return (
          achievements.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>ACHIEVEMENTS</h2>
              {achievements.map((achievement, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold" style={titleStyle}>
                      {achievement.title}
                    </h3>
                    {achievement.date && (
                      <span className="text-sm" style={baseTextStyle}>
                        {formatDate(achievement.date)}
                      </span>
                    )}
                  </div>
                  {/* ✅ Changed to support HTML formatting */}
                  {achievement.description && (
                    <SafeHTML content={achievement.description} className="resume-description" />
                  )}
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Publications":
        return (
          publications.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>PUBLICATIONS</h2>
              {publications.map((pub, idx) => (
                <div key={idx} className="mb-3">
                  <h3 className="font-semibold flex items-center" style={titleStyle}>
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
                  </h3>
                  <p className="text-sm" style={baseTextStyle}>
                    {pub.authors}
                  </p>
                  <p className="text-sm" style={baseTextStyle}>
                    <span className="italic">{pub.publicationName}</span>
                    {pub.date && <> • {formatDate(pub.date)}</>}
                  </p>
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Languages":
        return (
          languages.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>LANGUAGES</h2>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang, idx) => (
                  <div key={idx} className="flex items-start" style={baseTextStyle}>
                    <span className="mr-2">•</span>
                    <span>
                      <span className="font-medium">{lang.language}</span>
                      {lang.proficiency && <span style={baseTextStyle}> — {lang.proficiency}</span>}
                    </span>
                  </div>
                ))}
              </div>
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Hobbies":
        return (
          hobbies.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>HOBBIES</h2>
              {hobbies.map((hobby, idx) => (
                <div key={idx} className="mb-2">
                  <h3 className="font-medium inline" style={titleStyle}>{hobby.name}</h3>
                  {/* ✅ Changed to support HTML formatting */}
                  {hobby.description && (
                    <SafeHTML as="span" content={` - ${hobby.description}`} className="resume-description" />
                  )}
                  {hobby.proficiencyLevel && <span className="text-sm" style={baseTextStyle}> ({hobby.proficiencyLevel})</span>}
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Interests":
        return (
          interests.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>INTERESTS</h2>
              <div className="grid grid-cols-2 gap-2">
                {interests.map((interest, idx) => (
                  <div key={idx} className="flex items-start" style={baseTextStyle}>
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-medium" style={titleStyle}>{interest.name}</span>
                      {interest.category && <span className="text-sm" style={baseTextStyle}> ({interest.category})</span>}
                      {/* ✅ Changed to support HTML formatting */}
                      {interest.description && (
                        <SafeHTML content={interest.description} className="text-sm resume-description" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Volunteering":
        return (
          volunteering.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>VOLUNTEERING</h2>
              {volunteering.map((vol, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <h3 className="font-semibold" style={titleStyle}>
                        {vol.role}
                      </h3>
                      <p className="text-sm" style={baseTextStyle}>
                        {vol.organization}
                      </p>
                    </div>
                    <span className="text-sm" style={baseTextStyle}>
                      {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
                    </span>
                  </div>
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "References":
        return (
          references.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>REFERENCES</h2>
              {references.map((ref, idx) => (
                <div key={idx} className="mb-3">
                  <h3 className="font-semibold" style={titleStyle}>
                    {ref.name}
                  </h3>
                  <p className="text-sm" style={baseTextStyle}>
                    {ref.relation}
                  </p>
                  <p className="text-sm" style={baseTextStyle}>
                    {ref.contact}
                  </p>
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
            <section className="">
              <h2 style={headingStyle}>{customSection.sectionName.toUpperCase()}</h2>
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
                        <SafeHTML content={field.value as string} className="resume-description" />
                      ) : (
                        <div style={baseTextStyle}>{field.value as string}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <hr className="border-t border-gray-800 mt-4" />
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

export default TemplateOne;










