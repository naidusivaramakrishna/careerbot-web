// import React from "react";
// import {
//   Sparkles,
//   Edit3,
//   MessageSquare,
//   SidebarOpen,
//   SidebarClose,
//   BarChart2,
//   Shuffle
// } from "lucide-react";

// interface TabsProps {
//   isOpen: boolean;
//   onToggle: () => void;
//   activeTab: string;
//   setActiveTab: (tab: string) => void;
// }

// const Tabs: React.FC<TabsProps> = ({ isOpen, onToggle, activeTab, setActiveTab }) => {
//   const tabs = [
//     { name: "ResumeGPT", icon: Sparkles },
//     { name: "Editor", icon: Edit3 },
//     { name: "AI Review", icon: MessageSquare },
//     { name: "Score", icon: BarChart2 },
//     { name: "Job Match", icon: Shuffle },
//   ];

//   return (
//     <div className="relative flex items-center gap-4 mb-1 border-b border-gray-200 px-3 pt-1 w-full">
//       {tabs.map((tab) => {
//         const Icon = tab.icon;
//         const isActive = activeTab === tab.name;

//         return (
//           <button
//             key={tab.name}
//             onClick={() => setActiveTab(tab.name)}
//             className={`relative flex items-center gap-1 py-3 text-xs font-semibold transition whitespace-nowrap
//               ${isActive ? "text-orange-500" : "text-gray-600 hover:text-orange-500"}`}
//           >
//             <Icon size={16} />
//             {tab.name}

//             {/* Active underline indicator */}
//             {isActive && (
//               <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t"></span>
//             )}
//           </button>
//         );
//       })}

//       {/* Sidebar Toggle Button */}
//       <button onClick={onToggle} className="ml-auto px-3 py-2 text-gray-500">
//         {isOpen ? <SidebarClose size={18} /> : <SidebarOpen size={18} />}
//       </button>
//     </div>
//   );
// };

// export default Tabs;


// import React from "react";
// import {
//   Sparkles,
//   Edit3,
//   MessageSquare,
//   SidebarOpen,
//   SidebarClose,
//   BarChart2,
//   Shuffle,
// } from "lucide-react";

// interface TabsProps {
//   isOpen: boolean;
//   onToggle: () => void;
//   activeTab: string;
//   setActiveTab: (tab: string) => void;
// }

// const Tabs: React.FC<TabsProps> = ({ isOpen, onToggle, activeTab, setActiveTab }) => {
//   const tabs = [
//     { name: "ResumeGPT", icon: Sparkles },
//     { name: "Editor", icon: Edit3 },
//     { name: "AI Review", icon: MessageSquare },
//     { name: "Score", icon: BarChart2 },
//     { name: "Job Match", icon: Shuffle },
//   ];

//   return (
//     <div className="relative flex items-center gap-2 mb-1 border-b border-gray-200 px-3 pt-1 w-full">
//       {/* Scrollable tab buttons */}
//       <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide flex-1">
//         {tabs.map((tab) => {
//           const Icon = tab.icon;
//           const isActive = activeTab === tab.name;

//           return (
//             <button
//               key={tab.name}
//               onClick={() => setActiveTab(tab.name)}
//               className={`relative flex items-center gap-1 py-3 text-sm font-semibold transition whitespace-nowrap
//                 ${isActive ? "text-orange-500" : "text-gray-600 hover:text-orange-500"}`}
//             >
//               <Icon size={16} />
//               {tab.name}
//               {isActive && (
//                 <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t"></span>
//               )}
//             </button>
//           );
//         })}
//       </div>

//       {/* Sidebar Toggle Button */}
//       <button onClick={onToggle} className="ml-2 px-3 py-2 text-gray-500 flex-shrink-0">
//         {isOpen ? <SidebarClose size={18} /> : <SidebarOpen size={18} />}
//       </button>
//     </div>
//   );
// };

// export default Tabs;

