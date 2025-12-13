// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useResume } from "../../_context/ResumeContext";
// const templates = [
//   { id: 1, subtitle: "Modern", imgSrc: "/assets/templates/template-1.png", atsFriendly: true },
//   { id: 2, subtitle: "Classic", imgSrc: "/assets/templates/template-2.png", atsFriendly: true },
// ];
// const TemplatesTab: React.FC = () => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);
//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();
//   // categories
//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];
//   // filter templates
//   const filteredTemplates = templates.filter((tpl) => {
//     const matchCategory = selectedCategory === "All" || tpl.subtitle === selectedCategory;
//     const matchSearch = tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchCategory && matchSearch;
//   });
//   // close dropdown if click outside
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);
//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-orange-400 placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}
//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         {/* Categories Dropdown */}
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-orange-50 text-orange-500 border-orange-200"
//                 : "text-gray-700 hover:text-orange-500 hover:bg-orange-100 hover:border-orange-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>
//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-orange-100 ${
//                     selectedCategory === cat ? "bg-orange-50 text-orange-600" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//         {/* Style Button */}
//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-orange-50 text-orange-500 border-orange-200"
//               : "text-gray-700 hover:text-orange-500 hover:bg-orange-100 hover:border-orange-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>
//       {/* Main Content */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-1 gap-x-4 gap-y-4 mb-6">
//           {filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.id}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   selectedTemplate === tpl.id
//                     ? "border-orange-500"
//                     : "border-gray-200"
//                 } bg-white overflow-hidden`}
//               >
//                 {/* ATS Friendly Badge - shows only if template is ATS friendly */}
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-orange-500">
//                     100% ATS Friendly
//                   </span>
//                 )}
//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-48 object-contain bg-gray-100"
//                 />
//                 <div className="w-full px-2 py-1 flex flex-col items-center">
//                   <button
//                     onClick={() => setSelectedTemplate(tpl.id)}
//                     className={`mt-2 w-full rounded py-1 text-xs font-semibold transition ${
//                       selectedTemplate === tpl.id
//                         ? "bg-orange-500 text-white"
//                         : "bg-gray-100 border border-gray-200 text-gray-800 hover:bg-orange-100 hover:text-orange-500"
//                     }`}
//                   >
//                     {selectedTemplate === tpl.id ? "Selected" : "Use Template"}
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center">
//               No templates found
//             </div>
//           )}
//         </div>
//       ) : (
//         // <div className="flex flex-col gap-3 text-gray-700">
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             {/* <label className="text-xs font-medium">Font Family</label> */}
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//             //   className="w-full border rounded px-2 py-1 text-sm"
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-orange-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>
//           {/* Typography Scale */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            {/* <span className="w-2 h-2 rounded-full"></span> */}
//            Typography Scale
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Name Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="20"
//                  max="48"
//                  value={parseInt(resumeStyle.nameFontSize) || 28}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.nameFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none"
//                />
//              </div>
//            </div>
//            {/* Heading Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="12"
//                  max="24"
//                  value={parseInt(resumeStyle.headingFontSize) || 18}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.headingFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none"
//                />
//              </div>
//            </div> 
//            {/* Body Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="10"
//                  max="16"
//                  value={parseInt(resumeStyle.bodyFontSize) || 14}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.bodyFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none"
//                />
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Text Formatting */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//          <div className="flex gap-2">
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                resumeStyle.bold 
//                  ? "bg-orange-100 border-orange-300 text-orange-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              B
//            </button>
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                resumeStyle.italic 
//                  ? "bg-orange-100 border-orange-300 text-orange-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              I
//            </button>
//          </div>
//        </div>
//        {/* Line Spacing */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//          <div className="flex items-center gap-2">
//            <input
//              type="range"
//              min="1"
//              max="2.5"
//              step="0.1"
//              value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//            />
//            <input
//              type="text"
//              value={resumeStyle.lineSpacing}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none transition-all duration-200"
//            />
//          </div>
//          <div className="flex justify-between text-xs text-gray-500 mt-1">
//            <span>Tight</span>
//            <span>Normal</span>
//            <span>Loose</span>
//          </div>
//        </div> 
//        {/* Color Palette */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            {/* <span className="w-2 h-2 bg-blue-400 rounded-full"></span> */}
//            Color Palette
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Heading Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="color"
//                  value={resumeStyle.headingColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-orange-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.headingColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-orange-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              {/* Color Presets for Headings */}
//              <div className="flex gap-1 mt-2">
//                {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                  <button key={color} style={{ backgroundColor: color }}
//                    onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                  />
//                ))}
//              </div>
//            </div>
//            {/* Body Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//              <div className="flex items-center gap-2">
//                <input type="color" value={resumeStyle.bodyColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-orange-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.bodyColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-orange-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              {/* Color Presets for Body */}
//              <div className="flex gap-1 mt-2">
//                {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                  <button
//                    key={color}
//                    onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                    style={{ backgroundColor: color }}
//                  />
//                ))}
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Quick Presets */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//          <div className="grid grid-cols-2 gap-2">
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Inter, sans-serif', nameFontSize: '32px', headingFontSize: '18px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#1f2937', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
//            >
//              Modern
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Playfair Display, serif', nameFontSize: '36px', headingFontSize: '20px', bodyFontSize: '14px', lineSpacing: '1.6', headingColor: '#0f172a', bodyColor: '#1f2937'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
//            >
//              Classic
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                 fontFamily: 'Roboto, sans-serif', nameFontSize: '28px', headingFontSize: '16px', bodyFontSize: '13px', lineSpacing: '1.4', headingColor: '#1e40af', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
//            >
//              Corporate
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Open Sans, sans-serif', nameFontSize: '30px', headingFontSize: '17px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#059669', bodyColor: '#4b5563'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
//            >
//              Creative
//            </button>
//          </div>
//        </div>
//         </div>
//       )}
//     </>
//   );
// };
// export default TemplatesTab; 


// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useResume } from "../../_context/ResumeContext";

// // ✅ Define props type
// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// const templates = [
//   { id: 1, subtitle: "Modern", imgSrc: "/assets/templates/template-1.png", atsFriendly: true },
//   { id: 2, subtitle: "Classic", imgSrc: "/assets/templates/template-2.png", atsFriendly: true },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   const filteredTemplates = templates.filter((tpl) => {
//     const matchCategory = selectedCategory === "All" || tpl.subtitle === selectedCategory;
//     const matchSearch = tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchCategory && matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-orange-400 placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-orange-50 text-orange-500 border-orange-200"
//                 : "text-gray-700 hover:text-orange-500 hover:bg-orange-100 hover:border-orange-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-orange-100 ${
//                     selectedCategory === cat ? "bg-orange-50 text-orange-600" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-orange-50 text-orange-500 border-orange-200"
//               : "text-gray-700 hover:text-orange-500 hover:bg-orange-100 hover:border-orange-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Main Content */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-1 gap-x-4 gap-y-4 mb-6">
//           {filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.id}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   selectedTemplate === tpl.id ? "border-orange-500" : "border-gray-200"
//                 } bg-white overflow-hidden`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-orange-500">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-48 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-1 flex flex-col items-center">
//                   <button
//                     onClick={() => {
//                       setSelectedTemplate(tpl.id);
//                       if (onTemplateSelect) onTemplateSelect(); // ✅ call prop when selected
//                     }}
//                     className={`mt-2 w-full rounded py-1 text-xs font-semibold transition ${
//                       selectedTemplate === tpl.id
//                         ? "bg-orange-500 text-white"
//                         : "bg-gray-100 border border-gray-200 text-gray-800 hover:bg-orange-100 hover:text-orange-500"
//                     }`}
//                   >
//                     {selectedTemplate === tpl.id ? "Selected" : "Use Template"}
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center">No templates found</div>
//           )}
//         </div>
//       ) : (
//         // ✅ All your style controls remain unchanged
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             {/* <label className="text-xs font-medium">Font Family</label> */}
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//             //   className="w-full border rounded px-2 py-1 text-sm"
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-orange-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>
//           {/* Typography Scale */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            {/* <span className="w-2 h-2 rounded-full"></span> */}
//            Typography Scale
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Name Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="20"
//                  max="48"
//                  value={parseInt(resumeStyle.nameFontSize) || 28}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.nameFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none"
//                />
//              </div>
//            </div>
//            {/* Heading Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="12"
//                  max="24"
//                  value={parseInt(resumeStyle.headingFontSize) || 18}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.headingFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none"
//                />
//              </div>
//            </div> 
//            {/* Body Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="10"
//                  max="16"
//                  value={parseInt(resumeStyle.bodyFontSize) || 14}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.bodyFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none"
//                />
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Text Formatting */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//          <div className="flex gap-2">
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                resumeStyle.bold 
//                  ? "bg-orange-100 border-orange-300 text-orange-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              B
//            </button>
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                resumeStyle.italic 
//                  ? "bg-orange-100 border-orange-300 text-orange-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              I
//            </button>
//          </div>
//        </div>
//        {/* Line Spacing */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//          <div className="flex items-center gap-2">
//            <input
//              type="range"
//              min="1"
//              max="2.5"
//              step="0.1"
//              value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//            />
//            <input
//              type="text"
//              value={resumeStyle.lineSpacing}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none transition-all duration-200"
//            />
//          </div>
//          <div className="flex justify-between text-xs text-gray-500 mt-1">
//            <span>Tight</span>
//            <span>Normal</span>
//            <span>Loose</span>
//          </div>
//        </div> 
//        {/* Color Palette */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            {/* <span className="w-2 h-2 bg-blue-400 rounded-full"></span> */}
//            Color Palette
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Heading Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="color"
//                  value={resumeStyle.headingColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-orange-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.headingColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-orange-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              {/* Color Presets for Headings */}
//              <div className="flex gap-1 mt-2">
//                {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                  <button key={color} style={{ backgroundColor: color }}
//                    onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                  />
//                ))}
//              </div>
//            </div>
//            {/* Body Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//              <div className="flex items-center gap-2">
//                <input type="color" value={resumeStyle.bodyColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-orange-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.bodyColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-orange-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              {/* Color Presets for Body */}
//              <div className="flex gap-1 mt-2">
//                {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                  <button
//                    key={color}
//                    onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                    style={{ backgroundColor: color }}
//                  />
//                ))}
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Quick Presets */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//          <div className="grid grid-cols-2 gap-2">
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Inter, sans-serif', nameFontSize: '32px', headingFontSize: '18px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#1f2937', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
//            >
//              Modern
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Playfair Display, serif', nameFontSize: '36px', headingFontSize: '20px', bodyFontSize: '14px', lineSpacing: '1.6', headingColor: '#0f172a', bodyColor: '#1f2937'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
//            >
//              Classic
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                 fontFamily: 'Roboto, sans-serif', nameFontSize: '28px', headingFontSize: '16px', bodyFontSize: '13px', lineSpacing: '1.4', headingColor: '#1e40af', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
//            >
//              Corporate
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Open Sans, sans-serif', nameFontSize: '30px', headingFontSize: '17px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#059669', bodyColor: '#4b5563'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
//            >
//              Creative
//            </button>
//          </div>
//        </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab; before autoclose


// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useResume } from "../../_context/ResumeContext";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// const templates = [
//   { id: 1, subtitle: "Modern", imgSrc: "/assets/templates/template-1.png", atsFriendly: true },
//   { id: 2, subtitle: "Classic", imgSrc: "/assets/templates/template-2.png", atsFriendly: true },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   const filteredTemplates = templates.filter((tpl) => {
//     const matchCategory = selectedCategory === "All" || tpl.subtitle === selectedCategory;
//     const matchSearch = tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchCategory && matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-1 gap-x-4 gap-y-4 mb-6">
//           {filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.id}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   selectedTemplate === tpl.id ? "border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-48 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-1 flex flex-col items-center">
//                   <button
//                     onClick={() => {
//                       setSelectedTemplate(tpl.id);
//                       if (onTemplateSelect) onTemplateSelect(); // ✅ instantly close sidebar
//                     }}
//                     className={`mt-2 w-full rounded py-1 text-xs font-semibold transition ${
//                       selectedTemplate === tpl.id
//                         ? "bg-[#2557a7] text-white"
//                         : "bg-gray-100 border border-gray-200 text-gray-800 hover:bg-blue-100 hover:text-[#2557a7]"
//                     }`}
//                   >
//                     {selectedTemplate === tpl.id ? "Selected" : "Use Template"}
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center">
//               No templates found
//             </div>
//           )}
//         </div>
//       ) : (
//         // 🎨 Style controls (unchanged)
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             {/* <label className="text-xs font-medium">Font Family</label> */}
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//             //   className="w-full border rounded px-2 py-1 text-sm"
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>
//           {/* Typography Scale */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            {/* <span className="w-2 h-2 rounded-full"></span> */}
//            Typography Scale
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Name Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="20"
//                  max="48"
//                  value={parseInt(resumeStyle.nameFontSize) || 28}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.nameFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div>
//            {/* Heading Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="12"
//                  max="24"
//                  value={parseInt(resumeStyle.headingFontSize) || 18}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.headingFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div> 
//            {/* Body Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="10"
//                  max="16"
//                  value={parseInt(resumeStyle.bodyFontSize) || 12}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.bodyFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Text Formatting */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//          <div className="flex gap-2">
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                resumeStyle.bold 
//                  ? "bg-blue-100 border-blue-300 text-blue-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              B
//            </button>
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                resumeStyle.italic 
//                  ? "bg-blue-100 border-blue-300 text-blue-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              I
//            </button>
//          </div>
//        </div>
//        {/* Line Spacing */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//          <div className="flex items-center gap-2">
//            <input
//              type="range"
//              min="1"
//              max="2.5"
//              step="0.1"
//              value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//            />
//            <input
//              type="text"
//              value={resumeStyle.lineSpacing}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//            />
//          </div>
//          <div className="flex justify-between text-xs text-gray-500 mt-1">
//            <span>Tight</span>
//            <span>Normal</span>
//            <span>Loose</span>
//          </div>
//        </div> 
//        {/* Color Palette */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            {/* <span className="w-2 h-2 bg-blue-400 rounded-full"></span> */}
//            Color Palette
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Heading Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="color"
//                  value={resumeStyle.headingColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.headingColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              {/* Color Presets for Headings */}
//              <div className="flex gap-1 mt-2">
//                {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                  <button key={color} style={{ backgroundColor: color }}
//                    onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                  />
//                ))}
//              </div>
//            </div>
//            {/* Body Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//              <div className="flex items-center gap-2">
//                <input type="color" value={resumeStyle.bodyColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.bodyColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              {/* Color Presets for Body */}
//              <div className="flex gap-1 mt-2">
//                {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                  <button
//                    key={color}
//                    onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                    style={{ backgroundColor: color }}
//                  />
//                ))}
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Quick Presets */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//          <div className="grid grid-cols-2 gap-2">
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Inter, sans-serif', nameFontSize: '32px', headingFontSize: '18px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#1f2937', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-bluee-50 transition-all duration-200"
//            >
//              Modern
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Playfair Display, serif', nameFontSize: '36px', headingFontSize: '20px', bodyFontSize: '14px', lineSpacing: '1.6', headingColor: '#0f172a', bodyColor: '#1f2937'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Classic
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                 fontFamily: 'Roboto, sans-serif', nameFontSize: '28px', headingFontSize: '16px', bodyFontSize: '13px', lineSpacing: '1.4', headingColor: '#1e40af', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Corporate
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Open Sans, sans-serif', nameFontSize: '30px', headingFontSize: '17px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#059669', bodyColor: '#4b5563'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Creative
//            </button>
//          </div>
//        </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab; before section open temp auto 


// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useResume } from "../../_context/ResumeContext";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// const templates = [
//   { id: 1, subtitle: "Modern", imgSrc: "/assets/templates/template-1.png", atsFriendly: true },
//   { id: 2, subtitle: "Classic", imgSrc: "/assets/templates/template-2.png", atsFriendly: true },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   const filteredTemplates = templates.filter((tpl) => {
//     const matchCategory = selectedCategory === "All" || tpl.subtitle === selectedCategory;
//     const matchSearch = tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchCategory && matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-1 gap-x-4 gap-y-4 mb-6">
//           {filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.id}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   selectedTemplate === tpl.id ? "border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-48 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-1 flex flex-col items-center">
//                   <button
//                     onClick={() => {
//                       setSelectedTemplate(tpl.id);
//                       if (onTemplateSelect) onTemplateSelect();
//                     }}
//                     className={`mt-2 w-full rounded py-1 text-xs font-semibold transition ${
//                       selectedTemplate === tpl.id
//                         ? "bg-[#2557a7] text-white"
//                         : "bg-gray-100 border border-gray-200 text-gray-800 hover:bg-blue-100 hover:text-[#2557a7]"
//                     }`}
//                   >
//                     {selectedTemplate === tpl.id ? "Selected" : "Use Template"}
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center">
//               No templates found
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>
//           {/* Typography Scale */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            Typography Scale
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Name Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="20"
//                  max="48"
//                  value={parseInt(resumeStyle.nameFontSize) || 28}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.nameFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div>
//            {/* Heading Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="12"
//                  max="24"
//                  value={parseInt(resumeStyle.headingFontSize) || 18}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.headingFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div> 
//            {/* Body Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="10"
//                  max="16"
//                  value={parseInt(resumeStyle.bodyFontSize) || 12}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.bodyFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Text Formatting */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//          <div className="flex gap-2">
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                resumeStyle.bold 
//                  ? "bg-blue-100 border-blue-300 text-blue-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              B
//            </button>
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                resumeStyle.italic 
//                  ? "bg-blue-100 border-blue-300 text-blue-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              I
//            </button>
//          </div>
//        </div>
//        {/* Line Spacing */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//          <div className="flex items-center gap-2">
//            <input
//              type="range"
//              min="1"
//              max="2.5"
//              step="0.1"
//              value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//            />
//            <input
//              type="text"
//              value={resumeStyle.lineSpacing}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//            />
//          </div>
//          <div className="flex justify-between text-xs text-gray-500 mt-1">
//            <span>Tight</span>
//            <span>Normal</span>
//            <span>Loose</span>
//          </div>
//        </div> 
//        {/* Color Palette */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            Color Palette
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Heading Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="color"
//                  value={resumeStyle.headingColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.headingColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              {/* Color Presets for Headings */}
//              <div className="flex gap-1 mt-2">
//                {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                  <button key={color} style={{ backgroundColor: color }}
//                    onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                  />
//                ))}
//              </div>
//            </div>
//            {/* Body Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//              <div className="flex items-center gap-2">
//                <input type="color" value={resumeStyle.bodyColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.bodyColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              {/* Color Presets for Body */}
//              <div className="flex gap-1 mt-2">
//                {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                  <button
//                    key={color}
//                    onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                    style={{ backgroundColor: color }}
//                  />
//                ))}
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Quick Presets */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//          <div className="grid grid-cols-2 gap-2">
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Inter, sans-serif', nameFontSize: '32px', headingFontSize: '18px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#1f2937', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-bluee-50 transition-all duration-200"
//            >
//              Modern
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Playfair Display, serif', nameFontSize: '36px', headingFontSize: '20px', bodyFontSize: '14px', lineSpacing: '1.6', headingColor: '#0f172a', bodyColor: '#1f2937'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Classic
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                 fontFamily: 'Roboto, sans-serif', nameFontSize: '28px', headingFontSize: '16px', bodyFontSize: '13px', lineSpacing: '1.4', headingColor: '#1e40af', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Corporate
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Open Sans, sans-serif', nameFontSize: '30px', headingFontSize: '17px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#059669', bodyColor: '#4b5563'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Creative
//            </button>
//          </div>
//        </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab;


// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useResume } from "../../_context/ResumeContext";
// import { getTemplateById } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// const templates = [
//   { id: 1, subtitle: "Modern", imgSrc: "/assets/templates/template-1.png", atsFriendly: true },
//   { id: 2, subtitle: "Classic", imgSrc: "/assets/templates/template-2.png", atsFriendly: true },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   const filteredTemplates = templates.filter((tpl) => {
//     const matchCategory = selectedCategory === "All" || tpl.subtitle === selectedCategory;
//     const matchSearch = tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchCategory && matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleTemplateSelection = async (templateId: number) => {
//     try {
//       setIsLoadingTemplate(true);
//       console.log("🎨 Selecting template:", templateId);

//       // Fetch template details from API
//       const templateData = await getTemplateById(templateId);
      
//       console.log("✅ Template data fetched:", templateData);
      
//       // Set the selected template
//       setSelectedTemplate(templateId);
      
//       // Optionally update resume style based on template data
//       // You can extend this based on what your API returns
//       if (templateData.name) {
//         console.log(`📝 Template "${templateData.name}" applied`);
//       }
      
//       toast.success(`Template "${templateData.name || templateId}" selected!`);
      
//       // Call the onTemplateSelect callback
//       if (onTemplateSelect) {
//         onTemplateSelect();
//       }
      
//     } catch (error) {
//       console.error("❌ Error selecting template:", error);
//       toast.error("Failed to load template. Please try again.");
      
//       // Fallback: still set the template even if API fails
//       setSelectedTemplate(templateId);
//       if (onTemplateSelect) {
//         onTemplateSelect();
//       }
//     } finally {
//       setIsLoadingTemplate(false);
//     }
//   };

//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-1 gap-x-4 gap-y-4 mb-6">
//           {filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.id}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   selectedTemplate === tpl.id ? "border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-48 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-1 flex flex-col items-center">
//                   <button
//                     onClick={() => handleTemplateSelection(tpl.id)}
//                     disabled={isLoadingTemplate}
//                     className={`mt-2 w-full rounded py-1 text-xs font-semibold transition ${
//                       selectedTemplate === tpl.id
//                         ? "bg-[#2557a7] text-white"
//                         : "bg-gray-100 border border-gray-200 text-gray-800 hover:bg-blue-100 hover:text-[#2557a7]"
//                     } ${isLoadingTemplate ? "opacity-50 cursor-not-allowed" : ""}`}
//                   >
//                     {isLoadingTemplate && selectedTemplate === tpl.id
//                       ? "Loading..."
//                       : selectedTemplate === tpl.id
//                       ? "Selected"
//                       : "Use Template"}
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center">
//               No templates found
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>
//           {/* Typography Scale */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            Typography Scale
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Name Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="20"
//                  max="48"
//                  value={parseInt(resumeStyle.nameFontSize) || 28}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.nameFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div>
//            {/* Heading Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="12"
//                  max="24"
//                  value={parseInt(resumeStyle.headingFontSize) || 18}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.headingFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div> 
//            {/* Body Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="10"
//                  max="16"
//                  value={parseInt(resumeStyle.bodyFontSize) || 12}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.bodyFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Text Formatting */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//          <div className="flex gap-2">
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                resumeStyle.bold 
//                  ? "bg-blue-100 border-blue-300 text-blue-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              B
//            </button>
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                resumeStyle.italic 
//                  ? "bg-blue-100 border-blue-300 text-blue-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              I
//            </button>
//          </div>
//        </div>
//        {/* Line Spacing */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//          <div className="flex items-center gap-2">
//            <input
//              type="range"
//              min="1"
//              max="2.5"
//              step="0.1"
//              value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//            />
//            <input
//              type="text"
//              value={resumeStyle.lineSpacing}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//            />
//          </div>
//          <div className="flex justify-between text-xs text-gray-500 mt-1">
//            <span>Tight</span>
//            <span>Normal</span>
//            <span>Loose</span>
//          </div>
//        </div> 
//        {/* Color Palette */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            Color Palette
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Heading Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="color"
//                  value={resumeStyle.headingColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.headingColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              <div className="flex gap-1 mt-2">
//                {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                  <button key={color} style={{ backgroundColor: color }}
//                    onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                  />
//                ))}
//              </div>
//            </div>
//            {/* Body Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//              <div className="flex items-center gap-2">
//                <input type="color" value={resumeStyle.bodyColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.bodyColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              <div className="flex gap-1 mt-2">
//                {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                  <button
//                    key={color}
//                    onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                    style={{ backgroundColor: color }}
//                  />
//                ))}
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Quick Presets */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//          <div className="grid grid-cols-2 gap-2">
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Inter, sans-serif', nameFontSize: '32px', headingFontSize: '18px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#1f2937', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-bluee-50 transition-all duration-200"
//            >
//              Modern
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Playfair Display, serif', nameFontSize: '36px', headingFontSize: '20px', bodyFontSize: '14px', lineSpacing: '1.6', headingColor: '#0f172a', bodyColor: '#1f2937'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Classic
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                 fontFamily: 'Roboto, sans-serif', nameFontSize: '28px', headingFontSize: '16px', bodyFontSize: '13px', lineSpacing: '1.4', headingColor: '#1e40af', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Corporate
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Open Sans, sans-serif', nameFontSize: '30px', headingFontSize: '17px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#059669', bodyColor: '#4b5563'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Creative
//            </button>
//          </div>
//        </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab;












// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useResume } from "../../_context/ResumeContext";
// import { getTemplateById } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// const templates = [
//   { id: 1, subtitle: "Modern", imgSrc: "/assets/templates/template-1.png", atsFriendly: true },
//   { id: 2, subtitle: "Classic", imgSrc: "/assets/templates/template-2.png", atsFriendly: true },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   const filteredTemplates = templates.filter((tpl) => {
//     const matchCategory = selectedCategory === "All" || tpl.subtitle === selectedCategory;
//     const matchSearch = tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchCategory && matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleTemplateSelection = async (templateId: number) => {
//     try {
//       setIsLoadingTemplate(true);
//       console.log("🎨 Selecting template:", templateId);

//       // Fetch template details from API
//       const templateData = await getTemplateById(templateId);
      
//       console.log("✅ Template data fetched:", templateData);
      
//       // Set the selected template
//       setSelectedTemplate(templateId);
      
//       if (templateData.name) {
//         console.log(`📝 Template "${templateData.name}" applied`);
//       }
      
//       toast.success(`Template "${templateData.name || templateId}" selected!`);
      
//       // Call the onTemplateSelect callback to close sidebar
//       if (onTemplateSelect) {
//         onTemplateSelect();
//       }
      
//     } catch (error) {
//       console.error("❌ Error selecting template:", error);
//       toast.error("Failed to load template. Please try again.");
      
//       // Fallback: still set the template even if API fails
//       setSelectedTemplate(templateId);
//       if (onTemplateSelect) {
//         onTemplateSelect();
//       }
//     } finally {
//       setIsLoadingTemplate(false);
//     }
//   };

//   return (
//     <>
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-1 gap-x-4 gap-y-4 mb-6">
//           {filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.id}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   selectedTemplate === tpl.id ? "border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-48 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-1 flex flex-col items-center">
//                   <button
//                     onClick={() => handleTemplateSelection(tpl.id)}
//                     disabled={isLoadingTemplate}
//                     className={`mt-2 w-full rounded py-1 text-xs font-semibold transition ${
//                       selectedTemplate === tpl.id
//                         ? "bg-[#2557a7] text-white"
//                         : "bg-gray-100 border border-gray-200 text-gray-800 hover:bg-blue-100 hover:text-[#2557a7]"
//                     } ${isLoadingTemplate ? "opacity-50 cursor-not-allowed" : ""}`}
//                   >
//                     {isLoadingTemplate && selectedTemplate === tpl.id
//                       ? "Loading..."
//                       : selectedTemplate === tpl.id
//                       ? "Selected"
//                       : "Use Template"}
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center">
//               No templates found
//             </div>
//           )}
//         </div>
//       ) : (
//         // ... (keep all your existing style panel code exactly as is)
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>
//           {/* Typography Scale */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            Typography Scale
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Name Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="20"
//                  max="48"
//                  value={parseInt(resumeStyle.nameFontSize) || 28}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.nameFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div>
//            {/* Heading Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="12"
//                  max="24"
//                  value={parseInt(resumeStyle.headingFontSize) || 18}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.headingFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div> 
//            {/* Body Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="10"
//                  max="16"
//                  value={parseInt(resumeStyle.bodyFontSize) || 12}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.bodyFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Text Formatting */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//          <div className="flex gap-2">
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                resumeStyle.bold 
//                  ? "bg-blue-100 border-blue-300 text-blue-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              B
//            </button>
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                resumeStyle.italic 
//                  ? "bg-blue-100 border-blue-300 text-blue-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              I
//            </button>
//          </div>
//        </div>
//        {/* Line Spacing */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//          <div className="flex items-center gap-2">
//            <input
//              type="range"
//              min="1"
//              max="2.5"
//              step="0.1"
//              value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//            />
//            <input
//              type="text"
//              value={resumeStyle.lineSpacing}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//            />
//          </div>
//          <div className="flex justify-between text-xs text-gray-500 mt-1">
//            <span>Tight</span>
//            <span>Normal</span>
//            <span>Loose</span>
//          </div>
//        </div> 
//        {/* Color Palette */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            Color Palette
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Heading Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="color"
//                  value={resumeStyle.headingColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.headingColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              <div className="flex gap-1 mt-2">
//                {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                  <button key={color} style={{ backgroundColor: color }}
//                    onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                  />
//                ))}
//              </div>
//            </div>
//            {/* Body Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//              <div className="flex items-center gap-2">
//                <input type="color" value={resumeStyle.bodyColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.bodyColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              <div className="flex gap-1 mt-2">
//                {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                  <button
//                    key={color}
//                    onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                    style={{ backgroundColor: color }}
//                  />
//                ))}
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Quick Presets */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//          <div className="grid grid-cols-2 gap-2">
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Inter, sans-serif', nameFontSize: '32px', headingFontSize: '18px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#1f2937', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-bluee-50 transition-all duration-200"
//            >
//              Modern
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Playfair Display, serif', nameFontSize: '36px', headingFontSize: '20px', bodyFontSize: '14px', lineSpacing: '1.6', headingColor: '#0f172a', bodyColor: '#1f2937'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Classic
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                 fontFamily: 'Roboto, sans-serif', nameFontSize: '28px', headingFontSize: '16px', bodyFontSize: '13px', lineSpacing: '1.4', headingColor: '#1e40af', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Corporate
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Open Sans, sans-serif', nameFontSize: '30px', headingFontSize: '17px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#059669', bodyColor: '#4b5563'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Creative
//            </button>
//          </div>
//        </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab;


// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useResume } from "../../_context/ResumeContext";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// const templates = [
//   { id: 1, subtitle: "Modern", imgSrc: "/assets/templates/template-1.png", atsFriendly: true },
//   { id: 2, subtitle: "Classic", imgSrc: "/assets/templates/template-2.png", atsFriendly: true },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   const filteredTemplates = templates.filter((tpl) => {
//     const matchCategory = selectedCategory === "All" || tpl.subtitle === selectedCategory;
//     const matchSearch = tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchCategory && matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-1 gap-x-4 gap-y-4 mb-6">
//           {filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.id}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   selectedTemplate === tpl.id ? "border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-48 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-1 flex flex-col items-center">
//                   <button
//                     onClick={() => {
//                       setSelectedTemplate(tpl.id);
//                       if (onTemplateSelect) onTemplateSelect();
//                     }}
//                     className={`mt-2 w-full rounded py-1 text-xs font-semibold transition ${
//                       selectedTemplate === tpl.id
//                         ? "bg-[#2557a7] text-white"
//                         : "bg-gray-100 border border-gray-200 text-gray-800 hover:bg-blue-100 hover:text-[#2557a7]"
//                     }`}
//                   >
//                     {selectedTemplate === tpl.id ? "Selected" : "Use Template"}
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center">
//               No templates found
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>
//           {/* Typography Scale */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            Typography Scale
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Name Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="20"
//                  max="48"
//                  value={parseInt(resumeStyle.nameFontSize) || 28}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.nameFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div>
//            {/* Heading Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="12"
//                  max="24"
//                  value={parseInt(resumeStyle.headingFontSize) || 18}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.headingFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div> 
//            {/* Body Font Size */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="range"
//                  min="10"
//                  max="16"
//                  value={parseInt(resumeStyle.bodyFontSize) || 12}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                />
//                <input
//                  type="text"
//                  value={resumeStyle.bodyFontSize}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                  className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                />
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Text Formatting */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//          <div className="flex gap-2">
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                resumeStyle.bold 
//                  ? "bg-blue-100 border-blue-300 text-blue-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              B
//            </button>
//            <button
//              onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//              className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                resumeStyle.italic 
//                  ? "bg-blue-100 border-blue-300 text-blue-500" 
//                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//              }`}
//            >
//              I
//            </button>
//          </div>
//        </div>
//        {/* Line Spacing */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//          <div className="flex items-center gap-2">
//            <input
//              type="range"
//              min="1"
//              max="2.5"
//              step="0.1"
//              value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//            />
//            <input
//              type="text"
//              value={resumeStyle.lineSpacing}
//              onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//              className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//            />
//          </div>
//          <div className="flex justify-between text-xs text-gray-500 mt-1">
//            <span>Tight</span>
//            <span>Normal</span>
//            <span>Loose</span>
//          </div>
//        </div> 
//        {/* Color Palette */}
//        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//          <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//            Color Palette
//          </h4>        
//          <div className="grid grid-cols-1 gap-3">
//            {/* Heading Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//              <div className="flex items-center gap-2">
//                <input
//                  type="color"
//                  value={resumeStyle.headingColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.headingColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              {/* Color Presets for Headings */}
//              <div className="flex gap-1 mt-2">
//                {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                  <button key={color} style={{ backgroundColor: color }}
//                    onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                  />
//                ))}
//              </div>
//            </div>
//            {/* Body Color */}
//            <div>
//              <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//              <div className="flex items-center gap-2">
//                <input type="color" value={resumeStyle.bodyColor}
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                />
//                <input type="text" value={resumeStyle.bodyColor} placeholder="#000000"
//                  onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                />
//              </div>
//              {/* Color Presets for Body */}
//              <div className="flex gap-1 mt-2">
//                {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                  <button
//                    key={color}
//                    onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                    className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                    style={{ backgroundColor: color }}
//                  />
//                ))}
//              </div>
//            </div>
//          </div>
//        </div>
//        {/* Quick Presets */}
//        <div>
//          <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//          <div className="grid grid-cols-2 gap-2">
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Inter, sans-serif', nameFontSize: '32px', headingFontSize: '18px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#1f2937', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-bluee-50 transition-all duration-200"
//            >
//              Modern
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Playfair Display, serif', nameFontSize: '36px', headingFontSize: '20px', bodyFontSize: '14px', lineSpacing: '1.6', headingColor: '#0f172a', bodyColor: '#1f2937'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Classic
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                 fontFamily: 'Roboto, sans-serif', nameFontSize: '28px', headingFontSize: '16px', bodyFontSize: '13px', lineSpacing: '1.4', headingColor: '#1e40af', bodyColor: '#374151'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Corporate
//            </button>
//            <button onClick={() => setResumeStyle({
//                ...resumeStyle,
//                fontFamily: 'Open Sans, sans-serif', nameFontSize: '30px', headingFontSize: '17px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#059669', bodyColor: '#4b5563'
//              })}
//              className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//            >
//              Creative
//            </button>
//          </div>
//        </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab; 
// before api added



// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// const templates = [
//   { id: 1, subtitle: "Modern", imgSrc: "/assets/templates/template-1.jpg", atsFriendly: true, description: "Clean and modern design perfect for tech professionals" },
//   { id: 2, subtitle: "Modern", imgSrc: "/assets/templates/template-2.jpg", atsFriendly: true, description: "Traditional professional layout for corporate roles" },
//   { id: 3, subtitle: "Minimalist", imgSrc: "/assets/templates/template-3.png", atsFriendly: true, description: "Traditional professional layout for corporate roles" },
//   { id: 4, subtitle: "Professional", imgSrc: "/assets/templates/template-4.png", atsFriendly: true, description: "Traditional professional layout for corporate roles" },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [previewTemplate, setPreviewTemplate] = useState<typeof templates[0] | null>(null);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   const filteredTemplates = templates.filter((tpl) => {
//     const matchCategory = selectedCategory === "All" || tpl.subtitle === selectedCategory;
//     const matchSearch = tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchCategory && matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleApplyTemplate = () => {
//     if (previewTemplate) {
//       setSelectedTemplate(previewTemplate.id);
//       setPreviewTemplate(null);
//       if (onTemplateSelect) onTemplateSelect();
//     }
//   };

//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
//           {filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.id}
//                 onClick={() => setPreviewTemplate(tpl)}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   selectedTemplate === tpl.id ? "border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-1  rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-44 mt-6 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-2 flex flex-col items-center">
//                   <p className="text-xs font-semibold text-gray-700">{tpl.subtitle}</p>
//                   {selectedTemplate === tpl.id && (
//                     <span className="mt-1 text-[10px] text-[#2557a7] font-semibold">✓ Selected</span>
//                   )}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center">
//               No templates found
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>

//           {/* Typography Scale */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Typography Scale
//             </h4>        
//             <div className="grid grid-cols-1 gap-3">
//               {/* Name Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="20"
//                     max="48"
//                     value={parseInt(resumeStyle.nameFontSize) || 28}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.nameFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Heading Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="12"
//                     max="24"
//                     value={parseInt(resumeStyle.headingFontSize) || 18}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Body Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="10"
//                     max="16"
//                     value={parseInt(resumeStyle.bodyFontSize) || 12}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Text Formatting */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                   resumeStyle.bold 
//                     ? "bg-blue-100 border-blue-300 text-blue-500" 
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 B
//               </button>
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                   resumeStyle.italic 
//                     ? "bg-blue-100 border-blue-300 text-blue-500" 
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 I
//               </button>
//             </div>
//           </div>

//           {/* Line Spacing */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//             <div className="flex items-center gap-2">
//               <input
//                 type="range"
//                 min="1"
//                 max="2.5"
//                 step="0.1"
//                 value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//               />
//               <input
//                 type="text"
//                 value={resumeStyle.lineSpacing}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//               />
//             </div>
//             <div className="flex justify-between text-xs text-gray-500 mt-1">
//               <span>Tight</span>
//               <span>Normal</span>
//               <span>Loose</span>
//             </div>
//           </div>

//           {/* Color Palette */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Color Palette
//             </h4>        
//             <div className="grid grid-cols-1 gap-3">
//               {/* Heading Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.headingColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 <div className="flex gap-1 mt-2">
//                   {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                     <button
//                       key={color}
//                       style={{ backgroundColor: color }}
//                       onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Body Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.bodyColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 <div className="flex gap-1 mt-2">
//                   {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                     <button
//                       key={color}
//                       onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                       style={{ backgroundColor: color }}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Quick Presets */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//             <div className="grid grid-cols-2 gap-2">
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Inter, sans-serif',
//                   nameFontSize: '32px',
//                   headingFontSize: '18px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.5',
//                   headingColor: '#1f2937',
//                   bodyColor: '#374151'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Modern
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Playfair Display, serif',
//                   nameFontSize: '36px',
//                   headingFontSize: '20px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.6',
//                   headingColor: '#0f172a',
//                   bodyColor: '#1f2937'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Classic
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Roboto, sans-serif',
//                   nameFontSize: '28px',
//                   headingFontSize: '16px',
//                   bodyFontSize: '13px',
//                   lineSpacing: '1.4',
//                   headingColor: '#1e40af',
//                   bodyColor: '#374151'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Corporate
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Open Sans, sans-serif',
//                   nameFontSize: '30px',
//                   headingFontSize: '17px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.5',
//                   headingColor: '#059669',
//                   bodyColor: '#4b5563'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Creative
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Template Preview Modal */}
//       {previewTemplate && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
//               <h2 className="text-xl font-bold text-gray-800">Template Preview</h2>
//               <button
//                 onClick={() => setPreviewTemplate(null)}
//                 className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//               >
//                 <X size={24} className="text-gray-600" />
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="flex flex-1 overflow-hidden">
//               {/* Left Side - Full Template Preview */}
//               <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
//                 <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '600px' }}>
//                   <Image
//                     src={previewTemplate.imgSrc}
//                     alt={previewTemplate.subtitle}
//                     width={600}
//                     height={800}
//                     className="w-full h-auto object-contain"
//                   />
//                 </div>
//               </div>

//               {/* Right Side - Template Details */}
//               <div className="w-80 bg-white p-6 border-l border-gray-200 overflow-y-auto">
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="text-2xl font-bold text-gray-800 mb-2">
//                       {previewTemplate.subtitle}
//                     </h3>
//                     {previewTemplate.atsFriendly && (
//                       <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
//                         ✓ 100% ATS Friendly
//                       </span>
//                     )}
//                   </div>

//                   <div className="pt-4 border-t border-gray-200">
//                     <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
//                     <p className="text-sm text-gray-600 leading-relaxed">
//                       {previewTemplate.description}
//                     </p>
//                   </div>

//                   <div className="pt-4 border-t border-gray-200">
//                     <h4 className="text-sm font-semibold text-gray-700 mb-2">Features</h4>
//                     <ul className="space-y-2">
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Professional layout</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Easy to customize</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>ATS optimized</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Print friendly</span>
//                       </li>
//                     </ul>
//                   </div>

//                   <div className="pt-6">
//                     <button
//                       onClick={handleApplyTemplate}
//                       className="w-full bg-[#2557a7] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#1f4890] transition-all duration-200 shadow-md hover:shadow-lg"
//                     >
//                       Apply This Template
//                     </button>
//                     <button
//                       onClick={() => setPreviewTemplate(null)}
//                       className="w-full mt-2 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab; before api




// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";
// import { getTemplatesByCategory, TemplateResponse } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// // ✅ Define proper type for transformed template
// interface TransformedTemplate {
//   id: string;
//   template_id: string;
//   name: string;
//   subtitle: string;
//   imgSrc: string;
//   atsFriendly: boolean;
//   description: string;
//   category: string;
// }

// // ✅ Fallback templates (used if API fails)
// const DEFAULT_TEMPLATES: TransformedTemplate[] = [
//   { 
//     id: "modern_minimalist",
//     template_id: "modern_minimalist",
//     name: "Modern Minimalist",
//     subtitle: "Modern",
//     imgSrc: "/assets/templates/template-1.jpg",
//     atsFriendly: true,
//     description: "Clean and modern design perfect for tech professionals",
//     category: "modern"
//   },
//   { 
//     id: "compact_professional",
//     template_id: "compact_professional",
//     name: "Compact Professional",
//     subtitle: "Modern",
//     imgSrc: "/assets/templates/template-2.jpg",
//     atsFriendly: true,
//     description: "Traditional professional layout for corporate roles",
//     category: "modern"
//   },
//   { 
//     id: "minimalist_classic",
//     template_id: "minimalist_classic",
//     name: "Minimalist Classic",
//     subtitle: "Minimalist",
//     imgSrc: "/assets/templates/template-3.png",
//     atsFriendly: true,
//     description: "Clean and simple layout with understated elegance",
//     category: "minimalist"
//   },
//   { 
//     id: "professional_classic",
//     template_id: "professional_classic",
//     name: "Professional Classic",
//     subtitle: "Professional",
//     imgSrc: "/assets/templates/template-4.png",
//     atsFriendly: true,
//     description: "Traditional layout ideal for corporate professionals",
//     category: "professional"
//   },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [previewTemplate, setPreviewTemplate] = useState<TransformedTemplate | null>(null);
//   const [templates, setTemplates] = useState<TransformedTemplate[]>(DEFAULT_TEMPLATES);
//   const [loading, setLoading] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   // ✅ Fetch templates from API when component mounts or category changes
//   useEffect(() => {
//     const fetchTemplates = async () => {
//       try {
//         setLoading(true);
//         console.log("🔍 Fetching templates for category:", selectedCategory);
        
//         const data = await getTemplatesByCategory(
//           selectedCategory === "All" ? undefined : selectedCategory
//         );
        
//         if (data && data.length > 0) {
//           // ✅ Transform API data to match component format
//           const transformedTemplates: TransformedTemplate[] = data.map((tpl: TemplateResponse) => ({
//             id: tpl.id?.toString() || tpl.template_id || "0",
//             template_id: tpl.template_id || tpl.id?.toString() || "0",
//             name: tpl.name || "Template",
//             subtitle: tpl.category ? (tpl.category.charAt(0).toUpperCase() + tpl.category.slice(1)) : "Template",
//             imgSrc: tpl.preview_url || `/assets/templates/template-${tpl.template_id || tpl.id}.png`,
//             atsFriendly: tpl.ats_friendly ?? true,
//             description: tpl.description || "Professional resume template",
//             category: tpl.category || "modern"
//           }));
          
//           setTemplates(transformedTemplates);
//           console.log("✅ Templates loaded from API:", transformedTemplates.length);
//         } else {
//           console.warn("⚠️ No templates found, using defaults");
//           setTemplates(DEFAULT_TEMPLATES);
//         }
//       } catch (error) {
//         console.error("❌ Failed to fetch templates:", error);
//         toast.error("Failed to load templates from API. Using default templates.");
//         setTemplates(DEFAULT_TEMPLATES);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTemplates();
//   }, [selectedCategory]); // ✅ Re-fetch when category changes

//   // ✅ Extract unique categories from templates
//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   // ✅ Filter templates by search query
//   const filteredTemplates = templates.filter((tpl) => {
//     const matchSearch = tpl.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                         tpl.name?.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleApplyTemplate = () => {
//     if (previewTemplate) {
//       // ✅ Convert string to number if selectedTemplate is number type in context
//       setSelectedTemplate(previewTemplate.template_id as any);
//       setPreviewTemplate(null);
//       if (onTemplateSelect) onTemplateSelect();
//       toast.success(`${previewTemplate.name} applied successfully!`);
//     }
//   };

//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
//           {loading ? (
//             <div className="col-span-2 flex items-center justify-center py-12">
//               <div className="flex flex-col items-center gap-3">
//                 <div className="w-8 h-8 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin"></div>
//                 <p className="text-sm text-gray-600">Loading templates...</p>
//               </div>
//             </div>
//           ) : filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.template_id}
//                 onClick={() => setPreviewTemplate(tpl)}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   // ✅ Fix comparison - convert selectedTemplate to string for comparison
//                   String(selectedTemplate) === tpl.template_id ? "border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-1 rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.template_id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-44 mt-6 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-2 flex flex-col items-center">
//                   <p className="text-xs font-semibold text-gray-700">{tpl.subtitle}</p>
//                   {/* ✅ Fix comparison - convert selectedTemplate to string */}
//                   {String(selectedTemplate) === tpl.template_id && (
//                     <span className="mt-1 text-[10px] text-[#2557a7] font-semibold">✓ Selected</span>
//                   )}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center py-8">
//               No templates found for &quot;{selectedCategory}&quot;
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>

