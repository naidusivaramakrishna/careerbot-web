// "use client";
// import React, { useEffect, useState } from "react";
// import { Eye, Sparkles, Layout, Zap, ArrowDownToLine, ZoomIn, ZoomOut } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../api/resumeApi";

// const PreviewPanel: React.FC = () => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
  // const targetScore = 0; // Replace with dynamic ATS score
  // const [resumeScore, setResumeScore] = useState(0);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);

  // useEffect(() => {
  //   const timer = setTimeout(() => setResumeScore(targetScore), 300);
  //   return () => clearTimeout(timer);
  // }, [targetScore]);

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
    
//     try {
//       // Get resume ID from context or state
//       // Replace 'your_resume_id' with actual resume ID from your state/context
//       const resumeId = resumeData?.resume_id || '1'; // Adjust based on your data structure
      
//       // Convert type to lowercase for API
//       const format = type.toLowerCase() as 'pdf' | 'doc';
      
//       // Call download API
//       await downloadResume(resumeId, format);
      
//       // Close dropdown after successful download
//       setShowExportOptions(false);
//     } catch (error) {
//       console.error('Download failed:', error);
//       setDownloadError(`Failed to download ${type}. Please try again.`);
      
//       // Show error message to user (you can replace this with a toast notification)
//       alert(`Failed to download ${type}. Please try again.`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center ">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-blue-500" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] py-6 px-4 items-center h-[95vh]">
//       {/* Toolbar */}
//       <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mb-4 gap-2 bg-white shadow-sm space-x-2 relative">
//         {/* Resume Score */}
        // <div className="flex flex-col items-center justify-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold relative min-w-[120px]">
        //   <span className="text-blue-500">{`Score ${resumeScore}%`}</span>
        // </div>

//         {/* Zoom Out */}
//         <button
//           onClick={handleZoomOut}
//           className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
//           aria-label="Zoom out"
//         >
//           <ZoomOut size={20} className="text-blue-500" />
//         </button>

//         {/* Spacer */}
//         <div className="flex-1"></div>

//         {/* PDF Preview label */}
//         <div className="text-sm font-semibold text-gray-700">
//           <span>PREVIEW</span>
//         </div>

//         {/* Spacer */}
//         <div className="flex-1"></div>

//         {/* Zoom In */}
//         <button
//           onClick={handleZoomIn}
//           className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
//           aria-label="Zoom in"
//         >
//           <ZoomIn size={20} className="text-blue-500" />
//         </button>

//         {/* Export Button with Dropdown */}
//         <div className="ml-1 relative">
//           <button
//             onClick={() => setShowExportOptions((prev) => !prev)}
//             disabled={isDownloading}
//             className={`flex items-center gap-1 border bg-blue-50 border-blue-200 rounded-full px-7 py-1 text-blue-500 text-xs font-semibold hover:bg-blue-100 transition ${
//               isDownloading ? 'opacity-50 cursor-not-allowed' : ''
//             }`}
//             aria-label="Export resume"
//           >
//             <ArrowDownToLine size={16} />
//             {isDownloading ? 'Downloading...' : 'Export'}
//           </button>
//           {showExportOptions && !isDownloading && (
//             <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//               <button
//                 onClick={() => handleExport("PDF")}
//                 className="w-full px-3 py-2 text-left text-blue-600 text-sm hover:bg-gray-100"
//               >
//                 PDF
//               </button>
//               <button
//                 onClick={() => handleExport("DOC")}
//                 className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-gray-100"
//               >
//                 DOC
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
//           {downloadError}
//         </div>
//       )}

//       {/* Preview Box */}
//       <div
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start overflow-auto"
//       >
//         <div
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };
// export default PreviewPanel; before score UI popup



// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   X,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../api/resumeApi";
// import ATSScorePanel from "../_components/score/ScoreTab";

// const PreviewPanel: React.FC = () => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const targetScore = 0; // Replace with dynamic ATS score
//   const [resumeScore, setResumeScore] = useState(0);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);

//   // New: state for showing ATS score popup
//   const [showScorePopup, setShowScorePopup] = useState(false);

//   useEffect(() => {
//     const timer = setTimeout(() => setResumeScore(targetScore), 300);
//     return () => clearTimeout(timer);
//   }, [targetScore]);

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);

//     try {
//       const resumeId = resumeData?.resume_id || "1";
//       const format = type.toLowerCase() as "pdf" | "doc";
//       await downloadResume(resumeId, format);
//       setShowExportOptions(false);
//     } catch (error) {
//       console.error("Download failed:", error);
//       setDownloadError(`Failed to download ${type}. Please try again.`);
//       alert(`Failed to download ${type}. Please try again.`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center ">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-blue-500" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] py-6 px-4 items-center h-[95vh] relative">
//       {/* Toolbar */}
//       <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mb-4 gap-2 bg-white shadow-sm space-x-2 relative">
//         {/* Resume Score (clickable) */}
//         <div
//           onClick={() => setShowScorePopup(true)}
//           className="flex flex-col items-center justify-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold relative min-w-[120px] cursor-pointer hover:bg-blue-100"
//         >
//           <span className="text-blue-500">{`Score ${resumeScore}%`}</span>
//         </div>

//         {/* Zoom Out */}
//         <button
//           onClick={handleZoomOut}
//           className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
//           aria-label="Zoom out"
//         >
//           <ZoomOut size={20} className="text-blue-500" />
//         </button>

//         <div className="flex-1"></div>

//         {/* PDF Preview label */}
//         <div className="text-sm font-semibold text-gray-700">
//           <span>PREVIEW</span>
//         </div>

//         <div className="flex-1"></div>

//         {/* Zoom In */}
//         <button
//           onClick={handleZoomIn}
//           className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
//           aria-label="Zoom in"
//         >
//           <ZoomIn size={20} className="text-blue-500" />
//         </button>

//         {/* Export Button with Dropdown */}
//         <div className="ml-1 relative">
//           <button
//             onClick={() => setShowExportOptions((prev) => !prev)}
//             disabled={isDownloading}
//             className={`flex items-center gap-1 border bg-blue-50 border-blue-200 rounded-full px-7 py-1 text-blue-500 text-xs font-semibold hover:bg-blue-100 transition ${
//               isDownloading ? "opacity-50 cursor-not-allowed" : ""
//             }`}
//             aria-label="Export resume"
//           >
//             <ArrowDownToLine size={16} />
//             {isDownloading ? "Downloading..." : "Export"}
//           </button>
//           {showExportOptions && !isDownloading && (
//             <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//               <button
//                 onClick={() => handleExport("PDF")}
//                 className="w-full px-3 py-2 text-left text-blue-600 text-sm hover:bg-gray-100"
//               >
//                 PDF
//               </button>
//               <button
//                 onClick={() => handleExport("DOC")}
//                 className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-gray-100"
//               >
//                 DOC
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
//           {downloadError}
//         </div>
//       )}

//       {/* Preview Box */}
//       <div
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start overflow-auto"
//       >
//         <div
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>

//       {/* Full-screen ATS Score Popup */}
//       {showScorePopup && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//           <div className="relative w-[90%] max-w-[500px] bg-white rounded-2xl p-6 shadow-xl">
//             {/* Close button */}
//             <button
//               onClick={() => setShowScorePopup(false)}
//               className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
//             >
//               <X size={20} />
//             </button>

//             {/* ATS Score Panel */}
//             <ATSScorePanel />
//           </div>
//         </div>
//       )}
//     </section>
//   );
// };

// export default PreviewPanel; popup coming



// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   X,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../api/resumeApi";
// import ATSScorePanel from "../_components/score/ScoreTab";

// const PreviewPanel: React.FC = () => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const targetScore = 0; // Replace with dynamic ATS score
//   const [resumeScore, setResumeScore] = useState(0);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);

//   // New: state for showing ATS score popup
//   const [showScorePopup, setShowScorePopup] = useState(false);

//   useEffect(() => {
//     const timer = setTimeout(() => setResumeScore(targetScore), 300);
//     return () => clearTimeout(timer);
//   }, [targetScore]);

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);

//     try {
//       const resumeId = resumeData?.resume_id || "1";
//       const format = type.toLowerCase() as "pdf" | "doc";
//       await downloadResume(resumeId, format);
//       setShowExportOptions(false);
//     } catch (error) {
//       console.error("Download failed:", error);
//       setDownloadError(`Failed to download ${type}. Please try again.`);
//       alert(`Failed to download ${type}. Please try again.`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center ">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-blue-500" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar */}
//       <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mb-4 gap-2 bg-white shadow-sm space-x-2 relative">
//         {/* Resume Score (clickable) */}
//         <div
//           onClick={() => setShowScorePopup(true)}
//           className="flex flex-col items-center justify-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold relative min-w-[120px] cursor-pointer hover:bg-blue-100"
//         >
//           <span className="text-blue-500">{`Score ${resumeScore}%`}</span>
//         </div>

//         {/* Zoom Out */}
//         <button
//           onClick={handleZoomOut}
//           className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
//           aria-label="Zoom out"
//         >
//           <ZoomOut size={20} className="text-blue-500" />
//         </button>

//         <div className="flex-1"></div>

//         {/* PDF Preview label */}
//         <div className="text-sm font-semibold text-gray-700">
//           <span>PREVIEW</span>
//         </div>

//         <div className="flex-1"></div>

//         {/* Zoom In */}
//         <button
//           onClick={handleZoomIn}
//           className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
//           aria-label="Zoom in"
//         >
//           <ZoomIn size={20} className="text-blue-500" />
//         </button>

//         {/* Export Button with Dropdown */}
//         <div className="ml-1 relative">
//           <button
//             onClick={() => setShowExportOptions((prev) => !prev)}
//             disabled={isDownloading}
//             className={`flex items-center gap-1 border bg-blue-50 border-blue-200 rounded-full px-7 py-1 text-blue-500 text-xs font-semibold hover:bg-blue-100 transition ${
//               isDownloading ? "opacity-50 cursor-not-allowed" : ""
//             }`}
//             aria-label="Export resume"
//           >
//             <ArrowDownToLine size={16} />
//             {isDownloading ? "Downloading..." : " Export"}
//           </button>
//           {showExportOptions && !isDownloading && (
//             <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//               <button
//                 onClick={() => handleExport("PDF")}
//                 className="w-full px-3 py-2 text-left text-blue-600 text-sm hover:bg-gray-100"
//               >
//                 PDF
//               </button>
//               <button
//                 onClick={() => handleExport("DOC")}
//                 className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-gray-100"
//               >
//                 DOC
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
//           {downloadError}
//         </div>
//       )}

//       {/* Preview Box */}
//       <div
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start overflow-auto"
//       >
//         <div
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>

//       {/* Full-screen ATS Score Popup */}
//       {showScorePopup && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//           <div className="relative w-full max-w-[500px] h-[80vh] bg-white rounded-2xl shadow-xl overflow-y-auto scrollbar-hide">
//             <div>
//             {/* X mark outside the border */}
//             <button
//               onClick={() => setShowScorePopup(false)}
//               className="absolute top-5 right-5 text-gray-500 p-2"
//             >
//               <X size={18} />
//             </button>
//             </div>

//             {/* ATS Score Panel */}
//             <div className="p-4">
//               <ATSScorePanel />
//             </div>
//           </div>
//         </div>
//       )}
//     </section>
//   );
// };

// export default PreviewPanel; before toolbar align


// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   X,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../api/resumeApi";
// import ATSScorePanel from "../_components/score/ScoreTab";

// const PreviewPanel: React.FC = () => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const targetScore = 0; // Replace with dynamic ATS score
//   const [resumeScore, setResumeScore] = useState(0);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const [showScorePopup, setShowScorePopup] = useState(false); // ATS popup

//   useEffect(() => {
//     const timer = setTimeout(() => setResumeScore(targetScore), 300);
//     return () => clearTimeout(timer);
//   }, [targetScore]);

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
//     try {
//       const resumeId = resumeData?.resume_id || "1";
//       const format = type.toLowerCase() as "pdf" | "doc";
//       await downloadResume(resumeId, format);
//       setShowExportOptions(false);
//     } catch (error) {
//       console.error("Download failed:", error);
//       setDownloadError(`Failed to download ${type}. Please try again.`);
//       alert(`Failed to download ${type}. Please try again.`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar - reduced top gap to a single line */}
//       <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative">
//         {/* Resume Score (clickable) */}
//         <div
//           onClick={() => setShowScorePopup(true)}
//           className="flex flex-col items-center justify-center bg-[#e5e5e5] border border-[#2d2d2d] rounded-full px-3 py-1 text-xs font-semibold relative min-w-[120px] cursor-pointer hover:bg-[#cccccc]"
//         >
//           <span className="text-[#2d2d2d]">{`Score ${resumeScore}%`}</span>
//         </div>

//         {/* Zoom Out */}
//         <button
//           onClick={handleZoomOut}
//           className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
//           aria-label="Zoom out"
//         >
//           <ZoomOut size={20} className="text-[#2557a7]" />
//         </button>

//         <div className="flex-1"></div>

//         {/* PDF Preview label */}
//         <div className="text-sm font-semibold text-[#2d2d2d]">
//           <span>PREVIEW</span>
//         </div>

//         <div className="flex-1"></div>

//         {/* Zoom In */}
//         <button
//           onClick={handleZoomIn}
//           className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
//           aria-label="Zoom in"
//         >
//           <ZoomIn size={20} className="text-[#2557a7]" />
//         </button>

