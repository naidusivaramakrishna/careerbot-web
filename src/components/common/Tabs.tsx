"use client";
import { useProfileContext } from "@/app/(user)/dashboard/profile/context/ProfileContext";
import { FolderKanban, Languages, Medal, Palette, Sparkles } from "lucide-react";

export interface Tab {
    label: string;
    text: string,
    content: React.ReactNode;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    active?: string;
    onChange: (label: string) => void;
}

const availableSections = [
    { id: "CareerInsights", label: "CareerInsights", icon: Sparkles },
    { id: "Hobbies", label: "Hobbies", icon: Palette },
    { id: "Projects", label: "Projects", icon: FolderKanban },
    { id: "Languages", label: "Languages", icon: Languages },
    { id: "Achievements", label: "Achievements", icon: Medal },
];


export default function Tabs({ tabs, active, onChange }: TabsProps) {
    const { addSection, dynamicSections, setSidebarActiveTab } = useProfileContext();

    return (
        <div>
            {/* Tab Buttons */}
            <div className="flex overflow-x-auto whitespace-nowrap bg-white shadow-sm border border-neutral-200  rounded-lg gap-2 mb-4 scrollbar-thin scrollbar-thumb-gray-300">
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        className={`flex items-center gap-2 px-3 py-4 cursor-pointer text-sm font-medium  transition ${active === tab.label
                                ? "bg-[#DAD5F9] text-[#2200FF] font-semibold border-b-2 border-[#1800B3]"
                                : "text-gray-600 hover:text-black"
                            }`}
                        onClick={() => onChange(tab.label)}
                    >
                        {/* Icon beside tab name */}
                        {tab.icon && (
                            <span className="flex items-center w-4 h-4 shrink-0">
                                {tab.icon}
                            </span>
                        )}
                        <span className="whitespace-nowrap">{tab.text}</span>
                    </button>
                ))}

                {/* Render dynamically added section buttons */}
                {dynamicSections.map((sec) => (
                    <button
                        key={sec.id}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm font-medium  transition ${active === sec.id
                                ? "bg-[#DAD5F9] text-[#2200FF] font-semibold border-b-2 border-[#1800B3]"
                                : "text-gray-600 hover:text-black"
                            }`}
                        onClick={() => {
                            onChange(sec.id);
                            setSidebarActiveTab(sec.id);
                        }}
                    >
                        {sec.icon && (
                            <span className="flex items-center w-4 h-4 shrink-0">
                                <sec.icon className="w-4 h-4" />
                            </span>
                        )}
                        <span className="whitespace-nowrap">{sec.label}</span>
                    </button>
                ))}
            </div>
            {/* New Section turns into a Select */}
            <div className="flex justify-end">
                    <select
                        autoFocus
                        onChange={(e) => {
                            const sec = availableSections.find(
                                (s) => s.id === e.target.value
                            );
                            if (sec) {
                                addSection(sec);
                                onChange(sec.id); // switch to it immediately
                                setSidebarActiveTab(sec.id);
                            }
                        }}
                        className="border w-fit border-neutral-400 px-3 py-2 rounded-lg bg-neutral-100 outline-neutral-500"
                    >
                        <option value="">New section</option>
                        {availableSections.map((sec) => (
                            <option key={sec.id} value={sec.id}>
                                {sec.label}
                            </option>
                        ))}
                    </select>
            </div>

            {/* Tab Content */}
            <div className="mt-2">
                {tabs.find((t) => t.label === active)?.content}
            </div>

        </div>
    );
}
