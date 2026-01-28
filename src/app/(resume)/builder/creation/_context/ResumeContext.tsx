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



// "use client";
// import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// // Resume data structure
// export interface ResumeData {
//   resume_id?: string;
//   personalInfo: { name: string; email: string; phone: string; location: string; linkedinurl: string; portifoliourl:string;};
//   professionalSummary: string;
//   education: { school: string; degree: string; startDate: string; endDate: string; }[];
//   workExperience: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; location:string; }[];
//   projects: { title: string; description: string; technologies: string[]; startDate: string; endDate: string; link: string; }[];
//   skills: string[];
//   certifications: { name: string; issuedBy: string; year: string; }[];
//   achievements: { title: string; date: string; description: string; }[];
//   volunteering: { organization: string; role: string; startDate: string; endDate: string; }[];
//   references: { name: string; relation: string; contact: string; }[];
//   internships: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; location:string; }[];
//   awards: { title: string; issuedBy: string; year: string; }[];
//   hobbies: { name: string; description: string; proficiencyLevel?: string; achievement?: string; }[];
//   interests: { name: string; description: string; category?: string;  }[];
//   languages: { language: string; proficiency: string; }[];
//   publications: { title: string; authors: string; publicationName: string; date: string; url: string; }[];

// }

// // Style settings
// export interface ResumeStyle {
//   fontFamily: string;
//   nameFontSize: string;
//   headingFontSize: string;
//   bodyFontSize: string;
//   bold: boolean;
//   italic: boolean;
//   // underline: boolean;
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
//   sectionOrder: string[];
//   setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
//   createResume: () => Promise<void>;
// }

// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { name: "", email: "", phone: "", location: "", linkedinurl: "", portifoliourl: "" },
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
//     hobbies:[],
//     interests:[],
//     languages:[],
//     publications:[],
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "arial",
//     nameFontSize: "20px",
//     headingFontSize: "14px",
//     bodyFontSize: "12px",
//     bold: false,
//     italic: false,
//     // underline: false,
//     lineSpacing: "1.0",
//     headingColor: "#000000",
//     bodyColor: "#4b5563",
//   });

//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [resumeId, setResumeId] = useState<string | null>(null);

//   // ✅ Section order to sync template rendering
//   const [sectionOrder, setSectionOrder] = useState<string[]>([
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//     "Work Experience",
//     "Projects",
//     "Certifications",
//     "Achievements",
//     "Volunteering",
//     "Internships",
//     "Awards",
//     "References",
//   ]);

//   useEffect(() => {
//     setLastUpdated(new Date());
//   }, [resumeData]);

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
//         sectionOrder,
//         setSectionOrder,
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
// };  before cirlce bar beside the resume sections



// "use client";
// import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// // Resume data structure
// export interface ResumeData {
//   resume_id?: string;
//   personalInfo: { name: string; email: string; phone: string; location: string; linkedinurl: string; portifoliourl:string;};
//   professionalSummary: string;
//   education: { school: string; degree: string; startDate: string; endDate: string; }[];
//   workExperience: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; location:string; }[];
//   projects: { title: string; description: string; technologies: string[]; startDate: string; endDate: string; link: string; }[];
//   skills: string[];
//   certifications: { name: string; issuedBy: string; year: string; }[];
//   achievements: { title: string; date: string; description: string; }[];
//   volunteering: { organization: string; role: string; startDate: string; endDate: string; }[];
//   references: { name: string; relation: string; contact: string; }[];
//   internships: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; location:string; }[];
//   awards: { title: string; issuedBy: string; year: string; }[];
//   hobbies: { name: string; description: string; proficiencyLevel?: string; achievement?: string; }[];
//   interests: { name: string; description: string; category?: string;  }[];
//   languages: { language: string; proficiency: string; }[];
//   publications: { title: string; authors: string; publicationName: string; date: string; url: string; }[];
// }

// // Style settings
// export interface ResumeStyle {
//   fontFamily: string;
//   nameFontSize: string;
//   headingFontSize: string;
//   bodyFontSize: string;
//   bold: boolean;
//   italic: boolean;
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
//   sectionOrder: string[];
//   setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
//   createResume: () => Promise<void>;
//   completionStatus: Record<string, boolean>;
//   setCompletionStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
//   getCompletionPercentage: () => number;
// }

// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { name: "", email: "", phone: "", location: "", linkedinurl: "", portifoliourl: "" },
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
//     hobbies:[],
//     interests:[],
//     languages:[],
//     publications:[],
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "arial",
//     nameFontSize: "18px",
//     headingFontSize: "14px",
//     bodyFontSize: "12px",
//     bold: false,
//     italic: false,
//     lineSpacing: "1.0",
//     headingColor: "#000000",
//     bodyColor: "#4b5563",
//   });

//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [resumeId, setResumeId] = useState<string | null>(null);

//   const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({
//     "Personal Info": false,
//     "Professional Summary": false,
//     "Skills": false,
//     "Education": false,
//     "Work Experience": false,
//     "Projects": false,
//     "Certifications": false,
//     "Achievements": false,
//     "Volunteering": false,
//     "Internships": false,
//     "Awards": false,
//     "Hobbies": false,
//     "Interests": false,
//     "Languages": false,
//     "Publications": false,
//     "References": false,
//   });

//   // ✅ Section order to sync template rendering
//   const [sectionOrder, setSectionOrder] = useState<string[]>([
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//     "Work Experience",
//     "Projects",
//     "Certifications",
//     "Achievements",
//     "Volunteering",
//     "Internships",
//     "Awards",
//     "Hobbies",
//     "Interests",
//     "Languages",
//     "Publications",
//     "References",
//   ]);

//   useEffect(() => {
//     setLastUpdated(new Date());
//   }, [resumeData]);

//   // Calculate completion percentage
//   const getCompletionPercentage = (): number => {
//     const totalSections = Object.keys(completionStatus).length;
//     const completedSections = Object.values(completionStatus).filter(Boolean).length;
//     return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
//   };

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
//         sectionOrder,
//         setSectionOrder,
//         completionStatus,
//         setCompletionStatus,
//         getCompletionPercentage,
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
// import { getResumeById } from "@/api/resumeApi";
// import { toast } from "sonner";

// // Resume data structure
// export interface ResumeData {
//   resume_id?: string;
//   personalInfo: { fullName: string; email: string; phone: string; location: string; linkedinUrl: string; portifolioUrl:string;};
//   professionalSummary: string;
//   education: { school: string; degree: string; startDate: string; endDate: string; }[];
//   workExperience: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; location:string; }[];
//   projects: { title: string; description: string; technologies: string[]; startDate: string; endDate: string; link: string; }[];
//   skills: string[];
//   certifications: { name: string; issuedBy: string; year: string; }[];
//   achievements: { title: string; date: string; description: string; }[];
//   volunteering: { organization: string; role: string; startDate: string; endDate: string; }[];
//   references: { name: string; relation: string; contact: string; }[];
//   internships: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; location:string; }[];
//   awards: { title: string; issuedBy: string; year: string; }[];
//   hobbies: { name: string; description: string; proficiencyLevel?: string; achievement?: string; }[];
//   interests: { name: string; description: string; category?: string;  }[];
//   languages: { language: string; proficiency: string; }[];
//   publications: { title: string; authors: string; publicationName: string; date: string; url: string; }[];
// }