//         {/* Export Button with Dropdown */}
//         <div className="ml-1 relative">
//           <button
//             onClick={() => setShowExportOptions((prev) => !prev)}
//             disabled={isDownloading}
//             className={`flex items-center gap-1 border bg-[#e5e5e5] border-[#2d2d2d] rounded-full px-7 py-1 text-[#2d2d2d] text-xs font-semibold hover:bg-[#cccccc] transition ${
//               isDownloading ? "opacity-50 cursor-not-allowed" : ""
//             }`}
//             aria-label="Export resume"
//           >
//             <ArrowDownToLine size={16} />
//             {isDownloading ? "Downloading..." : " Export"}
//           </button>
//           {showExportOptions && !isDownloading && (
//             <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//               <button
//                 onClick={() => handleExport("PDF")}
//                 className="w-full px-3 py-2 text-left text-[#2d2d2d] text-sm hover:bg-gray-100"
//               >
//                 PDF
//               </button>
//               <button
//                 onClick={() => handleExport("DOC")}
//                 className="w-full px-3 py-2 text-left text-sm text-[#2d2d2d] hover:bg-gray-100"
//               >
//                 DOC
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
//           {downloadError}
//         </div>
//       )}

//       {/* Preview Box */}
//       <div
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start overflow-auto"
//       >
//         <div
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>

//       {/* Full-screen ATS Score Popup */}
//       {showScorePopup && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//           <div className="relative w-full max-w-[500px] h-[80vh] bg-white rounded-2xl shadow-xl overflow-y-auto scrollbar-hide">
//             {/* X mark */}
//             <button
//               onClick={() => setShowScorePopup(false)}
//               className="absolute top-5 right-5 text-gray-500 p-2"
//             >
//               <X size={18} />
//             </button>

//             {/* ATS Score Panel */}
//             <div className="p-4">
//               <ATSScorePanel />
//             </div>
//           </div>
//         </div>
//       )}
//     </section>
//   );
// };

// export default PreviewPanel; before multi page




// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../api/resumeApi";

// const PreviewPanel: React.FC = () => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//     const targetScore = 0; // Replace with dynamic ATS score
//   const [resumeScore, setResumeScore] = useState(0);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);

//   useEffect(() => {
//     const timer = setTimeout(() => setResumeScore(targetScore), 300);
//     return () => clearTimeout(timer);
//   }, [targetScore]);


//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
//     try {
//       const resumeId = resumeData?.resume_id || "1";
//       const format = type.toLowerCase() as "pdf" | "doc";
//       await downloadResume(resumeId, format);
//       setShowExportOptions(false);
//     } catch (error) {
//       console.error("Download failed:", error);
//       setDownloadError(`Failed to download ${type}. Please try again.`);
//       alert(`Failed to download ${type}. Please try again.`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar - reduced top gap to a single line */}
//       <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative">
//         {/* Resume Score (clickable) */}
//          <div className="flex flex-col items-center justify-center bg-[#e5e5e5] hover:bg-[#cccccc] border border-[#2d2d2d] rounded-full px-3 py-1 text-xs font-semibold relative min-w-[120px]">
//           <span className="text-[#2d2d2d]">{`Score ${resumeScore}%`}</span>
//         </div>

//         {/* Zoom Out */}
//         <button
//           onClick={handleZoomOut}
//           className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
//           aria-label="Zoom out"
//         >
//           <ZoomOut size={20} className="text-[#2557a7]" />
//         </button>

//         <div className="flex-1"></div>

//         {/* PDF Preview label */}
//         <div className="text-sm font-semibold text-[#2d2d2d]">
//           <span>PREVIEW</span>
//         </div>

//         <div className="flex-1"></div>

//         {/* Zoom In */}
//         <button
//           onClick={handleZoomIn}
//           className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
//           aria-label="Zoom in"
//         >
//           <ZoomIn size={20} className="text-[#2557a7]" />
//         </button>

//         {/* Export Button with Dropdown */}
//         <div className="ml-1 relative">
//           <button
//             onClick={() => setShowExportOptions((prev) => !prev)}
//             disabled={isDownloading}
//             className={`flex items-center gap-1 border bg-[#e5e5e5] border-[#2d2d2d] rounded-full px-7 py-1 text-[#2d2d2d] text-xs font-semibold hover:bg-[#cccccc] transition ${
//               isDownloading ? "opacity-50 cursor-not-allowed" : ""
//             }`}
//             aria-label="Export resume"
//           >
//             <ArrowDownToLine size={16} />
//             {isDownloading ? "Downloading..." : " Export"}
//           </button>
//           {showExportOptions && !isDownloading && (
//             <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//               <button
//                 onClick={() => handleExport("PDF")}
//                 className="w-full px-3 py-2 text-left text-[#2d2d2d] text-sm hover:bg-gray-100"
//               >
//                 PDF
//               </button>
//               <button
//                 onClick={() => handleExport("DOC")}
//                 className="w-full px-3 py-2 text-left text-sm text-[#2d2d2d] hover:bg-gray-100"
//               >
//                 DOC
//               </button>
//             </div>
//           )}
//         </div>
//        </div>

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden">
//           {downloadError}
//         </div>
//       )}

//       {/* Preview Box */}
//       <div
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none"
//       >
//         <div
//           className="resume-content"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PreviewPanel; before + n - change



// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../api/resumeApi";

// const PreviewPanel: React.FC = () => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const targetScore = 0; // Replace with dynamic ATS score
//   const [resumeScore, setResumeScore] = useState(0);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);

//   useEffect(() => {
//     const timer = setTimeout(() => setResumeScore(targetScore), 300);
//     return () => clearTimeout(timer);
//   }, [targetScore]);

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
//     try {
//       const resumeId = resumeData?.resume_id || "1";
//       const format = type.toLowerCase() as "pdf" | "doc";
//       await downloadResume(resumeId, format);
//       setShowExportOptions(false);
//     } catch (error) {
//       console.error("Download failed:", error);
//       setDownloadError(`Failed to download ${type}. Please try again.`);
//       alert(`Failed to download ${type}. Please try again.`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar - without zoom controls */}
//       <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative">
//         {/* Resume Score (clickable) */}
//         <div className="flex flex-col items-center justify-center ml-6 bg-[#e5e5e5] hover:bg-[#cccccc] border border-[#2d2d2d] rounded-full px-10 py-1.5 text-xs font-semibold relative">
//           <span className="text-[#2d2d2d]">{`Score ${resumeScore}%`}</span>
//         </div>

//         <div className="flex-1"></div>

//         {/* PDF Preview label */}
//         <div className="text-sm font-semibold text-[#2d2d2d]">
//           <span>PREVIEW</span>
//         </div>

//         <div className="flex-1"></div>

//         {/* Export Button with Dropdown */}
//         <div className="ml-1 relative">
//           <button
//             onClick={() => setShowExportOptions((prev) => !prev)}
//             disabled={isDownloading}
//             className={`flex items-center gap-1 mr-6 border bg-[#e5e5e5] border-[#2d2d2d] rounded-full px-10 py-1.5 text-[#2d2d2d] text-xs font-semibold hover:bg-[#cccccc] transition ${
//               isDownloading ? "opacity-50 cursor-not-allowed" : ""
//             }`}
//             aria-label="Export resume"
//           >
//             <ArrowDownToLine size={16} />
//             {isDownloading ? "Downloading..." : " Export"}
//           </button>
//           {showExportOptions && !isDownloading && (
//             <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//               <button
//                 onClick={() => handleExport("PDF")}
//                 className="w-full px-3 py-2 text-left text-[#2d2d2d] text-sm hover:bg-gray-100"
//               >
//                 PDF
//               </button>
//               <button
//                 onClick={() => handleExport("DOC")}
//                 className="w-full px-3 py-2 text-left text-sm text-[#2d2d2d] hover:bg-gray-100"
//               >
//                 DOC
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden">
//           {downloadError}
//         </div>
//       )}

//       {/* Zoom Controls - Single Box with Both Buttons */}
//       <div className="w-full max-w-[100%] flex items-center justify-end mb-3 px-2">
//         <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-full shadow-sm overflow-hidden">
//           {/* Zoom Out */}
//           <button
//             onClick={handleZoomOut}
//             className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition"
//             aria-label="Zoom out"
//           >
//             <ZoomOut size={20} className="text-[#2557a7]" />
//           </button>

//           {/* Divider */}
//           <div className="w-px h-5 bg-gray-300"></div>

//           {/* Zoom In */}
//           <button
//             onClick={handleZoomIn}
//             className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition"
//             aria-label="Zoom in"
//           >
//             <ZoomIn size={20} className="text-[#2557a7]" />
//           </button>
//         </div>
//       </div>

//       {/* Preview Box */}
//       <div
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none"
//       >
//         <div
//           className="resume-content"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PreviewPanel; before pg no




// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../api/resumeApi";


// const PreviewPanel: React.FC = () => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const targetScore = 0;
//   const [resumeScore, setResumeScore] = useState(0);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const [totalPages, setTotalPages] = useState(1);
//   const [currentPage, setCurrentPage] = useState(1);
//   const previewContainerRef = useRef<HTMLDivElement>(null);


//   useEffect(() => {
//     const timer = setTimeout(() => setResumeScore(targetScore), 300);
//     return () => clearTimeout(timer);
//   }, [targetScore]);


//   // Calculate total pages based on rendered content
//   useEffect(() => {
//     const calculatePages = () => {
//       if (previewContainerRef.current) {
//         const pages = previewContainerRef.current.querySelectorAll('.a4-page');
//         const pageCount = pages.length || 1;
//         setTotalPages(pageCount);
//       }
//     };

//     // Initial calculation
//     calculatePages();

//     // Recalculate after a short delay to ensure DOM is fully rendered
//     const timeout = setTimeout(calculatePages, 500);

//     return () => clearTimeout(timeout);
//   }, [resumeData, resumeStyle, selectedTemplate]);


//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };


//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };


//   const handlePageSelect = (pageNum: number) => {
//     setCurrentPage(pageNum);
    
//     // Scroll to the selected page
//     if (previewContainerRef.current) {
//       const pages = previewContainerRef.current.querySelectorAll('.a4-page');
//       const targetPage = pages[pageNum - 1] as HTMLElement;
      
//       if (targetPage) {
//         // Get the container's scroll position
//         const container = previewContainerRef.current;
//         const containerTop = container.scrollTop;
//         const targetTop = targetPage.offsetTop;
        
//         // Scroll to the target page
//         container.scrollTo({
//           top: targetTop - 24, // 24px offset for padding
//           behavior: 'smooth',
//         });
//       }
//     }
//   };


//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
//     try {
//       const resumeId = resumeData?.resume_id || "1";
//       const format = type.toLowerCase() as "pdf" | "doc";
//       await downloadResume(resumeId, format);
//       setShowExportOptions(false);
//     } catch (error) {
//       console.error("Download failed:", error);
//       setDownloadError(`Failed to download ${type}. Please try again.`);
//       alert(`Failed to download ${type}. Please try again.`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };


//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };


//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar */}
//       <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative">
//         {/* Resume Score */}
//         <div className="flex flex-col items-center justify-center ml-6 bg-[#e5e5e5] hover:bg-[#cccccc] rounded-full px-7 py-1.5 text-xs font-semibold relative">
//           <span className="text-[#2d2d2d]">{`Score ${resumeScore}%`}</span>
//         </div>


//         <div className="flex-1"></div>


//         {/* PDF Preview label */}
//         <div className="text-base font-semibold text-[#2d2d2d]">
//           <span>PREVIEW</span>
//         </div>


//         <div className="flex-1"></div>


//         {/* Export Button with Dropdown */}
//         <div className="ml-1 relative">
//           <button
//             onClick={() => setShowExportOptions((prev) => !prev)}
//             disabled={isDownloading}
//             className={`flex items-center gap-1 mr-6 bg-[#2557a7]  rounded-lg px-7 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//               isDownloading ? "opacity-50 cursor-not-allowed" : ""
//             }`}
//             aria-label="Export resume"
//           >
//             <ArrowDownToLine size={16} />
//             {isDownloading ? "Downloading..." : " Export"}
//           </button>
//           {showExportOptions && !isDownloading && (
//             <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//               <button
//                 onClick={() => handleExport("PDF")}
//                 className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//               >
//                 PDF
//               </button>
//               <button
//                 onClick={() => handleExport("DOC")}
//                 className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//               >
//                 DOC
//               </button>
//             </div>
//           )}
//         </div>
//       </div>


//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden">
//           {downloadError}
//         </div>
//       )}


//       {/* Page Locator (Left) and Zoom Controls (Right) - ALWAYS VISIBLE */}
//       <div className="w-full max-w-[100%] flex items-center justify-between mb-3 px-2">
//         {/* Page Number Locator - Left Side - ALWAYS SHOWN */}
//         <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-full shadow-sm px-3 py-1.5">
//           <span className="text-xs text-gray-600 font-medium">Page:</span>
//           <select
//             value={currentPage}
//             onChange={(e) => handlePageSelect(Number(e.target.value))}
//             className="text-xs font-semibold text-[#2557a7] bg-transparent border-none outline-none cursor-pointer"
//           >
//             {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//               <option key={page} value={page}>
//                 {page} of {totalPages}
//               </option>
//             ))}
//           </select>
//         </div>


//         {/* Zoom Controls - Right Side */}
//         <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-full shadow-sm overflow-hidden">
//           <button
//             onClick={handleZoomOut}
//             className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition"
//             aria-label="Zoom out"
//           >
//             <ZoomOut size={20} className="text-[#2557a7]" />
//           </button>


//           <div className="w-px h-5 bg-gray-300"></div>


//           <button
//             onClick={handleZoomIn}
//             className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition"
//             aria-label="Zoom in"
//           >
//             <ZoomIn size={20} className="text-[#2557a7]" />
//           </button>
//         </div>
//       </div>


//       {/* Preview Box */}
//       <div
//         ref={previewContainerRef}
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none"
//       >
//         <div
//           className="resume-content"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };


// export default PreviewPanel; before zoomin n zoomout %



// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../api/resumeApi";

// const PreviewPanel: React.FC = () => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const targetScore = 0;
//   const [resumeScore, setResumeScore] = useState(0);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const previewContainerRef = useRef<HTMLDivElement>(null);



