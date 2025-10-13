// "use client";
// import React, { createContext, useContext, useState, ReactNode } from "react";

// // Resume data structure
// export interface ResumeData {
//   personalInfo: { name: string;email: string;phone: string;location: string;};
//   professionalSummary: string;
//   education: { degree: string; school: string; year: string;}[];
//   workExperience: { role: string; company: string; duration: string; description: string }[];
//   projects: { title: string; description: string; technologies: string }[];
//   skills: string[];
//   certifications: { name: string; issuedby: string; year:string }[];
//   achievements: string[];
//   volunteering: string[];
//   references: { name: string; contact: string }[];
//   internships: { role: string; company: string; duration: string; description: string }[];
//   awards: string[];
//   languages: { name: string; level: string }[];
// }

// interface ResumeContextType {
//   resumeData: ResumeData;
//   setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
//   selectedTemplate: number | null;
//   setSelectedTemplate: (id: number) => void;
// }

// // Create context
// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { name: "", email: "", phone: "", location: "" },
//     professionalSummary: "",
//     education: [],
//     workExperience: [],
//     projects: [],
//     skills: [],
//     certifications: [],
//     achievements: [],
//     volunteering: [],
//     references: [],
//     internships: [],
//     awards: [],
//     languages: [],
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

//   return (
//     <ResumeContext.Provider
//       value={{ resumeData, setResumeData, selectedTemplate, setSelectedTemplate }}
//     >
//       {children}
//     </ResumeContext.Provider>
//   );
// };

// export const useResume = () => {
//   const context = useContext(ResumeContext);
//   if (!context) throw new Error("useResume must be used inside ResumeProvider");
//   return context;
// };

// "use client";
// import React, { createContext, useContext, useState, ReactNode } from "react";

// // Resume data structure
// export interface ResumeData {
//   personalInfo: { name: string; email: string; phone: string; location: string };
//   professionalSummary: string;
//   education: { school: string; degree: string; year: string }[];
//   workExperience: { company: string; role: string; duration: string; description: string }[];
//   projects: { title: string; description: string; technologies: string }[];
//   skills: string[];
//   certifications: { name: string; issuedBy: string; year: string }[];
//   achievements: string[];
//   volunteering: { organization: string; role: string; duration: string }[];
//   references: { name: string; relation: string; contact: string }[];
//   internships: { company: string; role: string; duration: string; description: string }[];
//   awards: { title: string; issuedBy: string; year: string }[];
// }

// interface ResumeContextType {
//   resumeData: ResumeData;
//   setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
//   selectedTemplate: number | null;
//   setSelectedTemplate: (id: number) => void;
// }

// // Create context
// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { name: "", email: "", phone: "", location: "" },
//     professionalSummary: "",
//     education: [],
//     workExperience: [],
//     projects: [],
//     skills: [],
//     certifications: [],
//     achievements: [],
//     volunteering: [],
//     references: [],
//     internships: [],
//     awards: [],
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

//   return (
//     <ResumeContext.Provider
//       value={{ resumeData, setResumeData, selectedTemplate, setSelectedTemplate }}
//     >
//       {children}
//     </ResumeContext.Provider>
//   );
// };

// export const useResume = () => {
//   const context = useContext(ResumeContext);
//   if (!context) throw new Error("useResume must be used inside ResumeProvider");
//   return context;
// };  before style

// "use client";
// import React, { createContext, useContext, useState, ReactNode } from "react";

// // Resume data structure
// export interface ResumeData {
//   personalInfo: { name: string; email: string; phone: string; location: string };
//   professionalSummary: string;
//   education: { school: string; degree: string; year: string }[];
//   workExperience: { company: string; role: string; duration: string; description: string }[];
//   projects: { title: string; description: string; technologies: string }[];
//   skills: string[];
//   certifications: { name: string; issuedBy: string; year: string }[];
//   achievements: string[];
//   volunteering: { organization: string; role: string; duration: string }[];
//   references: { name: string; relation: string; contact: string }[];
//   internships: { company: string; role: string; duration: string; description: string }[];
//   awards: { title: string; issuedBy: string; year: string }[];
// }

