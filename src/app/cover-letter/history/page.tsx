'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCoverLetterList } from '@/hooks/useCoverLetterList';
import { useDeleteCoverLetter } from '@/hooks/useDeleteCoverLetter';
import { useUpdateCoverLetter } from '@/hooks/useUpdateCoverLetter';
import DeleteConfirmModal from '../_components/DeleteConfirmModal';
import { ERROR_MESSAGES } from '@/lib/coverLetterMessages';
import CoverLetterLayout from '@/components/cover-letter/CoverLetterLayout';
import CoverLetterSidebar from '@/components/cover-letter/CoverLetterSidebar';
import CoverLetterTopBar from '@/components/cover-letter/CoverLetterTopBar';
import CoverLetterEmpty from '@/components/cover-letter/CoverLetterEmpty';
import CoverLetterDetailPanel from '@/components/cover-letter/CoverLetterDetailPanel';
import type { CoverLetterListItem } from '@/types/coverLetter';

export default function CoverLetterHistoryPage() {
  const { items, isLoading, error, refetch } = useCoverLetterList({ limit: 20 });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingRenameId, setPendingRenameId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const deletion = useDeleteCoverLetter({
    onSettled: (_letterId, wasNewlyDeleted) => {
      if (wasNewlyDeleted) toast.success('Cover letter deleted.');
      void refetch();
      if (pendingDeleteId === selectedId) setSelectedId(null);
      setPendingDeleteId(null);
    },
    onError: (_letterId, err) => {
      const message = ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown;
      toast.error(message);
      setPendingDeleteId(null);
    },
  });

  const updater = useUpdateCoverLetter({
    onSuccess: () => {
      toast.success('Cover letter renamed.');
      void refetch();
      setPendingRenameId(null);
    },
    onNotFound: () => {
      toast.error('Cover letter not found.');
      void refetch();
      setPendingRenameId(null);
    },
    onError: (_letterId, err) => {
      const message = ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown;
      toast.error(message);
    },
  });

  useEffect(() => {
    if (!error) return;
    const message = ERROR_MESSAGES[error.reason] ?? ERROR_MESSAGES.unknown;
    toast.error(message, { id: `cl-list-error:${error.reason}` });
  }, [error]);

  const pendingItem =
    pendingDeleteId != null
      ? (items.find((i) => i.letter_id === pendingDeleteId) ?? null)
      : null;
  const renameItem =
    pendingRenameId != null
      ? (items.find((i) => i.letter_id === pendingRenameId) ?? null)
      : null;

  return (
    <>
      <CoverLetterLayout
        sidebar={
          <CoverLetterSidebar
            items={items}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRename={setPendingRenameId}
            onDelete={setPendingDeleteId}
          />
        }
        main={
          <>
            <CoverLetterTopBar />
            {selectedId ? (
              <CoverLetterDetailPanel
                letterId={selectedId}
                onDelete={setPendingDeleteId}
              />
            ) : (
              <CoverLetterEmpty hasLetters={items.length > 0} />
            )}
          </>
        }
      />

      <DeleteConfirmModal
        open={pendingItem !== null}
        item={pendingItem}
        isDeleting={deletion.isLoading}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) void deletion.mutate(pendingDeleteId);
        }}
      />

      <RenameCoverLetterModal
        open={renameItem !== null}
        item={renameItem}
        isSaving={updater.isLoading}
        onCancel={() => setPendingRenameId(null)}
        onSave={(values) => {
          if (pendingRenameId) void updater.mutate(pendingRenameId, values);
        }}
      />
    </>
  );
}

function RenameCoverLetterModal({
  open,
  item,
  isSaving,
  onCancel,
  onSave,
}: {
  open: boolean;
  item: CoverLetterListItem | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (values: { role_title: string | null; company_name: string | null }) => void;
}) {
  const [roleTitle, setRoleTitle] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (!open) return;
    setRoleTitle(item?.role_title ?? '');
    setCompanyName(item?.company_name ?? '');
  }, [item?.company_name, item?.role_title, open]);

  if (!open || !item) return null;

  const canSave = roleTitle.trim().length > 0 || companyName.trim().length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-cover-letter-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
    >
      <form
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSave || isSaving) return;
          onSave({
            role_title: roleTitle.trim() || null,
            company_name: companyName.trim() || null,
          });
        }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2557a7]">
          Rename letter
        </p>
        <h2 id="rename-cover-letter-title" className="mt-2 text-xl font-black text-slate-950">
          Update library title
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This changes only the saved title in your cover-letter history.
        </p>

        <label className="mt-5 block">
          <span className="text-sm font-bold text-slate-700">Role title</span>
          <input
            type="text"
            value={roleTitle}
            maxLength={120}
            onChange={(event) => setRoleTitle(event.target.value)}
            placeholder="e.g. Backend Engineer"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2557a7] focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-slate-700">Company</span>
          <input
            type="text"
            value={companyName}
            maxLength={120}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="e.g. Globex"
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#2557a7] focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave || isSaving}
            className="inline-flex items-center justify-center rounded-lg bg-[#2557a7] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1e4a94] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
