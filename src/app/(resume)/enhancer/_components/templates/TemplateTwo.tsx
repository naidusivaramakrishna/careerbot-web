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
  | "References";

interface Props {
  data: ResumeData;
  style: ResumeStyle;
  onPageCountChange?: (count: number) => void;
  enabledSections?: string[];
}

const TemplateTwo: React.FC<Props> = ({
  data,
  onPageCountChange,
  enabledSections,
}) => {
  const {
    resumeStyle,
    sectionOrder,
    enabledSections: contextEnabledSections,
    setActiveSection,
    setSectionOrder,
    setEnabledSections,
  } = useResume();

  const activeEnabledSections = enabledSections || contextEnabledSections;

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

  const has = (name: SectionName | string) =>
    activeEnabledSections.includes(name);

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
    marginBottom: "0.75rem",
  };

  const nameStyle: React.CSSProperties = {
    fontSize: resumeStyle.nameFontSize || "26px",
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "1.5px",
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

  const SectionWrapper: React.FC<{
    name: SectionName | "PersonalInfo";
    children: React.ReactNode;
  }> = ({ name, children }) => {
    const isRealSection = name !== "PersonalInfo";

    if (isRealSection && !has(name)) return null;

    const idx = isRealSection
      ? sectionOrder.indexOf(name as SectionName)
      : -1;
    const canMoveUp = isRealSection && idx > 0;
    const canMoveDown =
      isRealSection && idx >= 0 && idx < sectionOrder.length - 1;

    return (
      <section className="relative group mb-4 page-break-inside-avoid">
        <div className="absolute inset-0 rounded-md border border-dashed border-gray-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />

        {isRealSection && canMoveUp && (
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
            className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white border border-gray-300 rounded-full p-1 shadow-sm"
            title="Move up"
          >
            <ChevronUp className="w-4 h-4 text-gray-700" />
          </button>
        )}

        {isRealSection && canMoveDown && (
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
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white border border-gray-300 rounded-full p-1 shadow-sm"
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
            title={`Edit ${name === "PersonalInfo" ? "Contact Info" : name}`}
            aria-label={`Edit ${name} section`}
          >
            <Edit3 className="w-3.5 h-3.5 text-white" />
          </button>

          {isRealSection && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEnabledSections((prev) =>
                  prev.filter((s) => s !== (name as SectionName))
                );
              }}
              className="bg-red-500 rounded-full p-1.5 shadow-sm hover:bg-red-600 flex-shrink-0 transition-colors"
              title="Delete section"
              aria-label={`Delete ${name} section`}
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>

        <div className="relative z-10 pointer-events-auto">
          {children}
        </div>
      </section>
    );
  };

  const renderSection = (section: string) => {
    if (!has(section)) return null;

    switch (section as SectionName) {
      case "Summary":
        return (
          <SectionWrapper name="Summary">
            <h3 className="mb-3.5 border-b border-gray-500" style={headingStyle}>
              SUMMARY
            </h3>
            {professionalSummary ? (
              <div
                className="text-justify resume-description"
                style={baseTextStyle}
                dangerouslySetInnerHTML={{ __html: professionalSummary }}
              />
            ) : (
              <p style={placeholderStyle}>Add your professional summary here</p>
            )}
          </SectionWrapper>
        );

      case "Experience":
        return (
          <SectionWrapper name="Experience">
            <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
              WORK EXPERIENCE
            </h3>
            {workExperience.length > 0 ? (
              workExperience.map((exp, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-bold mb-0.5" style={titleStyle}>
                        {exp.role}
                      </div>
                      <div className="text-sm font-medium mb-0.5" style={baseTextStyle}>
                        {exp.company}
                      </div>
                      {exp.location && (
                        <div className="text-sm" style={baseTextStyle}>
                          {exp.location}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
                      {exp.duration || "– Present"}
                    </div>
                  </div>
                  {exp.description && (
                    <div
                      className="mt-2 resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: exp.description }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your work experience here</p>
            )}
          </SectionWrapper>
        );

      case "Education":
        return (
          <SectionWrapper name="Education">
            <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
              EDUCATION
            </h3>
            {education.length > 0 ? (
              education.map((edu, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold mb-0.5" style={titleStyle}>
                        {edu.degree}
                      </div>
                      <div className="text-sm" style={baseTextStyle}>
                        {edu.college}
                        {edu.branch && ` • ${edu.branch}`}
                      </div>
                      {edu.grade && (
                        <div className="text-sm" style={baseTextStyle}>
                          <span className="font-medium">{edu.gradeType || "Grade"}:</span> {edu.grade}
                        </div>
                      )}
                    </div>
                    <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
                      {edu.duration}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your education here</p>
            )}
          </SectionWrapper>
        );

      case "Projects":
        return (
          <SectionWrapper name="Projects">
            <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
              PROJECTS
            </h3>
            {projects.length > 0 ? (
              projects.map((proj, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-1">
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
                      <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
                        {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                      </div>
                    )}
                    {proj.client && (
                      <div className="text-sm" style={baseTextStyle}>
                        Client: {proj.client}
                      </div>
                    )}
                  </div>
                  {proj.description && (
                    <div
                      className="mb-2 resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: proj.description }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your projects here</p>
            )}
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
            <h3 className="mb-3.5 border-b border-gray-500" style={headingStyle}>
              SKILLS
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
                className="list-disc pl-5 grid grid-cols-3 gap-x-8 gap-y-1"
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

      case "Internships":
        return (
          <SectionWrapper name="Internships">
            <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
              INTERNSHIPS
            </h3>
            {internships.length > 0 ? (
              internships.map((intern, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-bold" style={baseTextStyle}>
                        {intern.company}
                      </div>
                      <div className="text-sm font-medium" style={titleStyle}>
                        {intern.role}
                      </div>
                      {intern.location && (
                        <div className="text-sm" style={baseTextStyle}>
                          {intern.location}
                        </div>
                      )}
                    </div>
                    {intern.duration && (
                      <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
                        {intern.duration}
                      </div>
                    )}
                  </div>
                  {intern.description && (
                    <div
                      className="mt-2 resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: intern.description }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your internships here</p>
            )}
          </SectionWrapper>
        );

      case "Certificates":
        return (
          <SectionWrapper name="Certificates">
            <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
              CERTIFICATIONS
            </h3>
            {certifications.length > 0 ? (
              certifications.map((cert, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex items-start">
                    <span className="mr-2" style={baseTextStyle}>•</span>
                    <div style={baseTextStyle}>
                      <div>
                        <span className="font-medium" style={titleStyle}>
                          {cert.name}
                        </span>
                        <span style={baseTextStyle}>{cert.issuedBy ? ', ' + cert.issuedBy : ''}</span>
                      </div>
                      <div className="text-xs mt-1">
                        {cert.year && <span>{cert.year}</span>}
                        {cert.expiryDate && (
                          <span className="ml-3">Expires: {cert.expiryDate}</span>
                        )}
                      </div>
                      {cert.credentialId && (
                        <div className="text-xs mt-1">
                          Credential ID: {cert.credentialId}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your certificates here</p>
            )}
          </SectionWrapper>
        );

      case "Achievements":
        return (
          <SectionWrapper name="Achievements">
            <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
              ACHIEVEMENTS
            </h3>
            {achievements.length > 0 ? (
              achievements.map((achievement, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold" style={titleStyle}>
                      {achievement.title}
                    </span>
                    {achievement.date && (
                      <span className="text-sm whitespace-nowrap" style={baseTextStyle}>
                        {formatDate(achievement.date)}
                      </span>
                    )}
                  </div>
                  {achievement.description && (
                    <div
                      className="text-sm resume-description"
                      style={baseTextStyle}
                      dangerouslySetInnerHTML={{ __html: achievement.description }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your achievements here</p>
            )}
          </SectionWrapper>
        );

      case "Awards":
        return (
          <SectionWrapper name="Awards">
            <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
              AWARDS
            </h3>
            {awards.length > 0 ? (
              awards.map((award, idx) => (
                <div key={idx} className="mb-2 flex items-start" style={baseTextStyle}>
                  <span className="mr-2">•</span>
                  <div>
                    <span className="font-semibold" style={titleStyle}>
                      {award.title}
                    </span>
                    <span style={baseTextStyle}>
                      {award.issuedBy && <> — {award.issuedBy}</>}
                      {award.year && <> ({award.year})</>}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your awards here</p>
            )}
          </SectionWrapper>
        );

      case "Volunteering":
        return (
          <SectionWrapper name="Volunteering">
            <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
              VOLUNTEERING
            </h3>
            {volunteering.length > 0 ? (
              volunteering.map((vol, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold" style={titleStyle}>
                        {vol.role}
                      </div>
                      <div className="text-sm" style={baseTextStyle}>
                        {vol.organization}
                      </div>
                    </div>
                    <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
                      {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your volunteering experience here</p>
            )}
          </SectionWrapper>
        );

      case "Hobbies":
        return (
          <SectionWrapper name="Hobbies">
            <h3 className="mb-3.5 border-b border-gray-500" style={headingStyle}>
              HOBBIES
            </h3>
            {hobbies.length > 0 ? (
              hobbies.map((hobby, idx) => (
                <div key={idx} className="mb-2">
                  <span className="font-semibold" style={titleStyle}>
                    {hobby.name}
                  </span>
                  {hobby.description && (
                    <span
                      className="resume-description"
                      style={baseTextStyle}
                      dangerouslySetInnerHTML={{ __html: ` — ${hobby.description}` }}
                    />
                  )}
                  {hobby.proficiencyLevel && (
                    <span className="text-sm" style={baseTextStyle}>
                      {" "}({hobby.proficiencyLevel})
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your hobbies here</p>
            )}
          </SectionWrapper>
        );

      case "Interests":
        return (
          <SectionWrapper name="Interests">
            <h3 className="mb-3.5 border-b border-gray-500" style={headingStyle}>
              INTERESTS
            </h3>
            {interests.length > 0 ? (
              interests.map((interest, idx) => (
                <div key={idx} className="mb-2">
                  <span className="font-semibold" style={titleStyle}>
                    {interest.name}
                  </span>
                  {interest.category && (
                    <span className="text-sm" style={baseTextStyle}>
                      {" "}({interest.category})
                    </span>
                  )}
                  {interest.description && (
                    <span
                      className="resume-description"
                      style={baseTextStyle}
                      dangerouslySetInnerHTML={{ __html: ` — ${interest.description}` }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your interests here</p>
            )}
          </SectionWrapper>
        );

      case "Languages":
        return (
          <SectionWrapper name="Languages">
            <h3 className="mb-3.5 border-b border-gray-500" style={headingStyle}>
              LANGUAGES
            </h3>
            {languages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang, idx) => (
                  <div key={idx} className="flex items-start" style={baseTextStyle}>
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-semibold" style={titleStyle}>
                        {lang.language}
                      </span>
                      {lang.proficiency && (
                        <span style={baseTextStyle}> — {lang.proficiency}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={placeholderStyle}>Add your languages here</p>
            )}
          </SectionWrapper>
        );

      case "Publications":
        return (
          <SectionWrapper name="Publications">
            <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
              PUBLICATIONS
            </h3>
            {publications.length > 0 ? (
              publications.map((pub, idx) => (
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
                  <div className="text-sm" style={baseTextStyle}>{pub.authors}</div>
                  <div className="text-sm" style={baseTextStyle}>
                    <span className="italic">{pub.publicationName}</span>
                    {pub.date && <> • {formatDate(pub.date)}</>}
                  </div>
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>Add your publications here</p>
            )}
          </SectionWrapper>
        );

      case "References":
        return (
          <SectionWrapper name="References">
            <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
              REFERENCES
            </h3>
            {references.length > 0 ? (
              references.map((ref, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="font-semibold" style={titleStyle}>
                    {ref.name}
                  </div>
                  {ref.relation && (
                    <div className="text-sm" style={baseTextStyle}>
                      {ref.relation}
                    </div>
                  )}
                  {ref.contact && (
                    <div className="text-sm" style={baseTextStyle}>
                      {ref.contact}
                    </div>
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

      <div className="flex justify-center bg-transparent py-6">
        <div className="bg-white rounded-lg w-[800px] px-10">
          <SectionWrapper name="PersonalInfo">
            <div className="text-center mb-6 page-break-inside-avoid">
              <h1 className="uppercase font-bold mb-1" style={nameStyle}>
                {personalInfo.fullName || "Full Name"}
              </h1>
              <div
                className="flex items-center justify-center flex-wrap gap-2 text-xs"
                style={baseTextStyle}
              >
                {[
                  personalInfo.email && personalInfo.email,
                  personalInfo.phone && personalInfo.phone,
                  personalInfo.location && personalInfo.location,
                  personalInfo.linkedinUrl && (
                    <a
                      href={personalInfo.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                      className="hover:underline"
                    >
                      {personalInfo.linkedinUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                    </a>
                  ),
                  personalInfo.githubUrl && (
                    <a
                      href={personalInfo.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                      className="hover:underline"
                    >
                      {personalInfo.githubUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                    </a>
                  ),
                  personalInfo.portifolioUrl && (
                    <a
                      href={personalInfo.portifolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                      className="hover:underline"
                    >
                      {personalInfo.portifolioUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")}
                    </a>
                  ),
                ]
                  .filter(Boolean)
                  .map((item, index, array) => (
                    <React.Fragment key={index}>
                      {item}
                      {index < array.length - 1 && <span>|</span>}
                    </React.Fragment>
                  ))}
              </div>
            </div>
          </SectionWrapper>

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

export default TemplateTwo;