// "use client";
// import React from "react";
// import { useResume } from "../../_context/ResumeContext";
// import { useATSScore } from "../../_hooks/useATSScore";
// import ProgressBar from "./ProgressBar";
// import MultiColorCircularScore from "./MultiColorCircularScore";

// export default function ATSScorePanel() {
//   const { resumeData } = useResume();
//   const { score, details } = useATSScore(resumeData);

//   return (
//     <div className="p-6 bg-white border rounded-2xl shadow-md">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

//       <div className="flex flex-col items-center justify-center">
//         <MultiColorCircularScore value={score} />
//         <p className="mt-2 text-sm text-gray-600">Overall Score</p>
//       </div>

//       <div className="mt-6 space-y-3 w-full">
//         <ProgressBar value={details?.keywords_score ?? 0} label="Keywords" />
//         {/* <ProgressBar value={details?.formatting_score ?? 0} label="Formatting" /> */}
//         <ProgressBar value={details?.grammar_score ?? 0} label="Grammar" />
//         <ProgressBar value={details?.skills_match ?? 0} label="Skills Match" />
//       </div>

//       <div className="mt-6 w-full">
//         <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>
//         <ul className="list-disc ml-5 text-sm text-gray-600">
//           {details?.improvement_suggestions?.map((s, i) => (
//             <li key={i}>{s}</li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// }




// "use client";
// import React, { useEffect, useState } from "react";
// import { getResumeScore, ResumeScoreResponse } from "@/api/resumeApi";
// import ProgressBar from "./ProgressBar";
// import MultiColorCircularScore from "./MultiColorCircularScore";
// import { toast } from "sonner";

// export default function ATSScorePanel() {
//   const [scoreData, setScoreData] = useState<ResumeScoreResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchScore = async () => {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         console.warn("⚠️ No resume ID found");
//         setError("No resume found. Please create a resume first.");
//         setIsLoading(false);
//         return;
//       }

//       try {
//         setIsLoading(true);
//         setError(null);
//         console.log("📊 Fetching ATS score...");
        
//         const data = await getResumeScore(resumeId);
//         setScoreData(data);
//         console.log("✅ Score loaded successfully");
        
//       } catch (err) {
//         console.error("❌ Error fetching score:", err);
//         const errorMessage = err instanceof Error ? err.message : "Failed to fetch score";
//         setError(errorMessage);
//         toast.error(errorMessage);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchScore();
//   }, []); // Fetch on component mount

//   // Show loading state
//   if (isLoading) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//           <p className="mt-4 text-sm text-gray-600">Loading score...</p>
//         </div>
//       </div>
//     );
//   }

//   // Show error state
//   if (error || !scoreData) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="text-red-500 text-4xl mb-2">⚠️</div>
//           <p className="text-sm text-gray-600 text-center">
//             {error || "Unable to load score"}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 bg-white border rounded-2xl shadow-md">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

//       <div className="flex flex-col items-center justify-center">
//         <MultiColorCircularScore value={scoreData.overall_score} />
//         <p className="mt-2 text-sm text-gray-600">Overall Score</p>
//       </div>

//       <div className="mt-6 space-y-3 w-full">
//         <ProgressBar 
//           value={scoreData.details.keywords_score} 
//           label="Keywords" 
//         />
//         <ProgressBar 
//           value={scoreData.details.grammar_score} 
//           label="Grammar" 
//         />
//         <ProgressBar 
//           value={scoreData.details.skills_match} 
//           label="Skills Match" 
//         />
//       </div>

//       <div className="mt-6 w-full">
//         <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>
//         {scoreData.details.improvement_suggestions.length > 0 ? (
//           <ul className="list-disc ml-5 text-sm text-gray-600">
//             {scoreData.details.improvement_suggestions.map((suggestion, index) => (
//               <li key={index}>{suggestion}</li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-sm text-gray-500 italic">No suggestions available</p>
//         )}
//       </div>
//     </div>
//   );
// }



// "use client";
// import React, { useEffect, useState } from "react";
// import { getResumeScore, ResumeScoreResponse } from "@/api/resumeApi";
// import ProgressBar from "./ProgressBar";
// import MultiColorCircularScore from "./MultiColorCircularScore";
// import { toast } from "sonner";
// import { useScore } from "../../_context/ScoreContext";

// export default function ATSScorePanel() {
//   const [scoreData, setScoreData] = useState<ResumeScoreResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const { setOverallScore } = useScore();
//   const suggestions = scoreData?.details?.improvement_suggestions ?? [];


//   useEffect(() => {
//     const fetchScore = async () => {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         console.warn("⚠️ No resume ID found");
//         setError("No resume found. Please create a resume first.");
//         setIsLoading(false);
//         return;
//       }

