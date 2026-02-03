import React from "react";

interface JobMatchTemplateProps {
  data: any;
}

const JobMatchTemplate: React.FC<JobMatchTemplateProps> = ({ data }) => {
  // Debug: log the data structure
  // // console.log("🔍 JobMatchTemplate FULL DATA:", data);
  // // console.log("🔍 data.parsed_data:", data?.parsed_data);

  // Extract parsed_data - this is where your backend stores the resume content
  const parsedData = data?.parsed_data || data || {};
  const llmData = parsedData?.llm_data || {};

  // // console.log("🔍 parsedData:", parsedData);
  // // console.log("🔍 llmData:", llmData);
  // // console.log("🔍 llmData.soft_skills:", llmData?.soft_skills);

  // ============================================
  // PERSONAL INFO / CONTACT
  // ============================================
  const contact = data?.contact || parsedData.contact || llmData.contact || llmData.personal_info || {};

  const name =
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

  const email =
    data?.contact?.email ||
    contact.email ||
    parsedData.email ||
    llmData.email ||
    llmData.personal_info?.email ||
    parsedData.personalInfo?.email ||
    "";

  const phone =
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
  const linkedin = socialLinks.linkedIn || socialLinks.linkedin || socialLinks.linkedinUrl || contact.linkedin || "";
  const github = socialLinks.github || socialLinks.GitHub || socialLinks.githubUrl || contact.github || "";
  const portfolio = socialLinks.portfolio || socialLinks.website || socialLinks.portifolioUrl || contact.website || "";

  // ============================================
  // PROFESSIONAL SUMMARY / CAREER OBJECTIVE
  // ============================================
  let professionalSummary =
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
    "";

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
  let education =
    parsedData.education ||
    parsedData.educational_qualifications ||
    llmData.education ||
    llmData.educational_qualifications ||
    [];
  if (!Array.isArray(education)) education = [];

  // ============================================
  // WORK EXPERIENCE
  // ============================================
  let workExperience =
    parsedData.workExperience ||
    parsedData.work_experience ||
    parsedData.experience ||
    parsedData.professional_experience ||
    llmData.workExperience ||
    llmData.work_experience ||
    llmData.experience ||
    llmData.professional_experience ||
    [];
  if (!Array.isArray(workExperience)) workExperience = [];
  workExperience = workExperience.filter((exp: any) => exp.company || exp.role || exp.title || exp.position);

  // ============================================
  // PROJECTS
  // ============================================
  let projects =
    parsedData.projects ||
    parsedData.project_details ||
    llmData.projects ||
    llmData.project_details ||
    [];
  if (!Array.isArray(projects)) projects = [];

  // ============================================
  // SKILLS (Technical)
  // ============================================
  let skills = parsedData.skills || parsedData.technical_skills || llmData.skills || llmData.technical_skills || [];
  if (!Array.isArray(skills)) {
    if (typeof skills === 'object') {
      // Handle object format - flatten to array
      skills = Object.values(skills).flat();
    } else {
      skills = [];
    }
  }
  skills = skills.map((s: any) => {
    if (typeof s === 'object' && s !== null) {
      return s.skill || s.name || s;
    }
    return s;
  }).filter(Boolean);

  // Add newly_added_skills (TECHNICAL only) if present
  const newlyAddedSkills = data?.newly_added_skills || [];
  if (Array.isArray(newlyAddedSkills) && newlyAddedSkills.length > 0) {
    skills = [...skills, ...newlyAddedSkills];
  }

  // ============================================
  // SOFT SKILLS
  // ============================================
  // // console.log("🔍 DEBUG - Soft Skills Extraction:");
  // // console.log("parsedData.soft_skills:", parsedData.soft_skills);
  // // console.log("llmData.soft_skills:", llmData.soft_skills);

  let softSkills = parsedData.soft_skills || llmData.soft_skills || [];
  if (!Array.isArray(softSkills)) softSkills = [];
  softSkills = softSkills.map((s: any) => {
    if (typeof s === 'object' && s !== null) {
      return s.skill || s.name || s;
    }
    return s;
  }).filter(Boolean);

  // Add newly_added_soft_skills (SOFT only) if present
  const newlyAddedSoftSkills = data?.newly_added_soft_skills || [];
  if (Array.isArray(newlyAddedSoftSkills) && newlyAddedSoftSkills.length > 0) {
    softSkills = [...softSkills, ...newlyAddedSoftSkills];
  }

  // // console.log("✅ Final softSkills array:", softSkills);
  // // console.log("✅ softSkills.length:", softSkills.length);

  // ============================================
  // INTERNSHIPS
  // ============================================
  let internships = parsedData.internships || llmData.internships || [];
  if (!Array.isArray(internships)) internships = [];

  // ============================================
  // CERTIFICATIONS
  // ============================================
  let certifications =
    parsedData.certifications ||
    parsedData.certificates ||
    llmData.certifications ||
    llmData.certificates ||
    [];
  if (!Array.isArray(certifications)) certifications = [];

  // ============================================
  // ACHIEVEMENTS
  // ============================================
  let achievements = parsedData.achievements || llmData.achievements || [];
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
  let languages =
    parsedData.languages ||
    parsedData.languages_known ||
    llmData.languages ||
    llmData.languages_known ||
    [];
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
  const parseDescription = (desc: any): string[] => {
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
    color: "#111827",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "0.75rem",
    borderBottom: "1px solid #6b7280",
    paddingBottom: "4px",
  };

  const baseTextStyle: React.CSSProperties = {
    fontSize: "13px",
    lineHeight: "1.5",
    color: "#111827",
  };

  const titleStyle: React.CSSProperties = {
    ...baseTextStyle,
    fontWeight: 600,
  };

  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="max-w-[850px] mx-auto p-6">

        {/* ============================================ */}
        {/* HEADER / PERSONAL INFO */}
        {/* ============================================ */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-5">
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide mb-2">
            {name}
          </h1>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-gray-700">
            {email && <span>{email}</span>}
            {email && (phone || location) && <span>|</span>}
            {phone && <span>{phone}</span>}
            {phone && location && <span>|</span>}
            {location && <span>{location}</span>}
            {linkedin && (
              <>
                <span>|</span>
                <a href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                   className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </>
            )}
            {github && (
              <>
                <span>|</span>
                <a href={github.startsWith('http') ? github : `https://${github}`}
                   className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </>
            )}
            {portfolio && (
              <>
                <span>|</span>
                <a href={portfolio.startsWith('http') ? portfolio : `https://${portfolio}`}
                   className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Portfolio
                </a>
              </>
            )}
          </div>
        </div>

        {/* ============================================ */}
        {/* PROFESSIONAL SUMMARY */}
        {/* ============================================ */}
        {professionalSummary && (
          <div className="mb-5">
            <h2 style={headingStyle}>SUMMARY</h2>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">
              {professionalSummary}
            </p>
          </div>
        )}

        {/* ============================================ */}
        {/* TECHNICAL SKILLS */}
        {/* ============================================ */}
        {skills.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>TECHNICAL SKILLS</h2>
            <ul className="list-disc pl-5 grid grid-cols-3 gap-x-6 gap-y-1 text-sm text-gray-700">
              {skills.map((skill: string, idx: number) => (
                <li key={idx}>{skill}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ============================================ */}
        {/* SOFT SKILLS */}
        {/* ============================================ */}
        {softSkills.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>SOFT SKILLS</h2>
            <ul className="list-disc pl-5 grid grid-cols-3 gap-x-6 gap-y-1 text-sm text-gray-700">
              {softSkills.map((skill: string, idx: number) => (
                <li key={idx}>{skill}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ============================================ */}
        {/* WORK EXPERIENCE */}
        {/* ============================================ */}
        {workExperience.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>WORK EXPERIENCE</h2>
            {workExperience.map((exp: any, idx: number) => {
              const role = exp.role || exp.title || exp.position || "";
              const company = exp.company || exp.organization || exp.employer || "";
              const expLocation = exp.location || "";
              const startDate = exp.startDate || exp.start_date || exp.from || exp.start || "";
              const endDate = exp.currentlyWorking ? "Present" : (exp.endDate || exp.end_date || exp.to || exp.end || "");
              const description = parseDescription(exp.description || exp.responsibilities || exp.key_contributions);

              return (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-bold text-sm text-gray-900">{role}</div>
                      <div className="text-sm text-gray-700">{company}{expLocation && `, ${expLocation}`}</div>
                    </div>
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(startDate)} – {formatDate(endDate)}
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
        {education.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>EDUCATION</h2>
            {education.map((edu: any, idx: number) => {
              const degree = edu.degree || edu.qualification || edu.program || "";
              const school = edu.school || edu.institution || edu.university || edu.college || "";
              const branch = edu.branch || edu.field || edu.specialization || "";
              const startDate = edu.startDate || edu.start_date || edu.from || "";
              const endDate = edu.endDate || edu.end_date || edu.to || edu.graduation_year || edu.passed_out || edu.year || "";
              const grade = edu.grade || edu.gpa || edu.GPA || edu.cgpa || edu.CGPA || edu.percentage || "";

              return (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-gray-900">
                        {degree}{branch && ` in ${branch}`}
                      </div>
                      <div className="text-sm text-gray-700">{school}</div>
                      {grade && <div className="text-xs text-gray-600">Grade: {grade}</div>}
                    </div>
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(startDate)}{startDate && endDate && " – "}{formatDate(endDate)}
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
        {projects.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>PROJECTS</h2>
            {projects.map((proj: any, idx: number) => {
              const title = proj.title || proj.name || proj.projectName || "";
              const link = proj.link || proj.url || "";
              const startDate = proj.startDate || proj.start_date || "";
              const endDate = proj.endDate || proj.end_date || proj.date || proj.period || "";
              const description = proj.description || proj.summary || "";
              const technologies = proj.technologies || proj.techStack || proj.tools || [];
              const responsibilities = parseDescription(proj.responsibilities || proj.key_contributions || proj.contributions);

              return (
                <div key={idx} className="mb-4">
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
                        {formatDate(startDate)}{startDate && endDate && " – "}{formatDate(endDate)}
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
        {internships.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>INTERNSHIPS</h2>
            {internships.map((intern: any, idx: number) => {
              const role = intern.role || intern.title || intern.position || "";
              const company = intern.company || intern.organization || "";
              const internLocation = intern.location || "";
              const startDate = intern.startDate || intern.start_date || intern.from || "";
              const endDate = intern.currentlyWorking ? "Present" : (intern.endDate || intern.end_date || intern.to || intern.duration || "");
              const description = parseDescription(intern.description || intern.responsibilities || intern.key_contributions);

              return (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-bold text-sm text-gray-900">{company}</div>
                      <div className="text-sm font-medium text-gray-700">{role}{internLocation && `, ${internLocation}`}</div>
                    </div>
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(startDate)}{startDate && endDate && " – "}{formatDate(endDate)}
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
        {certifications.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>CERTIFICATIONS</h2>
            {certifications.map((cert: any, idx: number) => {
              const certName = typeof cert === 'string' ? cert : (cert.name || cert.title || cert.certification || "");
              const issuedBy = typeof cert === 'object' ? (cert.issuedBy || cert.issued_by || cert.issuer || "") : "";
              const year = typeof cert === 'object' ? (cert.year || cert.date || "") : "";
              const expiryDate = typeof cert === 'object' ? (cert.expiryDate || cert.expiry_date || "") : "";
              const credentialId = typeof cert === 'object' ? (cert.credentialId || cert.credential_id || "") : "";

              if (!certName) return null;

              return (
                <div key={idx} className="mb-2 flex items-start text-sm text-gray-700">
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
        {achievements.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>ACHIEVEMENTS</h2>
            {achievements.map((achievement: any, idx: number) => {
              const title = typeof achievement === 'string' ? achievement : (achievement.title || achievement.name || "");
              const description = typeof achievement === 'object' ? (achievement.description || "") : "";
              const date = typeof achievement === 'object' ? (achievement.date || "") : "";

              if (!title) return null;

              return (
                <div key={idx} className="mb-2">
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
        {awards.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>AWARDS</h2>
            {awards.map((award: any, idx: number) => {
              const title = typeof award === 'string' ? award : (award.title || award.name || "");
              const issuedBy = typeof award === 'object' ? (award.issuedBy || award.issued_by || award.organization || "") : "";
              const year = typeof award === 'object' ? (award.year || award.date || "") : "";

              if (!title) return null;

              return (
                <div key={idx} className="mb-2 flex items-start text-sm text-gray-700">
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
        {volunteering.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>VOLUNTEERING</h2>
            {volunteering.map((vol: any, idx: number) => {
              const role = vol.role || vol.title || vol.position || "";
              const organization = vol.organization || vol.company || "";
              const startDate = vol.startDate || vol.start_date || "";
              const endDate = vol.endDate || vol.end_date || "";
              const description = vol.description || "";

              return (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-gray-900">{role}</div>
                      <div className="text-sm text-gray-700">{organization}</div>
                    </div>
                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(startDate)}{startDate && endDate && " – "}{formatDate(endDate)}
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
        {hobbies.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>HOBBIES</h2>
            <div className="text-sm text-gray-700">
              {hobbies.map((hobby: any, idx: number) => {
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
        {interests.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>INTERESTS</h2>
            <div className="text-sm text-gray-700">
              {interests.map((interest: any, idx: number) => {
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
        {languages.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>LANGUAGES</h2>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              {languages.map((lang: any, idx: number) => {
                const langName = typeof lang === 'string' ? lang : (lang.language || lang.name || "");
                const proficiency = typeof lang === 'object' ? (lang.proficiency || lang.level || "") : "";

                if (!langName) return null;

                return (
                  <div key={idx} className="flex items-start">
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
        {publications.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>PUBLICATIONS</h2>
            {publications.map((pub: any, idx: number) => {
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
        {references.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>REFERENCES</h2>
            {references.map((ref: any, idx: number) => {
              const refName = typeof ref === 'string' ? ref : (ref.name || "");
              const relation = typeof ref === 'object' ? (ref.relation || ref.title || ref.position || "") : "";
              const contact = typeof ref === 'object' ? (ref.contact || ref.email || ref.phone || "") : "";

              if (!refName) return null;

              return (
                <div key={idx} className="mb-3">
                  <div className="font-semibold text-sm text-gray-900">{refName}</div>
                  {relation && <div className="text-sm text-gray-700">{relation}</div>}
                  {contact && <div className="text-sm text-gray-600">{contact}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================ */}
        {/* CERTIFICATE OF PARTICIPATION / EXTRACURRICULAR */}
        {/* ============================================ */}
        {participations.length > 0 && (
          <div className="mb-5">
            <h2 style={headingStyle}>EXTRACURRICULAR ACTIVITIES</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              {participations.map((item: any, idx: number) => {
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
                    <td className="pr-4 py-0.5">Father's Name</td>
                    <td className="py-0.5">: {personalDetails.father_name}</td>
                  </tr>
                )}
                {personalDetails.mother_name && (
                  <tr>
                    <td className="pr-4 py-0.5">Mother's Name</td>
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
