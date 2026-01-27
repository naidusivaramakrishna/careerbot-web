//  "use client";
// import React from "react";
// import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
// import { useResume } from "../../_context/ResumeContext";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
// }

// const TemplateOne: React.FC<Props> = ({ data }) => {
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
//   } = data;
//   const formatDate = (dateString?: string) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return dateString;
//     const month = date.toLocaleString("default", { month: "short" });
//     const year = date.getFullYear();
//     return `${month} ${year}`;
//   };
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
//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <div className="pb-6 mb-1">
//             <h1
//               className="uppercase"
//               style={{
//                 color: resumeStyle.headingColor,
//                 fontSize: resumeStyle.nameFontSize,
//                 fontWeight: "bold",
//               }}
//             >
//               {personalInfo.name || "Your Name"}
//             </h1>
//             <p className="mt-1" style={{ color: resumeStyle.bodyColor }}>
//               {personalInfo.email && <span>{personalInfo.email}</span>}
//               {personalInfo.phone && <> | {personalInfo.phone}</>}
//               {personalInfo.location && <> | {personalInfo.location}</>}
//               {personalInfo.linkedinurl && (
//                 <>
//                   {" "}
//                   |{" "}
//                   <a href={personalInfo.linkedinurl} target="_blank" rel="noreferrer">
//                     {personalInfo.linkedinurl}
//                   </a>
//                 </>
//               )}
//               {personalInfo.portifoliourl && (
//                 <>
//                   {" "}
//                   |{" "}
//                   <a href={personalInfo.portifoliourl} target="_blank" rel="noreferrer">
//                     {personalInfo.portifoliourl}
//                   </a>
//                 </>
//               )}
//             </p>
//           </div>
//         );
//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-5">
//               <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>Summary</h3>
//               <p style={{ color: resumeStyle.bodyColor }}>{professionalSummary}</p>
//             </section>
//           )
//         );
//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-5">
//               <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>Skills</h3>
//               <ul className="grid grid-cols-2 gap-1" style={{ color: resumeStyle.bodyColor }}>
//                 {skills.map((skill, idx) => (
//                   <li key={idx} className="list-disc ml-5">
//                     {skill}
//                   </li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );
//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-5">
//               <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>Education</h3>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-2">
//                   <div className="flex justify-between font-semibold">
//                     <span>{edu.degree}, {edu.school}</span>
//                     <span>{formatDate(edu.startDate)} - {formatDate(edu.endDate)}</span>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-5">
//               <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>Work Experience</h3>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-3">
//                   <div className="flex justify-between font-semibold">
//                     <span>{exp.role} - {exp.company}</span>
//                     <span>{formatDate(exp.startDate)} - {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}</span>
//                   </div>
//                   <p>{exp.description}</p>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-5">
//               <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>Projects</h3>
//               {projects.map((p, idx) => (
//                 <div key={idx} className="mb-2">
//                   <div className="font-semibold">
//                     {p.title}
//                     {p.link && (
//                       <a href={p.link} target="_blank" rel="noreferrer" className="text-blue-600 underline ml-1">
//                         [Link]
//                       </a>
//                     )}
//                   </div>
//                   <p>{p.description}</p>
//                   <p><strong>Tech:</strong> {p.technologies}</p>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-5">
//               <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>Certifications</h3>
//               {certifications.map((c, i) => (
//                 <p key={i}>{c.name} — {c.issuedBy} ({c.year})</p>
//               ))}
//             </section>
//           )
//         );
//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-5">
//               <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>Achievements</h3>
//               <ul className="list-disc ml-5">
//                 {achievements.map((a, i) => (
//                   <li key={i}><strong>{a.title}</strong> ({formatDate(a.date)}) — {a.description}</li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );
//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-5">
//               <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>Volunteering</h3>
//               {volunteering.map((v, i) => (
//                 <div key={i}>
//                   <p className="font-semibold">{v.role} — {v.organization}</p>
//                   <p>{formatDate(v.startDate)} - {formatDate(v.endDate)}</p>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-5">
//               <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>Internships</h3>
//               {internships.map((i, idx) => (
//                 <div key={idx}>
//                   <p className="font-semibold">{i.role} — {i.company}</p>
//                   <p>{formatDate(i.startDate)} - {i.currentlyWorking ? "Present" : formatDate(i.endDate)}</p>
//                   <p>{i.description}</p>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-5">
//               <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>Awards</h3>
//               {awards.map((a, i) => (
//                 <p key={i}>{a.title} — {a.issuedBy} ({a.year})</p>
//               ))}
//             </section>
//           )
//         );
//       case "References":
//         return (
//           references.length > 0 && (
//             <section>
//               <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>References</h3>
//               {references.map((r, i) => (
//                 <p key={i}>{r.name} ({r.relation}) — {r.contact}</p>
//               ))}
//             </section>
//           )
//         );
//       default:
//         return null;
//     }
//   };
//   return (
//     <div className="w-[478px] mx-auto bg-white shadow-lg p-8 max-h-full" style={baseTextStyle}>
//       {sectionOrder.map((section, idx) => (
//         <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//       ))}
//     </div>
//   );
// };
// export default TemplateOne; before page break



// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
// import { useResume } from "../../_context/ResumeContext";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
// }

// const TemplateOne: React.FC<Props> = ({ data }) => {
//   const { resumeStyle, sectionOrder } = useResume();
//   const contentRef = useRef<HTMLDivElement>(null);
//   const [pages, setPages] = useState<HTMLElement[][]>([]);
  
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
//   } = data;

//   const formatDate = (dateString?: string) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return dateString;
//     const month = date.toLocaleString("default", { month: "short" });
//     const year = date.getFullYear();
//     return `${month} ${year}`;
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
//   };

//   // Paginate content into A4 pages
//   useEffect(() => {
//     if (!contentRef.current) return;

//     const A4_HEIGHT_PX = 1122; // A4 height in pixels at 96 DPI (297mm)
//     const PADDING = 64; // 32px top + 32px bottom padding
//     const MAX_CONTENT_HEIGHT = A4_HEIGHT_PX - PADDING;

//     const content = contentRef.current;
//     const sections = Array.from(content.children) as HTMLElement[];
    
//     const paginatedPages: HTMLElement[][] = [];
//     let currentPage: HTMLElement[] = [];
//     let currentHeight = 0;

//     sections.forEach((section) => {
//       const sectionHeight = section.offsetHeight;
      
//       if (currentHeight + sectionHeight > MAX_CONTENT_HEIGHT && currentPage.length > 0) {
//         // Start a new page
//         paginatedPages.push([...currentPage]);
//         currentPage = [section];
//         currentHeight = sectionHeight;
//       } else {
//         currentPage.push(section);
//         currentHeight += sectionHeight;
//       }
//     });

//     // Add the last page
//     if (currentPage.length > 0) {
//       paginatedPages.push(currentPage);
//     }

