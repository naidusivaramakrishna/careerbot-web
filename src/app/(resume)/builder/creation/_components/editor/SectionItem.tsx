import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { FaCheckCircle } from 'react-icons/fa';
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { RiSparkling2Fill } from 'react-icons/ri';
import { deleteResumeSection } from "@/api/resumeApi"; // ✅ Import the delete API

interface Props {
  title: string;
  icon: React.ReactNode;
  ai: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isActive: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onDeleteAsync?: () => Promise<void>; // overrides built-in API call for custom sections
  disableDelete?: boolean;
  isComplete?: boolean;
  isDragging?: boolean;
  resumeId?: string;
  sectionKey?: string;
}

const SectionItem: React.FC<Props> = ({
  title,
  icon,
  ai,
  dragHandleProps,
  isActive,
  onToggle,
  onDelete,
  onDeleteAsync,
  disableDelete,
  isComplete,
  isDragging,
  resumeId,
  sectionKey,
}) => {
  const [hovered, setHovered] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isDeleting, setIsDeleting] = useState(false); // ✅ NEW: Loading state
  const [showConfirmModal, setShowConfirmModal] = useState(false); // ✅ NEW: Confirmation modal state
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const handleHeaderClick = () => {
    if (isDragging) return;
    onToggle();
  };

  const showDelete = !disableDelete && hovered && !isActive;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmModal(true); // ✅ Show confirmation modal instead of deleting immediately
  };

  const handleConfirmDelete = async () => {
    // Custom sections provide their own async delete handler
    if (onDeleteAsync) {
      try {
        setIsDeleting(true);
        await onDeleteAsync();
        setShowConfirmModal(false);
      } catch {
        alert("Failed to delete section. Please try again.");
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    if (!resumeId || !sectionKey) return;

    try {
      setIsDeleting(true);
      await deleteResumeSection(resumeId, sectionKey);
      onDelete();
      setShowConfirmModal(false);
    } catch {
      alert("Failed to delete section. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
  };

  // Update tooltip position when hovering
  useEffect(() => {
    if (deleteHovered && deleteButtonRef.current) {
      const rect = deleteButtonRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 5,
        left: rect.left + rect.width / 2,
      });
    }
  }, [deleteHovered]);

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
            className={`relative py-1.5 overflow-hidden rounded-lg transition-all duration-300 shadow-sm ${
              isActive
                ? "bg-[#ffffff] border border-blue-200"
                : "bg-[#ffffff] border border-gray-300"
            }`}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer relative"
              onClick={handleHeaderClick}
            >
              {/* Left Section: Icon + Title */}
              <div className="flex items-center gap-3">
                <div
                  {...(dragHandleProps || {})}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-[#2557a7] text-white shadow"
                      : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-100 text-[#2d2d2d] group-hover:text-[#2557a7]"
                  }`}
                >
                  {icon}
                </div>

                <span
                  className={`text-[15px] font-semibold transition-colors duration-200 ${
                    isActive ? "text-[#2557a7]" : "text-gray-800"
                  }`}
                >
                  {title}
                </span>
              </div>

              {/* Right Section: AI Icon + Check + Chevron */}
              <div className="flex items-center gap-2">
                {ai && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs bg-[#efedf2] font-semibold text-black rounded-full">
                    <RiSparkling2Fill size={14} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI  
                  </span>
                )}

                {isComplete && (
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#d9f7be] text-white">
                    <FaCheckCircle size={14} className="text-green-600 rounded-full" />
                  </div>
                )}

                <div
                  className={`transition-all duration-300 p-1 rounded-md ${
                    isActive
                      ? "text-[#2557a7] bg-blue-100"
                      : "text-gray-400 group-hover:text-[#2557a7] group-hover:bg-blue-100"
                  }`}
                >
                  {isActive ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Button */}
        {showDelete && (
          <div className="mt-4">
            <button
              ref={deleteButtonRef}
              onClick={handleDelete}
              onMouseEnter={() => setDeleteHovered(true)}
              onMouseLeave={() => setDeleteHovered(false)}
              disabled={isDeleting}
              className={`w-6 h-6 flex justify-center items-center bg-gray-300 hover:bg-red-100 transition-all duration-200 rounded ${
                isDeleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="Delete section"
            >
              <Trash2 
                className={`text-gray-700 hover:text-[#c45d65] ${isDeleting ? "animate-pulse" : ""}`} 
                size={16} 
              />
            </button>
          </div>
        )}
      </div>

      {/* Tooltip - Rendered via Portal outside sidebar */}
      {deleteHovered && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded whitespace-nowrap shadow-xl pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </div>,
        document.body
      )}

      {/* ✅ Confirmation Modal with Blur Background */}
      {showConfirmModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[10000]">
          {/* Blur Background */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleCancelDelete}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-[90%]">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Section?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this section? This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SectionItem;