//       try {
//         setIsLoading(true);
//         setError(null);
//         console.log("📊 Fetching ATS score...");
        
//         const data = await getResumeScore(resumeId);
//         setScoreData(data);
        
//         // Update global score context
//         setOverallScore(data.overall_score);
        
//         console.log("✅ Score loaded successfully:", data.overall_score);
        
//       } catch (err) {
//         console.error("❌ Error fetching score:", err);
//         const errorMessage = err instanceof Error ? err.message : "Failed to fetch score";
//         setError(errorMessage);
//         toast.error(errorMessage);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchScore();
//   }, []); // Fetch on component mount

//   // Show loading state
//   if (isLoading) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//           <p className="mt-4 text-sm text-gray-600">Loading score...</p>
//         </div>
//       </div>
//     );
//   }

//   // Show error state
//   if (error || !scoreData) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="text-red-500 text-4xl mb-2">⚠️</div>
//           <p className="text-sm text-gray-600 text-center">
//             {error || "Unable to load score"}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow-md">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

//       <div className="flex flex-col items-center justify-center">
//         <MultiColorCircularScore value={scoreData.overall_score} />
//         <p className="mt-2 text-sm text-gray-600">Overall Score</p>
//       </div>

//       <div className="mt-6 space-y-3 w-full">
//         {/* <ProgressBar 
//           value={scoreData.details.keywords_score} 
//           label="Keywords" 
//         /> */}
//         <ProgressBar 
//   value={scoreData?.details?.keywords_score ?? 0} 
//   label="Keywords" 
// />      
//         <ProgressBar 
//   value={scoreData?.details?.keywords_score ?? 0} 
//   label="Grammar" 
// />
//           <ProgressBar 
//   value={scoreData?.details?.keywords_score ?? 0} 
//   label="Skills Match" 
// />


//         {/* <ProgressBar 
//           value={scoreData.details.grammar_score} 
//           label="Grammar" 
//         />
//         <ProgressBar 
//           value={scoreData.details.skills_match} 
//           label="Skills Match" 
//         /> */}
//       </div>

//       <div className="mt-6 w-full">
//   <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>

//   {suggestions.length > 0 ? (
//     <ul className="list-disc ml-5 text-sm text-gray-600">
//       {suggestions.map((s, i) => (
//         <li key={i}>{s}</li>
//       ))}
//     </ul>
//   ) : (
//     <p className="text-gray-500 text-sm">No suggestions available.</p>
//   )}
// </div>

//     </div>
//   );
// }


// "use client";
// import React, { useEffect, useState } from "react";
// import { getResumeScore, ResumeScoreResponse } from "@/api/resumeApi";
// import ProgressBar from "./ProgressBar";
// import MultiColorCircularScore from "./MultiColorCircularScore";
// import { toast } from "sonner";
// import { useScore } from "../../_context/ScoreContext";

// export default function ATSScorePanel() {
//   const [scoreData, setScoreData] = useState<ResumeScoreResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const { setOverallScore } = useScore();

//   useEffect(() => {
//     const fetchScore = async () => {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         console.warn("⚠️ No resume ID found");
//         setError("No resume found. Please create a resume first.");
//         setIsLoading(false);
//         return;
//       }

//       try {
//         setIsLoading(true);
//         setError(null);
//         console.log("📊 Fetching ATS score...");
        
//         // ✅ This now triggers calculation and polls automatically
//         const data = await getResumeScore(resumeId);
//         setScoreData(data);
        
//         // Update global score context
//         setOverallScore(data.overall_score);
        
//         console.log("✅ Score loaded successfully:", data.overall_score);
        
//       } catch (err) {
//         console.error("❌ Error fetching score:", err);
//         const errorMessage = err instanceof Error ? err.message : "Failed to fetch score";
//         setError(errorMessage);
//         toast.error(errorMessage);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchScore();
//   }, [setOverallScore]); // Fetch on component mount

//   // Show loading state
//   if (isLoading) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//           <p className="mt-4 text-sm text-gray-600">Calculating score...</p>
//           <p className="mt-2 text-xs text-gray-500">This may take up to 20 seconds</p>
//         </div>
//       </div>
//     );
//   }

//   // Show error state
//   if (error || !scoreData) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="text-red-500 text-4xl mb-2">⚠️</div>
//           <p className="text-sm text-gray-600 text-center">
//             {error || "Unable to load score"}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // ✅ Safely access details with fallbacks
//   const suggestions = scoreData?.details?.improvement_suggestions ?? [];

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow-md">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

