import React from "react";

interface InfoToggleGroupProps<T extends string | boolean> {
  label: string;
  name: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

export default function InfoToggleGroup<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
}: InfoToggleGroupProps<T>) {
  return (
    <div className="flex flex-col gap-2 ">
      <span className="text-base">{label}</span>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className={`rounded-lg px-3 py-2 border cursor-pointer ${
              value === option.value
                ? "bg-black text-white border-black"
                : "bg-white text-black border-neutral-200 hover:bg-gray-100"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
