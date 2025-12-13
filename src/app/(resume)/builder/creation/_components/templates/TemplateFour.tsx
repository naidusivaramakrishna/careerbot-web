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

// const TemplateFour: React.FC<Props> = ({ data, onPageCountChange }) => {
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
//     fontWeight: "700",
//     textTransform: "uppercase",
//     letterSpacing: "0.05em",
//     marginBottom: "0.5rem",
//   };

//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: resumeStyle.headingColor,
//     textTransform: "uppercase",
//   };

//   const linkStyle: React.CSSProperties = {
//     color: resumeStyle.bodyColor,
//     textDecoration: "none",
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
//           <header className="mb-6 page-break-inside-avoid" data-section="personal-info">
//             <div className="flex justify-between items-start">
//               {/* Left: Name and Title */}
//               <div>
//                 <h1 className="uppercase font-bold mb-1" style={nameStyle}>
//                   {personalInfo.fullName || "FULL NAME"}
//                 </h1>
//                 <div className="text-sm font-medium" style={baseTextStyle}>
//                   SOFTWARE ENGINEER
//                 </div>
//               </div>

//               {/* Right: Contact Info */}
//               <div className="text-right text-sm space-y-1" style={baseTextStyle}>
//                 {personalInfo.email && (
//                   <div className="flex items-center justify-end gap-2">
//                     <span>✉</span>
//                     <span>{personalInfo.email}</span>
//                   </div>
//                 )}
//                 {personalInfo.phone && (
//                   <div className="flex items-center justify-end gap-2">
//                     <span>📞</span>
//                     <span>{personalInfo.phone}</span>
//                   </div>
//                 )}
//                 {personalInfo.location && (
//                   <div className="flex items-center justify-end gap-2">
//                     <span>🏢</span>
//                     <span>{personalInfo.location}</span>
//                   </div>
//                 )}
//                 {personalInfo.linkedinUrl && (
//                   <div className="flex items-center justify-end gap-2">
//                     <span>in</span>
//                     <a 
//                       href={personalInfo.linkedinUrl} 
//                       target="_blank" 
//                       rel="noopener noreferrer" 
//                       style={linkStyle}
//                       className="hover:underline"
//                     >
//                       {personalInfo.linkedinUrl.replace('https://', '').replace('http://', '')}
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
//             <section className="mb-6 page-break-inside-avoid" data-section="summary">
//               <h2 className="mb-3" style={headingStyle}>
//                 SUMMARY
//               </h2>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-6" data-section="work-experience">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 EXPERIENCE
//               </h2>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-bold" style={baseTextStyle}>
//                       {exp.company}
//                     </h3>
//                     <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2">
//                     <div className="font-semibold" style={baseTextStyle}>
//                       {exp.role}
//                     </div>
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

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-6" data-section="education">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 EDUCATION
//               </h2>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>
//                         {edu.degree}
//                       </div>
//                       <div className="text-sm" style={baseTextStyle}>
//                         {edu.school}
//                       </div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
//                     </div>
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
//             <section className="mb-6" data-section="projects">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 PROJECTS
//               </h2>
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
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
//                       <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
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
//                     <div className="text-sm" style={baseTextStyle}>
//                       <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
//                     </div>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="skills">
//               <h2 className="mb-3" style={headingStyle}>
//                 SKILLS
//               </h2>
//               <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
//                 {skills.map((skill, idx) => (
//                   <li key={idx}>{skill}</li>
//                 ))}
//               </ul>
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-6" data-section="internships">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 INTERNSHIPS
//               </h2>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-bold" style={baseTextStyle}>
//                       {intern.company}
//                     </h3>
//                     <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2">
//                     <div className="font-semibold" style={baseTextStyle}>
//                       {intern.role}
//                     </div>
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

//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-6" data-section="certifications">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 CERTIFICATIONS
//               </h2>
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
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-6" data-section="achievements">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 ACHIEVEMENTS
//               </h2>
//               {achievements.map((achievement, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <span className="font-semibold" style={baseTextStyle}>
//                       {achievement.title}
//                     </span>
//                     {achievement.date && (
//                       <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
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