//           {/* Typography Scale */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Typography Scale
//             </h4>        
//             <div className="grid grid-cols-1 gap-3">
//               {/* Name Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="20"
//                     max="48"
//                     value={parseInt(resumeStyle.nameFontSize) || 28}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.nameFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Heading Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="12"
//                     max="24"
//                     value={parseInt(resumeStyle.headingFontSize) || 18}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Body Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="10"
//                     max="16"
//                     value={parseInt(resumeStyle.bodyFontSize) || 12}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Text Formatting */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                   resumeStyle.bold 
//                     ? "bg-blue-100 border-blue-300 text-blue-500" 
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 B
//               </button>
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                   resumeStyle.italic 
//                     ? "bg-blue-100 border-blue-300 text-blue-500" 
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 I
//               </button>
//             </div>
//           </div>

//           {/* Line Spacing */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//             <div className="flex items-center gap-2">
//               <input
//                 type="range"
//                 min="1"
//                 max="2.5"
//                 step="0.1"
//                 value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//               />
//               <input
//                 type="text"
//                 value={resumeStyle.lineSpacing}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//               />
//             </div>
//             <div className="flex justify-between text-xs text-gray-500 mt-1">
//               <span>Tight</span>
//               <span>Normal</span>
//               <span>Loose</span>
//             </div>
//           </div>

//           {/* Color Palette */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Color Palette
//             </h4>        
//             <div className="grid grid-cols-1 gap-3">
//               {/* Heading Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.headingColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 <div className="flex gap-1 mt-2">
//                   {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                     <button
//                       key={color}
//                       style={{ backgroundColor: color }}
//                       onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Body Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.bodyColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 <div className="flex gap-1 mt-2">
//                   {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                     <button
//                       key={color}
//                       onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                       style={{ backgroundColor: color }}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Quick Presets */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//             <div className="grid grid-cols-2 gap-2">
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Inter, sans-serif',
//                   nameFontSize: '32px',
//                   headingFontSize: '18px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.5',
//                   headingColor: '#1f2937',
//                   bodyColor: '#374151'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Modern
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Playfair Display, serif',
//                   nameFontSize: '36px',
//                   headingFontSize: '20px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.6',
//                   headingColor: '#0f172a',
//                   bodyColor: '#1f2937'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Classic
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Roboto, sans-serif',
//                   nameFontSize: '28px',
//                   headingFontSize: '16px',
//                   bodyFontSize: '13px',
//                   lineSpacing: '1.4',
//                   headingColor: '#1e40af',
//                   bodyColor: '#374151'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Corporate
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Open Sans, sans-serif',
//                   nameFontSize: '30px',
//                   headingFontSize: '17px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.5',
//                   headingColor: '#059669',
//                   bodyColor: '#4b5563'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Creative
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Template Preview Modal */}
//       {previewTemplate && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
//               <h2 className="text-xl font-bold text-gray-800">Template Preview</h2>
//               <button
//                 onClick={() => setPreviewTemplate(null)}
//                 className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//               >
//                 <X size={24} className="text-gray-600" />
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="flex flex-1 overflow-hidden">
//               {/* Left Side - Full Template Preview */}
//               <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
//                 <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '600px' }}>
//                   <Image
//                     src={previewTemplate.imgSrc}
//                     alt={previewTemplate.name}
//                     width={600}
//                     height={800}
//                     className="w-full h-auto object-contain"
//                   />
//                 </div>
//               </div>

//               {/* Right Side - Template Details */}
//               <div className="w-80 bg-white p-6 border-l border-gray-200 overflow-y-auto">
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="text-2xl font-bold text-gray-800 mb-2">
//                       {previewTemplate.name}
//                     </h3>
//                     {previewTemplate.atsFriendly && (
//                       <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
//                         ✓ 100% ATS Friendly
//                       </span>
//                     )}
//                   </div>

//                   <div className="pt-4 border-t border-gray-200">
//                     <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
//                     <p className="text-sm text-gray-600 leading-relaxed">
//                       {previewTemplate.description}
//                     </p>
//                   </div>

//                   <div className="pt-4 border-t border-gray-200">
//                     <h4 className="text-sm font-semibold text-gray-700 mb-2">Features</h4>
//                     <ul className="space-y-2">
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Professional layout</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Easy to customize</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>ATS optimized</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Print friendly</span>
//                       </li>
//                     </ul>
//                   </div>

//                   <div className="pt-6">
//                     <button
//                       onClick={handleApplyTemplate}
//                       className="w-full bg-[#2557a7] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#1f4890] transition-all duration-200 shadow-md hover:shadow-lg"
//                     >
//                       Apply This Template
//                     </button>
//                     <button
//                       onClick={() => setPreviewTemplate(null)}
//                       className="w-full mt-2 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab; before apply api added



// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";
// import { getTemplatesByCategory, applyTemplateToResume, TemplateResponse } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// // ✅ Define proper type for transformed template
// interface TransformedTemplate {
//   id: string;
//   template_id: string;
//   name: string;
//   subtitle: string;
//   imgSrc: string;
//   atsFriendly: boolean;
//   description: string;
//   category: string;
// }

// // ✅ Fallback templates (used if API fails)
// const DEFAULT_TEMPLATES: TransformedTemplate[] = [
//   { 
//     id: "modern_minimalist",
//     template_id: "modern_minimalist",
//     name: "Modern Minimalist",
//     subtitle: "Modern",
//     imgSrc: "/assets/templates/template-1.jpg",
//     atsFriendly: true,
//     description: "Clean and modern design perfect for tech professionals",
//     category: "modern"
//   },
//   { 
//     id: "compact_professional",
//     template_id: "compact_professional",
//     name: "Compact Professional",
//     subtitle: "Modern",
//     imgSrc: "/assets/templates/template-2.jpg",
//     atsFriendly: true,
//     description: "Traditional professional layout for corporate roles",
//     category: "modern"
//   },
//   { 
//     id: "minimalist_classic",
//     template_id: "minimalist_classic",
//     name: "Minimalist Classic",
//     subtitle: "Minimalist",
//     imgSrc: "/assets/templates/template-3.png",
//     atsFriendly: true,
//     description: "Clean and simple layout with understated elegance",
//     category: "minimalist"
//   },
//   { 
//     id: "professional_classic",
//     template_id: "professional_classic",
//     name: "Professional Classic",
//     subtitle: "Professional",
//     imgSrc: "/assets/templates/template-4.png",
//     atsFriendly: true,
//     description: "Traditional layout ideal for corporate professionals",
//     category: "professional"
//   },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [previewTemplate, setPreviewTemplate] = useState<TransformedTemplate | null>(null);
//   const [templates, setTemplates] = useState<TransformedTemplate[]>(DEFAULT_TEMPLATES);
//   const [loading, setLoading] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   // ✅ Fetch templates from API when component mounts or category changes
//   useEffect(() => {
//     const fetchTemplates = async () => {
//       try {
//         setLoading(true);
//         console.log("🔍 Fetching templates for category:", selectedCategory);
        
//         const data = await getTemplatesByCategory(
//           selectedCategory === "All" ? undefined : selectedCategory
//         );
        
//         if (data && data.length > 0) {
//           // ✅ Transform API data to match component format
//           const transformedTemplates: TransformedTemplate[] = data.map((tpl: TemplateResponse) => ({
//             id: tpl.id?.toString() || tpl.template_id || "0",
//             template_id: tpl.template_id || tpl.id?.toString() || "0",
//             name: tpl.name || "Template",
//             subtitle: tpl.category ? (tpl.category.charAt(0).toUpperCase() + tpl.category.slice(1)) : "Template",
//             imgSrc: tpl.preview_url || `/assets/templates/template-${tpl.template_id || tpl.id}.png`,
//             atsFriendly: tpl.ats_friendly ?? true,
//             description: tpl.description || "Professional resume template",
//             category: tpl.category || "modern"
//           }));
          
//           setTemplates(transformedTemplates);
//           console.log("✅ Templates loaded from API:", transformedTemplates.length);
//         } else {
//           console.warn("⚠️ No templates found, using defaults");
//           setTemplates(DEFAULT_TEMPLATES);
//         }
//       } catch (error) {
//         console.error("❌ Failed to fetch templates:", error);
//         toast.error("Failed to load templates from API. Using default templates.");
//         setTemplates(DEFAULT_TEMPLATES);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTemplates();
//   }, [selectedCategory]); // ✅ Re-fetch when category changes

//   // ✅ Extract unique categories from templates
//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   // ✅ Filter templates by search query
//   const filteredTemplates = templates.filter((tpl) => {
//     const matchSearch = tpl.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                         tpl.name?.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ✅ Updated handleApplyTemplate with API call
//   // const handleApplyTemplate = async () => {
//   //   if (previewTemplate) {
//   //     try {
//   //       // Get current resume ID
//   //       const resumeId = localStorage.getItem("current_resume_id");
        
//   //       if (!resumeId) {
//   //         toast.error("No resume found. Please create a resume first.");
//   //         return;
//   //       }
        
//   //       // ✅ Call the apply template API
//   //       console.log("🎨 Applying template:", {
//   //         resumeId,
//   //         templateId: previewTemplate.template_id
//   //       });
        
//   //       const result = await applyTemplateToResume(resumeId, previewTemplate.template_id);
        
//   //       console.log("✅ Template applied successfully:", result);
        
//   //       // Update UI state
//   //       setSelectedTemplate(previewTemplate.template_id as any);
//   //       setPreviewTemplate(null);
        
//   //       if (onTemplateSelect) onTemplateSelect();
        
//   //       toast.success(`${previewTemplate.name} applied successfully!`);
        
//   //     } catch (error) {
//   //       console.error("❌ Failed to apply template:", error);
//   //       toast.error(error instanceof Error ? error.message : "Failed to apply template");
//   //     }
//   //   }
//   // };
//   const handleApplyTemplate = async () => {
//   if (previewTemplate) {
//     try {
//       // Get current resume ID
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         toast.error("No resume found. Please create a resume first.");
//         return;
//       }
      
//       // ✅ Debug: Check resume ID format
//       console.log("🔍 Resume ID from localStorage:", resumeId);
//       console.log("🔍 Resume ID length:", resumeId.length);
//       console.log("🔍 Resume ID type:", typeof resumeId);
//       console.log("🔍 Template ID:", previewTemplate.template_id);
      
//       // ✅ Validate resume ID is not empty or 'null' string
//       if (!resumeId || resumeId === 'null' || resumeId === 'undefined') {
//         toast.error("Invalid resume ID. Please refresh and try again.");
//         return;
//       }
      
//       // ✅ Call the apply template API
//       console.log("🎨 Applying template:", {
//         resumeId,
//         templateId: previewTemplate.template_id
//       });
      
//       const result = await applyTemplateToResume(resumeId, previewTemplate.template_id);
      
//       console.log("✅ Template applied successfully:", result);
      
//       // Update UI state
//       setSelectedTemplate(previewTemplate.template_id as any);
//       setPreviewTemplate(null);
      
//       if (onTemplateSelect) onTemplateSelect();
      
//       toast.success(`${previewTemplate.name} applied successfully!`);
      
//     } catch (error) {
//       console.error("❌ Failed to apply template:", error);
//       toast.error(error instanceof Error ? error.message : "Failed to apply template");
//     }
//   }
// };


//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
//           {loading ? (
//             <div className="col-span-2 flex items-center justify-center py-12">
//               <div className="flex flex-col items-center gap-3">
//                 <div className="w-8 h-8 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin"></div>
//                 <p className="text-sm text-gray-600">Loading templates...</p>
//               </div>
//             </div>
//           ) : filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.template_id}
//                 onClick={() => setPreviewTemplate(tpl)}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   String(selectedTemplate) === tpl.template_id ? "border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-1 rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.template_id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-44 mt-6 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-2 flex flex-col items-center">
//                   <p className="text-xs font-semibold text-gray-700">{tpl.subtitle}</p>
//                   {String(selectedTemplate) === tpl.template_id && (
//                     <span className="mt-1 text-[10px] text-[#2557a7] font-semibold">✓ Selected</span>
//                   )}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center py-8">
//               No templates found for &quot;{selectedCategory}&quot;
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>

//           {/* Typography Scale */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Typography Scale
//             </h4>        
//             <div className="grid grid-cols-1 gap-3">
//               {/* Name Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="20"
//                     max="48"
//                     value={parseInt(resumeStyle.nameFontSize) || 28}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.nameFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Heading Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="12"
//                     max="24"
//                     value={parseInt(resumeStyle.headingFontSize) || 18}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Body Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="10"
//                     max="16"
//                     value={parseInt(resumeStyle.bodyFontSize) || 12}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Text Formatting */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                   resumeStyle.bold 
//                     ? "bg-blue-100 border-blue-300 text-blue-500" 
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 B
//               </button>
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                   resumeStyle.italic 
//                     ? "bg-blue-100 border-blue-300 text-blue-500" 
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 I
//               </button>
//             </div>
//           </div>

//           {/* Line Spacing */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//             <div className="flex items-center gap-2">
//               <input
//                 type="range"
//                 min="1"
//                 max="2.5"
//                 step="0.1"
//                 value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//               />
//               <input
//                 type="text"
//                 value={resumeStyle.lineSpacing}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//               />
//             </div>
//             <div className="flex justify-between text-xs text-gray-500 mt-1">
//               <span>Tight</span>
//               <span>Normal</span>
//               <span>Loose</span>
//             </div>
//           </div>

//           {/* Color Palette */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Color Palette
//             </h4>        
//             <div className="grid grid-cols-1 gap-3">
//               {/* Heading Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.headingColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 <div className="flex gap-1 mt-2">
//                   {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                     <button
//                       key={color}
//                       style={{ backgroundColor: color }}
//                       onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Body Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.bodyColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 <div className="flex gap-1 mt-2">
//                   {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                     <button
//                       key={color}
//                       onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                       style={{ backgroundColor: color }}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Quick Presets */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//             <div className="grid grid-cols-2 gap-2">
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Inter, sans-serif',
//                   nameFontSize: '32px',
//                   headingFontSize: '18px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.5',
//                   headingColor: '#1f2937',
//                   bodyColor: '#374151'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Modern
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Playfair Display, serif',
//                   nameFontSize: '36px',
//                   headingFontSize: '20px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.6',
//                   headingColor: '#0f172a',
//                   bodyColor: '#1f2937'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Classic
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Roboto, sans-serif',
//                   nameFontSize: '28px',
//                   headingFontSize: '16px',
//                   bodyFontSize: '13px',
//                   lineSpacing: '1.4',
//                   headingColor: '#1e40af',
//                   bodyColor: '#374151'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Corporate
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Open Sans, sans-serif',
//                   nameFontSize: '30px',
//                   headingFontSize: '17px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.5',
//                   headingColor: '#059669',
//                   bodyColor: '#4b5563'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Creative
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Template Preview Modal */}
//       {previewTemplate && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
//               <h2 className="text-xl font-bold text-gray-800">Template Preview</h2>
//               <button
//                 onClick={() => setPreviewTemplate(null)}
//                 className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//               >
//                 <X size={24} className="text-gray-600" />
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="flex flex-1 overflow-hidden">
//               {/* Left Side - Full Template Preview */}
//               <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
//                 <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '600px' }}>
//                   <Image
//                     src={previewTemplate.imgSrc}
//                     alt={previewTemplate.name}
//                     width={600}
//                     height={800}
//                     className="w-full h-auto object-contain"
//                   />
//                 </div>
//               </div>

