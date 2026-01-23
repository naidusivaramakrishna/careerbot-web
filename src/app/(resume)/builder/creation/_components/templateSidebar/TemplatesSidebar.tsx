// "use client";
// import React, { useState } from "react";
// import Tabs from "./Tabs";
// import TemplatesTab from "../templates/TemplatesTab";
// import ScoreTab from "../score/ScoreTab";
// import JobMatchTab from "../job/JobMatchTab";
// import { SidebarClose } from "lucide-react";

// const TemplatesSidebar: React.FC = () => {
//   const [activeTab, setActiveTab] = useState("Templates");
//   const [isOpen, setIsOpen] = useState(true);

//   const renderContent = () => {
//     switch (activeTab) {
//       case "Templates":
//         return <TemplatesTab />;
//       case "Score":
//         return <ScoreTab />;
//       case "Job Match":
//         return <JobMatchTab />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <aside
//       className={`transition-all duration-300 bg-white border-l border-gray-200 relative flex flex-col min-h-[calc(100vh-60px)]
//         ${isOpen ? "w-[30%] px-3" : "w-12 p-0"}`}
//     >
//       {/* Tabs (hidden automatically when isOpen=false) */}
//       <Tabs
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         isOpen={isOpen}
//         onToggle={() => setIsOpen(!isOpen)}
//       />

//       {/* Main content when open */}
//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {renderContent()}
//         </div>
//       )}

//       {/* Floating SidebarOpen icon when closed */}
//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-orange-200 rounded-lg p-1 shadow hover:shadow-md hover:border-orange-400 transition"
//         >
//           <SidebarClose className="text-orange-500" size={20} />
//         </button>
//       )}
//     </aside>
//   );
// };

// export default TemplatesSidebar;


// "use client";
// import React, { useState } from "react";
// import Tabs from "./Tabs";
// import TemplatesTab from "../templates/TemplatesTab";
// import { SidebarClose } from "lucide-react";

// const TemplatesSidebar: React.FC = () => {
//   const [activeTab, setActiveTab] = useState("Templates");
//   const [isOpen, setIsOpen] = useState(true);

//   return (
//     <aside
//       className={`transition-all duration-300 bg-white border-l border-gray-200 relative flex flex-col min-h-[calc(100vh-60px)]
//         ${isOpen ? "w-[30%] px-3" : "w-12 p-0"}`}
//     >
//       {/* Tabs */}
//       <Tabs
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         isOpen={isOpen}
//         onToggle={() => setIsOpen(!isOpen)}
//       />

//       {/* Content */}
//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Templates" && <TemplatesTab />}
//         </div>
//       )}

//       {/* Floating open button */}
//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-orange-200 rounded-lg p-1 shadow hover:shadow-md hover:border-orange-400 transition"
//         >
//           <SidebarClose className="text-orange-500" size={20} />
//         </button>
//       )}
//     </aside>
//   );
// };

// export default TemplatesSidebar;

// "use client";
// import React, { useState } from "react";
// import Tabs from "./Tabs";
// import TemplatesTab from "../templates/TemplatesTab";
// import { SidebarClose } from "lucide-react";

// const TemplatesSidebar: React.FC = () => {
//   const [activeTab, setActiveTab] = useState("Templates");
//   const [isOpen, setIsOpen] = useState(true);

//   return (
//     <aside
//       className={`transition-all duration-300 bg-white border-l border-gray-200 relative flex flex-col min-h-[calc(100vh-60px)]
//         ${isOpen ? "w-[25%] px-3" : "w-12 p-0"}`}
//     >
//       {/* Tabs */}
//       <Tabs
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         isOpen={isOpen}
//         onToggle={() => setIsOpen(!isOpen)}
//       />

//       {/* Content */}
//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Templates" && (
//             <TemplatesTab
//               onTemplateSelect={() => {
//                 setIsOpen(false); // ✅ Automatically close sidebar when template selected
//               }}
//             />
//           )}
//         </div>
//       )}

//       {/* Floating open button */}
//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-orange-200 rounded-lg p-1 shadow hover:shadow-md hover:border-orange-400 transition"
//         >
//           <SidebarClose className="text-orange-500" size={20} />
//         </button>
//       )}
//     </aside>
//   );
// };

// export default TemplatesSidebar; before autoclose

// "use client";
// import React, { useState } from "react";
// import Tabs from "./Tabs";
// import TemplatesTab from "../templates/TemplatesTab";
// import { SidebarClose } from "lucide-react";

// const TemplatesSidebar: React.FC = () => {
//   const [activeTab, setActiveTab] = useState("Templates");
//   const [isOpen, setIsOpen] = useState(true);