//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-6" data-section="awards">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 AWARDS
//               </h2>
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
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-6" data-section="volunteering">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 VOLUNTEERING
//               </h2>
//               {volunteering.map((vol, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>
//                         {vol.role}
//                       </div>
//                       <div className="text-sm" style={baseTextStyle}>
//                         {vol.organization}
//                       </div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="hobbies">
//               <h2 className="mb-3" style={headingStyle}>
//                 HOBBIES
//               </h2>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{hobby.name}</span>
//                   {hobby.description && <> — {hobby.description}</>}
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
//             <section className="mb-6 page-break-inside-avoid" data-section="interests">
//               <h2 className="mb-3" style={headingStyle}>
//                 INTERESTS
//               </h2>
//               {interests.map((interest, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{interest.name}</span>
//                   {interest.category && <span className="text-sm"> ({interest.category})</span>}
//                   {interest.description && <> — {interest.description}</>}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="languages">
//               <h2 className="mb-3" style={headingStyle}>
//                 LANGUAGES
//               </h2>
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
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Publications":
//         return (
//           publications.length > 0 && (
//             <section className="mb-6" data-section="publications">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 PUBLICATIONS
//               </h2>
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
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "References":
//         return (
//           references.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="references">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 REFERENCES
//               </h2>
//               {references.map((ref, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="font-semibold" style={baseTextStyle}>
//                     {ref.name}
//                   </div>
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

// export default TemplateFour;


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

// const TemplateFour: React.FC<Props> = ({ data, onPageCountChange }) => {
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
//     fontWeight: "700",
//     textTransform: "uppercase",
//     letterSpacing: "0.05em",
//     marginBottom: "0.5rem",
//   };

//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: resumeStyle.headingColor,
//     textTransform: "uppercase",
//   };

//   const linkStyle: React.CSSProperties = {
//     color: resumeStyle.bodyColor,
//     textDecoration: "none",
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
//           <header className="mb-6 page-break-inside-avoid" data-section="personal-info">
//             {/* Name and Title */}
//             <div className="mb-3">
//               <h1 className="uppercase font-bold" style={nameStyle}>
//                 {personalInfo.fullName || "FULL NAME"}
//               </h1>
//               {/* <div className="text-sm font-semibold" style={baseTextStyle}>
//                 SOFTWARE ENGINEER
//               </div> */}
//             </div>

//             {/* Contact Info - Two columns layout */}
//             <div className="grid grid-cols-2 gap-x-8 text-sm mb-4" style={baseTextStyle}>
//               {/* Left Column */}
//               <div className="space-y-0.5">
//                 {personalInfo.email && (
//                   <div className="flex items-center gap-2">
//                     <span>{personalInfo.email}</span>
//                   </div>
//                 )}
//                 {personalInfo.location && (
//                   <div className="flex items-center gap-2">
//                     <span>{personalInfo.location}</span>
//                   </div>
//                 )}
//               </div>

//               {/* Right Column */}
//               <div className="space-y-0.5">
//                 {personalInfo.phone && (
//                   <div className="flex items-center gap-2">
//                     <span>{personalInfo.phone}</span>
//                   </div>
//                 )}
//                 {personalInfo.linkedinUrl && (
//                   <div className="flex items-center gap-2">
//                     <span>in</span>
//                     <a 
//                       href={personalInfo.linkedinUrl} 
//                       target="_blank" 
//                       rel="noopener noreferrer" 
//                       style={linkStyle}
//                       className="hover:underline"
//                     >
//                       {personalInfo.linkedinUrl.replace('https://', '').replace('http://', '')}
//                     </a>
//                   </div>
//                 )}
//                 {/* ✅ Portfolio added */}
//                 {personalInfo.portifolioUrl && (
//                   <div className="flex items-center gap-2">
//                     <a 
//                       href={personalInfo.portifolioUrl} 
//                       target="_blank" 
//                       rel="noopener noreferrer" 
//                       style={linkStyle}
//                       className="hover:underline"
//                     >
//                       {personalInfo.portifolioUrl.replace('https://', '').replace('http://', '')}
//                     </a>
//                   </div>
//                 )}
//               </div>
//             </div>