//               {/* Right Side - Template Details */}
//               <div className="w-80 bg-white p-6 border-l border-gray-200 overflow-y-auto">
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="text-2xl font-bold text-gray-800 mb-2">
//                       {previewTemplate.name}
//                     </h3>
//                     {previewTemplate.atsFriendly && (
//                       <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
//                         ✓ 100% ATS Friendly
//                       </span>
//                     )}
//                   </div>

//                   <div className="pt-4 border-t border-gray-200">
//                     <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
//                     <p className="text-sm text-gray-600 leading-relaxed">
//                       {previewTemplate.description}
//                     </p>
//                   </div>

//                   <div className="pt-4 border-t border-gray-200">
//                     <h4 className="text-sm font-semibold text-gray-700 mb-2">Features</h4>
//                     <ul className="space-y-2">
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Professional layout</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Easy to customize</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>ATS optimized</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Print friendly</span>
//                       </li>
//                     </ul>
//                   </div>

//                   <div className="pt-6">
//                     <button
//                       onClick={handleApplyTemplate}
//                       className="w-full bg-[#2557a7] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#1f4890] transition-all duration-200 shadow-md hover:shadow-lg"
//                     >
//                       Apply This Template
//                     </button>
//                     <button
//                       onClick={() => setPreviewTemplate(null)}
//                       className="w-full mt-2 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab; before apply api issue




// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";
// import { getTemplatesByCategory, applyTemplateToResume, TemplateResponse } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// // ✅ Updated interface with mongoId
// interface TransformedTemplate {
//   id: string;
//   mongoId: string;  // ✅ MongoDB _id
//   template_id: string;
//   name: string;
//   subtitle: string;
//   imgSrc: string;
//   atsFriendly: boolean;
//   description: string;
//   category: string;
// }

// // ✅ Updated fallback templates with MongoDB _ids
// const DEFAULT_TEMPLATES: TransformedTemplate[] = [
//   { 
//     id: "modern_minimalist",
//     mongoId: "691c7d4d9607aa8d059dc29f",  // ✅ MongoDB _id
//     template_id: "modern_minimalist",
//     name: "Modern Minimalist",
//     subtitle: "Modern",
//     imgSrc: "/assets/templates/template-1.jpg",
//     atsFriendly: true,
//     description: "Clean and modern design perfect for tech professionals",
//     category: "modern"
//   },
//   { 
//     id: "compact_professional",
//     mongoId: "691c7d7f9607aa8d059dc2a0",  // ✅ MongoDB _id
//     template_id: "compact_professional",
//     name: "Compact Professional",
//     subtitle: "Modern",
//     imgSrc: "/assets/templates/template-2.jpg",
//     atsFriendly: true,
//     description: "Traditional professional layout for corporate roles",
//     category: "modern"
//   },
//   { 
//     id: "minimalist_classic",
//     mongoId: "691c7c639607aa8d059dc29d",  // ✅ MongoDB _id
//     template_id: "minimalist_classic",
//     name: "Minimalist Classic",
//     subtitle: "Minimalist",
//     imgSrc: "/assets/templates/template-3.png",
//     atsFriendly: true,
//     description: "Clean and simple layout with understated elegance",
//     category: "minimalist"
//   },
//   { 
//     id: "professional_classic",
//     mongoId: "691c7cf89607aa8d059dc29e",  // ✅ MongoDB _id
//     template_id: "professional_classic",
//     name: "Professional Classic",
//     subtitle: "Professional",
//     imgSrc: "/assets/templates/template-4.png",
//     atsFriendly: true,
//     description: "Traditional layout ideal for corporate professionals",
//     category: "professional"
//   },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [previewTemplate, setPreviewTemplate] = useState<TransformedTemplate | null>(null);
//   const [templates, setTemplates] = useState<TransformedTemplate[]>(DEFAULT_TEMPLATES);
//   const [loading, setLoading] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   // ✅ Fetch templates from API
//   useEffect(() => {
//     const fetchTemplates = async () => {
//       try {
//         setLoading(true);
//         console.log("🔍 Fetching templates for category:", selectedCategory);
        
//         const data = await getTemplatesByCategory(
//           selectedCategory === "All" ? undefined : selectedCategory
//         );
        
//         if (data && data.length > 0) {
//           // ✅ Transform API data including MongoDB _id
//           const transformedTemplates: TransformedTemplate[] = data.map((tpl: TemplateResponse) => ({
//             id: tpl.id?.toString() || tpl.template_id || "0",
//             mongoId: tpl._id || tpl.id?.toString() || "0",  // ✅ Store MongoDB _id
//             template_id: tpl.template_id || tpl.id?.toString() || "0",
//             name: tpl.name || "Template",
//             subtitle: tpl.category ? (tpl.category.charAt(0).toUpperCase() + tpl.category.slice(1)) : "Template",
//             imgSrc: tpl.preview_url || `/assets/templates/template-${tpl.template_id || tpl.id}.png`,
//             atsFriendly: tpl.ats_friendly ?? true,
//             description: tpl.description || "Professional resume template",
//             category: tpl.category || "modern"
//           }));
          
//           setTemplates(transformedTemplates);
//           console.log("✅ Templates loaded from API:", transformedTemplates.length);
//         } else {
//           console.warn("⚠️ No templates found, using defaults");
//           setTemplates(DEFAULT_TEMPLATES);
//         }
//       } catch (error) {
//         console.error("❌ Failed to fetch templates:", error);
//         toast.error("Failed to load templates from API. Using default templates.");
//         setTemplates(DEFAULT_TEMPLATES);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTemplates();
//   }, [selectedCategory]);

//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   const filteredTemplates = templates.filter((tpl) => {
//     const matchSearch = tpl.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                         tpl.name?.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ✅ Updated to use MongoDB _id
//   // const handleApplyTemplate = async () => {
//   //   if (previewTemplate) {
//   //     try {
//   //       const resumeId = localStorage.getItem("current_resume_id");
        
//   //       if (!resumeId) {
//   //         toast.error("No resume found. Please create a resume first.");
//   //         return;
//   //       }
        
//   //       // ✅ Use mongoId for API call
//   //       console.log("🎨 Applying template:", {
//   //         resumeId,
//   //         templateMongoId: previewTemplate.mongoId,
//   //         templateId: previewTemplate.template_id
//   //       });
        
//   //       // ✅ Send MongoDB _id to backend
//   //       const result = await applyTemplateToResume(resumeId, previewTemplate.mongoId);
        
//   //       console.log("✅ Template applied successfully:", result);
        
//   //       setSelectedTemplate(previewTemplate.template_id as any);
//   //       setPreviewTemplate(null);
        
//   //       if (onTemplateSelect) onTemplateSelect();
        
//   //       toast.success(`${previewTemplate.name} applied successfully!`);
        
//   //     } catch (error) {
//   //       console.error("❌ Failed to apply template:", error);
//   //       toast.error(error instanceof Error ? error.message : "Failed to apply template");
//   //     }
//   //   }
//   // };
//   const handleApplyTemplate = async () => {
//   if (previewTemplate) {
//     try {
//       const resumeId = localStorage.getItem("current_resume_id");
      
//       if (!resumeId) {
//         toast.error("No resume found. Please create a resume first.");
//         return;
//       }
      
//       // ✅ Try template_id first, fallback to mongoId
//       const templateIdentifier = previewTemplate.template_id || previewTemplate.mongoId;
      
//       console.log("🎨 Applying template:", {
//         resumeId,
//         templateIdentifier,
//         template_id: previewTemplate.template_id,
//         mongoId: previewTemplate.mongoId
//       });
      
//       // ✅ Use template_id (string) instead of mongoId
//       const result = await applyTemplateToResume(resumeId, templateIdentifier);
      
//       console.log("✅ Template applied successfully:", result);
      
//       setSelectedTemplate(previewTemplate.template_id as any);
//       setPreviewTemplate(null);
      
//       if (onTemplateSelect) onTemplateSelect();
      
//       toast.success(`${previewTemplate.name} applied successfully!`);
      
//     } catch (error) {
//       console.error("❌ Failed to apply template:", error);
//       toast.error(error instanceof Error ? error.message : "Failed to apply template");
//     }
//   }
// };


//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
//           {loading ? (
//             <div className="col-span-2 flex items-center justify-center py-12">
//               <div className="flex flex-col items-center gap-3">
//                 <div className="w-8 h-8 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin"></div>
//                 <p className="text-sm text-gray-600">Loading templates...</p>
//               </div>
//             </div>
//           ) : filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.template_id}
//                 onClick={() => setPreviewTemplate(tpl)}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   String(selectedTemplate) === tpl.template_id ? "border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-1 rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.template_id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-44 mt-6 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-2 flex flex-col items-center">
//                   <p className="text-xs font-semibold text-gray-700">{tpl.subtitle}</p>
//                   {String(selectedTemplate) === tpl.template_id && (
//                     <span className="mt-1 text-[10px] text-[#2557a7] font-semibold">✓ Selected</span>
//                   )}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center py-8">
//               No templates found for &quot;{selectedCategory}&quot;
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>

//           {/* Typography Scale */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Typography Scale
//             </h4>        
//             <div className="grid grid-cols-1 gap-3">
//               {/* Name Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="20"
//                     max="48"
//                     value={parseInt(resumeStyle.nameFontSize) || 28}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.nameFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Heading Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="12"
//                     max="24"
//                     value={parseInt(resumeStyle.headingFontSize) || 18}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Body Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="10"
//                     max="16"
//                     value={parseInt(resumeStyle.bodyFontSize) || 12}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Text Formatting */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                   resumeStyle.bold 
//                     ? "bg-blue-100 border-blue-300 text-blue-500" 
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 B
//               </button>
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                   resumeStyle.italic 
//                     ? "bg-blue-100 border-blue-300 text-blue-500" 
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 I
//               </button>
//             </div>
//           </div>

//           {/* Line Spacing */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//             <div className="flex items-center gap-2">
//               <input
//                 type="range"
//                 min="1"
//                 max="2.5"
//                 step="0.1"
//                 value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//               />
//               <input
//                 type="text"
//                 value={resumeStyle.lineSpacing}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//               />
//             </div>
//             <div className="flex justify-between text-xs text-gray-500 mt-1">
//               <span>Tight</span>
//               <span>Normal</span>
//               <span>Loose</span>
//             </div>
//           </div>

//           {/* Color Palette */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Color Palette
//             </h4>        
//             <div className="grid grid-cols-1 gap-3">
//               {/* Heading Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.headingColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 <div className="flex gap-1 mt-2">
//                   {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                     <button
//                       key={color}
//                       style={{ backgroundColor: color }}
//                       onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Body Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.bodyColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 <div className="flex gap-1 mt-2">
//                   {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                     <button
//                       key={color}
//                       onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                       style={{ backgroundColor: color }}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Quick Presets */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//             <div className="grid grid-cols-2 gap-2">
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Inter, sans-serif',
//                   nameFontSize: '32px',
//                   headingFontSize: '18px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.5',
//                   headingColor: '#1f2937',
//                   bodyColor: '#374151'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Modern
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Playfair Display, serif',
//                   nameFontSize: '36px',
//                   headingFontSize: '20px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.6',
//                   headingColor: '#0f172a',
//                   bodyColor: '#1f2937'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Classic
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Roboto, sans-serif',
//                   nameFontSize: '28px',
//                   headingFontSize: '16px',
//                   bodyFontSize: '13px',
//                   lineSpacing: '1.4',
//                   headingColor: '#1e40af',
//                   bodyColor: '#374151'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Corporate
//               </button>
//               <button
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Open Sans, sans-serif',
//                   nameFontSize: '30px',
//                   headingFontSize: '17px',
//                   bodyFontSize: '14px',
//                   lineSpacing: '1.5',
//                   headingColor: '#059669',
//                   bodyColor: '#4b5563'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Creative
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Template Preview Modal */}
//       {previewTemplate && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
//               <h2 className="text-xl font-bold text-gray-800">Template Preview</h2>
//               <button
//                 onClick={() => setPreviewTemplate(null)}
//                 className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//               >
//                 <X size={24} className="text-gray-600" />
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="flex flex-1 overflow-hidden">
//               {/* Left Side - Full Template Preview */}
//               <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
//                 <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '600px' }}>
//                   <Image
//                     src={previewTemplate.imgSrc}
//                     alt={previewTemplate.name}
//                     width={600}
//                     height={800}
//                     className="w-full h-auto object-contain"
//                   />
//                 </div>
//               </div>

//               {/* Right Side - Template Details */}
//               <div className="w-80 bg-white p-6 border-l border-gray-200 overflow-y-auto">
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="text-2xl font-bold text-gray-800 mb-2">
//                       {previewTemplate.name}
//                     </h3>
//                     {previewTemplate.atsFriendly && (
//                       <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
//                         ✓ 100% ATS Friendly
//                       </span>
//                     )}
//                   </div>

//                   <div className="pt-4 border-t border-gray-200">
//                     <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
//                     <p className="text-sm text-gray-600 leading-relaxed">
//                       {previewTemplate.description}
//                     </p>
//                   </div>

//                   <div className="pt-4 border-t border-gray-200">
//                     <h4 className="text-sm font-semibold text-gray-700 mb-2">Features</h4>
//                     <ul className="space-y-2">
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Professional layout</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Easy to customize</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>ATS optimized</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Print friendly</span>
//                       </li>
//                     </ul>
//                   </div>

//                   <div className="pt-6">
//                     <button
//                       onClick={handleApplyTemplate}
//                       className="w-full bg-[#2557a7] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#1f4890] transition-all duration-200 shadow-md hover:shadow-lg"
//                     >
//                       Apply This Template
//                     </button>
//                     <button
//                       onClick={() => setPreviewTemplate(null)}
//                       className="w-full mt-2 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab;

// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { X } from "lucide-react";
// import { useResume } from "../../_context/ResumeContext";
// import { getTemplatesByCategory, applyTemplateToResume, TemplateResponse } from "@/api/resumeApi";
// import { toast } from "sonner";

// // Interface updated with mongoId (_id)
// interface TransformedTemplate {
//   id: string;
//   mongoId: string; // MongoDB _id
//   template_id: string;
//   name: string;
//   subtitle: string;
//   imgSrc: string;
//   atsFriendly: boolean;
//   description: string;
//   category: string;
// }

// // Default templates using MongoDB _ids
// const DEFAULT_TEMPLATES: TransformedTemplate[] = [
//   {
//     id: "modern_minimalist",
//     mongoId: "691c7d4d9607aa8d059dc29f",
//     template_id: "modern_minimalist",
//     name: "Modern Minimalist",
//     subtitle: "Modern",
//     imgSrc: "/assets/templates/template-1.jpg",
//     atsFriendly: true,
//     description: "Clean and modern design perfect for tech professionals",
//     category: "modern"
//   },
//   {
//     id: "compact_professional",
//     mongoId: "691c7d7f9607aa8d059dc2a0",
//     template_id: "compact_professional",
//     name: "Compact Professional",
//     subtitle: "Modern",
//     imgSrc: "/assets/templates/template-2.jpg",
//     atsFriendly: true,
//     description: "Traditional professional layout for corporate roles",
//     category: "modern"
//   },
//   {
//     id: "minimalist_classic",
//     mongoId: "691c7c639607aa8d059dc29d",
//     template_id: "minimalist_classic",
//     name: "Minimalist Classic",
//     subtitle: "Minimalist",
//     imgSrc: "/assets/templates/template-3.png",
//     atsFriendly: true,
//     description: "Clean and simple layout with understated elegance",
//     category: "minimalist"
//   },
//   {
//     id: "professional_classic",
//     mongoId: "691c7cf89607aa8d059dc29e",
//     template_id: "professional_classic",
//     name: "Professional Classic",
//     subtitle: "Professional",
//     imgSrc: "/assets/templates/template-4.png",
//     atsFriendly: true,
//     description: "Traditional layout ideal for corporate professionals",
//     category: "professional"
//   }
// ];

