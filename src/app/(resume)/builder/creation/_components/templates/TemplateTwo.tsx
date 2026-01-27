// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
// import { useResume } from "../../_context/ResumeContext";
// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
// }
// const TemplateTwo: React.FC<Props> = ({ data }) => {
//   const { resumeStyle, sectionOrder } = useResume();
//   const { personalInfo, professionalSummary, education, workExperience, projects, skills, certifications, achievements, volunteering, references, internships, awards, } = data;
//   // ✅ Format function for "MMM YYYY"
//   const formatDate = (dateString?: string) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return dateString;
//     return date.toLocaleString("en-US", { month: "short", year: "numeric" });
//   };
//   // ✅ Unified text and heading styles
//   const baseTextStyle: React.CSSProperties = {
//     fontFamily: resumeStyle.fontFamily,
//     fontSize: resumeStyle.bodyFontSize,
//     lineHeight: resumeStyle.lineSpacing,
//     fontWeight: resumeStyle.bold ? "bold" : "normal",
//     fontStyle: resumeStyle.italic ? "italic" : "normal",
//     // textDecoration: resumeStyle.underline ? "underline" : "none",
//     color: resumeStyle.bodyColor,
//   };
//   const headingStyle: React.CSSProperties = {
//     color: resumeStyle.headingColor,
//     fontSize: resumeStyle.headingFontSize,
//     fontWeight: "bold",
//     textTransform: "uppercase",
//   };
//   // ✅ Section divider
//   const SectionDivider = ({ title }: { title: string }) => (
//     <div className="flex items-center my-2" style={headingStyle}>
//       <div className="flex-grow border-t border-black"></div>
//       <span className="mx-3">{title}</span>
//       <div className="flex-grow border-t border-black"></div>
//     </div>
//   );
//   // ✅ All sections wrapped inside renderSection()
//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <header className="text-center border-b-2 border-black pb-4 mb-6">
//             <h1
//               className="uppercase font-bold"
//               style={{
//                 color: resumeStyle.headingColor,
//                 fontSize: resumeStyle.nameFontSize,
//               }}
//             >
//               {personalInfo.name || "Your Name"}
//             </h1>
//             <div
//               className="mt-1 text-sm flex justify-center gap-2"
//               style={{ color: resumeStyle.bodyColor }}
//             >
//               {personalInfo.email && <span>{personalInfo.email}</span>}
//               {personalInfo.phone && <span>{personalInfo.phone}</span>}
//               {personalInfo.location && <span>{personalInfo.location}</span>}
//               {personalInfo.linkedinurl && (
//                 <span>
//                   <a
//                     href={personalInfo.linkedinurl}
//                     target="_blank"
//                     rel="noreferrer"
//                   >
//                     {personalInfo.linkedinurl}
//                   </a>
//                 </span>
//               )}
//               {personalInfo.portifoliourl && (
//                 <span>
//                   <a
//                     href={personalInfo.portifoliourl}
//                     target="_blank"
//                     rel="noreferrer"
//                   >
//                     {personalInfo.portifoliourl}
//                   </a>
//                 </span>
//               )}
//             </div>
//           </header>
//         );
//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <>
//               <SectionDivider title="Summary" />
//               <p className="text-justify" style={{ color: resumeStyle.bodyColor }}>
//                 {professionalSummary}
//               </p>
//             </>
//           )
//         );
//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <>
//               <SectionDivider title="Work Experience" />
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between font-semibold">
//                     <span>
//                       {exp.role}, {exp.company}
//                     </span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(exp.startDate)} -{" "}
//                       {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </span>
//                   </div>
//                   <p style={{ color: resumeStyle.bodyColor }}>{exp.description}</p>
//                 </div>
//               ))}
//             </>
//           )
//         );
//       case "Education":
//         return (
//           education.length > 0 && (
//             <>
//               <SectionDivider title="Education" />
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-2">
//                   <div className="flex justify-between font-semibold">
//                     <span>
//                       {edu.degree}, {edu.school}
//                     </span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </>
//           )
//         );
//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <>
//               <SectionDivider title="Projects" />
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-3">
//                   <p className="font-semibold">
//                     {proj.title}
//                     {proj.link && (
//                       <a
//                         href={proj.link}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="text-blue-600 underline ml-1"
//                       >
//                         [Link]
//                       </a>
//                     )}
//                   </p>
//                   <p style={{ color: resumeStyle.bodyColor }}>{proj.description}</p>
//                   <p style={{ color: resumeStyle.bodyColor }}>
//                     <strong>Technologies:</strong> {proj.technologies}
//                   </p>
//                   <p style={{ color: resumeStyle.bodyColor }}>
//                     {formatDate(proj.startDate)} - {formatDate(proj.endDate)}
//                   </p>
//                 </div>
//               ))}
//             </>
//           )
//         );
//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <>
//               <SectionDivider title="Skills" />
//               <div className="flex flex-wrap gap-3" style={{ color: resumeStyle.bodyColor }}>
//                 {skills.map((s, i) => (
//                   <span key={i} className="border px-2 py-1 rounded">
//                     {s}
//                   </span>
//                 ))}
//               </div>
//             </>
//           )
//         );
//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <>
//               <SectionDivider title="Certifications" />
//               {certifications.map((cert, idx) => (
//                 <p key={idx} style={{ color: resumeStyle.bodyColor }}>
//                   {cert.name} — {cert.issuedBy} ({cert.year})
//                 </p>
//               ))}
//             </>
//           )
//         );
//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <>
//               <SectionDivider title="Achievements" />
//               <ul className="list-disc ml-6" style={{ color: resumeStyle.bodyColor }}>
//                 {achievements.map((a, i) => (
//                   <li key={i}>
//                     <strong>{a.title}</strong> ({a.date}) — {a.description}
//                   </li>
//                 ))}
//               </ul>
//             </>
//           )
//         );
//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <>
//               <SectionDivider title="Volunteering" />
//               {volunteering.map((v, i) => (
//                 <div key={i} className="mb-2">
//                   <p className="font-semibold">
//                     {v.role} — {v.organization}
//                   </p>
//                   <p style={{ color: resumeStyle.bodyColor }}>
//                     {formatDate(v.startDate)} - {formatDate(v.endDate)}
//                   </p>
//                 </div>
//               ))}
//             </>
//           )
//         );
//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <>
//               <SectionDivider title="Internships" />
//               {internships.map((intern, i) => (
//                 <div key={i} className="mb-2">
//                   <p className="font-semibold">
//                     {intern.role} — {intern.company}
//                   </p>
//                   <p style={{ color: resumeStyle.bodyColor }}>
//                     {formatDate(intern.startDate)} -{" "}
//                     {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                   </p>
//                   <p style={{ color: resumeStyle.bodyColor }}>{intern.description}</p>
//                 </div>
//               ))}
//             </>
//           )
//         );
//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <>
//               <SectionDivider title="Awards" />
//               {awards.map((award, i) => (
//                 <p key={i} style={{ color: resumeStyle.bodyColor }}>
//                   {award.title} — {award.issuedBy} ({award.year})
//                 </p>
//               ))}
//             </>
//           )
//         );
//       case "References":
//         return (
//           references.length > 0 && (
//             <>
//               <SectionDivider title="References" />
//               {references.map((ref, i) => (
//                 <p key={i} style={{ color: resumeStyle.bodyColor }}>
//                   {ref.name} ({ref.relation}) — {ref.contact}
//                 </p>
//               ))}
//             </>
//           )
//         );

//       default:
//         return null;
//     }
//   };
//   return (
//     <div className="w-[400px] mx-auto bg-white shadow p-10 text-sm" style={baseTextStyle}>
//       {sectionOrder.map((section, idx) => (
//         <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//       ))}
//     </div>
//   );
// };
// export default TemplateTwo; before design change



// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
// import { useResume } from "../../_context/ResumeContext";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
// }

// const TemplateTwo: React.FC<Props> = ({ data }) => {
//   const { resumeStyle, sectionOrder } = useResume();
//   const {
//     personalInfo,
//     professionalSummary,
//     education,
//     workExperience,
//     projects,
//     skills,
//     certifications,
//     achievements,
//     volunteering,
//     references,
//     internships,
//     awards,
//     hobbies,
//     interests,
//     languages,
//     publications,
//   } = data;

//   // ✅ Format function for "MMM YYYY"
//   // const formatDate = (dateString?: string) => {
//   //   if (!dateString) return "";
//   //   const date = new Date(dateString);
//   //   if (isNaN(date.getTime())) return dateString;
//   //   return date.toLocaleString("en-US", { month: "short", year: "numeric" });
//   // };
//   const formatDate = (dateString?: string): string => {
//   if (!dateString) return "";

//   // Already formatted like "Jun 24"
//   if (/^[A-Za-z]{3}\s\d{2}$/.test(dateString)) {
//     return dateString;
//   }

//   // Format like "2024-06"
//   if (/^\d{4}-\d{2}$/.test(dateString)) {
//     const [year, month] = dateString.split("-");
//     const monthNames = [
//       "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
//     ];
//     const monthIndex = parseInt(month, 10) - 1;
//     return `${monthNames[monthIndex]} ${year.slice(-2)}`;
//   }

//   // If neither format matches, just return as-is
//   return dateString;
// };

//   // ✅ Unified text and heading styles
//   const baseTextStyle: React.CSSProperties = {
//     fontFamily: resumeStyle.fontFamily,
//     fontSize: resumeStyle.bodyFontSize,
//     lineHeight: resumeStyle.lineSpacing,
//     fontWeight: resumeStyle.bold ? "bold" : "normal",
//     fontStyle: resumeStyle.italic ? "italic" : "normal",
//     color: resumeStyle.bodyColor,
//   };

//   const headingStyle: React.CSSProperties = {
//     color: resumeStyle.headingColor,
//     fontSize: resumeStyle.headingFontSize,
//     fontWeight: "600",
//     textTransform: "uppercase",
//     letterSpacing: "0.05em",
//     marginBottom: "0.75rem",
//   };

//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: "#000000",
//   };

//   // ✅ All sections wrapped inside renderSection()
//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <header className="mb-6">
//             <div className="flex justify-between items-start">
//               {/* Left side - Name */}
//               <h1 className="text-4xl font-bold uppercase" style={nameStyle}>
//                 {personalInfo.name || "JOHN DOE"}
//               </h1>

