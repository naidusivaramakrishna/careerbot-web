"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { CoverLetterListItem } from "@/types/coverLetter";

/**
 * Delete-confirmation modal (Screen G in the wireframes).
 *
 * Used by both the list page (deleting from the ⋯ menu) and the
 * detail page (delete button under the letter view). Renders only
 * when `open` is true; the parent owns the open / close lifecycle.
 *
 * A11y:
 *   - role="dialog" + aria-modal + aria-labelledby
 *   - focus is moved into the modal on open
 *   - Escape closes (calls onCancel)
 *   - clicking the backdrop closes
 *
 * Spec: wireframes §G.
 */
export interface DeleteConfirmModalProps {
  open: boolean;
  /** Item being deleted; used to surface the title in the prompt.
   *  null is allowed for graceful handling when the parent's
   *  pendingItem lookup races a list refetch — the modal still
   *  shows a generic prompt rather than crashing. */
  item: CoverLetterListItem | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  open,
  item,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  // Move focus into the modal on open + restore it on close.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // The Confirm button is the dangerous action; focus the Cancel
    // (rendered first below) instead by querying it.
    const cancelBtn =
      dialogRef.current?.querySelector<HTMLButtonElement>(
        "[data-modal-action='cancel']",
      ) ?? confirmButtonRef.current;
    cancelBtn?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, [open]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, isDeleting, onCancel]);

  if (!open) return null;

  const title =
    item?.role_title && item?.company_name
      ? `${item.role_title} · ${item.company_name}`
      : item?.role_title ?? item?.company_name ?? "this cover letter";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        // Backdrop click closes; clicks inside the dialog don't
        // bubble here because we stopPropagation on the dialog box.
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-cover-letter-title"
        className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <h2
          id="delete-cover-letter-title"
          className="text-lg font-bold text-gray-900 mb-2"
        >
          Delete this cover letter?
        </h2>
        <p className="text-sm text-gray-700 mb-1 truncate">
          &ldquo;{title}&rdquo;
        </p>
        <p className="text-sm text-gray-500 mb-6">
          This will remove it from your history. You can&rsquo;t undo this.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            data-modal-action="cancel"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            data-modal-action="confirm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