//             <hr className="border-t-2 border-gray-400" />
//           </header>
//         );

//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-6 page-break-inside-avoid" data-section="summary">
//               <h2 className="mb-3 " style={headingStyle}>
//                 SUMMARY
//               </h2>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-6" data-section="work-experience">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 EXPERIENCE
//               </h2>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-bold" style={baseTextStyle}>
//                       {exp.role}
//                     </h3>
//                     <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2">
//                     <div className="font-semibold" style={baseTextStyle}>
//                       {exp.company}
//                     </div>
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
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-6" data-section="education">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 EDUCATION
//               </h2>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>
//                         {edu.degree}
//                       </div>
//                       <div className="text-sm" style={baseTextStyle}>
//                         {edu.school}
//                       </div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-6" data-section="projects">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 PROJECTS
//               </h2>
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
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
//                       <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
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
//                     <div className="text-sm" style={baseTextStyle}>
//                       <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
//                     </div>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//     //   case "Skills":
//     //     return (
//     //       skills.length > 0 && (
//     //         <section className="mb-6 page-break-inside-avoid" data-section="skills">
//     //           <h2 className="mb-3" style={headingStyle}>
//     //             SKILLS
//     //           </h2>
//     //           <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
//     //             {skills.map((skill, idx) => (
//     //               <li key={idx}>{skill}</li>
//     //             ))}
//     //           </ul>
//     //           <hr className="border-t border-gray-800 mt-4" />
//     //         </section>
//     //       )
//     //     );
//       case "Skills":
//   return (
//     skills.length > 0 && (
//       <section className="mb-6 page-break-inside-avoid" data-section="skills">
//         <h2 className="mb-3" style={headingStyle}>
//           SKILLS
//         </h2>
        
//         {/* Check if categorized skills exist */}
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
//                     {categoryLabel}:
//                   {/* </div>
//                   <div className="text-sm" style={baseTextStyle}> */}
//                     {(categorySkills as string[]).join(", ")}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         ) : (
//           // Fallback to flat skills list
//           <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
//             {skills.map((skill, idx) => (
//               <li key={idx}>{skill}</li>
//             ))}
//           </ul>
//         )}
        
//         <hr className="border-t border-gray-400 mt-4" />
//       </section>
//     )
//   );


//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-6" data-section="internships">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 INTERNSHIPS
//               </h2>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-bold" style={baseTextStyle}>
//                       {intern.role}
//                     </h3>
//                     <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2">
//                     <div className="font-semibold" style={baseTextStyle}>
//                       {intern.company}
//                     </div>
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
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//     //   case "Certifications":
//     //     return (
//     //       certifications.length > 0 && (
//     //         <section className="mb-6" data-section="certifications">
//     //           <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//     //             CERTIFICATIONS
//     //           </h2>
//     //           {certifications.map((cert, idx) => (
//     //             <div key={idx} className="mb-2 flex items-start" style={baseTextStyle}>
//     //               <span className="mr-2">•</span>
//     //               <div>
//     //                 <span className="font-semibold">{cert.name}</span>
//     //                 {cert.issuedBy && <> — {cert.issuedBy}</>}
//     //                 {cert.year && <> ({cert.year})</>}
//     //               </div>
//     //             </div>
//     //           ))}
//     //           <hr className="border-t border-gray-800 mt-4" />
//     //         </section>
//     //       )
//     //     );
//       case "Certifications":
//   return (
//     certifications.length > 0 && (
//       <section className="mb-6">
//         <h2 style={headingStyle}>CERTIFICATIONS</h2>
//         {certifications.map((cert, idx) => (
//           <div key={idx} className="mb-3 flex items-start">
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
//         <hr className="border-t border-gray-400 mt-4" />
//       </section>
//     )
//   );


