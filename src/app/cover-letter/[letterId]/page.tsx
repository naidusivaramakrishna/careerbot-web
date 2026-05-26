"use client";

/**
 * /cover-letter/[letterId] — view existing letter (Screens C/D/E/F).
 *
 * State machine:
 *   useCoverLetter(letterId)
 *     ▼ isLoading              → page loader
 *     ▼ letter === null + no error → "Letter not found" (404 path;
 *                                    backend §3 no-existence-disclosure)
 *     ▼ error                  → error card with [Try again]
 *     ▼ letter.status==="failed" → <FailureCard />  (Screen E)
 *     ▼ otherwise              → <CoverLetterView /> with [Delete]
 *                                  + [Generate another] actions
 *
 * Spec: wireframes §5 / §6 / §7 / §8 / §9.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, XCircle, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCoverLetter } from "@/hooks/useCoverLetter";
import { useDeleteCoverLetter } from "@/hooks/useDeleteCoverLetter";
import { ERROR_MESSAGES } from "@/lib/coverLetterMessages";
import CoverLetterView from "../_components/CoverLetterView";
import FailureCard from "../_components/FailureCard";
import DeleteConfirmModal from "../_components/DeleteConfirmModal";
import type { CoverLetterListItem } from "@/types/coverLetter";

export default function CoverLetterDetailPage() {
  // React 18 compat (Codex WEB-3.3 P1): `React.use()` doesn't exist
  // on React 18 — would crash at runtime. `useParams()` from
  // next/navigation works on both React 18 + 19 and decodes the
  // dynamic segment from the route. We cast through `string` since
  // useParams returns `string | string[] | undefined` for a single
  // dynamic segment.
  const params = useParams<{ letterId: string }>();
  const letterId =
    typeof params?.letterId === "string"
      ? decodeURIComponent(params.letterId)
      : "";

  const { letter, isLoading, error, refetch } = useCoverLetter(letterId);
  const router = useRouter();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const deletion = useDeleteCoverLetter({
    onSettled: (_id, wasNewlyDeleted) => {
      if (wasNewlyDeleted) toast.success("Cover letter deleted.");
      setConfirmOpen(false);
      router.push("/cover-letter");
    },
    onError: (_id, err) => {
      toast.error(ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown);
      setConfirmOpen(false);
    },
  });

  // Surface fetch errors as a toast (alongside the inline card).
  useEffect(() => {
    if (error) {
      toast.error(ERROR_MESSAGES[error.reason] ?? ERROR_MESSAGES.unknown, {
        id: `cl-detail-error:${letterId}:${error.reason}`,
      });
    }
  }, [error, letterId]);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/cover-letter"
            aria-label="Back to cover letters"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Body — branch on state */}
        {isLoading ? (
          <DetailSkeleton />
        ) : letter === null && !error ? (
          <NotFoundCard />
        ) : error ? (
          <ErrorCard onRetry={() => void refetch()} />
        ) : letter ? (
          letter.status === "failed" ? (
            <>
              <FailureCard letter={letter} />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </>
          ) : (
            <CoverLetterView
              letter={letter}
              actions={
                <div className="flex items-center gap-2">
                  <Link
                    href="/cover-letter/new"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#2257a7] hover:text-[#184284] hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Generate another
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              }
            />
          )
        ) : null}
      </div>

      {/* Delete-confirm modal */}
      <DeleteConfirmModal
        open={confirmOpen}
        item={letter ? letterToListItem(letter) : null}
        isDeleting={deletion.isLoading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void deletion.mutate(letterId);
        }}
      />
    </div>
  );
}

/** Adapter so DeleteConfirmModal can show the letter title.
 *  The detail page has the FULL response; DeleteConfirmModal only
 *  needs role_title / company_name / created_at / status / word_count. */
function letterToListItem(letter: {
  letter_id: string;
  created_at: string;
  status: CoverLetterListItem["status"];
  metadata?: { word_count?: number };
}): CoverLetterListItem {
  // role_title / company_name aren't in CoverLetterResponse —
  // they were only on application_context (REQUEST shape). For the
  // confirm prompt we let DeleteConfirmModal's fallback show
  // "this cover letter" via its null-safe path.
  return {
    letter_id: letter.letter_id,
    created_at: letter.created_at,
    status: letter.status,
    role_title: null,
    company_name: null,
    word_count: letter.metadata?.word_count ?? 0,
  };
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4 animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-1/4" />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );
}

function NotFoundCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Letter not found
      </h2>
      <p className="text-gray-600 mb-6">
        We couldn&rsquo;t find that cover letter. It may have been
        deleted, or the link is wrong.
      </p>
      <Link
        href="/cover-letter"
        className="inline-block bg-[#2257a7] hover:bg-[#184284] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"
      >
        Back to history
      </Link>
    </div>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-3">
        <XCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Couldn&rsquo;t load letter</h2>
      <p className="text-gray-600 mb-6">
        Please try again in a moment.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-block bg-[#2257a7] hover:bg-[#184284] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