//   useEffect(() => {
//     const timer = setTimeout(() => setResumeScore(targetScore), 300);
//     return () => clearTimeout(timer);
//   }, [targetScore]);



//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };



//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };



//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
//     try {
//       const resumeId = resumeData?.resume_id || "1";
//       const format = type.toLowerCase() as "pdf" | "doc";
//       await downloadResume(resumeId, format);
//       setShowExportOptions(false);
//     } catch (error) {
//       console.error("Download failed:", error);
//       setDownloadError(`Failed to download ${type}. Please try again.`);
//       alert(`Failed to download ${type}. Please try again.`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };



//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar */}
//       <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative">
//         {/* Resume Score */}
//         <div className="flex flex-col items-center justify-center ml-6 bg-[#e5e5e5] hover:bg-[#cccccc] rounded-lg px-5 py-1.5 text-xs font-semibold relative">
//           <span className="text-[#2d2d2d]">{`Resume Score ${resumeScore}%`}</span>
//         </div>


//         <div className="flex-1"></div>


//         {/* PDF Preview label */}
//         <div className="text-base font-semibold text-[#2d2d2d]">
//           <span>PREVIEW</span>
//         </div>


//         <div className="flex-1"></div>


//         {/* Export Button with Dropdown */}
//         <div className="ml-1 relative">
//           <button
//             onClick={() => setShowExportOptions((prev) => !prev)}
//             disabled={isDownloading}
//             className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//               isDownloading ? "opacity-50 cursor-not-allowed" : ""
//             }`}
//             aria-label="Export resume"
//           >
//             <ArrowDownToLine size={16} />
//             {isDownloading ? "Downloading..." : " Export"}
//           </button>
//           {showExportOptions && !isDownloading && (
//             <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//               <button
//                 onClick={() => handleExport("PDF")}
//                 className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//               >
//                 PDF
//               </button>
//               <button
//                 onClick={() => handleExport("DOC")}
//                 className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//               >
//                 DOC
//               </button>
//             </div>
//           )}
//         </div>
//       </div>


//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden">
//           {downloadError}
//         </div>
//       )}


//       {/* Zoom Controls - Right Side */}
//       <div className="w-full max-w-[100%] flex items-center justify-end mb-3">
//         <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-full shadow-sm overflow-hidden">
//           {/* Zoom Out Button */}
//           <button
//             onClick={handleZoomOut}
//             className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition"
//             aria-label="Zoom out"
//           >
//             <ZoomOut size={20} className="text-[#2557a7]" />
//           </button>


//           {/* Zoom Percentage Display */}
//           <div className="px-0.5 text-sm font-semibold text-gray-700 min-w-[38px] text-center">
//             {Math.round(zoomLevel * 100)}%
//           </div>


//           {/* Zoom In Button */}
//           <button
//             onClick={handleZoomIn}
//             className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition"
//             aria-label="Zoom in"
//           >
//             <ZoomIn size={20} className="text-[#2557a7]" />
//           </button>
//         </div>
//       </div>


//       {/* Preview Box */}
//       <div
//         ref={previewContainerRef}
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none"
//       >
//         <div
//           className="resume-content"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };


// export default PreviewPanel; before template tabs



// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   LayoutGrid,
//   BarChart2,
//   Shuffle,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../api/resumeApi";

// interface PreviewPanelProps {
//   isTemplateSidebarOpen: boolean;
//   onTabClick: (tab: string) => void;
// }

// const tabs = [
//   { label: "Templates", icon: LayoutGrid },
//   { label: "Score", icon: BarChart2 },
//   { label: "Job Match", icon: Shuffle },
// ];

// const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
//   isTemplateSidebarOpen, 
//   onTabClick 
// }) => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const targetScore = 0;
//   const [resumeScore, setResumeScore] = useState(0);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const previewContainerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const timer = setTimeout(() => setResumeScore(targetScore), 300);
//     return () => clearTimeout(timer);
//   }, [targetScore]);

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
//     try {
//       const resumeId = resumeData?.resume_id || "1";
//       const format = type.toLowerCase() as "pdf" | "doc";
//       await downloadResume(resumeId, format);
//       setShowExportOptions(false);
//     } catch (error) {
//       console.error("Download failed:", error);
//       setDownloadError(`Failed to download ${type}. Please try again.`);
//       alert(`Failed to download ${type}. Please try again.`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar */}
//       <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative">
//         {/* Resume Score - Dynamic padding based on sidebar state */}
//         <div className={`flex flex-col items-center justify-center ml-6 bg-[#e8eff9] border border-[#c9dcf2] rounded-lg ${isTemplateSidebarOpen ? 'px-3' : 'px-5'} py-1.5 text-xs font-semibold relative`}>
//           <span className="text-[#2d2d2d]">{`Resume Score ${resumeScore}%`}</span>
//         </div>

//         <div className="flex-1"></div> 

//         {/* PDF Preview label */}
//         <div className="text-base font-semibold text-[#2d2d2d]">
//           <span>PREVIEW</span>
//         </div> 

//         <div className="flex-1"></div> 

//         {/* Tabs - Only show when sidebar is closed */}
//         {!isTemplateSidebarOpen && (
//           <div className="flex items-center gap-2 mr-4">
//             {tabs.map((tab) => {
//               const Icon = tab.icon;
//               return (
//                 <button
//                   key={tab.label}
//                   onClick={() => onTabClick(tab.label)}
//                   className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//                   title={tab.label}
//                 >
//                   <Icon size={16} />
//                   {tab.label}
//                 </button>
//               );
//             })}
//           </div>
//         )}

//         {/* Export Button with Dropdown */}
//         <div className="ml-1 relative">
//           <button
//             onClick={() => setShowExportOptions((prev) => !prev)}
//             disabled={isDownloading}
//             className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//               isDownloading ? "opacity-50 cursor-not-allowed" : ""
//             }`}
//             aria-label="Export resume"
//           >
//             <ArrowDownToLine size={16} />
//             {isDownloading ? "Downloading..." : " Export"}
//           </button>
//           {showExportOptions && !isDownloading && (
//             <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//               <button
//                 onClick={() => handleExport("PDF")}
//                 className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//               >
//                 PDF
//               </button>
//               <button
//                 onClick={() => handleExport("DOC")}
//                 className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//               >
//                 DOC
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden">
//           {downloadError}
//         </div>
//       )}

//       {/* Zoom Controls - Right Side */}
//       <div className="w-full max-w-[100%] flex items-center justify-end mb-3">
//         <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//           {/* Zoom Out Button */}
//           <button
//             onClick={handleZoomOut}
//             className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//             aria-label="Zoom out"
//           >
//             <ZoomOut size={16} className="text-[#2557a7]" />
//           </button>

//           {/* Zoom Percentage Display */}
//           <div className="px-0 text-sm font-semibold text-gray-700 min-w-[38px] text-center">
//             {Math.round(zoomLevel * 100)}%
//           </div>

//           {/* Zoom In Button */}
//           <button
//             onClick={handleZoomIn}
//             className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//             aria-label="Zoom in"
//           >
//             <ZoomIn size={16} className="text-[#2557a7]" />
//           </button>
//         </div>
//       </div>

//       {/* Preview Box */}
//       <div
//         ref={previewContainerRef}
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none"
//       >
//         <div
//           className="resume-content"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PreviewPanel; before 100% up




// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   LayoutGrid,
//   BarChart2,
//   Shuffle,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../../api/resumeApi";

// interface PreviewPanelProps {
//   isTemplateSidebarOpen: boolean;
//   onTabClick: (tab: string) => void;
//   onOpenSidebar?: (tab: string) => void;
// }

// const tabs = [
//   { label: "Templates", icon: LayoutGrid },
//   { label: "Score", icon: BarChart2 },
//   { label: "Job Match", icon: Shuffle },
// ];

// const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
//   isTemplateSidebarOpen, 
//   onTabClick,
//   onOpenSidebar
// }) => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const targetScore = 0;
//   const [resumeScore, setResumeScore] = useState(0);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const previewContainerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const timer = setTimeout(() => setResumeScore(targetScore), 300);
//     return () => clearTimeout(timer);
//   }, [targetScore]);

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
//     try {
//       const resumeId = resumeData?.resume_id || "1";
//       const format = type.toLowerCase() as "pdf" | "doc";
//       await downloadResume(resumeId, format);
//       setShowExportOptions(false);
//     } catch (error) {
//       console.error("Download failed:", error);
//       setDownloadError(`Failed to download ${type}. Please try again.`);
//       alert(`Failed to download ${type}. Please try again.`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const handleResumeScoreClick = () => {
//     if (onOpenSidebar) {
//       onOpenSidebar("Score");
//     }
//     onTabClick("Score");
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar - When Sidebar is Open */}
//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative">
//           {/* Resume Score */}
//           <div className={`flex flex-col items-center justify-center ml-6 bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold relative`}>
//             <span className="text-[#2d2d2d]">{`Resume Score ${resumeScore}%`}</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* PDF Preview label */}
//           <div className="text-base font-semibold text-[#2d2d2d]">
//             <span>PREVIEW</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* Export Button with Dropdown */}
//           <div className="ml-1 relative">
//             <button
//               onClick={() => setShowExportOptions((prev) => !prev)}
//               disabled={isDownloading}
//               className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                 isDownloading ? "opacity-50 cursor-not-allowed" : ""
//               }`}
//               aria-label="Export resume"
//             >
//               <ArrowDownToLine size={16} />
//               {isDownloading ? "Downloading..." : " Export"}
//             </button>
//             {showExportOptions && !isDownloading && (
//               <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//                 <button
//                   onClick={() => handleExport("PDF")}
//                   className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                 >
//                   PDF
//                 </button>
//                 <button
//                   onClick={() => handleExport("DOC")}
//                   className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                 >
//                   DOC
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Toolbar - When Sidebar is Closed */}
//       {!isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-between border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm relative">
//           {/* Left Section - Resume Score + Template Tabs */}
//           <div className="flex items-center gap-8 ml-4">
//             {/* Resume Score Button */}
//             <button
//               onClick={handleResumeScoreClick}
//               className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d4e6f7] transition cursor-pointer"
//             >
//               <span className="text-[#2d2d2d]">{`Resume Score ${resumeScore}%`}</span>
//             </button>

//             {/* Template Tabs */}
//             <div className="flex items-center gap-2">
//               {tabs.slice(0, 1).map((tab) => {
//                 const Icon = tab.icon;
//                 return (
//                   <button
//                     key={tab.label}
//                     onClick={() => onTabClick(tab.label)}
//                     className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//                     title={tab.label}
//                   >
//                     <Icon size={16} />
//                     {tab.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Middle Section - Zoom Controls */}
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             {/* Zoom Out Button */}
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             {/* Zoom Percentage Display */}
//             <div className="px-3 text-sm font-semibold text-gray-700 min-w-[30px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             {/* Zoom In Button */}
//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>

//           {/* Right Section - Job Match + Export */}
//           <div className="flex items-center gap-8 mr-4">
//             {/* Job Match Tab */}
//             <button
//               onClick={() => onTabClick("Job Match")}
//               className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//               title="Job Match"
//             >
//               <Shuffle size={16} />
//               Job Match
//             </button>

//             {/* Export Button with Dropdown */}
//             <div className="relative">
//               <button
//                 onClick={() => setShowExportOptions((prev) => !prev)}
//                 disabled={isDownloading}
//                 className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                   isDownloading ? "opacity-50 cursor-not-allowed" : ""
//                 }`}
//                 aria-label="Export resume"
//               >
//                 <ArrowDownToLine size={16} />
//                 {isDownloading ? "Downloading..." : " Export"}
//               </button>
//               {showExportOptions && !isDownloading && (
//                 <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//                   <button
//                     onClick={() => handleExport("PDF")}
//                     className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                   >
//                     PDF
//                   </button>
//                   <button
//                     onClick={() => handleExport("DOC")}
//                     className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                   >
//                     DOC
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden">
//           {downloadError}
//         </div>
//       )}

//       {/* Zoom Controls - Right Side (Only when sidebar is open) */}
//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-end mb-3">
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             {/* Zoom Out Button */}
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             {/* Zoom Percentage Display */}
//             <div className="px-1 text-sm font-semibold text-gray-700 min-w-[38px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             {/* Zoom In Button */}
//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Preview Box */}
//       <div
//         ref={previewContainerRef}
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none"
//       >
//         <div
//           className="resume-content"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PreviewPanel; 
// before score integrate




// "use client";
// import React, { useState, useRef } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   LayoutGrid,
//   BarChart2,
//   Shuffle,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import { useScore } from "../_context/ScoreContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface PreviewPanelProps {
//   isTemplateSidebarOpen: boolean;
//   onTabClick: (tab: string) => void;
//   onOpenSidebar?: (tab: string) => void;
// }

// const tabs = [
//   { label: "Templates", icon: LayoutGrid },
//   { label: "Score", icon: BarChart2 },
//   { label: "Job Match", icon: Shuffle },
// ];

// const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
//   isTemplateSidebarOpen, 
//   onTabClick,
//   onOpenSidebar
// }) => {
//   const { selectedTemplate, resumeData, resumeStyle, isLoadingDefaultTemplate } = useResume();
//   const { overallScore } = useScore();
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const previewContainerRef = useRef<HTMLDivElement>(null);

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
    
//     try {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         throw new Error("Resume ID not found. Please create a resume first.");
//       }
      
//       const format = type.toLowerCase() as "pdf" | "doc";
      
//       console.log("📥 Starting download:", { resumeId, format });
//       toast.loading(`Downloading ${type.toUpperCase()}...`);
      
//       await downloadResume(resumeId, format);
      
//       toast.dismiss();
//       toast.success(`${type.toUpperCase()} downloaded successfully!`);
//       setShowExportOptions(false);
      