//       <div className="flex flex-col items-center justify-center">
//         <MultiColorCircularScore value={scoreData.overall_score} />
//         <p className="mt-2 text-sm text-gray-600">Overall Score</p>
//       </div>

//       <div className="mt-6 space-y-3 w-full">
//         <ProgressBar 
//           value={scoreData?.details?.keywords_score ?? 0} 
//           label="Keywords" 
//         />      
//         <ProgressBar 
//           value={scoreData?.details?.grammar_score ?? 0} 
//           label="Grammar" 
//         />
//         <ProgressBar 
//           value={scoreData?.details?.skills_match ?? 0} 
//           label="Skills Match" 
//         />
//       </div>

//       <div className="mt-6 w-full">
//         <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>

//         {suggestions.length > 0 ? (
//           <ul className="list-disc ml-5 text-sm text-gray-600 mt-2">
//             {suggestions.map((s, i) => (
//               <li key={i}>{s}</li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-gray-500 text-sm mt-2">No suggestions available.</p>
//         )}
//       </div>
//     </div>
//   );
// } before loading score gone


// "use client";
// import React, { useEffect, useState } from "react";
// import { getResumeScore, ResumeScoreResponse } from "@/api/resumeApi";
// import ProgressBar from "./ProgressBar";
// import MultiColorCircularScore from "./MultiColorCircularScore";
// import { toast } from "sonner";
// import { useScore } from "../../_context/ScoreContext";

// export default function ATSScorePanel() {
//   const [scoreData, setScoreData] = useState<ResumeScoreResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const { setOverallScore, overallScore } = useScore();

//   useEffect(() => {
//     const fetchScore = async () => {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//         console.warn("⚠️ No resume ID found");
//         setError("No resume found. Please create a resume first.");
//         setIsLoading(false);
//         return;
//       }

//       try {
//         setIsLoading(true);
//         setError(null);
//         console.log("📊 Fetching ATS score for resume:", resumeId);
        
//         // ✅ Fetch score from backend
//         const data = await getResumeScore(resumeId);
//         setScoreData(data);
        
//         // ✅ Update global score context (automatically saves to localStorage)
//         setOverallScore(data.overall_score);
        
//         console.log("✅ Score loaded successfully:", data.overall_score);
        
//       } catch (err) {
//         console.error("❌ Error fetching score:", err);
//         const errorMessage = err instanceof Error ? err.message : "Failed to fetch score";
//         setError(errorMessage);
        
//         // ✅ Don't show error toast if we have cached score
//         if (overallScore === 0) {
//           toast.error(errorMessage);
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchScore();
//   }, [setOverallScore]); // Fetch on component mount

//   // ✅ Show cached score while loading
//   if (isLoading && overallScore > 0) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        
//         <div className="flex flex-col items-center justify-center">
//           <MultiColorCircularScore value={overallScore} />
//           <p className="mt-2 text-sm text-gray-600">Overall Score (Cached)</p>
//         </div>

//         <div className="mt-4 flex items-center justify-center">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
//           <p className="ml-2 text-xs text-gray-500">Refreshing...</p>
//         </div>
//       </div>
//     );
//   }

//   // Show loading state (first time)
//   if (isLoading) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//           <p className="mt-4 text-sm text-gray-600">Calculating score...</p>
//           <p className="mt-2 text-xs text-gray-500">This may take up to 20 seconds</p>
//         </div>
//       </div>
//     );
//   }

//   // Show error state (only if no cached score)
//   if (error && !scoreData && overallScore === 0) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="text-red-500 text-4xl mb-2">⚠️</div>
//           <p className="text-sm text-gray-600 text-center">
//             {error || "Unable to load score"}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // ✅ Safely access details with fallbacks
//   const suggestions = scoreData?.details?.improvement_suggestions ?? [];

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow-md">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

//       <div className="flex flex-col items-center justify-center">
//         <MultiColorCircularScore value={scoreData?.overall_score ?? overallScore} />
//         <p className="mt-2 text-sm text-gray-600">Overall Score</p>
//       </div>

//       <div className="mt-6 space-y-3 w-full">
//         <ProgressBar 
//           value={scoreData?.details?.keywords_score ?? 0} 
//           label="Keywords" 
//         />      
//         <ProgressBar 
//           value={scoreData?.details?.grammar_score ?? 0} 
//           label="Grammar" 
//         />
//         <ProgressBar 
//           value={scoreData?.details?.skills_match ?? 0} 
//           label="Skills Match" 
//         />
//       </div>

//       <div className="mt-6 w-full">
//         <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>

