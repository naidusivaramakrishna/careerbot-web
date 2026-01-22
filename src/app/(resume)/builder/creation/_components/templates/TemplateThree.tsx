// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle, useResume } from "../../_context/ResumeContext";
// import AutoPaginator from "./AutoPaginator";
// import { ExternalLink } from "lucide-react";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
//   onPageCountChange?: (count: number) => void;
// }

// const TemplateThree: React.FC<Props> = ({ data, onPageCountChange }) => {
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
//     fontWeight: "700",
//     textTransform: "uppercase",
//     letterSpacing: "0.05em",
//     marginBottom: "0.5rem",
//     borderBottom: `2px solid ${resumeStyle.headingColor}`,
//     paddingBottom: "0.25rem",
//   };

//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: resumeStyle.headingColor,
//     textTransform: "uppercase",
//     letterSpacing: "0.1em",
//   };

//   const linkStyle: React.CSSProperties = {
//     color: resumeStyle.bodyColor,
//     textDecoration: "none",
//   };

//   // ✅ Link icon style
//   const linkIconStyle: React.CSSProperties = {
//     display: "inline-block",
//     marginLeft: "6px",
//     verticalAlign: "middle",
//     color: resumeStyle.headingColor,
//   };

//   // ✅ Categorize sections into left and right columns
//   const leftColumnSections = ["Skills", "Languages", "Interests", "Hobbies", "Certifications", "Awards"];
//   const rightColumnSections = ["Professional Summary", "Work Experience", "Internships", "Education", "Projects", "Achievements", "Publications", "Volunteering", "References"];

//   // ✅ Render section content
//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>SUMMARY</h2>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//             </section>
//           )
//         );

//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>SKILLS</h2>
//               <div className="space-y-1">
//                 {skills.map((skill, index) => (
//                   <div key={index} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <span>{skill}</span>
//                   </div>
//                 ))}
//               </div>
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
//                     <span className="text-sm whitespace-nowrap ml-2" style={baseTextStyle}>
//                       {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2 flex items-center" style={baseTextStyle}>
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
//                     <span className="text-sm whitespace-nowrap ml-2" style={baseTextStyle}>
//                       {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </span>
//                   </div>
//                   <div className="mb-2 flex items-center" style={baseTextStyle}>
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
//                     <span className="text-sm whitespace-nowrap ml-2" style={baseTextStyle}>
//                       {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
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
//                     <h3 className="font-semibold flex items-center" style={baseTextStyle}>
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
//                     </h3>
//                     {(proj.startDate || proj.endDate) && (
//                       <span className="text-sm whitespace-nowrap ml-2" style={baseTextStyle}>
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
//                 </div>
//               ))}
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
//                     <span className="font-medium">{cert.name}</span>
//                     <div className="text-sm">{cert.issuedBy} ({cert.year})</div>
//                   </div>
//                 </div>
//               ))}
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
//                     <span className="font-medium">{award.title}</span>
//                     <div className="text-sm">{award.issuedBy} ({award.year})</div>
//                   </div>
//                 </div>
//               ))}
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
//                       <span className="text-sm whitespace-nowrap ml-2" style={baseTextStyle}>
//                         {formatDate(achievement.date)}
//                       </span>
//                     )}
//                   </div>
//                   {achievement.description && (
//                     <p style={baseTextStyle}>{achievement.description}</p>
//                   )}
//                 </div>
//               ))}
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
//                   <h3 className="font-semibold flex items-center" style={baseTextStyle}>
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
//                   </h3>
//                   <p className="text-sm" style={baseTextStyle}>
//                     {pub.authors}
//                   </p>
//                   <p className="text-sm" style={baseTextStyle}>
//                     <span className="italic">{pub.publicationName}</span> • {formatDate(pub.date)}
//                   </p>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>LANGUAGES</h2>
//               <div className="space-y-1">
//                 {languages.map((lang, idx) => (
//                   <div key={idx} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <div>
//                       <span className="font-medium">{lang.language}</span>
//                       <div className="text-sm">{lang.proficiency}</div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </section>
//           )
//         );

