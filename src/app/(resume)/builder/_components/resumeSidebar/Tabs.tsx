import React from "react";
import {
  Sparkles,
  Edit3,
  MessageSquare,
  SidebarOpen,
  SidebarClose,
} from "lucide-react";

interface TabsProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ isOpen, onToggle, activeTab, setActiveTab }) => {
  const tabs = [
    { name: "ResumeGPT", icon: Sparkles },
    { name: "Editor", icon: Edit3 },
    { name: "AI Review", icon: MessageSquare },
  ];

  return (
    <div className="relative flex items-center gap-4 mb-1 border-b border-gray-200 px-3 pt-1 w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.name;

        return (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`relative flex items-center gap-1 py-3 text-xs font-semibold transition whitespace-nowrap
              ${isActive ? "text-orange-500" : "text-gray-600 hover:text-orange-500"}`}
          >
            <Icon size={16} />
            {tab.name}

            {/* Active underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t"></span>
            )}
          </button>
        );
      })}

      {/* Sidebar Toggle Button */}
      <button onClick={onToggle} className="ml-auto px-3 py-2 text-gray-500">
        {isOpen ? <SidebarClose size={18} /> : <SidebarOpen size={18} />}
      </button>
    </div>
  );
};

export default Tabs;