//     } catch (error) {
//       console.error("❌ Download failed:", error);
//       toast.dismiss();
      
//       const errorMessage = error instanceof Error 
//         ? error.message 
//         : `Failed to download ${type}. Please try again.`;
      
//       setDownloadError(errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const handleResumeScoreClick = () => {
//     if (onOpenSidebar) {
//       onOpenSidebar("Score");
//     }
//     onTabClick("Score");
//   };

//   const renderTemplate = () => {
//     // Show loading state while fetching default template
//     if (isLoadingDefaultTemplate || selectedTemplate === null) {
//       return (
//         <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center justify-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
//           <p className="text-gray-600">Loading template...</p>
//         </div>
//       );
//     }

//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar - When Sidebar is Open */}
//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative">
//           <div className="flex flex-col items-center justify-center ml-6 bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold relative">
//             <span className="text-[#2d2d2d]">{`Resume Score ${Math.round(overallScore)}%`}</span>
//           </div>

//           <div className="flex-1"></div>

//           <div className="text-base font-semibold text-[#2d2d2d]">
//             <span>PREVIEW</span>
//           </div>

//           <div className="flex-1"></div>

//           <div className="ml-1 relative">
//             <button
//               onClick={() => setShowExportOptions((prev) => !prev)}
//               disabled={isDownloading}
//               className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                 isDownloading ? "opacity-50 cursor-not-allowed" : ""
//               }`}
//               aria-label="Export resume"
//             >
//               <ArrowDownToLine size={16} />
//               {isDownloading ? "Downloading..." : " Export"}
//             </button>
//             {showExportOptions && !isDownloading && (
//               <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//                 <button
//                   onClick={() => handleExport("PDF")}
//                   className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                 >
//                   PDF
//                 </button>
//                 <button
//                   onClick={() => handleExport("DOC")}
//                   className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                 >
//                   DOC
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Toolbar - When Sidebar is Closed */}
//       {!isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-between border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm relative">
//           <div className="flex items-center gap-8 ml-4">
//             <button
//               onClick={handleResumeScoreClick}
//               className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d4e6f7] transition cursor-pointer"
//             >
//               <span className="text-[#2d2d2d]">{`Resume Score ${Math.round(overallScore)}%`}</span>
//             </button>

//             <div className="flex items-center gap-2">
//               {tabs.slice(0, 1).map((tab) => {
//                 const Icon = tab.icon;
//                 return (
//                   <button
//                     key={tab.label}
//                     onClick={() => onTabClick(tab.label)}
//                     className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//                     title={tab.label}
//                   >
//                     <Icon size={16} />
//                     {tab.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-3 text-sm font-semibold text-gray-700 min-w-[30px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>

//           <div className="flex items-center gap-8 mr-4">
//             <button
//               onClick={() => onTabClick("Job Match")}
//               className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//               title="Job Match"
//             >
//               <Shuffle size={16} />
//               Job Match
//             </button>

//             <div className="relative">
//               <button
//                 onClick={() => setShowExportOptions((prev) => !prev)}
//                 disabled={isDownloading}
//                 className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                   isDownloading ? "opacity-50 cursor-not-allowed" : ""
//                 }`}
//                 aria-label="Export resume"
//               >
//                 <ArrowDownToLine size={16} />
//                 {isDownloading ? "Downloading..." : " Export"}
//               </button>
//               {showExportOptions && !isDownloading && (
//                 <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//                   <button
//                     onClick={() => handleExport("PDF")}
//                     className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                   >
//                     PDF
//                   </button>
//                   <button
//                     onClick={() => handleExport("DOC")}
//                     className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                   >
//                     DOC
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden">
//           {downloadError}
//         </div>
//       )}

//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-end mb-3">
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-1 text-sm font-semibold text-gray-700 min-w-[38px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>
//         </div>
//       )}

//       <div
//         ref={previewContainerRef}
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none"
//       >
//         <div
//           className="resume-content"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PreviewPanel;



// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   LayoutGrid,
//   BarChart2,
//   Shuffle,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../../api/resumeApi";

// interface PreviewPanelProps {
//   isTemplateSidebarOpen: boolean;
//   onTabClick: (tab: string) => void;
//   onOpenSidebar?: (tab: string) => void;
// }

// const tabs = [
//   { label: "Templates", icon: LayoutGrid },
//   { label: "Score", icon: BarChart2 },
//   { label: "Job Match", icon: Shuffle },
// ];

// const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
//   isTemplateSidebarOpen, 
//   onTabClick,
//   onOpenSidebar
// }) => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const targetScore = 0;
//   const [resumeScore, setResumeScore] = useState(0);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const previewContainerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const timer = setTimeout(() => setResumeScore(targetScore), 300);
//     return () => clearTimeout(timer);
//   }, [targetScore]);

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   // const handleExport = async (type: string) => {
//   //   setIsDownloading(true);
//   //   setDownloadError(null);
//   //   try {
//   //     const resumeId = resumeData?.resume_id || "1";
//   //     const format = type.toLowerCase() as "pdf" | "doc";
//   //     await downloadResume(resumeId, format);
//   //     setShowExportOptions(false);
//   //   } catch (error) {
//   //     console.error("Download failed:", error);
//   //     setDownloadError(`Failed to download ${type}. Please try again.`);
//   //     alert(`Failed to download ${type}. Please try again.`);
//   //   } finally {
//   //     setIsDownloading(false);
//   //   }
//   // };
//   const handleExport = async (type: string) => {
//   setIsDownloading(true);
//   setDownloadError(null);
  
//   try {
//     // ✅ Get resume ID from localStorage (same as everywhere else)
//     const resumeId = localStorage.getItem("current_resume_id");
    
//     if (!resumeId) {
//       throw new Error("No resume ID found. Please save your resume first.");
//     }
    
//     console.log("📥 Downloading resume:", resumeId, "Format:", type);
    
//     const format = type.toLowerCase() as "pdf" | "doc";
    
//     // ✅ This will download the blob
//     const blob = await downloadResume(resumeId, format);
    
//     // ✅ Create download link
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', `resume.${format}`);
//     document.body.appendChild(link);
//     link.click();
    
//     // ✅ Cleanup
//     link.remove();
//     window.URL.revokeObjectURL(url);
    
//     setShowExportOptions(false);
    
//   } catch (error) {
//     console.error("Download failed:", error);
//     const errorMessage = error instanceof Error ? error.message : "Failed to download";
//     setDownloadError(`Failed to download ${type}. ${errorMessage}`);
//   } finally {
//     setIsDownloading(false);
//   }
// };


//   const handleResumeScoreClick = () => {
//     if (onOpenSidebar) {
//       onOpenSidebar("Score");
//     }
//     onTabClick("Score");
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar - When Sidebar is Open */}
//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative">
//           {/* Resume Score */}
//           <div className={`flex flex-col items-center justify-center ml-6 bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold relative`}>
//             <span className="text-[#2d2d2d]">{`Resume Score ${resumeScore}%`}</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* PDF Preview label */}
//           <div className="text-base font-semibold text-[#2d2d2d]">
//             <span>PREVIEW</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* Export Button with Dropdown */}
//           <div className="ml-1 relative">
//             <button
//               onClick={() => setShowExportOptions((prev) => !prev)}
//               disabled={isDownloading}
//               className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                 isDownloading ? "opacity-50 cursor-not-allowed" : ""
//               }`}
//               aria-label="Export resume"
//             >
//               <ArrowDownToLine size={16} />
//               {isDownloading ? "Downloading..." : " Export"}
//             </button>
//             {showExportOptions && !isDownloading && (
//               <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//                 <button
//                   onClick={() => handleExport("PDF")}
//                   className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                 >
//                   PDF
//                 </button>
//                 <button
//                   onClick={() => handleExport("DOC")}
//                   className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                 >
//                   DOC
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Toolbar - When Sidebar is Closed */}
//       {!isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-between border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm relative">
//           {/* Left Section - Resume Score + Template Tabs */}
//           <div className="flex items-center gap-8 ml-4">
//             {/* Resume Score Button */}
//             <button
//               onClick={handleResumeScoreClick}
//               className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d4e6f7] transition cursor-pointer"
//             >
//               <span className="text-[#2d2d2d]">{`Resume Score ${resumeScore}%`}</span>
//             </button>

//             {/* Template Tabs */}
//             <div className="flex items-center gap-2">
//               {tabs.slice(0, 1).map((tab) => {
//                 const Icon = tab.icon;
//                 return (
//                   <button
//                     key={tab.label}
//                     onClick={() => onTabClick(tab.label)}
//                     className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//                     title={tab.label}
//                   >
//                     <Icon size={16} />
//                     {tab.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Middle Section - Zoom Controls */}
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             {/* Zoom Out Button */}
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             {/* Zoom Percentage Display */}
//             <div className="px-3 text-sm font-semibold text-gray-700 min-w-[30px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             {/* Zoom In Button */}
//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>

//           {/* Right Section - Job Match + Export */}
//           <div className="flex items-center gap-8 mr-4">
//             {/* Job Match Tab */}
//             <button
//               onClick={() => onTabClick("Job Match")}
//               className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//               title="Job Match"
//             >
//               <Shuffle size={16} />
//               Job Match
//             </button>

//             {/* Export Button with Dropdown */}
//             <div className="relative">
//               <button
//                 onClick={() => setShowExportOptions((prev) => !prev)}
//                 disabled={isDownloading}
//                 className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                   isDownloading ? "opacity-50 cursor-not-allowed" : ""
//                 }`}
//                 aria-label="Export resume"
//               >
//                 <ArrowDownToLine size={16} />
//                 {isDownloading ? "Downloading..." : " Export"}
//               </button>
//               {showExportOptions && !isDownloading && (
//                 <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//                   <button
//                     onClick={() => handleExport("PDF")}
//                     className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                   >
//                     PDF
//                   </button>
//                   <button
//                     onClick={() => handleExport("DOC")}
//                     className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                   >
//                     DOC
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden">
//           {downloadError}
//         </div>
//       )}

//       {/* Zoom Controls - Right Side (Only when sidebar is open) */}
//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-end mb-3">
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             {/* Zoom Out Button */}
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             {/* Zoom Percentage Display */}
//             <div className="px-1 text-sm font-semibold text-gray-700 min-w-[38px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             {/* Zoom In Button */}
//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Preview Box */}
//       <div
//         ref={previewContainerRef}
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none"
//       >
//         <div
//           className="resume-content"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PreviewPanel; before resume score



// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   LayoutGrid,
//   BarChart2,
//   Shuffle,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import { useScore } from "../_context/ScoreContext"; // ✅ Import useScore
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../../api/resumeApi";

// interface PreviewPanelProps {
//   isTemplateSidebarOpen: boolean;
//   onTabClick: (tab: string) => void;
//   onOpenSidebar?: (tab: string) => void;
// }

// const tabs = [
//   { label: "Templates", icon: LayoutGrid },
//   { label: "Score", icon: BarChart2 },
//   { label: "Job Match", icon: Shuffle },
// ];

// const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
//   isTemplateSidebarOpen, 
//   onTabClick,
//   onOpenSidebar
// }) => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const { overallScore } = useScore(); // ✅ Get score from context
  
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const previewContainerRef = useRef<HTMLDivElement>(null);

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
    
//     try {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         throw new Error("No resume ID found. Please save your resume first.");
//       }
      
//       console.log("📥 Downloading resume:", resumeId, "Format:", type);
      
//       const format = type.toLowerCase() as "pdf" | "doc";
//       const blob = await downloadResume(resumeId, format);
      
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `resume.${format}`);
//       document.body.appendChild(link);
//       link.click();
      
//       link.remove();
//       window.URL.revokeObjectURL(url);
      
//       setShowExportOptions(false);
      
//     } catch (error) {
//       console.error("Download failed:", error);
//       const errorMessage = error instanceof Error ? error.message : "Failed to download";
//       setDownloadError(`Failed to download ${type}. ${errorMessage}`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const handleResumeScoreClick = () => {
//     if (onOpenSidebar) {
//       onOpenSidebar("Score");
//     }
//     onTabClick("Score");
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar - When Sidebar is Open */}
//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative">
//           {/* Resume Score - ✅ Now using overallScore from context */}
//           <div className={`flex flex-col items-center justify-center ml-6 bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold relative`}>
//             <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* PDF Preview label */}
//           <div className="text-base font-semibold text-[#2d2d2d]">
//             <span>PREVIEW</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* Export Button with Dropdown */}
//           <div className="ml-1 relative">
//             <button
//               onClick={() => setShowExportOptions((prev) => !prev)}
//               disabled={isDownloading}
//               className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                 isDownloading ? "opacity-50 cursor-not-allowed" : ""
//               }`}
//               aria-label="Export resume"
//             >
//               <ArrowDownToLine size={16} />
//               {isDownloading ? "Downloading..." : " Export"}
//             </button>
//             {showExportOptions && !isDownloading && (
//               <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//                 <button
//                   onClick={() => handleExport("PDF")}
//                   className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                 >
//                   PDF
//                 </button>
//                 <button
//                   onClick={() => handleExport("DOC")}
//                   className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                 >
//                   DOC
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Toolbar - When Sidebar is Closed */}
//       {!isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-between border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm relative">
//           {/* Left Section - Resume Score + Template Tabs */}
//           <div className="flex items-center gap-8 ml-4">
//             {/* Resume Score Button - ✅ Now using overallScore from context */}
//             <button
//               onClick={handleResumeScoreClick}
//               className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d4e6f7] transition cursor-pointer"
//             >
//               <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
//             </button>