// // Style settings
// export interface ResumeStyle {
//   fontFamily: string;
//   fontSize: string;
//   bold: boolean;
//   italic: boolean;
//   underline: boolean;
//   lineSpacing: string;
//   headingColor: string;
//   bodyColor: string;
// }

// interface ResumeContextType {
//   resumeData: ResumeData;
//   setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
//   selectedTemplate: number | null;
//   setSelectedTemplate: (id: number) => void;
//   resumeStyle: ResumeStyle;
//   setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
// }

// // Create context
// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { name: "", email: "", phone: "", location: "" },
//     professionalSummary: "",
//     education: [],
//     workExperience: [],
//     projects: [],
//     skills: [],
//     certifications: [],
//     achievements: [],
//     volunteering: [],
//     references: [],
//     internships: [],
//     awards: [],
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "sans-serif",
//     fontSize: "14px",
//     bold: false,
//     italic: false,
//     underline: false,
//     lineSpacing: "1.5",
//     headingColor: "#1e40af",
//     bodyColor: "#374151",
//   });

//   return (
//     <ResumeContext.Provider
//       value={{ resumeData, setResumeData, selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle }}
//     >
//       {children}
//     </ResumeContext.Provider>
//   );
// };

// export const useResume = () => {
//   const context = useContext(ResumeContext);
//   if (!context) throw new Error("useResume must be used inside ResumeProvider");
//   return context;
// };  before different sizes for font



// "use client";
// import React, { createContext, useContext, useState, ReactNode } from "react";

// // Resume data structure
// export interface ResumeData {
//   personalInfo: { name: string; email: string; phone: string; location: string };
//   professionalSummary: string;
//   education: { school: string; degree: string; year: string }[];
//   workExperience: { company: string; role: string; duration: string; description: string }[];
//   projects: { title: string; description: string; technologies: string }[];
//   skills: string[];
//   certifications: { name: string; issuedBy: string; year: string }[];
//   achievements: string[];
//   volunteering: { organization: string; role: string; duration: string }[];
//   references: { name: string; relation: string; contact: string }[];
//   internships: { company: string; role: string; duration: string; description: string }[];
//   awards: { title: string; issuedBy: string; year: string }[];
// }

// // Style settings
// export interface ResumeStyle {
//   fontFamily: string;
//   nameFontSize: string;     // ✅ font size for candidate name
//   headingFontSize: string;  // ✅ font size for section headings
//   bodyFontSize: string;     // ✅ font size for body text
//   bold: boolean;
//   italic: boolean;
//   underline: boolean;
//   lineSpacing: string;
//   headingColor: string;
//   bodyColor: string;
// }

// interface ResumeContextType {
//   resumeData: ResumeData;
//   setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
//   selectedTemplate: number | null;
//   setSelectedTemplate: (id: number) => void;
//   resumeStyle: ResumeStyle;
//   setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
// }

// // Create context
// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { name: "", email: "", phone: "", location: "" },
//     professionalSummary: "",
//     education: [],
//     workExperience: [],
//     projects: [],
//     skills: [],
//     certifications: [],
//     achievements: [],
//     volunteering: [],
//     references: [],
//     internships: [],
//     awards: [],
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "sans-serif",
//     nameFontSize: "28px",      // ✅ default for name
//     headingFontSize: "18px",   // ✅ default for section headings
//     bodyFontSize: "14px",      // ✅ default for body text
//     bold: false,
//     italic: false,
//     underline: false,
//     lineSpacing: "1.5",
//     headingColor: "#1e40af",
//     bodyColor: "#374151",
//   });

//   return (
//     <ResumeContext.Provider
//       value={{
//         resumeData,
//         setResumeData,
//         selectedTemplate,
//         setSelectedTemplate,
//         resumeStyle,
//         setResumeStyle,
//       }}
//     >
//       {children}
//     </ResumeContext.Provider>
//   );
// };

