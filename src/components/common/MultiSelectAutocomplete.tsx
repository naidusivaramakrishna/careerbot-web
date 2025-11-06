"use client";
import { X } from "lucide-react";
import React, { useState } from "react";

interface MultiSelectAutocompleteProps {
    label: string;
    options: string[];
    values: string[];
    onChange: (values: string[]) => void;
}

export default function MultiSelectAutocomplete({
    label,
    options,
    values,
    onChange,
}: MultiSelectAutocompleteProps) {
    const [input, setInput] = useState("");

    const handleAdd = (val: string) => {
        if (!values.includes(val)) {
            onChange([...values, val]);
        }
        setInput("");
    };

    const handleRemove = (val: string) => {
        onChange(values.filter((v) => v !== val));
    };

    // Only show options that match input AND input is non-empty
    const filteredOptions =
        input.trim() === ""
            ? []
            : options.filter(
                (opt) => opt.toLowerCase().includes(input.toLowerCase()) && !values.includes(opt)
            );

    return (
        <div className="flex flex-col gap-2 mt-2 relative">
            <label className="text-base font-medium">{label}</label>
            <div className="flex flex-wrap gap-2">
                {values.map((val) => (
                    <span
                        key={val}
                        className="flex bg-gray-100 border border-gray-200 shadow-sm items-center gap-1 px-3 py-1 rounded-lg text-sm"
                    >
                        {val}
                        <button
                            type="button"
                            className="ml-1 text-gray-600  hover:text-black"
                            onClick={() => handleRemove(val)}
                        >
                            <div className="w-4 h-4 bg-white flex items-center justify-center rounded-full">
                                <X className="w-3 h-3 cursor-pointer font-bold text-black" />
                            </div>
                        </button>
                    </span>
                ))}
            </div>

            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && input.trim() !== "") {
                        handleAdd(input.trim());
                        e.preventDefault();
                    }
                }}
                placeholder="Type to search..."
                className="border border-neutral-200 p-3 rounded-lg bg-white outline-neutral-500"
            />

            {filteredOptions.length > 0 && (
                <div className="absolute border border-neutral-200 rounded mt-1 max-h-32 overflow-y-auto bg-white shadow-md w-full z-10">
                    {filteredOptions.map((opt) => (
                        <div
                            key={opt}
                            onClick={() => handleAdd(opt)}
                            className="px-3 py-1 cursor-pointer hover:bg-gray-100"
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
