const TimeTabs = ({ active, onChange }: { active: string; onChange: (v: string) => void }) => {
    const tabs = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Custom"];

    return (
        <div className="flex bg-gray-100 rounded-full p-1 w-fit">
            {tabs.map((t) => (
                <button
                    key={t}
                    onClick={() => onChange(t)}
                    className={`px-4 py-1.5 text-sm rounded-full transition-all
                        ${active === t ? "bg-white shadow-sm font-medium" : "text-gray-500"}
                    `}
                >
                    {t}
                </button>
            ))}
        </div>
    );
};

export default TimeTabs