//         {suggestions.length > 0 ? (
//           <ul className="list-disc ml-5 text-sm text-gray-600 mt-2">
//             {suggestions.map((s, i) => (
//               <li key={i}>{s}</li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-gray-500 text-sm mt-2">No suggestions available.</p>
//         )}
//       </div>
//     </div>
//   );
// }
  // before autofetch score when data change




// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import { getResumeScore, ResumeScoreResponse } from "@/api/resumeApi";
// import ProgressBar from "./ProgressBar";
// import MultiColorCircularScore from "./MultiColorCircularScore";
// import { toast } from "sonner";
// import { useScore } from "../../_context/ScoreContext";
// import { useResume } from "../../_context/ResumeContext"; // ✅ Import ResumeContext

// export default function ATSScorePanel() {
//   const [scoreData, setScoreData] = useState<ResumeScoreResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const { setOverallScore, overallScore } = useScore();
//   const { resumeData } = useResume(); // ✅ Access resume data

//   // ✅ Debounce timer ref
//   const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
//   const previousDataRef = useRef<string>("");

//   // ✅ Main fetch function
//   const fetchScore = async () => {
//     const resumeId = localStorage.getItem("current_resume_id");
    
//     if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//       console.warn("⚠️ No resume ID found");
//       setError("No resume found. Please create a resume first.");
//       setIsLoading(false);
//       return;
//     }

//     try {
//       setIsLoading(true);
//       setError(null);
//       console.log("📊 Fetching ATS score for resume:", resumeId);
      
//       // ✅ Fetch score from backend
//       const data = await getResumeScore(resumeId);
//       setScoreData(data);
      
//       // ✅ Update global score context (automatically saves to localStorage)
//       setOverallScore(data.overall_score);
      
//       console.log("✅ Score loaded successfully:", data.overall_score);
      
//     } catch (err) {
//       console.error("❌ Error fetching score:", err);
//       const errorMessage = err instanceof Error ? err.message : "Failed to fetch score";
//       setError(errorMessage);
      
//       // ✅ Don't show error toast if we have cached score
//       if (overallScore === 0) {
//         toast.error(errorMessage);
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ✅ Fetch score on initial mount
//   useEffect(() => {
//     fetchScore();
//   }, []); // Only on mount

//   // ✅ Watch for resume data changes and trigger debounced score refresh
//   useEffect(() => {
//     // Convert resume data to string for comparison
//     const currentDataString = JSON.stringify({
//       personalInfo: resumeData.personalInfo,
//       professionalSummary: resumeData.professionalSummary,
//       education: resumeData.education,
//       workExperience: resumeData.workExperience,
//       projects: resumeData.projects,
//       skills: resumeData.skills,
//       certifications: resumeData.certifications,
//       achievements: resumeData.achievements,
//       volunteering: resumeData.volunteering,
//       internships: resumeData.internships,
//       awards: resumeData.awards,
//       hobbies: resumeData.hobbies,
//       interests: resumeData.interests,
//       languages: resumeData.languages,
//       publications: resumeData.publications,
//       references: resumeData.references,
//     });

//     // ✅ Skip on initial render (when previousDataRef is empty)
//     if (previousDataRef.current === "") {
//       previousDataRef.current = currentDataString;
//       return;
//     }

//     // ✅ Check if data actually changed
//     if (currentDataString !== previousDataRef.current) {
//       console.log("🔄 Resume data changed - scheduling score refresh...");
      
//       // ✅ Clear existing timer
//       if (debounceTimerRef.current) {
//         clearTimeout(debounceTimerRef.current);
//       }

//       // ✅ Set new timer (wait 3 seconds after last change)
//       debounceTimerRef.current = setTimeout(() => {
//         console.log("⏱️ Debounce complete - fetching new score...");
//         fetchScore();
//       }, 3000); // 3 second delay after last change

//       // ✅ Update previous data reference
//       previousDataRef.current = currentDataString;
//     }

//     // ✅ Cleanup function
//     return () => {
//       if (debounceTimerRef.current) {
//         clearTimeout(debounceTimerRef.current);
//       }
//     };
//   }, [resumeData]); // Watch all resume data changes

//   // ✅ Show cached score while loading
//   if (isLoading && overallScore > 0) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        
//         <div className="flex flex-col items-center justify-center">
//           <MultiColorCircularScore value={overallScore} />
//           <p className="mt-2 text-sm text-gray-600">Overall Score (Cached)</p>
//         </div>

//         <div className="mt-4 flex items-center justify-center">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
//           <p className="ml-2 text-xs text-gray-500">Refreshing...</p>
//         </div>
//       </div>
//     );
//   }

