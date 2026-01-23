// import React from "react";
// import Header from "./_components/Header";
// import ResumeSide from "./_components/resumeSidebar/ResumeSide";
// import TemplatesSidebar from "./_components/templateSidebar/TemplatesSidebar";
// import PreviewPanel from "./_components/PreviewPanel";


// const Builder: React.FC = () => (
//   <>
//   {/* <div className="h-screen overflow-y-auto">  */}
//     <Header />
//     <div className="flex h-screen">
//       <ResumeSide />
//       <main className="flex-1 bg-gray-50 px-10 py-8">
//         {/* Add your main resume content here */}
//         <PreviewPanel />
//       </main>
//       <TemplatesSidebar />
//     </div>
//   {/* </div>  */}
//   </>

// );

// export default Builder;

// "use client";
// import React, { useState } from "react";
// import Header from "./_components/Header";
// import ResumeSide from "./_components/resumeSidebar/ResumeSide";
// import TemplatesSidebar from "./_components/templateSidebar/TemplatesSidebar";
// import PreviewPanel from "./_components/PreviewPanel";

// const Builder: React.FC = () => {
//   // Shared state between both sidebars
//   const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(true);
//   const handleToggleTemplateSidebar = (isOpen: boolean) => {
//     setIsTemplateSidebarOpen(isOpen);
//   };

//   return (
//     <>
//       <Header />
//       <div className="flex h-screen">
//         {/* ResumeSide auto-adjusts width */}
//         {/* <ResumeSide isTemplateSidebarOpen={isTemplateSidebarOpen} /> */}
//         <ResumeSide
//         isTemplateSidebarOpen={isTemplateSidebarOpen}
//         onToggleTemplateSidebar={handleToggleTemplateSidebar}
//       />

//         <main className="flex-1 bg-gray-50 px-2 py-1">
//           <PreviewPanel />
//         </main>

//         {/* Pass setIsTemplateSidebarOpen to TemplatesSidebar */}
//         {/* <TemplatesSidebar onToggle={setIsTemplateSidebarOpen} /> */}
//         <TemplatesSidebar
//         isOpen={isTemplateSidebarOpen}
//         onToggle={handleToggleTemplateSidebar}
//       />
//       </div>
//     </>
//   );
// };

// export default Builder;


// "use client";
// import React, { useState } from "react";
// import Header from "./_components/Header";
// import ResumeSide from "./_components/resumeSidebar/ResumeSide";
// import TemplatesSidebar from "./_components/templateSidebar/TemplatesSidebar";
// import PreviewPanel from "./_components/PreviewPanel";


// const Builder: React.FC = () => {
//   // Shared state between both sidebars
//   const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("Templates");

//   const handleToggleTemplateSidebar = (isOpen: boolean) => {
//     setIsTemplateSidebarOpen(isOpen);
//   };

//   const handleTabClickFromToolbar = (tab: string) => {
//     setActiveTab(tab);
//     setIsTemplateSidebarOpen(true);
//   };

//   return (
//     <>
//       <Header />
//       <div className="flex h-screen">
//         <ResumeSide
//           isTemplateSidebarOpen={isTemplateSidebarOpen}
//           onToggleTemplateSidebar={handleToggleTemplateSidebar}
//         />

//         <main className="flex-1 bg-gray-50 px-2 py-1">
//           <PreviewPanel 
//             isTemplateSidebarOpen={isTemplateSidebarOpen}
//             onTabClick={handleTabClickFromToolbar}
//           />
//         </main>

//         <TemplatesSidebar
//           isOpen={isTemplateSidebarOpen}
//           onToggle={handleToggleTemplateSidebar}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//         />
//       </div>
//     </>
//   );
// };

// export default Builder; before save


"use client";
import React, { useState, useEffect } from "react"; // ✅ Added useEffect
import Header from "./_components/Header";
import ResumeSide from "./_components/resumeSidebar/ResumeSide";
import TemplatesSidebar from "./_components/templateSidebar/TemplatesSidebar";
import PreviewPanel from "./_components/PreviewPanel";