//   // ✅ This function will close the sidebar automatically
//   const handleTemplateSelect = () => {
//     setIsOpen(false);
//   };

//   return (
//     <aside
//       className={`transition-all duration-300 bg-white border-l border-gray-200 relative flex flex-col min-h-[calc(100vh-60px)]
//         ${isOpen ? "w-[25%] px-3" : "w-12 p-0"}`}
//     >
//       {/* Tabs Header */}
//       <Tabs
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         isOpen={isOpen}
//         onToggle={() => setIsOpen(!isOpen)}
//       />

//       {/* Sidebar Content */}
//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Templates" && (
//             <TemplatesTab onTemplateSelect={handleTemplateSelect} />
//           )}
//         </div>
//       )}

//       {/* Floating reopen button (appears when closed) */}
//       {!isOpen && (
//         <button
//           onClick={() => setIsOpen(true)}
//           className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-orange-200 rounded-lg p-1 shadow hover:shadow-md hover:border-orange-400 transition"
//         >
//           <SidebarClose className="text-orange-500" size={20} />
//         </button>
//       )}
//     </aside>
//   );
// };

// export default TemplatesSidebar; before auto adjust resumeside


// "use client";
// import React, { useState } from "react";
// import Tabs from "./Tabs";
// import TemplatesTab from "../templates/TemplatesTab";
// import ScoreTab from "../score/ScoreTab";
// import JobMatchTab from "../job/JobMatchTab";
// import { SidebarClose } from "lucide-react";

// interface TemplatesSidebarProps {
//   onToggle?: (isOpen: boolean) => void; // optional for safety
// }

// const TemplatesSidebar: React.FC<TemplatesSidebarProps> = ({ onToggle }) => {
//   const [activeTab, setActiveTab] = useState("Templates");
//   const [isOpen, setIsOpen] = useState(true);

//   const handleTemplateSelect = () => {
//     setIsOpen(false);
//     if (onToggle) onToggle(false);
//   };

//   const handleToggleSidebar = () => {
//     const newState = !isOpen;
//     setIsOpen(newState);
//     if (onToggle) onToggle(newState);
//   };

//   return (
//     <aside
//       className={`transition-all duration-300 bg-white border-l border-gray-200 relative flex flex-col min-h-[calc(100vh-60px)]
//         ${isOpen ? "w-[28%] px-3" : "w-12 p-0"}`}
//     >
//       <Tabs
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         isOpen={isOpen}
//         onToggle={handleToggleSidebar}
//       />

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Templates" && (
//             <TemplatesTab onTemplateSelect={handleTemplateSelect} />
//           )}
//           {activeTab === "Score" && <ScoreTab />}
//           {activeTab === "Job Match" && <JobMatchTab />}
//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={handleToggleSidebar}
//           className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border rounded p-1.5 shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarClose className="text-blue-500" size={20} />
//         </button>
//       )}
//     </aside>
//   );
// };

// export default TemplatesSidebar; before section open temp auto




// "use client";
// import React, { useState, useEffect } from "react";
// import Tabs from "./Tabs";
// import TemplatesTab from "../templates/TemplatesTab";
// import ScoreTab from "../score/ScoreTab";
// import JobMatchTab from "../job/JobMatchTab";
// import { SidebarClose } from "lucide-react";

// interface TemplatesSidebarProps {
//   onToggle?: (isOpen: boolean) => void;
//   isOpen?: boolean;
// }

// const TemplatesSidebar: React.FC<TemplatesSidebarProps> = ({ onToggle, isOpen: externalIsOpen }) => {
//   const [activeTab, setActiveTab] = useState("Templates");
//   const [isOpen, setIsOpen] = useState(true);

//   // Sync internal state with external prop
//   useEffect(() => {
//     if (externalIsOpen !== undefined) {
//       setIsOpen(externalIsOpen);
//     }
//   }, [externalIsOpen]);

//   const handleTemplateSelect = () => {
//     setIsOpen(false);
//     if (onToggle) onToggle(false);
//   };

//   const handleToggleSidebar = () => {
//     const newState = !isOpen;
//     setIsOpen(newState);
//     if (onToggle) onToggle(newState);
//   };

//   return (
//     <aside
//       className={`transition-all duration-300 bg-white border-l border-gray-200 relative flex flex-col min-h-[calc(100vh-60px)]
//         ${isOpen ? "w-[28%] px-3" : "w-12 p-0"}`}
//     >
//       <Tabs
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         isOpen={isOpen}
//         onToggle={handleToggleSidebar}
//       />

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Templates" && (
//             <TemplatesTab onTemplateSelect={handleTemplateSelect} />
//           )}
//           {activeTab === "Score" && <ScoreTab />}
//           {activeTab === "Job Match" && <JobMatchTab />}
//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={handleToggleSidebar}
//           className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border rounded p-1.5 shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarClose className="text-blue-500" size={20} />
//         </button>
//       )}
//     </aside>
//   );
// };