//   // Show loading state (first time)
//   if (isLoading) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//           <p className="mt-4 text-sm text-gray-600">Calculating score...</p>
//           <p className="mt-2 text-xs text-gray-500">This may take up to 20 seconds</p>
//         </div>
//       </div>
//     );
//   }

//   // Show error state (only if no cached score)
//   if (error && !scoreData && overallScore === 0) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="text-red-500 text-4xl mb-2">⚠️</div>
//           <p className="text-sm text-gray-600 text-center">
//             {error || "Unable to load score"}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // ✅ Safely access details with fallbacks
//   const suggestions = scoreData?.details?.improvement_suggestions ?? [];

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow-md">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

//       <div className="flex flex-col items-center justify-center">
//         <MultiColorCircularScore value={scoreData?.overall_score ?? overallScore} />
//         <p className="mt-2 text-sm text-gray-600">Overall Score</p>
//       </div>

//       <div className="mt-6 space-y-3 w-full">
//         <ProgressBar 
//           value={scoreData?.details?.keywords_score ?? 0} 
//           label="Keywords" 
//         />      
//         <ProgressBar 
//           value={scoreData?.details?.grammar_score ?? 0} 
//           label="Grammar" 
//         />
//         <ProgressBar 
//           value={scoreData?.details?.skills_match ?? 0} 
//           label="Skills Match" 
//         />
//       </div>

//       <div className="mt-6 w-full">
//         <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>

//         {suggestions.length > 0 ? (
//           <ul className="list-disc ml-5 text-sm text-gray-600 mt-2">
//             {suggestions.map((s, i) => (
//               <li key={i}>{s}</li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-gray-500 text-sm mt-2">No suggestions available.</p>
//         )}
//       </div>
//     </div>
//   );
// } 
// before reset score for new resume



// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import { getResumeScore, ResumeScoreResponse } from "@/api/resumeApi";
// import ProgressBar from "./ProgressBar";
// import MultiColorCircularScore from "./MultiColorCircularScore";
// import { toast } from "sonner";
// import { useScore } from "../../_context/ScoreContext";
// import { useResume } from "../../_context/ResumeContext";

// export default function ATSScorePanel() {
//   const [scoreData, setScoreData] = useState<ResumeScoreResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const { setOverallScore, overallScore, resetScore } = useScore();
//   const { resumeData } = useResume();

//   const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
//   const previousDataRef = useRef<string>("");
//   const previousResumeIdRef = useRef<string | null>(null);

//   const fetchScore = async () => {
//     const resumeId = localStorage.getItem("current_resume_id");
    
//     if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//       console.warn("⚠️ No resume ID found");
//       setError("No resume found. Please create a resume first.");
//       setIsLoading(false);
//       return;
//     }

//     // ✅ Check if resume ID changed (new resume created)
//     if (previousResumeIdRef.current !== null && previousResumeIdRef.current !== resumeId) {
//       console.log("🆕 New resume detected, resetting score to 0");
//       resetScore();
//       setScoreData(null);
//       previousDataRef.current = "";
//     }

//     previousResumeIdRef.current = resumeId;

//     try {
//       setIsLoading(true);
//       setError(null);
//       console.log("📊 Fetching ATS score for resume:", resumeId);
      
//       const data = await getResumeScore(resumeId);
//       setScoreData(data);
//       setOverallScore(data.overall_score);
      
//       console.log("✅ Score loaded successfully:", data.overall_score);
      
//     } catch (err) {
//       console.error("❌ Error fetching score:", err);
//       const errorMessage = err instanceof Error ? err.message : "Failed to fetch score";
//       setError(errorMessage);
      
//       if (overallScore === 0) {
//         toast.error(errorMessage);
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchScore();
//   }, []);

//   useEffect(() => {
//     const currentDataString = JSON.stringify({
//       personalInfo: resumeData.personalInfo,
//       professionalSummary: resumeData.professionalSummary,
//       education: resumeData.education,
//       workExperience: resumeData.workExperience,
//       projects: resumeData.projects,
//       skills: resumeData.skills,
//       certifications: resumeData.certifications,
//       achievements: resumeData.achievements,
//       volunteering: resumeData.volunteering,
//       internships: resumeData.internships,
//       awards: resumeData.awards,
//       hobbies: resumeData.hobbies,
//       interests: resumeData.interests,
//       languages: resumeData.languages,
//       publications: resumeData.publications,
//       references: resumeData.references,
//     });

//     if (previousDataRef.current === "") {
//       previousDataRef.current = currentDataString;
//       return;
//     }

//     if (currentDataString !== previousDataRef.current) {
//       console.log("🔄 Resume data changed - scheduling score refresh...");
      