//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>HOBBIES</h2>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2 flex items-start" style={baseTextStyle}>
//                   <span className="mr-2">•</span>
//                   <div>
//                     <h3 className="font-medium">{hobby.name}</h3>
//                     {hobby.description && <p className="text-sm">{hobby.description}</p>}
//                     {hobby.proficiencyLevel && <span className="text-sm">({hobby.proficiencyLevel})</span>}
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-6">
//               <h2 style={headingStyle}>INTERESTS</h2>
//               <div className="space-y-1">
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
//                     <span className="text-sm whitespace-nowrap ml-2" style={baseTextStyle}>
//                       {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
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
//     <AutoPaginator onPageCountChange={onPageCountChange}>
//       {/* Header with Name */}
//       <header className="mb-6 text-center border-b-4 pb-4" style={{ borderColor: resumeStyle.headingColor }}>
//         <h1 className="mb-3" style={nameStyle}>
//           {personalInfo.fullName || "FULL NAME"}
//         </h1>
        
//         {/* Contact Info - Single Line */}
//         <div className="flex justify-center items-center gap-3 flex-wrap text-sm" style={baseTextStyle}>
//           {personalInfo.phone && <span>{personalInfo.phone}</span>}
//           {personalInfo.email && <span>•</span>}
//           {personalInfo.email && <span>{personalInfo.email}</span>}
//           {personalInfo.location && <span>•</span>}
//           {personalInfo.location && <span>{personalInfo.location}</span>}
//           {personalInfo.linkedinUrl && <span>•</span>}
//           {personalInfo.linkedinUrl && (
//             <a
//               href={personalInfo.linkedinUrl}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={linkStyle}
//               className="hover:underline"
//             >
//               LinkedIn
//             </a>
//           )}
//           {personalInfo.portifolioUrl && <span>•</span>}
//           {personalInfo.portifolioUrl && (
//             <a
//               href={personalInfo.portifolioUrl}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={linkStyle}
//               className="hover:underline"
//             >
//               Portfolio
//             </a>
//           )}
//         </div>
//       </header>

//       {/* Two Column Layout */}
//       <div className="grid grid-cols-12 gap-6">
//         {/* Left Column - 4 cols */}
//         <div className="col-span-4 space-y-6">
//           {sectionOrder
//             .filter((section) => leftColumnSections.includes(section))
//             .map((section, idx) => (
//               <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//             ))}
//         </div>

//         {/* Right Column - 8 cols */}
//         <div className="col-span-8 space-y-6">
//           {sectionOrder
//             .filter((section) => rightColumnSections.includes(section))
//             .map((section, idx) => (
//               <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//             ))}
//         </div>
//       </div>
//     </AutoPaginator>
//   );
// };

// export default TemplateThree;


// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle, useResume } from "../../_context/ResumeContext";
// import AutoPaginator from "./AutoPaginator";
// import { ExternalLink } from "lucide-react";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
//   onPageCountChange?: (count: number) => void;
// }

// const TemplateThree: React.FC<Props> = ({ data, onPageCountChange }) => {
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
//             <div className="mb-2">
//               <h1 className="uppercase font-bold" style={nameStyle}>
//                 {personalInfo.fullName || "FULL NAME"}
//               </h1>
//               {/* <div className="text-sm font-semibold" style={baseTextStyle}>
//                 SOFTWARE ENGINEER
//               </div> */}
//             </div>