// "use client";
// import React, { useRef, useEffect } from "react";
// import {
//   Sparkles,
//   Edit3,
//   MessageSquare,
//   SidebarOpen,
//   SidebarClose,
//   // BarChart2,
//   // Shuffle,
// } from "lucide-react";

// interface TabsProps {
//   isOpen: boolean;
//   onToggle: () => void;
//   activeTab: string;
//   setActiveTab: (tab: string) => void;
// }

// const Tabs: React.FC<TabsProps> = ({
//   isOpen,
//   onToggle,
//   activeTab,
//   setActiveTab,
// }) => {
//   const scrollRef = useRef<HTMLDivElement>(null);

//   // ✅ Enable mouse wheel horizontal scroll
//   useEffect(() => {
//     const el = scrollRef.current;
//     if (!el) return;

//     const handleWheel = (e: WheelEvent) => {
//       if (e.deltaY === 0) return;
//       e.preventDefault();
//       el.scrollLeft += e.deltaY; // scroll horizontally
//     };

//     el.addEventListener("wheel", handleWheel, { passive: false });
//     return () => el.removeEventListener("wheel", handleWheel);
//   }, []);

//   const tabs = [
//     { name: "ResumeGPT", icon: Sparkles },
//     { name: "Editor", icon: Edit3 },
//     { name: "AI Review", icon: MessageSquare },
//     // { name: "Score", icon: BarChart2 },
//     // { name: "Job Match", icon: Shuffle },
//   ];

//   return (
//     <div className="relative flex items-center gap-0 mb-1 border-b border-gray-200 px-3 pt-1 w-full">
//       {/* Scrollable tab buttons */}
//       <div
//         ref={scrollRef}
//         className="flex items-center gap-4 overflow-x-auto scrollbar-hide flex-1 cursor-pointer"
//       >
//         {tabs.map((tab) => {
//           const Icon = tab.icon;
//           const isActive = activeTab === tab.name;

//           return (
//             <button
//               key={tab.name}
//               onClick={() => setActiveTab(tab.name)}
//               className={`relative flex items-center gap-1 py-3 text-xs font-semibold transition whitespace-nowrap
//                 ${
//                   isActive
//                     ? "text-blue-500"
//                     : "text-gray-600 hover:text-blue-500"
//                 }`}
//             >
//               <Icon size={16} />
//               {tab.name}
//               {isActive && (
//                 <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t"></span>
//               )}
//             </button>
//           );
//         })}
//       </div>

//       {/* Sidebar Toggle Button */}
//       <button
//         onClick={onToggle}
//         className="ml-2 px-3 py-2 text-gray-500 flex-shrink-0"
//       >
//         {isOpen ? <SidebarClose size={18} /> : <SidebarOpen size={18} />}
//       </button>
//     </div>
//   );
// };

// export default Tabs;

// "use client";
// import React, { useRef, useEffect } from "react";
// import {
//   Edit3,
//   MessageSquare,
//   SidebarOpen,
//   SidebarClose,
// } from "lucide-react";
// import { RiSparkling2Fill } from 'react-icons/ri';

// interface TabsProps {
//   isOpen: boolean;
//   onToggle: () => void;
//   activeTab: string;
//   setActiveTab: (tab: string) => void;
//   isTemplateSidebarOpen?: boolean; // ✅ new prop for dynamic sizing
// }

// const Tabs: React.FC<TabsProps> = ({
//   isOpen,
//   onToggle,
//   activeTab,
//   setActiveTab,
//   isTemplateSidebarOpen = true,
// }) => {
//   const scrollRef = useRef<HTMLDivElement>(null);

//   // ✅ Enable mouse wheel horizontal scroll
//   useEffect(() => {
//     const el = scrollRef.current;
//     if (!el) return;

//     const handleWheel = (e: WheelEvent) => {
//       if (e.deltaY === 0) return;
//       e.preventDefault();
//       el.scrollLeft += e.deltaY;
//     };

//     el.addEventListener("wheel", handleWheel, { passive: false });
//     return () => el.removeEventListener("wheel", handleWheel);
//   }, []);