//       if (debounceTimerRef.current) {
//         clearTimeout(debounceTimerRef.current);
//       }

//       debounceTimerRef.current = setTimeout(() => {
//         console.log("⏱️ Debounce complete - fetching new score...");
//         fetchScore();
//       }, 3000);

//       previousDataRef.current = currentDataString;
//     }

//     return () => {
//       if (debounceTimerRef.current) {
//         clearTimeout(debounceTimerRef.current);
//       }
//     };
//   }, [resumeData]);

//   if (isLoading && overallScore > 0) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        
//         <div className="flex flex-col items-center justify-center">
//           <MultiColorCircularScore value={overallScore} />
//           <p className="mt-2 text-sm text-gray-600">Overall Score (Cached)</p>
//         </div>

//         <div className="mt-4 flex items-center justify-center">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
//           <p className="ml-2 text-xs text-gray-500">Refreshing...</p>
//         </div>
//       </div>
//     );
//   }

//   if (isLoading) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//           <p className="mt-4 text-sm text-gray-600">Calculating score...</p>
//           <p className="mt-2 text-xs text-gray-500">This may take up to 20 seconds</p>
//         </div>
//       </div>
//     );
//   }

//   if (error && !scoreData && overallScore === 0) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="text-red-500 text-4xl mb-2">⚠️</div>
//           <p className="text-sm text-gray-600 text-center">
//             {error || "Unable to load score"}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const suggestions = scoreData?.details?.improvement_suggestions ?? [];

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow-md">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

//       <div className="flex flex-col items-center justify-center">
//         <MultiColorCircularScore value={scoreData?.overall_score ?? overallScore} />
//         <p className="mt-2 text-sm text-gray-600">Overall Score</p>
//       </div>

//       <div className="mt-6 space-y-3 w-full">
//         <ProgressBar 
//           value={scoreData?.details?.keywords_score ?? 0} 
//           label="Keywords" 
//         />      
//         <ProgressBar 
//           value={scoreData?.details?.grammar_score ?? 0} 
//           label="Grammar" 
//         />
//         <ProgressBar 
//           value={scoreData?.details?.skills_match ?? 0} 
//           label="Skills Match" 
//         />
//       </div>

//       <div className="mt-6 w-full">
//         <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>

//         {suggestions.length > 0 ? (
//           <ul className="list-disc ml-5 text-sm text-gray-600 mt-2">
//             {suggestions.map((s, i) => (
//               <li key={i}>{s}</li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-gray-500 text-sm mt-2">No suggestions available.</p>
//         )}
//       </div>
//     </div>
//   );
// }

// before score automatically



// "use client";
// import React, { useEffect, useState } from "react";
// import { getResumeScore, ResumeScoreResponse } from "@/api/resumeApi";
// import ProgressBar from "./ProgressBar";
// import MultiColorCircularScore from "./MultiColorCircularScore";
// import { toast } from "sonner";
// import { useScore } from "../../_context/ScoreContext";

// export default function ATSScorePanel() {
//   const [scoreData, setScoreData] = useState<ResumeScoreResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const { overallScore } = useScore(); // ✅ Just read the score, don't calculate

//   // ✅ Fetch detailed score data when panel is opened
//   useEffect(() => {
//     const fetchDetailedScore = async () => {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//         console.warn("⚠️ No resume ID found");
//         setError("No resume found. Please create a resume first.");
//         setIsLoading(false);
//         return;
//       }

//       try {
//         setIsLoading(true);
//         setError(null);
//         console.log("📊 [Panel] Fetching detailed score data");
        
//         const data = await getResumeScore(resumeId);
//         setScoreData(data);
        
//         console.log("✅ [Panel] Detailed score data loaded");
        
//       } catch (err) {
//         console.error("❌ [Panel] Error fetching detailed score:", err);
//         const errorMessage = err instanceof Error ? err.message : "Failed to fetch score details";
//         setError(errorMessage);
//         toast.error(errorMessage);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchDetailedScore();
//   }, []); // Fetch once when panel opens

//   // ✅ Show cached overall score while loading details
//   if (isLoading && overallScore > 0) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        
//         <div className="flex flex-col items-center justify-center">
//           <MultiColorCircularScore value={overallScore} />
//           <p className="mt-2 text-sm text-gray-600">Overall Score</p>
//         </div>

//         <div className="mt-4 flex items-center justify-center">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
//           <p className="ml-2 text-xs text-gray-500">Loading details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (isLoading) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//           <p className="mt-4 text-sm text-gray-600">Loading score details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error && !scoreData && overallScore === 0) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="text-red-500 text-4xl mb-2">⚠️</div>
//           <p className="text-sm text-gray-600 text-center">
//             {error || "Unable to load score"}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const suggestions = scoreData?.details?.improvement_suggestions ?? [];

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow-md">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

