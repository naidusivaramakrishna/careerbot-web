"use client";
import React, { useRef, useEffect } from "react";
import {
  Edit3,
  BarChart2,
  SidebarOpen,
  SidebarClose,
} from "lucide-react";


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
    { name: "Editor", icon: Edit3 },
    { name: "Score", icon: BarChart2 },
  ];


  return (
    <div className="flex items-center mb-1 border border-gray-300 rounded px-3 pt-0.5 w-full shadow-sm relative z-30 transition-all duration-300 ease-in-out">
      {/* Tab buttons — equal-width, centered */}
      <div className="flex flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.name;

          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition whitespace-nowrap ${
                isActive
                  ? "text-[#2557a7]"
                  : "text-gray-600 hover:text-[#2557a7]"
              }`}
            >
              <Icon size={15} />
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
        className="py-2 text-gray-400 hover:text-gray-600 flex-shrink-0 transition"
      >
        {isOpen ? <SidebarClose size={17} /> : <SidebarOpen size={17} />}
      </button>
    </div>
  );
};


export default Tabs;
