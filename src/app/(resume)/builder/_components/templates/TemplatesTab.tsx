"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useResume } from "../../_context/ResumeContext";
const templates = [
  { id: 1, subtitle: "Modern", imgSrc: "/assets/templates/template-1.png", atsFriendly: true },
  { id: 2, subtitle: "Classic", imgSrc: "/assets/templates/template-2.png", atsFriendly: true },
];
const TemplatesTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePanel, setActivePanel] = useState<"templates" | "style">("templates");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { selectedTemplate, setSelectedTemplate, resumeStyle, setResumeStyle } = useResume();
  // categories
  const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.subtitle)))];
  // filter templates
  const filteredTemplates = templates.filter((tpl) => {
    const matchCategory = selectedCategory === "All" || tpl.subtitle === selectedCategory;
    const matchSearch = tpl.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });
  // close dropdown if click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <>
      {/* Search input */}
      {activePanel === "templates" && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-600 focus:border-orange-400 placeholder-gray-400 transition-all duration-200 ease-in-out focus:outline-none hover:shadow-sm"
          />
        </div>
      )}
      {/* Switch Buttons */}
      <div className="flex items-center gap-8 mb-4 relative">
        {/* Categories Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setActivePanel("templates");
            }}
            className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
              activePanel === "templates"
                ? "bg-orange-50 text-orange-500 border-orange-200"
                : "text-gray-700 hover:text-orange-500 hover:bg-orange-100 hover:border-orange-200"
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
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-orange-100 ${
                    selectedCategory === cat ? "bg-orange-50 text-orange-600" : "text-gray-700"
                  }`}
                >
                  {cat}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Style Button */}
        <button
          onClick={() => {
            setActivePanel("style");
            setDropdownOpen(false);
          }}
          className={`bg-gray-50 border border-gray-400 rounded px-9 py-1 text-xs font-semibold ${
            activePanel === "style"
              ? "bg-orange-50 text-orange-500 border-orange-200"
              : "text-gray-700 hover:text-orange-500 hover:bg-orange-100 hover:border-orange-200"
          }`}
        >
          Style
        </button>
      </div>
      {/* Main Content */}
      {activePanel === "templates" ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 mb-6">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className={`relative flex flex-col items-center rounded-lg shadow-sm border ${
                  selectedTemplate === tpl.id
                    ? "border-orange-500"
                    : "border-gray-200"
                } bg-white overflow-hidden`}
              >
                {/* ATS Friendly Badge - shows only if template is ATS friendly */}
                {tpl.atsFriendly && (
                  <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-orange-500">
                    100% ATS Friendly
                  </span>
                )}
                <Image
                  src={tpl.imgSrc}
                  alt={`template-${tpl.id}`}
                  width={160}
                  height={200}
                  className="w-full h-48 object-contain bg-gray-100"
                />
                <div className="w-full px-2 py-1 flex flex-col items-center">
                  <button
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`mt-2 w-full rounded py-1 text-xs font-semibold transition ${
                      selectedTemplate === tpl.id
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 border border-gray-200 text-gray-800 hover:bg-orange-100 hover:text-orange-500"
                    }`}
                  >
                    {selectedTemplate === tpl.id ? "Selected" : "Use Template"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-sm text-gray-500 text-center">
              No templates found
            </div>
          )}
        </div>
      ) : (
        // <div className="flex flex-col gap-3 text-gray-700">
        <div className="flex flex-col gap-4 text-gray-700">
          {/* Font Family */}
          <div>
            {/* <label className="text-xs font-medium">Font Family</label> */}
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">Font Family</label>
            <select
              value={resumeStyle.fontFamily}
              onChange={(e) => setResumeStyle({ ...resumeStyle, fontFamily: e.target.value })}
            //   className="w-full border rounded px-2 py-1 text-sm"
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-orange-400 focus:outline-none transition-all duration-200 hover:border-gray-300"
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
           {/* <span className="w-2 h-2 rounded-full"></span> */}
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
                 className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none"
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
                 className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none"
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
                 value={parseInt(resumeStyle.bodyFontSize) || 14}
                 onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: `${e.target.value}px` })}
                 className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
               />
               <input
                 type="text"
                 value={resumeStyle.bodyFontSize}
                 onChange={(e) => setResumeStyle({ ...resumeStyle, bodyFontSize: e.target.value })}
                 className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none"
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
                 ? "bg-orange-100 border-orange-300 text-orange-500" 
                 : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
             }`}
           >
             B
           </button>
           <button
             onClick={() => setResumeStyle({ ...resumeStyle, italic: !resumeStyle.italic })}
             className={`flex items-center justify-center w-10 h-10 border-2 rounded-lg text-sm italic transition-all duration-200 ${
               resumeStyle.italic 
                 ? "bg-orange-100 border-orange-300 text-orange-500" 
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
             className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:border-orange-400 focus:outline-none transition-all duration-200"
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
           {/* <span className="w-2 h-2 bg-blue-400 rounded-full"></span> */}
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
                 className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-orange-400 transition-all duration-200"
               />
               <input type="text" value={resumeStyle.headingColor} placeholder="#000000"
                 onChange={(e) => setResumeStyle({ ...resumeStyle, headingColor: e.target.value })}
                 className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-orange-400 focus:outline-none transition-all duration-200"
               />
             </div>
             {/* Color Presets for Headings */}
             <div className="flex gap-1 mt-2">
               {['#1f2937', '#374151', '#0f172a', '#1e40af', '#dc2626', '#059669'].map((color) => (
                 <button key={color} style={{ backgroundColor: color }}
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
               <input type="color" value={resumeStyle.bodyColor}
                 onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
                 className="w-12 h-10 border-2 border-gray-200 rounded-lg cursor-pointer focus:border-orange-400 transition-all duration-200"
               />
               <input type="text" value={resumeStyle.bodyColor} placeholder="#000000"
                 onChange={(e) => setResumeStyle({ ...resumeStyle, bodyColor: e.target.value })}
                 className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-orange-400 focus:outline-none transition-all duration-200"
               />
             </div>
             {/* Color Presets for Body */}
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
           <button onClick={() => setResumeStyle({
               ...resumeStyle,
               fontFamily: 'Inter, sans-serif', nameFontSize: '32px', headingFontSize: '18px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#1f2937', bodyColor: '#374151'
             })}
             className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
           >
             Modern
           </button>
           <button onClick={() => setResumeStyle({
               ...resumeStyle,
               fontFamily: 'Playfair Display, serif', nameFontSize: '36px', headingFontSize: '20px', bodyFontSize: '14px', lineSpacing: '1.6', headingColor: '#0f172a', bodyColor: '#1f2937'
             })}
             className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
           >
             Classic
           </button>
           <button onClick={() => setResumeStyle({
               ...resumeStyle,
                fontFamily: 'Roboto, sans-serif', nameFontSize: '28px', headingFontSize: '16px', bodyFontSize: '13px', lineSpacing: '1.4', headingColor: '#1e40af', bodyColor: '#374151'
             })}
             className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
           >
             Corporate
           </button>
           <button onClick={() => setResumeStyle({
               ...resumeStyle,
               fontFamily: 'Open Sans, sans-serif', nameFontSize: '30px', headingFontSize: '17px', bodyFontSize: '14px', lineSpacing: '1.5', headingColor: '#059669', bodyColor: '#4b5563'
             })}
             className="p-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
           >
             Creative
           </button>
         </div>
       </div>
        </div>
      )}
    </>
  );
};
export default TemplatesTab; 





