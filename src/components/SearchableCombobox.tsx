"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface SearchableComboboxProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Search or type to add...",
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if current value is a custom value (not in options)
  useEffect(() => {
    if (value && !options.includes(value)) {
      setIsCustom(true);
    } else {
      setIsCustom(false);
    }
  }, [value, options]);

  // Filter options based on search text
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchText.toLowerCase())
  );

  // Show "Add custom value" option if search text doesn't match any option
  const showAddCustom =
    searchText.trim() !== "" &&
    !filteredOptions.some(
      (opt) => opt.toLowerCase() === searchText.toLowerCase()
    );

  // Handle option selection
  const handleSelectOption = (option: string) => {
    onChange(option);
    setSearchText("");
    setIsOpen(false);
  };

  // Handle custom value creation
  const handleAddCustom = () => {
    if (searchText.trim()) {
      onChange(searchText.trim());
      setSearchText("");
      setIsOpen(false);
      setIsCustom(true);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setIsOpen(true);
  };

  // Handle clear button
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchText("");
    setIsCustom(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full min-w-0" ref={containerRef}>
      <label className="text-sm font-semibold">{label}</label>

      <div className="relative">
        {/* Input Field */}
        <div className="flex items-center  border border-neutral-200 rounded-lg bg-gray-100 overflow-hidden">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchText : value}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="flex-1 p-2.5 text-sm outline-none bg-gray-100 "
          />

          {/* Clear Button */}
          {value && !isOpen && (
            <button
              onClick={handleClear}
              className="px-2 text-gray-500 hover:text-gray-700"
              type="button"
            >
              <X size={16} />
            </button>
          )}

          {/* Chevron Icon */}
          <div
            className={`px-3 text-gray-500 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          >
            <ChevronDown size={16} />
          </div>
        </div>

        {/* Custom Value Badge */}
        {value && isCustom && !isOpen && (
          <div className="text-xs text-blue-600 mt-1">Custom value</div>
        )}

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 border border-neutral-200 bg-white rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              <>
                {/* Standard Options */}
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition ${
                      value === option ? "bg-blue-100 text-blue-700 font-semibold" : ""
                    }`}
                    type="button"
                  >
                    {option}
                  </button>
                ))}

                {/* Add Custom Value Option */}
                {showAddCustom && (
                  <button
                    onClick={handleAddCustom}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-green-50 text-green-700 border-t border-neutral-200 transition"
                    type="button"
                  >
                    + Add "{searchText}" as custom value
                  </button>
                )}
              </>
            ) : (
              <>
                {/* No matches message */}
                <div className="px-3 py-2.5 text-sm text-gray-500">
                  No matches found
                </div>

                {/* Add Custom Value Option */}
                {showAddCustom && (
                  <button
                    onClick={handleAddCustom}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-green-50 text-green-700 border-t border-neutral-200 transition"
                    type="button"
                  >
                    + Add "{searchText}" as custom value
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