// export default TemplatesSidebar; 
//   before template tabs in preview panel



// "use client";
// import React, { useEffect } from "react";
// import Tabs from "./Tabs";
// import TemplatesTab from "../templates/TemplatesTab";
// import ScoreTab from "../score/ScoreTab";
// import JobMatchTab from "../job/JobMatchTab";
// import { SidebarClose } from "lucide-react";

// interface TemplatesSidebarProps {
//   onToggle?: (isOpen: boolean) => void;
//   isOpen?: boolean;
//   activeTab: string;
//   setActiveTab: (tab: string) => void;
// }

// const TemplatesSidebar: React.FC<TemplatesSidebarProps> = ({ 
//   onToggle, 
//   isOpen: externalIsOpen,
//   activeTab,
//   setActiveTab 
// }) => {
//   const [isOpen, setIsOpen] = React.useState(true);

//   // Sync internal state with external prop
//   useEffect(() => {
//     if (externalIsOpen !== undefined) {
//       setIsOpen(externalIsOpen);
//     }
//   }, [externalIsOpen]);

//   const handleTemplateSelect = () => {
//     setIsOpen(false);
//     if (onToggle) onToggle(false);
//   };

//   const handleToggleSidebar = () => {
//     const newState = !isOpen;
//     setIsOpen(newState);
//     if (onToggle) onToggle(newState);
//   };

//   return (
//     <aside
//       className={`transition-all duration-300 bg-white border-l border-gray-200 relative flex flex-col min-h-[calc(100vh-60px)]
//         ${isOpen ? "w-[28%] px-3" : "w-12 p-0"}`}
//     >
//       <Tabs
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         isOpen={isOpen}
//         onToggle={handleToggleSidebar}
//       />

//       {isOpen && (
//         <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
//           {activeTab === "Templates" && (
//             <TemplatesTab onTemplateSelect={handleTemplateSelect} />
//           )}
//           {activeTab === "Score" && <ScoreTab />}
//           {activeTab === "Job Match" && <JobMatchTab />}
//         </div>
//       )}

//       {!isOpen && (
//         <button
//           onClick={handleToggleSidebar}
//           className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border rounded p-1.5 shadow hover:shadow-md hover:border-blue-400 transition"
//         >
//           <SidebarClose className="text-blue-500" size={20} />
//         </button>
//       )}
//     </aside>
//   );
// };

// export default TemplatesSidebar;



"use client";
import React, { useEffect } from "react";
import Tabs from "./Tabs";
import TemplatesTab from "../templates/TemplatesTab";
import ScoreTab from "../score/ScoreTab";
import JobMatchTab from "../job/JobMatchTab";
import { SidebarClose } from "lucide-react";

interface TemplatesSidebarProps {
  onToggle?: (isOpen: boolean) => void;
  isOpen?: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TemplatesSidebar: React.FC<TemplatesSidebarProps> = ({ 
  onToggle, 
  isOpen: externalIsOpen,
  activeTab,
  setActiveTab 
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  // Sync internal state with external prop
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  const handleTemplateSelect = () => {
    setIsOpen(false);
    if (onToggle) onToggle(false);
  };

  const handleToggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) onToggle(newState);
  };

  return (
    <div
      // className={`transition-all duration-300 bg-white border-l border-gray-200 relative flex flex-col min-h-[calc(100vh-60px)]
      className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
        ${isOpen ? "w-[28%]" : "w-12 p-0"}`}
    >
      {isOpen && (
        <Tabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isOpen}
          onToggle={handleToggleSidebar}
      />
      )}

      {isOpen && (
        <div className="flex flex-col flex-1 px-2 py-4 overflow-y-scroll scrollbar-hide bg-white">
          {activeTab === "Templates" && (
            <TemplatesTab onTemplateSelect={handleTemplateSelect} />
          )}
          {activeTab === "Score" && <ScoreTab />}
          {activeTab === "Job Match" && <JobMatchTab />}
        </div>
      )}

      {!isOpen && (
        <button
          onClick={handleToggleSidebar}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-white rounded p-1.5 shadow hover:shadow-md hover:border-blue-400 transition"
        >
          <SidebarClose className="text-blue-500" size={20} />
        </button>
      )}
    </div>
  );
};

export default TemplatesSidebar;



