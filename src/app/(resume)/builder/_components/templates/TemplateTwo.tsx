"use client";
import React from "react";
import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
import { useResume } from "../../_context/ResumeContext";
interface Props {
  data: ResumeData;
  style: ResumeStyle;
}
const TemplateTwo: React.FC<Props> = ({ data }) => {
  const { resumeStyle, sectionOrder } = useResume();
  const { personalInfo, professionalSummary, education, workExperience, projects, skills, certifications, achievements, volunteering, references, internships, awards, } = data;
  // ✅ Format function for "MMM YYYY"
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString("en-US", { month: "short", year: "numeric" });
  };
  // ✅ Unified text and heading styles
  const baseTextStyle: React.CSSProperties = {
    fontFamily: resumeStyle.fontFamily,
    fontSize: resumeStyle.bodyFontSize,
    lineHeight: resumeStyle.lineSpacing,
    fontWeight: resumeStyle.bold ? "bold" : "normal",
    fontStyle: resumeStyle.italic ? "italic" : "normal",
    textDecoration: resumeStyle.underline ? "underline" : "none",
    color: resumeStyle.bodyColor,
  };
  const headingStyle: React.CSSProperties = {
    color: resumeStyle.headingColor,
    fontSize: resumeStyle.headingFontSize,
    fontWeight: "bold",
    textTransform: "uppercase",
  };
  // ✅ Section divider
  const SectionDivider = ({ title }: { title: string }) => (
    <div className="flex items-center my-4" style={headingStyle}>
      <div className="flex-grow border-t border-black"></div>
      <span className="mx-3">{title}</span>
      <div className="flex-grow border-t border-black"></div>
    </div>
  );
  // ✅ All sections wrapped inside renderSection()
  const renderSection = (section: string) => {
    switch (section) {
      case "Personal Info":
        return (
          <header className="text-center border-b-2 border-black pb-4 mb-6">
            <h1
              className="uppercase font-bold"
              style={{
                color: resumeStyle.headingColor,
                fontSize: resumeStyle.nameFontSize,
              }}
            >
              {personalInfo.name || "Your Name"}
            </h1>
            <div
              className="mt-2 text-sm flex justify-center gap-4 flex-wrap"
              style={{ color: resumeStyle.bodyColor }}
            >
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>{personalInfo.phone}</span>}
              {personalInfo.location && <span>{personalInfo.location}</span>}
              {personalInfo.linkedinurl && (
                <span>
                  <a
                    href={personalInfo.linkedinurl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {personalInfo.linkedinurl}
                  </a>
                </span>
              )}
            </div>
          </header>
        );
      case "Professional Summary":
        return (
          professionalSummary && (
            <>
              <SectionDivider title="Summary" />
              <p className="text-justify" style={{ color: resumeStyle.bodyColor }}>
                {professionalSummary}
              </p>
            </>
          )
        );
      case "Work Experience":
        return (
          workExperience.length > 0 && (
            <>
              <SectionDivider title="Work Experience" />
              {workExperience.map((exp, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between font-semibold">
                    <span>
                      {exp.role}, {exp.company}
                    </span>
                    <span style={{ color: resumeStyle.bodyColor }}>
                      {formatDate(exp.startDate)} -{" "}
                      {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <p style={{ color: resumeStyle.bodyColor }}>{exp.description}</p>
                </div>
              ))}
            </>
          )
        );
      case "Education":
        return (
          education.length > 0 && (
            <>
              <SectionDivider title="Education" />
              {education.map((edu, idx) => (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between font-semibold">
                    <span>
                      {edu.degree}, {edu.school}
                    </span>
                    <span style={{ color: resumeStyle.bodyColor }}>
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )
        );
      case "Projects":
        return (
          projects.length > 0 && (
            <>
              <SectionDivider title="Projects" />
              {projects.map((proj, idx) => (
                <div key={idx} className="mb-3">
                  <p className="font-semibold">
                    {proj.title}
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline ml-1"
                      >
                        [Link]
                      </a>
                    )}
                  </p>
                  <p style={{ color: resumeStyle.bodyColor }}>{proj.description}</p>
                  <p style={{ color: resumeStyle.bodyColor }}>
                    <strong>Technologies:</strong> {proj.technologies}
                  </p>
                  <p style={{ color: resumeStyle.bodyColor }}>
                    {formatDate(proj.startDate)} - {formatDate(proj.endDate)}
                  </p>
                </div>
              ))}
            </>
          )
        );
      case "Skills":
        return (
          skills.length > 0 && (
            <>
              <SectionDivider title="Skills" />
              <div className="flex flex-wrap gap-3" style={{ color: resumeStyle.bodyColor }}>
                {skills.map((s, i) => (
                  <span key={i} className="border px-2 py-1 rounded">
                    {s}
                  </span>
                ))}
              </div>
            </>
          )
        );
      case "Certifications":
        return (
          certifications.length > 0 && (
            <>
              <SectionDivider title="Certifications" />
              {certifications.map((cert, idx) => (
                <p key={idx} style={{ color: resumeStyle.bodyColor }}>
                  {cert.name} — {cert.issuedBy} ({cert.year})
                </p>
              ))}
            </>
          )
        );
      case "Achievements":
        return (
          achievements.length > 0 && (
            <>
              <SectionDivider title="Achievements" />
              <ul className="list-disc ml-6" style={{ color: resumeStyle.bodyColor }}>
                {achievements.map((a, i) => (
                  <li key={i}>
                    <strong>{a.title}</strong> ({a.date}) — {a.description}
                  </li>
                ))}
              </ul>
            </>
          )
        );
      case "Volunteering":
        return (
          volunteering.length > 0 && (
            <>
              <SectionDivider title="Volunteering" />
              {volunteering.map((v, i) => (
                <div key={i} className="mb-2">
                  <p className="font-semibold">
                    {v.role} — {v.organization}
                  </p>
                  <p style={{ color: resumeStyle.bodyColor }}>
                    {formatDate(v.startDate)} - {formatDate(v.endDate)}
                  </p>
                </div>
              ))}
            </>
          )
        );
      case "Internships":
        return (
          internships.length > 0 && (
            <>
              <SectionDivider title="Internships" />
              {internships.map((intern, i) => (
                <div key={i} className="mb-2">
                  <p className="font-semibold">
                    {intern.role} — {intern.company}
                  </p>
                  <p style={{ color: resumeStyle.bodyColor }}>
                    {formatDate(intern.startDate)} -{" "}
                    {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                  </p>
                  <p style={{ color: resumeStyle.bodyColor }}>{intern.description}</p>
                </div>
              ))}
            </>
          )
        );
      case "Awards":
        return (
          awards.length > 0 && (
            <>
              <SectionDivider title="Awards" />
              {awards.map((award, i) => (
                <p key={i} style={{ color: resumeStyle.bodyColor }}>
                  {award.title} — {award.issuedBy} ({award.year})
                </p>
              ))}
            </>
          )
        );
      case "References":
        return (
          references.length > 0 && (
            <>
              <SectionDivider title="References" />
              {references.map((ref, i) => (
                <p key={i} style={{ color: resumeStyle.bodyColor }}>
                  {ref.name} ({ref.relation}) — {ref.contact}
                </p>
              ))}
            </>
          )
        );

      default:
        return null;
    }
  };
  return (
    <div className="w-[500px] mx-auto bg-white shadow p-10 text-sm" style={baseTextStyle}>
      {sectionOrder.map((section, idx) => (
        <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
      ))}
    </div>
  );
};
export default TemplateTwo;