//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-6" data-section="achievements">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 ACHIEVEMENTS
//               </h2>
//               {achievements.map((achievement, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <span className="font-semibold" style={baseTextStyle}>
//                       {achievement.title}
//                     </span>
//                     {achievement.date && (
//                       <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                         {formatDate(achievement.date)}
//                       </span>
//                     )}
//                   </div>
//                   {achievement.description && (
//                     <p style={baseTextStyle}>{achievement.description}</p>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-6" data-section="awards">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 AWARDS
//               </h2>
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
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-6" data-section="volunteering">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 VOLUNTEERING
//               </h2>
//               {volunteering.map((vol, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <div className="font-bold" style={baseTextStyle}>
//                         {vol.role}
//                       </div>
//                       <div className="text-sm" style={baseTextStyle}>
//                         {vol.organization}
//                       </div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="hobbies">
//               <h2 className="mb-3" style={headingStyle}>
//                 HOBBIES
//               </h2>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{hobby.name}</span>
//                   {hobby.description && <> — {hobby.description}</>}
//                   {hobby.proficiencyLevel && <span className="text-sm"> ({hobby.proficiencyLevel})</span>}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="interests">
//               <h2 className="mb-3" style={headingStyle}>
//                 INTERESTS
//               </h2>
//               {interests.map((interest, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{interest.name}</span>
//                   {interest.category && <span className="text-sm"> ({interest.category})</span>}
//                   {interest.description && <> — {interest.description}</>}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="languages">
//               <h2 className="mb-3" style={headingStyle}>
//                 LANGUAGES
//               </h2>
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
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Publications":
//         return (
//           publications.length > 0 && (
//             <section className="mb-6" data-section="publications">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 PUBLICATIONS
//               </h2>
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
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "References":
//         return (
//           references.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="references">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 REFERENCES
//               </h2>
//               {references.map((ref, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="font-semibold" style={baseTextStyle}>
//                     {ref.name}
//                   </div>
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

// export default TemplateFour; before color to degree


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

// const TemplateFour: React.FC<Props> = ({ data, onPageCountChange }) => {
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
//     fontWeight: "700",
//     textTransform: "uppercase",
//     letterSpacing: "0.05em",
//     marginBottom: "0.5rem",
//   };

//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: resumeStyle.headingColor,
//     textTransform: "uppercase",
//   };

//   const linkStyle: React.CSSProperties = {
//     color: resumeStyle.bodyColor,
//     textDecoration: "none",
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
//     fontWeight: "550",
//   };

//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <header className="mb-6 page-break-inside-avoid" data-section="personal-info">
//             <div className="mb-3">
//               <h1 className="uppercase font-bold" style={nameStyle}>
//                 {personalInfo.fullName || "FULL NAME"}
//               </h1>
//             </div>

//             <div className="grid grid-cols-2 gap-x-8 text-sm mb-4" style={baseTextStyle}>
//               <div className="space-y-0.5">
//                 {personalInfo.email && (
//                   <div className="flex items-center gap-2">
//                     <span>{personalInfo.email}</span>
//                   </div>
//                 )}
//                 {personalInfo.location && (
//                   <div className="flex items-center gap-2">
//                     <span>{personalInfo.location}</span>
//                   </div>
//                 )}
//               </div>

//               <div className="space-y-0.5">
//                 {personalInfo.phone && (
//                   <div className="flex items-center gap-2">
//                     <span>{personalInfo.phone}</span>
//                   </div>
//                 )}
//                 {personalInfo.linkedinUrl && (
//                   <div className="flex items-center gap-2">
//                     <span>in</span>
//                     <a 
//                       href={personalInfo.linkedinUrl} 
//                       target="_blank" 
//                       rel="noopener noreferrer" 
//                       style={linkStyle}
//                       className="hover:underline"
//                     >
//                       {personalInfo.linkedinUrl.replace('https://', '').replace('http://', '')}
//                     </a>
//                   </div>
//                 )}
//                 {personalInfo.portifolioUrl && (
//                   <div className="flex items-center gap-2">
//                     <a 
//                       href={personalInfo.portifolioUrl} 
//                       target="_blank" 
//                       rel="noopener noreferrer" 
//                       style={linkStyle}
//                       className="hover:underline"
//                     >
//                       {personalInfo.portifolioUrl.replace('https://', '').replace('http://', '')}
//                     </a>
//                   </div>
//                 )}
//               </div>
//             </div>