//     setPages(paginatedPages);
//   }, [data, resumeStyle, sectionOrder]);

//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <div className="pb-6 mb-1 page-break-inside-avoid" data-section="personal-info">
//             <h1
//               className="uppercase"
//               style={{
//                 color: resumeStyle.headingColor,
//                 fontSize: resumeStyle.nameFontSize,
//                 fontWeight: "bold",
//               }}
//             >
//               {personalInfo.name || "Your Name"}
//             </h1>
//             <p className="mt-1" style={{ color: resumeStyle.bodyColor }}>
//               {personalInfo.email && <span>{personalInfo.email}</span>}
//               {personalInfo.phone && <> | {personalInfo.phone}</>}
//               {personalInfo.location && <> | {personalInfo.location}</>}
//               {personalInfo.linkedinurl && (
//                 <>
//                   {" "}
//                   |{" "}
//                   <a
//                     href={personalInfo.linkedinurl}
//                     target="_blank"
//                     rel="noreferrer"
//                   >
//                     {personalInfo.linkedinurl}
//                   </a>
//                 </>
//               )}
//               {personalInfo.portifoliourl && (
//                 <>
//                   {" "}
//                   |{" "}
//                   <a
//                     href={personalInfo.portifoliourl}
//                     target="_blank"
//                     rel="noreferrer"
//                   >
//                     {personalInfo.portifoliourl}
//                   </a>
//                 </>
//               )}
//             </p>
//           </div>
//         );
//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-5 page-break-inside-avoid" data-section="summary">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2"
//                 style={headingStyle}
//               >
//                 Summary
//               </h3>
//               <p style={{ color: resumeStyle.bodyColor }}>
//                 {professionalSummary}
//               </p>
//             </section>
//           )
//         );
//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-5 page-break-inside-avoid" data-section="skills">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2"
//                 style={headingStyle}
//               >
//                 Skills
//               </h3>
//               <ul
//                 className="grid grid-cols-2 gap-1"
//                 style={{ color: resumeStyle.bodyColor }}
//               >
//                 {skills.map((skill, idx) => (
//                   <li key={idx} className="list-disc ml-5">
//                     {skill}
//                   </li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );
//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-5" data-section="education">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Education
//               </h3>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-2 page-break-inside-avoid">
//                   <div className="flex justify-between font-semibold">
//                     <span>
//                       {edu.degree}, {edu.school}
//                     </span>
//                     <span>
//                       {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-5" data-section="work-experience">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Work Experience
//               </h3>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between font-semibold">
//                     <span>
//                       {exp.role} - {exp.company}
//                     </span>
//                     <span>
//                       {formatDate(exp.startDate)} -{" "}
//                       {exp.currentlyWorking
//                         ? "Present"
//                         : formatDate(exp.endDate)}
//                     </span>
//                   </div>
//                   <p>{exp.description}</p>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-5" data-section="projects">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Projects
//               </h3>
//               {projects.map((p, idx) => (
//                 <div key={idx} className="mb-2 page-break-inside-avoid">
//                   <div className="font-semibold">
//                     {p.title}
//                     {p.link && (
//                       <a
//                         href={p.link}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="text-blue-600 underline ml-1"
//                       >
//                         [Link]
//                       </a>
//                     )}
//                   </div>
//                   <p>{p.description}</p>
//                   <p>
//                     <strong>Tech:</strong> {p.technologies}
//                   </p>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-5" data-section="certifications">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Certifications
//               </h3>
//               {certifications.map((c, i) => (
//                 <p key={i} className="page-break-inside-avoid">
//                   {c.name} — {c.issuedBy} ({c.year})
//                 </p>
//               ))}
//             </section>
//           )
//         );
//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-5" data-section="achievements">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Achievements
//               </h3>
//               <ul className="list-disc ml-5">
//                 {achievements.map((a, i) => (
//                   <li key={i} className="page-break-inside-avoid">
//                     <strong>{a.title}</strong> ({formatDate(a.date)}) —{" "}
//                     {a.description}
//                   </li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );
//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-5" data-section="volunteering">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Volunteering
//               </h3>
//               {volunteering.map((v, i) => (
//                 <div key={i} className="page-break-inside-avoid">
//                   <p className="font-semibold">
//                     {v.role} — {v.organization}
//                   </p>
//                   <p>
//                     {formatDate(v.startDate)} - {formatDate(v.endDate)}
//                   </p>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-5" data-section="internships">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Internships
//               </h3>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="page-break-inside-avoid">
//                   <p className="font-semibold">
//                     {intern.role} — {intern.company}
//                   </p>
//                   <p>
//                     {formatDate(intern.startDate)} -{" "}
//                     {intern.currentlyWorking
//                       ? "Present"
//                       : formatDate(intern.endDate)}
//                   </p>
//                   <p>{intern.description}</p>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-5" data-section="awards">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Awards
//               </h3>
//               {awards.map((a, i) => (
//                 <p key={i} className="page-break-inside-avoid">
//                   {a.title} — {a.issuedBy} ({a.year})
//                 </p>
//               ))}
//             </section>
//           )
//         );
//       case "References":
//         return (
//           references.length > 0 && (
//             <section className="page-break-inside-avoid" data-section="references">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 References
//               </h3>
//               {references.map((r, i) => (
//                 <p key={i} className="page-break-inside-avoid">
//                   {r.name} ({r.relation}) — {r.contact}
//                 </p>
//               ))}
//             </section>
//           )
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="resume-container" style={baseTextStyle}>
//       {/* Hidden content for measurement */}
//       <div ref={contentRef} className="hidden-content">
//         {sectionOrder.map((section, idx) => (
//           <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//         ))}
//       </div>

//       {/* Visible paginated pages */}
//       {pages.length > 0 ? (
//         pages.map((pageContent, pageIndex) => (
//           <div key={pageIndex} className="a4-page">
//             <div className="a4-page-content">
//               {pageContent.map((section, sectionIndex) => (
//                 <div
//                   key={sectionIndex}
//                   dangerouslySetInnerHTML={{ __html: section.outerHTML }}
//                 />
//               ))}
//             </div>
//             <div className="page-number">Page {pageIndex + 1} of {pages.length}</div>
//           </div>
//         ))
//       ) : (
//         // Fallback: show all content in one page if pagination hasn't loaded
//         <div className="a4-page">
//           <div className="a4-page-content">
//             {sectionOrder.map((section, idx) => (
//               <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TemplateOne; before fields updating related to resumecontext



// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
// import { useResume } from "../../_context/ResumeContext";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
// }

// const TemplateOne: React.FC<Props> = ({ data }) => {
//   const { resumeStyle, sectionOrder } = useResume();
//   const contentRef = useRef<HTMLDivElement>(null);
//   const [pages, setPages] = useState<HTMLElement[][]>([]);
  
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
//   } = data;