//             {/* Template Tabs */}
//             <div className="flex items-center gap-2">
//               {tabs.slice(0, 1).map((tab) => {
//                 const Icon = tab.icon;
//                 return (
//                   <button
//                     key={tab.label}
//                     onClick={() => onTabClick(tab.label)}
//                     className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//                     title={tab.label}
//                   >
//                     <Icon size={16} />
//                     {tab.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Middle Section - Zoom Controls */}
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-3 text-sm font-semibold text-gray-700 min-w-[30px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>

//           {/* Right Section - Job Match + Export */}
//           <div className="flex items-center gap-8 mr-4">
//             <button
//               onClick={() => onTabClick("Job Match")}
//               className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//               title="Job Match"
//             >
//               <Shuffle size={16} />
//               Job Match
//             </button>

//             <div className="relative">
//               <button
//                 onClick={() => setShowExportOptions((prev) => !prev)}
//                 disabled={isDownloading}
//                 className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                   isDownloading ? "opacity-50 cursor-not-allowed" : ""
//                 }`}
//                 aria-label="Export resume"
//               >
//                 <ArrowDownToLine size={16} />
//                 {isDownloading ? "Downloading..." : " Export"}
//               </button>
//               {showExportOptions && !isDownloading && (
//                 <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//                   <button
//                     onClick={() => handleExport("PDF")}
//                     className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                   >
//                     PDF
//                   </button>
//                   <button
//                     onClick={() => handleExport("DOC")}
//                     className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                   >
//                     DOC
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden">
//           {downloadError}
//         </div>
//       )}

//       {/* Zoom Controls - Right Side (Only when sidebar is open) */}
//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-end mb-3">
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-1 text-sm font-semibold text-gray-700 min-w-[38px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Preview Box */}
//       <div
//         ref={previewContainerRef}
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none"
//       >
//         <div
//           className="resume-content"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PreviewPanel; before pg no


// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   LayoutGrid,
//   BarChart2,
//   Shuffle,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import { useScore } from "../_context/ScoreContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../../api/resumeApi";

// interface PreviewPanelProps {
//   isTemplateSidebarOpen: boolean;
//   onTabClick: (tab: string) => void;
//   onOpenSidebar?: (tab: string) => void;
// }

// const tabs = [
//   { label: "Templates", icon: LayoutGrid },
//   { label: "Score", icon: BarChart2 },
//   { label: "Job Match", icon: Shuffle },
// ];

// // A4 page dimensions at 96 DPI (standard screen resolution)
// const A4_WIDTH_PX = 794; // 210mm = 794px at 96 DPI
// const A4_HEIGHT_PX = 1123; // 297mm = 1123px at 96 DPI

// const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
//   isTemplateSidebarOpen, 
//   onTabClick,
//   onOpenSidebar
// }) => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const { overallScore } = useScore();
  
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const previewContainerRef = useRef<HTMLDivElement>(null);
//   const contentRef = useRef<HTMLDivElement>(null);

//   // Calculate total pages based on A4 page height
//   useEffect(() => {
//     const calculatePages = () => {
//       if (contentRef.current && selectedTemplate) {
//         const contentHeight = contentRef.current.scrollHeight;
//         // Calculate pages based on A4 height, accounting for zoom level
//         const effectivePageHeight = A4_HEIGHT_PX;
//         const calculatedPages = Math.ceil(contentHeight / effectivePageHeight);
//         setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
//         console.log(`📄 Total pages calculated: ${calculatedPages} (Content height: ${contentHeight}px, A4 height: ${A4_HEIGHT_PX}px)`);
//       }
//     };

//     // Recalculate when template, data, or zoom changes
//     calculatePages();
    
//     // Add a slight delay to ensure content is fully rendered
//     const timer = setTimeout(calculatePages, 500);
//     return () => clearTimeout(timer);
//   }, [selectedTemplate, resumeData, zoomLevel, resumeStyle]);

//   // Track scroll position to update current page based on A4 dimensions
//   useEffect(() => {
//     const handleScroll = () => {
//       if (previewContainerRef.current && selectedTemplate) {
//         const scrollTop = previewContainerRef.current.scrollTop;
//         // Calculate which page based on A4 height and current zoom
//         const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
//         const page = Math.floor(scrollTop / effectivePageHeight) + 1;
//         setCurrentPage(Math.min(page, totalPages));
//       }
//     };

//     const container = previewContainerRef.current;
//     if (container) {
//       container.addEventListener('scroll', handleScroll);
//       return () => container.removeEventListener('scroll', handleScroll);
//     }
//   }, [selectedTemplate, totalPages, zoomLevel]);

//   // Navigate to specific page based on A4 dimensions
//   const navigateToPage = (pageNumber: number) => {
//     if (previewContainerRef.current) {
//       const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
//       const scrollPosition = (pageNumber - 1) * effectivePageHeight;
//       previewContainerRef.current.scrollTo({
//         top: scrollPosition,
//         behavior: 'smooth'
//       });
//       setCurrentPage(pageNumber);
//     }
//   };

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
    
//     try {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         throw new Error("No resume ID found. Please save your resume first.");
//       }
      
//       console.log("📥 Downloading resume:", resumeId, "Format:", type);
      
//       const format = type.toLowerCase() as "pdf" | "doc";
//       const blob = await downloadResume(resumeId, format);
      
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `resume.${format}`);
//       document.body.appendChild(link);
//       link.click();
      
//       link.remove();
//       window.URL.revokeObjectURL(url);
      
//       setShowExportOptions(false);
      
//     } catch (error) {
//       console.error("Download failed:", error);
//       const errorMessage = error instanceof Error ? error.message : "Failed to download";
//       setDownloadError(`Failed to download ${type}. ${errorMessage}`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const handleResumeScoreClick = () => {
//     if (onOpenSidebar) {
//       onOpenSidebar("Score");
//     }
//     onTabClick("Score");
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar - When Sidebar is Open */}
//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative">
//           {/* Resume Score */}
//           <div className={`flex flex-col items-center justify-center ml-6 bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold relative`}>
//             <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* PDF Preview label */}
//           <div className="text-base font-semibold text-[#2d2d2d]">
//             <span>PREVIEW</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* Export Button with Dropdown */}
//           <div className="ml-1 relative">
//             <button
//               onClick={() => setShowExportOptions((prev) => !prev)}
//               disabled={isDownloading}
//               className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                 isDownloading ? "opacity-50 cursor-not-allowed" : ""
//               }`}
//               aria-label="Export resume"
//             >
//               <ArrowDownToLine size={16} />
//               {isDownloading ? "Downloading..." : " Export"}
//             </button>
//             {showExportOptions && !isDownloading && (
//               <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//                 <button
//                   onClick={() => handleExport("PDF")}
//                   className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                 >
//                   PDF
//                 </button>
//                 <button
//                   onClick={() => handleExport("DOC")}
//                   className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                 >
//                   DOC
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Toolbar - When Sidebar is Closed */}
//       {!isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-between border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm relative">
//           {/* Left Section - Resume Score + Template Tabs */}
//           <div className="flex items-center gap-8 ml-4">
//             {/* Resume Score Button */}
//             <button
//               onClick={handleResumeScoreClick}
//               className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d4e6f7] transition cursor-pointer"
//             >
//               <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
//             </button>

//             {/* Template Tabs */}
//             <div className="flex items-center gap-2">
//               {tabs.slice(0, 1).map((tab) => {
//                 const Icon = tab.icon;
//                 return (
//                   <button
//                     key={tab.label}
//                     onClick={() => onTabClick(tab.label)}
//                     className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//                     title={tab.label}
//                   >
//                     <Icon size={16} />
//                     {tab.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Middle Section - Zoom Controls */}
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-3 text-sm font-semibold text-gray-700 min-w-[30px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>

//           {/* Right Section - Job Match + Export */}
//           <div className="flex items-center gap-8 mr-4">
//             <button
//               onClick={() => onTabClick("Job Match")}
//               className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//               title="Job Match"
//             >
//               <Shuffle size={16} />
//               Job Match
//             </button>

//             <div className="relative">
//               <button
//                 onClick={() => setShowExportOptions((prev) => !prev)}
//                 disabled={isDownloading}
//                 className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                   isDownloading ? "opacity-50 cursor-not-allowed" : ""
//                 }`}
//                 aria-label="Export resume"
//               >
//                 <ArrowDownToLine size={16} />
//                 {isDownloading ? "Downloading..." : " Export"}
//               </button>
//               {showExportOptions && !isDownloading && (
//                 <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-10">
//                   <button
//                     onClick={() => handleExport("PDF")}
//                     className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                   >
//                     PDF
//                   </button>
//                   <button
//                     onClick={() => handleExport("DOC")}
//                     className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                   >
//                     DOC
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden">
//           {downloadError}
//         </div>
//       )}

//       {/* Zoom Controls - Right Side (Only when sidebar is open) */}
//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-end mb-3">
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-1 text-sm font-semibold text-gray-700 min-w-[38px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Preview Box */}
//       <div
//         ref={previewContainerRef}
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col px-2 py-6 items-center justify-start screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none relative"
//       >
//         {/* Page Numbers - Right aligned based on A4 size */}
//         {/* 🔥 PAGE NUMBERS NOW INSIDE PREVIEW BOX */}
//         {selectedTemplate && (
//           <div className="absolute top-2 right-4 z-20 flex gap-2">
//             {Array.from({ length: totalPages }, (_, index) => index + 1).map((pg) => (
//               <button
//                 key={pg}
//                 onClick={() => navigateToPage(pg)}
//                 className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
//                   currentPage === pg
//                     ? "bg-[#2557a7] text-white shadow-md"
//                     : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                 }`}
//               >
//                 {pg}
//               </button>
//             ))}
//           </div>
//         )}

//         <div
//           ref={contentRef}
//           className="resume-content"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PreviewPanel; all fine but export button issue



// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   LayoutGrid,
//   BarChart2,
//   Shuffle,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import { useScore } from "../_context/ScoreContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../../api/resumeApi";

// interface PreviewPanelProps {
//   isTemplateSidebarOpen: boolean;
//   onTabClick: (tab: string) => void;
//   onOpenSidebar?: (tab: string) => void;
// }

// const tabs = [
//   { label: "Templates", icon: LayoutGrid },
//   { label: "Score", icon: BarChart2 },
//   { label: "Job Match", icon: Shuffle },
// ];

// // A4 page dimensions at 96 DPI (standard screen resolution)
// const A4_WIDTH_PX = 794; // 210mm = 794px at 96 DPI
// const A4_HEIGHT_PX = 1123; // 297mm = 1123px at 96 DPI

// const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
//   isTemplateSidebarOpen, 
//   onTabClick,
//   onOpenSidebar
// }) => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const { overallScore } = useScore();
  
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const previewContainerRef = useRef<HTMLDivElement>(null);
//   const contentRef = useRef<HTMLDivElement>(null);
//   const pageNavRef = useRef<HTMLDivElement>(null);

//   // Calculate total pages based on A4 page height
//   useEffect(() => {
//     const calculatePages = () => {
//       if (contentRef.current && selectedTemplate) {
//         const contentHeight = contentRef.current.scrollHeight;
//         // Calculate pages based on A4 height, accounting for zoom level
//         const effectivePageHeight = A4_HEIGHT_PX;
//         const calculatedPages = Math.ceil(contentHeight / effectivePageHeight);
//         setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
//         console.log(`📄 Total pages calculated: ${calculatedPages} (Content height: ${contentHeight}px, A4 height: ${A4_HEIGHT_PX}px)`);
//       }
//     };

//     // Recalculate when template, data, or zoom changes
//     calculatePages();
    
//     // Add a slight delay to ensure content is fully rendered
//     const timer = setTimeout(calculatePages, 500);
//     return () => clearTimeout(timer);
//   }, [selectedTemplate, resumeData, zoomLevel, resumeStyle]);

//   // Track scroll position to update current page based on A4 dimensions
//   useEffect(() => {
//     const handleScroll = () => {
//       if (previewContainerRef.current && contentRef.current && selectedTemplate) {
//         const container = previewContainerRef.current;
//         const content = contentRef.current;
        
//         // Get the position of content relative to container
//         const containerRect = container.getBoundingClientRect();
//         const contentRect = content.getBoundingClientRect();
        
//         // Calculate how much of the content has scrolled past the top of the container
//         const scrolledContent = containerRect.top - contentRect.top;
        
//         // Calculate which page based on scrolled content and A4 height with zoom
//         const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
//         const page = Math.floor(scrolledContent / effectivePageHeight) + 1;
        
//         setCurrentPage(Math.max(1, Math.min(page, totalPages)));
//       }
//     };

//     const container = previewContainerRef.current;
//     if (container) {
//       container.addEventListener('scroll', handleScroll);
//       return () => container.removeEventListener('scroll', handleScroll);
//     }
//   }, [selectedTemplate, totalPages, zoomLevel]);

//   // Navigate to specific page based on A4 dimensions
//   const navigateToPage = (pageNumber: number) => {
//     if (previewContainerRef.current && contentRef.current) {
//       // Get the bounding rect of the content to find its position
//       const containerRect = previewContainerRef.current.getBoundingClientRect();
//       const contentRect = contentRef.current.getBoundingClientRect();
      
//       // Calculate the offset from container top to content top
//       const contentOffsetFromTop = contentRect.top - containerRect.top + previewContainerRef.current.scrollTop;
      
//       // Calculate the target scroll position for the page
//       const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
//       const targetPagePosition = (pageNumber - 1) * effectivePageHeight;
      
//       // Final scroll position = content offset + target page position
//       const scrollPosition = contentOffsetFromTop + targetPagePosition;
      
//       previewContainerRef.current.scrollTo({
//         top: scrollPosition,
//         behavior: 'smooth'
//       });
//       setCurrentPage(pageNumber);
//     }
//   };

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
    
//     try {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         throw new Error("No resume ID found. Please save your resume first.");
//       }
      
//       console.log("📥 Downloading resume:", resumeId, "Format:", type);
      
//       const format = type.toLowerCase() as "pdf" | "doc";
//       const blob = await downloadResume(resumeId, format);
      
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `resume.${format}`);
//       document.body.appendChild(link);
//       link.click();
      