//               {/* Right side - Contact Details */}
//               <div className="text-right flex flex-col gap-1">
//                 {/* Phone and Email on same line */}
//                 <div className="flex items-center justify-end gap-4 text-sm" style={baseTextStyle}>
//                   {personalInfo.phone && (
//                     <div className="flex items-center gap-1">
//                       <span>📞</span>
//                       <span>{personalInfo.phone}</span>
//                     </div>
//                   )}
//                   {personalInfo.email && (
//                     <div className="flex items-center gap-1">
//                       <span>✉️</span>
//                       <span>{personalInfo.email}</span>
//                     </div>
//                   )}
//                 </div>

//                 {/* Location, LinkedIn, Portfolio on next line */}
//                 {(personalInfo.location || personalInfo.linkedinurl || personalInfo.portifoliourl) && (
//                   <div className="flex items-center justify-end gap-4 text-sm" style={baseTextStyle}>
//                     {personalInfo.location && (
//                       <div className="flex items-center gap-1">
//                         <span>📍</span>
//                         <span>{personalInfo.location}</span>
//                       </div>
//                     )}
//                     {personalInfo.linkedinurl && (
//                       <div className="flex items-center gap-1">
//                         <span>🔗</span>
//                         <span>LinkedIn</span>
//                       </div>
//                     )}
//                     {personalInfo.portifoliourl && (
//                       <div className="flex items-center gap-1">
//                         <span>🌐</span>
//                         <span>Portfolio</span>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//             <hr className="border-t-2 border-gray-800 mt-4" />
//           </header>
//         );

//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>SUMMARY</h2>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>SKILLS</h2>
//               <div className="grid grid-cols-3 gap-x-8 gap-y-2">
//                 {skills.map((skill, index) => (
//                   <div key={index} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <span>{skill}</span>
//                   </div>
//                 ))}
//               </div>
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>EXPERIENCE</h2>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold" style={baseTextStyle}>
//                       {exp.role}
//                     </h3>
//                     <span className="text-sm" style={baseTextStyle}>
//                       {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2" style={baseTextStyle}>
//                     <span className="font-medium">{exp.company}</span>
//                     {exp.location && <span className="text-sm"> • {exp.location}</span>}
//                   </div>
//                   {exp.description && (
//                     <ul className="list-none space-y-1" style={baseTextStyle}>
//                       {exp.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>INTERNSHIPS</h2>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold" style={baseTextStyle}>
//                       {intern.role}
//                     </h3>
//                     <span className="text-sm" style={baseTextStyle}>
//                       {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2" style={baseTextStyle}>
//                     <span className="font-medium">{intern.company}</span>
//                     {intern.location && <span className="text-sm"> • {intern.location}</span>}
//                   </div>
//                   {intern.description && (
//                     <ul className="list-none space-y-1" style={baseTextStyle}>
//                       {intern.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>EDUCATION</h2>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-3">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <h3 className="font-semibold" style={baseTextStyle}>
//                         {edu.degree}
//                       </h3>
//                       <p className="text-sm" style={baseTextStyle}>
//                         {edu.school}
//                       </p>
//                     </div>
//                     <span className="text-sm" style={baseTextStyle}>
//                       {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>PROJECTS</h2>
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold" style={baseTextStyle}>
//                       {proj.title}
//                     </h3>
//                     {(proj.startDate || proj.endDate) && (
//                       <span className="text-sm" style={baseTextStyle}>
//                         {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
//                       </span>
//                     )}
//                   </div>
//                   {proj.description && (
//                     <ul className="list-none space-y-1 mb-2" style={baseTextStyle}>
//                       {proj.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                   {proj.technologies.length > 0 && (
//                     <p className="text-sm" style={baseTextStyle}>
//                       <span className="font-medium">Technologies:</span> {proj.technologies.join(", ")}
//                     </p>
//                   )}
//                   {proj.link && (
//                     <p className="text-sm" style={baseTextStyle}>
//                       <span className="font-medium">Link:</span> {proj.link}
//                     </p>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>CERTIFICATIONS</h2>
//               {certifications.map((cert, idx) => (
//                 <div key={idx} className="mb-2 flex items-start">
//                   <span className="mr-2" style={baseTextStyle}>•</span>
//                   <div style={baseTextStyle}>
//                     <span className="font-medium">{cert.name}</span> - {cert.issuedBy} ({cert.year})
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>AWARDS</h2>
//               {awards.map((award, idx) => (
//                 <div key={idx} className="mb-2 flex items-start">
//                   <span className="mr-2" style={baseTextStyle}>•</span>
//                   <div style={baseTextStyle}>
//                     <span className="font-medium">{award.title}</span> - {award.issuedBy} ({award.year})
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>ACHIEVEMENTS</h2>
//               {achievements.map((achievement, idx) => (
//                 <div key={idx} className="mb-3">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold" style={baseTextStyle}>
//                       {achievement.title}
//                     </h3>
//                     {achievement.date && (
//                       <span className="text-sm" style={baseTextStyle}>
//                         {formatDate(achievement.date)}
//                       </span>
//                     )}
//                   </div>
//                   {achievement.description && (
//                     <p style={baseTextStyle}>{achievement.description}</p>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Publications":
//         return (
//           publications.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>PUBLICATIONS</h2>
//               {publications.map((pub, idx) => (
//                 <div key={idx} className="mb-3">
//                   <h3 className="font-semibold" style={baseTextStyle}>
//                     {pub.title}
//                   </h3>
//                   <p className="text-sm" style={baseTextStyle}>
//                     {pub.authors}
//                   </p>
//                   <p className="text-sm" style={baseTextStyle}>
//                     <span className="italic">{pub.publicationName}</span> • {formatDate(pub.date)}
//                   </p>
//                   {pub.url && (
//                     <p className="text-sm" style={baseTextStyle}>
//                       {pub.url}
//                     </p>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>LANGUAGES</h2>
//               <div className="grid grid-cols-2 gap-2">
//                 {languages.map((lang, idx) => (
//                   <div key={idx} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <span>
//                       <span className="font-medium">{lang.language}</span> - {lang.proficiency}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>HOBBIES</h2>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <h3 className="font-medium inline">{hobby.name}</h3>
//                   {hobby.description && <span> - {hobby.description}</span>}
//                   {hobby.proficiencyLevel && <span className="text-sm"> ({hobby.proficiencyLevel})</span>}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>INTERESTS</h2>
//               <div className="grid grid-cols-2 gap-2">
//                 {interests.map((interest, idx) => (
//                   <div key={idx} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <div>
//                       <span className="font-medium">{interest.name}</span>
//                       {interest.category && <span className="text-sm"> ({interest.category})</span>}
//                       {interest.description && <p className="text-sm">{interest.description}</p>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>VOLUNTEERING</h2>
//               {volunteering.map((vol, idx) => (
//                 <div key={idx} className="mb-3">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <h3 className="font-semibold" style={baseTextStyle}>
//                         {vol.role}
//                       </h3>
//                       <p className="text-sm" style={baseTextStyle}>
//                         {vol.organization}
//                       </p>
//                     </div>
//                     <span className="text-sm" style={baseTextStyle}>
//                       {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "References":
//         return (
//           references.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>REFERENCES</h2>
//               {references.map((ref, idx) => (
//                 <div key={idx} className="mb-3">
//                   <h3 className="font-semibold" style={baseTextStyle}>
//                     {ref.name}
//                   </h3>
//                   <p className="text-sm" style={baseTextStyle}>
//                     {ref.relation}
//                   </p>
//                   <p className="text-sm" style={baseTextStyle}>
//                     {ref.contact}
//                   </p>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="w-full max-w-[850px] mx-auto bg-white shadow-lg p-12 text-sm" style={baseTextStyle}>
//       {sectionOrder.map((section, idx) => (
//         <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//       ))}
//     </div>
//   );
// };

// export default TemplateTwo;
// before personalinfo seperate lines


// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle, useResume } from "../../_context/ResumeContext";
// import AutoPaginator from "./AutoPaginator";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
//   onPageCountChange?: (count: number) => void;
// }

// const TemplateTwo: React.FC<Props> = ({ data, onPageCountChange  }) => {
//   const { resumeStyle, sectionOrder } = useResume();
//   const {
//     personalInfo,
//     professionalSummary,
//     education,
//     workExperience,
//     projects,
//     skills,
//     certifications,
//     achievements,
//     volunteering,
//     references,
//     internships,
//     awards,
//     hobbies,
//     interests,
//     languages,
//     publications,
//   } = data;

//   // ✅ Format function for "MMM YYYY"
//   const formatDate = (dateString?: string): string => {
//     if (!dateString) return "";

//     // Already formatted like "Jun 24"
//     if (/^[A-Za-z]{3}\s\d{2}$/.test(dateString)) {
//       return dateString;
//     }

//     // Format like "2024-06"
//     if (/^\d{4}-\d{2}$/.test(dateString)) {
//       const [year, month] = dateString.split("-");
//       const monthNames = [
//         "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
//       ];
//       const monthIndex = parseInt(month, 10) - 1;
//       return `${monthNames[monthIndex]} ${year.slice(-2)}`;
//     }

//     // If neither format matches, just return as-is
//     return dateString;
//   };

//   // ✅ Unified text and heading styles
//   const baseTextStyle: React.CSSProperties = {
//     fontFamily: resumeStyle.fontFamily,
//     fontSize: resumeStyle.bodyFontSize,
//     lineHeight: resumeStyle.lineSpacing,
//     fontWeight: resumeStyle.bold ? "bold" : "normal",
//     fontStyle: resumeStyle.italic ? "italic" : "normal",
//     color: resumeStyle.bodyColor,
//   };

//   const headingStyle: React.CSSProperties = {
//     color: resumeStyle.headingColor,
//     fontSize: resumeStyle.headingFontSize,
//     fontWeight: "600",
//     textTransform: "uppercase",
//     letterSpacing: "0.05em",
//     marginBottom: "0.75rem",
//   };

//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: "#000000",
//   };

//   const linkStyle: React.CSSProperties = {
//     color: resumeStyle.bodyColor,
//     textDecoration: "none",
//   };

//   // ✅ All sections wrapped inside renderSection()
//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <header className="mb-6">
//             <div className="flex justify-between items-center">
//               {/* Left side - Name (now centered vertically) */}
//               <h1 className="text-4xl font-bold uppercase" style={nameStyle}>
//                 {personalInfo.name || "JOHN DOE"}
//               </h1>

