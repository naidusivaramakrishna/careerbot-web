"use client";
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

export default function Tabs({ tabs, active, onChange }: TabsProps) {
    return (
        <div>
            {/* Tab Buttons */}
            <div className="flex overflow-x-auto whitespace-nowrap bg-white  shadow-[0_0_6px_rgba(0,0,0,0.30)] border border-neutral-200  rounded-lg gap-2 mb-4 scrollbar-thin scrollbar-thumb-gray-300">
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        className={`flex items-center gap-2 px-3 py-4 cursor-pointer text-sm font-medium  transition ${active === tab.label
                            ? "bg-[#a5c6eb] text-black font-semibold border-b-[2.6px] border-[#2257a7]"
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
            </div>
            {/* Tab Content */}
            <div className="mt-2">
                {tabs.find((t) => t.label === active)?.content}
            </div>
        </div>
    );
}