// const TemplatesTab: React.FC<{ onTemplateSelect?: () => void }> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [previewTemplate, setPreviewTemplate] = useState<TransformedTemplate | null>(null);
//   const [templates, setTemplates] = useState<TransformedTemplate[]>(DEFAULT_TEMPLATES);
//   const [loading, setLoading] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   // Fetch templates from API
//   useEffect(() => {
//     const fetchTemplates = async () => {
//       try {
//         setLoading(true);
//         const data = await getTemplatesByCategory(selectedCategory === "All" ? undefined : selectedCategory);
//         if (data && data.length > 0) {
//           const transformedTemplates: TransformedTemplate[] = data.map((tpl: TemplateResponse) => ({
//             id: tpl.id?.toString() || tpl.template_id || "0",
//             mongoId: tpl._id || tpl.id?.toString() || "0",
//             template_id: tpl.template_id || tpl.id?.toString() || "0",
//             name: tpl.name || "Template",
//             subtitle: tpl.category ? (tpl.category.charAt(0).toUpperCase() + tpl.category.slice(1)) : "Template",
//             imgSrc: tpl.preview_url || `/assets/templates/template-${tpl.template_id || tpl.id}.png`,
//             atsFriendly: tpl.ats_friendly ?? true,
//             description: tpl.description || "Professional resume template",
//             category: tpl.category || "modern"
//           }));
//           setTemplates(transformedTemplates);
//         } else {
//           setTemplates(DEFAULT_TEMPLATES);
//         }
//       } catch (error) {
//         toast.error("Failed to load templates from API. Using default templates.");
//         setTemplates(DEFAULT_TEMPLATES);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchTemplates();
//   }, [selectedCategory]);

//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];
//   const filteredTemplates = templates.filter((tpl) => {
//     const matchSearch = tpl.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) || tpl.name?.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Always use mongoId for both path and body!
//   const handleApplyTemplate = async () => {
//     if (previewTemplate) {
//       try {
//         const resumeId = localStorage.getItem("current_resume_id");
//         if (!resumeId) {
//           toast.error("No resume found. Please create a resume first.");
//           return;
//         }
//         // Always use the mongoId!
//         const result = await applyTemplateToResume(resumeId, previewTemplate.mongoId);
//         setSelectedTemplate(previewTemplate.template_id as any);
//         setPreviewTemplate(null);
//         if (onTemplateSelect) onTemplateSelect();
//         toast.success(`${previewTemplate.name} applied successfully!`);
//       } catch (error) {
//         toast.error(error instanceof Error ? error.message : "Failed to apply template");
//       }
//     }
//   };

//   return (
//     <>
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//               }`}
//           >
//             {selectedCategory} ▼
//           </button>
//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                     }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//         >
//           Style
//         </button>
//       </div>
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
//           {loading ? (
//             <div className="col-span-2 flex items-center justify-center py-12">
//               <div className="flex flex-col items-center gap-3">
//                 <div className="w-8 h-8 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin"></div>
//                 <p className="text-sm text-gray-600">Loading templates...</p>
//               </div>
//             </div>
//           ) : filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.template_id}
//                 onClick={() => setPreviewTemplate(tpl)}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${String(selectedTemplate) === tpl.template_id ? "border-[#2557a7]" : "border-gray-200"
//                   } bg-white overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-1 rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}
//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.template_id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-44 mt-6 object-contain bg-gray-100"
//                 />
//                 <div className="w-full px-2 py-2 flex flex-col items-center">
//                   <p className="text-xs font-semibold text-gray-700">{tpl.subtitle}</p>
//                   {String(selectedTemplate) === tpl.template_id && (
//                     <span className="mt-1 text-[10px] text-[#2557a7] font-semibold">✓ Selected</span>
//                   )}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-2 text-sm text-gray-500 text-center py-8">
//               No templates found for &quot;{selectedCategory}&quot;
//             </div>
//           )}
//         </div>
//       ) : (
//         // ... (STYLE PANEL CODE - unchanged)
//         // Your style panel code here
//         <div>Style panel here</div>
//       )}
//       {previewTemplate && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
//               <h2 className="text-xl font-bold text-gray-800">Template Preview</h2>
//               <button
//                 onClick={() => setPreviewTemplate(null)}
//                 className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//               >
//                 <X size={24} className="text-gray-600" />
//               </button>
//             </div>
//             <div className="flex flex-1 overflow-hidden">
//               <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
//                 <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '600px' }}>
//                   <Image
//                     src={previewTemplate.imgSrc}
//                     alt={previewTemplate.name}
//                     width={600}
//                     height={800}
//                     className="w-full h-auto object-contain"
//                   />
//                 </div>
//               </div>
//               <div className="w-80 bg-white p-6 border-l border-gray-200 overflow-y-auto">
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="text-2xl font-bold text-gray-800 mb-2">{previewTemplate.name}</h3>
//                     {previewTemplate.atsFriendly && (
//                       <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
//                         ✓ 100% ATS Friendly
//                       </span>
//                     )}
//                   </div>
//                   <div className="pt-4 border-t border-gray-200">
//                     <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
//                     <p className="text-sm text-gray-600 leading-relaxed">{previewTemplate.description}</p>
//                   </div>
//                   <div className="pt-4 border-t border-gray-200">
//                     <h4 className="text-sm font-semibold text-gray-700 mb-2">Features</h4>
//                     <ul className="space-y-2">
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Professional layout</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Easy to customize</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>ATS optimized</span>
//                       </li>
//                       <li className="flex items-start gap-2 text-sm text-gray-600">
//                         <span className="text-green-500 mt-0.5">✓</span>
//                         <span>Print friendly</span>
//                       </li>
//                     </ul>
//                   </div>
//                   <div className="pt-6">
//                     <button
//                       onClick={handleApplyTemplate}
//                       className="w-full bg-[#2557a7] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#1f4890] transition-all duration-200 shadow-md hover:shadow-lg"
//                     >
//                       Apply This Template
//                     </button>
//                     <button
//                       onClick={() => setPreviewTemplate(null)}
//                       className="w-full mt-2 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab; before template issue



"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useResume } from "../../_context/ResumeContext";
import { getTemplatesByCategory, applyTemplateToResume, TemplateResponse } from "@/api/resumeApi";
import { toast } from "sonner";

// Interface updated with mongoId (_id)
interface TransformedTemplate {
  id: string;
  mongoId: string; // MongoDB _id
  template_id: string;
  name: string;
  subtitle: string;
  imgSrc: string;
  atsFriendly: boolean;
  description: string;
  category: string;
}

// Default templates using MongoDB _ids
const DEFAULT_TEMPLATES: TransformedTemplate[] = [
  {
    id: "modern_minimalist",
    mongoId: "691c7d4d9607aa8d059dc29f",
    template_id: "modern_minimalist",
    name: "Modern Minimalist",
    subtitle: "Modern",
    imgSrc: "/assets/templates/template-1.jpg",
    atsFriendly: true,
    description: "Clean and modern design perfect for tech professionals",
    category: "modern"
  },
  {
    id: "compact_professional",
    mongoId: "691c7d7f9607aa8d059dc2a0",
    template_id: "compact_professional",
    name: "Compact Professional",
    subtitle: "Modern",
    imgSrc: "/assets/templates/template-2.jpg",
    atsFriendly: true,
    description: "Traditional professional layout for corporate roles",
    category: "modern"
  },
  {
    id: "minimalist_classic",
    mongoId: "691c7c639607aa8d059dc29d",
    template_id: "minimalist_classic",
    name: "Minimalist Classic",
    subtitle: "Minimalist",
    imgSrc: "/assets/templates/template-3.png",
    atsFriendly: true,
    description: "Clean and simple layout with understated elegance",
    category: "minimalist"
  },
  {
    id: "professional_classic",
    mongoId: "691c7cf89607aa8d059dc29e",
    template_id: "professional_classic",
    name: "Professional Classic",
    subtitle: "Professional",
    imgSrc: "/assets/templates/template-4.png",
    atsFriendly: true,
    description: "Traditional layout ideal for corporate professionals",
    category: "professional"
  }
];