// // Style settings
// export interface ResumeStyle {
//   fontFamily: string;
//   nameFontSize: string;
//   headingFontSize: string;
//   bodyFontSize: string;
//   bold: boolean;
//   italic: boolean;
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
//   sectionOrder: string[];
//   setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
//   createResume: () => Promise<void>;
//   completionStatus: Record<string, boolean>;
//   setCompletionStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
//   getCompletionPercentage: () => number;
//   isLoadingResume: boolean;
//   // isLoadingDefaultTemplate: boolean;
// }

// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { fullName: "", email: "", phone: "", location: "", linkedinUrl: "", portifolioUrl: "" },
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
//     hobbies:[],
//     interests:[],
//     languages:[],
//     publications:[],
//   });

//   // const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
//   // const [isLoadingDefaultTemplate, setIsLoadingDefaultTemplate] = useState(true);
//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(() => {
//   if (typeof window !== 'undefined') {
//     const saved = localStorage.getItem("selected_template");
//     return saved ? parseInt(saved, 10) : null;
//   }
//   return null;
// });

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "arial",
//     nameFontSize: "24px",
//     headingFontSize: "14px",
//     bodyFontSize: "12px",
//     bold: false,
//     italic: false,
//     lineSpacing: "1.0",
//     headingColor: "#000000",
//     bodyColor: "#4b5563",
//   });

//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [resumeId, setResumeId] = useState<string | null>(null);
//   const [isLoadingResume, setIsLoadingResume] = useState(true);

//   useEffect(() => {
//   if (selectedTemplate !== null) {
//     localStorage.setItem("selected_template", String(selectedTemplate));
//     console.log("💾 Template saved to localStorage:", selectedTemplate);
//   }
// }, [selectedTemplate]);

//   useEffect(() => {
//   const loadResumeData = async () => {
//     const resumeId = localStorage.getItem("current_resume_id");
    
//     if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//       console.log("ℹ️ No resume ID - starting with empty resume");
//       setIsLoadingResume(false);
//       return;
//     }

//     try {
//       setIsLoadingResume(true);
//       console.log("📥 Loading resume data for ID:", resumeId);
      
//       const data = await getResumeById(resumeId);
      
//       console.log("✅ Resume data loaded from backend:", data);
      
//       // ❌ setResumeData doesn't exist in EditorTab!
//       setResumeData({
//         resume_id: data.id,
//         personalInfo: {
//           fullName: data.personalInfo?.fullName || "",
//           email: data.personalInfo?.email || "",
//           phone: data.personalInfo?.phone || "",
//           location: data.personalInfo?.location || "",
//           linkedinUrl: data.personalInfo?.linkedinUrl || "",
//           portifolioUrl: data.personalInfo?.portifolioUrl || "",
//         },
//         professionalSummary: data.professionalSummary || "",
//         education: data.education || [],
//         workExperience: data.workExperience || [],
//         projects: data.projects || [],
//         skills: data.skills || [],
//         certifications: data.certifications || [],
//         achievements: data.achievements || [],
//         volunteering: data.volunteering || [],
//         references: data.references || [],
//         internships: data.internships || [],
//         awards: data.awards || [],
//         hobbies: data.hobbies || [],
//         interests: data.interests || [],
//         languages: data.languages || [],
//         publications: data.publications || [],
//       });
      
//       console.log("✅ Resume context populated with data");
      
//       toast.success("Resume loaded successfully!");
      
//     } catch (error) {
//       console.error("❌ Failed to load resume:", error);
//       toast.error("Failed to load resume data");
//     } finally {
//       setIsLoadingResume(false);
//     }
//   };

//   loadResumeData();
// }, []);

//   const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({
//     "Personal Info": false,
//     "Professional Summary": false,
//     "Skills": false,
//     "Education": false,
//     "Work Experience": false,
//     "Projects": false,
//     "Certifications": false,
//     "Achievements": false,
//     "Volunteering": false,
//     "Internships": false,
//     "Awards": false,
//     "Hobbies": false,
//     "Interests": false,
//     "Languages": false,
//     "Publications": false,
//     "References": false,
//   });

//   const [sectionOrder, setSectionOrder] = useState<string[]>([
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//     "Work Experience",
//     "Projects",
//     "Certifications",
//     "Achievements",
//     "Volunteering",
//     "Internships",
//     "Awards",
//     "Hobbies",
//     "Interests",
//     "Languages",
//     "Publications",
//     "References",
//   ]);

//   // Fetch default template on mount
//   // useEffect(() => {
//   //   const fetchDefaultTemplate = async () => {
//   //     try {
//   //       console.log("🎨 Loading default template...");
//   //       const defaultTemplate = await getDefaultTemplate();
//   //       setSelectedTemplate(defaultTemplate.id);
//   //       console.log("✅ Default template set:", defaultTemplate.id);
//   //     } catch (error) {
//   //       console.error("❌ Error loading default template:", error);
//   //       // Fallback to template 1 if API fails
//   //       setSelectedTemplate(1);
//   //     } finally {
//   //       setIsLoadingDefaultTemplate(false);
//   //     }
//   //   };

//   //   // Only fetch if no template is selected
//   //   if (selectedTemplate === null) {
//   //     fetchDefaultTemplate();
//   //   } else {
//   //     setIsLoadingDefaultTemplate(false);
//   //   }
//   // }, []); // Run only once on mount

//   useEffect(() => {
//     setLastUpdated(new Date());
//   }, [resumeData]);

//   const getCompletionPercentage = (): number => {
//     const totalSections = Object.keys(completionStatus).length;
//     const completedSections = Object.values(completionStatus).filter(Boolean).length;
//     return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
//   };

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
//         sectionOrder,
//         setSectionOrder,
//         completionStatus,
//         setCompletionStatus,
//         getCompletionPercentage,
//         isLoadingResume,
//         // isLoadingDefaultTemplate,
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
// }; before certification fields add



// "use client";
// import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
// import { getResumeById } from "@/api/resumeApi";
// import { toast } from "sonner";