//               {/* Right side - Contact Details - ATS-friendly without icons */}
//               <div className="text-right flex flex-col gap-1">
//                 {personalInfo.phone && (
//                   <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
//                     <span>{personalInfo.phone}</span>
//                   </div>
//                 )}
//                 {personalInfo.email && (
//                   <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
//                     <span>{personalInfo.email}</span>
//                   </div>
//                 )}
//                 {personalInfo.location && (
//                   <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
//                     <span>{personalInfo.location}</span>
//                   </div>
//                 )}
//                 {personalInfo.linkedinurl && (
//                   <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
//                     <a 
//                       href={personalInfo.linkedinurl} 
//                       target="_blank" 
//                       rel="noopener noreferrer"
//                       style={linkStyle}
//                       className="hover:underline"
//                     >
//                       LinkedIn
//                     </a>
//                   </div>
//                 )}
//                 {personalInfo.portifoliourl && (
//                   <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
//                     <a 
//                       href={personalInfo.portifoliourl} 
//                       target="_blank" 
//                       rel="noopener noreferrer"
//                       style={linkStyle}
//                       className="hover:underline"
//                     >
//                       Portfolio
//                     </a>
//                   </div>
//                 )}
//               </div>
//             </div>
//             <hr className="border-t-2 border-gray-800 mt-4" />
//           </header>
//         );

//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>SUMMARY</h2>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>SKILLS</h2>
//               <div className="grid grid-cols-3 gap-x-8 gap-y-2">
//                 {skills.map((skill, index) => (
//                   <div key={index} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <span>{skill}</span>
//                   </div>
//                 ))}
//               </div>
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>EXPERIENCE</h2>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold" style={baseTextStyle}>
//                       {exp.role}
//                     </h3>
//                     <span className="text-sm" style={baseTextStyle}>
//                       {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2" style={baseTextStyle}>
//                     <span className="font-medium">{exp.company}</span>
//                     {exp.location && <span className="text-sm"> • {exp.location}</span>}
//                   </div>
//                   {exp.description && (
//                     <ul className="list-none space-y-1" style={baseTextStyle}>
//                       {exp.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>INTERNSHIPS</h2>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold" style={baseTextStyle}>
//                       {intern.role}
//                     </h3>
//                     <span className="text-sm" style={baseTextStyle}>
//                       {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2" style={baseTextStyle}>
//                     <span className="font-medium">{intern.company}</span>
//                     {intern.location && <span className="text-sm"> • {intern.location}</span>}
//                   </div>
//                   {intern.description && (
//                     <ul className="list-none space-y-1" style={baseTextStyle}>
//                       {intern.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>EDUCATION</h2>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-3">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <h3 className="font-semibold" style={baseTextStyle}>
//                         {edu.degree}
//                       </h3>
//                       <p className="text-sm" style={baseTextStyle}>
//                         {edu.school}
//                       </p>
//                     </div>
//                     <span className="text-sm" style={baseTextStyle}>
//                       {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>PROJECTS</h2>
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold" style={baseTextStyle}>
//                       {proj.title}
//                     </h3>
//                     {(proj.startDate || proj.endDate) && (
//                       <span className="text-sm" style={baseTextStyle}>
//                         {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
//                       </span>
//                     )}
//                   </div>
//                   {proj.description && (
//                     <ul className="list-none space-y-1 mb-2" style={baseTextStyle}>
//                       {proj.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                   {proj.technologies.length > 0 && (
//                     <p className="text-sm" style={baseTextStyle}>
//                       <span className="font-medium">Technologies:</span> {proj.technologies.join(", ")}
//                     </p>
//                   )}
//                   {proj.link && (
//                     <p className="text-sm" style={baseTextStyle}>
//                       <span className="font-medium">Link:</span>{" "}
//                       <a 
//                         href={proj.link} 
//                         target="_blank" 
//                         rel="noopener noreferrer"
//                         style={linkStyle}
//                         className="hover:underline"
//                       >
//                         {proj.link}
//                       </a>
//                     </p>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>CERTIFICATIONS</h2>
//               {certifications.map((cert, idx) => (
//                 <div key={idx} className="mb-2 flex items-start">
//                   <span className="mr-2" style={baseTextStyle}>•</span>
//                   <div style={baseTextStyle}>
//                     <span className="font-medium">{cert.name}</span> - {cert.issuedBy} ({cert.year})
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>AWARDS</h2>
//               {awards.map((award, idx) => (
//                 <div key={idx} className="mb-2 flex items-start">
//                   <span className="mr-2" style={baseTextStyle}>•</span>
//                   <div style={baseTextStyle}>
//                     <span className="font-medium">{award.title}</span> - {award.issuedBy} ({award.year})
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>ACHIEVEMENTS</h2>
//               {achievements.map((achievement, idx) => (
//                 <div key={idx} className="mb-3">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold" style={baseTextStyle}>
//                       {achievement.title}
//                     </h3>
//                     {achievement.date && (
//                       <span className="text-sm" style={baseTextStyle}>
//                         {formatDate(achievement.date)}
//                       </span>
//                     )}
//                   </div>
//                   {achievement.description && (
//                     <p style={baseTextStyle}>{achievement.description}</p>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Publications":
//         return (
//           publications.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>PUBLICATIONS</h2>
//               {publications.map((pub, idx) => (
//                 <div key={idx} className="mb-3">
//                   <h3 className="font-semibold" style={baseTextStyle}>
//                     {pub.title}
//                   </h3>
//                   <p className="text-sm" style={baseTextStyle}>
//                     {pub.authors}
//                   </p>
//                   <p className="text-sm" style={baseTextStyle}>
//                     <span className="italic">{pub.publicationName}</span> • {formatDate(pub.date)}
//                   </p>
//                   {pub.url && (
//                     <p className="text-sm">
//                       <a 
//                         href={pub.url} 
//                         target="_blank" 
//                         rel="noopener noreferrer"
//                         style={linkStyle}
//                         className="hover:underline"
//                       >
//                         {pub.url}
//                       </a>
//                     </p>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>LANGUAGES</h2>
//               <div className="grid grid-cols-2 gap-2">
//                 {languages.map((lang, idx) => (
//                   <div key={idx} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <span>
//                       <span className="font-medium">{lang.language}</span> - {lang.proficiency}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>HOBBIES</h2>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <h3 className="font-medium inline">{hobby.name}</h3>
//                   {hobby.description && <span> - {hobby.description}</span>}
//                   {hobby.proficiencyLevel && <span className="text-sm"> ({hobby.proficiencyLevel})</span>}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>INTERESTS</h2>
//               <div className="grid grid-cols-2 gap-2">
//                 {interests.map((interest, idx) => (
//                   <div key={idx} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <div>
//                       <span className="font-medium">{interest.name}</span>
//                       {interest.category && <span className="text-sm"> ({interest.category})</span>}
//                       {interest.description && <p className="text-sm">{interest.description}</p>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>VOLUNTEERING</h2>
//               {volunteering.map((vol, idx) => (
//                 <div key={idx} className="mb-3">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <h3 className="font-semibold" style={baseTextStyle}>
//                         {vol.role}
//                       </h3>
//                       <p className="text-sm" style={baseTextStyle}>
//                         {vol.organization}
//                       </p>
//                     </div>
//                     <span className="text-sm" style={baseTextStyle}>
//                       {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "References":
//         return (
//           references.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>REFERENCES</h2>
//               {references.map((ref, idx) => (
//                 <div key={idx} className="mb-3">
//                   <h3 className="font-semibold" style={baseTextStyle}>
//                     {ref.name}
//                   </h3>
//                   <p className="text-sm" style={baseTextStyle}>
//                     {ref.relation}
//                   </p>
//                   <p className="text-sm" style={baseTextStyle}>
//                     {ref.contact}
//                   </p>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       default:
//         return null;
//     }
//   };

//   // return (
//   //   <div className="w-full max-w-[850px] mx-auto bg-white shadow-lg p-12 text-sm" style={baseTextStyle}>
//   //     {sectionOrder.map((section, idx) => (
//   //       <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//   //     ))}
//   //   </div>
//   // );
//    return (
//     <AutoPaginator onPageCountChange={onPageCountChange}>
//       {sectionOrder.map((section, idx) => (
//         <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//       ))}
//     </AutoPaginator>
//   );

// };

// export default TemplateTwo; before name color issue


// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
// import { useResume } from "../../_context/ResumeContext";
// import AutoPaginator from "./AutoPaginator";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
//   onPageCountChange?: (count: number) => void;
// }

// const TemplateTwo: React.FC<Props> = ({ data, onPageCountChange }) => {
//   const { resumeStyle, sectionOrder } = useResume();
  
//   const {
//     personalInfo,
//     professionalSummary,
//     education,
//     workExperience,
//     projects,
//     skills,
//     certifications,
//     achievements,
//     volunteering,
//     references,
//     internships,
//     awards,
//     hobbies,
//     interests,
//     languages,
//     publications,
//   } = data;

//   // ✅ Date formatting function
//   const formatDate = (dateString?: string): string => {
//     if (!dateString) return "";

//     // Already formatted like "Jun 24"
//     if (/^[A-Za-z]{3}\s\d{2}$/.test(dateString)) {
//       return dateString;
//     }

//     // Format like "2024-06"
//     if (/^\d{4}-\d{2}$/.test(dateString)) {
//       const [year, month] = dateString.split("-");
//       const monthNames = [
//         "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
//       ];
//       const monthIndex = parseInt(month, 10) - 1;
//       return `${monthNames[monthIndex]} ${year.slice(-2)}`;
//     }

//     return dateString;
//   };

//   // ✅ Unified text styles (same as TemplateOne)
//   const baseTextStyle: React.CSSProperties = {
//     fontFamily: resumeStyle.fontFamily,
//     fontSize: resumeStyle.bodyFontSize,
//     lineHeight: resumeStyle.lineSpacing,
//     fontWeight: resumeStyle.bold ? "bold" : "normal",
//     fontStyle: resumeStyle.italic ? "italic" : "normal",
//     color: resumeStyle.bodyColor,
//   };

//   const headingStyle: React.CSSProperties = {
//     color: resumeStyle.headingColor,
//     fontSize: resumeStyle.headingFontSize,
//     fontWeight: "bold",
//     textTransform: "uppercase",
//     letterSpacing: "0.5px",
//     marginBottom: "0.75rem",
//   };

