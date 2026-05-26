"use client";

/**
 * /cover-letter — list / history view (Screen A).
 *
 * Wires useCoverLetterList → EmptyCoverLetterList | list of
 * CoverLetterListRow → [Load more] button when next_cursor.
 *
 * Spec: wireframes §3 (A.1 + A.2). Component tree per
 * impl-blueprint §3.
 */
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCoverLetterList } from "@/hooks/useCoverLetterList";
import { useDeleteCoverLetter } from "@/hooks/useDeleteCoverLetter";
import CoverLetterListRow from "./_components/CoverLetterListRow";
import EmptyCoverLetterList from "./_components/EmptyCoverLetterList";
import DeleteConfirmModal from "./_components/DeleteConfirmModal";
import { ERROR_MESSAGES } from "@/lib/coverLetterMessages";

export default function CoverLetterListPage() {
  const {
    items,
    nextCursor,
    isLoading,
    error,
    refetch,
    fetchNextPage,
  } = useCoverLetterList({ limit: 20 });

  // Delete-flow plumbing: a row click → confirm modal → mutate →
  // toast + refetch the list.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deletion = useDeleteCoverLetter({
    onSettled: (_letterId, wasNewlyDeleted) => {
      if (wasNewlyDeleted) {
        toast.success("Cover letter deleted.");
      }
      // refetch regardless — wasNewlyDeleted=false means "already
      // gone server-side", which the list view should reflect.
      void refetch();
      setPendingDeleteId(null);
    },
    onError: (_letterId, err) => {
      const message = ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown;
      toast.error(message);
      setPendingDeleteId(null);
    },
  });

  // Surface list-fetch errors as a one-shot toast (not in the body
  // copy — error state still renders an empty area; the user can
  // refresh or [Generate New] to recover).
  // Note: this fires once per error transition; React 18 strict
  // mode may double-fire in dev — sonner dedupes by message.
  if (error) {
    const message = ERROR_MESSAGES[error.reason] ?? ERROR_MESSAGES.unknown;
    toast.error(message, { id: `cl-list-error:${error.reason}` });
  }

  // The row whose Delete is currently being confirmed.
  const pendingItem =
    pendingDeleteId != null
      ? items.find((i) => i.letter_id === pendingDeleteId) ?? null
      : null;

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Cover Letters</h1>
          </div>
          <Link
            href="/cover-letter/new"
            className="inline-flex items-center gap-1.5 bg-[#2257a7] hover:bg-[#184284] text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2257a7] focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            New Letter
          </Link>
        </div>

        {/* Body */}
        <div className="px-6">
          {isLoading && items.length === 0 ? (
            <ListSkeleton />
          ) : items.length === 0 ? (
            <EmptyCoverLetterList />
          ) : (
            <>
              <ul role="list" className="divide-y divide-gray-100">
                {items.map((item) => (
                  <li key={item.letter_id}>
                    <CoverLetterListRow
                      item={item}
                      onDelete={(id) => setPendingDeleteId(id)}
                    />
                  </li>
                ))}
              </ul>
              {nextCursor && (
                <div className="py-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => void fetchNextPage()}
                    disabled={isLoading}
                    className="text-sm font-semibold text-[#2257a7] hover:text-[#184284] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    {isLoading ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete-confirmation modal */}
      <DeleteConfirmModal
        open={pendingItem !== null}
        item={pendingItem}
        isDeleting={deletion.isLoading}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) {
            void deletion.mutate(pendingDeleteId);
          }
        }}
      />
    </div>
  );
}

/** Tiny skeleton for the initial load — three pulse rows. */
function ListSkeleton() {
  return (
    <ul role="list" aria-busy="true" className="divide-y divide-gray-100">
      {[0, 1, 2].map((i) => (
        <li key={i} className="py-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" />
          <div className="h-5 bg-gray-200 rounded-full w-24" />
        </li>
      ))}
    </ul>
  );
}