//   const formatDate = (dateString?: string) => {
//     if (!dateString) return "";
//     const [year, month] = dateString.split("-");
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     const monthIndex = parseInt(month, 10) - 1;
//     return `${monthNames[monthIndex]} ${year}`;
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
//   };

//   // Paginate content into A4 pages
//   useEffect(() => {
//     if (!contentRef.current) return;

//     const A4_HEIGHT_PX = 1122; // A4 height in pixels at 96 DPI (297mm)
//     const PADDING = 64; // 32px top + 32px bottom padding
//     const MAX_CONTENT_HEIGHT = A4_HEIGHT_PX - PADDING;

//     const content = contentRef.current;
//     const sections = Array.from(content.children) as HTMLElement[];
    
//     const paginatedPages: HTMLElement[][] = [];
//     let currentPage: HTMLElement[] = [];
//     let currentHeight = 0;

//     sections.forEach((section) => {
//       const sectionHeight = section.offsetHeight;
      
//       if (currentHeight + sectionHeight > MAX_CONTENT_HEIGHT && currentPage.length > 0) {
//         // Start a new page
//         paginatedPages.push([...currentPage]);
//         currentPage = [section];
//         currentHeight = sectionHeight;
//       } else {
//         currentPage.push(section);
//         currentHeight += sectionHeight;
//       }
//     });

//     // Add the last page
//     if (currentPage.length > 0) {
//       paginatedPages.push(currentPage);
//     }

//     setPages(paginatedPages);
//   }, [data, resumeStyle, sectionOrder]);

//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <div className="pb-6 mb-1 page-break-inside-avoid" data-section="personal-info">
//             <h1
//               className="uppercase"
//               style={{
//                 color: resumeStyle.headingColor,
//                 fontSize: resumeStyle.nameFontSize,
//                 fontWeight: "bold",
//               }}
//             >
//               {personalInfo.name || "Your Name"}
//             </h1>
//             <p className="mt-1" style={{ color: resumeStyle.bodyColor }}>
//               {personalInfo.email && <span>{personalInfo.email}</span>}
//               {personalInfo.phone && <> | {personalInfo.phone}</>}
//               {personalInfo.location && <> | {personalInfo.location}</>}
//               {personalInfo.linkedinurl && (
//                 <>
//                   {" "}
//                   |{" "}
//                   <a
//                     href={personalInfo.linkedinurl}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="text-blue-600 underline"
//                   >
//                     LinkedIn
//                   </a>
//                 </>
//               )}
//               {personalInfo.portifoliourl && (
//                 <>
//                   {" "}
//                   |{" "}
//                   <a
//                     href={personalInfo.portifoliourl}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="text-blue-600 underline"
//                   >
//                     Portfolio
//                   </a>
//                 </>
//               )}
//             </p>
//           </div>
//         );
//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-5 page-break-inside-avoid" data-section="summary">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2"
//                 style={headingStyle}
//               >
//                 Summary
//               </h3>
//               <div
//                 style={{ color: resumeStyle.bodyColor }}
//                 dangerouslySetInnerHTML={{ __html: professionalSummary }}
//               />
//             </section>
//           )
//         );
//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-5 page-break-inside-avoid" data-section="skills">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2"
//                 style={headingStyle}
//               >
//                 Skills
//               </h3>
//               <ul
//                 className="grid grid-cols-3 gap-1"
//                 style={{ color: resumeStyle.bodyColor }}
//               >
//                 {skills.map((skill, idx) => (
//                   <li key={idx} className="list-disc ml-5">
//                     {skill}
//                   </li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );
//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-5" data-section="education">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Education
//               </h3>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-2 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">
//                       {edu.degree}
//                     </span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
//                     </span>
//                   </div>
//                   <div style={{ color: resumeStyle.bodyColor }}>
//                     {edu.school}
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-5" data-section="work-experience">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Work Experience
//               </h3>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">{exp.role}</span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(exp.startDate)} -{" "}
//                       {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </span>
//                   </div>
//                   <div style={{ color: resumeStyle.bodyColor }}>
//                     {exp.company} | {exp.location}
//                   </div>
//                   <div
//                     className="mt-1"
//                     style={{ color: resumeStyle.bodyColor }}
//                     dangerouslySetInnerHTML={{ __html: exp.description }}
//                   />
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-5" data-section="internships">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Internships
//               </h3>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">{intern.role}</span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(intern.startDate)} -{" "}
//                       {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </span>
//                   </div>
//                   <div style={{ color: resumeStyle.bodyColor }}>
//                     {intern.company} | {intern.location}
//                   </div>
//                   <div
//                     className="mt-1"
//                     style={{ color: resumeStyle.bodyColor }}
//                     dangerouslySetInnerHTML={{ __html: intern.description }}
//                   />
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-5" data-section="projects">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Projects
//               </h3>
//               {projects.map((p, idx) => (
//                 <div key={idx} className="mb-2 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">{p.title}</span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(p.startDate)} - {formatDate(p.endDate)}
//                     </span>
//                   </div>
//                   {p.link && (
//                     <a
//                       href={p.link}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="text-blue-600 underline text-sm"
//                       style={{ fontSize: resumeStyle.bodyFontSize }}
//                     >
//                       {p.link}
//                     </a>
//                   )}
//                   <div
//                     className="mt-1"
//                     style={{ color: resumeStyle.bodyColor }}
//                     dangerouslySetInnerHTML={{ __html: p.description }}
//                   />
//                   <div style={{ color: resumeStyle.bodyColor }}>
//                     <strong>Technologies:</strong> {p.technologies}
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="mb-5" data-section="certifications">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Certifications
//               </h3>
//               {certifications.map((c, i) => (
//                 <div key={i} className="mb-1 page-break-inside-avoid" style={{ color: resumeStyle.bodyColor }}>
//                   <span className="font-semibold">{c.name}</span> — {c.issuedBy} ({c.year})
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-5" data-section="achievements">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Achievements
//               </h3>
//               {achievements.map((a, i) => (
//                 <div key={i} className="mb-2 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">{a.title}</span>
//                     <span style={{ color: resumeStyle.bodyColor }}>{a.date}</span>
//                   </div>
//                   <div
//                     style={{ color: resumeStyle.bodyColor }}
//                     dangerouslySetInnerHTML={{ __html: a.description }}
//                   />
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="mb-5" data-section="awards">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Awards
//               </h3>
//               {awards.map((a, i) => (
//                 <div key={i} className="mb-1 page-break-inside-avoid" style={{ color: resumeStyle.bodyColor }}>
//                   <span className="font-semibold">{a.title}</span> — {a.issuedBy} ({a.year})
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-5" data-section="volunteering">
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Volunteering
//               </h3>
//               {volunteering.map((v, i) => (
//                 <div key={i} className="mb-2 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">{v.role}</span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(v.startDate)} - {formatDate(v.endDate)}
//                     </span>
//                   </div>
//                   <div style={{ color: resumeStyle.bodyColor }}>
//                     {v.organization}
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
//               <h3
//                 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 References
//               </h3>
//               {references.map((r, i) => (
//                 <div key={i} className="mb-1 page-break-inside-avoid" style={{ color: resumeStyle.bodyColor }}>
//                   <span className="font-semibold">{r.name}</span> ({r.relation}) — {r.contact}
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
//     <div className="resume-container" style={baseTextStyle}>
//       {/* Hidden content for measurement */}
//       <div ref={contentRef} className="hidden-content">
//         {sectionOrder.map((section, idx) => (
//           <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//         ))}
//       </div>