//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: resumeStyle.headingColor,
//     letterSpacing: "1.5px",
//   };

//   const linkStyle: React.CSSProperties = {
//     color: resumeStyle.bodyColor,
//     textDecoration: "underline",
//   };

//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <div className="text-center mb-6 page-break-inside-avoid" data-section="personal-info">
//             <h1 className="uppercase font-bold mb-1" style={nameStyle}>
//               {personalInfo.name || "JOHN DOE"}
//             </h1>
//             <div className="flex items-center justify-center flex-wrap gap-2 text-xs" style={baseTextStyle}>
//               {personalInfo.email && <span>✉ {personalInfo.email}</span>}
//               {personalInfo.phone && <span>📞 {personalInfo.phone}</span>}
//               {personalInfo.location && <span>📍 {personalInfo.location}</span>}
//               {personalInfo.linkedinurl && (
//                 <a 
//                   href={personalInfo.linkedinurl} 
//                   target="_blank" 
//                   rel="noopener noreferrer" 
//                   style={linkStyle}
//                 >
//                   LinkedIn
//                 </a>
//               )}
//               {personalInfo.portifoliourl && (
//                 <a 
//                   href={personalInfo.portifoliourl} 
//                   target="_blank" 
//                   rel="noopener noreferrer" 
//                   style={linkStyle}
//                 >
//                   Portfolio
//                 </a>
//               )}
//             </div>
//             <div className="w-full h-px bg-gray-800 mt-4"></div>
//           </div>
//         );

//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-5 page-break-inside-avoid" data-section="summary">
//               <h3 className="mb-3 pb-1 border-b border-gray-300" style={headingStyle}>
//                 SUMMARY
//               </h3>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//             </section>
//           )
//         );

//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-5" data-section="work-experience">
//               <h3 className="mb-3 pb-1 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 WORK EXPERIENCE
//               </h3>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{exp.company}</div>
//                       <div className="text-sm font-medium" style={baseTextStyle}>{exp.role}</div>
//                       {exp.location && <div className="text-sm" style={baseTextStyle}>{exp.location}</div>}
//                     </div>
//                     <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </div>
//                   </div>
//                   {exp.description && (
//                     <ul className="list-none space-y-1 mt-2" style={baseTextStyle}>
//                       {exp.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-5" data-section="education">
//               <h3 className="mb-3 pb-1 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 EDUCATION
//               </h3>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{edu.degree}</div>
//                       <div className="text-sm" style={baseTextStyle}>{edu.school}</div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-5" data-section="projects">
//               <h3 className="mb-3 pb-1 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 PROJECTS
//               </h3>
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div className="font-bold" style={baseTextStyle}>{proj.title}</div>
//                     {(proj.startDate || proj.endDate) && (
//                       <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                         {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
//                       </div>
//                     )}
//                   </div>
//                   {proj.description && (
//                     <ul className="list-none space-y-1 mb-2" style={baseTextStyle}>
//                       {proj.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                   {proj.technologies && proj.technologies.length > 0 && (
//                     <div className="text-sm mt-1" style={baseTextStyle}>
//                       <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
//                     </div>
//                   )}
//                   {proj.link && (
//                     <div className="text-sm mt-1">
//                       <span className="font-semibold" style={baseTextStyle}>Link: </span>
//                       <a 
//                         href={proj.link} 
//                         target="_blank" 
//                         rel="noopener noreferrer" 
//                         style={linkStyle}
//                       >
//                         {proj.link}
//                       </a>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-5 page-break-inside-avoid" data-section="skills">
//               <h3 className="mb-3 pb-1 border-b border-gray-300" style={headingStyle}>
//                 SKILLS
//               </h3>
//               <ul className="list-disc pl-5 grid grid-cols-3 gap-x-4 gap-y-1" style={baseTextStyle}>
//                 {skills.map((skill, idx) => (
//                   <li key={idx} className="text-sm">{skill}</li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );

//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-5" data-section="internships">
//               <h3 className="mb-3 pb-1 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 INTERNSHIPS
//               </h3>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{intern.company}</div>
//                       <div className="text-sm font-medium" style={baseTextStyle}>{intern.role}</div>
//                       {intern.location && <div className="text-sm" style={baseTextStyle}>{intern.location}</div>}
//                     </div>
//                     <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </div>
//                   </div>
//                   {intern.description && (
//                     <ul className="list-none space-y-1 mt-2" style={baseTextStyle}>
//                       {intern.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-5" data-section="certifications">
//               <h3 className="mb-3 pb-1 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 CERTIFICATIONS
//               </h3>
//               {certifications.map((cert, idx) => (
//                 <div key={idx} className="mb-2 flex items-start" style={baseTextStyle}>
//                   <span className="mr-2">•</span>
//                   <div>
//                     <span className="font-semibold">{cert.name}</span>
//                     {cert.issuedBy && <> — {cert.issuedBy}</>}
//                     {cert.year && <> ({cert.year})</>}
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-5" data-section="achievements">
//               <h3 className="mb-3 pb-1 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 ACHIEVEMENTS
//               </h3>
//               {achievements.map((achievement, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <span className="font-semibold" style={baseTextStyle}>{achievement.title}</span>
//                     {achievement.date && (
//                       <span className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                         {formatDate(achievement.date)}
//                       </span>
//                     )}
//                   </div>
//                   {achievement.description && (
//                     <p className="text-sm" style={baseTextStyle}>{achievement.description}</p>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-5" data-section="awards">
//               <h3 className="mb-3 pb-1 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 AWARDS
//               </h3>
//               {awards.map((award, idx) => (
//                 <div key={idx} className="mb-2 flex items-start" style={baseTextStyle}>
//                   <span className="mr-2">•</span>
//                   <div>
//                     <span className="font-semibold">{award.title}</span>
//                     {award.issuedBy && <> — {award.issuedBy}</>}
//                     {award.year && <> ({award.year})</>}
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-5" data-section="volunteering">
//               <h3 className="mb-3 pb-1 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 VOLUNTEERING
//               </h3>
//               {volunteering.map((vol, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{vol.role}</div>
//                       <div className="text-sm" style={baseTextStyle}>{vol.organization}</div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-5 page-break-inside-avoid" data-section="hobbies">
//               <h3 className="mb-3 pb-1 border-b border-gray-300" style={headingStyle}>
//                 HOBBIES
//               </h3>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{hobby.name}</span>
//                   {hobby.description && <> — {hobby.description}</>}
//                   {hobby.proficiencyLevel && <span className="text-sm"> ({hobby.proficiencyLevel})</span>}
//                   {hobby.achievement && <span className="text-sm"> • {hobby.achievement}</span>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-5 page-break-inside-avoid" data-section="interests">
//               <h3 className="mb-3 pb-1 border-b border-gray-300" style={headingStyle}>
//                 INTERESTS
//               </h3>
//               {interests.map((interest, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{interest.name}</span>
//                   {interest.category && <span className="text-sm"> ({interest.category})</span>}
//                   {interest.description && <> — {interest.description}</>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="mb-5 page-break-inside-avoid" data-section="languages">
//               <h3 className="mb-3 pb-1 border-b border-gray-300" style={headingStyle}>
//                 LANGUAGES
//               </h3>
//               <div className="grid grid-cols-2 gap-2">
//                 {languages.map((lang, idx) => (
//                   <div key={idx} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <div>
//                       <span className="font-semibold">{lang.language}</span>
//                       {lang.proficiency && <> — {lang.proficiency}</>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </section>
//           )
//         );

//       case "Publications":
//         return (
//           publications.length > 0 && (
//             <section className="mb-5" data-section="publications">
//               <h3 className="mb-3 pb-1 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 PUBLICATIONS
//               </h3>
//               {publications.map((pub, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="font-semibold" style={baseTextStyle}>{pub.title}</div>
//                   <div className="text-sm" style={baseTextStyle}>
//                     {pub.authors}
//                   </div>
//                   <div className="text-sm" style={baseTextStyle}>
//                     <span className="italic">{pub.publicationName}</span>
//                     {pub.date && <> • {formatDate(pub.date)}</>}
//                   </div>
//                   {pub.url && (
//                     <div className="text-sm mt-1">
//                       <a 
//                         href={pub.url} 
//                         target="_blank" 
//                         rel="noopener noreferrer" 
//                         style={linkStyle}
//                       >
//                         {pub.url}
//                       </a>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "References":
//         return (
//           references.length > 0 && (
//             <section className="page-break-inside-avoid" data-section="references">
//               <h3 className="mb-3 pb-1 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 REFERENCES
//               </h3>
//               {references.map((ref, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="font-semibold" style={baseTextStyle}>{ref.name}</div>
//                   {ref.relation && <div className="text-sm" style={baseTextStyle}>{ref.relation}</div>}
//                   {ref.contact && <div className="text-sm" style={baseTextStyle}>{ref.contact}</div>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <AutoPaginator onPageCountChange={onPageCountChange}>
//       {sectionOrder.map((section, idx) => (
//         <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//       ))}
//     </AutoPaginator>
//   );
// };

// export default TemplateTwo; before all good and project link added



// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
// import { useResume } from "../../_context/ResumeContext";
// import AutoPaginator from "./AutoPaginator";
// import { ExternalLink } from "lucide-react";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
//   onPageCountChange?: (count: number) => void;
// }

// const TemplateTwo: React.FC<Props> = ({ data, onPageCountChange }) => {
//   const { resumeStyle, sectionOrder } = useResume();
  
//   const {
//     personalInfo,
//     professionalSummary,
//     education,
//     workExperience,
//     projects,
//     skills,
//     certifications,
//     achievements,
//     volunteering,
//     references,
//     internships,
//     awards,
//     hobbies,
//     interests,
//     languages,
//     publications,
//   } = data;

//   const formatDate = (dateString?: string): string => {
//     if (!dateString) return "";

//     if (/^[A-Za-z]{3}\s\d{2}$/.test(dateString)) {
//       return dateString;
//     }

//     if (/^\d{4}-\d{2}$/.test(dateString)) {
//       const [year, month] = dateString.split("-");
//       const monthNames = [
//         "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
//       ];
//       const monthIndex = parseInt(month, 10) - 1;
//       return `${monthNames[monthIndex]} ${year.slice(-2)}`;
//     }

