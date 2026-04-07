"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

interface DropdownProps {
  options: string[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  bgColor?: string;
  bgOptions?: string;
  textColor?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  defaultValue,
  onChange = () => { },
  className = "",
  bgColor = "bg-white",
  bgOptions = "bg-white",
  textColor = "text-gray-700"
}) => {
  const [selected, setSelected] = useState(defaultValue || options[1]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string, index: number) => {
    if (index === 0) return; // Disable first item
    setSelected(option);
    setOpen(false);
    onChange(option);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-sm ${className}`}>

      {/* Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-between  border border-gray-300 rounded-md px-3 py-2 ${bgColor} ${textColor} text-gray-700 hover:border-gray-400 transition ${className}`}
      >
        {selected}
        <ChevronDown className={`w-4 h-4 text-gray-500 ${textColor}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          className={`absolute z-10 mt-1 border border-gray-200 rounded-md shadow-lg ${bgColor} ${className}`}
        >
          {options.map((option, index) => {
            const isDisabled = index === 0;
            const isSelected = selected === option && !isDisabled;

            return (
              <div
                key={option}
                role="option"
                aria-selected={isSelected}
                aria-disabled={isDisabled}
                tabIndex={isDisabled ? -1 : 0}
                onClick={() => !isDisabled && handleSelect(option, index)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !isDisabled && handleSelect(option, index)}
                className={`
                  flex items-center justify-between px-3 py-2 border border-gray-200
                  ${isDisabled ? "cursor-not-allowed text-gray-400 bg-gray-50 font-semibold" : "cursor-pointer"}
                  ${isSelected ? "bg-gray-100 text-gray-900" : "text-gray-700"}
                  ${bgOptions}
                `}
              >
                {option}
                {isSelected && <Check className="w-4 h-4" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