//       {/* Visible paginated pages */}
//       {pages.length > 0 ? (
//         pages.map((pageContent, pageIndex) => (
//           <div key={pageIndex} className="a4-page">
//             <div className="a4-page-content">
//               {pageContent.map((section, sectionIndex) => (
//                 <div
//                   key={sectionIndex}
//                   dangerouslySetInnerHTML={{ __html: section.outerHTML }}
//                 />
//               ))}
//             </div>
//             <div className="page-number">Page {pageIndex + 1} of {pages.length}</div>
//           </div>
//         ))
//       ) : (
//         // Fallback: show all content in one page if pagination hasn't loaded
//         <div className="a4-page">
//           <div className="a4-page-content">
//             {sectionOrder.map((section, idx) => (
//               <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TemplateOne; before context technologies[] update



// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import { ResumeData, ResumeStyle } from "../../_context/ResumeContext";
// import { useResume } from "../../_context/ResumeContext";


// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
// }


// const TemplateOne: React.FC<Props> = ({ data }) => {
//   const { resumeStyle, sectionOrder } = useResume();
//   const contentRef = useRef<HTMLDivElement>(null);
//   const [pages, setPages] = useState<HTMLElement[][]>([]);
  
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
//   } = data;


//   // const formatDate = (dateString?: string) => {
//   //   if (!dateString) return "";
//   //   const [year, month] = dateString.split("-");
//   //   const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//   //   const monthIndex = parseInt(month, 10) - 1;
//   //   return `${monthNames[monthIndex]} ${year}`;
//   // }; before date issue

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
//   };


//   // Paginate content into A4 pages
//   useEffect(() => {
//     if (!contentRef.current) return;


//     const A4_HEIGHT_PX = 1122; // A4 height in pixels at 96 DPI (297mm)
//     const PADDING = 64; // 32px top + 32px bottom padding
//     const MAX_CONTENT_HEIGHT = A4_HEIGHT_PX - PADDING;


//     const content = contentRef.current;
//     const sections = Array.from(content.children) as HTMLElement[];
    
//     const paginatedPages: HTMLElement[][] = [];
//     let currentPage: HTMLElement[] = [];
//     let currentHeight = 0;


//     sections.forEach((section) => {
//       const sectionHeight = section.offsetHeight;
      
//       if (currentHeight + sectionHeight > MAX_CONTENT_HEIGHT && currentPage.length > 0) {
//         // Start a new page
//         paginatedPages.push([...currentPage]);
//         currentPage = [section];
//         currentHeight = sectionHeight;
//       } else {
//         currentPage.push(section);
//         currentHeight += sectionHeight;
//       }
//     });


//     // Add the last page
//     if (currentPage.length > 0) {
//       paginatedPages.push(currentPage);
//     }


//     setPages(paginatedPages);
//   }, [data, resumeStyle, sectionOrder]);