//             {/* Contact Info - Single horizontal line */}
//             <div className="flex items-center gap-4 text-sm mb-4 flex-wrap" style={baseTextStyle}>
//               {personalInfo.email && (
//                 <div className="flex items-center gap-1">
//                   {/* <span>✉</span> */}
//                   <span>{personalInfo.email}</span>
//                 </div>
//               )}
//               {personalInfo.phone && (
//                 <div className="flex items-center gap-1">
//                   {/* <span>📞</span> */}
//                   <span>{personalInfo.phone}</span>
//                 </div>
//               )}
//               {personalInfo.location && (
//                 <div className="flex items-center gap-1">
//                   {/* <span>🏢</span> */}
//                   <span>{personalInfo.location}</span>
//                 </div>
//               )}
//               {personalInfo.linkedinUrl && (
//                 <div className="flex items-center gap-1">
//                   <span>in</span>
//                   <a
//                     href={personalInfo.linkedinUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     style={linkStyle}
//                     className="hover:underline"
//                   >
//                     {personalInfo.linkedinUrl.replace('https://', '').replace('http://', '')}
//                   </a>
//                 </div>
//               )}
//               {/* ✅ Portfolio added */}
//               {personalInfo.portifolioUrl && (
//                 <div className="flex items-center gap-1">
//                   <a
//                     href={personalInfo.portifolioUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     style={linkStyle}
//                     className="hover:underline"
//                   >
//                     {personalInfo.portifolioUrl.replace('https://', '').replace('http://', '')}
//                   </a>
//                 </div>
//               )}
//             </div>

//             <hr className="border-t-2 border-gray-800" />
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
//                   <div className="font-semibold mb-2" style={baseTextStyle}>
//                     {exp.role}
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
//                       <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
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
//                   <div className="font-semibold mb-2" style={baseTextStyle}>
//                     {intern.role}
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

//     case "Certifications":
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
//         <hr className="border-t border-gray-800 mt-4" />
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

// export default TemplateThree; before line after section


// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle, useResume } from "../../_context/ResumeContext";
// import AutoPaginator from "./AutoPaginator";
// import { ExternalLink } from "lucide-react";


// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
//   onPageCountChange?: (count: number) => void;
// }


// const TemplateThree: React.FC<Props> = ({ data, onPageCountChange }) => {
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


//   // ✅ NEW: Heading with line component style
//   const headingContainerStyle: React.CSSProperties = {
//     display: "flex",
//     alignItems: "center",
//     width: "100%",
//     marginBottom: "0.75rem",
//   };


//   const headingLineStyle: React.CSSProperties = {
//     flex: 1,
//     borderTop: `1px solid #808080`,
//     marginLeft: "1rem",
//   };


//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <header className="mb-6 page-break-inside-avoid" data-section="personal-info">
//             {/* Name and Title */}
//             <div className="mb-2">
//               <h1 className="uppercase font-bold" style={nameStyle}>
//                 {personalInfo.fullName || "FULL NAME"}
//               </h1>
//             </div>


//             {/* Contact Info - Single horizontal line */}
//             <div className="flex items-center gap-4 text-sm mb-4 flex-wrap" style={baseTextStyle}>
//               {personalInfo.email && (
//                 <div className="flex items-center gap-1">
//                   <span>{personalInfo.email}</span>
//                 </div>
//               )}
//               {personalInfo.phone && (
//                 <div className="flex items-center gap-1">
//                   <span>{personalInfo.phone}</span>
//                 </div>
//               )}
//               {personalInfo.location && (
//                 <div className="flex items-center gap-1">
//                   <span>{personalInfo.location}</span>
//                 </div>
//               )}
//               {personalInfo.linkedinUrl && (
//                 <div className="flex items-center gap-1">
//                   <span>in</span>
//                   <a
//                     href={personalInfo.linkedinUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     style={linkStyle}
//                     className="hover:underline"
//                   >
//                     {personalInfo.linkedinUrl.replace('https://', '').replace('http://', '')}
//                   </a>
//                 </div>
//               )}
//               {/* ✅ Portfolio added */}
//               {personalInfo.portifolioUrl && (
//                 <div className="flex items-center gap-1">
//                   <a
//                     href={personalInfo.portifolioUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     style={linkStyle}
//                     className="hover:underline"
//                   >
//                     {personalInfo.portifolioUrl.replace('https://', '').replace('http://', '')}
//                   </a>
//                 </div>
//               )}
//             </div>


