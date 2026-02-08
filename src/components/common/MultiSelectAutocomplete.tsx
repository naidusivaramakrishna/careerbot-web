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
    const [isFocused, setIsFocused] = useState(false);

    const handleAdd = (val: string) => {
        if (!values.includes(val)) {
            onChange([...values, val]);
        }
        setInput("");
    };

    const handleRemove = (val: string) => {
        onChange(values.filter((v) => v !== val));
    };

    // Show all options on focus (empty input), or show filtered options when typing
    const filteredOptions =
        isFocused && input.trim() === ""
            ? options.filter((opt) => !values.includes(opt))
            : input.trim() === ""
            ? []
            : options.filter(
                (opt) => opt.toLowerCase().includes(input.toLowerCase()) && !values.includes(opt)
            );

    return (
        <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-semibold">{label}</label>
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

            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 250)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && input.trim() !== "") {
                            handleAdd(input.trim());
                            e.preventDefault();
                        }
                    }}
                    placeholder="Type to search..."
                    className="border border-neutral-200 p-2.5 text-sm rounded-lg bg-white outline-neutral-500 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                {filteredOptions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 border border-neutral-200 rounded mt-1 max-h-40 overflow-y-auto bg-white shadow-lg z-20 text-sm">
                        {filteredOptions.map((opt) => (
                            <div
                                key={opt}
                                onMouseDown={() => handleAdd(opt)}
                                className="px-3 py-2 cursor-pointer hover:bg-blue-100 transition-colors"
                            >
                                {opt}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