//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <div className="pb-6 border-b mb-6 border-gray-300 text-center page-break-inside-avoid" data-section="personal-info">
//             <h1
//               className="uppercase"
//               style={{
//                 color: resumeStyle.headingColor,
//                 fontSize: resumeStyle.nameFontSize,
//                 fontWeight: "bold",
//               }}
//             >
//               {personalInfo.name || "Your Name"}
//             </h1>
//             <p className="mt-1" style={{ color: resumeStyle.bodyColor }}>
//               {personalInfo.email && <span>{personalInfo.email}</span>}
//               {personalInfo.phone && <> | {personalInfo.phone}</>}
//               {personalInfo.location && <> | {personalInfo.location}</>}
//               {personalInfo.linkedinurl && (
//                 <>
//                   {" "}
//                   |{" "}
//                   <a
//                     href={personalInfo.linkedinurl}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="text-blue-600 underline"
//                   >
//                     LinkedIn
//                   </a>
//                 </>
//               )}
//               {personalInfo.portifoliourl && (
//                 <>
//                   {" "}
//                   |{" "}
//                   <a
//                     href={personalInfo.portifoliourl}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="text-blue-600 underline"
//                   >
//                     Portfolio
//                   </a>
//                 </>
//               )}
//             </p>
//           </div>
//         );
//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="page-break-inside-avoid" data-section="summary">
//               <h3
//                 className=" pt-0.5 pb-0.5 mb-2"
//                 style={headingStyle}
//               >
//                 Summary
//               </h3>
//               <div
//                 style={{ color: resumeStyle.bodyColor }}
//                 dangerouslySetInnerHTML={{ __html: professionalSummary }}
//               />
//             </section>
//           )
//         );
//       case "Skills":
//         return (
//           skills.length > 0 && (
//             <section className="mb-5 page-break-inside-avoid" data-section="skills">
//               <h3
//                 className=" pt-0.5 pb-0.5 mb-2"
//                 style={headingStyle}
//               >
//                 Skills
//               </h3>
//               <ul
//                 className="grid grid-cols-3 gap-1"
//                 style={{ color: resumeStyle.bodyColor }}
//               >
//                 {skills.map((skill, idx) => (
//                   <li key={idx} className="list-disc ml-5">
//                     {skill}
//                   </li>
//                 ))}
//               </ul>
//             </section>
//           )
//         );
//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="mb-5" data-section="education">
//               <h3
//                 className="pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Education
//               </h3>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-2 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">
//                       {edu.degree}
//                     </span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
//                     </span>
//                   </div>
//                   <div style={{ color: resumeStyle.bodyColor }}>
//                     {edu.school}
//                   </div>
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="mb-5" data-section="work-experience">
//               <h3
//                 className="pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Work Experience
//               </h3>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">{exp.role}</span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(exp.startDate)} -{" "}
//                       {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
//                     </span>
//                   </div>
//                   <div style={{ color: resumeStyle.bodyColor }}>
//                     {exp.company}
//                     {exp.location && <> | {exp.location}</>}
//                   </div>
//                   {exp.description && (
//                     <div
//                       className="mt-1"
//                       style={{ color: resumeStyle.bodyColor }}
//                       dangerouslySetInnerHTML={{ __html: exp.description }}
//                     />
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="mb-5" data-section="internships">
//               <h3
//                 className="pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Internships
//               </h3>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-3 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">{intern.role}</span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(intern.startDate)} -{" "}
//                       {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
//                     </span>
//                   </div>
//                   <div style={{ color: resumeStyle.bodyColor }}>
//                     {intern.company}
//                     {intern.location && <> | {intern.location}</>}
//                   </div>
//                   {intern.description && (
//                     <div
//                       className="mt-1"
//                       style={{ color: resumeStyle.bodyColor }}
//                       dangerouslySetInnerHTML={{ __html: intern.description }}
//                     />
//                   )}
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Projects":
//         return (
//           projects.length > 0 && (
//             <section className="mb-5" data-section="projects">
//               <h3
//                 className="pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Projects
//               </h3>
//               {projects.map((p, idx) => (
//                 <div key={idx} className="mb-2 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">{p.title}</span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(p.startDate)} - {formatDate(p.endDate)}
//                     </span>
//                   </div>
//                   {p.link && (
//                     <a
//                       href={p.link}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="text-blue-600 underline text-sm"
//                       style={{ fontSize: resumeStyle.bodyFontSize }}
//                     >
//                       {p.link}
//                     </a>
//                   )}
//                   {p.description && (
//                     <div
//                       className="mt-1"
//                       style={{ color: resumeStyle.bodyColor }}
//                       dangerouslySetInnerHTML={{ __html: p.description }}
//                     />
//                   )}
//                   {p.technologies && p.technologies.length > 0 && (
//                     <div style={{ color: resumeStyle.bodyColor }}>
//                       <strong>Technologies:</strong> {p.technologies.join(", ")}
//                     </div>
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
//               <h3
//                 className="pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Certifications
//               </h3>
//               {certifications.map((c, i) => (
//                 <div key={i} className="mb-1 page-break-inside-avoid" style={{ color: resumeStyle.bodyColor }}>
//                   <span className="font-semibold">{c.name}</span>
//                   {c.issuedBy && <> — {c.issuedBy}</>}
//                   {c.year && <> ({c.year})</>}
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Achievements":
//         return (
//           achievements.length > 0 && (
//             <section className="mb-5" data-section="achievements">
//               <h3
//                 className="pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Achievements
//               </h3>
//               {achievements.map((a, i) => (
//                 <div key={i} className="mb-2 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">{a.title}</span>
//                     {a.date && <span style={{ color: resumeStyle.bodyColor }}>{a.date}</span>}
//                   </div>
//                   {a.description && (
//                     <div
//                       style={{ color: resumeStyle.bodyColor }}
//                       dangerouslySetInnerHTML={{ __html: a.description }}
//                     />
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
//               <h3
//                 className="pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Awards
//               </h3>
//               {awards.map((a, i) => (
//                 <div key={i} className="mb-1 page-break-inside-avoid" style={{ color: resumeStyle.bodyColor }}>
//                   <span className="font-semibold">{a.title}</span>
//                   {a.issuedBy && <> — {a.issuedBy}</>}
//                   {a.year && <> ({a.year})</>}
//                 </div>
//               ))}
//             </section>
//           )
//         );
//       case "Volunteering":
//         return (
//           volunteering.length > 0 && (
//             <section className="mb-5" data-section="volunteering">
//               <h3
//                 className="pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 Volunteering
//               </h3>
//               {volunteering.map((v, i) => (
//                 <div key={i} className="mb-2 page-break-inside-avoid">
//                   <div className="flex justify-between">
//                     <span className="font-semibold">{v.role}</span>
//                     <span style={{ color: resumeStyle.bodyColor }}>
//                       {formatDate(v.startDate)} - {formatDate(v.endDate)}
//                     </span>
//                   </div>
//                   <div style={{ color: resumeStyle.bodyColor }}>
//                     {v.organization}
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
//               <h3
//                 className="pt-0.5 pb-0.5 mb-2 page-break-after-avoid"
//                 style={headingStyle}
//               >
//                 References
//               </h3>
//               {references.map((r, i) => (
//                 <div key={i} className="mb-1 page-break-inside-avoid" style={{ color: resumeStyle.bodyColor }}>
//                   <span className="font-semibold">{r.name}</span>
//                   {r.relation && <> ({r.relation})</>}
//                   {r.contact && <> — {r.contact}</>}
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
//     <div className="resume-container" style={baseTextStyle}>
//       {/* Hidden content for measurement */}
//       <div ref={contentRef} className="hidden-content">
//         {sectionOrder.map((section, idx) => (
//           <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//         ))}
//       </div>


//       {/* Visible paginated pages */}
//       {pages.length > 0 ? (
//         pages.map((pageContent, pageIndex) => (
//           <div key={pageIndex} className="a4-page">
//             <div className="a4-page-content">
//               {pageContent.map((section, sectionIndex) => (
//                 <div
//                   key={sectionIndex}
//                   dangerouslySetInnerHTML={{ __html: section.outerHTML }}
//                 />
//               ))}
//             </div>
//             <div className="page-number">Page {pageIndex + 1} of {pages.length}</div>
//           </div>
//         ))
//       ) : (
//         // Fallback: show all content in one page if pagination hasn't loaded
//         <div className="a4-page">
//           <div className="a4-page-content">
//             {sectionOrder.map((section, idx) => (
//               <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };


// export default TemplateOne; before template style change




// "use client";
// import React from "react";
// import { ResumeData, ResumeStyle, useResume } from "../../_context/ResumeContext";
// import AutoPaginator from "./AutoPaginator";

// interface Props {
//   data: ResumeData;
//   style: ResumeStyle;
//   onPageCountChange?: (count: number) => void;
// }

// const TemplateOne: React.FC<Props> = ({ data, onPageCountChange  }) => {
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

//   // ✅ FIXED: Name style now uses resumeStyle.headingColor instead of hardcoded black
//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: resumeStyle.headingColor, // ✅ Changed from "#000000" to resumeStyle.headingColor
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

//   return (
//     <AutoPaginator onPageCountChange={onPageCountChange}>
//       {sectionOrder.map((section, idx) => (
//         <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//       ))}
//     </AutoPaginator>
//   );
// };

// export default TemplateOne; before all fine and project links added





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

// const TemplateOne: React.FC<Props> = ({ data, onPageCountChange  }) => {
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
//     color: resumeStyle.headingColor,
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

//   // ✅ All sections wrapped inside renderSection()
//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <header className="mb-2">
//             <div className="flex justify-between items-center">
//               {/* Left side - Name */}
//               <h1 className="text-4xl font-bold uppercase" style={nameStyle}>
//                 {personalInfo.fullName || "Full Name"}
//               </h1>

//               {/* Right side - Contact Details */}
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
//                 {personalInfo.linkedinUrl && (
//                   <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
//                     <a 
//                       href={personalInfo.linkedinUrl} 
//                       target="_blank" 
//                       rel="noopener noreferrer"
//                       style={linkStyle}
//                       className="hover:underline"
//                     >
//                       LinkedIn
//                     </a>
//                   </div>
//                 )}
//                 {personalInfo.portifolioUrl && (
//                   <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
//                     <a 
//                       href={personalInfo.portifolioUrl} 
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
//             <hr className="border-t-2 border-gray-600 mt-4" />
//           </header>
//         );

