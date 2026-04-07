import React, { useEffect } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { RESUME_FONTS } from "./ResumeHeader";

interface JobMatchTemplateProps {
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  activeSection?: string | null;
  editOverrides?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  addedFields?: Record<string, string[]>;
  onEditSection?: (key: string) => void;
  onDeleteSection?: (key: string) => void;
  deletedSections?: string[];
  fontFamily?: string;
}

const JobMatchTemplate: React.FC<JobMatchTemplateProps> = ({ data, activeSection, editOverrides, addedFields, onEditSection, onDeleteSection, deletedSections, fontFamily }) => {
  const deleted = deletedSections ?? [];
  const af = addedFields ?? {};

  /* ── green highlight helper (matches resume enhancer style) ── */
  const hlStyle: React.CSSProperties = { backgroundColor: "rgba(34,197,94,0.25)", borderRadius: "3px", padding: "0 2px" };
  const hl = (section: string, field: string, value: React.ReactNode): React.ReactNode =>
    (af[section] || []).includes(field) ? <span style={hlStyle}>{value}</span> : <>{value}</>;
  const hlIdx = (section: string, idx: number): boolean =>
    (af[section] || []).includes(String(idx));

  /* ── load Google Font when fontFamily changes ── */
  useEffect(() => {
    const font = RESUME_FONTS.find(f => f.value === fontFamily);
    if (!font?.googleFont) return;
    const id = `gf-${font.googleFont.replace(/[^a-z0-9]/gi, "")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${font.googleFont}&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);

  const sc = (key: string) =>
    `mb-5 rounded transition-colors duration-200 relative group/section ${activeSection === key ? "bg-blue-50 ring-1 ring-blue-100 px-2 -mx-2" : ""}`;
  const ov = editOverrides ?? {};

  /* ── action buttons – appear on section hover ── */
  const SectionActions = ({ sectionKey }: { sectionKey: string }) =>
    (onEditSection || onDeleteSection) ? (
      <div className="absolute top-1/2 -translate-y-1/2 right-0 opacity-0 group-hover/section:opacity-100 transition-opacity duration-200 z-10 flex items-center gap-1">
        {onEditSection && (
          <button
            onClick={() => onEditSection(sectionKey)}
            title="Edit section"
            className="bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:bg-blue-50 hover:border-blue-400 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
          </button>
        )}
        {onDeleteSection && (
          <button
            onClick={() => onDeleteSection(sectionKey)}
            title="Remove section"
            className="bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:bg-red-50 hover:border-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        )}
      </div>
    ) : null;
  // Extract parsed_data - this is where your backend stores the resume content
  const parsedData = data?.parsed_data || data || {};
  const llmData = parsedData?.llm_data || {};

  // ============================================
  // PERSONAL INFO / CONTACT
  // ============================================
  const contact = data?.contact || parsedData.contact || llmData.contact || llmData.personal_info || {};

  const name =
    ov.contact?.name ||
    data?.contact?.name ||
    data?.contact?.full_name ||
    data?.contact?.fullName ||
    contact.name ||
    contact.full_name ||
    contact.fullName ||
    parsedData.name ||
    parsedData.full_name ||
    parsedData.fullName ||
    llmData.name ||
    llmData.full_name ||
    llmData.fullName ||
    llmData.personal_info?.name ||
    llmData.personal_info?.full_name ||
    llmData.personal_info?.fullName ||
    parsedData.personalInfo?.fullName ||
    "Your Name";

  const title =
    ov.contact?.title ||
    contact.title ||
    contact.role ||
    contact.designation ||
    contact.job_title ||
    parsedData.title ||
    llmData.title ||
    "";

  const email =
    ov.contact?.email ||
    data?.contact?.email ||
    contact.email ||
    parsedData.email ||
    llmData.email ||
    llmData.personal_info?.email ||
    parsedData.personalInfo?.email ||
    "";

  const phone =
    ov.contact?.phone ||
    data?.contact?.phone ||
    data?.contact?.phone_number ||
    data?.contact?.mobile ||
    contact.phone ||
    contact.phone_number ||
    contact.mobile ||
    parsedData.phone ||
    parsedData.mobile ||
    llmData.phone ||
    llmData.mobile ||
    llmData.personal_info?.phone ||
    llmData.personal_info?.mobile ||
    parsedData.personalInfo?.phone ||
    "";

  const location =
    ov.contact?.location ||
    data?.contact?.location ||
    data?.contact?.address ||
    contact.location ||
    contact.address ||
    parsedData.location ||
    llmData.location ||
    llmData.personal_info?.location ||
    parsedData.personalInfo?.location ||
    "";

  // Social links
  const socialLinks = parsedData.social_links || llmData.social_links || parsedData.personalInfo || {};
  const toStr = (v: any) => (typeof v === "string" ? v : ""); // eslint-disable-line @typescript-eslint/no-explicit-any
  const linkedin = toStr(ov.contact?.linkedin || socialLinks.linkedIn || socialLinks.linkedin || socialLinks.linkedinUrl || contact.linkedin);
  const github = toStr(ov.contact?.github || socialLinks.github || socialLinks.GitHub || socialLinks.githubUrl || contact.github);
  const portfolio = toStr(ov.contact?.portfolio || socialLinks.portfolio || socialLinks.website || socialLinks.portifolioUrl || contact.website);

  // ============================================
  // PROFESSIONAL SUMMARY / CAREER OBJECTIVE
  // ============================================
  let professionalSummary = ov.summary ?? (
    parsedData.professionalSummary ||
    parsedData.professional_summary ||
    parsedData.career_objective ||
    parsedData.objective ||
    parsedData.summary ||
    llmData.professionalSummary ||
    llmData.professional_summary ||
    llmData.career_objective ||
    llmData.objective ||
    llmData.summary ||
    "");

  if (typeof professionalSummary === 'string' && professionalSummary.startsWith('{')) {
    try {
      const parsed = JSON.parse(professionalSummary);
      professionalSummary = parsed.summary || parsed.objective || professionalSummary;
    } catch {
      // Keep original
    }
  }

  // ============================================
  // EDUCATION
  // ============================================
  let education = ov.education ?? (
    parsedData.education ||
    parsedData.educational_qualifications ||
    llmData.education ||
    llmData.educational_qualifications ||
    []);
  if (!Array.isArray(education)) education = [];

  // ============================================
  // WORK EXPERIENCE
  // ============================================
  let workExperience = ov.experience ?? (
    parsedData.workExperience ||
    parsedData.work_experience ||
    parsedData.experience ||
    parsedData.professional_experience ||
    parsedData.employment_history ||
    parsedData.jobs ||
    llmData.workExperience ||
    llmData.work_experience ||
    llmData.experience ||
    llmData.professional_experience ||
    llmData.employment_history ||
    llmData.jobs ||
    []);
  if (!Array.isArray(workExperience)) workExperience = [];
  workExperience = workExperience.filter((exp: any) => exp.company || exp.role || exp.title || exp.position || exp.organization || exp.employer); // eslint-disable-line @typescript-eslint/no-explicit-any

  // ============================================
  // PROJECTS
  // ============================================
  let projects = ov.projects ?? (
    parsedData.projects ||
    parsedData.project_details ||
    llmData.projects ||
    llmData.project_details ||
    []);
  if (!Array.isArray(projects)) projects = [];

  // ============================================
  // SKILLS (Technical)
  // ============================================
  let skills = ov.skills ?? (parsedData.skills || parsedData.technical_skills || llmData.skills || llmData.technical_skills || []);
  if (!Array.isArray(skills)) {
    if (typeof skills === 'object') {
      skills = Object.values(skills).flat();
    } else {
      skills = [];
    }
  }
  skills = skills.map((s: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (typeof s === 'object' && s !== null) {
      return s.skill || s.name || s;
    }
    return s;
  }).filter(Boolean);

  // Add newly_added_skills (TECHNICAL only) if present — skip when override is active
  const newlyAddedSkills: string[] = ov.skills ? [] : (data?.newly_added_skills || []);
  const newlyAddedSkillsSet = new Set(newlyAddedSkills.map((s: string) => s.toLowerCase()));
  if (Array.isArray(newlyAddedSkills) && newlyAddedSkills.length > 0) {
    skills = [...skills, ...newlyAddedSkills];
  }

  // ============================================
  // SOFT SKILLS
  // ============================================
  let softSkills = ov.softSkills ?? (parsedData.soft_skills || llmData.soft_skills || []);
  if (!Array.isArray(softSkills)) softSkills = [];
  softSkills = softSkills.map((s: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (typeof s === 'object' && s !== null) {
      return s.skill || s.name || s;
    }
    return s;
  }).filter(Boolean);

  // Add newly_added_soft_skills (SOFT only) if present
  const newlyAddedSoftSkills: string[] = data?.newly_added_soft_skills || [];
  const newlyAddedSoftSkillsSet = new Set(newlyAddedSoftSkills.map((s: string) => s.toLowerCase()));
  if (Array.isArray(newlyAddedSoftSkills) && newlyAddedSoftSkills.length > 0) {
    softSkills = [...softSkills, ...newlyAddedSoftSkills];
  }


  // ============================================
  // INTERNSHIPS
  // ============================================
  let internships = ov.internships ?? (
    parsedData.internships ||
    parsedData.internship_details ||
    parsedData.internship_experience ||
    llmData.internships ||
    llmData.internship_details ||
    llmData.internship_experience ||
    []);
  if (!Array.isArray(internships)) internships = [];

  // ============================================
  // CERTIFICATIONS
  // ============================================
  let certifications = ov.certifications ?? (
    parsedData.certifications ||
    parsedData.certificates ||
    parsedData.certification_details ||
    parsedData.professional_certifications ||
    parsedData.courses ||
    parsedData.training ||
    llmData.certifications ||
    llmData.certificates ||
    llmData.certification_details ||
    llmData.professional_certifications ||
    llmData.courses ||
    llmData.training ||
    []);
  if (!Array.isArray(certifications)) certifications = [];

  // ============================================
  // ACHIEVEMENTS
  // ============================================
  let achievements = ov.achievements ?? (parsedData.achievements || llmData.achievements || []);
  if (!Array.isArray(achievements)) achievements = [];

  // ============================================
  // AWARDS
  // ============================================
  let awards = parsedData.awards || llmData.awards || [];
  if (!Array.isArray(awards)) awards = [];

  // ============================================
  // VOLUNTEERING
  // ============================================
  let volunteering = parsedData.volunteering || llmData.volunteering || [];
  if (!Array.isArray(volunteering)) volunteering = [];

  // ============================================
  // HOBBIES
  // ============================================
  let hobbies = parsedData.hobbies || llmData.hobbies || [];
  if (!Array.isArray(hobbies)) hobbies = [];

  // ============================================
  // INTERESTS
  // ============================================
  let interests = parsedData.interests || llmData.interests || [];
  if (!Array.isArray(interests)) interests = [];

  // ============================================
  // LANGUAGES
  // ============================================
  let languages = ov.languages ?? (
    parsedData.languages ||
    parsedData.languages_known ||
    llmData.languages ||
    llmData.languages_known ||
    []);
  if (typeof languages === 'string') {
    languages = languages.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(languages)) languages = [];

  // ============================================
  // PUBLICATIONS
  // ============================================
  let publications = parsedData.publications || llmData.publications || [];
  if (!Array.isArray(publications)) publications = [];

  // ============================================
  // REFERENCES
  // ============================================
  let references = parsedData.references || llmData.references || [];
  if (!Array.isArray(references)) references = [];

  // ============================================
  // PERSONAL DETAILS (for fresher resumes)
  // ============================================
  const personalDetails = parsedData.personal_details || llmData.personal_details || {};

  // ============================================
  // EXTRACURRICULAR / CERTIFICATE OF PARTICIPATION
  // ============================================
  let participations =
    parsedData.certificate_of_participation ||
    llmData.certificate_of_participation ||
    parsedData.extracurricular_activities ||
    llmData.extracurricular_activities ||
    parsedData.activities ||
    llmData.activities ||
    [];
  if (!Array.isArray(participations)) participations = [];

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    if (/^[A-Za-z]{3}\s\d{2,4}$/.test(dateString)) return dateString;

    if (/^\d{4}-\d{2}$/.test(dateString)) {
      const [year, month] = dateString.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = parseInt(month, 10) - 1;
      return `${monthNames[monthIndex]} ${year}`;
    }

    return dateString;
  };

  // Parse description to array
  const parseDescription = (desc: any): string[] => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!desc) return [];
    if (Array.isArray(desc)) return desc.filter(Boolean);
    if (typeof desc === 'string') {
      // Try to split by common delimiters
      return desc.split(/\n+|•|\*|-(?=\s)/).map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  };

  // ============================================
  // STYLES
  // ============================================
  const headingStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "0.75rem",
    paddingBottom: "4px",
    borderBottom: "1px solid #9ca3af",
    color: "#111827",
  };

  return (
    <div className="bg-white w-full" style={{ fontFamily: fontFamily || "Inter, ui-sans-serif, sans-serif" }}>
      <div className="max-w-[850px] mx-auto p-6">

        {/* ============================================ */}
        {/* HEADER / PERSONAL INFO */}
        {/* ============================================ */}
        <div id="resume-section-contact" className={`text-center pb-4 mb-5 border-b-2 border-gray-800 ${sc("contact")}`}>
          <SectionActions sectionKey="contact" />
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide mb-1">
            {hl('contact', 'name', name)}
          </h1>
          {title && (
            <p className="text-sm font-medium text-gray-600 mb-2">
              {hl('contact', 'title', title)}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-gray-700">
            {email && <span>{hl('contact', 'email', email)}</span>}
            {email && (phone || location) && <span>|</span>}
            {phone && <span>{hl('contact', 'phone', phone)}</span>}
            {phone && location && <span>|</span>}
            {location && <span>{hl('contact', 'location', location)}</span>}
            {linkedin && (
              <>
                <span>|</span>
                <a href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                   className="text-gray-700 hover:underline" target="_blank" rel="noopener noreferrer">
                  {hl('contact', 'linkedin', 'LinkedIn')}
                </a>
              </>
            )}
            {github && (
              <>
                <span>|</span>
                <a href={github.startsWith('http') ? github : `https://${github}`}
                   className="text-gray-700 hover:underline" target="_blank" rel="noopener noreferrer">
                  {hl('contact', 'github', 'GitHub')}
                </a>
              </>
            )}
            {portfolio && (
              <>
                <span>|</span>
                <a href={portfolio.startsWith('http') ? portfolio : `https://${portfolio}`}
                   className="text-gray-700 hover:underline" target="_blank" rel="noopener noreferrer">
                  {hl('contact', 'portfolio', 'Portfolio')}
                </a>
              </>
            )}
          </div>
        </div>

        {/* ============================================ */}
        {/* PROFESSIONAL SUMMARY */}
        {/* ============================================ */}
        {!deleted.includes('summary') && professionalSummary && (
          <div id="resume-section-summary" className={sc("summary")}>
            <SectionActions sectionKey="summary" />
            <h2 style={headingStyle}>SUMMARY</h2>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">
              {hl('summary', 'text', professionalSummary)}
            </p>
          </div>
        )}

        {/* ============================================ */}
        {/* TECHNICAL SKILLS */}
        {/* ============================================ */}
        {!deleted.includes('skills') && skills.length > 0 && (
          <div id="resume-section-skills" className={sc("skills")}>
            <SectionActions sectionKey="skills" />
            <h2 style={headingStyle}>TECHNICAL SKILLS</h2>
            <ul className="list-disc pl-5 grid grid-cols-3 gap-x-6 gap-y-1 text-sm text-gray-700">
              {skills.map((skill: string, idx: number) => {
                const editorAdded = new Set((af.skills || []).map((s: string) => s.toLowerCase()));
                const isNew = newlyAddedSkillsSet.has(skill.toLowerCase()) || editorAdded.has(skill.toLowerCase());
                return (
                  <li key={idx}>
                    {isNew ? (
                      <span style={hlStyle}>{skill}</span>
                    ) : skill}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ============================================ */}
        {/* SOFT SKILLS */}
        {/* ============================================ */}
        {!deleted.includes('softSkills') && softSkills.length > 0 && (
          <div id="resume-section-softSkills" className={sc("softSkills")}>
            <SectionActions sectionKey="softSkills" />
            <h2 style={headingStyle}>SOFT SKILLS</h2>
            <ul className="list-disc pl-5 grid grid-cols-3 gap-x-6 gap-y-1 text-sm text-gray-700">
              {softSkills.map((skill: string, idx: number) => {
                const editorAdded = new Set((af.softSkills || []).map((s: string) => s.toLowerCase()));
                const isNew = newlyAddedSoftSkillsSet.has(skill.toLowerCase()) || editorAdded.has(skill.toLowerCase());
                return (
                  <li key={idx}>
                    {isNew ? (
                      <span style={hlStyle}>{skill}</span>
                    ) : skill}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ============================================ */}
        {/* WORK EXPERIENCE */}
        {/* ============================================ */}
        {!deleted.includes('experience') && workExperience.length > 0 && (
          <div id="resume-section-experience" className={sc("experience")}>
            <SectionActions sectionKey="experience" />
            <h2 style={headingStyle}>WORK EXPERIENCE</h2>
            {workExperience.map((exp: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const role = exp.role || exp.title || exp.position || "";
              const company = exp.company || exp.organization || exp.employer || "";
              const expLocation = exp.location || "";
              const startDate = exp.startDate || exp.start_date || exp.from || exp.start || "";
              const endDate = exp.currentlyWorking ? "Present" : (exp.endDate || exp.end_date || exp.to || exp.end || "");
              const description = parseDescription(exp.description || exp.responsibilities || exp.key_contributions);

              const itemChanged = hlIdx('experience', idx);
              return (
                <div key={idx} className="mb-4" style={itemChanged ? { borderLeft: "3px solid rgba(34,197,94,0.6)", paddingLeft: "8px", backgroundColor: "rgba(34,197,94,0.07)", borderRadius: "0 4px 4px 0" } : undefined}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-bold text-sm text-gray-900">{role}</div>
                      <div className="text-sm text-gray-700">{company}{expLocation && `, ${expLocation}`}</div>
                    </div>
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(startDate)}{startDate && endDate ? " – " : ""}{formatDate(endDate)}
                    </div>
                  </div>
                  {description.length > 0 && (
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-gray-700">
                      {description.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* EDUCATION */}
        {/* ============================================ */}
        {!deleted.includes('education') && education.length > 0 && (
          <div id="resume-section-education" className={sc("education")}>
            <SectionActions sectionKey="education" />
            <h2 style={headingStyle}>EDUCATION</h2>
            {education.map((edu: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const degree = edu.degree || edu.qualification || edu.program || "";
              const school = edu.school || edu.institution || edu.university || edu.college || "";
              const branch = edu.branch || edu.field || edu.specialization || "";
              const startDate = edu.startDate || edu.start_date || edu.from || "";
              const endDate = edu.endDate || edu.end_date || edu.to || edu.graduation_year || edu.passed_out || edu.year || "";
              const grade = edu.grade || edu.gpa || edu.GPA || edu.cgpa || edu.CGPA || edu.percentage || "";

              const itemChanged = hlIdx('education', idx);
              return (
                <div key={idx} className="mb-3" style={itemChanged ? { borderLeft: "3px solid rgba(34,197,94,0.6)", paddingLeft: "8px", backgroundColor: "rgba(34,197,94,0.07)", borderRadius: "0 4px 4px 0" } : undefined}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-gray-900">
                        {degree}{branch && ` in ${branch}`}
                      </div>
                      <div className="text-sm text-gray-700">{school}</div>
                      {grade && <div className="text-xs text-gray-600">Grade: {grade}</div>}
                    </div>
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(startDate)}{startDate && endDate ? " – " : ""}{formatDate(endDate)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* PROJECTS */}
        {/* ============================================ */}
        {!deleted.includes('projects') && projects.length > 0 && (
          <div id="resume-section-projects" className={sc("projects")}>
            <SectionActions sectionKey="projects" />
            <h2 style={headingStyle}>PROJECTS</h2>
            {projects.map((proj: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const title = proj.title || proj.name || proj.projectName || "";
              const link = proj.link || proj.url || "";
              const startDate = proj.startDate || proj.start_date || "";
              const endDate = proj.endDate || proj.end_date || proj.date || proj.period || "";
              const description = proj.description || proj.summary || "";
              const technologies = proj.technologies || proj.techStack || proj.tools || [];
              const responsibilities = parseDescription(proj.responsibilities || proj.key_contributions || proj.contributions);

              const itemChanged = hlIdx('projects', idx);
              return (
                <div key={idx} className="mb-4" style={itemChanged ? { borderLeft: "3px solid rgba(34,197,94,0.6)", paddingLeft: "8px", backgroundColor: "rgba(34,197,94,0.07)", borderRadius: "0 4px 4px 0" } : undefined}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      {title}
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                          [Link]
                        </a>
                      )}
                    </div>
                    {(startDate || endDate) && (
                      <div className="text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(startDate)}{startDate && endDate ? " – " : ""}{formatDate(endDate)}
                      </div>
                    )}
                  </div>
                  {description && <p className="text-sm text-gray-700 mb-1">{description}</p>}
                  {responsibilities.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {responsibilities.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {technologies.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Technologies:</span>{" "}
                      {Array.isArray(technologies) ? technologies.join(", ") : technologies}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* INTERNSHIPS */}
        {/* ============================================ */}
        {!deleted.includes('internships') && internships.length > 0 && (
          <div id="resume-section-internships" className={sc("internships")}>
            <SectionActions sectionKey="internships" />
            <h2 style={headingStyle}>INTERNSHIPS</h2>
            {internships.map((intern: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const role = intern.role || intern.title || intern.position || "";
              const company = intern.company || intern.organization || "";
              const internLocation = intern.location || "";
              const startDate = intern.startDate || intern.start_date || intern.from || "";
              const endDate = intern.currentlyWorking ? "Present" : (intern.endDate || intern.end_date || intern.to || intern.duration || "");
              const description = parseDescription(intern.description || intern.responsibilities || intern.key_contributions);

              const itemChanged = hlIdx('internships', idx);
              return (
                <div key={idx} className="mb-4" style={itemChanged ? { borderLeft: "3px solid rgba(34,197,94,0.6)", paddingLeft: "8px", backgroundColor: "rgba(34,197,94,0.07)", borderRadius: "0 4px 4px 0" } : undefined}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-bold text-sm text-gray-900">{company}</div>
                      <div className="text-sm font-medium text-gray-700">{role}{internLocation && `, ${internLocation}`}</div>
                    </div>
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(startDate)}{startDate && endDate ? " – " : ""}{formatDate(endDate)}
                    </div>
                  </div>
                  {description.length > 0 && (
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-gray-700">
                      {description.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* CERTIFICATIONS */}
        {/* ============================================ */}
        {!deleted.includes('certifications') && certifications.length > 0 && (
          <div id="resume-section-certifications" className={sc("certifications")}>
            <SectionActions sectionKey="certifications" />
            <h2 style={headingStyle}>CERTIFICATIONS</h2>
            {certifications.map((cert: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const certName = typeof cert === 'string' ? cert : (cert.name || cert.title || cert.certification || "");
              const issuedBy = typeof cert === 'object' ? (cert.issuedBy || cert.issued_by || cert.issuer || "") : "";
              const year = typeof cert === 'object' ? (cert.year || cert.date || "") : "";
              const expiryDate = typeof cert === 'object' ? (cert.expiryDate || cert.expiry_date || "") : "";
              const credentialId = typeof cert === 'object' ? (cert.credentialId || cert.credential_id || "") : "";

              if (!certName) return null;

              const itemChanged = hlIdx('certifications', idx);
              return (
                <div key={idx} className="mb-2 flex items-start text-sm text-gray-700" style={itemChanged ? { backgroundColor: "rgba(34,197,94,0.12)", borderRadius: "3px", padding: "2px 4px" } : undefined}>
                  <span className="mr-2">•</span>
                  <div>
                    <span className="font-medium">{certName}</span>
                    {issuedBy && <span>{', ' + issuedBy}</span>}
                    {year && <span className="text-xs ml-2">({year})</span>}
                    {expiryDate && <span className="text-xs ml-2">(Expires: {expiryDate})</span>}
                    {credentialId && <div className="text-xs text-gray-500">Credential ID: {credentialId}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* ACHIEVEMENTS */}
        {/* ============================================ */}
        {!deleted.includes('achievements') && achievements.length > 0 && (
          <div id="resume-section-achievements" className={sc("achievements")}>
            <SectionActions sectionKey="achievements" />
            <h2 style={headingStyle}>ACHIEVEMENTS</h2>
            {achievements.map((achievement: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const title = typeof achievement === 'string' ? achievement : (achievement.title || achievement.name || "");
              const description = typeof achievement === 'object' ? (achievement.description || "") : "";
              const date = typeof achievement === 'object' ? (achievement.date || "") : "";

              if (!title) return null;

              const itemChanged = hlIdx('achievements', idx);
              return (
                <div key={idx} className="mb-2" style={itemChanged ? { backgroundColor: "rgba(34,197,94,0.12)", borderRadius: "3px", padding: "2px 4px" } : undefined}>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm text-gray-900">{title}</span>
                    {date && <span className="text-sm text-gray-600">{formatDate(date)}</span>}
                  </div>
                  {description && <p className="text-sm text-gray-700">{description}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* AWARDS */}
        {/* ============================================ */}
        {!deleted.includes('awards') && awards.length > 0 && (
          <div id="resume-section-awards" className={sc("awards")}>
            <SectionActions sectionKey="awards" />
            <h2 style={headingStyle}>AWARDS</h2>
            {awards.map((award: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const title = typeof award === 'string' ? award : (award.title || award.name || "");
              const issuedBy = typeof award === 'object' ? (award.issuedBy || award.issued_by || award.organization || "") : "";
              const year = typeof award === 'object' ? (award.year || award.date || "") : "";

              if (!title) return null;
              const itemChanged = hlIdx('awards', idx);
              return (
                <div key={idx} className="mb-2 flex items-start text-sm text-gray-700" style={itemChanged ? { backgroundColor: "rgba(34,197,94,0.12)", borderRadius: "3px", padding: "2px 4px" } : undefined}>
                  <span className="mr-2">•</span>
                  <div>
                    <span className="font-semibold">{title}</span>
                    {issuedBy && <span> — {issuedBy}</span>}
                    {year && <span> ({year})</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* VOLUNTEERING */}
        {/* ============================================ */}
        {!deleted.includes('volunteering') && volunteering.length > 0 && (
          <div id="resume-section-volunteering" className={sc("volunteering")}>
            <SectionActions sectionKey="volunteering" />
            <h2 style={headingStyle}>VOLUNTEERING</h2>
            {volunteering.map((vol: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const role = vol.role || vol.title || vol.position || "";
              const organization = vol.organization || vol.company || "";
              const startDate = vol.startDate || vol.start_date || "";
              const endDate = vol.endDate || vol.end_date || "";
              const description = vol.description || "";
              const itemChanged = hlIdx('volunteering', idx);
              return (
                <div key={idx} className="mb-3" style={itemChanged ? { borderLeft: "3px solid rgba(34,197,94,0.6)", paddingLeft: "8px", backgroundColor: "rgba(34,197,94,0.07)", borderRadius: "0 4px 4px 0" } : undefined}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-gray-900">{role}</div>
                      <div className="text-sm text-gray-700">{organization}</div>
                    </div>
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(startDate)}{startDate && endDate ? " – " : ""}{formatDate(endDate)}
                    </div>
                  </div>
                  {description && <p className="text-sm text-gray-700 mt-1">{description}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* HOBBIES */}
        {/* ============================================ */}
        {!deleted.includes('hobbies') && hobbies.length > 0 && (
          <div id="resume-section-hobbies" className={sc("hobbies")}>
            <SectionActions sectionKey="hobbies" />
            <h2 style={headingStyle}>HOBBIES</h2>
            <div className="text-sm text-gray-700">
              {hobbies.map((hobby: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                const hobbyName = typeof hobby === 'string' ? hobby : (hobby.name || hobby.title || "");
                const description = typeof hobby === 'object' ? (hobby.description || "") : "";
                const proficiencyLevel = typeof hobby === 'object' ? (hobby.proficiencyLevel || hobby.proficiency_level || "") : "";

                if (!hobbyName) return null;
                return (
                  <div key={idx} className="mb-1">
                    <span className="font-semibold">{hobbyName}</span>
                    {description && <span> — {description}</span>}
                    {proficiencyLevel && <span className="text-xs text-gray-500"> ({proficiencyLevel})</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* INTERESTS */}
        {/* ============================================ */}
        {!deleted.includes('interests') && interests.length > 0 && (
          <div id="resume-section-interests" className={sc("interests")}>
            <SectionActions sectionKey="interests" />
            <h2 style={headingStyle}>INTERESTS</h2>
            <div className="text-sm text-gray-700">
              {interests.map((interest: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                const interestName = typeof interest === 'string' ? interest : (interest.name || interest.title || "");
                const category = typeof interest === 'object' ? (interest.category || "") : "";
                const description = typeof interest === 'object' ? (interest.description || "") : "";

                if (!interestName) return null;
                return (
                  <div key={idx} className="mb-1">
                    <span className="font-semibold">{interestName}</span>
                    {category && <span className="text-xs text-gray-500"> ({category})</span>}
                    {description && <span> — {description}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* LANGUAGES */}
        {/* ============================================ */}
        {!deleted.includes('languages') && languages.length > 0 && (
          <div id="resume-section-languages" className={sc("languages")}>
            <SectionActions sectionKey="languages" />
            <h2 style={headingStyle}>LANGUAGES</h2>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              {languages.map((lang: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                const langName = typeof lang === 'string' ? lang : (lang.language || lang.name || "");
                const proficiency = typeof lang === 'object' ? (lang.proficiency || lang.level || "") : "";

                if (!langName) return null;

                const itemChanged = hlIdx('languages', idx);
                return (
                  <div key={idx} className="flex items-start" style={itemChanged ? { backgroundColor: "rgba(34,197,94,0.12)", borderRadius: "3px", padding: "2px 4px" } : undefined}>
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-semibold">{langName}</span>
                      {proficiency && <span> — {proficiency}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* PUBLICATIONS */}
        {/* ============================================ */}
        {!deleted.includes('publications') && publications.length > 0 && (
          <div id="resume-section-publications" className={sc("publications")}>
            <SectionActions sectionKey="publications" />
            <h2 style={headingStyle}>PUBLICATIONS</h2>
            {publications.map((pub: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const title = pub.title || pub.name || "";
              const authors = pub.authors || pub.author || "";
              const publicationName = pub.publicationName || pub.publication_name || pub.journal || pub.publisher || "";
              const date = pub.date || pub.year || "";
              const url = pub.url || pub.link || "";

              if (!title) return null;

              return (
                <div key={idx} className="mb-3">
                  <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    {title}
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                        [Link]
                      </a>
                    )}
                  </div>
                  {authors && <div className="text-sm text-gray-700">{authors}</div>}
                  <div className="text-sm text-gray-600">
                    {publicationName && <span className="italic">{publicationName}</span>}
                    {date && <span> • {formatDate(date)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* REFERENCES */}
        {/* ============================================ */}
        {!deleted.includes('references') && references.length > 0 && (
          <div id="resume-section-references" className={sc("references")}>
            <SectionActions sectionKey="references" />
            <h2 style={headingStyle}>REFERENCES</h2>
            {references.map((ref: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const refName = typeof ref === 'string' ? ref : (ref.name || "");
              const relation = typeof ref === 'object' ? (ref.relation || ref.title || ref.position || "") : "";
              const refContact = typeof ref === 'object' ? (ref.contact || ref.email || ref.phone || "") : "";

              if (!refName) return null;

              return (
                <div key={idx} className="mb-3">
                  <div className="font-semibold text-sm text-gray-900">{refName}</div>
                  {relation && <div className="text-sm text-gray-700">{relation}</div>}
                  {refContact && <div className="text-sm text-gray-600">{refContact}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* CERTIFICATE OF PARTICIPATION / EXTRACURRICULAR */}
        {/* ============================================ */}
        {!deleted.includes('extracurricular') && participations.length > 0 && (
          <div id="resume-section-extracurricular" className={sc("extracurricular")}>
            <SectionActions sectionKey="extracurricular" />
            <h2 style={headingStyle}>EXTRACURRICULAR ACTIVITIES</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              {participations.map((item: any, idx: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                const text = typeof item === 'string' ? item : (item.name || item.title || item.description || "");
                if (!text) return null;
                return <li key={idx}>{text}</li>;
              })}
            </ul>
          </div>
        )}

        {/* ============================================ */}
        {/* PERSONAL DETAILS */}
        {/* ============================================ */}
        {(personalDetails.father_name || personalDetails.mother_name || personalDetails.dob || personalDetails.date_of_birth) && (
          <div className="mb-5">
            <h2 style={headingStyle}>PERSONAL DETAILS</h2>
            <table className="text-sm text-gray-700">
              <tbody>
                {personalDetails.father_name && (
                  <tr>
                    <td className="pr-4 py-0.5">Father&apos;s Name</td>
                    <td className="py-0.5">: {personalDetails.father_name}</td>
                  </tr>
                )}
                {personalDetails.mother_name && (
                  <tr>
                    <td className="pr-4 py-0.5">Mother&apos;s Name</td>
                    <td className="py-0.5">: {personalDetails.mother_name}</td>
                  </tr>
                )}
                {(personalDetails.dob || personalDetails.date_of_birth) && (
                  <tr>
                    <td className="pr-4 py-0.5">Date of Birth</td>
                    <td className="py-0.5">: {personalDetails.dob || personalDetails.date_of_birth}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default JobMatchTemplate;
