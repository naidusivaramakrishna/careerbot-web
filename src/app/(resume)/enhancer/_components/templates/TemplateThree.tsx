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

const TemplateThree: React.FC<Props> = ({
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
  };

  const nameStyle: React.CSSProperties = {
    fontSize: resumeStyle.nameFontSize || "26px",
    fontWeight: 800,
    color: "#111827",
    textTransform: "uppercase",
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

  /* ---------- SectionWrapper with clickable links fix ---------- */
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
        {/* Hover dotted border */}
        <div className="absolute inset-0 rounded-md border border-dashed border-gray-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />

        {/* TOP: move up */}
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

        {/* BOTTOM: move down */}
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

        {/* Content above overlay → links clickable */}
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
            <div style={headingContainerStyle}>
              <h2 style={headingStyle}>Summary</h2>
              <div style={headingLineStyle}></div>
            </div>
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
          </SectionWrapper>
        );

      case "Experience":
        return (
          <SectionWrapper name="Experience">
            <div
              style={headingContainerStyle}
              className="page-break-after-avoid"
            >
              <h2 style={headingStyle}>Experience</h2>
              <div style={headingLineStyle}></div>
            </div>
            {workExperience.length > 0 ? (
              workExperience.map((exp, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold" style={baseTextStyle}>
                      {exp.company}
                    </h3>
                    <span
                      className="text-sm whitespace-nowrap ml-4"
                      style={baseTextStyle}
                    >
                      {exp.duration || "– Present"}
                    </span>
                  </div>
                  <div className="font-semibold mb-1.5" style={titleStyle}>
                    {exp.role}
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
          </SectionWrapper>
        );

      case "Education":
        return (
          <SectionWrapper name="Education">
            <div
              style={headingContainerStyle}
              className="page-break-after-avoid"
            >
              <h2 style={headingStyle}>Education</h2>
              <div style={headingLineStyle}></div>
            </div>
            {education.length > 0 ? (
              education.map((edu, idx) => (
                <div key={idx} className="mb-2 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <div className="font-bold" style={titleStyle}>
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
                    <div
                      className="text-sm whitespace-nowrap ml-4"
                      style={baseTextStyle}
                    >
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
            <div
              style={headingContainerStyle}
              className="page-break-after-avoid"
            >
              <h2 style={headingStyle}>Projects</h2>
              <div style={headingLineStyle}></div>
            </div>
            {projects.length > 0 ? (
              projects.map((proj, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div
                      className="font-bold flex items-center"
                      style={titleStyle}
                    >
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
                      <span
                        className="text-sm whitespace-nowrap ml-4"
                        style={baseTextStyle}
                      >
                        {formatDate(proj.startDate)} –{" "}
                        {formatDate(proj.endDate)}
                      </span>
                    )}
                    {proj.client && (
                      <span className="text-sm ml-4" style={baseTextStyle}>
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
            <div style={headingContainerStyle}>
              <h2 style={headingStyle}>Skills</h2>
              <div style={headingLineStyle}></div>
            </div>
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
                  <li key={idx}>{skill}</li>
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
            <div
              style={headingContainerStyle}
              className="page-break-after-avoid"
            >
              <h2 style={headingStyle}>Internships</h2>
              <div style={headingLineStyle}></div>
            </div>
            {internships.length > 0 ? (
              internships.map((intern, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold" style={baseTextStyle}>
                      {intern.company}
                    </h3>
                    {intern.duration && (
                      <span
                        className="text-sm whitespace-nowrap ml-4"
                        style={baseTextStyle}
                      >
                        {intern.duration}
                      </span>
                    )}
                  </div>
                  <div className="font-semibold mb-1.5" style={titleStyle}>
                    {intern.role}
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
          </SectionWrapper>
        );

      case "Certificates":
        return (
          <SectionWrapper name="Certificates">
            <div
              style={headingContainerStyle}
              className="page-break-after-avoid"
            >
              <h2 style={headingStyle}>Certificates</h2>
              <div style={headingLineStyle}></div>
            </div>
            {certifications.length > 0 ? (
              certifications.map((cert, idx) => (
                <div key={idx} className="mb-2 flex items-start">
                  <span className="mr-2" style={baseTextStyle}>
                    •
                  </span>
                  <div style={baseTextStyle}>
                    <div>
                      <span className="font-medium" style={titleStyle}>
                        {cert.name}
                      </span>
                      <span>{cert.issuedBy ? ', ' + cert.issuedBy : ''}</span>
                    </div>
                      <div className="text-xs mt-0.5">
                      {cert.year && <span>{cert.year}</span>}
                      {cert.expiryDate && (
                        <span className="ml-3">
                          Expires: {cert.expiryDate}
                        </span>
                      )}
                    </div>
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
          </SectionWrapper>
        );

      case "Achievements":
        return (
          <SectionWrapper name="Achievements">
            <div
              style={headingContainerStyle}
              className="page-break-after-avoid"
            >
              <h2 style={headingStyle}>Achievements</h2>
              <div style={headingLineStyle}></div>
            </div>
            {achievements.length > 0 ? (
              achievements.map((achievement, idx) => (
                <div key={idx} className="mb-2 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-semibold" style={titleStyle}>
                      {achievement.title}
                    </span>
                    {achievement.date && (
                      <span
                        className="text-sm whitespace-nowrap ml-4"
                        style={baseTextStyle}
                      >
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
          </SectionWrapper>
        );

      case "Awards":
        return (
          <SectionWrapper name="Awards">
            <div
              style={headingContainerStyle}
              className="page-break-after-avoid"
            >
              <h2 style={headingStyle}>Awards</h2>
              <div style={headingLineStyle}></div>
            </div>
            {awards.length > 0 ? (
              awards.map((award, idx) => (
                <div
                  key={idx}
                  className="mb-1.5 flex items-start"
                  style={baseTextStyle}
                >
                  <span className="mr-2">•</span>
                  <div>
                    <span className="font-semibold" style={titleStyle}>
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
          </SectionWrapper>
        );

      case "Volunteering":
        return (
          <SectionWrapper name="Volunteering">
            <div
              style={headingContainerStyle}
              className="page-break-after-avoid"
            >
              <h2 style={headingStyle}>Volunteering</h2>
              <div style={headingLineStyle}></div>
            </div>
            {volunteering.length > 0 ? (
              volunteering.map((vol, idx) => (
                <div key={idx} className="mb-2 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <div className="font-bold" style={titleStyle}>
                        {vol.role}
                      </div>
                      <div className="text-sm" style={baseTextStyle}>
                        {vol.organization}
                      </div>
                    </div>
                    <div
                      className="text-sm whitespace-nowrap ml-4"
                      style={baseTextStyle}
                    >
                      {formatDate(vol.startDate)} –{" "}
                      {formatDate(vol.endDate)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={placeholderStyle}>
                Add your volunteering experience here
              </p>
            )}
          </SectionWrapper>
        );

      case "Hobbies":
        return (
          <SectionWrapper name="Hobbies">
            <div style={headingContainerStyle}>
              <h2 style={headingStyle}>Hobbies</h2>
              <div style={headingLineStyle}></div>
            </div>
            {hobbies.length > 0 ? (
              hobbies.map((hobby, idx) => (
                <div key={idx} className="mb-1.5">
                  <span className="font-semibold" style={titleStyle}>
                    {hobby.name}
                  </span>
                  {hobby.description && (
                    <span
                      className="resume-description"
                      style={baseTextStyle}
                      dangerouslySetInnerHTML={{
                        __html: ` — ${hobby.description}`,
                      }}
                    />
                  )}
                  {hobby.proficiencyLevel && (
                    <span className="text-sm" style={baseTextStyle}>
                      {" "}
                      ({hobby.proficiencyLevel})
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
            <div style={headingContainerStyle}>
              <h2 style={headingStyle}>Interests</h2>
              <div style={headingLineStyle}></div>
            </div>
            {interests.length > 0 ? (
              interests.map((interest, idx) => (
                <div key={idx} className="mb-1.5">
                  <span className="font-semibold" style={titleStyle}>
                    {interest.name}
                  </span>
                  {interest.category && (
                    <span className="text-sm" style={baseTextStyle}>
                      {" "}
                      ({interest.category})
                    </span>
                  )}
                  {interest.description && (
                    <span
                      className="resume-description"
                      style={baseTextStyle}
                      dangerouslySetInnerHTML={{
                        __html: ` — ${interest.description}`,
                      }}
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
            <div style={headingContainerStyle}>
              <h2 style={headingStyle}>Languages</h2>
              <div style={headingLineStyle}></div>
            </div>
            {languages.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5">
                {languages.map((lang, idx) => (
                  <div
                    key={idx}
                    className="flex items-start"
                    style={baseTextStyle}
                  >
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-semibold" style={titleStyle}>
                        {lang.language}
                      </span>
                      {lang.proficiency && <span> — {lang.proficiency}</span>}
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
            <div
              style={headingContainerStyle}
              className="page-break-after-avoid"
            >
              <h2 style={headingStyle}>Publications</h2>
              <div style={headingLineStyle}></div>
            </div>
            {publications.length > 0 ? (
              publications.map((pub, idx) => (
                <div key={idx} className="mb-2 page-break-inside-avoid">
                  <div
                    className="font-semibold flex items-center"
                    style={titleStyle}
                  >
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
              ))
            ) : (
              <p style={placeholderStyle}>Add your publications here</p>
            )}
          </SectionWrapper>
        );

      case "References":
        return (
          <SectionWrapper name="References">
            <div
              style={headingContainerStyle}
              className="page-break-after-avoid"
            >
              <h2 style={headingStyle}>References</h2>
              <div style={headingLineStyle}></div>
            </div>
            {references.length > 0 ? (
              references.map((ref, idx) => (
                <div key={idx} className="mb-2 page-break-inside-avoid">
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
          {/* Personal Info - Layout unchanged, URLs now show real domain */}
          <SectionWrapper name="PersonalInfo">
            <div className="mb-4 page-break-inside-avoid">
              <div className="mb-2">
                <h1 className="uppercase font-bold" style={nameStyle}>
                  {personalInfo.fullName || "FULL NAME"}
                </h1>
              </div>

              <div
                className="flex items-center text-sm mb-3 flex-wrap"
                style={baseTextStyle}
              >
                {personalInfo.email && <span>{personalInfo.email}</span>}
                {personalInfo.phone && (
                  <>
                    {personalInfo.email && <span className="mx-2">|</span>}
                    <span>{personalInfo.phone}</span>
                  </>
                )}
                {personalInfo.location && (
                  <>
                    {(personalInfo.email || personalInfo.phone) && (
                      <span className="mx-2">|</span>
                    )}
                    <span>{personalInfo.location}</span>
                  </>
                )}
                {personalInfo.linkedinUrl && (
                  <>
                    {(personalInfo.email ||
                      personalInfo.phone ||
                      personalInfo.location) && (
                      <span className="mx-2">|</span>
                    )}
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
                  </>
                )}
                {personalInfo.githubUrl && (
                  <>
                    {(personalInfo.email ||
                      personalInfo.phone ||
                      personalInfo.location ||
                      personalInfo.linkedinUrl) && (
                      <span className="mx-2">|</span>
                    )}
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
                  </>
                )}
                {personalInfo.portifolioUrl && (
                  <>
                    {(personalInfo.email ||
                      personalInfo.phone ||
                      personalInfo.location ||
                      personalInfo.linkedinUrl ||
                      personalInfo.githubUrl) && (
                      <span className="mx-2">|</span>
                    )}
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
                  </>
                )}
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

export default TemplateThree;