//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-0">
//               <h2 style={headingStyle}>SUMMARY</h2>
//               <p className="text-justify" style={baseTextStyle}>
//                 {professionalSummary}
//               </p>
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       // case "Skills":
//       //   return (
//       //     skills.length > 0 && (
//       //       <section className="mb-6">
//       //         <h2 style={headingStyle}>SKILLS</h2>
//       //         <div className="grid grid-cols-3 gap-x-8 gap-y-2">
//       //           {skills.map((skill, index) => (
//       //             <div key={index} className="flex items-start" style={baseTextStyle}>
//       //               <span className="mr-2">•</span>
//       //               <span>{skill}</span>
//       //             </div>
//       //           ))}
//       //         </div>
//       //         <hr className="border-t border-gray-800 mt-4" />
//       //       </section>
//       //     )
//       //   );
//       case "Skills":
//   return (
//     skills.length > 0 && (
//       <section className=" page-break-inside-avoid" data-section="skills">
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
        
//         <hr className="border-t border-gray-800 mt-4" />
//       </section>
//     )
//   );


//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="">
//               <h2 style={headingStyle}>EXPERIENCE</h2>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold flex items-center" style={baseTextStyle}>
//                       {exp.role}
//                     </h3>
//                     <span className="text-sm" style={baseTextStyle}>
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
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="">
//               <h2 style={headingStyle}>INTERNSHIPS</h2>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold flex items-center" style={baseTextStyle}>
//                       {intern.role}
//                     </h3>
//                     <span className="text-sm" style={baseTextStyle}>
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
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="">
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
//             <section className="">
//               <h2 style={headingStyle}>PROJECTS</h2>
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold flex items-center" style={baseTextStyle}>
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
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       // case "Certifications":
//       //   return (
//       //     certifications.length > 0 && (
//       //       <section className="mb-6">
//       //         <h2 style={headingStyle}>CERTIFICATIONS</h2>
//       //         {certifications.map((cert, idx) => (
//       //           <div key={idx} className="mb-2 flex items-start">
//       //             <span className="mr-2" style={baseTextStyle}>•</span>
//       //             <div style={baseTextStyle}>
//       //               <span className="font-medium">{cert.name}</span> - {cert.issuedBy} ({cert.year})
//       //             </div>
//       //           </div>
//       //         ))}
//       //         <hr className="border-t border-gray-800 mt-4" />
//       //       </section>
//       //     )
//       //   );
//       case "Certifications":
//   return (
//     certifications.length > 0 && (
//       <section className="">
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


//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="">
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
//             <section className="">
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
//             <section className="">
//               <h2 style={headingStyle}>PUBLICATIONS</h2>
//               {publications.map((pub, idx) => (
//                 <div key={idx} className="mb-3">
//                   <h3 className="font-semibold flex items-center" style={baseTextStyle}>
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
//                   </h3>
//                   <p className="text-sm" style={baseTextStyle}>
//                     {pub.authors}
//                   </p>
//                   <p className="text-sm" style={baseTextStyle}>
//                     <span className="italic">{pub.publicationName}</span> • {formatDate(pub.date)}
//                   </p>
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="">
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
//             <section className="">
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
//             <section className="">
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
//             <section className="">
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
//             <section className="">
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
//       {sectionOrder.map((section, idx) => (
//         <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//       ))}
//     </AutoPaginator>
//   );
// };

// export default TemplateOne; before color to degree,role etc





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

// const TemplateOne: React.FC<Props> = ({ data, onPageCountChange  }) => {
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
//     fontWeight: "600",
//     textTransform: "uppercase",
//     letterSpacing: "0.05em",
//     marginBottom: "0.75rem",
//   };

//   const nameStyle: React.CSSProperties = {
//     fontSize: resumeStyle.nameFontSize,
//     fontWeight: "bold",
//     color: resumeStyle.headingColor,
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
//     color: "##2A2A2A",
//     fontWeight: "bold",
//   };

//   const renderSection = (section: string) => {
//     switch (section) {
//       case "Personal Info":
//         return (
//           <header className="mb-2">
//             <div className="flex justify-between items-center">
//               <h1 className="text-4xl font-bold uppercase" style={nameStyle}>
//                 {personalInfo.fullName || "Full Name"}
//               </h1>

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
//                 {personalInfo.linkedinUrl && (
//                   <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
//                     <a 
//                       href={personalInfo.linkedinUrl} 
//                       target="_blank" 
//                       rel="noopener noreferrer"
//                       style={linkStyle}
//                       className="hover:underline"
//                     >
//                       LinkedIn
//                     </a>
//                   </div>
//                 )}
//                 {personalInfo.portifolioUrl && (
//                   <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
//                     <a 
//                       href={personalInfo.portifolioUrl} 
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
//             <hr className="border-t-2 border-gray-600 mt-4" />
//           </header>
//         );

//       case "Professional Summary":
//         return (
//           professionalSummary && (
//             <section className="mb-0 font-bold">
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
//             <section className="page-break-inside-avoid" data-section="skills">
//               <h2 className="mb-3 font-bold" style={headingStyle}>
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
              
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Work Experience":
//         return (
//           workExperience.length > 0 && (
//             <section className="">
//               <h2 style={headingStyle}>EXPERIENCE</h2>
//               {workExperience.map((exp, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold flex items-center" style={titleStyle}>
//                       {exp.role}
//                     </h3>
//                     <span className="text-sm" style={baseTextStyle}>
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
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Internships":
//         return (
//           internships.length > 0 && (
//             <section className="">
//               <h2 style={headingStyle}>INTERNSHIPS</h2>
//               {internships.map((intern, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold flex items-center" style={titleStyle}>
//                       {intern.role}
//                     </h3>
//                     <span className="text-sm" style={baseTextStyle}>
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
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Education":
//         return (
//           education.length > 0 && (
//             <section className="">
//               <h2 style={headingStyle}>EDUCATION</h2>
//               {education.map((edu, idx) => (
//                 <div key={idx} className="mb-3">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <h3 className="font-semibold mb-1" style={titleStyle}>
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
//             <section className="">
//               <h2 style={headingStyle}>PROJECTS</h2>
//               {projects.map((proj, idx) => (
//                 <div key={idx} className="mb-4">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold flex items-center" style={titleStyle}>
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
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Certifications":
//         return (
//           certifications.length > 0 && (
//             <section className="">
//               <h2 style={headingStyle}>CERTIFICATIONS</h2>
//               {certifications.map((cert, idx) => (
//                 <div key={idx} className="mb-3 flex items-start">
//                   <span className="mr-2" style={baseTextStyle}>•</span>
//                   <div style={baseTextStyle}>
//                     <div>
//                       <span className="" style={titleStyle}>{cert.name}</span>
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
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Awards":
//         return (
//           awards.length > 0 && (
//             <section className="">
//               <h2 style={headingStyle}>AWARDS</h2>
//               {awards.map((award, idx) => (
//                 <div key={idx} className="mb-2 flex items-start">
//                   <span className="mr-2" style={baseTextStyle}>•</span>
//                   <div style={baseTextStyle}>
//                     <span className="font-medium" style={titleStyle}>{award.title}</span>
//                     <span style={baseTextStyle}> - {award.issuedBy} ({award.year})</span>
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
//             <section className="">
//               <h2 style={headingStyle}>ACHIEVEMENTS</h2>
//               {achievements.map((achievement, idx) => (
//                 <div key={idx} className="mb-3">
//                   <div className="flex justify-between items-baseline mb-1">
//                     <h3 className="font-semibold" style={titleStyle}>
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
//             <section className="">
//               <h2 style={headingStyle}>PUBLICATIONS</h2>
//               {publications.map((pub, idx) => (
//                 <div key={idx} className="mb-3">
//                   <h3 className="font-semibold flex items-center" style={titleStyle}>
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
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Languages":
//         return (
//           languages.length > 0 && (
//             <section className="">
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
//             <section className="">
//               <h2 style={headingStyle}>HOBBIES</h2>
//               {hobbies.map((hobby, idx) => (
//                 <div key={idx} className="mb-2" style={baseTextStyle}>
//                   <h3 className="font-medium inline" style={titleStyle}>{hobby.name}</h3>
//                   {hobby.description && <span style={baseTextStyle}> - {hobby.description}</span>}
//                   {hobby.proficiencyLevel && <span className="text-sm" style={baseTextStyle}> ({hobby.proficiencyLevel})</span>}
//                 </div>
//               ))}
//               <hr className="border-t border-gray-800 mt-4" />
//             </section>
//           )
//         );