//       <div className="flex flex-col items-center justify-center">
//         <MultiColorCircularScore value={scoreData?.overall_score ?? overallScore} />
//         <p className="mt-2 text-sm text-gray-600">Overall Score</p>
//       </div>

//       <div className="mt-6 space-y-3 w-full">
//         <ProgressBar 
//           value={scoreData?.details?.keywords_score ?? 0} 
//           label="Keywords" 
//         />      
//         <ProgressBar 
//           value={scoreData?.details?.grammar_score ?? 0} 
//           label="Grammar" 
//         />
//         <ProgressBar 
//           value={scoreData?.details?.skills_match ?? 0} 
//           label="Skills Match" 
//         />
//       </div>

//       <div className="mt-6 w-full">
//         <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>

//         {suggestions.length > 0 ? (
//           <ul className="list-disc ml-5 text-sm text-gray-600 mt-2">
//             {suggestions.map((s, i) => (
//               <li key={i}>{s}</li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-gray-500 text-sm mt-2">No suggestions available.</p>
//         )}
//       </div>
//     </div>
//   );
// }
















// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import { getResumeScore, ResumeScoreResponse } from "@/api/resumeApi";
// import ProgressBar from "./ProgressBar";
// import MultiColorCircularScore from "./MultiColorCircularScore";
// import { toast } from "sonner";
// import { useScore } from "../../_context/ScoreContext";

// export default function ATSScorePanel() {
//   const [scoreData, setScoreData] = useState<ResumeScoreResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const { setOverallScore, overallScore, resetScore } = useScore();
  
//   // ✅ Track previous resume ID
//   const previousResumeIdRef = useRef<string | null>(null);

//   useEffect(() => {
//     const fetchScore = async () => {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//         console.warn("⚠️ No resume ID found");
//         setError("No resume found. Please create a resume first.");
//         setIsLoading(false);
//         return;
//       }

//       // ✅ Check if this is a new resume (ID changed)
//       if (previousResumeIdRef.current !== null && previousResumeIdRef.current !== resumeId) {
//         console.log("🆕 New resume detected, resetting score to 0");
//         resetScore();
//         setScoreData(null);
//       }

//       previousResumeIdRef.current = resumeId;

//       try {
//         setIsLoading(true);
//         setError(null);
//         console.log("📊 Fetching ATS score for resume:", resumeId);
        
//         const data = await getResumeScore(resumeId);
//         setScoreData(data);
//         setOverallScore(data.overall_score);
        
//         console.log("✅ Score loaded successfully:", data.overall_score);
        
//       } catch (err) {
//         console.error("❌ Error fetching score:", err);
//         const errorMessage = err instanceof Error ? err.message : "Failed to fetch score";
//         setError(errorMessage);
        
//         if (overallScore === 0) {
//           toast.error(errorMessage);
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchScore();
//   }, [setOverallScore, resetScore]);

//   if (isLoading && overallScore > 0) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        
//         <div className="flex flex-col items-center justify-center">
//           <MultiColorCircularScore value={overallScore} />
//           <p className="mt-2 text-sm text-gray-600">Overall Score (Cached)</p>
//         </div>

//         <div className="mt-4 flex items-center justify-center">
//           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
//           <p className="ml-2 text-xs text-gray-500">Refreshing...</p>
//         </div>
//       </div>
//     );
//   }

//   if (isLoading) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//           <p className="mt-4 text-sm text-gray-600">Calculating score...</p>
//           <p className="mt-2 text-xs text-gray-500">This may take up to 20 seconds</p>
//         </div>
//       </div>
//     );
//   }

//   if (error && !scoreData && overallScore === 0) {
//     return (
//       <div className="p-6 bg-white border rounded-2xl shadow-md">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
//         <div className="flex flex-col items-center justify-center py-12">
//           <div className="text-red-500 text-4xl mb-2">⚠️</div>
//           <p className="text-sm text-gray-600 text-center">
//             {error || "Unable to load score"}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const suggestions = scoreData?.details?.improvement_suggestions ?? [];

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow-md">
//       <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

//       <div className="flex flex-col items-center justify-center">
//         <MultiColorCircularScore value={scoreData?.overall_score ?? overallScore} />
//         <p className="mt-2 text-sm text-gray-600">Overall Score</p>
//       </div>

