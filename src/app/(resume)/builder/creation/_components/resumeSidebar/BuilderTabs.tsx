"use client";
import React from "react";
import { BarChart3, FileText, SlidersHorizontal } from "lucide-react";
import type { LucideProps } from "lucide-react";

/** Bullseye with an arrow flying into the centre (lucide's Target has no arrow). */
const TargetArrow = ({ className, strokeWidth = 1.8, ...props }: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
    {...props}
  >
    <path d="M12 7a5 5 0 1 0 5 5" />
    <path d="M13 3.055a9 9 0 1 0 7.941 7.945" />
    <path d="M15 6v3h3l3-3h-3V3z" />
    <path d="m15 9-3 3" />
  </svg>
);

export const BUILDER_TABS = [
  { name: "Editor", icon: FileText },
  { name: "Score", icon: BarChart3 },
  { name: "Customize", icon: SlidersHorizontal },
  { name: "Job Match", icon: TargetArrow },
] as const;

interface BuilderTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/** Editor / Score / Customize / Job Match tab cards above the builder panel. */
const BuilderTabs: React.FC<BuilderTabsProps> = ({ activeTab, setActiveTab }) => (
  <div
    role="tablist"
    aria-label="Resume builder sections"
    className="grid grid-cols-4 rounded-lg border border-[#e3e9f2] bg-white p-0.5 lg:h-[44px]"
  >
    {BUILDER_TABS.map(({ name, icon: Icon }, index) => {
      const isActive = activeTab === name;
      return (
        <button
          key={name}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => setActiveTab(name)}
          className={`relative flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] border px-1.5 py-1 text-left transition-colors ${
            isActive
              ? "border-[#5b8fd9] bg-[#eaf1fb]"
              : "border-transparent hover:bg-gray-50"
          } ${
            // a thin line between neighbouring tabs (not beside the active tab, which has its own border)
            index > 0 && !isActive && activeTab !== BUILDER_TABS[index - 1].name
              ? "before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-px before:bg-[#e3e9f2]"
              : ""
          }`}
        >
          <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#1d4fa8]" : "text-gray-900"}`} strokeWidth={1.8} />
          <span className="min-w-0">
            <span className="block text-[13px] font-bold leading-tight text-gray-900">{name}</span>
          </span>
        </button>
      );
    })}
  </div>
);

export default BuilderTabs;