//       case "Interests":
//         return (
//           interests.length > 0 && (
//             <section className="">
//               <h2 style={headingStyle}>INTERESTS</h2>
//               <div className="grid grid-cols-2 gap-2">
//                 {interests.map((interest, idx) => (
//                   <div key={idx} className="flex items-start" style={baseTextStyle}>
//                     <span className="mr-2">•</span>
//                     <div>
//                       <span className="font-medium" style={titleStyle}>{interest.name}</span>
//                       {interest.category && <span className="text-sm" style={baseTextStyle}> ({interest.category})</span>}
//                       {interest.description && <p className="text-sm" style={baseTextStyle}>{interest.description}</p>}
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
//             <section className="">
//               <h2 style={headingStyle}>VOLUNTEERING</h2>
//               {volunteering.map((vol, idx) => (
//                 <div key={idx} className="mb-3">
//                   <div className="flex justify-between items-baseline">
//                     <div>
//                       <h3 className="font-semibold" style={titleStyle}>
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
//             <section className="">
//               <h2 style={headingStyle}>REFERENCES</h2>
//               {references.map((ref, idx) => (
//                 <div key={idx} className="mb-3">
//                   <h3 className="font-semibold" style={titleStyle}>
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
//       {sectionOrder.map((section, idx) => (
//         <React.Fragment key={idx}>{renderSection(section)}</React.Fragment>
//       ))}
//     </AutoPaginator>
//   );
// };

// export default TemplateOne; before descrption styles like bold



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