//             {/* <hr className="border-t-2 border-gray-800" /> */}
//           </header>
//         );


//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-6 page-break-inside-avoid" data-section="summary">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>SUMMARY</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-6" data-section="work-experience">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>EXPERIENCE</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//                   <div className="font-semibold mb-2" style={baseTextStyle}>
//                     {exp.role}
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
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-6" data-section="education">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>EDUCATION</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-6" data-section="projects">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>PROJECTS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//                       <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
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
//                   {proj.technologies && proj.technologies.length > 0 && (
//                     <div className="text-sm" style={baseTextStyle}>
//                       <span className="font-semibold">Technologies:</span> {proj.technologies.join(", ")}
//                     </div>
//                   )}
//                 </div>
//               ))}
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="skills">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>SKILLS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
//                 {skills.map((skill, idx) => (
//                   <li key={idx}>{skill}</li>
//                 ))}
//               </ul>
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-6" data-section="internships">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>INTERNSHIPS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//                   <div className="font-semibold mb-2" style={baseTextStyle}>
//                     {intern.role}
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
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-6" data-section="certifications">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>CERTIFICATIONS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               {certifications.map((cert, idx) => (
//                 <div key={idx} className="mb-3 flex items-start">
//                   <span className="mr-2" style={baseTextStyle}>•</span>
//                   <div style={baseTextStyle}>
//                     <div>
//                       <span className="font-medium">{cert.name}</span> - {cert.issuedBy}
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
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-6" data-section="achievements">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>ACHIEVEMENTS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-6" data-section="awards">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>AWARDS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-6" data-section="volunteering">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>VOLUNTEERING</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="hobbies">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>HOBBIES</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{hobby.name}</span>
//                   {hobby.description && <> — {hobby.description}</>}
//                   {hobby.proficiencyLevel && <span className="text-sm"> ({hobby.proficiencyLevel})</span>}
//                 </div>
//               ))}
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="interests">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>INTERESTS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               {interests.map((interest, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{interest.name}</span>
//                   {interest.category && <span className="text-sm"> ({interest.category})</span>}
//                   {interest.description && <> — {interest.description}</>}
//                 </div>
//               ))}
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="languages">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>LANGUAGES</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "Publications":
//         return (
//           publications.length > 0 && (
//             <section className="mb-6" data-section="publications">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>PUBLICATIONS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//               {/* <hr className="border-t border-gray-800 mt-4" /> */}
//             </section>
//           )
//         );


//       case "References":
//         return (
//           references.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="references">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>REFERENCES</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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


// export default TemplateThree;


// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle, useResume } from "../../_context/ResumeContext";
// import AutoPaginator from "./AutoPaginator";
// import { ExternalLink } from "lucide-react";



// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
//   onPageCountChange?: (count: number) => void;
// }



// const TemplateThree: React.FC<Props> = ({ data, onPageCountChange }) => {
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



//   // ✅ NEW: Heading with line component style
//   const headingContainerStyle: React.CSSProperties = {
//     display: "flex",
//     alignItems: "center",
//     width: "100%",
//     marginBottom: "0.75rem",
//   };



//   const headingLineStyle: React.CSSProperties = {
//     flex: 1,
//     borderTop: `1px solid #808080`,
//     marginLeft: "1rem",
//   };



//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <header className="mb-6 page-break-inside-avoid" data-section="personal-info">
//             {/* Name and Title */}
//             <div className="mb-2">
//               <h1 className="uppercase font-bold" style={nameStyle}>
//                 {personalInfo.fullName || "FULL NAME"}
//               </h1>
//             </div>



//             {/* Contact Info - With pipe separators */}
//             <div className="flex items-center text-sm mb-4 flex-wrap" style={baseTextStyle}>
//               {personalInfo.email && (
//                 <>
//                   <span>{personalInfo.email}</span>
//                 </>
//               )}
//               {personalInfo.phone && (
//                 <>
//                   {personalInfo.email && <span className="mx-2">|</span>}
//                   <span>{personalInfo.phone}</span>
//                 </>
//               )}
//               {personalInfo.location && (
//                 <>
//                   {(personalInfo.email || personalInfo.phone) && <span className="mx-2">|</span>}
//                   <span>{personalInfo.location}</span>
//                 </>
//               )}
//               {personalInfo.linkedinUrl && (
//                 <>
//                   {(personalInfo.email || personalInfo.phone || personalInfo.location) && <span className="mx-2">|</span>}
//                   <span>in</span>
//                   <a
//                     href={personalInfo.linkedinUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     style={linkStyle}
//                     className="hover:underline ml-1"
//                   >
//                     {personalInfo.linkedinUrl.replace('https://', '').replace('http://', '')}
//                   </a>
//                 </>
//               )}
//               {/* ✅ Portfolio added */}
//               {personalInfo.portifolioUrl && (
//                 <>
//                   {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedinUrl) && <span className="mx-2">|</span>}
//                   <a
//                     href={personalInfo.portifolioUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     style={linkStyle}
//                     className="hover:underline"
//                   >
//                     {personalInfo.portifolioUrl.replace('https://', '').replace('http://', '')}
//                   </a>
//                 </>
//               )}
//             </div>
//           </header>
//         );



//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-6 page-break-inside-avoid" data-section="summary">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>SUMMARY</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//             </section>
//           )
//         );



//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-6" data-section="work-experience">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>EXPERIENCE</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//                   <div className="font-semibold mb-2" style={baseTextStyle}>
//                     {exp.role}
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
//             </section>
//           )
//         );



//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-6" data-section="education">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>EDUCATION</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             </section>
//           )
//         );



//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-6" data-section="projects">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>PROJECTS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//                       <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
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
//                   {proj.technologies && proj.technologies.length > 0 && (
//                     <div className="text-sm" style={baseTextStyle}>
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
//             <section className="mb-6 page-break-inside-avoid" data-section="skills">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>SKILLS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
//                 {skills.map((skill, idx) => (
//                   <li key={idx}>{skill}</li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );



//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-6" data-section="internships">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>INTERNSHIPS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//                   <div className="font-semibold mb-2" style={baseTextStyle}>
//                     {intern.role}
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
//             </section>
//           )
//         );



//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-6" data-section="certifications">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>CERTIFICATIONS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               {certifications.map((cert, idx) => (
//                 <div key={idx} className="mb-3 flex items-start">
//                   <span className="mr-2" style={baseTextStyle}>•</span>
//                   <div style={baseTextStyle}>
//                     <div>
//                       <span className="font-medium">{cert.name}</span> - {cert.issuedBy}
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
//             </section>
//           )
//         );



//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-6" data-section="achievements">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>ACHIEVEMENTS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             </section>
//           )
//         );



//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-6" data-section="awards">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>AWARDS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             <section className="mb-6" data-section="volunteering">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>VOLUNTEERING</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             </section>
//           )
//         );



//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="hobbies">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>HOBBIES</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold">{hobby.name}</span>
//                   {hobby.description && <> — {hobby.description}</>}
//                   {hobby.proficiencyLevel && <span className="text-sm"> ({hobby.proficiencyLevel})</span>}
//                 </div>
//               ))}
//             </section>
//           )
//         );



//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="interests">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>INTERESTS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             <section className="mb-6 page-break-inside-avoid" data-section="languages">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>LANGUAGES</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             <section className="mb-6" data-section="publications">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>PUBLICATIONS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             <section className="mb-6 page-break-inside-avoid" data-section="references">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>REFERENCES</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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



// export default TemplateThree; before color to degree



// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle, useResume } from "../../_context/ResumeContext";
// import AutoPaginator from "./AutoPaginator";
// import { ExternalLink } from "lucide-react";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
//   onPageCountChange?: (count: number) => void;
// }

// const TemplateThree: React.FC<Props> = ({ data, onPageCountChange }) => {
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
//     fontWeight: "bold",
//   };

//   const headingContainerStyle: React.CSSProperties = {
//     display: "flex",
//     alignItems: "center",
//     width: "100%",
//     marginBottom: "0.75rem",
//   };

//   const headingLineStyle: React.CSSProperties = {
//     flex: 1,
//     borderTop: `1px solid #808080`,
//     marginLeft: "1rem",
//   };

//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <header className="mb-6 page-break-inside-avoid" data-section="personal-info">
//             <div className="mb-2">
//               <h1 className="uppercase font-bold" style={nameStyle}>
//                 {personalInfo.fullName || "FULL NAME"}
//               </h1>
//             </div>

//             <div className="flex items-center text-sm mb-4 flex-wrap" style={baseTextStyle}>
//               {personalInfo.email && (
//                 <>
//                   <span>{personalInfo.email}</span>
//                 </>
//               )}
//               {personalInfo.phone && (
//                 <>
//                   {personalInfo.email && <span className="mx-2">|</span>}
//                   <span>{personalInfo.phone}</span>
//                 </>
//               )}
//               {personalInfo.location && (
//                 <>
//                   {(personalInfo.email || personalInfo.phone) && <span className="mx-2">|</span>}
//                   <span>{personalInfo.location}</span>
//                 </>
//               )}
//               {personalInfo.linkedinUrl && (
//                 <>
//                   {(personalInfo.email || personalInfo.phone || personalInfo.location) && <span className="mx-2">|</span>}
//                   <span>in</span>
//                   <a
//                     href={personalInfo.linkedinUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     style={linkStyle}
//                     className="hover:underline ml-1"
//                   >
//                     {personalInfo.linkedinUrl.replace('https://', '').replace('http://', '')}
//                   </a>
//                 </>
//               )}
//               {personalInfo.portifolioUrl && (
//                 <>
//                   {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedinUrl) && <span className="mx-2">|</span>}
//                   <a
//                     href={personalInfo.portifolioUrl}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     style={linkStyle}
//                     className="hover:underline"
//                   >
//                     {personalInfo.portifolioUrl.replace('https://', '').replace('http://', '')}
//                   </a>
//                 </>
//               )}
//             </div>
//           </header>
//         );

//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-6 page-break-inside-avoid" data-section="summary">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>SUMMARY</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//             </section>
//           )
//         );

//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-6" data-section="work-experience">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>EXPERIENCE</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//                   <div className="font-semibold mb-2" style={titleStyle}>
//                     {exp.role}
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
//             </section>
//           )
//         );

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-6" data-section="education">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>EDUCATION</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             </section>
//           )
//         );

//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-6" data-section="projects">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>PROJECTS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//                       <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
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
//                   {proj.technologies && proj.technologies.length > 0 && (
//                     <div className="text-sm" style={baseTextStyle}>
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
//             <section className="mb-6 page-break-inside-avoid" data-section="skills">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>SKILLS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
//                 {skills.map((skill, idx) => (
//                   <li key={idx}>{skill}</li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );

//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-6" data-section="internships">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>INTERNSHIPS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//                   <div className="font-semibold mb-2" style={titleStyle}>
//                     {intern.role}
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
//             </section>
//           )
//         );

//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-6" data-section="certifications">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>CERTIFICATIONS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             </section>
//           )
//         );

//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-6" data-section="achievements">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>ACHIEVEMENTS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             </section>
//           )
//         );

//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-6" data-section="awards">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>AWARDS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             <section className="mb-6" data-section="volunteering">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>VOLUNTEERING</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             </section>
//           )
//         );

//       case "Hobbies":
//         return (
//           hobbies.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="hobbies">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>HOBBIES</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <span className="font-semibold" style={titleStyle}>{hobby.name}</span>
//                   {hobby.description && <span style={baseTextStyle}> — {hobby.description}</span>}
//                   {hobby.proficiencyLevel && <span className="text-sm" style={baseTextStyle}> ({hobby.proficiencyLevel})</span>}
//                 </div>
//               ))}
//             </section>
//           )
//         );

//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="mb-6 page-break-inside-avoid" data-section="interests">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>INTERESTS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             <section className="mb-6 page-break-inside-avoid" data-section="languages">
//               <div style={headingContainerStyle}>
//                 <h2 style={headingStyle}>LANGUAGES</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             <section className="mb-6" data-section="publications">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>PUBLICATIONS</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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
//             <section className="mb-6 page-break-inside-avoid" data-section="references">
//               <div style={headingContainerStyle} className="page-break-after-avoid">
//                 <h2 style={headingStyle}>REFERENCES</h2>
//                 <div style={headingLineStyle}></div>
//               </div>
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

// export default TemplateThree;


"use client";
import React from "react";
import { ResumeData, ResumeStyle, useResume } from "../../_context/ResumeContext";
import AutoPaginator from "./AutoPaginator";
import { ExternalLink } from "lucide-react";

interface Props {
  data: ResumeData;
  style: ResumeStyle;
  onPageCountChange?: (count: number) => void;
}

const TemplateThree: React.FC<Props> = ({ data, onPageCountChange }) => {
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

  const renderSection = (section: string) => {
    switch (section) {
      case "Personal Info":
        return (
          <header className="mb-6 page-break-inside-avoid" data-section="personal-info">
            <div className="mb-2">
              <h1 className="uppercase font-bold" style={nameStyle}>
                {personalInfo.fullname || "FULL NAME"}
              </h1>
            </div>

            <div className="flex items-center text-sm mb-4 flex-wrap" style={baseTextStyle}>
              {personalInfo.email && (
                <>
                  <span>{personalInfo.email}</span>
                </>
              )}
              {personalInfo.phone && (
                <>
                  {personalInfo.email && <span className="mx-2">|</span>}
                  <span>{personalInfo.phone}</span>
                </>
              )}
              {personalInfo.location && (
                <>
                  {(personalInfo.email || personalInfo.phone) && <span className="mx-2">|</span>}
                  <span>{personalInfo.location}</span>
                </>
              )}
              {personalInfo.linkedinUrl && (
                <>
                  {(personalInfo.email || personalInfo.phone || personalInfo.location) && <span className="mx-2">|</span>}
                  {/* <span>in</span> */}
                  <a
                    href={personalInfo.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                    className="hover:underline ml-1"
                  >
                    {personalInfo.linkedinUrl.replace('https://', '').replace('http://', '')}
                  </a>
                </>
              )}
              {personalInfo.portifolioUrl && (
                <>
                  {(personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedinUrl) && <span className="mx-2">|</span>}
                  <a
                    href={personalInfo.portifolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                    className="hover:underline"
                  >
                    {personalInfo.portifolioUrl.replace('https://', '').replace('http://', '')}
                  </a>
                </>
              )}
            </div>
          </header>
        );

      case "Professional Summary":
        return (
          professionalSummary && (
            <section className="mb-6 page-break-inside-avoid" data-section="summary">
              <div style={headingContainerStyle}>
                <h2 style={headingStyle}>SUMMARY</h2>
                <div style={headingLineStyle}></div>
              </div>
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
            <section className="mb-6" data-section="work-experience">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>EXPERIENCE</h2>
                <div style={headingLineStyle}></div>
              </div>
              {workExperience.map((exp, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold" style={baseTextStyle}>
                      {exp.company}
                    </h3>
                    <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                      {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <div className="font-semibold mb-2" style={titleStyle}>
                    {exp.role}
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
            </section>
          )
        );

      case "Education":
        return (
          education.length > 0 && (
            <section className="mb-6" data-section="education">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>EDUCATION</h2>
                <div style={headingLineStyle}></div>
              </div>
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
            </section>
          )
        );

      case "Projects":
        return (
          projects.length > 0 && (
            <section className="mb-6" data-section="projects">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>PROJECTS</h2>
                <div style={headingLineStyle}></div>
              </div>
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
                      <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                        {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                      </span>
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
            </section>
          )
        );

      case "Skills":
        return (
          skills.length > 0 && (
            <section className="mb-6 page-break-inside-avoid" data-section="skills">
              <div style={headingContainerStyle}>
                <h2 style={headingStyle}>SKILLS</h2>
                <div style={headingLineStyle}></div>
              </div>
              <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
                {skills.map((skill, idx) => (
                  <li key={idx}>{skill}</li>
                ))}
              </ul>
            </section>
          )
        );

      case "Internships":
        return (
          internships.length > 0 && (
            <section className="mb-6" data-section="internships">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>INTERNSHIPS</h2>
                <div style={headingLineStyle}></div>
              </div>
              {internships.map((intern, idx) => (
                <div key={idx} className="mb-4 page-break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold" style={baseTextStyle}>
                      {intern.company}
                    </h3>
                    <span className="text-sm whitespace-nowrap ml-4" style={baseTextStyle}>
                      {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                    </span>
                  </div>
                  <div className="font-semibold mb-2" style={titleStyle}>
                    {intern.role}
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
            </section>
          )
        );

      case "Certifications":
        return (
          certifications.length > 0 && (
            <section className="mb-6" data-section="certifications">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>CERTIFICATIONS</h2>
                <div style={headingLineStyle}></div>
              </div>
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
            </section>
          )
        );

      case "Achievements":
        return (
          achievements.length > 0 && (
            <section className="mb-6" data-section="achievements">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>ACHIEVEMENTS</h2>
                <div style={headingLineStyle}></div>
              </div>
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
            </section>
          )
        );

      case "Awards":
        return (
          awards.length > 0 && (
            <section className="mb-6" data-section="awards">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>AWARDS</h2>
                <div style={headingLineStyle}></div>
              </div>
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
            <section className="mb-6" data-section="volunteering">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>VOLUNTEERING</h2>
                <div style={headingLineStyle}></div>
              </div>
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
            </section>
          )
        );

      case "Hobbies":
        return (
          hobbies.length > 0 && (
            <section className="mb-6 page-break-inside-avoid" data-section="hobbies">
              <div style={headingContainerStyle}>
                <h2 style={headingStyle}>HOBBIES</h2>
                <div style={headingLineStyle}></div>
              </div>
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
            </section>
          )
        );

      case "Interests":
        return (
          interests.length > 0 && (
            <section className="mb-6 page-break-inside-avoid" data-section="interests">
              <div style={headingContainerStyle}>
                <h2 style={headingStyle}>INTERESTS</h2>
                <div style={headingLineStyle}></div>
              </div>
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
            <section className="mb-6 page-break-inside-avoid" data-section="languages">
              <div style={headingContainerStyle}>
                <h2 style={headingStyle}>LANGUAGES</h2>
                <div style={headingLineStyle}></div>
              </div>
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
            <section className="mb-6" data-section="publications">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>PUBLICATIONS</h2>
                <div style={headingLineStyle}></div>
              </div>
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
            <section className="mb-6 page-break-inside-avoid" data-section="references">
              <div style={headingContainerStyle} className="page-break-after-avoid">
                <h2 style={headingStyle}>REFERENCES</h2>
                <div style={headingLineStyle}></div>
              </div>
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

export default TemplateThree;