//     return dateString;
//   };

//   const baseTextStyle: React.CSSProperties = {
//     fontFamily: resumeStyle.fontFamily,
//     fontSize: resumeStyle.bodyFontSize,
//     lineHeight: resumeStyle.lineSpacing,
//     fontWeight: resumeStyle.bold ? "bold" : "normal",
//     fontStyle: resumeStyle.italic ? "italic" : "normal",
//     color: resumeStyle.bodyColor,
//   };

//   const headingStyle: React.CSSProperties = {
//     color: resumeStyle.headingColor,
//     fontSize: resumeStyle.headingFontSize,
//     fontWeight: "bold",
//     textTransform: "uppercase",
//     letterSpacing: "0.5px",
//     marginBottom: "0.75rem",
//   };

//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: resumeStyle.headingColor,
//     letterSpacing: "1.5px",
//   };

//   const linkStyle: React.CSSProperties = {
//     color: resumeStyle.bodyColor,
//     textDecoration: "underline",
//   };

//   const linkIconStyle: React.CSSProperties = {
//     display: "inline-block",
//     marginLeft: "6px",
//     verticalAlign: "middle",
//     color: resumeStyle.headingColor,
//   };

//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <div className="text-center mb-6 page-break-inside-avoid" data-section="personal-info">
//             <h1 className="uppercase font-bold mb-1" style={nameStyle}>
//               {personalInfo.fullName || "Full Name"}
//             </h1>
//             <div className="flex items-center justify-center flex-wrap gap-2 text-xs" style={baseTextStyle}>
//               {personalInfo.email && <span>{personalInfo.email}</span>}
//               {personalInfo.phone && <span>{personalInfo.phone}</span>}
//               {personalInfo.location && <span> {personalInfo.location}</span>}
//               {personalInfo.linkedinUrl && (
//                 <a 
//                   href={personalInfo.linkedinUrl} 
//                   target="_blank" 
//                   rel="noopener noreferrer" 
//                   style={linkStyle}
//                 >
//                   LinkedIn
//                 </a>
//               )}
//               {personalInfo.portifolioUrl && (
//                 <a 
//                   href={personalInfo.portifolioUrl} 
//                   target="_blank" 
//                   rel="noopener noreferrer" 
//                   style={linkStyle}
//                 >
//                   Portfolio
//                 </a>
//               )}
//             </div>
//             <div className="w-full h-px bg-gray-500 mt-4"></div>
//           </div>
//         );

//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-4 page-break-inside-avoid" data-section="summary">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 SUMMARY
//               </h3>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//             </section>
//           )
//         );

//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-4" data-section="work-experience">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 WORK EXPERIENCE
//               </h3>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{exp.company}</div>
//                       <div className="text-sm font-medium" style={baseTextStyle}>{exp.role}</div>
//                       {exp.location && <div className="text-sm" style={baseTextStyle}>{exp.location}</div>}
//                     </div>
//                     <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </div>
//                   </div>
//                   {exp.description && (
//                     <ul className="list-none space-y-1 mt-2" style={baseTextStyle}>
//                       {exp.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-4" data-section="education">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 EDUCATION
//               </h3>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{edu.degree}</div>
//                       <div className="text-sm" style={baseTextStyle}>{edu.school}</div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-4" data-section="projects">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 PROJECTS
//               </h3>
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div className="font-bold flex items-center" style={baseTextStyle}>
//                       <span>{proj.title}</span>
//                       {/* ✅ Link icon beside project title */}
//                       {proj.link && (
//                         <a 
//                           href={proj.link} 
//                           target="_blank" 
//                           rel="noopener noreferrer"
//                           style={linkIconStyle}
//                           className="hover:opacity-70"
//                           title={proj.link}
//                         >
//                           <ExternalLink size={14} />
//                         </a>
//                       )}
//                     </div>
//                     {(proj.startDate || proj.endDate) && (
//                       <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                         {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
//                       </div>
//                     )}
//                   </div>
//                   {proj.description && (
//                     <ul className="list-none space-y-1 mb-2" style={baseTextStyle}>
//                       {proj.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                   {proj.technologies && proj.technologies.length > 0 && (
//                     <div className="text-sm mt-1" style={baseTextStyle}>
//                       <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="skills">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 SKILLS
//               </h3>
//               <ul className="list-disc pl-5 grid grid-cols-3 gap-x-4 gap-y-1" style={baseTextStyle}>
//                 {skills.map((skill, idx) => (
//                   <li key={idx} className="text-sm">{skill}</li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );

//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-4" data-section="internships">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 INTERNSHIPS
//               </h3>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{intern.company}</div>
//                       <div className="text-sm font-medium" style={baseTextStyle}>{intern.role}</div>
//                       {intern.location && <div className="text-sm" style={baseTextStyle}>{intern.location}</div>}
//                     </div>
//                     <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </div>
//                   </div>
//                   {intern.description && (
//                     <ul className="list-none space-y-1 mt-2" style={baseTextStyle}>
//                       {intern.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       // case "Certifications":
//       //   return (
//       //     certifications.length > 0 && (
//       //       <section className="mb-5" data-section="certifications">
//       //         <h3 className="mb-3 pb-1 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//       //           CERTIFICATIONS
//       //         </h3>
//       //         {certifications.map((cert, idx) => (
//       //           <div key={idx} className="mb-2 flex items-start" style={baseTextStyle}>
//       //             <span className="mr-2">•</span>
//       //             <div>
//       //               <span className="font-semibold">{cert.name}</span>
//       //               {cert.issuedBy && <> — {cert.issuedBy}</>}
//       //               {cert.year && <> ({cert.year})</>}
//       //             </div>
//       //           </div>
//       //         ))}
//       //       </section>
//       //     )
//       //   );
//       case "Certifications":
//   return (
//     certifications.length > 0 && (
//       <section className="mb-4">
//         <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>CERTIFICATIONS</h3>
//         {certifications.map((cert, idx) => (
//           <div key={idx} className="flex items-start">
//             <span className="mr-2" style={baseTextStyle}>•</span>
//             <div style={baseTextStyle}>
//               <div>
//                 <span className="font-medium">{cert.name}</span> - {cert.issuedBy}
//               </div>
//               <div className="text-xs mt-1">
//                 <span>Issued: {cert.year}</span>
//                 {cert.expiryDate && (
//                   <span className="ml-3">
//                     Expires: {cert.expiryDate}
//                   </span>
//                 )}
//               </div>
//               {cert.credentialId && (
//                 <div className="text-xs mt-1">
//                   Credential ID: {cert.credentialId}
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//       </section>
//     )
//   );


//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-4" data-section="achievements">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 ACHIEVEMENTS
//               </h3>
//               {achievements.map((achievement, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <span className="font-semibold" style={baseTextStyle}>{achievement.title}</span>
//                     {achievement.date && (
//                       <span className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                         {formatDate(achievement.date)}
//                       </span>
//                     )}
//                   </div>
//                   {achievement.description && (
//                     <p className="text-sm" style={baseTextStyle}>{achievement.description}</p>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-4" data-section="awards">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 AWARDS
//               </h3>
//               {awards.map((award, idx) => (
//                 <div key={idx} className="mb-2 flex items-start" style={baseTextStyle}>
//                   <span className="mr-2">•</span>
//                   <div>
//                     <span className="font-semibold">{award.title}</span>
//                     {award.issuedBy && <> — {award.issuedBy}</>}
//                     {award.year && <> ({award.year})</>}
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-4" data-section="volunteering">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 VOLUNTEERING
//               </h3>
//               {volunteering.map((vol, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{vol.role}</div>
//                       <div className="text-sm" style={baseTextStyle}>{vol.organization}</div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="hobbies">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 HOBBIES
//               </h3>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{hobby.name}</span>
//                   {hobby.description && <> — {hobby.description}</>}
//                   {hobby.proficiencyLevel && <span className="text-sm"> ({hobby.proficiencyLevel})</span>}
//                   {hobby.achievement && <span className="text-sm"> • {hobby.achievement}</span>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="interests">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 INTERESTS
//               </h3>
//               {interests.map((interest, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{interest.name}</span>
//                   {interest.category && <span className="text-sm"> ({interest.category})</span>}
//                   {interest.description && <> — {interest.description}</>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="languages">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 LANGUAGES
//               </h3>
//               <div className="grid grid-cols-2 gap-2">
//                 {languages.map((lang, idx) => (
//                   <div key={idx} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <div>
//                       <span className="font-semibold">{lang.language}</span>
//                       {lang.proficiency && <> — {lang.proficiency}</>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </section>
//           )
//         );

//       case "Publications":
//         return (
//           publications.length > 0 && (
//             <section className="mb-4" data-section="publications">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 PUBLICATIONS
//               </h3>
//               {publications.map((pub, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="font-semibold flex items-center" style={baseTextStyle}>
//                     <span>{pub.title}</span>
//                     {/* ✅ Link icon beside publication title */}
//                     {pub.url && (
//                       <a 
//                         href={pub.url} 
//                         target="_blank" 
//                         rel="noopener noreferrer"
//                         style={linkIconStyle}
//                         className="hover:opacity-70"
//                         title={pub.url}
//                       >
//                         <ExternalLink size={14} />
//                       </a>
//                     )}
//                   </div>
//                   <div className="text-sm" style={baseTextStyle}>
//                     {pub.authors}
//                   </div>
//                   <div className="text-sm" style={baseTextStyle}>
//                     <span className="italic">{pub.publicationName}</span>
//                     {pub.date && <> • {formatDate(pub.date)}</>}
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "References":
//         return (
//           references.length > 0 && (
//             <section className="page-break-inside-avoid" data-section="references">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 REFERENCES
//               </h3>
//               {references.map((ref, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="font-semibold" style={baseTextStyle}>{ref.name}</div>
//                   {ref.relation && <div className="text-sm" style={baseTextStyle}>{ref.relation}</div>}
//                   {ref.contact && <div className="text-sm" style={baseTextStyle}>{ref.contact}</div>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <AutoPaginator onPageCountChange={onPageCountChange}>
//       {sectionOrder.map((section, idx) => (
//         <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//       ))}
//     </AutoPaginator>
//   );
// };

// export default TemplateTwo;







// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
// import { useResume } from "../../_context/ResumeContext";
// import AutoPaginator from "./AutoPaginator";
// import { ExternalLink } from "lucide-react";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
//   onPageCountChange?: (count: number) => void;
// }

