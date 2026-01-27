"use client";

import React from "react";
import {
  ExternalLink,
  Edit3,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { ResumeData, ResumeStyle, useResume } from "../ResumeContext";
import AutoPaginator from "../AutoPaginator";

type SectionName =
  | "Summary"
  | "Experience"
  | "Skills"
  | "Education"
  | "Projects"
  | "Languages"
  | "Certificates"
  | "Awards"
  | "Achievements"
  | "Internships"
  | "Volunteering"
  | "Hobbies"
  | "Interests"
  | "Publications"
  | "References"
  | "PersonalInfo";

interface Props {
  data: ResumeData;
  style: ResumeStyle;
  onPageCountChange?: (count: number) => void;
  enabledSections?: string[];
}

const TemplateOne: React.FC<Props> = ({
  data,
  onPageCountChange,
  enabledSections: propEnabledSections,
}) => {
  const {
    resumeStyle,
    sectionOrder,
    enabledSections: contextEnabledSections,
    setActiveSection,
    setSectionOrder,
    setEnabledSections,
  } = useResume();

  const enabledSections = propEnabledSections || contextEnabledSections;

  const {
    personalInfo,
    professionalSummary,
    education = [],
    workExperience = [],
    projects = [],
    skills = [],
    categorizedSkills = {},
    certifications = [],
    achievements = [],
    volunteering = [],
    references = [],
    internships = [],
    awards = [],
    hobbies = [],
    interests = [],
    languages = [],
    publications = [],
  } = data;

  // Note: Section enabling is handled by enchancepage.tsx during upload
  // This template just renders the sections that are already enabled

  const has = (name: SectionName | string) => enabledSections.includes(name);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    if (/^[A-Za-z]{3}\s\d{2}$/.test(dateString)) return dateString;
    if (/^\d{4}-\d{2}$/.test(dateString)) {
      const [year, month] = dateString.split("-");
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]} ${year.slice(-2)}`;
    }
    return dateString;
  };

  const baseTextStyle: React.CSSProperties = {
    fontFamily: resumeStyle.fontFamily,
    fontSize: "13px",
    lineHeight: "1.5",
    fontWeight: 400,
    fontStyle: resumeStyle.italic ? "italic" : "normal",
    color: "#111827",
  };

  const headingStyle: React.CSSProperties = {
    color: "#111827",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "0.5rem",
  };

  const nameStyle: React.CSSProperties = {
    fontSize: resumeStyle.nameFontSize || "26px",
    fontWeight: 800,
    color: "#111827",
  };

  const linkStyle: React.CSSProperties = {
    color: "#1d4ed8",
    textDecoration: "none",
  };

  const linkIconStyle: React.CSSProperties = {
    display: "inline-block",
    marginLeft: "6px",
    verticalAlign: "middle",
    color: "#111827",
  };

  const titleStyle: React.CSSProperties = {
    ...baseTextStyle,
    color: "#111827",
    fontWeight: 600,
  };

  const descriptionStyle: React.CSSProperties = {
    ...baseTextStyle,
  };

  const placeholderStyle: React.CSSProperties = {
    ...baseTextStyle,
    color: "#9CA3AF",
    fontStyle: "italic",
  };

  /* ---------- SectionWrapper with clickable links fix ---------- */
  const SectionWrapper: React.FC<{
    name: SectionName;
    children: React.ReactNode;
  }> = ({ name, children }) => {
    if (!has(name)) return null;

    const idx = sectionOrder.indexOf(name as SectionName);
    const canMoveUp = idx > 0;
    const canMoveDown = idx >= 0 && idx < sectionOrder.length - 1;

    return (
      <section className="relative group mb-3 page-break-inside-avoid">
        {/* Hover dotted border */}
        <div className="absolute inset-0 rounded-md border border-dashed border-gray-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />

        {/* Move up */}
        {canMoveUp && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSectionOrder((prev) => {
                const arr = [...prev];
                const i = arr.indexOf(name as SectionName);
                if (i <= 0) return prev;
                [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                return arr;
              });
            }}
            className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white border border-gray-300 rounded-full p-1 shadow-sm z-10"
            title="Move up"
          >
            <ChevronUp className="w-4 h-4 text-gray-700" />
          </button>
        )}

        {/* Move down */}
        {canMoveDown && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSectionOrder((prev) => {
                const arr = [...prev];
                const i = arr.indexOf(name as SectionName);
                if (i === -1 || i >= arr.length - 1) return prev;
                [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                return arr;
              });
            }}
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white border border-gray-300 rounded-full p-1 shadow-sm z-10"
            title="Move down"
          >
            <ChevronDown className="w-4 h-4 text-gray-700" />
          </button>
        )}

        {/* Edit & Delete buttons */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-8 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSection(name);
            }}
            className="bg-blue-500 rounded-full p-1.5 shadow-sm hover:bg-blue-600 flex-shrink-0 transition-colors"
            title={`Edit ${name}`}
            aria-label={`Edit ${name} section`}
          >
            <Edit3 className="w-3.5 h-3.5 text-white" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEnabledSections((prev) =>
                prev.filter((s) => s !== name)
              );
            }}
            className="bg-red-500 rounded-full p-1.5 shadow-sm hover:bg-red-600 flex-shrink-0 transition-colors"
            title="Delete section"
            aria-label={`Delete ${name} section`}
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Content layer above overlay → links clickable */}
        <div className="relative z-10 pointer-events-auto">
          {children}
        </div>
      </section>
    );
  };

  /* ---------- All sections rendering ---------- */
  const renderSection = (section: string) => {
    switch (section as SectionName) {
      case "PersonalInfo":
        return (
          <SectionWrapper name="PersonalInfo">
            <div className="flex justify-between items-start">
              <h1 className="uppercase" style={nameStyle}>
                {personalInfo.fullName || "Full Name"}
              </h1>
              <div className="text-right flex flex-col gap-0.5">
                {personalInfo.phone && (
                  <div style={baseTextStyle}>
                    <span>{personalInfo.phone}</span>
                  </div>
                )}
                {personalInfo.email && (
                  <div style={baseTextStyle}>
                    <span>{personalInfo.email}</span>
                  </div>
                )}
                {personalInfo.location && (
                  <div style={baseTextStyle}>
                    <span>{personalInfo.location}</span>
                  </div>
                )}
                {personalInfo.linkedinUrl && (
                  <div style={baseTextStyle}>
                    <a
                      href={personalInfo.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                      className="hover:underline"
                    >
                      {personalInfo.linkedinUrl
                        .replace(/^https?:\/\//, "")
                        .replace(/^www\./, "")}
                    </a>
                  </div>
                )}
                {personalInfo.githubUrl && (
                  <div style={baseTextStyle}>
                    <a
                      href={personalInfo.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                      className="hover:underline"
                    >
                      {personalInfo.githubUrl
                        .replace(/^https?:\/\//, "")
                        .replace(/^www\./, "")}
                    </a>
                  </div>
                )}
                {personalInfo.portifolioUrl && (
                  <div style={baseTextStyle}>
                    <a
                      href={personalInfo.portifolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                      className="hover:underline"
                    >
                      {personalInfo.portifolioUrl
                        .replace(/^https?:\/\//, "")
                        .replace(/^www\./, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <hr className="border-t-2 border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Summary":
        return (
          <SectionWrapper name="Summary">
            <h2 style={headingStyle}>Summary</h2>
            {professionalSummary ? (
              <div
                className="text-justify resume-description"
                style={baseTextStyle}
                dangerouslySetInnerHTML={{ __html: professionalSummary }}
              />
            ) : (
              <p style={placeholderStyle}>
                Add your professional summary here
              </p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Skills":
        const formatCategoryName = (name: string) => {
          const names: Record<string, string> = {
            languages: "Languages",
            frameworks: "Frameworks",
            libraries: "Libraries",
            databases: "Databases",
            technologies: "Technologies",
            tools: "Tools",
            cloudPlatforms: "Cloud Platforms",
            softSkills: "Soft Skills"
          };
          return names[name] || name;
        };

        const parseSkills = (skillsStr: string) => {
          return skillsStr
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        };

        return (
          <SectionWrapper name="Skills">
            <h3
              className="mb-2 border-b border-gray-300 pb-1"
              style={headingStyle}
            >
              Skills
            </h3>
            {Object.keys(categorizedSkills).length > 0 ? (
              <div className="space-y-1" style={baseTextStyle}>
                {Object.entries(categorizedSkills).map(([category, skillsValue]) => {
                  if (!skillsValue) return null;
                  const skillsList = typeof skillsValue === 'string' ? parseSkills(skillsValue) : (skillsValue as string[]);
                  if (skillsList.length === 0) return null;
                  return (
                    <div key={category} className="text-sm">
                      <span className="font-semibold">{formatCategoryName(category)}: </span>
                      <span>{skillsList.join(', ')}</span>
                    </div>
                  );
                })}
              </div>
            ) : skills.length > 0 ? (
              <ul
                className="list-disc pl-5 grid grid-cols-3 gap-x-4 gap-y-1"
                style={baseTextStyle}
              >
                {skills.map((skill, idx) => (
                  <li key={idx} className="text-sm">
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={placeholderStyle}>Add your skills here</p>
            )}
          </SectionWrapper>
        );

      case "Experience":
        return (
          <SectionWrapper name="Experience">
            <h2 style={headingStyle}>Experience</h2>
            {workExperience.length > 0 ? (
              workExperience.map((exp, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="flex items-center" style={titleStyle}>
                      {exp.role}
                    </h3>
                    <span className="text-sm" style={baseTextStyle}>
                      {exp.duration || "– Present"}
                    </span>
                  </div>
                  <div
                    className="mb-1 flex items-center"
                    style={baseTextStyle}
                  >
                    <span className="font-medium">{exp.company}</span>
                    {exp.location && (
                      <span className="text-sm"> • {exp.location}</span>
                    )}
                  </div>
                  {exp.description && (
                    <div
                      className="resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: exp.description }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your work experience here</p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Internships":
        return (
          <SectionWrapper name="Internships">
            <h2 style={headingStyle}>Internships</h2>
            {internships.length > 0 ? (
              internships.map((intern, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="flex items-center" style={titleStyle}>
                      {intern.role}
                    </h3>
                    {intern.duration && (
                      <span className="text-sm" style={baseTextStyle}>
                        {intern.duration}
                      </span>
                    )}
                  </div>
                  <div
                    className="mb-1 flex items-center"
                    style={baseTextStyle}
                  >
                    <span className="font-medium">{intern.company}</span>
                    {intern.location && (
                      <span className="text-sm"> • {intern.location}</span>
                    )}
                  </div>
                  {intern.description && (
                    <div
                      className="resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: intern.description }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your internships here</p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Education":
        return (
          <SectionWrapper name="Education">
            <h2 style={headingStyle}>Education</h2>
            {education.length > 0 ? (
              education.map((edu, idx) => (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <h3 className="font-semibold" style={titleStyle}>
                        {edu.degree}
                      </h3>
                      <p className="text-sm" style={baseTextStyle}>
                        {edu.college}
                        {edu.branch && ` • ${edu.branch}`}
                      </p>
                    </div>
                    <span className="text-sm" style={baseTextStyle}>
                      {edu.duration}
                    </span>
                  </div>

                  {edu.grade && (
                    <p className="text-sm" style={baseTextStyle}>
                      <span className="font-medium">{edu.gradeType || "Grade"}:</span> {edu.grade}
                    </p>
                  )}

                  {edu.achievements && (
                    <div
                      className="text-sm resume-description mt-1"
                      style={baseTextStyle}
                      dangerouslySetInnerHTML={{ __html: edu.achievements }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your education here</p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Projects":
        return (
          <SectionWrapper name="Projects">
            <h2 style={headingStyle}>Projects</h2>
            {projects.length > 0 ? (
              projects.map((proj, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="flex items-center" style={titleStyle}>
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
                        {formatDate(proj.startDate)} –{" "}
                        {formatDate(proj.endDate)}
                      </span>
                    )}
                    {proj.client && (
                      <span className="text-sm" style={baseTextStyle}>
                        Client: {proj.client}
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <div
                      className="mb-1.5 resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: proj.description }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your projects here</p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Certificates":
        return (
          <SectionWrapper name="Certificates">
            <h2 style={headingStyle}>Certificates</h2>
            {certifications.length > 0 ? (
              certifications.map((cert: any, idx) => (
                <div key={idx} className="mb-2 flex items-start">
                  <span className="mr-2" style={baseTextStyle}>
                    •
                  </span>
                  <div style={baseTextStyle}>
                    <span className="font-medium" style={titleStyle}>
                      {cert.name}
                    </span>
                    {cert.issuedBy && <span>{', ' + cert.issuedBy}</span>}
                    {(cert.year || cert.expiryDate) && (
                      <div className="text-xs mt-0.5">
                        {cert.year && <span>{cert.year}</span>}
                        {cert.expiryDate && (
                          <span className="ml-3">
                            Expires: {cert.expiryDate}
                          </span>
                        )}
                      </div>
                    )}
                    {cert.credentialId && (
                      <div className="text-xs mt-0.5">
                        Credential ID: {cert.credentialId}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your certificates here</p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Awards":
        return (
          <SectionWrapper name="Awards">
            <h2 style={headingStyle}>Awards</h2>
            {awards.length > 0 ? (
              awards.map((award, idx) => (
                <div key={idx} className="mb-1.5 flex items-start">
                  <span className="mr-2" style={baseTextStyle}>
                    •
                  </span>
                  <div style={baseTextStyle}>
                    <span className="font-medium" style={titleStyle}>
                      {award.title}
                    </span>
                    <span>
                      {award.issuedBy && ` — ${award.issuedBy}`}
                      {award.year && ` (${award.year})`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your awards here</p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Achievements":
        return (
          <SectionWrapper name="Achievements">
            <h2 style={headingStyle}>Achievements</h2>
            {achievements.length > 0 ? (
              achievements.map((achievement, idx) => (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-semibold" style={titleStyle}>
                      {achievement.title}
                    </h3>
                    {achievement.date && (
                      <span className="text-sm" style={baseTextStyle}>
                        {formatDate(achievement.date)}
                      </span>
                    )}
                  </div>
                  {achievement.description && (
                    <div
                      className="resume-description"
                      style={baseTextStyle}
                      dangerouslySetInnerHTML={{
                        __html: achievement.description,
                      }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your achievements here</p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Publications":
        return (
          <SectionWrapper name="Publications">
            <h2 style={headingStyle}>Publications</h2>
            {publications.length > 0 ? (
              publications.map((pub, idx) => (
                <div key={idx} className="mb-2">
                  <h3 className="flex items-center" style={titleStyle}>
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
                    {pub.date && ` • ${formatDate(pub.date)}`}
                  </p>
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your publications here</p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Languages":
        return (
          <SectionWrapper name="Languages">
            <h2 style={headingStyle}>Languages</h2>
            {languages.length > 0 ? (
              <div className="grid grid-cols-2 gap-y-1 gap-x-6">
                {languages.map((lang: any, idx) => {
                  const name =
                    typeof lang === "string" ? lang : lang.language;
                  const proficiency =
                    typeof lang === "object" ? lang.proficiency : "";

                  return (
                    <div
                      key={idx}
                      className="flex items-start"
                      style={baseTextStyle}
                    >
                      <span className="mr-2">•</span>
                      <span>
                        <span className="font-medium">{name}</span>
                        {proficiency && <span> — {proficiency}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={placeholderStyle}>Add your languages here</p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Hobbies":
        return (
          <SectionWrapper name="Hobbies">
            <h2 style={headingStyle}>Hobbies</h2>
            {hobbies.length > 0 ? (
              hobbies.map((hobby, idx) => (
                <div key={idx} className="mb-1.5">
                  <span className="font-medium" style={titleStyle}>
                    {hobby.name}
                  </span>
                  {hobby.description && (
                    <span style={baseTextStyle}> — {hobby.description}</span>
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your hobbies here</p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Interests":
        return (
          <SectionWrapper name="Interests">
            <h2 style={headingStyle}>Interests</h2>
            {interests.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5">
                {interests.map((interest, idx) => (
                  <div
                    key={idx}
                    className="flex items-start"
                    style={baseTextStyle}
                  >
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-medium" style={titleStyle}>
                        {interest.name}
                      </span>
                      {interest.category && (
                        <span className="text-sm" style={baseTextStyle}>
                          {" "}
                          ({interest.category})
                        </span>
                      )}
                      {interest.description && (
                        <div
                          className="text-sm resume-description"
                          style={baseTextStyle}
                          dangerouslySetInnerHTML={{
                            __html: interest.description,
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={placeholderStyle}>Add your interests here</p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "Volunteering":
        return (
          <SectionWrapper name="Volunteering">
            <h2 style={headingStyle}>Volunteering</h2>
            {volunteering.length > 0 ? (
              volunteering.map((vol, idx) => (
                <div key={idx} className="mb-2">
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
                      {formatDate(vol.startDate)} –{" "}
                      {formatDate(vol.endDate)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>
                Add your volunteering experience here
              </p>
            )}
            <hr className="border-t border-gray-700 mt-3" />
          </SectionWrapper>
        );

      case "References":
        return (
          <SectionWrapper name="References">
            <h2 style={headingStyle}>References</h2>
            {references.length > 0 ? (
              references.map((ref, idx) => (
                <div key={idx} className="mb-2">
                  <h3 className="font-semibold" style={titleStyle}>
                    {ref.name}
                  </h3>
                  {ref.relation && (
                    <p className="text-sm" style={baseTextStyle}>
                      {ref.relation}
                    </p>
                  )}
                  {ref.contact && (
                    <p className="text-sm" style={baseTextStyle}>
                      {ref.contact}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your references here</p>
            )}
          </SectionWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style jsx global>{`
        .resume-description b,
        .resume-description strong {
          font-weight: 700 !important;
          color: #111827 !important;
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
          margin-top: 0.4rem;
        }
        .resume-description ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-top: 0.4rem;
        }
        .resume-description li {
          margin-bottom: 0.2rem;
        }
      `}</style>

      <div className="flex justify-center bg-transparent py-6">
        <div className="bg-white rounded-lg w-[800px] px-10">
          <AutoPaginator onPageCountChange={onPageCountChange}>
            {sectionOrder.map((section, idx) => (
              <React.Fragment key={idx}>
                {renderSection(section)}
              </React.Fragment>
            ))}
          </AutoPaginator>
        </div>
      </div>
    </>
  );
};

export default TemplateOne;