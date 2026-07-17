import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { FaCheckCircle } from 'react-icons/fa';
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { RiSparkling2Fill } from 'react-icons/ri';
import { deleteResumeSection } from "@/api/resumeApi"; // ✅ Import the delete API

import type { AtsSectionIssue } from "../../_utils/atsMissing";

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
  atsIssue?: AtsSectionIssue;
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
  atsIssue,
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
  const isMissing = Boolean(atsIssue);

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
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-stretch gap-2">
        <div className="flex-1 relative">
          <div
            className={`relative overflow-hidden rounded-lg border transition-all duration-200 ${
              isMissing
                ? isActive
                  ? "border-rose-300 bg-rose-50 shadow-sm"
                  : "border-rose-200 bg-rose-50/80 hover:border-rose-300"
                : isActive
                  ? "border-blue-200 bg-blue-50/40 shadow-sm"
                  : isComplete
                    ? "border-emerald-200 bg-emerald-50/55 hover:border-emerald-300"
                    : "border-slate-200 bg-white hover:border-blue-200"
            }`}
          >
            {/* Header */}
            <div
              className="relative grid min-h-[58px] cursor-pointer grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2"
              onClick={handleHeaderClick}
            >
              <div
                {...(dragHandleProps || {})}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                  isMissing
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-100"
                  : isActive
                      ? "bg-[#2557a7] text-white shadow-sm"
                      : isComplete
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-100"
                        : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-[#2557a7]"
                }`}
              >
                {icon}
              </div>

              <div className="min-w-0 self-center text-left">
                <span
                  className={`block truncate text-[13px] font-black leading-5 transition-colors duration-200 ${
                    isMissing ? "text-rose-700" : isActive ? "text-[#2557a7]" : "text-slate-900"
                  }`}
                >
                  {title}
                </span>
                {isMissing ? (
                  <span className="block truncate text-[11px] font-black leading-4 text-rose-600">
                    Missing +{atsIssue.impact} ATS
                  </span>
                ) : (
                  <span className={`block truncate text-[11px] font-bold leading-4 ${isComplete ? "text-emerald-700" : "text-slate-400"}`}>
                    {isComplete ? "Complete" : "Edit section"}
                  </span>
                )}
              </div>

              <div className="flex min-w-[54px] shrink-0 items-center justify-end gap-1.5">
                {isMissing && (
                  <AlertTriangle size={15} className="shrink-0 text-rose-500" />
                )}
                {ai && (
                  <span className="inline-flex h-6 items-center rounded-full bg-blue-50 px-1.5 text-[10px] font-black text-[#2557a7]">
                    <RiSparkling2Fill size={14} className="text-[#2557a7] fill-[#2557a7] mr-0.5"/>AI  
                  </span>
                )}

                {isComplete && !isMissing && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-white">
                    <FaCheckCircle size={14} className="text-green-600 rounded-full" />
                  </div>
                )}

                {!isMissing && (
                  <Pencil size={15} className="hidden text-slate-500 transition group-hover:text-[#2557a7] min-[1280px]:block" />
                )}

                <div
                  className={`rounded-md p-1 transition-all duration-200 ${
                    isActive
                      ? "text-[#2557a7] bg-blue-100"
                      : "text-slate-400 group-hover:text-[#2557a7] group-hover:bg-blue-50"
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
