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
            <div
                role="tablist"
                className="flex overflow-x-auto whitespace-nowrap bg-white shadow-[0_0_6px_rgba(0,0,0,0.30)] border border-neutral-200 rounded-xl p-2 mb-4 gap-0.5 scrollbar-thin scrollbar-thumb-gray-200"
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.label}
                        type="button"
                        role="tab"
                        aria-selected={active === tab.label}
                        data-testid={`tab-${tab.label.toLowerCase().replace(/\s+/g, '-')}`}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-all ${
                            active === tab.label
                                ? "bg-blue-100 text-[#2257a7] font-semibold shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => onChange(tab.label)}
                    >
                        {tab.icon && (
                            <span className="flex items-center shrink-0">
                                {tab.icon}
                            </span>
                        )}
                        <span className="whitespace-nowrap">{tab.text}</span>
                    </button>
                ))}
            </div>
            <div className="mt-2 min-h-105">
                {tabs.find((t) => t.label === active)?.content}
            </div>
        </div>
    );
}