// const TemplateTwo: React.FC<Props> = ({ data, onPageCountChange }) => {
//   const { resumeStyle, sectionOrder } = useResume();
  
//   const {
//     personalInfo,
//     professionalSummary,
//     education,
//     workExperience,
//     projects,
//     skills,
//     certifications,
//     achievements,
//     volunteering,
//     references,
//     internships,
//     awards,
//     hobbies,
//     interests,
//     languages,
//     publications,
//   } = data;

//   const formatDate = (dateString?: string): string => {
//     if (!dateString) return "";

//     if (/^[A-Za-z]{3}\s\d{2}$/.test(dateString)) {
//       return dateString;
//     }

//     if (/^\d{4}-\d{2}$/.test(dateString)) {
//       const [year, month] = dateString.split("-");
//       const monthNames = [
//         "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
//       ];
//       const monthIndex = parseInt(month, 10) - 1;
//       return `${monthNames[monthIndex]} ${year.slice(-2)}`;
//     }

//     return dateString;
//   };

//   const baseTextStyle: React.CSSProperties = {
//     fontFamily: resumeStyle.fontFamily,
//     fontSize: resumeStyle.bodyFontSize,
//     lineHeight: resumeStyle.lineSpacing,
//     fontWeight: resumeStyle.bold ? "bold" : "normal",
//     fontStyle: resumeStyle.italic ? "italic" : "normal",
//     color: resumeStyle.bodyColor,
//   };

//   const headingStyle: React.CSSProperties = {
//     color: resumeStyle.headingColor,
//     fontSize: resumeStyle.headingFontSize,
//     fontWeight: "bold",
//     textTransform: "uppercase",
//     letterSpacing: "0.5px",
//     marginBottom: "0.75rem",
//   };

//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: resumeStyle.headingColor,
//     letterSpacing: "1.5px",
//   };

//   const linkStyle: React.CSSProperties = {
//     color: resumeStyle.bodyColor,
//     textDecoration: "underline",
//   };

//   const linkIconStyle: React.CSSProperties = {
//     display: "inline-block",
//     marginLeft: "6px",
//     verticalAlign: "middle",
//     color: resumeStyle.headingColor,
//   };

//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <div className="text-center mb-6 page-break-inside-avoid" data-section="personal-info">
//             <h1 className="uppercase font-bold mb-1" style={nameStyle}>
//               {personalInfo.fullName || "Full Name"}
//             </h1>
//             <div className="flex items-center justify-center flex-wrap gap-2 text-xs" style={baseTextStyle}>
//               {[
//                 personalInfo.email,
//                 personalInfo.phone,
//                 personalInfo.location,
//                 personalInfo.linkedinUrl && (
//                   <a 
//                     href={personalInfo.linkedinUrl} 
//                     target="_blank" 
//                     rel="noopener noreferrer" 
//                     style={linkStyle}
//                   >
//                     LinkedIn
//                   </a>
//                 ),
//                 personalInfo.portifolioUrl && (
//                   <a 
//                     href={personalInfo.portifolioUrl} 
//                     target="_blank" 
//                     rel="noopener noreferrer" 
//                     style={linkStyle}
//                   >
//                     Portfolio
//                   </a>
//                 )
//               ]
//                 .filter(Boolean)
//                 .map((item, index, array) => (
//                   <React.Fragment key={index}>
//                     {item}
//                     {index < array.length - 1 && <span>•</span>}
//                   </React.Fragment>
//                 ))}
//             </div>
//             <div className="w-full h-px bg-gray-500 mt-4"></div>
//           </div>
//         );

//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-4 page-break-inside-avoid" data-section="summary">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 SUMMARY
//               </h3>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//             </section>
//           )
//         );

//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-4" data-section="work-experience">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 WORK EXPERIENCE
//               </h3>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{exp.company}</div>
//                       <div className="text-sm font-medium" style={baseTextStyle}>{exp.role}</div>
//                       {exp.location && <div className="text-sm" style={baseTextStyle}>{exp.location}</div>}
//                     </div>
//                     <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </div>
//                   </div>
//                   {exp.description && (
//                     <ul className="list-none space-y-1 mt-2" style={baseTextStyle}>
//                       {exp.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-4" data-section="education">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 EDUCATION
//               </h3>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{edu.degree}</div>
//                       <div className="text-sm" style={baseTextStyle}>{edu.school}</div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-4" data-section="projects">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 PROJECTS
//               </h3>
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div className="font-bold flex items-center" style={baseTextStyle}>
//                       <span>{proj.title}</span>
//                       {proj.link && (
//                         <a 
//                           href={proj.link} 
//                           target="_blank" 
//                           rel="noopener noreferrer"
//                           style={linkIconStyle}
//                           className="hover:opacity-70"
//                           title={proj.link}
//                         >
//                           <ExternalLink size={14} />
//                         </a>
//                       )}
//                     </div>
//                     {(proj.startDate || proj.endDate) && (
//                       <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                         {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
//                       </div>
//                     )}
//                   </div>
//                   {proj.description && (
//                     <ul className="list-none space-y-1 mb-2" style={baseTextStyle}>
//                       {proj.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                   {proj.technologies && proj.technologies.length > 0 && (
//                     <div className="text-sm mt-1" style={baseTextStyle}>
//                       <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="skills">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 SKILLS
//               </h3>
//               <ul className="list-disc pl-5 grid grid-cols-3 gap-x-4 gap-y-1" style={baseTextStyle}>
//                 {skills.map((skill, idx) => (
//                   <li key={idx} className="text-sm">{skill}</li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );

//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-4" data-section="internships">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 INTERNSHIPS
//               </h3>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{intern.company}</div>
//                       <div className="text-sm font-medium" style={baseTextStyle}>{intern.role}</div>
//                       {intern.location && <div className="text-sm" style={baseTextStyle}>{intern.location}</div>}
//                     </div>
//                     <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </div>
//                   </div>
//                   {intern.description && (
//                     <ul className="list-none space-y-1 mt-2" style={baseTextStyle}>
//                       {intern.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-4" data-section="certifications">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 CERTIFICATIONS
//               </h3>
//               {certifications.map((cert, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex items-start">
//                     <span className="mr-2" style={baseTextStyle}>•</span>
//                     <div style={baseTextStyle}>
//                       <div>
//                         <span className="font-medium">{cert.name}</span> - {cert.issuedBy}
//                       </div>
//                       <div className="text-xs mt-1">
//                         <span>Issued: {cert.year}</span>
//                         {cert.expiryDate && (
//                           <span className="ml-3">
//                             Expires: {cert.expiryDate}
//                           </span>
//                         )}
//                       </div>
//                       {cert.credentialId && (
//                         <div className="text-xs mt-1">
//                           Credential ID: {cert.credentialId}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-4" data-section="achievements">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 ACHIEVEMENTS
//               </h3>
//               {achievements.map((achievement, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <span className="font-semibold" style={baseTextStyle}>{achievement.title}</span>
//                     {achievement.date && (
//                       <span className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                         {formatDate(achievement.date)}
//                       </span>
//                     )}
//                   </div>
//                   {achievement.description && (
//                     <p className="text-sm" style={baseTextStyle}>{achievement.description}</p>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-4" data-section="awards">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 AWARDS
//               </h3>
//               {awards.map((award, idx) => (
//                 <div key={idx} className="mb-2 flex items-start" style={baseTextStyle}>
//                   <span className="mr-2">•</span>
//                   <div>
//                     <span className="font-semibold">{award.title}</span>
//                     {award.issuedBy && <> — {award.issuedBy}</>}
//                     {award.year && <> ({award.year})</>}
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-4" data-section="volunteering">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 VOLUNTEERING
//               </h3>
//               {volunteering.map((vol, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{vol.role}</div>
//                       <div className="text-sm" style={baseTextStyle}>{vol.organization}</div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="hobbies">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 HOBBIES
//               </h3>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{hobby.name}</span>
//                   {hobby.description && <> — {hobby.description}</>}
//                   {hobby.proficiencyLevel && <span className="text-sm"> ({hobby.proficiencyLevel})</span>}
//                   {hobby.achievement && <span className="text-sm"> • {hobby.achievement}</span>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="interests">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 INTERESTS
//               </h3>
//               {interests.map((interest, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{interest.name}</span>
//                   {interest.category && <span className="text-sm"> ({interest.category})</span>}
//                   {interest.description && <> — {interest.description}</>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="languages">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 LANGUAGES
//               </h3>
//               <div className="grid grid-cols-2 gap-2">
//                 {languages.map((lang, idx) => (
//                   <div key={idx} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <div>
//                       <span className="font-semibold">{lang.language}</span>
//                       {lang.proficiency && <> — {lang.proficiency}</>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </section>
//           )
//         );

//       case "Publications":
//         return (
//           publications.length > 0 && (
//             <section className="mb-4" data-section="publications">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 PUBLICATIONS
//               </h3>
//               {publications.map((pub, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="font-semibold flex items-center" style={baseTextStyle}>
//                     <span>{pub.title}</span>
//                     {pub.url && (
//                       <a 
//                         href={pub.url} 
//                         target="_blank" 
//                         rel="noopener noreferrer"
//                         style={linkIconStyle}
//                         className="hover:opacity-70"
//                         title={pub.url}
//                       >
//                         <ExternalLink size={14} />
//                       </a>
//                     )}
//                   </div>
//                   <div className="text-sm" style={baseTextStyle}>
//                     {pub.authors}
//                   </div>
//                   <div className="text-sm" style={baseTextStyle}>
//                     <span className="italic">{pub.publicationName}</span>
//                     {pub.date && <> • {formatDate(pub.date)}</>}
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "References":
//         return (
//           references.length > 0 && (
//             <section className="page-break-inside-avoid" data-section="references">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 REFERENCES
//               </h3>
//               {references.map((ref, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="font-semibold" style={baseTextStyle}>{ref.name}</div>
//                   {ref.relation && <div className="text-sm" style={baseTextStyle}>{ref.relation}</div>}
//                   {ref.contact && <div className="text-sm" style={baseTextStyle}>{ref.contact}</div>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <AutoPaginator onPageCountChange={onPageCountChange}>
//       {sectionOrder.map((section, idx) => (
//         <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//       ))}
//     </AutoPaginator>
//   );
// };

// export default TemplateTwo; before color to degree


// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
// import { useResume } from "../../_context/ResumeContext";
// import AutoPaginator from "./AutoPaginator";
// import { ExternalLink } from "lucide-react";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
//   onPageCountChange?: (count: number) => void;
// }

// const TemplateTwo: React.FC<Props> = ({ data, onPageCountChange }) => {
//   const { resumeStyle, sectionOrder } = useResume();
  
//   const {
//     personalInfo,
//     professionalSummary,
//     education,
//     workExperience,
//     projects,
//     skills,
//     certifications,
//     achievements,
//     volunteering,
//     references,
//     internships,
//     awards,
//     hobbies,
//     interests,
//     languages,
//     publications,
//   } = data;

//   const formatDate = (dateString?: string): string => {
//     if (!dateString) return "";

//     if (/^[A-Za-z]{3}\s\d{2}$/.test(dateString)) {
//       return dateString;
//     }

//     if (/^\d{4}-\d{2}$/.test(dateString)) {
//       const [year, month] = dateString.split("-");
//       const monthNames = [
//         "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//         "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
//       ];
//       const monthIndex = parseInt(month, 10) - 1;
//       return `${monthNames[monthIndex]} ${year.slice(-2)}`;
//     }

//     return dateString;
//   };

//   const baseTextStyle: React.CSSProperties = {
//     fontFamily: resumeStyle.fontFamily,
//     fontSize: resumeStyle.bodyFontSize,
//     lineHeight: resumeStyle.lineSpacing,
//     fontWeight: resumeStyle.bold ? "bold" : "normal",
//     fontStyle: resumeStyle.italic ? "italic" : "normal",
//     color: resumeStyle.bodyColor,
//   };

//   const headingStyle: React.CSSProperties = {
//     color: resumeStyle.headingColor,
//     fontSize: resumeStyle.headingFontSize,
//     fontWeight: "bold",
//     textTransform: "uppercase",
//     letterSpacing: "0.5px",
//     marginBottom: "0.75rem",
//   };

//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: resumeStyle.headingColor,
//     letterSpacing: "1.5px",
//   };

//   const linkStyle: React.CSSProperties = {
//     color: resumeStyle.bodyColor,
//     textDecoration: "underline",
//   };

//   const linkIconStyle: React.CSSProperties = {
//     display: "inline-block",
//     marginLeft: "6px",
//     verticalAlign: "middle",
//     color: resumeStyle.headingColor,
//   };

//   // Style for titles (degree, role, project title, etc.) - uses heading color
//   const titleStyle: React.CSSProperties = {
//     ...baseTextStyle,
//     color: "#2A2A2A",
//     fontWeight: "bold",
//   };

//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <div className="text-center mb-6 page-break-inside-avoid" data-section="personal-info">
//             <h1 className="uppercase font-bold mb-1" style={nameStyle}>
//               {personalInfo.fullName || "Full Name"}
//             </h1>
//             <div className="flex items-center justify-center flex-wrap gap-2 text-xs" style={baseTextStyle}>
//               {[
//                 personalInfo.email,
//                 personalInfo.phone,
//                 personalInfo.location,
//                 personalInfo.linkedinUrl && (
//                   <a 
//                     href={personalInfo.linkedinUrl} 
//                     target="_blank" 
//                     rel="noopener noreferrer" 
//                     style={linkStyle}
//                   >
//                     LinkedIn
//                   </a>
//                 ),
//                 personalInfo.portifolioUrl && (
//                   <a 
//                     href={personalInfo.portifolioUrl} 
//                     target="_blank" 
//                     rel="noopener noreferrer" 
//                     style={linkStyle}
//                   >
//                     Portfolio
//                   </a>
//                 )
//               ]
//                 .filter(Boolean)
//                 .map((item, index, array) => (
//                   <React.Fragment key={index}>
//                     {item}
//                     {index < array.length - 1 && <span>•</span>}
//                   </React.Fragment>
//                 ))}
//             </div>
//             <div className="w-full h-px bg-gray-500 mt-4"></div>
//           </div>
//         );

//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-4 page-break-inside-avoid" data-section="summary">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 SUMMARY
//               </h3>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//             </section>
//           )
//         );

//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-4" data-section="work-experience">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 WORK EXPERIENCE
//               </h3>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{exp.company}</div>
//                       <div className="text-sm font-medium" style={titleStyle}>{exp.role}</div>
//                       {exp.location && <div className="text-sm" style={baseTextStyle}>{exp.location}</div>}
//                     </div>
//                     <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </div>
//                   </div>
//                   {exp.description && (
//                     <ul className="list-none space-y-1 mt-2" style={baseTextStyle}>
//                       {exp.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-4" data-section="education">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 EDUCATION
//               </h3>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <div className="font-bold" style={titleStyle}>{edu.degree}</div>
//                       <div className="text-sm" style={baseTextStyle}>{edu.school}</div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-4" data-section="projects">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 PROJECTS
//               </h3>
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div className="font-bold flex items-center" style={titleStyle}>
//                       <span>{proj.title}</span>
//                       {proj.link && (
//                         <a 
//                           href={proj.link} 
//                           target="_blank" 
//                           rel="noopener noreferrer"
//                           style={linkIconStyle}
//                           className="hover:opacity-70"
//                           title={proj.link}
//                         >
//                           <ExternalLink size={14} />
//                         </a>
//                       )}
//                     </div>
//                     {(proj.startDate || proj.endDate) && (
//                       <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                         {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
//                       </div>
//                     )}
//                   </div>
//                   {proj.description && (
//                     <ul className="list-none space-y-1 mb-2" style={baseTextStyle}>
//                       {proj.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                   {proj.technologies && proj.technologies.length > 0 && (
//                     <div className="text-sm mt-1" style={baseTextStyle}>
//                       <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="skills">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 SKILLS
//               </h3>
//               <ul className="list-disc pl-5 grid grid-cols-3 gap-x-4 gap-y-1" style={baseTextStyle}>
//                 {skills.map((skill, idx) => (
//                   <li key={idx} className="text-sm">{skill}</li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );

//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-4" data-section="internships">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 INTERNSHIPS
//               </h3>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>{intern.company}</div>
//                       <div className="text-sm font-medium" style={titleStyle}>{intern.role}</div>
//                       {intern.location && <div className="text-sm" style={baseTextStyle}>{intern.location}</div>}
//                     </div>
//                     <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </div>
//                   </div>
//                   {intern.description && (
//                     <ul className="list-none space-y-1 mt-2" style={baseTextStyle}>
//                       {intern.description.split('\n').map((point, pointIdx) => (
//                         point.trim() && (
//                           <li key={pointIdx} className="flex items-start">
//                             <span className="mr-2">•</span>
//                             <span>{point.trim()}</span>
//                           </li>
//                         )
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-4" data-section="certifications">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 CERTIFICATIONS
//               </h3>
//               {certifications.map((cert, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex items-start">
//                     <span className="mr-2" style={baseTextStyle}>•</span>
//                     <div style={baseTextStyle}>
//                       <div>
//                         <span className="font-medium" style={titleStyle}>{cert.name}</span>
//                         <span style={baseTextStyle}> - {cert.issuedBy}</span>
//                       </div>
//                       <div className="text-xs mt-1">
//                         <span>Issued: {cert.year}</span>
//                         {cert.expiryDate && (
//                           <span className="ml-3">
//                             Expires: {cert.expiryDate}
//                           </span>
//                         )}
//                       </div>
//                       {cert.credentialId && (
//                         <div className="text-xs mt-1">
//                           Credential ID: {cert.credentialId}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-4" data-section="achievements">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 ACHIEVEMENTS
//               </h3>
//               {achievements.map((achievement, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start mb-1">
//                     <span className="font-semibold" style={titleStyle}>{achievement.title}</span>
//                     {achievement.date && (
//                       <span className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                         {formatDate(achievement.date)}
//                       </span>
//                     )}
//                   </div>
//                   {achievement.description && (
//                     <p className="text-sm" style={baseTextStyle}>{achievement.description}</p>
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-4" data-section="awards">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 AWARDS
//               </h3>
//               {awards.map((award, idx) => (
//                 <div key={idx} className="mb-2 flex items-start" style={baseTextStyle}>
//                   <span className="mr-2">•</span>
//                   <div>
//                     <span className="font-semibold" style={titleStyle}>{award.title}</span>
//                     <span style={baseTextStyle}>
//                       {award.issuedBy && <> — {award.issuedBy}</>}
//                       {award.year && <> ({award.year})</>}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-4" data-section="volunteering">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 VOLUNTEERING
//               </h3>
//               {volunteering.map((vol, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <div className="font-bold" style={titleStyle}>{vol.role}</div>
//                       <div className="text-sm" style={baseTextStyle}>{vol.organization}</div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
//                       {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="hobbies">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 HOBBIES
//               </h3>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold" style={titleStyle}>{hobby.name}</span>
//                   {hobby.description && <span style={baseTextStyle}> — {hobby.description}</span>}
//                   {hobby.proficiencyLevel && <span className="text-sm" style={baseTextStyle}> ({hobby.proficiencyLevel})</span>}
//                   {hobby.achievement && <span className="text-sm" style={baseTextStyle}> • {hobby.achievement}</span>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="interests">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 INTERESTS
//               </h3>
//               {interests.map((interest, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold" style={titleStyle}>{interest.name}</span>
//                   {interest.category && <span className="text-sm" style={baseTextStyle}> ({interest.category})</span>}
//                   {interest.description && <span style={baseTextStyle}> — {interest.description}</span>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="mb-4 page-break-inside-avoid" data-section="languages">
//               <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
//                 LANGUAGES
//               </h3>
//               <div className="grid grid-cols-2 gap-2">
//                 {languages.map((lang, idx) => (
//                   <div key={idx} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <div>
//                       <span className="font-semibold" style={titleStyle}>{lang.language}</span>
//                       {lang.proficiency && <span style={baseTextStyle}> — {lang.proficiency}</span>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </section>
//           )
//         );