// export const useResume = () => {
//   const context = useContext(ResumeContext);
//   if (!context) throw new Error("useResume must be used inside ResumeProvider");
//   return context;
// };                                                                                                                                                                                    













// "use client";
// import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// // Resume data structure
// export interface ResumeData {
//   personalInfo: { name: string; email: string; phone: string; location: string };
//   professionalSummary: string;
//   education: { school: string; degree: string; year: string }[];
//   workExperience: { company: string; role: string; duration: string; description: string }[];
//   projects: { title: string; description: string; technologies: string }[];
//   skills: string[];
//   certifications: { name: string; issuedBy: string; year: string }[];
//   achievements: string[];
//   volunteering: { organization: string; role: string; duration: string }[];
//   references: { name: string; relation: string; contact: string }[];
//   internships: { company: string; role: string; duration: string; description: string }[];
//   awards: { title: string; issuedBy: string; year: string }[];
// }

// // Style settings
// export interface ResumeStyle {
//   fontFamily: string;
//   nameFontSize: string;    
//   headingFontSize: string; 
//   bodyFontSize: string;    
//   bold: boolean;
//   italic: boolean;
//   underline: boolean;
//   lineSpacing: string;
//   headingColor: string;
//   bodyColor: string;
// }

// interface ResumeContextType {
//   resumeData: ResumeData;
//   setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
//   selectedTemplate: number | null;
//   setSelectedTemplate: (id: number) => void;
//   resumeStyle: ResumeStyle;
//   setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
//   lastUpdated: Date | null; // ✅ NEW field
// }

// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { name: "", email: "", phone: "", location: "" },
//     professionalSummary: "",
//     education: [],
//     workExperience: [],
//     projects: [],
//     skills: [],
//     certifications: [],
//     achievements: [],
//     volunteering: [],
//     references: [],
//     internships: [],
//     awards: [],
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "sans-serif",
//     nameFontSize: "28px",
//     headingFontSize: "18px",
//     bodyFontSize: "14px",
//     bold: false,
//     italic: false,
//     underline: false,
//     lineSpacing: "1.5",
//     headingColor: "#1e40af",
//     bodyColor: "#374151",
//   });

//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

//   // ✅ Whenever resumeData changes, update lastUpdated
//   useEffect(() => {
//     setLastUpdated(new Date());
//   }, [resumeData]);

//   return (
//     <ResumeContext.Provider
//       value={{
//         resumeData,
//         setResumeData,
//         selectedTemplate,
//         setSelectedTemplate,
//         resumeStyle,
//         setResumeStyle,
//         lastUpdated, // ✅ provided to context
//       }}
//     >
//       {children}
//     </ResumeContext.Provider>
//   );
// };

// export const useResume = () => {
//   const context = useContext(ResumeContext);
//   if (!context) throw new Error("useResume must be used inside ResumeProvider");
//   return context;
// };   before api integration




// "use client";
// import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// // Resume data structure
// export interface ResumeData {
//   personalInfo: { name: string; email: string; phone: string; location: string };
//   professionalSummary: string;
//   education: { school: string; degree: string; year: string }[];
//   workExperience: { company: string; role: string; duration: string; description: string }[];
//   projects: { title: string; description: string; technologies: string }[];
//   skills: string[];
//   certifications: { name: string; issuedBy: string; year: string }[];
//   achievements: string[];
//   volunteering: { organization: string; role: string; duration: string }[];
//   references: { name: string; relation: string; contact: string }[];
//   internships: { company: string; role: string; duration: string; description: string }[];
//   awards: { title: string; issuedBy: string; year: string }[];
// }

// // Style settings
// export interface ResumeStyle {
//   fontFamily: string;
//   nameFontSize: string;    
//   headingFontSize: string; 
//   bodyFontSize: string;    
//   bold: boolean;
//   italic: boolean;
//   underline: boolean;
//   lineSpacing: string;
//   headingColor: string;
//   bodyColor: string;
// }