//   const tabs = [
//     { name: "ResumeGPT", icon: RiSparkling2Fill },
//     { name: "Editor", icon: Edit3 },
//     { name: "AI Review", icon: MessageSquare },
//   ];

//   // ✅ Dynamic styles based on template sidebar state
//   const textSize = isTemplateSidebarOpen ? "text-sm" : "text-sm";
//   const tabGap = isTemplateSidebarOpen ? "gap-8" : "gap-10";

//   return (
//     <div className="relative flex items-center gap-0 mb-1 border-b border-gray-200 px-3 pt-1 w-full">
//       {/* Scrollable tab buttons */}
//       <div
//         // ref={scrollRef} overflow-x-auto scrollbar-hide
//         className={`flex items-center ${tabGap} flex-1 cursor-pointer transition-all duration-300`}
//       >
//         {tabs.map((tab) => {
//           const Icon = tab.icon;
//           const isActive = activeTab === tab.name;

//           return (
//             <button
//               key={tab.name}
//               onClick={() => setActiveTab(tab.name)}
//               className={`relative flex items-center gap-1 py-3 font-semibold transition whitespace-nowrap ${textSize} ${
//                 isActive
//                   ? "text-[#2557a7]"
//                   : "text-gray-800 hover:text-[#2557a7]"
//               }`}
//             >
//               <Icon size={16} />
//               {tab.name}
//               {isActive && (
//                 <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2557a7] rounded-t"></span>
//               )}
//             </button>
//           );
//         })}
//       </div>

//       {/* Sidebar Toggle Button */}
//       <button
//         onClick={onToggle}
//         className="ml-2 px-3 py-2 text-gray-500 flex-shrink-0"
//       >
//         {isOpen ? <SidebarClose size={18} /> : <SidebarOpen size={18} />}
//       </button>
//     </div>
//   );
// };

// export default Tabs;


"use client";
import React, { useRef, useEffect } from "react";
import {
  Edit3,
  MessageSquare,
  SidebarOpen,
  SidebarClose,
} from "lucide-react";
import { RiSparkling2Fill } from 'react-icons/ri';


interface TabsProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isTemplateSidebarOpen?: boolean; // ✅ new prop for dynamic sizing
}


const Tabs: React.FC<TabsProps> = ({
  isOpen,
  onToggle,
  activeTab,
  setActiveTab,
  isTemplateSidebarOpen = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);


  // ✅ Enable mouse wheel horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;


    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };


    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);


  const tabs = [
    { name: "ResumeGPT", icon: RiSparkling2Fill },
    { name: "Editor", icon: Edit3 },
    { name: "AI Review", icon: MessageSquare },
  ];


  // ✅ Dynamic styles based on template sidebar state
  const textSize = isTemplateSidebarOpen ? "text-sm" : "text-sm";
  const tabGap = isTemplateSidebarOpen ? "gap-4.5" : "gap-10";


  return (
    <div className="flex items-center gap-0 mb-1 border border-gray-300 rounded px-3 pt-0.5 w-full shadow-sm space-x-2 relative z-30 transition-all duration-300 ease-in-out">
      {/* Scrollable tab buttons */}
      <div
        // ref={scrollRef} overflow-x-auto scrollbar-hide
        className={`flex items-center ${tabGap} flex-1 cursor-pointer transition-all duration-300`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.name;


          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`relative flex items-center gap-1 py-2.5 font-semibold transition whitespace-nowrap ${textSize} ${
                isActive
                  ? "text-[#2557a7]"
                  : "text-gray-800 hover:text-[#2557a7]"
              }`}
            >
              <Icon size={16} />
              {tab.name}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2557a7] rounded-t"></span>
              )}
            </button>
          );
        })}
      </div>


      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggle}
        className="px-3 py-2 text-gray-500 flex-shrink-0"
      >
        {isOpen ? <SidebarClose size={18} /> : <SidebarOpen size={18} />}
      </button>
    </div>
  );
};


export default Tabs;
