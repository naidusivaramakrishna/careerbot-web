 "use client";
import React from "react";
import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
import { useResume } from "../../_context/ResumeContext";

interface Props {
  data: ResumeData;
  style: ResumeStyle;
}

const TemplateOne: React.FC<Props> = ({ data }) => {
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
  } = data;
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };
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
  const renderSection = (section: string) => {
    switch (section) {
      case "Personal Info":
        return (
          <div className="border-b-2 border-gray-300 pb-3 mb-4">
            <h1
              className="uppercase"
              style={{
                color: resumeStyle.headingColor,
                fontSize: resumeStyle.nameFontSize,
                fontWeight: "bold",
              }}
            >
              {personalInfo.name || "Your Name"}
            </h1>
            <p className="mt-1" style={{ color: resumeStyle.bodyColor }}>
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <> | {personalInfo.phone}</>}
              {personalInfo.location && <> | {personalInfo.location}</>}
              {personalInfo.linkedinurl && (
                <>
                  {" "}
                  |{" "}
                  <a href={personalInfo.linkedinurl} target="_blank" rel="noreferrer">
                    {personalInfo.linkedinurl}
                  </a>
                </>
              )}
            </p>
          </div>
        );
      case "Professional Summary":
        return (
          professionalSummary && (
            <section className="mb-5">
              <h3 className="border-b border-gray-300 pb-1 mb-2" style={headingStyle}>Summary</h3>
              <p style={{ color: resumeStyle.bodyColor }}>{professionalSummary}</p>
            </section>
          )
        );
      case "Skills":
        return (
          skills.length > 0 && (
            <section className="mb-5">
              <h3 className="border-b border-gray-300 pb-1 mb-2" style={headingStyle}>Skills</h3>
              <ul className="grid grid-cols-2 gap-1" style={{ color: resumeStyle.bodyColor }}>
                {skills.map((skill, idx) => (
                  <li key={idx} className="list-disc ml-5">
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          )
        );
      case "Education":
        return (
          education.length > 0 && (
            <section className="mb-5">
              <h3 className="border-b border-gray-300 pb-1 mb-2" style={headingStyle}>Education</h3>
              {education.map((edu, idx) => (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between font-semibold">
                    <span>{edu.degree}, {edu.school}</span>
                    <span>{formatDate(edu.startDate)} - {formatDate(edu.endDate)}</span>
                  </div>
                </div>
              ))}
            </section>
          )
        );
      case "Work Experience":
        return (
          workExperience.length > 0 && (
            <section className="mb-5">
              <h3 className="border-b border-gray-300 pb-1 mb-2" style={headingStyle}>Work Experience</h3>
              {workExperience.map((exp, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between font-semibold">
                    <span>{exp.role} - {exp.company}</span>
                    <span>{formatDate(exp.startDate)} - {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}</span>
                  </div>
                  <p>{exp.description}</p>
                </div>
              ))}
            </section>
          )
        );
      case "Projects":
        return (
          projects.length > 0 && (
            <section className="mb-5">
              <h3 className="border-b border-gray-300 pb-1 mb-2" style={headingStyle}>Projects</h3>
              {projects.map((p, idx) => (
                <div key={idx} className="mb-2">
                  <div className="font-semibold">
                    {p.title}
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noreferrer" className="text-blue-600 underline ml-1">
                        [Link]
                      </a>
                    )}
                  </div>
                  <p>{p.description}</p>
                  <p><strong>Tech:</strong> {p.technologies}</p>
                </div>
              ))}
            </section>
          )
        );
      case "Certifications":
        return (
          certifications.length > 0 && (
            <section className="mb-5">
              <h3 className="border-b border-gray-300 pb-1 mb-2" style={headingStyle}>Certifications</h3>
              {certifications.map((c, i) => (
                <p key={i}>{c.name} — {c.issuedBy} ({c.year})</p>
              ))}
            </section>
          )
        );
      case "Achievements":
        return (
          achievements.length > 0 && (
            <section className="mb-5">
              <h3 className="border-b border-gray-300 pb-1 mb-2" style={headingStyle}>Achievements</h3>
              <ul className="list-disc ml-5">
                {achievements.map((a, i) => (
                  <li key={i}><strong>{a.title}</strong> ({formatDate(a.date)}) — {a.description}</li>
                ))}
              </ul>
            </section>
          )
        );
      case "Volunteering":
        return (
          volunteering.length > 0 && (
            <section className="mb-5">
              <h3 className="border-b border-gray-300 pb-1 mb-2" style={headingStyle}>Volunteering</h3>
              {volunteering.map((v, i) => (
                <div key={i}>
                  <p className="font-semibold">{v.role} — {v.organization}</p>
                  <p>{formatDate(v.startDate)} - {formatDate(v.endDate)}</p>
                </div>
              ))}
            </section>
          )
        );
      case "Internships":
        return (
          internships.length > 0 && (
            <section className="mb-5">
              <h3 className="border-b border-gray-300 pb-1 mb-2" style={headingStyle}>Internships</h3>
              {internships.map((i, idx) => (
                <div key={idx}>
                  <p className="font-semibold">{i.role} — {i.company}</p>
                  <p>{formatDate(i.startDate)} - {i.currentlyWorking ? "Present" : formatDate(i.endDate)}</p>
                  <p>{i.description}</p>
                </div>
              ))}
            </section>
          )
        );
      case "Awards":
        return (
          awards.length > 0 && (
            <section className="mb-5">
              <h3 className="border-b border-gray-300 pb-1 mb-2" style={headingStyle}>Awards</h3>
              {awards.map((a, i) => (
                <p key={i}>{a.title} — {a.issuedBy} ({a.year})</p>
              ))}
            </section>
          )
        );
      case "References":
        return (
          references.length > 0 && (
            <section>
              <h3 className="border-b border-gray-300 pb-1 mb-2" style={headingStyle}>References</h3>
              {references.map((r, i) => (
                <p key={i}>{r.name} ({r.relation}) — {r.contact}</p>
              ))}
            </section>
          )
        );
      default:
        return null;
    }
  };
  return (
    <div className="w-[500px] mx-auto bg-white shadow-lg p-8 max-h-full" style={baseTextStyle}>
      {sectionOrder.map((section, idx) => (
        <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
      ))}
    </div>
  );
};
export default TemplateOne;