//       link.remove();
//       window.URL.revokeObjectURL(url);
      
//       setShowExportOptions(false);
      
//     } catch (error) {
//       console.error("Download failed:", error);
//       const errorMessage = error instanceof Error ? error.message : "Failed to download";
//       setDownloadError(`Failed to download ${type}. ${errorMessage}`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const handleResumeScoreClick = () => {
//     if (onOpenSidebar) {
//       onOpenSidebar("Score");
//     }
//     onTabClick("Score");
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-4 items-center h-[95vh] relative">
//       {/* Toolbar - When Sidebar is Open */}
//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative z-30">
//           {/* Resume Score */}
//           <div className={`flex flex-col items-center justify-center ml-6 bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold relative`}>
//             <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* PDF Preview label */}
//           <div className="text-base font-semibold text-[#2d2d2d]">
//             <span>PREVIEW</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* Export Button with Dropdown */}
//           <div className="ml-1 relative">
//             <button
//               onClick={() => setShowExportOptions((prev) => !prev)}
//               disabled={isDownloading}
//               className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                 isDownloading ? "opacity-50 cursor-not-allowed" : ""
//               }`}
//               aria-label="Export resume"
//             >
//               <ArrowDownToLine size={16} />
//               {isDownloading ? "Downloading..." : " Export"}
//             </button>
//             {showExportOptions && !isDownloading && (
//               <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-50">
//                 <button
//                   onClick={() => handleExport("PDF")}
//                   className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                 >
//                   PDF
//                 </button>
//                 <button
//                   onClick={() => handleExport("DOC")}
//                   className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                 >
//                   DOC
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Toolbar - When Sidebar is Closed */}
//       {!isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-between border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm relative z-30">
//           {/* Left Section - Resume Score + Template Tabs */}
//           <div className="flex items-center gap-8 ml-4">
//             {/* Resume Score Button */}
//             <button
//               onClick={handleResumeScoreClick}
//               className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d4e6f7] transition cursor-pointer"
//             >
//               <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
//             </button>

//             {/* Template Tabs */}
//             <div className="flex items-center gap-2">
//               {tabs.slice(0, 1).map((tab) => {
//                 const Icon = tab.icon;
//                 return (
//                   <button
//                     key={tab.label}
//                     onClick={() => onTabClick(tab.label)}
//                     className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//                     title={tab.label}
//                   >
//                     <Icon size={16} />
//                     {tab.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Middle Section - Zoom Controls */}
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-3 text-sm font-semibold text-gray-700 min-w-[30px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>

//           {/* Right Section - Job Match + Export */}
//           <div className="flex items-center gap-8 mr-4">
//             <button
//               onClick={() => onTabClick("Job Match")}
//               className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//               title="Job Match"
//             >
//               <Shuffle size={16} />
//               Job Match
//             </button>

//             <div className="relative">
//               <button
//                 onClick={() => setShowExportOptions((prev) => !prev)}
//                 disabled={isDownloading}
//                 className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                   isDownloading ? "opacity-50 cursor-not-allowed" : ""
//                 }`}
//                 aria-label="Export resume"
//               >
//                 <ArrowDownToLine size={16} />
//                 {isDownloading ? "Downloading..." : " Export"}
//               </button>
//               {showExportOptions && !isDownloading && (
//                 <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-50">
//                   <button
//                     onClick={() => handleExport("PDF")}
//                     className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                   >
//                     PDF
//                   </button>
//                   <button
//                     onClick={() => handleExport("DOC")}
//                     className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                   >
//                     DOC
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Error Message */}
//       {downloadError && (
//         <div className="w-full max-w-[100%] mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden">
//           {downloadError}
//         </div>
//       )}

//       {/* Zoom Controls - Right Side (Only when sidebar is open) */}
//       {isTemplateSidebarOpen && (
//         <div className="w-full max-w-[100%] flex items-center justify-end mb-3">
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-1 text-sm font-semibold text-gray-700 min-w-[38px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Preview Box with integrated page numbers */}
//       <div
//         ref={previewContainerRef}
//         id="resume-preview"
//         className="w-full max-w-[100%] h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none relative"
//       >
//         {/* Page Numbers - Merged with preview box, no separate border */}
//         {selectedTemplate && (
//           <div ref={pageNavRef} className="sticky top-0 z-30 bg-white">
//             <div className="flex items-center justify-end px-4 py-2 gap-2">
//               {Array.from({ length: totalPages }, (_, index) => index + 1).map((pg) => (
//                 <button
//                   key={pg}
//                   onClick={() => navigateToPage(pg)}
//                   className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
//                     currentPage === pg
//                       ? "bg-[#2557a7] text-white shadow-md"
//                       : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                   }`}
//                 >
//                   {pg}
//                 </button>
//               ))}
//             </div>
//             {/* Separator Line */}
//             <div className="w-full border-b border-gray-300"></div>
//           </div>
//         )}

//         {/* Template Content */}
//         <div
//           ref={contentRef}
//           className="resume-content px-2 py-6"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PreviewPanel; before diff widths



// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   LayoutGrid,
//   BarChart2,
//   Shuffle,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import { useScore } from "../_context/ScoreContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume } from "../../../../../api/resumeApi";

// interface PreviewPanelProps {
//   isTemplateSidebarOpen: boolean;
//   onTabClick: (tab: string) => void;
//   onOpenSidebar?: (tab: string) => void;
// }

// const tabs = [
//   { label: "Templates", icon: LayoutGrid },
//   { label: "Score", icon: BarChart2 },
//   { label: "Job Match", icon: Shuffle },
// ];

// // A4 page dimensions at 96 DPI (standard screen resolution)
// const A4_WIDTH_PX = 794; // 210mm = 794px at 96 DPI
// const A4_HEIGHT_PX = 1123; // 297mm = 1123px at 96 DPI

// const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
//   isTemplateSidebarOpen, 
//   onTabClick,
//   onOpenSidebar
// }) => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const { overallScore } = useScore();
  
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const previewContainerRef = useRef<HTMLDivElement>(null);
//   const contentRef = useRef<HTMLDivElement>(null);
//   const pageNavRef = useRef<HTMLDivElement>(null);

//   // Calculate total pages based on A4 page height
//   useEffect(() => {
//     const calculatePages = () => {
//       if (contentRef.current && selectedTemplate) {
//         const contentHeight = contentRef.current.scrollHeight;
//         // Calculate pages based on A4 height, accounting for zoom level
//         const effectivePageHeight = A4_HEIGHT_PX;
//         const calculatedPages = Math.ceil(contentHeight / effectivePageHeight);
//         setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
//         console.log(`📄 Total pages calculated: ${calculatedPages} (Content height: ${contentHeight}px, A4 height: ${A4_HEIGHT_PX}px)`);
//       }
//     };

//     // Recalculate when template, data, or zoom changes
//     calculatePages();
    
//     // Add a slight delay to ensure content is fully rendered
//     const timer = setTimeout(calculatePages, 500);
//     return () => clearTimeout(timer);
//   }, [selectedTemplate, resumeData, zoomLevel, resumeStyle]);

//   // Track scroll position to update current page based on A4 dimensions
//   useEffect(() => {
//     const handleScroll = () => {
//       if (previewContainerRef.current && contentRef.current && selectedTemplate) {
//         const container = previewContainerRef.current;
//         const content = contentRef.current;
        
//         // Get the position of content relative to container
//         const containerRect = container.getBoundingClientRect();
//         const contentRect = content.getBoundingClientRect();
        
//         // Calculate how much of the content has scrolled past the top of the container
//         const scrolledContent = containerRect.top - contentRect.top;
        
//         // Calculate which page based on scrolled content and A4 height with zoom
//         const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
//         const page = Math.floor(scrolledContent / effectivePageHeight) + 1;
        
//         setCurrentPage(Math.max(1, Math.min(page, totalPages)));
//       }
//     };

//     const container = previewContainerRef.current;
//     if (container) {
//       container.addEventListener('scroll', handleScroll);
//       return () => container.removeEventListener('scroll', handleScroll);
//     }
//   }, [selectedTemplate, totalPages, zoomLevel]);

//   // Navigate to specific page based on A4 dimensions
//   const navigateToPage = (pageNumber: number) => {
//     if (previewContainerRef.current && contentRef.current) {
//       // Get the bounding rect of the content to find its position
//       const containerRect = previewContainerRef.current.getBoundingClientRect();
//       const contentRect = contentRef.current.getBoundingClientRect();
      
//       // Calculate the offset from container top to content top
//       const contentOffsetFromTop = contentRect.top - containerRect.top + previewContainerRef.current.scrollTop;
      
//       // Calculate the target scroll position for the page
//       const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
//       const targetPagePosition = (pageNumber - 1) * effectivePageHeight;
      
//       // Final scroll position = content offset + target page position
//       const scrollPosition = contentOffsetFromTop + targetPagePosition;
      
//       previewContainerRef.current.scrollTo({
//         top: scrollPosition,
//         behavior: 'smooth'
//       });
//       setCurrentPage(pageNumber);
//     }
//   };

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
    
//     try {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         throw new Error("No resume ID found. Please save your resume first.");
//       }
      
//       console.log("📥 Downloading resume:", resumeId, "Format:", type);
      
//       const format = type.toLowerCase() as "pdf" | "doc";
//       const blob = await downloadResume(resumeId, format);
      
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `resume.${format}`);
//       document.body.appendChild(link);
//       link.click();
      
//       link.remove();
//       window.URL.revokeObjectURL(url);
      
//       setShowExportOptions(false);
      
//     } catch (error) {
//       console.error("Download failed:", error);
//       const errorMessage = error instanceof Error ? error.message : "Failed to download";
//       setDownloadError(`Failed to download ${type}. ${errorMessage}`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const handleResumeScoreClick = () => {
//     if (onOpenSidebar) {
//       onOpenSidebar("Score");
//     }
//     onTabClick("Score");
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-2 items-center h-[95vh] relative">
//       {/* Toolbar - When Sidebar is Open */}
//       {isTemplateSidebarOpen && (
//         <div 
//           className="flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative z-30 transition-all duration-300 ease-in-out"
//           style={{ 
//             width: isTemplateSidebarOpen ? '99%' : '90%',
//             // maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
//           }}
//         >
//           {/* Resume Score */}
//           <div className={`flex flex-col items-center justify-center ml-6 bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold relative`}>
//             <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* PDF Preview label */}
//           <div className="text-base font-semibold text-[#2d2d2d]">
//             <span>PREVIEW</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* Export Button with Dropdown */}
//           <div className="ml-1 relative">
//             <button
//               onClick={() => setShowExportOptions((prev) => !prev)}
//               disabled={isDownloading}
//               className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                 isDownloading ? "opacity-50 cursor-not-allowed" : ""
//               }`}
//               aria-label="Export resume"
//             >
//               <ArrowDownToLine size={16} />
//               {isDownloading ? "Downloading..." : " Export"}
//             </button>
//             {showExportOptions && !isDownloading && (
//               <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-50">
//                 <button
//                   onClick={() => handleExport("PDF")}
//                   className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                 >
//                   PDF
//                 </button>
//                 <button
//                   onClick={() => handleExport("DOC")}
//                   className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                 >
//                   DOC
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Toolbar - When Sidebar is Closed */}
//       {!isTemplateSidebarOpen && (
//         <div 
//           className="flex items-center justify-between border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm relative z-30 transition-all duration-300 ease-in-out mx-auto"
//           style={{ 
//             width: isTemplateSidebarOpen ? '99%' : '90%',
//             // maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
//           }}
//         >
//           {/* Left Section - Resume Score + Template Tabs */}
//           <div className="flex items-center gap-8 ml-4">
//             {/* Resume Score Button */}
//             <button
//               onClick={handleResumeScoreClick}
//               className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d4e6f7] transition cursor-pointer"
//             >
//               <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
//             </button>

//             {/* Template Tabs */}
//             <div className="flex items-center gap-2">
//               {tabs.slice(0, 1).map((tab) => {
//                 const Icon = tab.icon;
//                 return (
//                   <button
//                     key={tab.label}
//                     onClick={() => onTabClick(tab.label)}
//                     className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//                     title={tab.label}
//                   >
//                     <Icon size={16} />
//                     {tab.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Middle Section - Zoom Controls */}
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-3 text-sm font-semibold text-gray-700 min-w-[30px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>

//           {/* Right Section - Job Match + Export */}
//           <div className="flex items-center gap-8 mr-4">
//             <button
//               onClick={() => onTabClick("Job Match")}
//               className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//               title="Job Match"
//             >
//               <Shuffle size={16} />
//               Job Match
//             </button>

//             <div className="relative">
//               <button
//                 onClick={() => setShowExportOptions((prev) => !prev)}
//                 disabled={isDownloading}
//                 className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                   isDownloading ? "opacity-50 cursor-not-allowed" : ""
//                 }`}
//                 aria-label="Export resume"
//               >
//                 <ArrowDownToLine size={16} />
//                 {isDownloading ? "Downloading..." : " Export"}
//               </button>
//               {showExportOptions && !isDownloading && (
//                 <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-50">
//                   <button
//                     onClick={() => handleExport("PDF")}
//                     className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                   >
//                     PDF
//                   </button>
//                   <button
//                     onClick={() => handleExport("DOC")}
//                     className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                   >
//                     DOC
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Error Message */}
//       {downloadError && (
//         <div 
//           className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden transition-all duration-300 ease-in-out mx-auto"
//           style={{ 
//             width: isTemplateSidebarOpen ? '99%' : '90%',
//             // maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
//           }}
//         >
//           {downloadError}
//         </div>
//       )}