// interface ResumeContextType {
//   resumeData: ResumeData;
//   setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
//   selectedTemplate: number | null;
//   setSelectedTemplate: (id: number) => void;
//   resumeStyle: ResumeStyle;
//   setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
//   lastUpdated: Date | null;
//   resumeId: string | null;                          // ✅ unique ID
//   createResume: () => Promise<void>;                // ✅ function to re-trigger API if needed
// }

// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { name: "", email: "", phone: "", location: "" },
//     professionalSummary: "",
//     education: [],
//     workExperience: [],
//     projects: [],
//     skills: [],
//     certifications: [],
//     achievements: [],
//     volunteering: [],
//     references: [],
//     internships: [],
//     awards: [],
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "sans-serif",
//     nameFontSize: "28px",
//     headingFontSize: "18px",
//     bodyFontSize: "14px",
//     bold: false,
//     italic: false,
//     underline: false,
//     lineSpacing: "1.5",
//     headingColor: "#1e40af",
//     bodyColor: "#374151",
//   });

//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [resumeId, setResumeId] = useState<string | null>(null);

//   // ✅ Whenever resumeData changes, update lastUpdated
//   useEffect(() => {
//     setLastUpdated(new Date());
//   }, [resumeData]);

//   // ✅ API call to create resume ID
//   const createResume = async () => {
//     try {
//       const res = await fetch(process.env.NEXT_PUBLIC_RESUME_API as string, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(resumeData), // send current resume data
//       });

//       if (!res.ok) throw new Error("Failed to create resume");

//       const result = await res.json();
//       setResumeId(result.id); // backend should return { id: "unique123" }
//     } catch (error) {
//       console.error("Error creating resume:", error);
//     }
//   };

//   // ✅ Run once when provider mounts → generate resume ID automatically
//   useEffect(() => {
//     if (!resumeId) {
//       createResume();
//     }
//   });

//   return (
//     <ResumeContext.Provider
//       value={{
//         resumeData,
//         setResumeData,
//         selectedTemplate,
//         setSelectedTemplate,
//         resumeStyle,
//         setResumeStyle,
//         lastUpdated,
//         resumeId,
//         createResume, // still exposed in case you want to regenerate manually
//       }}
//     >
//       {children}
//     </ResumeContext.Provider>
//   );
// };

// export const useResume = () => {
//   const context = useContext(ResumeContext);
//   if (!context) throw new Error("useResume must be used inside ResumeProvider");
//   return context;
// };  automatic id generate






// "use client";
// import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// // Resume data structure
// export interface ResumeData {
//   personalInfo: { name: string; email: string; phone: string; location: string; linkedinurl: string; };
//   professionalSummary: string;
//   education: { school: string; degree: string; startDate: string; endDate: string; }[];
//   workExperience: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; }[];
//   projects: { title: string; description: string; technologies: string; startDate: string; endDate: string; link: string; }[];
//   skills: string[];
//   certifications: { name: string; issuedBy: string; year: string; }[];
//   achievements: { title:string; date: string; description: string; }[];
//   volunteering: { organization: string; role: string; startDate: string; endDate: string; }[];
//   references: { name: string; relation: string; contact: string; }[];
//   internships: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; }[];
//   awards: { title: string; issuedBy: string; year: string; }[];
// }


// // Style settings
// export interface ResumeStyle {
//   fontFamily: string;
//   nameFontSize: string;    
//   headingFontSize: string; 
//   bodyFontSize: string;    
//   bold: boolean;
//   italic: boolean;
//   underline: boolean;
//   lineSpacing: string;
//   headingColor: string;
//   bodyColor: string;
// }

// interface ResumeContextType {
//   resumeData: ResumeData;
//   setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
//   selectedTemplate: number | null;
//   setSelectedTemplate: (id: number) => void;
//   resumeStyle: ResumeStyle;
//   setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
//   lastUpdated: Date | null;
//   resumeId: string | null;                          // ✅ NEW
//   createResume: () => Promise<void>;                // ✅ NEW
// }

// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { name: "", email: "", phone: "", location: "", linkedinurl: "" },
//     professionalSummary: "",
//     education: [],
//     workExperience: [],
//     projects: [],
//     skills: [],
//     certifications: [],
//     achievements: [],
//     volunteering: [],
//     references: [],
//     internships: [],
//     awards: [],
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "sans-serif",
//     nameFontSize: "28px",
//     headingFontSize: "18px",
//     bodyFontSize: "14px",
//     bold: false,
//     italic: false,
//     underline: false,
//     lineSpacing: "1.0",
//     headingColor: "#1e40af",
//     bodyColor: "#374151",
//   });

//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [resumeId, setResumeId] = useState<string | null>(null); // ✅ store unique resume ID

//   // ✅ Whenever resumeData changes, update lastUpdated
//   useEffect(() => {
//     setLastUpdated(new Date());
//   }, [resumeData]);

//   // ✅ API call to create resume ID
//   const createResume = async () => {
//     try {
//       const res = await fetch(process.env.NEXT_PUBLIC_RESUME_API as string, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(resumeData), // sending current resume data
//       });

//       if (!res.ok) throw new Error("Failed to create resume");

//       const result = await res.json();
//       setResumeId(result.id); // assuming backend returns { id: "unique123" }
//     } catch (error) {
//       console.error("Error creating resume:", error);
//     }
//   };

//   return (
//     <ResumeContext.Provider
//       value={{
//         resumeData,
//         setResumeData,
//         selectedTemplate,
//         setSelectedTemplate,
//         resumeStyle,
//         setResumeStyle,
//         lastUpdated,
//         resumeId,        // ✅ provided
//         createResume,    // ✅ provided
//       }}
//     >
//       {children}
//     </ResumeContext.Provider>
//   );
// };

// export const useResume = () => {
//   const context = useContext(ResumeContext);
//   if (!context) throw new Error("useResume must be used inside ResumeProvider");
//   return context;
// }; main main



// "use client";
// import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// // Resume data structure
// export interface ResumeData {
//   resume_id?: string; // ✅ ADDED
//   personalInfo: { name: string; email: string; phone: string; location: string; linkedinurl: string; };
//   professionalSummary: string;
//   education: { school: string; degree: string; startDate: string; endDate: string; }[];
//   workExperience: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; }[];
//   projects: { title: string; description: string; technologies: string; startDate: string; endDate: string; link: string; }[];
//   skills: string[];
//   certifications: { name: string; issuedBy: string; year: string; }[];
//   achievements: { title:string; date: string; description: string; }[];
//   volunteering: { organization: string; role: string; startDate: string; endDate: string; }[];
//   references: { name: string; relation: string; contact: string; }[];
//   internships: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; }[];
//   awards: { title: string; issuedBy: string; year: string; }[];
// }


// // Style settings
// export interface ResumeStyle {
//   fontFamily: string;
//   nameFontSize: string;    
//   headingFontSize: string; 
//   bodyFontSize: string;    
//   bold: boolean;
//   italic: boolean;
//   underline: boolean;
//   lineSpacing: string;
//   headingColor: string;
//   bodyColor: string;
// }

// interface ResumeContextType {
//   resumeData: ResumeData;
//   setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
//   selectedTemplate: number | null;
//   setSelectedTemplate: (id: number) => void;
//   resumeStyle: ResumeStyle;
//   setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
//   lastUpdated: Date | null;
//   resumeId: string | null;
//   createResume: () => Promise<void>;
// }

// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { name: "", email: "", phone: "", location: "", linkedinurl: "" },
//     professionalSummary: "",
//     education: [],
//     workExperience: [],
//     projects: [],
//     skills: [],
//     certifications: [],
//     achievements: [],
//     volunteering: [],
//     references: [],
//     internships: [],
//     awards: [],
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "sans-serif",
//     nameFontSize: "28px",
//     headingFontSize: "18px",
//     bodyFontSize: "14px",
//     bold: false,
//     italic: false,
//     underline: false,
//     lineSpacing: "1.0",
//     headingColor: "#1e40af",
//     bodyColor: "#374151",
//   });