//       <div className="mt-6 space-y-3 w-full">
//         <ProgressBar 
//           value={scoreData?.details?.keywords_score ?? 0} 
//           label="Keywords" 
//         />      
//         <ProgressBar 
//           value={scoreData?.details?.grammar_score ?? 0} 
//           label="Grammar" 
//         />
//         <ProgressBar 
//           value={scoreData?.details?.skills_match ?? 0} 
//           label="Skills Match" 
//         />
//       </div>

//       <div className="mt-6 w-full">
//         <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>

//         {suggestions.length > 0 ? (
//           <ul className="list-disc ml-5 text-sm text-gray-600 mt-2">
//             {suggestions.map((s, i) => (
//               <li key={i}>{s}</li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-gray-500 text-sm mt-2">No suggestions available.</p>
//         )}
//       </div>
//     </div>
//   );
// } before score taking long time



"use client";
import React, { useEffect, useState, useRef } from "react";
import { getResumeScore, ResumeScoreResponse } from "@/api/resumeApi";
import ProgressBar from "./ProgressBar";
import MultiColorCircularScore from "./MultiColorCircularScore";
import { toast } from "sonner";
import { useScore } from "../../_context/ScoreContext";

export default function ATSScorePanel() {
  const [scoreData, setScoreData] = useState<ResumeScoreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setOverallScore, overallScore, resetScore } = useScore();
  
  // ✅ Track previous resume ID
  const previousResumeIdRef = useRef<string | null>(null);
  // ✅ Track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    // ✅ Set mounted flag
    isMountedRef.current = true;

    const fetchScore = async () => {
      const resumeId = localStorage.getItem("current_resume_id");
      
      if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
        console.warn("⚠️ No resume ID found");
        setError("No resume found. Please create a resume first.");
        setIsLoading(false);
        return;
      }

      // ✅ Check if this is a new resume (ID changed)
      if (previousResumeIdRef.current !== null && previousResumeIdRef.current !== resumeId) {
        console.log("🆕 New resume detected, resetting score to 0");
        resetScore();
        setScoreData(null);
      }

      previousResumeIdRef.current = resumeId;

      try {
        setIsLoading(true);
        setError(null);
        console.log("📊 Fetching ATS score for resume:", resumeId);
        
        const data = await getResumeScore(resumeId);
        
        // ✅ Only update state if component is still mounted
        if (isMountedRef.current) {
          setScoreData(data);
          setOverallScore(data.overall_score);
          console.log("✅ Score loaded successfully:", data.overall_score);
        }
        
      } catch (err) {
        console.error("❌ Error fetching score:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch score";
        
        // ✅ Only update state if component is still mounted
        if (isMountedRef.current) {
          setError(errorMessage);
          
          if (overallScore === 0) {
            toast.error(errorMessage);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchScore();

    // ✅ Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, []); // ✅ Empty dependency array - run once on mount

  if (isLoading && overallScore > 0) {
    return (
      <div className="p-6 bg-white border rounded-2xl shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        
        <div className="flex flex-col items-center justify-center">
          <MultiColorCircularScore value={overallScore} />
          <p className="mt-2 text-sm text-gray-600">Overall Score (Cached)</p>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="ml-2 text-xs text-gray-500">Refreshing...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white border rounded-2xl shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-sm text-gray-600">Calculating score...</p>
          <p className="mt-2 text-xs text-gray-500">This may take up to 45 seconds</p>
        </div>
      </div>
    );
  }

  if (error && !scoreData && overallScore === 0) {
    return (
      <div className="p-6 bg-white border rounded-2xl shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-sm text-gray-600 text-center">
            {error || "Unable to load score"}
          </p>
        </div>
      </div>
    );
  }

  const suggestions = scoreData?.details?.improvement_suggestions ?? [];

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h2>

      <div className="flex flex-col items-center justify-center">
        <MultiColorCircularScore value={scoreData?.overall_score ?? overallScore} />
        <p className="mt-2 text-sm text-gray-600">Overall Score</p>
      </div>

      <div className="mt-6 space-y-3 w-full">
        <ProgressBar 
          value={scoreData?.details?.keywords_score ?? 0} 
          label="Keywords" 
        />      
        <ProgressBar 
          value={scoreData?.details?.grammar_score ?? 0} 
          label="Grammar" 
        />
        <ProgressBar 
          value={scoreData?.details?.skills_match ?? 0} 
          label="Skills Match" 
        />
      </div>

      <div className="mt-6 w-full">
        <h3 className="text-sm font-semibold text-gray-700">Suggestions:</h3>

        {suggestions.length > 0 ? (
          <ul className="list-disc ml-5 text-sm text-gray-600 mt-2">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm mt-2">No suggestions available.</p>
        )}
      </div>
    </div>
  );
}