const Builder: React.FC = () => {
  // ✅ Initialize from localStorage, default closed if template is selected
  const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem("template_sidebar_open");
      const hasTemplate = localStorage.getItem("selected_template");
      
      // If saved state exists, use it
      if (savedState !== null) {
        return savedState === "true";
      }
      
      // If template is selected, close sidebar by default
      if (hasTemplate) {
        return false;
      }
      
      // Default: open
      return true;
    }
    return true;
  });
  
  const [activeTab, setActiveTab] = useState("Templates");

  // ✅ Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("template_sidebar_open", String(isTemplateSidebarOpen));
  }, [isTemplateSidebarOpen]);

  const handleToggleTemplateSidebar = (isOpen: boolean) => {
    setIsTemplateSidebarOpen(isOpen);
  };

  const handleTabClickFromToolbar = (tab: string) => {
    setActiveTab(tab);
    setIsTemplateSidebarOpen(true);
  };

  return (
    <>
      <Header />
      <div className="flex h-screen">
        <ResumeSide
          isTemplateSidebarOpen={isTemplateSidebarOpen}
          onToggleTemplateSidebar={handleToggleTemplateSidebar}
        />

        <main className="flex-1 bg-gray-50 ">
          <PreviewPanel 
            isTemplateSidebarOpen={isTemplateSidebarOpen}
            onTabClick={handleTabClickFromToolbar}
          />
        </main>

        <TemplatesSidebar
          isOpen={isTemplateSidebarOpen}
          onToggle={handleToggleTemplateSidebar}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </>
  );
};

export default Builder; 
// before score auto calculate


// "use client";
// import React, { useState, useEffect } from "react";
// import Header from "./_components/Header";
// import ResumeSide from "./_components/resumeSidebar/ResumeSide";
// import TemplatesSidebar from "./_components/templateSidebar/TemplatesSidebar";
// import PreviewPanel from "./_components/PreviewPanel";
// import BackgroundScoreCalculator from "./_components/score/BackgroundScoreCalculator"; // ✅ Import

// const Builder: React.FC = () => {
//   const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(() => {
//     if (typeof window !== 'undefined') {
//       const savedState = localStorage.getItem("template_sidebar_open");
//       const hasTemplate = localStorage.getItem("selected_template");
      
//       if (savedState !== null) {
//         return savedState === "true";
//       }
      
//       if (hasTemplate) {
//         return false;
//       }
      
//       return true;
//     }
//     return true;
//   });
  
//   const [activeTab, setActiveTab] = useState("Templates");

//   useEffect(() => {
//     localStorage.setItem("template_sidebar_open", String(isTemplateSidebarOpen));
//   }, [isTemplateSidebarOpen]);

//   const handleToggleTemplateSidebar = (isOpen: boolean) => {
//     setIsTemplateSidebarOpen(isOpen);
//   };

//   const handleTabClickFromToolbar = (tab: string) => {
//     setActiveTab(tab);
//     setIsTemplateSidebarOpen(true);
//   };

//   return (
//     <>
//       <Header />
      
//       {/* ✅ Background Score Calculator - Always mounted */}
//       <BackgroundScoreCalculator />
      
//       <div className="flex h-screen">
//         <ResumeSide
//           isTemplateSidebarOpen={isTemplateSidebarOpen}
//           onToggleTemplateSidebar={handleToggleTemplateSidebar}
//         />

//         <main className="flex-1 bg-gray-50 py-1">
//           <PreviewPanel 
//             isTemplateSidebarOpen={isTemplateSidebarOpen}
//             onTabClick={handleTabClickFromToolbar}
//           />
//         </main>

//         <TemplatesSidebar
//           isOpen={isTemplateSidebarOpen}
//           onToggle={handleToggleTemplateSidebar}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//         />
//       </div>
//     </>
//   );
// };

// export default Builder;