//       {/* Zoom Controls - Right Side (Only when sidebar is open) */}
//       {/* {isTemplateSidebarOpen && (
//         <div 
//           className="flex items-center justify-end mb-3 transition-all duration-300 ease-in-out"
//           style={{ 
//             width: isTemplateSidebarOpen ? '99%' : '90%',
//             // maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
//           }}
//         >
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-1 text-sm font-semibold text-gray-700 min-w-[38px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>
//         </div>
//       )} */}

//       {/* Preview Box with integrated page numbers */}
//       <div
//         ref={previewContainerRef}
//         id="resume-preview"
//         className="h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none relative transition-all duration-300 ease-in-out"
//         style={{ 
//           width: isTemplateSidebarOpen ? '99%' : '90%',
//           maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
//         }}
//       >
//         {/* Page Numbers - Merged with preview box, no separate border */}
//         {selectedTemplate && (
//           <div ref={pageNavRef} className="sticky top-0 z-30 bg-white">
//             <div className="flex items-center justify-end px-4 py-2 gap-2">
//               {Array.from({ length: totalPages }, (_, index) => index + 1).map((pg) => (
//                 <button
//                   key={pg}
//                   onClick={() => navigateToPage(pg)}
//                   className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
//                     currentPage === pg
//                       ? "bg-[#2557a7] text-white shadow-md"
//                       : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                   }`}
//                 >
//                   {pg}
//                 </button>
//               ))}
//             </div>
//             {/* Separator Line */}
//             <div className="w-full border-b border-gray-300"></div>
//           </div>
//         )}

//         {/* Template Content */}
//         <div
//           ref={contentRef}
//           className="resume-content px-2 py-6"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default PreviewPanel;
//  before publish add at export


"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Eye,
  Sparkles,
  Layout,
  Zap,
  ArrowDownToLine,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  BarChart2,
  Shuffle,
} from "lucide-react";
import { useResume } from "../_context/ResumeContext";
import { useScore } from "../_context/ScoreContext";
import TemplateOne from "./templates/TemplateOne";
import TemplateTwo from "./templates/TemplateTwo";
import TemplateThree from "./templates/TemplateThree";
import TemplateFour from "./templates/TemplateFour";
import { downloadResume } from "../../../../../api/resumeApi";

interface PreviewPanelProps {
  isTemplateSidebarOpen: boolean;
  onTabClick: (tab: string) => void;
  onOpenSidebar?: (tab: string) => void;
}

const tabs = [
  { label: "Templates", icon: LayoutGrid },
  { label: "Score", icon: BarChart2 },
  { label: "Job Match", icon: Shuffle },
];