//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [resumeId, setResumeId] = useState<string | null>(null);

//   // ✅ Whenever resumeData changes, update lastUpdated
//   useEffect(() => {
//     setLastUpdated(new Date());
//   }, [resumeData]);

//   // ✅ API call to create resume ID
//   const createResume = async () => {
//     try {
//       const res = await fetch(process.env.NEXT_PUBLIC_RESUME_API as string, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(resumeData),
//       });

//       if (!res.ok) throw new Error("Failed to create resume");

//       const result = await res.json();
//       setResumeId(result.id);
//     } catch (error) {
//       console.error("Error creating resume:", error);
//     }
//   };

//   return (
//     <ResumeContext.Provider
//       value={{
//         resumeData,
//         setResumeData,
//         selectedTemplate,
//         setSelectedTemplate,
//         resumeStyle,
//         setResumeStyle,
//         lastUpdated,
//         resumeId,
//         createResume,
//       }}
//     >
//       {children}
//     </ResumeContext.Provider>
//   );
// };

// export const useResume = () => {
//   const context = useContext(ResumeContext);
//   if (!context) throw new Error("useResume must be used inside ResumeProvider");
//   return context;
// }; before drag update in teplates



"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Resume data structure
export interface ResumeData {
  resume_id?: string;
  personalInfo: { name: string; email: string; phone: string; location: string; linkedinurl: string; };
  professionalSummary: string;
  education: { school: string; degree: string; startDate: string; endDate: string; }[];
  workExperience: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; }[];
  projects: { title: string; description: string; technologies: string; startDate: string; endDate: string; link: string; }[];
  skills: string[];
  certifications: { name: string; issuedBy: string; year: string; }[];
  achievements: { title: string; date: string; description: string; }[];
  volunteering: { organization: string; role: string; startDate: string; endDate: string; }[];
  references: { name: string; relation: string; contact: string; }[];
  internships: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; }[];
  awards: { title: string; issuedBy: string; year: string; }[];
}

// Style settings
export interface ResumeStyle {
  fontFamily: string;
  nameFontSize: string;
  headingFontSize: string;
  bodyFontSize: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  lineSpacing: string;
  headingColor: string;
  bodyColor: string;
}

interface ResumeContextType {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  selectedTemplate: number | null;
  setSelectedTemplate: (id: number) => void;
  resumeStyle: ResumeStyle;
  setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
  lastUpdated: Date | null;
  resumeId: string | null;
  sectionOrder: string[];
  setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
  createResume: () => Promise<void>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: { name: "", email: "", phone: "", location: "", linkedinurl: "" },
    professionalSummary: "",
    education: [],
    workExperience: [],
    projects: [],
    skills: [],
    certifications: [],
    achievements: [],
    volunteering: [],
    references: [],
    internships: [],
    awards: [],
  });

  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
    fontFamily: "sans-serif",
    nameFontSize: "28px",
    headingFontSize: "18px",
    bodyFontSize: "14px",
    bold: false,
    italic: false,
    underline: false,
    lineSpacing: "1.0",
    headingColor: "#1e40af",
    bodyColor: "#374151",
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);

  // ✅ Section order to sync template rendering
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    "Personal Info",
    "Professional Summary",
    "Skills",
    "Education",
    "Work Experience",
    "Projects",
    "Certifications",
    "Achievements",
    "Volunteering",
    "Internships",
    "Awards",
    "References",
  ]);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [resumeData]);

  const createResume = async () => {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_RESUME_API as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });

      if (!res.ok) throw new Error("Failed to create resume");
      const result = await res.json();
      setResumeId(result.id);
    } catch (error) {
      console.error("Error creating resume:", error);
    }
  };

  return (
    <ResumeContext.Provider
      value={{
        resumeData,
        setResumeData,
        selectedTemplate,
        setSelectedTemplate,
        resumeStyle,
        setResumeStyle,
        lastUpdated,
        resumeId,
        createResume,
        sectionOrder,
        setSectionOrder,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) throw new Error("useResume must be used inside ResumeProvider");
  return context;
};