//             <hr className="border-t-2 border-gray-400" />
//           </header>
//         );

//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-6 page-break-inside-avoid" data-section="summary">
//               <h2 className="mb-3 " style={headingStyle}>
//                 SUMMARY
//               </h2>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-6" data-section="work-experience">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 EXPERIENCE
//               </h2>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-bold" style={titleStyle}>
//                       {exp.role}
//                     </h3>
//                     <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2">
//                     <div className="font-semibold" style={baseTextStyle}>
//                       {exp.company}
//                     </div>
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
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-6" data-section="education">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 EDUCATION
//               </h2>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <div className="font-bold" style={titleStyle}>
//                         {edu.degree}
//                       </div>
//                       <div className="text-sm" style={baseTextStyle}>
//                         {edu.school}
//                       </div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-6" data-section="projects">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 PROJECTS
//               </h2>
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
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
//                       <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
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
//                     <div className="text-sm" style={baseTextStyle}>
//                       <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
//                     </div>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="skills">
//               <h2 className="mb-3" style={headingStyle}>
//                 SKILLS
//               </h2>
              
//               {data.categorizedSkills ? (
//                 <div className="space-y-3">
//                   {Object.entries(data.categorizedSkills).map(([category, categorySkills]) => {
//                     if (!categorySkills || categorySkills.length === 0) return null;
                    
//                     const categoryLabel = category
//                       .split('_')
//                       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//                       .join(' ');
                    
//                     return (
//                       <div key={category}>
//                         <div className="font-semibold mb-1" style={baseTextStyle}>
//                           {categoryLabel}: {(categorySkills as string[]).join(", ")}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               ) : (
//                 <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
//                   {skills.map((skill, idx) => (
//                     <li key={idx}>{skill}</li>
//                   ))}
//                 </ul>
//               )}
              
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-6" data-section="internships">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 INTERNSHIPS
//               </h2>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-4 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-bold" style={titleStyle}>
//                       {intern.role}
//                     </h3>
//                     <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2">
//                     <div className="font-semibold" style={baseTextStyle}>
//                       {intern.company}
//                     </div>
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
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>CERTIFICATIONS</h2>
//               {certifications.map((cert, idx) => (
//                 <div key={idx} className="mb-3 flex items-start">
//                   <span className="mr-2" style={baseTextStyle}>•</span>
//                   <div style={baseTextStyle}>
//                     <div>
//                       <span className="font-medium" style={titleStyle}>{cert.name}</span>
//                       <span style={baseTextStyle}> - {cert.issuedBy}</span>
//                     </div>
//                     <div className="text-xs mt-1">
//                       <span>Issued: {cert.year}</span>
//                       {cert.expiryDate && (
//                         <span className="ml-3">
//                           Expires: {cert.expiryDate}
//                         </span>
//                       )}
//                     </div>
//                     {cert.credentialId && (
//                       <div className="text-xs mt-1">
//                         Credential ID: {cert.credentialId}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-6" data-section="achievements">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 ACHIEVEMENTS
//               </h2>
//               {achievements.map((achievement, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <span className="font-semibold" style={titleStyle}>
//                       {achievement.title}
//                     </span>
//                     {achievement.date && (
//                       <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                         {formatDate(achievement.date)}
//                       </span>
//                     )}
//                   </div>
//                   {achievement.description && (
//                     <p style={baseTextStyle}>{achievement.description}</p>
//                   )}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-6" data-section="awards">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 AWARDS
//               </h2>
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
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-6" data-section="volunteering">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 VOLUNTEERING
//               </h2>
//               {volunteering.map((vol, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <div className="font-bold" style={titleStyle}>
//                         {vol.role}
//                       </div>
//                       <div className="text-sm" style={baseTextStyle}>
//                         {vol.organization}
//                       </div>
//                     </div>
//                     <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
//                       {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="hobbies">
//               <h2 className="mb-3" style={headingStyle}>
//                 HOBBIES
//               </h2>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold" style={titleStyle}>{hobby.name}</span>
//                   {hobby.description && <span style={baseTextStyle}> — {hobby.description}</span>}
//                   {hobby.proficiencyLevel && <span className="text-sm" style={baseTextStyle}> ({hobby.proficiencyLevel})</span>}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="interests">
//               <h2 className="mb-3" style={headingStyle}>
//                 INTERESTS
//               </h2>
//               {interests.map((interest, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold" style={titleStyle}>{interest.name}</span>
//                   {interest.category && <span className="text-sm" style={baseTextStyle}> ({interest.category})</span>}
//                   {interest.description && <span style={baseTextStyle}> — {interest.description}</span>}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="languages">
//               <h2 className="mb-3" style={headingStyle}>
//                 LANGUAGES
//               </h2>
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
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "Publications":
//         return (
//           publications.length > 0 && (
//             <section className="mb-6" data-section="publications">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 PUBLICATIONS
//               </h2>
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
//               <hr className="border-t border-gray-400 mt-4" />
//             </section>
//           )
//         );

