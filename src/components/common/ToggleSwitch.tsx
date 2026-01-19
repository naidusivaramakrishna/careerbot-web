"use client";

import { useState } from "react";

interface ToggleSwitchProps {
    initial?: boolean;
    onToggle?: (enabled: boolean) => void;
}

export default function ToggleSwitch({ initial = true, onToggle }: ToggleSwitchProps) {
    const [enabled, setEnabled] = useState<boolean>(initial);

    const handleToggle = () => {
        const newState = !enabled;
        setEnabled(newState);
        if (onToggle) onToggle(newState);
    };

    return (
        <div className="flex items-center gap-2">
            {/* Toggle Button */}
            <div
                onClick={handleToggle}
                className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-300 ${enabled ? "bg-green-500" : "bg-gray-400"
                    }`}
            >
                <div
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${enabled ? "translate-x-6" : ""
                        }`}
                >
                </div>
            </div>

            {/* Status Text */}
            <div className="flex items-center gap-2">
                {enabled ? <span className="text-green-700 font-medium">Enabled</span> :
                    <span className="text-red-700 font-medium">Disabled</span>
                }
            </div>
        </div>
    );
}
