import React from "react";

interface Props {
  options: string[];
  onSelect: (s: string) => void;
  onClose: () => void;
}

const AISuggestions: React.FC<Props> = ({ options, onSelect, onClose }) => {
  return (
    <div className="w-[350px] bg-white shadow-lg rounded-lg border border-orange-400 p-2 flex flex-col gap-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">
          AI Suggestions
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-red-800 text-lg"
        >
          ×
        </button>
      </div>

      {/* Suggestions List */}
      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
        {options.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(s)}
            className="text-left px-2 py-2 border-gray-300 rounded-md text-xs text-black bg-orange-100 hover:bg-orange-300"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AISuggestions;


