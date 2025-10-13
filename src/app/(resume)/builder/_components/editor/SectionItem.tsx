import React, { useState } from "react";
import { ChevronDown, ChevronRight, Trash2, Check } from "lucide-react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

interface Props {
  title: string;
  icon: React.ReactNode;
  ai: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isActive: boolean;
  onToggle: () => void;
  onDelete: () => void;
  disableDelete?: boolean;
  isComplete?: boolean;
  isDragging?: boolean;
  children?: React.ReactNode;
}

const SectionItem: React.FC<Props> = ({
  title,
  icon,
  ai,
  dragHandleProps,
  isActive,
  onToggle,
  onDelete,
  disableDelete,
  isComplete,
  isDragging,
  children,
}) => {
  const [hovered, setHovered] = useState(false);

  const handleHeaderClick = () => {
    if (isDragging) return;
    onToggle();
  };

  const showDelete =
    !disableDelete && hovered && !isActive; // ✅ Show delete only when hovered & section inactive

  return (
    <div
      className={`group relative transition-transform duration-200 ${
        hovered ? "scale-[1.01]" : "scale-100"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-stretch gap-2">
        <div className="flex-1 relative">
          <div
            className={`relative overflow-hidden rounded-2xl transition-all duration-300 shadow-sm ${
              isActive ? "bg-white" : "bg-gray-50 border border-gray-200"
            }`}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer relative"
              onClick={handleHeaderClick}
            >
              <div className="flex items-center gap-3">
                {/* Icon bubble (drag handle applied here) */}
                <div
                  {...(dragHandleProps || {})}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow"
                      : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-orange-100 group-hover:to-red-100 text-gray-600 group-hover:text-orange-600"
                  }`}
                  aria-label={`${title} drag handle`}
                >
                  {icon}
                </div>

                {/* Title + AI tag */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold transition-colors duration-200 ${
                        isActive ? "text-orange-600" : "text-gray-700"
                      }`}
                    >
                      {title}
                    </span>
                    {ai && (
                      <span className="inline-flex items-center px-2 py-0 text-[10px] font-medium bg-purple-200 text-purple-700 rounded-full">
                        ✨ AI
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chevron or Tick */}
              <div>
                {isComplete ? (
                  <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-500 text-white">
                    <Check size={14} />
                  </div>
                ) : (
                  <div
                    className={`transition-all duration-300 p-1 rounded-md ${
                      isActive
                        ? "text-orange-600 bg-orange-100"
                        : "text-gray-400 group-hover:text-orange-600 group-hover:bg-orange-100"
                    }`}
                  >
                    {isActive ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Expanded content */}
            {isActive && <div className="px-3 pb-3">{children}</div>}
          </div>
        </div>

        {/* 🗑 Delete Button — Only on hover when inactive */}
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex items-center text-gray-500 hover:text-red-600 transition-all duration-200"
            title="Delete section"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SectionItem;