// export interface CategorizedSkills {
//   programming_languages: string[];
//   frameworks: string[];
//   databases: string[];
//   tools: string[];
//   cloud_platforms: string[];
//   soft_skills: string[];
// }
// // Resume data structure
// export interface ResumeData {
//   resume_id?: string;
//   personalInfo: { 
//     fullName: string; 
//     email: string; 
//     phone: string; 
//     location: string; 
//     linkedinUrl: string; 
//     portifolioUrl: string;
//   };
//   professionalSummary: string;
//   education: { 
//     school: string; 
//     degree: string; 
//     startDate: string; 
//     endDate: string; 
//   }[];
//   workExperience: { 
//     company: string; 
//     role: string; 
//     startDate: string; 
//     endDate: string; 
//     currentlyWorking: boolean; 
//     description: string; 
//     location: string; 
//   }[];
//   projects: { 
//     title: string; 
//     description: string; 
//     technologies: string[]; 
//     startDate: string; 
//     endDate: string; 
//     link: string; 
//   }[];
//   skills: string[];
//   categorizedSkills?: CategorizedSkills; // ✅ NEW: Categorized skills
//   certifications: { 
//     name: string; 
//     issuedBy: string; 
//     year: string; 
//     expiryDate?: string;      // ✅ NEW: Expiry date (optional)
//     credentialId?: string;     // ✅ NEW: Credential ID (optional)
//   }[];
//   achievements: { 
//     title: string; 
//     date: string; 
//     description: string; 
//   }[];
//   volunteering: { 
//     organization: string; 
//     role: string; 
//     startDate: string; 
//     endDate: string; 
//   }[];
//   references: { 
//     name: string; 
//     relation: string; 
//     contact: string; 
//   }[];
//   internships: { 
//     company: string; 
//     role: string; 
//     startDate: string; 
//     endDate: string; 
//     currentlyWorking: boolean; 
//     description: string; 
//     location: string; 
//   }[];
//   awards: { 
//     title: string; 
//     issuedBy: string; 
//     year: string; 
//   }[];
//   hobbies: { 
//     name: string; 
//     description: string; 
//     proficiencyLevel?: string; 
//     achievement?: string; 
//   }[];
//   interests: { 
//     name: string; 
//     description: string; 
//     category?: string;  
//   }[];
//   languages: { 
//     language: string; 
//     proficiency: string; 
//   }[];
//   publications: { 
//     title: string; 
//     authors: string; 
//     publicationName: string; 
//     date: string; 
//     url: string; 
//   }[];
// }

// // Style settings
// export interface ResumeStyle {
//   fontFamily: string;
//   nameFontSize: string;
//   headingFontSize: string;
//   bodyFontSize: string;
//   bold: boolean;
//   italic: boolean;
//   lineSpacing: string;
//   headingColor: string;
//   bodyColor: string;
// }

// interface ResumeContextType {
//   resumeData: ResumeData;
//   setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
//   selectedTemplate: string | number | null;
//   setSelectedTemplate: (id: string | number | null) => void;
//   resumeStyle: ResumeStyle;
//   setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
//   lastUpdated: Date | null;
//   resumeId: string | null;
//   sectionOrder: string[];
//   setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
//   createResume: () => Promise<void>;
//   completionStatus: Record<string, boolean>;
//   setCompletionStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
//   getCompletionPercentage: () => number;
//   isLoadingResume: boolean;
  
// }

// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//    // ✅ UPDATED: Support both string and number template IDs
//   const [selectedTemplate, setSelectedTemplateState] = useState<string | number | null>(() => {
//     if (typeof window !== 'undefined') {
//       const saved = localStorage.getItem("selected_template");
//       return saved || null;
//     }
//     return null;
//   });
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { 
//       fullName: "", 
//       email: "", 
//       phone: "", 
//       location: "", 
//       linkedinUrl: "", 
//       portifolioUrl: "" 
//     },
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
//     hobbies: [],
//     interests: [],
//     languages: [],
//     publications: [],
//   });

//   // const [selectedTemplate, setSelectedTemplate] = useState<number | null>(() => {
//   //   if (typeof window !== 'undefined') {
//   //     const saved = localStorage.getItem("selected_template");
//   //     return saved ? parseInt(saved, 10) : null;
//   //   }
//   //   return null;
//   // });
//   // ✅ UPDATED: setSelectedTemplate function
//   const setSelectedTemplate = (id: string | number | null) => {
//     setSelectedTemplateState(id);
//     if (id !== null) {
//       localStorage.setItem("selected_template", String(id));
//       console.log("💾 Template saved to localStorage:", id);
//     } else {
//       localStorage.removeItem("selected_template");
//     }
//   };

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "arial",
//     nameFontSize: "24px",
//     headingFontSize: "14px",
//     bodyFontSize: "12px",
//     bold: false,
//     italic: false,
//     lineSpacing: "1.0",
//     headingColor: "#000000",
//     bodyColor: "#4b5563",
//   });

//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [resumeId, setResumeId] = useState<string | null>(null);
//   const [isLoadingResume, setIsLoadingResume] = useState(true);

//   useEffect(() => {
//     if (selectedTemplate !== null) {
//       localStorage.setItem("selected_template", String(selectedTemplate));
//       console.log("💾 Template saved to localStorage:", selectedTemplate);
//     }
//   }, [selectedTemplate]);

//   useEffect(() => {
//     const loadResumeData = async () => {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//         console.log("ℹ️ No resume ID - starting with empty resume");
//         setIsLoadingResume(false);
//         return;
//       }

//       try {
//         setIsLoadingResume(true);
//         console.log("📥 Loading resume data for ID:", resumeId);
        
//         const data = await getResumeById(resumeId);
        
//         console.log("✅ Resume data loaded from backend:", data);
        
//         setResumeData({
//           resume_id: data.id,
//           personalInfo: {
//             fullName: data.personalInfo?.fullName || "",
//             email: data.personalInfo?.email || "",
//             phone: data.personalInfo?.phone || "",
//             location: data.personalInfo?.location || "",
//             linkedinUrl: data.personalInfo?.linkedinUrl || "",
//             portifolioUrl: data.personalInfo?.portifolioUrl || "",
//           },
//           professionalSummary: data.professionalSummary || "",
//           education: data.education || [],
//           workExperience: data.workExperience || [],
//           projects: data.projects || [],
//           skills: data.skills || [],
//           // ✅ Handle certifications with new fields
//           certifications: (data.certifications || []).map((cert: any) => ({
//             name: cert.name || "",
//             issuedBy: cert.issuedBy || cert.issued_by || "",
//             year: cert.year || "",
//             expiryDate: cert.expiryDate || cert.expiry_date || "",
//             credentialId: cert.credentialId || cert.credential_id || "",
//           })),
//           achievements: data.achievements || [],
//           volunteering: data.volunteering || [],
//           references: data.references || [],
//           internships: data.internships || [],
//           awards: data.awards || [],
//           hobbies: data.hobbies || [],
//           interests: data.interests || [],
//           languages: data.languages || [],
//           publications: data.publications || [],
//         });
        
//         console.log("✅ Resume context populated with data");
        
//         toast.success("Resume loaded successfully!");
        
//       } catch (error) {
//         console.error("❌ Failed to load resume:", error);
//         toast.error("Failed to load resume data");
//       } finally {
//         setIsLoadingResume(false);
//       }
//     };

//     loadResumeData();
//   }, []);

//   const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({
//     "Personal Info": false,
//     "Professional Summary": false,
//     "Skills": false,
//     "Education": false,
//     "Work Experience": false,
//     "Projects": false,
//     "Certifications": false,
//     "Achievements": false,
//     "Volunteering": false,
//     "Internships": false,
//     "Awards": false,
//     "Hobbies": false,
//     "Interests": false,
//     "Languages": false,
//     "Publications": false,
//     "References": false,
//   });

//   const [sectionOrder, setSectionOrder] = useState<string[]>([
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//     "Work Experience",
//     "Projects",
//     "Certifications",
//     "Achievements",
//     "Volunteering",
//     "Internships",
//     "Awards",
//     "Hobbies",
//     "Interests",
//     "Languages",
//     "Publications",
//     "References",
//   ]);

//   useEffect(() => {
//     setLastUpdated(new Date());
//   }, [resumeData]);

//   const getCompletionPercentage = (): number => {
//     const totalSections = Object.keys(completionStatus).length;
//     const completedSections = Object.values(completionStatus).filter(Boolean).length;
//     return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
//   };

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
//         sectionOrder,
//         setSectionOrder,
//         completionStatus,
//         setCompletionStatus,
//         getCompletionPercentage,
//         isLoadingResume,
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
// }; before skill categories
//  before custom sections


"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getResumeById } from "@/api/resumeApi";
import { toast } from "sonner";

export interface CategorizedSkills {
  programming_languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  cloud_platforms: string[];
  soft_skills: string[];
}

// Resume data structure
export interface ResumeData {
  resume_id?: string;
  personalInfo: { 
    fullname: string; 
    email: string; 
    phone: string; 
    location: string; 
    linkedinUrl: string; 
    portifolioUrl: string;
  };
  professionalSummary: string;
  education: { 
    school: string; 
    degree: string; 
    startDate: string; 
    endDate: string; 
  }[];
  workExperience: { 
    company: string; 
    role: string; 
    startDate: string; 
    endDate: string; 
    currentlyWorking: boolean; 
    description: string; 
    location: string; 
  }[];
  projects: { 
    title: string; 
    description: string; 
    technologies: string[]; 
    startDate: string; 
    endDate: string; 
    link: string; 
  }[];
  skills: string[];
  categorizedSkills?: CategorizedSkills;
  certifications: { 
    name: string; 
    issuedBy: string; 
    year: string; 
    expiryDate?: string;
    credentialId?: string;
  }[];
  achievements: { 
    title: string; 
    date: string; 
    description: string; 
  }[];
  volunteering: { 
    organization: string; 
    role: string; 
    startDate: string; 
    endDate: string; 
  }[];
  references: { 
    name: string; 
    relation: string; 
    contact: string; 
  }[];
  internships: { 
    company: string; 
    role: string; 
    startDate: string; 
    endDate: string; 
    currentlyWorking: boolean; 
    description: string; 
    location: string; 
  }[];
  awards: { 
    title: string; 
    issuedBy: string; 
    year: string; 
  }[];
  hobbies: { 
    name: string; 
    description: string; 
    proficiencyLevel?: string; 
    achievement?: string; 
  }[];
  interests: { 
    name: string; 
    description: string; 
    category?: string;  
  }[];
  languages: { 
    language: string; 
    proficiency: string; 
  }[];
  publications: { 
    title: string; 
    authors: string; 
    publicationName: string; 
    date: string; 
    url: string; 
  }[];
}

// Style settings
export interface ResumeStyle {
  fontFamily: string;
  nameFontSize: string;
  headingFontSize: string;
  bodyFontSize: string;
  bold: boolean;
  italic: boolean;
  lineSpacing: string;
  headingColor: string;
  bodyColor: string;
}

interface ResumeContextType {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  selectedTemplate: string | number | null;
  setSelectedTemplate: (id: string | number | null) => void;
  resumeStyle: ResumeStyle;
  setResumeStyle: React.Dispatch<React.SetStateAction<ResumeStyle>>;
  lastUpdated: Date | null;
  resumeId: string | null;
  sectionOrder: string[];
  setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
  createResume: () => Promise<void>;
  completionStatus: Record<string, boolean>;
  setCompletionStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  getCompletionPercentage: () => number;
  isLoadingResume: boolean;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   // ✅ Template selection with localStorage
//   const [selectedTemplate, setSelectedTemplateState] = useState<string | number | null>(() => {
//     if (typeof window !== 'undefined') {
//       const saved = localStorage.getItem("selected_template");
//       return saved || null;
//     }
//     return null;
//   });

//   // ✅ UPDATED: Initialize resumeData with localStorage fallback
//   const [resumeData, setResumeData] = useState<ResumeData>(() => {
//     if (typeof window !== 'undefined') {
//       const savedData = localStorage.getItem('resumeData');
//       if (savedData) {
//         try {
//           const parsed = JSON.parse(savedData);
//           console.log("📦 Loaded resume data from localStorage:", parsed);
//           return parsed;
//         } catch (error) {
//           console.error("❌ Failed to parse localStorage data:", error);
//         }
//       }
//     }
    
//     // Default empty state
//     return {
//       personalInfo: { 
//         fullName: "", 
//         email: "", 
//         phone: "", 
//         location: "", 
//         linkedinUrl: "", 
//         portifolioUrl: "" 
//       },
//       professionalSummary: "",
//       education: [],
//       workExperience: [],
//       projects: [],
//       skills: [],
//       categorizedSkills: {
//         programming_languages: [],
//         frameworks: [],
//         databases: [],
//         tools: [],
//         cloud_platforms: [],
//         soft_skills: []
//       },
//       certifications: [],
//       achievements: [],
//       volunteering: [],
//       references: [],
//       internships: [],
//       awards: [],
//       hobbies: [],
//       interests: [],
//       languages: [],
//       publications: [],
//     };
//   });

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "arial",
//     nameFontSize: "20px",
//     headingFontSize: "14px",
//     bodyFontSize: "12px",
//     bold: false,
//     italic: false,
//     lineSpacing: "1.0",
//     headingColor: "#1A1A1A",
//     bodyColor: "#4b5563",
//   });

//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [resumeId, setResumeId] = useState<string | null>(null);
//   const [isLoadingResume, setIsLoadingResume] = useState(true);

//   const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({
//     "Personal Info": false,
//     "Professional Summary": false,
//     "Skills": false,
//     "Education": false,
//     "Work Experience": false,
//     "Projects": false,
//     "Certifications": false,
//     "Achievements": false,
//     "Volunteering": false,
//     "Internships": false,
//     "Awards": false,
//     "Hobbies": false,
//     "Interests": false,
//     "Languages": false,
//     "Publications": false,
//     "References": false,
//   });

//   const [sectionOrder, setSectionOrder] = useState<string[]>([
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//     "Work Experience",
//     "Projects",
//     "Certifications",
//     "Achievements",
//     "Volunteering",
//     "Internships",
//     "Awards",
//     "Hobbies",
//     "Interests",
//     "Languages",
//     "Publications",
//     "References",
//   ]);

//   // ✅ NEW: Save resumeData to localStorage whenever it changes
//   useEffect(() => {
//     if (typeof window !== 'undefined' && resumeData) {
//       localStorage.setItem('resumeData', JSON.stringify(resumeData));
//       console.log("💾 Resume data saved to localStorage");
//     }
//   }, [resumeData]);

//   // ✅ Template persistence
//   useEffect(() => {
//     if (selectedTemplate !== null) {
//       localStorage.setItem("selected_template", String(selectedTemplate));
//       console.log("💾 Template saved to localStorage:", selectedTemplate);
//     }
//   }, [selectedTemplate]);

//   const setSelectedTemplate = (id: string | number | null) => {
//     setSelectedTemplateState(id);
//     if (id !== null) {
//       localStorage.setItem("selected_template", String(id));
//       console.log("💾 Template saved to localStorage:", id);
//     } else {
//       localStorage.removeItem("selected_template");
//     }
//   };

//   // ✅ UPDATED: Load resume from backend (priority over localStorage)
//   useEffect(() => {
//     const loadResumeData = async () => {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//         console.log("ℹ️ No resume ID - using localStorage or empty resume");
//         setIsLoadingResume(false);
//         return;
//       }

//       try {
//         setIsLoadingResume(true);
//         console.log("📥 Loading resume data for ID:", resumeId);
        
//         const data = await getResumeById(resumeId);
        
//         console.log("✅ Resume data loaded from backend:", data);
        
//         // ✅ NEW: Merge backend data with localStorage, backend takes priority
//         const loadedData: ResumeData = {
//           resume_id: data.id,
//           personalInfo: {
//             fullName: data.personalInfo?.fullName || "",
//             email: data.personalInfo?.email || "",
//             phone: data.personalInfo?.phone || "",
//             location: data.personalInfo?.location || "",
//             linkedinUrl: data.personalInfo?.linkedinUrl || "",
//             portifolioUrl: data.personalInfo?.portifolioUrl || "",
//           },
//           professionalSummary: data.professionalSummary || "",
//           education: data.education || [],
//           workExperience: data.workExperience || [],
//           projects: data.projects || [],
//           skills: data.skills || [],
//           // ✅ Load categorizedSkills from backend
//           categorizedSkills: data.categorizedSkills || {
//             programming_languages: [],
//             frameworks: [],
//             databases: [],
//             tools: [],
//             cloud_platforms: [],
//             soft_skills: []
//           },
//           certifications: (data.certifications || []).map((cert: any) => ({
//             name: cert.name || "",
//             issuedBy: cert.issuedBy || cert.issued_by || "",
//             year: cert.year || "",
//             expiryDate: cert.expiryDate || cert.expiry_date || "",
//             credentialId: cert.credentialId || cert.credential_id || "",
//           })),
//           achievements: data.achievements || [],
//           volunteering: data.volunteering || [],
//           references: data.references || [],
//           internships: data.internships || [],
//           awards: data.awards || [],
//           hobbies: data.hobbies || [],
//           interests: data.interests || [],
//           languages: data.languages || [],
//           publications: data.publications || [],
//         };
        
//         setResumeData(loadedData);
//         console.log("✅ Resume context populated with backend data");
        
//         toast.success("Resume loaded successfully!");
        
//       } catch (error) {
//         console.error("❌ Failed to load resume:", error);
//         toast.error("Failed to load resume data");
//       } finally {
//         setIsLoadingResume(false);
//       }
//     };

//     loadResumeData();
//   }, []); // Only run once on mount

//   useEffect(() => {
//     setLastUpdated(new Date());
//   }, [resumeData]);

//   const getCompletionPercentage = (): number => {
//     const totalSections = Object.keys(completionStatus).length;
//     const completedSections = Object.values(completionStatus).filter(Boolean).length;
//     return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
//   };

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
//         sectionOrder,
//         setSectionOrder,
//         completionStatus,
//         setCompletionStatus,
//         getCompletionPercentage,
//         isLoadingResume,
//       }}
//     >
//       {children}
//     </ResumeContext.Provider>
//   );
// };

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTemplate, setSelectedTemplateState] = useState<string | number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("selected_template");
      return saved || "2"; // Default to template 2
    }
    return "2"; // Default to template 2
  });

  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('resumeData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log("✅ Successfully loaded resume data from localStorage:", {
            timestamp: new Date().toISOString(),
            dataKeys: Object.keys(parsed),
            skillsCount: parsed.skills?.length || 0,
            categorizedSkills: parsed.categorizedSkills
          });
          return parsed;
        } catch (error) {
          console.error("❌ Failed to parse localStorage data:", error);
        }
      } else {
        console.log("ℹ️ No saved resume data in localStorage, using default empty state");
      }
    }

    return {
      personalInfo: { 
        fullname: "", 
        email: "", 
        phone: "", 
        location: "", 
        linkedinUrl: "", 
        portifolioUrl: "" 
      },
      professionalSummary: "",
      education: [],
      workExperience: [],
      projects: [],
      skills: [],
      categorizedSkills: {
        programming_languages: [],
        frameworks: [],
        databases: [],
        tools: [],
        cloud_platforms: [],
        soft_skills: []
      },
      certifications: [],
      achievements: [],
      volunteering: [],
      references: [],
      internships: [],
      awards: [],
      hobbies: [],
      interests: [],
      languages: [],
      publications: [],
    };
  });

  const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
    fontFamily: "arial",
    nameFontSize: "20px",
    headingFontSize: "14px",
    bodyFontSize: "10px",
    bold: false,
    italic: false,
    lineSpacing: "1.0",
    headingColor: "#1A1A1A",
    bodyColor: "#4b5563",
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(true);
  
  // ✅ NEW: Track if initial load is complete
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({
    "Personal Info": false,
    "Professional Summary": false,
    "Skills": false,
    "Education": false,
    "Work Experience": false,
    "Projects": false,
    "Certifications": false,
    "Achievements": false,
    "Volunteering": false,
    "Internships": false,
    "Awards": false,
    "Hobbies": false,
    "Interests": false,
    "Languages": false,
    "Publications": false,
    "References": false,
  });

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
    "Hobbies",
    "Interests",
    "Languages",
    "Publications",
    "References",
  ]);

  // ✅ FIXED: Only save to localStorage AFTER initial load is complete
  useEffect(() => {
    if (typeof window !== 'undefined' && hasLoadedInitialData && resumeData) {
      try {
        localStorage.setItem('resumeData', JSON.stringify(resumeData));
        console.log("💾 Resume data saved to localStorage", {
          timestamp: new Date().toISOString(),
          dataKeys: Object.keys(resumeData),
          skillsCount: resumeData.skills?.length || 0,
          categorizedSkills: resumeData.categorizedSkills
        });
      } catch (error) {
        console.error("❌ Failed to save resume data to localStorage:", error);
      }
    }
  }, [resumeData, hasLoadedInitialData]);

  // ✅ NEW: Save data before page unload (backup save)
  useEffect(() => {
    if (typeof window !== 'undefined' && hasLoadedInitialData) {
      const handleBeforeUnload = () => {
        try {
          localStorage.setItem('resumeData', JSON.stringify(resumeData));
          console.log("💾 Resume data backup saved before unload");
        } catch (error) {
          console.error("❌ Failed to backup save resume data:", error);
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [resumeData, hasLoadedInitialData]);

  // Template persistence
  useEffect(() => {
    if (selectedTemplate !== null) {
      localStorage.setItem("selected_template", String(selectedTemplate));
      console.log("💾 Template saved to localStorage:", selectedTemplate);
    }
  }, [selectedTemplate]);

  const setSelectedTemplate = async (id: string | number | null) => {
    setSelectedTemplateState(id);
    if (id !== null) {
      localStorage.setItem("selected_template", String(id));
      console.log("💾 Template saved to localStorage:", id);

      // ✅ Set as default template on backend
      try {
        const { setDefaultTemplate } = await import("@/api/resumeApi");
        await setDefaultTemplate(id);
        console.log("✅ Template set as default on backend:", id);
      } catch (error) {
        console.error("⚠️ Failed to set default template on backend:", error);
      }
    } else {
      localStorage.removeItem("selected_template");
    }
  };

  // ✅ Set template 2 as default on provider initialization
  useEffect(() => {
    const initializeDefaultTemplate = async () => {
      try {
        const savedTemplate = localStorage.getItem("selected_template");

        if (savedTemplate) {
          // User has a saved template preference, use that
          console.log("📌 Using saved template preference:", savedTemplate);
          return;
        }

        // No saved preference, fetch default template from backend
        const { getDefaultTemplate } = await import("@/api/resumeApi");
        try {
          const defaultTemplateData = await getDefaultTemplate();
          const defaultTemplateId = String((defaultTemplateData as unknown as Record<string, unknown>)?.template_id || (defaultTemplateData as unknown as Record<string, unknown>)?.id || "2");

          console.log("🎨 Fetched default template from backend:", defaultTemplateId);
          await setSelectedTemplate(defaultTemplateId);
        } catch (fetchError) {
          // If fetching fails, fall back to template 2
          console.warn("⚠️ Failed to fetch default template, using template 2 as fallback:", fetchError);
          await setSelectedTemplate("2");
        }
      } catch (error) {
        console.error("⚠️ Failed to initialize default template:", error);
      }
    };

    initializeDefaultTemplate();
  }, []); // Empty dependency array - runs once on mount

  // ✅ Load resume from backend (runs once on mount)
  useEffect(() => {
    const loadResumeData = async () => {
      const resumeId = localStorage.getItem("current_resume_id");
      
      if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
        console.log("ℹ️ No resume ID found in localStorage - using local data or empty resume", {
          timestamp: new Date().toISOString()
        });
        setIsLoadingResume(false);

        // ✅ Mark as loaded immediately to enable localStorage persistence
        setHasLoadedInitialData(true);
        console.log("✅ hasLoadedInitialData set to true - localStorage saving is now ACTIVE");
        return;
      }

      try {
        setIsLoadingResume(true);
        console.log("📥 Loading resume data for ID:", resumeId);
        
        const data = await getResumeById(resumeId);
        
        console.log("✅ Resume data loaded from backend:", data);
        
        const loadedData: ResumeData = {
          resume_id: data.id,
          personalInfo: {
            fullname: data.personalInfo?.fullname || "",
            email: data.personalInfo?.email || "",
            phone: data.personalInfo?.phone || "",
            location: data.personalInfo?.location || "",
            linkedinUrl: data.personalInfo?.linkedinUrl || "",
            portifolioUrl: data.personalInfo?.portifolioUrl || "",
          },
          professionalSummary: data.professionalSummary || "",
          education: data.education || [],
          workExperience: data.workExperience || [],
          projects: data.projects || [],
          skills: data.skills || [],
          categorizedSkills: data.categorizedSkills || {
            programming_languages: [],
            frameworks: [],
            databases: [],
            tools: [],
            cloud_platforms: [],
            soft_skills: []
          },
          certifications: (data.certifications || []).map((cert: any) => ({
            name: cert.name || "",
            issuedBy: cert.issuedBy || cert.issued_by || "",
            year: cert.year || "",
            expiryDate: cert.expiryDate || cert.expiry_date || "",
            credentialId: cert.credentialId || cert.credential_id || "",
          })),
          achievements: data.achievements || [],
          volunteering: data.volunteering || [],
          references: data.references || [],
          internships: data.internships || [],
          awards: data.awards || [],
          hobbies: data.hobbies || [],
          interests: data.interests || [],
          languages: data.languages || [],
          publications: data.publications || [],
        };
        
        // setResumeData(loadedData);
        // setResumeData(prev => ({ ...prev, ...loadedData }));
        // setResumeData(prev => ({ ...prev,  ...loadedData,  personalInfo: {  ...prev.personalInfo,  ...loadedData.personalInfo,},}));
        setResumeData(prev => ({
  ...prev,
  ...loadedData,
  personalInfo: {
    ...prev.personalInfo,

    fullname:
      loadedData.personalInfo.fullname?.trim()
        ? loadedData.personalInfo.fullname
        : prev.personalInfo.fullname,

    email:
      loadedData.personalInfo.email?.trim()
        ? loadedData.personalInfo.email
        : prev.personalInfo.email,

    phone:
      loadedData.personalInfo.phone?.trim()
        ? loadedData.personalInfo.phone
        : prev.personalInfo.phone,

    location:
      loadedData.personalInfo.location?.trim()
        ? loadedData.personalInfo.location
        : prev.personalInfo.location,

    linkedinUrl:
      loadedData.personalInfo.linkedinUrl?.trim()
        ? loadedData.personalInfo.linkedinUrl
        : prev.personalInfo.linkedinUrl,

    portifolioUrl:
      loadedData.personalInfo.portifolioUrl?.trim()
        ? loadedData.personalInfo.portifolioUrl
        : prev.personalInfo.portifolioUrl,
  },
}));


        console.log("✅ Resume context populated with backend data");
        
        toast.success("Resume loaded successfully!");
        
      } catch (error) {
        console.error("❌ Failed to load resume:", error);
        toast.error("Failed to load resume data");
      } finally {
        setIsLoadingResume(false);
        setHasLoadedInitialData(true); // ✅ Mark as loaded after backend attempt
        console.log("✅ hasLoadedInitialData set to true - localStorage saving is now ACTIVE", {
          timestamp: new Date().toISOString()
        });
      }
    };

    loadResumeData();
  }, []); // Only run once on mount

  useEffect(() => {
    setLastUpdated(new Date());
  }, [resumeData]);

  const getCompletionPercentage = (): number => {
    const totalSections = Object.keys(completionStatus).length;
    const completedSections = Object.values(completionStatus).filter(Boolean).length;
    return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  };

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
        completionStatus,
        setCompletionStatus,
        getCompletionPercentage,
        isLoadingResume,
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




// "use client";
// import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
// import { getResumeById } from "@/api/resumeApi";
// import { toast } from "sonner";

// export interface CustomField {
//   id: string;
//   fieldName: string;
//   fieldType: "text" | "textarea" | "date" | "list" | "url";
//   value: string | string[];
// }

// export interface CustomSection {
//   id: string;
//   sectionName: string;
//   fields: CustomField[];
// }


// export interface ResumeData {
//   resume_id?: string;
//   personalInfo: { fullName: string; email: string; phone: string; location: string; linkedinUrl: string; portifolioUrl:string;};
//   professionalSummary: string;
//   education: { school: string; degree: string; startDate: string; endDate: string; }[];
//   workExperience: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; location:string; }[];
//   projects: { title: string; description: string; technologies: string[]; startDate: string; endDate: string; link: string; }[];
//   skills: string[];
//   certifications: { name: string; issuedBy: string; year: string; }[];
//   achievements: { title: string; date: string; description: string; }[];
//   volunteering: { organization: string; role: string; startDate: string; endDate: string; }[];
//   references: { name: string; relation: string; contact: string; }[];
//   internships: { company: string; role: string; startDate: string; endDate: string; currentlyWorking: boolean; description: string; location:string; }[];
//   awards: { title: string; issuedBy: string; year: string; }[];
//   hobbies: { name: string; description: string; proficiencyLevel?: string; achievement?: string; }[];
//   interests: { name: string; description: string; category?: string;  }[];
//   languages: { language: string; proficiency: string; }[];
//   publications: { title: string; authors: string; publicationName: string; date: string; url: string; }[];
//   customSections: CustomSection[];  // <-- NEW
// }

// export interface ResumeStyle {
//   fontFamily: string;
//   nameFontSize: string;
//   headingFontSize: string;
//   bodyFontSize: string;
//   bold: boolean;
//   italic: boolean;
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
//   sectionOrder: string[];
//   setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
//   createResume: () => Promise<void>;
//   completionStatus: Record<string, boolean>;
//   setCompletionStatus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
//   getCompletionPercentage: () => number;
//   isLoadingResume: boolean;

//   // Custom section methods
//   addCustomSection: (sectionName: string) => void;
//   removeCustomSection: (sectionId: string) => void;
//   addCustomField: (sectionId: string, fieldName: string, fieldType: CustomField["fieldType"]) => void;
//   updateCustomFieldValue: (sectionId: string, fieldId: string, value: string | string[]) => void;
//   deleteCustomField: (sectionId: string, fieldId: string) => void;
// }


// const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// export const ResumeProvider = ({ children }: { children: ReactNode }) => {
//   const [resumeData, setResumeData] = useState<ResumeData>({
//     personalInfo: { fullName: "", email: "", phone: "", location: "", linkedinUrl: "", portifolioUrl: "" },
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
//     hobbies:[],
//     interests:[],
//     languages:[],
//     publications:[],
//     customSections: [],  // Initialize empty array
//   });

//   const [selectedTemplate, setSelectedTemplate] = useState<number | null>(() => {
//     if (typeof window !== 'undefined') {
//       const saved = localStorage.getItem("selected_template");
//       return saved ? parseInt(saved, 10) : null;
//     }
//     return null;
//   });

//   const [resumeStyle, setResumeStyle] = useState<ResumeStyle>({
//     fontFamily: "arial",
//     nameFontSize: "24px",
//     headingFontSize: "14px",
//     bodyFontSize: "12px",
//     bold: false,
//     italic: false,
//     lineSpacing: "1.0",
//     headingColor: "#000000",
//     bodyColor: "#4b5563",
//   });


//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [resumeId, setResumeId] = useState<string | null>(null);
//   const [isLoadingResume, setIsLoadingResume] = useState(true);

//   const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({
//     "Personal Info": false,
//     "Professional Summary": false,
//     "Skills": false,
//     "Education": false,
//     "Work Experience": false,
//     "Projects": false,
//     "Certifications": false,
//     "Achievements": false,
//     "Volunteering": false,
//     "Internships": false,
//     "Awards": false,
//     "Hobbies": false,
//     "Interests": false,
//     "Languages": false,
//     "Publications": false,
//     "References": false,
//   });

//   // Include customSections in completion status and sectionOrder for reordering if needed
//   const [sectionOrder, setSectionOrder] = useState<string[]>([
//     "Personal Info",
//     "Professional Summary",
//     "Skills",
//     "Education",
//     "Work Experience",
//     "Projects",
//     "Certifications",
//     "Achievements",
//     "Volunteering",
//     "Internships",
//     "Awards",
//     "Hobbies",
//     "Interests",
//     "Languages",
//     "Publications",
//     "References",
//     // custom sections handled dynamically
//   ]);


//   useEffect(() => {
//     if (selectedTemplate !== null) {
//       localStorage.setItem("selected_template", String(selectedTemplate));
//     }
//   }, [selectedTemplate]);


//   // useEffect(() => {
//   //   const loadResumeData = async () => {
//   //     const resumeId = localStorage.getItem("current_resume_id");
      
//   //     if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//   //       setIsLoadingResume(false);
//   //       return;
//   //     }

//   //     try {
//   //       setIsLoadingResume(true);
//   //       const data = await getResumeById(resumeId);
//   //       setResumeData({
//   //         resume_id: data.id,
//   //         personalInfo: {
//   //           fullName: data.personalInfo?.fullName || "",
//   //           email: data.personalInfo?.email || "",
//   //           phone: data.personalInfo?.phone || "",
//   //           location: data.personalInfo?.location || "",
//   //           linkedinUrl: data.personalInfo?.linkedinUrl || "",
//   //           portifolioUrl: data.personalInfo?.portifolioUrl || "",
//   //         },
//   //         professionalSummary: data.professionalSummary || "",
//   //         education: data.education || [],
//   //         workExperience: data.workExperience || [],
//   //         projects: data.projects || [],
//   //         skills: data.skills || [],
//   //         certifications: data.certifications || [],
//   //         achievements: data.achievements || [],
//   //         volunteering: data.volunteering || [],
//   //         references: data.references || [],
//   //         internships: data.internships || [],
//   //         awards: data.awards || [],
//   //         hobbies: data.hobbies || [],
//   //         interests: data.interests || [],
//   //         languages: data.languages || [],
//   //         publications: data.publications || [],
//   //         customSections: data.customSections || [],    // <-- Load custom sections
//   //       });

//   //       // Update completion status for custom sections
//   //       if (data.customSections) {
//   //         const newCompletion = {...completionStatus};
//   //         data.customSections.forEach((section: CustomSection) => {
//   //           newCompletion[section.id] = section.fields.length > 0;
//   //         });
//   //         setCompletionStatus(newCompletion);

//   //         // Add to section order if needed
//   //         setSectionOrder(prev => {
//   //           const customIds = data.customSections.map((cs: CustomSection) => cs.id);
//   //           return [...prev, ...customIds];
//   //         });
//   //       }

//   //       toast.success("Resume loaded successfully!");
//   //     } catch (error) {
//   //       toast.error("Failed to load resume data");
//   //     } finally {
//   //       setIsLoadingResume(false);
//   //     }
//   //   };

//   //   loadResumeData();
//   // }, []);
//   useEffect(() => {
//   const loadResumeData = async () => {
//     const resumeId = localStorage.getItem("current_resume_id");

//     if (!resumeId || resumeId === "null" || resumeId === "undefined") {
//       setIsLoadingResume(false);
//       return;
//     }

//     try {
//       setIsLoadingResume(true);
//       const data = await getResumeById(resumeId);

//       // Use default empty array if customSections undefined
//       const customSections = data.customSections || [];

//       setResumeData({
//         resume_id: data.id,
//         personalInfo: {
//           fullName: data.personalInfo?.fullName || "",
//           email: data.personalInfo?.email || "",
//           phone: data.personalInfo?.phone || "",
//           location: data.personalInfo?.location || "",
//           linkedinUrl: data.personalInfo?.linkedinUrl || "",
//           portifolioUrl: data.personalInfo?.portifolioUrl || "",
//         },
//         professionalSummary: data.professionalSummary || "",
//         education: data.education || [],
//         workExperience: data.workExperience || [],
//         projects: data.projects || [],
//         skills: data.skills || [],
//         certifications: data.certifications || [],
//         achievements: data.achievements || [],
//         volunteering: data.volunteering || [],
//         references: data.references || [],
//         internships: data.internships || [],
//         awards: data.awards || [],
//         hobbies: data.hobbies || [],
//         interests: data.interests || [],
//         languages: data.languages || [],
//         publications: data.publications || [],
//         customSections: customSections,
//       });

//       // Avoid stale closure — build new completion status here
//       const newCompletion = { ...completionStatus };
//       customSections.forEach((section: CustomSection) => {
//         newCompletion[section.id] = section.fields.length > 0;
//       });
//       setCompletionStatus(newCompletion);

//       // Add to section order if needed
//       setSectionOrder((prev) => {
//         const customIds = customSections.map((cs: CustomSection) => cs.id);
//         // Avoid duplicates with Set
//         return [...new Set([...prev, ...customIds])];
//       });

//       toast.success("Resume loaded successfully!");
//     } catch {
//       toast.error("Failed to load resume data");
//     } finally {
//       setIsLoadingResume(false);
//     }
//   };

//   loadResumeData();
// }, []); // No completionStatus here due to newCompletion usage inside




//   useEffect(() => {
//     setLastUpdated(new Date());
//   }, [resumeData]);


//   const getCompletionPercentage = (): number => {
//     const totalSections = Object.keys(completionStatus).length;
//     const completedSections = Object.values(completionStatus).filter(Boolean).length;
//     return totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
//   };


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


//   // Custom Sections Management

//   const addCustomSection = (sectionName: string) => {
//     if (!sectionName.trim()) {
//       toast.error("Section name cannot be empty.");
//       return;
//     }

//     // Prevent duplicate section names
//     if (resumeData.customSections.find((s) => s.sectionName.toLowerCase() === sectionName.toLowerCase())) {
//       toast.error("Section with this name already exists.");
//       return;
//     }

//     const newSection: CustomSection = {
//       id: `custom_${Date.now()}`,
//       sectionName,
//       fields: [],
//     };

//     setResumeData((prev) => ({
//       ...prev,
//       customSections: [...prev.customSections, newSection],
//     }));

//     setCompletionStatus((prev) => ({
//       ...prev,
//       [newSection.id]: false,
//     }));

//     setSectionOrder((prev) => [...prev, newSection.id]);
//     toast.success(`Custom section "${sectionName}" added.`);
//   };


//   const removeCustomSection = (sectionId: string) => {
//     setResumeData((prev) => ({
//       ...prev,
//       customSections: prev.customSections.filter((s) => s.id !== sectionId),
//     }));
//     setCompletionStatus((prev) => {
//       const newStatus = { ...prev };
//       delete newStatus[sectionId];
//       return newStatus;
//     });
//     setSectionOrder((prev) => prev.filter((id) => id !== sectionId));
//     toast.success("Custom section deleted.");
//   };


//   const addCustomField = (sectionId: string, fieldName: string, fieldType: CustomField["fieldType"]) => {
//     const newField: CustomField = {
//       id: `field_${Date.now()}`,
//       fieldName,
//       fieldType,
//       value: fieldType === "list" ? [] : "",
//     };

//     setResumeData((prev) => ({
//       ...prev,
//       customSections: prev.customSections.map((section) =>
//         section.id === sectionId ? { ...section, fields: [...section.fields, newField] } : section
//       ),
//     }));
//   };


//   const updateCustomFieldValue = (sectionId: string, fieldId: string, value: string | string[]) => {
//     setResumeData((prev) => ({
//       ...prev,
//       customSections: prev.customSections.map((section) =>
//         section.id === sectionId
//           ? {
//               ...section,
//               fields: section.fields.map((field) =>
//                 field.id === fieldId
//                   ? {
//                       ...field,
//                       value,
//                     }
//                   : field
//               ),
//             }
//           : section
//       ),
//     }));
//   };


//   const deleteCustomField = (sectionId: string, fieldId: string) => {
//     setResumeData((prev) => ({
//       ...prev,
//       customSections: prev.customSections.map((section) =>
//         section.id === sectionId
//           ? {
//               ...section,
//               fields: section.fields.filter((field) => field.id !== fieldId),
//             }
//           : section
//       ),
//     }));
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
//         sectionOrder,
//         setSectionOrder,
//         completionStatus,
//         setCompletionStatus,
//         getCompletionPercentage,
//         isLoadingResume,
//         addCustomSection,
//         removeCustomSection,
//         addCustomField,
//         updateCustomFieldValue,
//         deleteCustomField,
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


