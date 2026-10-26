import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, ChevronUp, Trash2 } from "lucide-react";
import { FaCheckCircle } from 'react-icons/fa';
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { toast } from "sonner";
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
  /** Called once the delete has been persisted (after the success toast). */
  onDeleted?: () => void;
  /** Inline editor shown inside the card while the section is open. */
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
  onDeleteAsync,
  disableDelete,
  isComplete,
  isDragging,
  resumeId,
  sectionKey,
  onDeleted,
  children,
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
        toast.success("Section deleted successfully.");
        onDeleted?.();
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
      toast.success("Section deleted successfully.");
      onDeleted?.();
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
        <div className="flex-1 relative min-w-0">
          <div
            className={`overflow-hidden rounded-lg border bg-white transition-colors ${
              isActive ? "border-[#bcd0ee]" : "border-[#e3e9f2] hover:border-[#c9d6ea]"
            }`}
          >
            {/* Header */}
            {/* The whole header is the drag handle: press anywhere on it and drag; a plain click still opens the section */}
            <div
              {...(dragHandleProps || {})}
              className={`flex items-center justify-between px-3.5 py-2 cursor-pointer relative ${
                isActive ? "bg-[#eaf1fb]" : ""
              }`}
              onClick={handleHeaderClick}
            >
              {/* Left Section: Icon + Title */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex items-center justify-center w-5 h-5 shrink-0 ${
                    isActive ? "text-[#1d4fa8]" : "text-gray-800"
                  }`}
                >
                  {icon}
                </div>

                <span
                  className={`text-[13px] font-semibold truncate transition-colors duration-200 ${
                    isActive ? "text-[#1d4fa8]" : "text-gray-900"
                  }`}
                >
                  {title}
                </span>
              </div>

              {/* Right Section: AI Icon + Check + Chevron */}
              <div className="flex items-center gap-2 shrink-0">
                {isComplete && (
                  <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#d9f7be]">
                    <FaCheckCircle size={13} className="text-green-600 rounded-full" />
                  </div>
                )}

                <div className={isActive ? "text-[#1d4fa8]" : "text-gray-800"}>
                  {isActive ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                </div>
              </div>
            </div>

            {/* Inline editor */}
            {isActive && children && (
              <div className="border-t border-[#d7e3f6] bg-white px-4 py-4">{children}</div>
            )}
          </div>
        </div>

        {/* Delete Button */}
        {showDelete && (
          <div className="mt-2.5">
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






