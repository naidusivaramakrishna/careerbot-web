import React from "react";

interface MultiSelectDropdownProps {
  label: string;
  name: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}

export default function MultiSelectDropdown({
  label,
  options,
  values,
  onChange,
}: MultiSelectDropdownProps) {
  const toggleValue = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <span className="text-xs mt-1">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`rounded-lg px-3 py-1 border cursor-pointer ${
              values.includes(option)
                ? "bg-black text-white border-black"
                : "bg-white text-black border-neutral-200 hover:bg-gray-100"
            }`}
            onClick={() => toggleValue(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