const TemplatesTab: React.FC<{ onTemplateSelect?: () => void }> = ({ onTemplateSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TransformedTemplate | null>(null);
  const [templates, setTemplates] = useState<TransformedTemplate[]>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const data = await getTemplatesByCategory(selectedCategory === "All" ? undefined : selectedCategory);
        if (data && data.length > 0) {
          const transformedTemplates: TransformedTemplate[] = data.map((tpl: TemplateResponse) => ({
            id: tpl.id?.toString() || tpl.template_id || "0",
            mongoId: tpl._id || tpl.id?.toString() || "0",
            template_id: tpl.template_id || tpl.id?.toString() || "0",
            name: tpl.name || "Template",
            subtitle: tpl.category ? (tpl.category.charAt(0).toUpperCase() + tpl.category.slice(1)) : "Template",
            imgSrc: tpl.preview_url || `/assets/templates/template-${tpl.template_id || tpl.id}.png`,
            atsFriendly: tpl.ats_friendly ?? true,
            description: tpl.description || "Professional resume template",
            category: tpl.category || "modern"
          }));
          setTemplates(transformedTemplates);
        } else {
          setTemplates(DEFAULT_TEMPLATES);
        }
      } catch (error) {
        toast.error("Failed to load templates from API. Using default templates.");
        setTemplates(DEFAULT_TEMPLATES);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [selectedCategory]);

  const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];
  const filteredTemplates = templates.filter((tpl) => {
    const matchSearch = tpl.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) || tpl.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Handle template click for instant preview
  const handleTemplateClick = (tpl: TransformedTemplate) => {
    // Update selected template immediately for live preview
    setSelectedTemplate(tpl.template_id);
    console.log("🎯 Template selected for preview:", tpl.template_id);
    
    // Also open the modal for more details
    setPreviewTemplate(tpl);
  };

  // Apply template to resume via API
  const handleApplyTemplate = async () => {
    if (previewTemplate) {
      try {
        const resumeId = localStorage.getItem("current_resume_id");
        if (!resumeId) {
          toast.error("No resume found. Please create a resume first.");
          return;
        }
        
        // Call API to apply template to backend
        const result = await applyTemplateToResume(resumeId, previewTemplate.mongoId);
        console.log("✅ Template applied to backend:", result);
        
        // Keep the template selected
        setSelectedTemplate(previewTemplate.template_id);
        setPreviewTemplate(null);
        
        if (onTemplateSelect) onTemplateSelect();
        
        toast.success(`${previewTemplate.name} applied successfully!`);
      } catch (error) {
        console.error("❌ Error applying template:", error);
        toast.error(error instanceof Error ? error.message : "Failed to apply template");
      }
    }
  };

  return (
    <>
      {activePanel === "templates" && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
          />
        </div>
      )}
      
      <div className="flex items-center gap-8 mb-4 relative">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setActivePanel("templates");
            }}
            className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
              activePanel === "templates"
                ? "bg-blue-50 text-[#2557a7] border-blue-200"
                : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
            }`}
          >
            {selectedCategory} ▼
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
              {categories.map((cat) => (
                <div
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setDropdownOpen(false);
                    setActivePanel("templates");
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
                    selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
                  }`}
                >
                  {cat}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            setActivePanel("style");
            setDropdownOpen(false);
          }}
          className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
            activePanel === "style"
              ? "bg-blue-50 text-[#2557a7] border-blue-200"
              : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
          }`}
        >
          Style
        </button>
      </div>
      
      {activePanel === "templates" ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600">Loading templates...</p>
              </div>
            </div>
          ) : filteredTemplates.length > 0 ? (
            filteredTemplates.map((tpl) => (
              <div
                key={tpl.template_id}
                onClick={() => handleTemplateClick(tpl)}
                className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
                  String(selectedTemplate) === tpl.template_id ? "border-[#2557a7]" : "border-gray-200"
                } bg-white overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200`}
              >
                {tpl.atsFriendly && (
                  <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-1 rounded-full shadow-sm border border-[#2557a7]">
                    100% ATS Friendly
                  </span>
                )}
                <Image
                  src={tpl.imgSrc}
                  alt={`template-${tpl.template_id}`}
                  width={160}
                  height={200}
                  className="w-full h-44 mt-6 object-contain bg-gray-100"
                />
                <div className="w-full px-2 py-2 flex flex-col items-center">
                  <p className="text-xs font-semibold text-gray-700">{tpl.subtitle}</p>
                  {String(selectedTemplate) === tpl.template_id && (
                    <span className="mt-1 text-[10px] text-[#2557a7] font-semibold">✓ Selected</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-sm text-gray-500 text-center py-8">
              No templates found for &quot;{selectedCategory}&quot;
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-gray-700">
          {/* Font Family */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
            <select
              value={resumeStyle.fontFamily}
              onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
            >
              <option value="times-new-roman">Times New Roman</option>
              <option value="arial">Arial</option>
              <option value="monospace">Monospace</option>                            
              <option value="calibri">Calibri</option>
            </select>
          </div>

          {/* Typography Scale */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
              Typography Scale
            </h4>        
            <div className="grid grid-cols-1 gap-3">
              {/* Name Font Size */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="20"
                    max="48"
                    value={parseInt(resumeStyle.nameFontSize) || 28}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <input
                    type="text"
                    value={resumeStyle.nameFontSize}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Heading Font Size */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={parseInt(resumeStyle.headingFontSize) || 18}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <input
                    type="text"
                    value={resumeStyle.headingFontSize}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Body Font Size */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="16"
                    value={parseInt(resumeStyle.bodyFontSize) || 12}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <input
                    type="text"
                    value={resumeStyle.bodyFontSize}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Text Formatting */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
            <div className="flex gap-2">
              <button
                onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
                className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  resumeStyle.bold 
                    ? "bg-blue-100 border-blue-300 text-blue-500" 
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                B
              </button>
              <button
                onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
                className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
                  resumeStyle.italic 
                    ? "bg-blue-100 border-blue-300 text-blue-500" 
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                I
              </button>
            </div>
          </div>

          {/* Line Spacing */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={parseFloat(resumeStyle.lineSpacing) || 1.5}
                onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="text"
                value={resumeStyle.lineSpacing}
                onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
                className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Tight</span>
              <span>Normal</span>
              <span>Loose</span>
            </div>
          </div>

          {/* Color Palette */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
              Color Palette
            </h4>        
            <div className="grid grid-cols-1 gap-3">
              {/* Heading Color */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={resumeStyle.headingColor}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
                    className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
                  />
                  <input
                    type="text"
                    value={resumeStyle.headingColor}
                    placeholder="#000000"
                    onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
                    className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
                    <button
                      key={color}
                      style={{ backgroundColor: color }}
                      onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
                      className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
                    />
                  ))}
                </div>
              </div>

              {/* Body Color */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={resumeStyle.bodyColor}
                    onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
                    className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
                  />
                  <input
                    type="text"
                    value={resumeStyle.bodyColor}
                    placeholder="#000000"
                    onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
                    className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
                      className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setResumeStyle({
                  ...resumeStyle,
                  fontFamily: 'Inter, sans-serif',
                  nameFontSize: '32px',
                  headingFontSize: '18px',
                  bodyFontSize: '14px',
                  lineSpacing: '1.5',
                  headingColor: '#1f2937',
                  bodyColor: '#374151'
                })}
                className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                Modern
              </button>
              <button
                onClick={() => setResumeStyle({
                  ...resumeStyle,
                  fontFamily: 'Playfair Display, serif',
                  nameFontSize: '36px',
                  headingFontSize: '20px',
                  bodyFontSize: '14px',
                  lineSpacing: '1.6',
                  headingColor: '#0f172a',
                  bodyColor: '#1f2937'
                })}
                className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                Classic
              </button>
              <button
                onClick={() => setResumeStyle({
                  ...resumeStyle,
                  fontFamily: 'Roboto, sans-serif',
                  nameFontSize: '28px',
                  headingFontSize: '16px',
                  bodyFontSize: '13px',
                  lineSpacing: '1.4',
                  headingColor: '#1e40af',
                  bodyColor: '#374151'
                })}
                className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                Corporate
              </button>
              <button
                onClick={() => setResumeStyle({
                  ...resumeStyle,
                  fontFamily: 'Open Sans, sans-serif',
                  nameFontSize: '30px',
                  headingFontSize: '17px',
                  bodyFontSize: '14px',
                  lineSpacing: '1.5',
                  headingColor: '#059669',
                  bodyColor: '#4b5563'
                })}
                className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                Creative
              </button>
            </div>
          </div>
        </div>
      )}
      
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Template Preview</h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
                <div className="bg-white rounded-lg shadow-lg mx-auto" style={{ maxWidth: '600px' }}>
                  <Image
                    src={previewTemplate.imgSrc}
                    alt={previewTemplate.name}
                    width={600}
                    height={800}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
              
              <div className="w-80 bg-white p-6 border-l border-gray-200 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{previewTemplate.name}</h3>
                    {previewTemplate.atsFriendly && (
                      <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                        ✓ 100% ATS Friendly
                      </span>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{previewTemplate.description}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Professional layout</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Easy to customize</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>ATS optimized</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Print friendly</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="pt-6">
                    <button
                      onClick={handleApplyTemplate}
                      className="w-full bg-[#2557a7] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#1f4890] transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Apply This Template
                    </button>
                    <button
                      onClick={() => setPreviewTemplate(null)}
                      className="w-full mt-2 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplatesTab;








































































// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useResume } from "../../_context/ResumeContext";
// import { getTemplatesByCategory, getAllTemplates, TemplateResponse } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// // ✅ Fallback templates in case API fails
// const defaultTemplates = [
//   { id: 1, subtitle: "Modern", imgSrc: "/assets/templates/template-1.png", atsFriendly: true },
//   { id: 2, subtitle: "Classic", imgSrc: "/assets/templates/template-2.png", atsFriendly: true },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   // ✅ State for templates from API
//   const [templates, setTemplates] = useState(defaultTemplates);
//   const [isLoading, setIsLoading] = useState(false);
//   const [apiError, setApiError] = useState(false);

//   // ✅ Fetch templates from API on mount
//   useEffect(() => {
//     const fetchTemplates = async () => {
//       setIsLoading(true);
//       setApiError(false);
      
//       try {
//         console.log("📋 Fetching all templates from API...");
//         const fetchedTemplates = await getAllTemplates();
        
//         console.log("✅ API Response:", fetchedTemplates);

//         if (!fetchedTemplates || fetchedTemplates.length === 0) {
//           console.warn("⚠️ API returned empty templates array");
//           toast.warning("No templates found from API. Using default templates.");
//           setApiError(true);
//           setTemplates(defaultTemplates);
//           return;
//         }
        
//         // ✅ Transform API response to component format
//         const transformedTemplates = fetchedTemplates.map((template) => ({
//           id: template.id,
//           subtitle: template.subtitle || template.category || template.name || "Template",
//           imgSrc: template.preview_url || `/assets/templates/template-${template.id}.png`,
//           atsFriendly: template.ats_friendly ?? true,
//         }));

//         console.log("✅ Transformed templates:", transformedTemplates);
//         setTemplates(transformedTemplates);
        
//       } catch (err) {
//         console.error("❌ Error fetching templates:", err);
//         setApiError(true);
//         toast.error("Failed to load templates from API. Using default templates.");
//         setTemplates(defaultTemplates);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchTemplates();
//   }, []);

//   // ✅ Generate categories from loaded templates
//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   // ✅ Filter templates locally
//   const filteredTemplates = templates.filter((tpl) => {
//     const matchCategory = selectedCategory === "All" || tpl.subtitle === selectedCategory;
//     const matchSearch = tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchCategory && matchSearch;
//   });

//   console.log("🔍 Filter Debug:", {
//     selectedCategory,
//     totalTemplates: templates.length,
//     filteredCount: filteredTemplates.length,
//     categories,
//   });

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory}
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     console.log("📂 Category selected:", cat);
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* API Error Warning
//       {apiError && (
//         <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
//           ⚠️ API failed. Showing default templates.
//         </div>
//       )} */}

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-1 gap-x-4 gap-y-4 mb-6">
//           {isLoading ? (
//             <div className="text-center text-sm text-gray-600 py-8">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
//               Loading templates...
//             </div>
//           ) : filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.id}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   selectedTemplate === tpl.id ? "border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-48 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-1 flex flex-col items-center">
//                   <button
//                     onClick={() => {
//                       setSelectedTemplate(tpl.id);
//                       if (onTemplateSelect) {
//                         onTemplateSelect();
//                       }
//                     }}
//                     className={`mt-2 w-full rounded py-1 text-xs font-semibold transition ${
//                       selectedTemplate === tpl.id
//                         ? "bg-[#2557a7] text-white"
//                         : "bg-gray-100 border border-gray-200 text-gray-800 hover:bg-blue-100 hover:text-[#2557a7]"
//                     }`}
//                   >
//                     {selectedTemplate === tpl.id ? "Selected" : "Use Template"}
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="text-center py-8">
//               <p className="text-sm text-gray-500 mb-2">No templates found</p>
//               <p className="text-xs text-gray-400">
//                 {templates.length === 0 
//                   ? "No templates loaded from API" 
//                   : `Showing 0 of ${templates.length} templates`}
//               </p>
//             </div>
//           )}
//         </div>
//       ) : (
//         /* ====== STYLE PANEL - FULL CODE ====== */
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>

//           {/* Typography Scale */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Typography Scale
//             </h4>

//             <div className="grid grid-cols-1 gap-3">
//               {/* Name Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="20"
//                     max="48"
//                     value={parseInt(resumeStyle.nameFontSize) || 28}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.nameFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Heading Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="12"
//                     max="24"
//                     value={parseInt(resumeStyle.headingFontSize) || 18}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Body Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="10"
//                     max="16"
//                     value={parseInt(resumeStyle.bodyFontSize) || 12}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Text Formatting */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                   resumeStyle.bold
//                     ? "bg-blue-100 border-blue-300 text-blue-500"
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 B
//               </button>
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                   resumeStyle.italic
//                     ? "bg-blue-100 border-blue-300 text-blue-500"
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 I
//               </button>
//             </div>
//           </div>

//           {/* Line Spacing */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//             <div className="flex items-center gap-2">
//               <input
//                 type="range"
//                 min="1"
//                 max="2.5"
//                 step="0.1"
//                 value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//               />
//               <input
//                 type="text"
//                 value={resumeStyle.lineSpacing}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//               />
//             </div>
//             <div className="flex justify-between text-xs text-gray-500 mt-1">
//               <span>Tight</span>
//               <span>Normal</span>
//               <span>Loose</span>
//             </div>
//           </div>

//           {/* Color Palette */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Color Palette
//             </h4>

//             <div className="grid grid-cols-1 gap-3">
//               {/* Heading Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.headingColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 {/* Color Presets for Headings */}
//                 <div className="flex gap-1 mt-2">
//                   {["#1f2937", "#374151", "#0f172a", "#1e40af", "#dc2626", "#059669"].map((color) => (
//                     <button
//                       key={color}
//                       style={{ backgroundColor: color }}
//                       onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Body Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.bodyColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 {/* Color Presets for Body */}
//                 <div className="flex gap-1 mt-2">
//                   {["#374151", "#4b5563", "#6b7280", "#1f2937", "#0f172a", "#111827"].map((color) => (
//                     <button
//                       key={color}
//                       onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                       style={{ backgroundColor: color }}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Quick Presets */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//             <div className="grid grid-cols-2 gap-2">
//               <button
//                 onClick={() =>
//                   setResumeStyle({
//                     ...resumeStyle,
//                     fontFamily: "Inter, sans-serif",
//                     nameFontSize: "32px",
//                     headingFontSize: "18px",
//                     bodyFontSize: "14px",
//                     lineSpacing: "1.5",
//                     headingColor: "#1f2937",
//                     bodyColor: "#374151",
//                   })
//                 }
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Modern
//               </button>
//               <button
//                 onClick={() =>
//                   setResumeStyle({
//                     ...resumeStyle,
//                     fontFamily: "Playfair Display, serif",
//                     nameFontSize: "36px",
//                     headingFontSize: "20px",
//                     bodyFontSize: "14px",
//                     lineSpacing: "1.6",
//                     headingColor: "#0f172a",
//                     bodyColor: "#1f2937",
//                   })
//                 }
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Classic
//               </button>
//               <button
//                 onClick={() =>
//                   setResumeStyle({
//                     ...resumeStyle,
//                     fontFamily: "Roboto, sans-serif",
//                     nameFontSize: "28px",
//                     headingFontSize: "16px",
//                     bodyFontSize: "13px",
//                     lineSpacing: "1.4",
//                     headingColor: "#1e40af",
//                     bodyColor: "#374151",
//                   })
//                 }
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Corporate
//               </button>
//               <button
//                 onClick={() =>
//                   setResumeStyle({
//                     ...resumeStyle,
//                     fontFamily: "Open Sans, sans-serif",
//                     nameFontSize: "30px",
//                     headingFontSize: "17px",
//                     bodyFontSize: "14px",
//                     lineSpacing: "1.5",
//                     headingColor: "#059669",
//                     bodyColor: "#4b5563",
//                   })
//                 }
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Creative
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab;  before templated id after template list



// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useResume } from "../../_context/ResumeContext";
// import { getTemplatesByCategory, getAllTemplates, TemplateResponse } from "@/api/resumeApi";
// import { httpClient } from '@/lib/http';
// import { toast } from "sonner";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// // ✅ Fallback templates in case API fails
// const defaultTemplates = [
//   { id: 1, subtitle: "Modern", imgSrc: "/assets/templates/template-1.jpg", atsFriendly: true },
//   { id: 2, subtitle: "Classic", imgSrc: "/assets/templates/template-2.jpg", atsFriendly: true },
//   { id: 3, subtitle: "Classic", imgSrc: "/assets/templates/template-3.png", atsFriendly: true },
//   { id: 4, subtitle: "Classic", imgSrc: "/assets/templates/template-4.png", atsFriendly: true },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   // ✅ State for templates from API
//   const [templates, setTemplates] = useState(defaultTemplates);
//   const [isLoading, setIsLoading] = useState(false);
//   const [apiError, setApiError] = useState(false);

//   // ✅ NEW: Function to fetch template by ID
//   const getTemplateById = async (templateId: number): Promise<TemplateResponse> => {
//     try {
//       console.log("📋 Fetching template details for ID:", templateId);
      
//       const response = await httpClient.get<TemplateResponse>(`/templates/${templateId}`);
      
//       console.log("✅ Template details fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("❌ Error fetching template details:", error);
//       throw error;
//     }
//   };

//   // ✅ NEW: Handle template selection with API call
//   const handleTemplateSelect = async (templateId: number) => {
//     try {
//       console.log("🎯 Template selected:", templateId);
      
//       // Show loading state
//       toast.loading("Loading template details...", { id: 'template-load' });
      
//       // Call the GET /api/v1/templates/{template_id} API
//       const templateDetails = await getTemplateById(templateId);
      
//       console.log("✅ Template details received:", templateDetails);
      
//       // Update the selected template in context
//       setSelectedTemplate(templateId);
      
//       // Dismiss loading toast
//       toast.dismiss('template-load');
      
//       // Show success message
//       toast.success(`Template "${templateDetails.name}" selected!`);
      
//       // Call the optional callback
//       if (onTemplateSelect) {
//         onTemplateSelect();
//       }
      
//     } catch (error) {
//       console.error("❌ Error selecting template:", error);
//       toast.dismiss('template-load');
//       toast.error("Failed to load template details. Please try again.");
//     }
//   };

//   // ✅ Fetch templates from API on mount
//   useEffect(() => {
//     const fetchTemplates = async () => {
//       setIsLoading(true);
//       setApiError(false);
      
//       try {
//         console.log("📋 Fetching all templates from API...");
//         const fetchedTemplates = await getAllTemplates();
        
//         console.log("✅ API Response:", fetchedTemplates);

//         if (!fetchedTemplates || fetchedTemplates.length === 0) {
//           console.warn("⚠️ API returned empty templates array");
//           toast.warning("No templates found from API. Using default templates.");
//           setApiError(true);
//           setTemplates(defaultTemplates);
//           return;
//         }
        
//         // ✅ Transform API response to component format
//         const transformedTemplates = fetchedTemplates.map((template) => ({
//           id: template.id,
//           subtitle: template.subtitle || template.category || template.name || "Template",
//           imgSrc: template.preview_url || `/assets/templates/template-${template.id}.png`,
//           atsFriendly: template.ats_friendly ?? true,
//         }));

//         console.log("✅ Transformed templates:", transformedTemplates);
//         setTemplates(transformedTemplates);
        
//       } catch (err) {
//         console.error("❌ Error fetching templates:", err);
//         setApiError(true);
//         toast.error("Failed to load templates from API. Using default templates.");
//         setTemplates(defaultTemplates);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchTemplates();
//   }, []);

//   // ✅ Generate categories from loaded templates
//   const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];

//   // ✅ Filter templates locally
//   const filteredTemplates = templates.filter((tpl) => {
//     const matchCategory = selectedCategory === "All" || tpl.subtitle === selectedCategory;
//     const matchSearch = tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchCategory && matchSearch;
//   });

//   console.log("🔍 Filter Debug:", {
//     selectedCategory,
//     totalTemplates: templates.length,
//     filteredCount: filteredTemplates.length,
//     categories,
//   });

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory}
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     console.log("📂 Category selected:", cat);
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
//           {isLoading ? (
//             <div className="text-center text-sm text-gray-600 py-8">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
//               Loading templates...
//             </div>
//           ) : filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.id}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   selectedTemplate === tpl.id ? " mt-4 border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[8px] font-semibold  rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-48 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-1 flex flex-col items-center">
//                   <button
//                     onClick={() => handleTemplateSelect(tpl.id)}
//                     className={`mt-2 w-full rounded py-1 text-xs font-semibold transition ${
//                       selectedTemplate === tpl.id
//                         ? "bg-[#2557a7] text-white"
//                         : "bg-gray-100 border border-gray-200 text-gray-800 hover:bg-blue-100 hover:text-[#2557a7]"
//                     }`}
//                   >
//                     {selectedTemplate === tpl.id ? "Selected" : "Use Template"}
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="text-center py-8">
//               <p className="text-sm text-gray-500 mb-2">No templates found</p>
//               <p className="text-xs text-gray-400">
//                 {templates.length === 0 
//                   ? "No templates loaded from API" 
//                   : `Showing 0 of ${templates.length} templates`}
//               </p>
//             </div>
//           )}
//         </div>
//       ) : (
//         /* ====== STYLE PANEL - FULL CODE ====== */
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>

//           {/* Typography Scale */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Typography Scale
//             </h4>

//             <div className="grid grid-cols-1 gap-3">
//               {/* Name Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="20"
//                     max="48"
//                     value={parseInt(resumeStyle.nameFontSize) || 28}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.nameFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Heading Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="12"
//                     max="24"
//                     value={parseInt(resumeStyle.headingFontSize) || 18}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Body Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="10"
//                     max="16"
//                     value={parseInt(resumeStyle.bodyFontSize) || 12}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Text Formatting */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                   resumeStyle.bold
//                     ? "bg-blue-100 border-blue-300 text-blue-500"
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 B
//               </button>
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                   resumeStyle.italic
//                     ? "bg-blue-100 border-blue-300 text-blue-500"
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 I
//               </button>
//             </div>
//           </div>

//           {/* Line Spacing */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//             <div className="flex items-center gap-2">
//               <input
//                 type="range"
//                 min="1"
//                 max="2.5"
//                 step="0.1"
//                 value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//               />
//               <input
//                 type="text"
//                 value={resumeStyle.lineSpacing}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//               />
//             </div>
//             <div className="flex justify-between text-xs text-gray-500 mt-1">
//               <span>Tight</span>
//               <span>Normal</span>
//               <span>Loose</span>
//             </div>
//           </div>

//           {/* Color Palette */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Color Palette
//             </h4>

//             <div className="grid grid-cols-1 gap-3">
//               {/* Heading Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.headingColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 {/* Color Presets for Headings */}
//                 <div className="flex gap-1 mt-2">
//                   {["#1f2937", "#374151", "#0f172a", "#1e40af", "#dc2626", "#059669"].map((color) => (
//                     <button
//                       key={color}
//                       style={{ backgroundColor: color }}
//                       onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Body Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.bodyColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyColor}
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 {/* Color Presets for Body */}
//                 <div className="flex gap-1 mt-2">
//                   {["#374151", "#4b5563", "#6b7280", "#1f2937", "#0f172a", "#111827"].map((color) => (
//                     <button
//                       key={color}
//                       onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                       style={{ backgroundColor: color }}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Quick Presets */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//             <div className="grid grid-cols-2 gap-2">
//               <button
//                 onClick={() =>
//                   setResumeStyle({
//                     ...resumeStyle,
//                     fontFamily: "Inter, sans-serif",
//                     nameFontSize: "32px",
//                     headingFontSize: "18px",
//                     bodyFontSize: "14px",
//                     lineSpacing: "1.5",
//                     headingColor: "#1f2937",
//                     bodyColor: "#374151",
//                   })
//                 }
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Modern
//               </button>
//               <button
//                 onClick={() =>
//                   setResumeStyle({
//                     ...resumeStyle,
//                     fontFamily: "Playfair Display, serif",
//                     nameFontSize: "36px",
//                     headingFontSize: "20px",
//                     bodyFontSize: "14px",
//                     lineSpacing: "1.6",
//                     headingColor: "#0f172a",
//                     bodyColor: "#1f2937",
//                   })
//                 }
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Classic
//               </button>
//               <button
//                 onClick={() =>
//                   setResumeStyle({
//                     ...resumeStyle,
//                     fontFamily: "Roboto, sans-serif",
//                     nameFontSize: "28px",
//                     headingFontSize: "16px",
//                     bodyFontSize: "13px",
//                     lineSpacing: "1.4",
//                     headingColor: "#1e40af",
//                     bodyColor: "#374151",
//                   })
//                 }
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Corporate
//               </button>
//               <button
//                 onClick={() =>
//                   setResumeStyle({
//                     ...resumeStyle,
//                     fontFamily: "Open Sans, sans-serif",
//                     nameFontSize: "30px",
//                     headingFontSize: "17px",
//                     bodyFontSize: "14px",
//                     lineSpacing: "1.5",
//                     headingColor: "#059669",
//                     bodyColor: "#4b5563",
//                   })
//                 }
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Creative
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab;
// before templates api modified




// "use client";
// import React, { useState, useRef, useEffect } from "react";
// import Image from "next/image";
// import { useResume } from "../../_context/ResumeContext";
// import { getTemplatesByCategory, TemplateResponse } from "@/api/resumeApi";
// import { toast } from "sonner";

// interface TemplatesTabProps {
//   onTemplateSelect?: () => void;
// }

// // ✅ Default fallback templates (used if API fails)
// const DEFAULT_TEMPLATES = [
//   { id: "modern_minimalist", name: "Modern Minimalist", imgSrc: "/assets/templates/template-1.jpg", atsFriendly: true, category: "modern" },
//   { id: "compact_professional", name: "Compact Professional", imgSrc: "/assets/templates/template-2.jpg", atsFriendly: true, category: "modern" },
//   { id: "minimalist_classic", name: "Minimalist Classic", imgSrc: "/assets/templates/template-3.png", atsFriendly: true, category: "minimalist" },
//   { id: "professional_classic", name: "Professional Classic", imgSrc: "/assets/templates/template-4.png", atsFriendly: true, category: "professional" },
// ];

// const TemplatesTab: React.FC<TemplatesTabProps> = ({ onTemplateSelect }) => {
//   const [selectedCategory, setSelectedCategory] = useState("All");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [templates, setTemplates] = useState<any[]>(DEFAULT_TEMPLATES);
//   const [loading, setLoading] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();

//   // ✅ Categories list
//   const categories = ["All", "Modern", "Professional", "Minimalist"];

//   // ✅ Fetch templates from API when category changes
//   useEffect(() => {
//     const fetchTemplates = async () => {
//       try {
//         setLoading(true);
//         console.log("🔍 Fetching templates for category:", selectedCategory);
        
//         const data = await getTemplatesByCategory(
//           selectedCategory === "All" ? undefined : selectedCategory
//         );
        
//         if (data && data.length > 0) {
//           // ✅ Transform API data to match component format
//           const transformedTemplates = data.map((tpl: TemplateResponse) => ({
//             id: typeof tpl.id === 'string' ? parseInt(tpl.id) : tpl.id,
//             name: tpl.name,
//             // subtitle: tpl.subtitle || tpl.category || "Template",
//             imgSrc: tpl.preview_url || `/assets/templates/template-${tpl.id}.png`,
//             // atsFriendly: tpl.ats_friendly ?? true,
//             category: tpl.category || "modern"
//           }));
          
//           setTemplates(transformedTemplates);
//           console.log("✅ Templates loaded:", transformedTemplates.length);
//         } else {
//           console.warn("⚠️ No templates found, using defaults");
//           setTemplates(DEFAULT_TEMPLATES);
//         }
//       } catch (error) {
//         console.error("❌ Failed to fetch templates:", error);
//         toast.error("Failed to load templates from API. Using default templates.");
//         setTemplates(DEFAULT_TEMPLATES);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTemplates();
//   }, [selectedCategory]); // ✅ Re-fetch when category changes

//   // ✅ Filter templates by search query (client-side)
//   const filteredTemplates = templates.filter((tpl) => {
//     const matchSearch = tpl.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                         tpl.name?.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchSearch;
//   });

//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <>
//       {/* Search input */}
//       {activePanel === "templates" && (
//         <div className="mb-3">
//           <input
//             type="text"
//             placeholder="Search templates..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-[#2557a7] placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
//           />
//         </div>
//       )}

//       {/* Switch Buttons */}
//       <div className="flex items-center gap-8 mb-4 relative">
//         <div className="relative" ref={dropdownRef}>
//           <button
//             onClick={() => {
//               setDropdownOpen(!dropdownOpen);
//               setActivePanel("templates");
//             }}
//             className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//               activePanel === "templates"
//                 ? "bg-blue-50 text-[#2557a7] border-blue-200"
//                 : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//             }`}
//           >
//             {selectedCategory} ▼
//           </button>

//           {dropdownOpen && (
//             <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
//               {categories.map((cat) => (
//                 <div
//                   key={cat}
//                   onClick={() => {
//                     setSelectedCategory(cat);
//                     setDropdownOpen(false);
//                     setActivePanel("templates");
//                   }}
//                   className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 ${
//                     selectedCategory === cat ? "bg-blue-50 text-[#2557a7]" : "text-gray-700"
//                   }`}
//                 >
//                   {cat}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         <button
//           onClick={() => {
//             setActivePanel("style");
//             setDropdownOpen(false);
//           }}
//           className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
//             activePanel === "style"
//               ? "bg-blue-50 text-[#2557a7] border-blue-200"
//               : "text-gray-700 hover:text-[#2557a7] hover:bg-blue-100 hover:border-blue-200"
//           }`}
//         >
//           Style
//         </button>
//       </div>

//       {/* Template Cards */}
//       {activePanel === "templates" ? (
//         <div className="grid grid-cols-1 gap-x-4 gap-y-4 mb-6">
//           {loading ? (
//             <div className="col-span-1 flex items-center justify-center py-12">
//               <div className="flex flex-col items-center gap-3">
//                 <div className="w-8 h-8 border-4 border-[#2557a7] border-t-transparent rounded-full animate-spin"></div>
//                 <p className="text-sm text-gray-600">Loading templates...</p>
//               </div>
//             </div>
//           ) : filteredTemplates.length > 0 ? (
//             filteredTemplates.map((tpl) => (
//               <div
//                 key={tpl.id}
//                 className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
//                   selectedTemplate === tpl.id ? "border-[#2557a7]" : "border-gray-200"
//                 } bg-white overflow-hidden`}
//               >
//                 {tpl.atsFriendly && (
//                   <span className="absolute top-2 right-2 bg-[#2557a7] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-[#2557a7]">
//                     100% ATS Friendly
//                   </span>
//                 )}

//                 <Image
//                   src={tpl.imgSrc}
//                   alt={`template-${tpl.id}`}
//                   width={160}
//                   height={200}
//                   className="w-full h-48 object-contain bg-gray-100"
//                 />

//                 <div className="w-full px-2 py-1 flex flex-col items-center">
//                   <button
//                     onClick={() => {
//                       setSelectedTemplate(tpl.id);
//                       if (onTemplateSelect) onTemplateSelect();
//                     }}
//                     className={`mt-2 w-full rounded py-1 text-xs font-semibold transition ${
//                       selectedTemplate === tpl.id
//                         ? "bg-[#2557a7] text-white"
//                         : "bg-gray-100 border border-gray-200 text-gray-800 hover:bg-blue-100 hover:text-[#2557a7]"
//                     }`}
//                   >
//                     {selectedTemplate === tpl.id ? "Selected" : "Use Template"}
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-1 text-sm text-gray-500 text-center py-8">
//               No templates found for {selectedCategory}
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="flex flex-col gap-4 text-gray-700">
//           {/* Font Family */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
//             <select
//               value={resumeStyle.fontFamily}
//               onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
//               className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
//             >
//               <option value="times-new-roman">Times New Roman</option>
//               <option value="arial">Arial</option>
//               <option value="monospace">Monospace</option>                            
//               <option value="calibri">Calibri</option>
//             </select>
//           </div>

//           {/* Typography Scale */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Typography Scale
//             </h4>        
//             <div className="grid grid-cols-1 gap-3">
//               {/* Name Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Name Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="20"
//                     max="48"
//                     value={parseInt(resumeStyle.nameFontSize) || 28}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.nameFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, nameFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Heading Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Heading Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="12"
//                     max="24"
//                     value={parseInt(resumeStyle.headingFontSize) || 18}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.headingFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Body Font Size */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-1">Body Font Size</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="range"
//                     min="10"
//                     max="16"
//                     value={parseInt(resumeStyle.bodyFontSize) || 12}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
//                     className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                   />
//                   <input
//                     type="text"
//                     value={resumeStyle.bodyFontSize}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
//                     className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Text Formatting */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Text Formatting</label>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, bold: !resumeStyle.bold })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm font-bold transition-all duration-200 ${
//                   resumeStyle.bold 
//                     ? "bg-blue-100 border-blue-300 text-blue-500" 
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 B
//               </button>
//               <button
//                 onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
//                 className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
//                   resumeStyle.italic 
//                     ? "bg-blue-100 border-blue-300 text-blue-500" 
//                     : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 I
//               </button>
//             </div>
//           </div>

//           {/* Line Spacing */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-1.5">Line Spacing</label>
//             <div className="flex items-center gap-2">
//               <input
//                 type="range"
//                 min="1"
//                 max="2.5"
//                 step="0.1"
//                 value={parseFloat(resumeStyle.lineSpacing) || 1.5}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//               />
//               <input
//                 type="text"
//                 value={resumeStyle.lineSpacing}
//                 onChange={(e) => setResumeStyle({ ...resumeStyle, lineSpacing: e.target.value })}
//                 className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-blue-400 focus:outline-none transition-all duration-200"
//               />
//             </div>
//             <div className="flex justify-between text-xs text-gray-500 mt-1">
//               <span>Tight</span>
//               <span>Normal</span>
//               <span>Loose</span>
//             </div>
//           </div>

//           {/* Color Palette */}
//           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-2">
//               Color Palette
//             </h4>        
//             <div className="grid grid-cols-1 gap-3">
//               {/* Heading Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Heading Color</label>
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="color"
//                     value={resumeStyle.headingColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input 
//                     type="text" 
//                     value={resumeStyle.headingColor} 
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 <div className="flex gap-1 mt-2">
//                   {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
//                     <button 
//                       key={color} 
//                       style={{ backgroundColor: color }}
//                       onClick={() => setResumeStyle({ ...resumeStyle, headingColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                     />
//                   ))}
//                 </div>
//               </div>

//               {/* Body Color */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-700 mb-2">Body Color</label>
//                 <div className="flex items-center gap-2">
//                   <input 
//                     type="color" 
//                     value={resumeStyle.bodyColor}
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-blue-400 transition-all duration-200"
//                   />
//                   <input 
//                     type="text" 
//                     value={resumeStyle.bodyColor} 
//                     placeholder="#000000"
//                     onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
//                     className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-blue-400 focus:outline-none transition-all duration-200"
//                   />
//                 </div>
//                 <div className="flex gap-1 mt-2">
//                   {['#374151', '#4b5563', '#6b7280', '#1f2937', '#0f172a', '#111827'].map((color) => (
//                     <button
//                       key={color}
//                       onClick={() => setResumeStyle({ ...resumeStyle, bodyColor: color })}
//                       className="w-6 h-6 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-200"
//                       style={{ backgroundColor: color }}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Quick Presets */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-800 mb-2">Quick Style Presets</label>
//             <div className="grid grid-cols-2 gap-2">
//               <button 
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Inter, sans-serif', 
//                   nameFontSize: '32px', 
//                   headingFontSize: '18px', 
//                   bodyFontSize: '14px', 
//                   lineSpacing: '1.5', 
//                   headingColor: '#1f2937', 
//                   bodyColor: '#374151'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Modern
//               </button>
//               <button 
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Playfair Display, serif', 
//                   nameFontSize: '36px', 
//                   headingFontSize: '20px', 
//                   bodyFontSize: '14px', 
//                   lineSpacing: '1.6', 
//                   headingColor: '#0f172a', 
//                   bodyColor: '#1f2937'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Classic
//               </button>
//               <button 
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Roboto, sans-serif', 
//                   nameFontSize: '28px', 
//                   headingFontSize: '16px', 
//                   bodyFontSize: '13px', 
//                   lineSpacing: '1.4', 
//                   headingColor: '#1e40af', 
//                   bodyColor: '#374151'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Corporate
//               </button>
//               <button 
//                 onClick={() => setResumeStyle({
//                   ...resumeStyle,
//                   fontFamily: 'Open Sans, sans-serif', 
//                   nameFontSize: '30px', 
//                   headingFontSize: '17px', 
//                   bodyFontSize: '14px', 
//                   lineSpacing: '1.5', 
//                   headingColor: '#059669', 
//                   bodyColor: '#4b5563'
//                 })}
//                 className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
//               >
//                 Creative
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TemplatesTab;