const TemplateOne: React.FC<Props> = ({ data, onPageCountChange  }) => {
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
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.75rem",
  };

  const nameStyle: React.CSSProperties = {
    fontSize: resumeStyle.nameFontSize,
    fontWeight: "bold",
    color: resumeStyle.headingColor,
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
          <header className="mb-2">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-bold uppercase" style={nameStyle}>
                {personalInfo.fullname || "Full Name"}
              </h1>

              <div className="text-right flex flex-col gap-1">
                {personalInfo.phone && (
                  <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
                    <span>{personalInfo.phone}</span>
                  </div>
                )}
                {personalInfo.email && (
                  <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
                    <span>{personalInfo.email}</span>
                  </div>
                )}
                {personalInfo.location && (
                  <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
                    <span>{personalInfo.location}</span>
                  </div>
                )}
                {personalInfo.linkedinUrl && (
                  <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
                    <a 
                      href={personalInfo.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={linkStyle}
                      className="hover:underline"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
                {personalInfo.portifolioUrl && (
                  <div className="flex items-center justify-end text-sm" style={baseTextStyle}>
                    <a 
                      href={personalInfo.portifolioUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={linkStyle}
                      className="hover:underline"
                    >
                      Portfolio
                    </a>
                  </div>
                )}
              </div>
            </div>
            <hr className="border-t-2 border-gray-600 mt-4" />
          </header>
        );

      case "Professional Summary":
        return (
          professionalSummary && (
            <section className="mb-0">
              <h2 style={headingStyle}>SUMMARY</h2>
              {/* ✅ Changed to support HTML formatting */}
              <div 
                className="text-justify resume-description"
                style={baseTextStyle}
                dangerouslySetInnerHTML={{ __html: professionalSummary }}
              />
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      // case "Skills":
      //   return (
      //     skills.length > 0 && (
      //       <section className="page-break-inside-avoid" data-section="skills">
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
              
      //         <hr className="border-t border-gray-800 mt-4" />
      //       </section>
      //     )
      //   );


  //     case "Skills":
  // return (
  //   skills.length > 0 && (
  //     <section className="page-break-inside-avoid" data-section="skills">
  //       <h2 className="mb-3" style={headingStyle}>
  //         SKILLS
  //       </h2>
        
  //       {data.categorizedSkills ? (
  //         <div className="space-y-0.5">
  //           {Object.entries(data.categorizedSkills).map(([category, categorySkills]) => {
  //             if (!categorySkills || categorySkills.length === 0) return null;
              
  //             const categoryLabel = category
  //               .split('_')
  //               .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  //               .join(' ');
              
  //             return (
  //               <div key={category}>
  //                 <div className="mb-1">
  //                   <span className="font-semibold" style={titleStyle}>
  //                     {categoryLabel}:
  //                   </span>
  //                   <span style={baseTextStyle}>
  //                     {" "}{(categorySkills as string[]).join(", ")}
  //                   </span>
  //                 </div>
  //               </div>
  //             );
  //           })}
  //         </div>
  //       ) : (
  //         <ul className="list-disc pl-5 grid grid-cols-2 gap-x-6 gap-y-1" style={baseTextStyle}>
  //           {skills.map((skill, idx) => (
  //             <li key={idx}>{skill}</li>
  //           ))}
  //         </ul>
  //       )}
        
  //       <hr className="border-t border-gray-800 mt-4" />
  //     </section>
  //   )
  // );

      case "Skills":
        return (
          skills.length > 0 && (
            <section className="mb-4 page-break-inside-avoid" data-section="skills">
              <h3 className="mb-3.5 border-b border-gray-300" style={headingStyle}>
                SKILLS
              </h3>
              <ul className="list-disc pl-5 grid grid-cols-3 gap-x-4 gap-y-1" style={baseTextStyle}>
                {skills.map((skill, idx) => (
                  <li key={idx} className="text-sm">{skill}</li>
                ))}
              </ul>
            </section>
          )
        );


      case "Work Experience":
        return (
          workExperience.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>EXPERIENCE</h2>
              {workExperience.map((exp, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold flex items-center" style={titleStyle}>
                      {exp.role}
                    </h3>
                    <span className="text-sm" style={baseTextStyle}>
                      {formatDate(exp.startDate)} – {exp.currentlyWorking ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center" style={baseTextStyle}>
                    <span className="font-medium">{exp.company}</span>
                    {exp.location && <span className="text-sm"> • {exp.location}</span>}
                  </div>
                  {exp.description && (
                    <div 
                      className="resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: exp.description }}
                    />
                  )}
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Internships":
        return (
          internships.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>INTERNSHIPS</h2>
              {internships.map((intern, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold flex items-center" style={titleStyle}>
                      {intern.role}
                    </h3>
                    <span className="text-sm" style={baseTextStyle}>
                      {formatDate(intern.startDate)} – {intern.currentlyWorking ? "Present" : formatDate(intern.endDate)}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center" style={baseTextStyle}>
                    <span className="font-medium">{intern.company}</span>
                    {intern.location && <span className="text-sm"> • {intern.location}</span>}
                  </div>
                  {intern.description && (
                    <div 
                      className="resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: intern.description }}
                    />
                  )}
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Education":
        return (
          education.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>EDUCATION</h2>
              {education.map((edu, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <h3 className="font-semibold" style={titleStyle}>
                        {edu.degree}
                      </h3>
                      <p className="text-sm" style={baseTextStyle}>
                        {edu.school}
                      </p>
                    </div>
                    <span className="text-sm" style={baseTextStyle}>
                      {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                    </span>
                  </div>
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Projects":
        return (
          projects.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>PROJECTS</h2>
              {projects.map((proj, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold flex items-center" style={titleStyle}>
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
                        {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <div 
                      className="mb-2 resume-description"
                      style={descriptionStyle}
                      dangerouslySetInnerHTML={{ __html: proj.description }}
                    />
                  )}
                  {proj.technologies.length > 0 && (
                    <p className="text-sm" style={baseTextStyle}>
                      <span className="font-medium">Technologies:</span> {proj.technologies.join(", ")}
                    </p>
                  )}
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Certifications":
           return (
             certifications.length > 0 && (
               <section className="mb-5" data-section="certifications">
                 <h3 className="border-b border-t border-gray-300 pt-0.5 pb-0.5 mb-2" style={headingStyle}>Certifications</h3>
                {certifications.map((c, i) => (
                  <div key={i} className="mb-1" style={{ color: resumeStyle.bodyColor }}>
                    <span className="font-semibold">{c.name}{c.issuedBy ? ', ' + c.issuedBy : ''} {c.year ? `(${c.year})` : ''}</span>
                  </div>
                ))}
               </section>
             )
           );

      case "Awards":
        return (
          awards.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>AWARDS</h2>
              {awards.map((award, idx) => (
                <div key={idx} className="mb-2 flex items-start">
                  <span className="mr-2" style={baseTextStyle}>•</span>
                  <div style={baseTextStyle}>
                    <span className="font-medium" style={titleStyle}>{award.title}</span>
                    <span style={baseTextStyle}> - {award.issuedBy} ({award.year})</span>
                  </div>
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Achievements":
        return (
          achievements.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>ACHIEVEMENTS</h2>
              {achievements.map((achievement, idx) => (
                <div key={idx} className="mb-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold" style={titleStyle}>
                      {achievement.title}
                    </h3>
                    {achievement.date && (
                      <span className="text-sm" style={baseTextStyle}>
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
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Publications":
        return (
          publications.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>PUBLICATIONS</h2>
              {publications.map((pub, idx) => (
                <div key={idx} className="mb-3">
                  <h3 className="font-semibold flex items-center" style={titleStyle}>
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
                    <span className="italic">{pub.publicationName}</span> • {formatDate(pub.date)}
                  </p>
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Languages":
        return (
          languages.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>LANGUAGES</h2>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang, idx) => (
                  <div key={idx} className="flex items-start" style={baseTextStyle}>
                    <span className="mr-2">•</span>
                    <span>
                      <span className="font-medium">{lang.language}</span> - {lang.proficiency}
                    </span>
                  </div>
                ))}
              </div>
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Hobbies":
        return (
          hobbies.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>HOBBIES</h2>
              {hobbies.map((hobby, idx) => (
                <div key={idx} className="mb-2">
                  <h3 className="font-medium inline" style={titleStyle}>{hobby.name}</h3>
                  {/* ✅ Changed to support HTML formatting */}
                  {hobby.description && (
                    <span 
                      className="resume-description"
                      style={baseTextStyle}
                      dangerouslySetInnerHTML={{ __html: ` - ${hobby.description}` }}
                    />
                  )}
                  {hobby.proficiencyLevel && <span className="text-sm" style={baseTextStyle}> ({hobby.proficiencyLevel})</span>}
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Interests":
        return (
          interests.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>INTERESTS</h2>
              <div className="grid grid-cols-2 gap-2">
                {interests.map((interest, idx) => (
                  <div key={idx} className="flex items-start" style={baseTextStyle}>
                    <span className="mr-2">•</span>
                    <div>
                      <span className="font-medium" style={titleStyle}>{interest.name}</span>
                      {interest.category && <span className="text-sm" style={baseTextStyle}> ({interest.category})</span>}
                      {/* ✅ Changed to support HTML formatting */}
                      {interest.description && (
                        <div 
                          className="text-sm resume-description"
                          style={baseTextStyle}
                          dangerouslySetInnerHTML={{ __html: interest.description }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "Volunteering":
        return (
          volunteering.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>VOLUNTEERING</h2>
              {volunteering.map((vol, idx) => (
                <div key={idx} className="mb-3">
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
                      {formatDate(vol.startDate)} – {formatDate(vol.endDate)}
                    </span>
                  </div>
                </div>
              ))}
              <hr className="border-t border-gray-800 mt-4" />
            </section>
          )
        );

      case "References":
        return (
          references.length > 0 && (
            <section className="">
              <h2 style={headingStyle}>REFERENCES</h2>
              {references.map((ref, idx) => (
                <div key={idx} className="mb-3">
                  <h3 className="font-semibold" style={titleStyle}>
                    {ref.name}
                  </h3>
                  <p className="text-sm" style={baseTextStyle}>
                    {ref.relation}
                  </p>
                  <p className="text-sm" style={baseTextStyle}>
                    {ref.contact}
                  </p>
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

export default TemplateOne;