//       case "Publications":
//         return (
//           publications.length > 0 && (
//             <section className="mb-4" data-section="publications">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 PUBLICATIONS
//               </h3>
//               {publications.map((pub, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="font-semibold flex items-center" style={titleStyle}>
//                     <span>{pub.title}</span>
//                     {pub.url && (
//                       <a 
//                         href={pub.url} 
//                         target="_blank" 
//                         rel="noopener noreferrer"
//                         style={linkIconStyle}
//                         className="hover:opacity-70"
//                         title={pub.url}
//                       >
//                         <ExternalLink size={14} />
//                       </a>
//                     )}
//                   </div>
//                   <div className="text-sm" style={baseTextStyle}>
//                     {pub.authors}
//                   </div>
//                   <div className="text-sm" style={baseTextStyle}>
//                     <span className="italic">{pub.publicationName}</span>
//                     {pub.date && <> • {formatDate(pub.date)}</>}
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "References":
//         return (
//           references.length > 0 && (
//             <section className="page-break-inside-avoid" data-section="references">
//               <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
//                 REFERENCES
//               </h3>
//               {references.map((ref, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="font-semibold" style={titleStyle}>{ref.name}</div>
//                   {ref.relation && <div className="text-sm" style={baseTextStyle}>{ref.relation}</div>}
//                   {ref.contact && <div className="text-sm" style={baseTextStyle}>{ref.contact}</div>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <AutoPaginator onPageCountChange={onPageCountChange}>
//       {sectionOrder.map((section, idx) => (
//         <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//       ))}
//     </AutoPaginator>
//   );
// };

// export default TemplateTwo;


"use client";
import React from "react";
import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
import { useResume } from "../../_context/ResumeContext";
import AutoPaginator from "./AutoPaginator";
import { ExternalLink } from "lucide-react";

interface Props {
  data: ResumeData;
  style: ResumeStyle;
  onPageCountChange?: (count: number) => void;
}

const TemplateTwo: React.FC<Props> = ({ data, onPageCountChange }) => {
  const { resumeStyle, sectionOrder, resumeData } = useResume();
  
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
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "0.75rem",
  };

  const nameStyle: React.CSSProperties = {
    fontSize: resumeStyle.nameFontSize,
    fontWeight: "bold",
    color: resumeStyle.headingColor,
    letterSpacing: "1.5px",
  };

  const linkStyle: React.CSSProperties = {
    color: resumeStyle.bodyColor,
    textDecoration: "underline",
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

  const renderSection = (section: string) => {
    switch (section) {
      case "Personal Info":
        return (
          <div className="text-center mb-6 page-break-inside-avoid" data-section="personal-info">
            <h1 className="uppercase font-bold mb-1" style={nameStyle}>
              {/* {personalInfo.fullName || "Full Name"} */}
              {personalInfo.fullname || "Full Name"}

            </h1>
            <div className="flex items-center justify-center flex-wrap gap-2 text-xs" style={baseTextStyle}>
              {[
                personalInfo.email,
                personalInfo.phone,
                personalInfo.location,
                personalInfo.linkedinUrl && (
                  <a 
                    href={personalInfo.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={linkStyle}
                  >
                    LinkedIn
                  </a>
                ),
                personalInfo.portifolioUrl && (
                  <a 
                    href={personalInfo.portifolioUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={linkStyle}
                  >
                    Portfolio
                  </a>
                )
              ]
                .filter(Boolean)
                .map((item, index, array) => (
                  <React.Fragment key={index}>
                    {item}
                    {index < array.length - 1 && <span>|</span>}
                  </React.Fragment>
                ))}
            </div>
            {/* <div className="w-full h-px bg-gray-800 mt-4"></div> */}
          </div>
        );

      case "Professional Summary":
        return (
          professionalSummary && (
            <section className="mb-4 page-break-inside-avoid" data-section="summary">
              <h3 className="mb-3.5 border-b border-gray-500" style={headingStyle}>
                SUMMARY
              </h3>
              {/* ✅ Changed to support HTML formatting */}
              <div 
                className="text-justify resume-description"
                style={baseTextStyle}
                dangerouslySetInnerHTML={{ __html: professionalSummary }}
              />
            </section>
          )
        );

      case "Work Experience":
        return (
          workExperience.length > 0 && (
            <section className="mb-4" data-section="work-experience">
              <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
                WORK EXPERIENCE
              </h3>
              {workExperience.map((exp, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-bold mb-0.5" style={titleStyle}>{exp.role}</div>
                      <div className="text-sm font-medium mb-0.5" style={baseTextStyle}>{exp.company}</div>
                      {exp.location && <div className="text-sm" style={baseTextStyle}>{exp.location}</div>}
                    </div>
                    <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
                      {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                    </div>
                  </div>
                  {/* ✅ Changed to support HTML formatting */}
                  {exp.description && (
                    <div 
                      className="mt-2 resume-description"
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
            <section className="mb-4" data-section="education">
              <h3 className="mb-3.5 border-b border-gray-500 page-break-after-avoid" style={headingStyle}>
                EDUCATION
              </h3>
              {education.map((edu, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold mb-0.5" style={titleStyle}>{edu.degree}</div>
                      <div className="text-sm" style={baseTextStyle}>{edu.school}</div>
                    </div>
                    <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
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
            <section className="mb-4" data-section="projects">
              <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
                PROJECTS
              </h3>
              {projects.map((proj, idx) => (
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
                    <div className="text-sm mt-1" style={baseTextStyle}>
                      <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )
        );

      // case "Skills":
      //   return (
      //     skills.length > 0 && (
      //       <section className="mb-4 page-break-inside-avoid" data-section="skills">
      //         <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
      //           SKILLS
      //         </h3>
      //         <ul className="list-disc pl-5 grid grid-cols-3 gap-x-4 gap-y-1" style={baseTextStyle}>
      //           {skills.map((skill, idx) => (
      //             <li key={idx} className="text-sm">{skill}</li>
      //           ))}
      //         </ul>
      //       </section>
      //     )
      //   );

      case "Skills":
  return (
    skills.length > 0 && (
      // <section className="page-break-inside-avoid" data-section="skills">
      //   <h2 className="mb-3" style={headingStyle}>
      //     SKILLS
      //   </h2>
      <section className="mb-4 page-break-inside-avoid" data-section="skills">
               <h3 className="mb-3.5 border-b border-gray-500" style={headingStyle}>
                 SKILLS
               </h3>
        
        {data.categorizedSkills ? (
          <div className="space-y-0">
            {Object.entries(data.categorizedSkills).map(([category, categorySkills]) => {
              if (!categorySkills || categorySkills.length === 0) return null;
              
              const categoryLabel = category
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              
              return (
                <div key={category}>
                  <div className="mb-1">
                    <span className="font-semibold" style={titleStyle}>
                      {categoryLabel}:
                    </span>
                    <span style={baseTextStyle}>
                      {" "}{(categorySkills as string[]).join(", ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
            {skills.map((skill, idx) => (
              <li key={idx}>{skill}</li>
            ))}
          </ul>
        )}
        
        {/* <hr className="border-t border-gray-800 mt-4" /> */}
      </section>
    )
  );

      case "Internships":
        return (
          internships.length > 0 && (
            <section className="mb-4" data-section="internships">
              <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
                INTERNSHIPS
              </h3>
              {internships.map((intern, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-bold" style={baseTextStyle}>{intern.company}</div>
                      <div className="text-sm font-medium" style={titleStyle}>{intern.role}</div>
                      {intern.location && <div className="text-sm" style={baseTextStyle}>{intern.location}</div>}
                    </div>
                    <div className="text-sm text-right whitespace-nowrap" style={baseTextStyle}>
                      {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                    </div>
                  </div>
                  {/* ✅ Changed to support HTML formatting */}
                  {intern.description && (
                    <div 
                      className="mt-2 resume-description"
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
            <section className="mb-4" data-section="certifications">
              <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
                CERTIFICATIONS
              </h3>
              {certifications.map((cert, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex items-start">
                    <span className="mr-2" style={baseTextStyle}>•</span>
                    <div style={baseTextStyle}>
                      <div>
                        <span className="font-medium" style={titleStyle}>{cert.name}</span>
                        <span style={baseTextStyle}> - {cert.issuedBy}</span>
                      </div>
                      <div className="text-xs mt-1">
                        {cert.year && <span>{cert.year}</span>}
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
                </div>
              ))}
            </section>
          )
        );

      case "Achievements":
        return (
          achievements.length > 0 && (
            <section className="mb-4" data-section="achievements">
              <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
                ACHIEVEMENTS
              </h3>
              {achievements.map((achievement, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold" style={titleStyle}>{achievement.title}</span>
                    {achievement.date && (
                      <span className="text-sm whitespace-nowrap" style={baseTextStyle}>
                        {formatDate(achievement.date)}
                      </span>
                    )}
                  </div>
                  {/* ✅ Changed to support HTML formatting */}
                  {achievement.description && (
                    <div 
                      className="text-sm resume-description"
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
            <section className="mb-4" data-section="awards">
              <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
                AWARDS
              </h3>
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
            <section className="mb-4" data-section="volunteering">
              <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
                VOLUNTEERING
              </h3>
              {volunteering.map((vol, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold" style={titleStyle}>{vol.role}</div>
                      <div className="text-sm" style={baseTextStyle}>{vol.organization}</div>
                    </div>
                    <div className="text-sm whitespace-nowrap" style={baseTextStyle}>
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
            <section className="mb-4 page-break-inside-avoid" data-section="hobbies">
              <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
                HOBBIES
              </h3>
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
                  {hobby.achievement && <span className="text-sm" style={baseTextStyle}> • {hobby.achievement}</span>}
                </div>
              ))}
            </section>
          )
        );

      case "Interests":
        return (
          interests.length > 0 && (
            <section className="mb-4 page-break-inside-avoid" data-section="interests">
              <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
                INTERESTS
              </h3>
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
            <section className="mb-4 page-break-inside-avoid" data-section="languages">
              <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
                LANGUAGES
              </h3>
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
            <section className="mb-4" data-section="publications">
              <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
                PUBLICATIONS
              </h3>
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
            <section className="page-break-inside-avoid" data-section="references">
              <h3 className="mb-3.5 border-b border-gray-300 page-break-after-avoid" style={headingStyle}>
                REFERENCES
              </h3>
              {references.map((ref, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="font-semibold" style={titleStyle}>{ref.name}</div>
                  {ref.relation && <div className="text-sm" style={baseTextStyle}>{ref.relation}</div>}
                  {ref.contact && <div className="text-sm" style={baseTextStyle}>{ref.contact}</div>}
                </div>
              ))}
            </section>
          )
        );

      default:
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

export default TemplateTwo;
