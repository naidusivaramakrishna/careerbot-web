"use client";

import React from "react";

interface SwitchProps {
    checked: boolean;
    onChange: () => void;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange }) => {
    return (
        <button
            onClick={onChange}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${checked ? "bg-[#5E5EFF]" : "bg-gray-300"
                }`}
        >
            <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${checked ? "left-7" : "left-1"
                    }`}
            ></span>
        </button>
    );
};

export default Switch;