//       case "References":
//         return (
//           references.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="references">
//               <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
//                 REFERENCES
//               </h2>
//               {references.map((ref, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="font-semibold" style={titleStyle}>
//                     {ref.name}
//                   </div>
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

// export default TemplateFour;


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

const TemplateFour: React.FC<Props> = ({ data, onPageCountChange }) => {
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
    marginBottom: "0.5rem",
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

  const renderSection = (section: string) => {
    switch (section) {
      case "Personal Info":
        return (
          <header className="mb-6 page-break-inside-avoid" data-section="personal-info">
            <div className="mb-3">
              <h1 className="uppercase font-bold" style={nameStyle}>
                {personalInfo.fullName || "FULL NAME"}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-x-8 text-sm mb-4" style={baseTextStyle}>
              <div className="space-y-0.5">
                {personalInfo.email && (
                  <div className="flex items-center gap-2">
                    <span>{personalInfo.email}</span>
                  </div>
                )}
                {personalInfo.location && (
                  <div className="flex items-center gap-2">
                    <span>{personalInfo.location}</span>
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                {personalInfo.phone && (
                  <div className="flex items-center gap-2">
                    <span>{personalInfo.phone}</span>
                  </div>
                )}
                {personalInfo.linkedinUrl && (
                  <div className="flex items-center gap-2">
                    {/* <span>in</span> */}
                    <a 
                      href={personalInfo.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={linkStyle}
                      className="hover:underline"
                    >
                      {personalInfo.linkedinUrl.replace('https://', '').replace('http://', '')}
                    </a>
                  </div>
                )}
                {/* {personalInfo.portifolioUrl && (
                  <div className="flex items-center gap-2">
                    <a 
                      href={personalInfo.portifolioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={linkStyle}
                      className="hover:underline"
                    >
                      {personalInfo.portifolioUrl.replace('https://', '').replace('http://', '')}
                    </a>
                  </div>
                )} */}
              </div>

              <div className="space-y-0.5">
                {personalInfo.portifolioUrl && (
                  <div className="flex items-center gap-2">
                    <a 
                      href={personalInfo.portifolioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={linkStyle}
                      className="hover:underline"
                    >
                      {personalInfo.portifolioUrl.replace('https://', '').replace('http://', '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-t-2 border-gray-400" />
          </header>
        );

      case "Professional Summary":
        return (
          professionalSummary && (
            <section className="mb-6 page-break-inside-avoid" data-section="summary">
              <h2 className="mb-3 " style={headingStyle}>
                SUMMARY
              </h2>
              {/* ✅ Changed to support HTML formatting */}
              <div 
                className="text-justify resume-description"
                style={baseTextStyle}
                dangerouslySetInnerHTML={{ __html: professionalSummary }}
              />
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "Work Experience":
        return (
          workExperience.length > 0 && (
            <section className="mb-6" data-section="work-experience">
              <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
                EXPERIENCE
              </h2>
              {workExperience.map((exp, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold" style={titleStyle}>
                      {exp.role}
                    </h3>
                    <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                      {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="font-semibold" style={baseTextStyle}>
                      {exp.company}
                    </div>
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
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "Education":
        return (
          education.length > 0 && (
            <section className="mb-6" data-section="education">
              <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
                EDUCATION
              </h2>
              {education.map((edu, idx) => (
                <div key={idx} className="mb-3 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <div className="font-bold" style={titleStyle}>
                        {edu.degree}
                      </div>
                      <div className="text-sm" style={baseTextStyle}>
                        {edu.school}
                      </div>
                    </div>
                    <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                      {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                    </div>
                  </div>
                </div>
              ))}
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "Projects":
        return (
          projects.length > 0 && (
            <section className="mb-6" data-section="projects">
              <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
                PROJECTS
              </h2>
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
                      <div className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
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
                    <div className="text-sm" style={baseTextStyle}>
                      <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
                    </div>
                  )}
                </div>
              ))}
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      // case "Skills":
      //   return (
      //     skills.length > 0 && (
      //       <section className="mb-6 page-break-inside-avoid" data-section="skills">
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
              
      //         <hr className="border-t border-gray-400 mt-4" />
      //       </section>
      //     )
      //   );
      case "Skills":
  return (
    skills.length > 0 && (
      <section className="mb-6 page-break-inside-avoid" data-section="skills">
        <h2 className="mb-3" style={headingStyle}>
          SKILLS
        </h2>
        
        {data.categorizedSkills ? (
          <div className="space-y-3">
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
        
        <hr className="border-t border-gray-400 mt-4" />
      </section>
    )
  );


      case "Internships":
        return (
          internships.length > 0 && (
            <section className="mb-6" data-section="internships">
              <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
                INTERNSHIPS
              </h2>
              {internships.map((intern, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold" style={titleStyle}>
                      {intern.role}
                    </h3>
                    <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                      {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="font-semibold" style={baseTextStyle}>
                      {intern.company}
                    </div>
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
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "Certifications":
        return (
          certifications.length > 0 && (
            <section className="mb-6">
              <h2 style={headingStyle}>CERTIFICATIONS</h2>
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
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "Achievements":
        return (
          achievements.length > 0 && (
            <section className="mb-6" data-section="achievements">
              <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
                ACHIEVEMENTS
              </h2>
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
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "Awards":
        return (
          awards.length > 0 && (
            <section className="mb-6" data-section="awards">
              <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
                AWARDS
              </h2>
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
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "Volunteering":
        return (
          volunteering.length > 0 && (
            <section className="mb-6" data-section="volunteering">
              <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
                VOLUNTEERING
              </h2>
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
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "Hobbies":
        return (
          hobbies.length > 0 && (
            <section className="mb-6 page-break-inside-avoid" data-section="hobbies">
              <h2 className="mb-3" style={headingStyle}>
                HOBBIES
              </h2>
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
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "Interests":
        return (
          interests.length > 0 && (
            <section className="mb-6 page-break-inside-avoid" data-section="interests">
              <h2 className="mb-3" style={headingStyle}>
                INTERESTS
              </h2>
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
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "Languages":
        return (
          languages.length > 0 && (
            <section className="mb-6 page-break-inside-avoid" data-section="languages">
              <h2 className="mb-3" style={headingStyle}>
                LANGUAGES
              </h2>
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
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "Publications":
        return (
          publications.length > 0 && (
            <section className="mb-6" data-section="publications">
              <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
                PUBLICATIONS
              </h2>
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
              <hr className="border-t border-gray-400 mt-4" />
            </section>
          )
        );

      case "References":
        return (
          references.length > 0 && (
            <section className="mb-6 page-break-inside-avoid" data-section="references">
              <h2 className="mb-3 page-break-after-avoid" style={headingStyle}>
                REFERENCES
              </h2>
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

export default TemplateFour;
