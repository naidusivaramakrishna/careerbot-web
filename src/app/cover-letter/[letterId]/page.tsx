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
import { History, XCircle, Trash2 } from "lucide-react";
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
      router.push("/cover-letter/history");
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
    <div className="min-h-full px-4 pb-10 pt-5 text-slate-900 lg:px-5 2xl:pt-6">
      <div className="mx-auto max-w-[1180px] 2xl:max-w-[1320px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/cover-letter/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2557a7] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#1e4a94]"
          >
            Back
          </Link>
          <Link
            href="/cover-letter/history"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-[#263363] transition hover:border-[#2557a7]/40 hover:bg-blue-50 hover:text-[#2557a7]"
          >
            <History className="h-4 w-4" aria-hidden="true" />
            History
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
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </>
          ) : (
            <CoverLetterView
              letter={letter}
              actions={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
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
    <div aria-busy="true" className="animate-pulse space-y-4">
      <div className="h-7 w-1/3 rounded bg-slate-200" />
      <div className="h-4 w-1/4 rounded bg-slate-200" />
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-5 2xl:p-6">
        <div className="h-3 w-1/2 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-3/4 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function NotFoundCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm 2xl:p-8">
      <h2 className="mb-2 text-xl font-black text-slate-950">
        Letter not found
      </h2>
      <p className="mb-6 text-sm leading-6 text-slate-500">
        We couldn&rsquo;t find that cover letter. It may have been
        deleted, or the link is wrong.
      </p>
      <Link
        href="/cover-letter/history"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2557a7] px-4 text-sm font-bold text-white transition hover:bg-[#1e4a94] 2xl:px-5"
      >
        Back to history
      </Link>
    </div>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-100 bg-white p-6 text-center shadow-sm 2xl:p-8">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 2xl:h-14 2xl:w-14">
        <XCircle className="h-7 w-7 text-red-600 2xl:h-8 2xl:w-8" aria-hidden="true" />
      </div>
      <h2 className="mb-2 text-xl font-black text-slate-950">Couldn&rsquo;t load letter</h2>
      <p className="mb-6 text-sm leading-6 text-slate-500">
        Please try again in a moment.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2557a7] px-4 text-sm font-bold text-white transition hover:bg-[#1e4a94] 2xl:px-5"
      >
        Try again
      </button>
    </div>
  );
}