// A4 page dimensions at 96 DPI
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  isTemplateSidebarOpen, 
  onTabClick,
  onOpenSidebar
}) => {
  const { selectedTemplate, resumeData, resumeStyle } = useResume();
  const { overallScore } = useScore();
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pageNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculatePages = () => {
      if (contentRef.current && selectedTemplate) {
        const contentHeight = contentRef.current.scrollHeight;
        const effectivePageHeight = A4_HEIGHT_PX;
        const calculatedPages = Math.ceil(contentHeight / effectivePageHeight);
        setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
        console.log(`📄 Total pages calculated: ${calculatedPages}`);
      }
    };

    calculatePages();
    const timer = setTimeout(calculatePages, 500);
    return () => clearTimeout(timer);
  }, [selectedTemplate, resumeData, zoomLevel, resumeStyle]);

  useEffect(() => {
    const handleScroll = () => {
      if (previewContainerRef.current && contentRef.current && selectedTemplate) {
        const container = previewContainerRef.current;
        const content = contentRef.current;
        
        const containerRect = container.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        
        const scrolledContent = containerRect.top - contentRect.top;
        const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
        const page = Math.floor(scrolledContent / effectivePageHeight) + 1;
        
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
      }
    };

    const container = previewContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [selectedTemplate, totalPages, zoomLevel]);

  const navigateToPage = (pageNumber: number) => {
    if (previewContainerRef.current && contentRef.current) {
      const containerRect = previewContainerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      
      const contentOffsetFromTop = contentRect.top - containerRect.top + previewContainerRef.current.scrollTop;
      const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
      const targetPagePosition = (pageNumber - 1) * effectivePageHeight;
      const scrollPosition = contentOffsetFromTop + targetPagePosition;
      
      previewContainerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
      setCurrentPage(pageNumber);
    }
  };

  const handleZoomIn = () => {
    if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
  };

  const handleExport = async (type: string) => {
    setIsDownloading(true);
    setDownloadError(null);
    
    try {
      const resumeId = localStorage.getItem("current_resume_id");
      
      if (!resumeId) {
        throw new Error("No resume ID found. Please save your resume first.");
      }
      
      console.log("📥 Downloading resume:", resumeId, "Format:", type);
      
      const format = type.toLowerCase() as "pdf" | "doc";
      const blob = await downloadResume(resumeId, format);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resume.${format}`);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setShowExportOptions(false);
      
    } catch (error) {
      console.error("Download failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to download";
      setDownloadError(`Failed to download ${type}. ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResumeScoreClick = () => {
    if (onOpenSidebar) {
      onOpenSidebar("Score");
    }
    onTabClick("Score");
  };

  // ✅ UPDATED: renderTemplate to support all 4 templates with both string and number IDs
  const renderTemplate = () => {
    console.log("🎨 Rendering template:", selectedTemplate, typeof selectedTemplate);
    
    // Template map with both string template_ids and numeric IDs
    const templateMap: { [key: string]: JSX.Element } = {
      // String-based template IDs
      'modern_minimalist': <TemplateOne data={resumeData} style={resumeStyle} />,
      'compact_professional': <TemplateTwo data={resumeData} style={resumeStyle} />,
      'minimalist_classic': <TemplateThree data={resumeData} style={resumeStyle} />,
      'professional_classic': <TemplateFour data={resumeData} style={resumeStyle} />,
      // Numeric IDs for backward compatibility
      '1': <TemplateOne data={resumeData} style={resumeStyle} />,
      '2': <TemplateTwo data={resumeData} style={resumeStyle} />,
      '3': <TemplateThree data={resumeData} style={resumeStyle} />,
      '4': <TemplateFour data={resumeData} style={resumeStyle} />,
    };

    // Get the template based on selectedTemplate
    const template = templateMap[String(selectedTemplate)];
    
    if (template) {
      console.log("✅ Template found and rendering:", selectedTemplate);
      return template;
    }

    // Default empty state
    console.log("⚠️ No template selected, showing empty state");
    return (
      <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
        <div className="mb-6">
          <span
            className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
            style={{ width: 56, height: 56 }}
          >
            <Eye className="w-7 h-7 text-[#2557a7]" />
          </span>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-700 mb-1">
            Your resume preview will appear here
          </div>
          <div className="text-gray-500 mb-6 text-sm">
            Select template and start by adding your personal information
            and professional summary to see your resume come to life.
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              AI-powered content
            </span>
            <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
              <Layout className="w-4 h-4 text-gray-800" />
              Professional templates
            </span>
            <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
              <Zap className="w-4 h-4 text-yellow-500" />
              Real-time preview
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="flex flex-col flex-1 bg-[#f8fafd] px-2 items-center h-[95vh] relative">
      {/* Toolbar - When Sidebar is Open */}
      {isTemplateSidebarOpen && (
        <div 
          className="flex items-center justify-center border border-gray-300 rounded px-2 py-.5 mb-0 gap-2 bg-white shadow-sm space-x-2 relative z-30 transition-all duration-300 ease-in-out"
          style={{ width: isTemplateSidebarOpen ? '99%' : '90%' }}
        >
          <div className={`flex flex-col items-center justify-center ml-6 bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold relative`}>
            <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
          </div>

          <div className="flex-1"></div>

          <div className="text-base font-semibold text-[#2d2d2d]">
            <span>PREVIEW</span>
          </div>

          <div className="flex-1"></div>

          <div className="ml-1 relative">
            <button
              onClick={() => setShowExportOptions((prev) => !prev)}
              disabled={isDownloading}
              className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
                isDownloading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <ArrowDownToLine size={16} />
              {isDownloading ? "Downloading..." : " Export"}
            </button>
            {showExportOptions && !isDownloading && (
              <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-50">
                <button
                  onClick={() => handleExport("PDF")}
                  className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
                >
                  PDF
                </button>
                <button
                  onClick={() => handleExport("DOC")}
                  className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
                >
                  DOC
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toolbar - When Sidebar is Closed */}
      {!isTemplateSidebarOpen && (
        <div 
          className="flex items-center justify-between rounded border border-gray-300 px-2 py-1.5 gap-2 bg-white shadow-sm relative z-30 transition-all duration-300 ease-in-out mx-auto"
          style={{ width: isTemplateSidebarOpen ? '99%' : '90%' }}
        >
          <div className="flex items-center gap-8 ml-4">
            <button
              onClick={handleResumeScoreClick}
              className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d4e6f7] transition cursor-pointer"
            >
              <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
            </button>

            <div className="flex items-center gap-2">
              {tabs.slice(0, 1).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.label}
                    onClick={() => onTabClick(tab.label)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
                    title={tab.label}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={handleZoomOut}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
            >
              <ZoomOut size={16} className="text-[#2557a7]" />
            </button>

            <div className="px-3 text-sm font-semibold text-gray-700 min-w-[30px] text-center">
              {Math.round(zoomLevel * 100)}%
            </div>

            <button
              onClick={handleZoomIn}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
            >
              <ZoomIn size={16} className="text-[#2557a7]" />
            </button>
          </div>

          <div className="flex items-center gap-8 mr-4">
            <button
              onClick={() => onTabClick("Job Match")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
            >
              <Shuffle size={16} />
              Job Match
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportOptions((prev) => !prev)}
                disabled={isDownloading}
                className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
                  isDownloading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <ArrowDownToLine size={16} />
                {isDownloading ? "Downloading..." : " Export"}
              </button>
              {showExportOptions && !isDownloading && (
                <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-50">
                  <button
                    onClick={() => handleExport("PDF")}
                    className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport("DOC")}
                    className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
                  >
                    DOC
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {downloadError && (
        <div 
          className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden transition-all duration-300 ease-in-out mx-auto"
          style={{ width: isTemplateSidebarOpen ? '99%' : '90%' }}
        >
          {downloadError}
        </div>
      )}

      <div
        ref={previewContainerRef}
        id="resume-preview"
        className="h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none relative transition-all duration-300 ease-in-out"
        style={{ 
          width: isTemplateSidebarOpen ? '99%' : '90%',
          maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
        }}
      >
        {/* {selectedTemplate && (
          <div ref={pageNavRef} className="sticky top-0 z-30 bg-white">
            <div className="flex items-center justify-end px-4 py-2 gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => navigateToPage(pg)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                    currentPage === pg
                      ? "bg-[#2557a7] text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {pg}
                </button>
              ))}
            </div>
            <div className="w-full border-b border-gray-300"></div>
          </div>
        )} */}

        <div
          ref={contentRef}
          className="resume-content px-2 py-6"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "top center",
            transition: "transform 0.3s ease-in-out",
            width: "100%",
          }}
        >
          {renderTemplate()}
        </div>
      </div>
    </section>
  );
};

export default PreviewPanel;












// "use client";
// import React, { useEffect, useState, useRef } from "react";
// import {
//   Eye,
//   Sparkles,
//   Layout,
//   Zap,
//   ArrowDownToLine,
//   ZoomIn,
//   ZoomOut,
//   LayoutGrid,
//   BarChart2,
//   Shuffle,
// } from "lucide-react";
// import { useResume } from "../_context/ResumeContext";
// import { useScore } from "../_context/ScoreContext";
// import TemplateOne from "./templates/TemplateOne";
// import TemplateTwo from "./templates/TemplateTwo";
// import { downloadResume, publishResume } from "../../../../../api/resumeApi"; // ✅ Add publishResume import

// interface PreviewPanelProps {
//   isTemplateSidebarOpen: boolean;
//   onTabClick: (tab: string) => void;
//   onOpenSidebar?: (tab: string) => void;
// }

// const tabs = [
//   { label: "Templates", icon: LayoutGrid },
//   { label: "Score", icon: BarChart2 },
//   { label: "Job Match", icon: Shuffle },
// ];

// const A4_WIDTH_PX = 794;
// const A4_HEIGHT_PX = 1123;

// const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
//   isTemplateSidebarOpen, 
//   onTabClick,
//   onOpenSidebar
// }) => {
//   const { selectedTemplate, resumeData, resumeStyle } = useResume();
//   const { overallScore } = useScore();
  
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const [showExportOptions, setShowExportOptions] = useState(false);
//   const [isDownloading, setIsDownloading] = useState(false);
//   const [isPublishing, setIsPublishing] = useState(false); // ✅ New state for publishing
//   const [downloadError, setDownloadError] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const previewContainerRef = useRef<HTMLDivElement>(null);
//   const contentRef = useRef<HTMLDivElement>(null);
//   const pageNavRef = useRef<HTMLDivElement>(null);

//   // ... (keep existing useEffect hooks for page calculation and scrolling)
//   // Calculate total pages based on A4 page height
//   useEffect(() => {
//     const calculatePages = () => {
//       if (contentRef.current && selectedTemplate) {
//         const contentHeight = contentRef.current.scrollHeight;
//         // Calculate pages based on A4 height, accounting for zoom level
//         const effectivePageHeight = A4_HEIGHT_PX;
//         const calculatedPages = Math.ceil(contentHeight / effectivePageHeight);
//         setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
//         console.log(`📄 Total pages calculated: ${calculatedPages} (Content height: ${contentHeight}px, A4 height: ${A4_HEIGHT_PX}px)`);
//       }
//     };

//     // Recalculate when template, data, or zoom changes
//     calculatePages();
    
//     // Add a slight delay to ensure content is fully rendered
//     const timer = setTimeout(calculatePages, 500);
//     return () => clearTimeout(timer);
//   }, [selectedTemplate, resumeData, zoomLevel, resumeStyle]);

//   // Track scroll position to update current page based on A4 dimensions
//   useEffect(() => {
//     const handleScroll = () => {
//       if (previewContainerRef.current && contentRef.current && selectedTemplate) {
//         const container = previewContainerRef.current;
//         const content = contentRef.current;
        
//         // Get the position of content relative to container
//         const containerRect = container.getBoundingClientRect();
//         const contentRect = content.getBoundingClientRect();
        
//         // Calculate how much of the content has scrolled past the top of the container
//         const scrolledContent = containerRect.top - contentRect.top;
        
//         // Calculate which page based on scrolled content and A4 height with zoom
//         const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
//         const page = Math.floor(scrolledContent / effectivePageHeight) + 1;
        
//         setCurrentPage(Math.max(1, Math.min(page, totalPages)));
//       }
//     };

//     const container = previewContainerRef.current;
//     if (container) {
//       container.addEventListener('scroll', handleScroll);
//       return () => container.removeEventListener('scroll', handleScroll);
//     }
//   }, [selectedTemplate, totalPages, zoomLevel]);

//   // Navigate to specific page based on A4 dimensions
//   const navigateToPage = (pageNumber: number) => {
//     if (previewContainerRef.current && contentRef.current) {
//       // Get the bounding rect of the content to find its position
//       const containerRect = previewContainerRef.current.getBoundingClientRect();
//       const contentRect = contentRef.current.getBoundingClientRect();
      
//       // Calculate the offset from container top to content top
//       const contentOffsetFromTop = contentRect.top - containerRect.top + previewContainerRef.current.scrollTop;
      
//       // Calculate the target scroll position for the page
//       const effectivePageHeight = A4_HEIGHT_PX * zoomLevel;
//       const targetPagePosition = (pageNumber - 1) * effectivePageHeight;
      
//       // Final scroll position = content offset + target page position
//       const scrollPosition = contentOffsetFromTop + targetPagePosition;
      
//       previewContainerRef.current.scrollTo({
//         top: scrollPosition,
//         behavior: 'smooth'
//       });
//       setCurrentPage(pageNumber);
//     }
//   };

//   const handleZoomIn = () => {
//     if (zoomLevel < 1.5) setZoomLevel((prev) => +(prev + 0.1).toFixed(1));
//   };

//   const handleZoomOut = () => {
//     if (zoomLevel > 0.5) setZoomLevel((prev) => +(prev - 0.1).toFixed(1));
//   };

//   // ✅ NEW: Publish API call function
//   const handlePublish = async (resumeId: string): Promise<boolean> => {
//     try {
//       console.log("📤 Publishing resume:", resumeId);
//       await publishResume(resumeId); // Your publish API function
//       console.log("✅ Resume published successfully");
//       return true;
//     } catch (error) {
//       console.error("❌ Publish failed:", error);
//       const errorMessage = error instanceof Error ? error.message : "Failed to publish resume";
//       setDownloadError(errorMessage);
//       return false;
//     }
//   };

//   // ✅ UPDATED: Export button handler - publishes first, then shows dropdown
//   const handleExportClick = async () => {
//     // Don't proceed if already publishing or downloading
//     if (isPublishing || isDownloading) return;

//     const resumeId = localStorage.getItem("current_resume_id");
    
//     if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//       setDownloadError("No resume ID found. Please save your resume first.");
//       return;
//     }

//     // ✅ Step 1: Publish resume first
//     setIsPublishing(true);
//     setDownloadError(null);
    
//     const publishSuccess = await handlePublish(resumeId);
    
//     setIsPublishing(false);

//     // ✅ Step 2: Only show dropdown if publish succeeded
//     if (publishSuccess) {
//       setShowExportOptions(true);
//     } else {
//       setDownloadError("Failed to publish resume. Please try again.");
//     }
//   };

//   // ✅ UPDATED: Download function - only downloads (publish already done)
//   const handleExport = async (type: string) => {
//     setIsDownloading(true);
//     setDownloadError(null);
    
//     try {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         throw new Error("No resume ID found. Please save your resume first.");
//       }
      
//       console.log("📥 Downloading resume:", resumeId, "Format:", type);
      
//       const format = type.toLowerCase() as "pdf" | "doc";
//       const blob = await downloadResume(resumeId, format);
      
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `resume.${format}`);
//       document.body.appendChild(link);
//       link.click();
      
//       link.remove();
//       window.URL.revokeObjectURL(url);
      
//       setShowExportOptions(false);
      
//     } catch (error) {
//       console.error("Download failed:", error);
//       const errorMessage = error instanceof Error ? error.message : "Failed to download";
//       setDownloadError(`Failed to download ${type}. ${errorMessage}`);
//     } finally {
//       setIsDownloading(false);
//     }
//   };

//   const handleResumeScoreClick = () => {
//     if (onOpenSidebar) {
//       onOpenSidebar("Score");
//     }
//     onTabClick("Score");
//   };

//   const renderTemplate = () => {
//     switch (selectedTemplate) {
//       case 1:
//         return <TemplateOne data={resumeData} style={resumeStyle} />;
//       case 2:
//         return <TemplateTwo data={resumeData} style={resumeStyle} />;
//       default:
//         return (
//           <div className="w-full max-w-[100%] min-h-[800px] bg-white rounded-xl shadow-lg flex flex-col px-2 py-14 items-center">
//             {/* ... empty state content ... */}
// 	    <div className="mb-6">
//               <span
//                 className="inline-flex items-center justify-center rounded-full bg-blue-50 shadow-sm"
//                 style={{ width: 56, height: 56 }}
//               >
//                 <Eye className="w-7 h-7 text-[#2557a7]" />
//               </span>
//             </div>
//             <div className="text-center">
//               <div className="text-lg font-bold text-gray-700 mb-1">
//                 Your resume preview will appear here
//               </div>
//               <div className="text-gray-500 mb-6 text-sm">
//                 Select template and start by adding your personal information
//                 and professional summary to see your resume come to life.
//               </div>
//               <div className="flex justify-center gap-2 flex-wrap">
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Sparkles className="w-4 h-4 text-yellow-500" />
//                   AI-powered content
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Layout className="w-4 h-4 text-gray-800" />
//                   Professional templates
//                 </span>
//                 <span className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 font-medium shadow-sm">
//                   <Zap className="w-4 h-4 text-yellow-500" />
//                   Real-time preview
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <section className="flex flex-col flex-1 bg-[#f8fafd] px-1 items-center h-[95vh] relative">
//       {/* Toolbar - When Sidebar is Open */}
//       {isTemplateSidebarOpen && (
//         <div 
//           className="flex items-center justify-center border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm space-x-2 relative z-30 transition-all duration-300 ease-in-out"
//           style={{ 
//             width: isTemplateSidebarOpen ? '100%' : '90%',
//             maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
//           }}
//         >
//           <div className={`flex flex-col items-center justify-center ml-6 bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold relative`}>
//             <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
//           </div>

//           <div className="flex-1"></div>

//           <div className="text-base font-semibold text-[#2d2d2d]">
//             <span>PREVIEW</span>
//           </div>

//           <div className="flex-1"></div>

//           {/* ✅ UPDATED: Export Button with publish loading state */}
//           <div className="ml-1 relative">
//             <button
//               onClick={handleExportClick}
//               disabled={isDownloading || isPublishing}
//               className={`flex items-center gap-1 mr-6 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                 (isDownloading || isPublishing) ? "opacity-50 cursor-not-allowed" : ""
//               }`}
//               aria-label="Export resume"
//             >
//               <ArrowDownToLine size={16} />
//               {isPublishing ? "Publishing..." : isDownloading ? "Downloading..." : " Export"}
//             </button>
//             {showExportOptions && !isDownloading && !isPublishing && (
//               <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-50">
//                 <button
//                   onClick={() => handleExport("PDF")}
//                   className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                 >
//                   PDF
//                 </button>
//                 <button
//                   onClick={() => handleExport("DOC")}
//                   className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                 >
//                   DOC
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Toolbar - When Sidebar is Closed */}
//       {!isTemplateSidebarOpen && (
//         <div 
//           className="flex items-center justify-between border border-gray-300 rounded px-2 py-3 mt-1 mb-3 gap-2 bg-white shadow-sm relative z-30 transition-all duration-300 ease-in-out mx-auto"
//           style={{ 
//             width: isTemplateSidebarOpen ? '100%' : '90%',
//             maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
//           }}
//         >
//           {/* Left Section */}
//           <div className="flex items-center gap-8 ml-4">
//             <button
//               onClick={handleResumeScoreClick}
//               className="flex flex-col items-center justify-center bg-[#e8eff9] border border-[#c9dcf2] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-[#d4e6f7] transition cursor-pointer"
//             >
//               <span className="text-[#2d2d2d]">{`Resume Score ${overallScore}%`}</span>
//             </button>

//             <div className="flex items-center gap-2">
//               {tabs.slice(0, 1).map((tab) => {
//                 const Icon = tab.icon;
//                 return (
//                   <button
//                     key={tab.label}
//                     onClick={() => onTabClick(tab.label)}
//                     className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//                     title={tab.label}
//                   >
//                     <Icon size={16} />
//                     {tab.label}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Middle Section - Zoom Controls */}
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-3 text-sm font-semibold text-gray-700 min-w-[30px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>

//           {/* Right Section */}
//           <div className="flex items-center gap-8 mr-4">
//             <button
//               onClick={() => onTabClick("Job Match")}
//               className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:text-[#2557a7] hover:bg-gray-100 rounded-lg transition"
//               title="Job Match"
//             >
//               <Shuffle size={16} />
//               Job Match
//             </button>

//             {/* ✅ UPDATED: Export button with publish state */}
//             <div className="relative">
//               <button
//                 onClick={handleExportClick}
//                 disabled={isDownloading || isPublishing}
//                 className={`flex items-center gap-1 bg-[#2557a7] rounded-lg px-5 py-1.5 text-[#ffffff] text-xs font-semibold hover:bg-[#1f4e98] transition ${
//                   (isDownloading || isPublishing) ? "opacity-50 cursor-not-allowed" : ""
//                 }`}
//                 aria-label="Export resume"
//               >
//                 <ArrowDownToLine size={16} />
//                 {isPublishing ? "Publishing..." : isDownloading ? "Downloading..." : " Export"}
//               </button>
//               {showExportOptions && !isDownloading && !isPublishing && (
//                 <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-50">
//                   <button
//                     onClick={() => handleExport("PDF")}
//                     className="w-full px-3 py-2 text-left text-[#2557a7] text-sm hover:bg-gray-100"
//                   >
//                     PDF
//                   </button>
//                   <button
//                     onClick={() => handleExport("DOC")}
//                     className="w-full px-3 py-2 text-left text-sm text-[#2557a7] hover:bg-gray-100"
//                   >
//                     DOC
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Error Message */}
//       {downloadError && (
//         <div 
//           className="mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm screen:block print:hidden transition-all duration-300 ease-in-out mx-auto"
//           style={{ 
//             width: isTemplateSidebarOpen ? '100%' : '90%',
//             maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
//           }}
//         >
//           {downloadError}
//         </div>
//       )}

//       {/* Rest of your component remains the same */}
//       {/* ... zoom controls, preview box, etc ... */}
//       {/* Zoom Controls - Right Side (Only when sidebar is open) */}
//       {isTemplateSidebarOpen && (
//         <div 
//           className="flex items-center justify-end mb-3 transition-all duration-300 ease-in-out"
//           style={{ 
//             width: isTemplateSidebarOpen ? '99%' : '90%',
//             // maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
//           }}
//         >
//           <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
//             <button
//               onClick={handleZoomOut}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom out"
//             >
//               <ZoomOut size={16} className="text-[#2557a7]" />
//             </button>

//             <div className="px-1 text-sm font-semibold text-gray-700 min-w-[38px] text-center">
//               {Math.round(zoomLevel * 100)}%
//             </div>

//             <button
//               onClick={handleZoomIn}
//               className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition"
//               aria-label="Zoom in"
//             >
//               <ZoomIn size={16} className="text-[#2557a7]" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Preview Box with integrated page numbers */}
//       <div
//         ref={previewContainerRef}
//         id="resume-preview"
//         className="h-[900px] overflow-y-auto bg-white rounded-xl shadow-lg mx-auto flex flex-col screen:overflow-auto print:overflow-visible print:h-auto print:shadow-none relative transition-all duration-300 ease-in-out"
//         style={{ 
//           width: isTemplateSidebarOpen ? '99%' : '90%',
//           maxWidth: isTemplateSidebarOpen ? '100%' : '1400px'
//         }}
//       >
//         {/* Page Numbers - Merged with preview box, no separate border */}
//         {selectedTemplate && (
//           <div ref={pageNavRef} className="sticky top-0 z-30 bg-white">
//             <div className="flex items-center justify-end px-4 py-2 gap-2">
//               {Array.from({ length: totalPages }, (_, index) => index + 1).map((pg) => (
//                 <button
//                   key={pg}
//                   onClick={() => navigateToPage(pg)}
//                   className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
//                     currentPage === pg
//                       ? "bg-[#2557a7] text-white shadow-md"
//                       : "bg-gray-200 text-gray-700 hover:bg-gray-300"
//                   }`}
//                 >
//                   {pg}
//                 </button>
//               ))}
//             </div>
//             {/* Separator Line */}
//             <div className="w-full border-b border-gray-300"></div>
//           </div>
//         )}

//         {/* Template Content */}
//         <div
//           ref={contentRef}
//           className="resume-content px-2 py-6"
//           style={{
//             transform: `scale(${zoomLevel})`,
//             transformOrigin: "top center",
//             transition: "transform 0.3s ease-in-out",
//             width: "100%",
//           }}
//         >
//           {renderTemplate()}
//         </div>
//       </div>

//     </section>
//   );
// };

// export default PreviewPanel;







