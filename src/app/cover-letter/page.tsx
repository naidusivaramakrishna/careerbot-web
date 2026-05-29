'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useCoverLetterList } from '@/hooks/useCoverLetterList';
import { useDeleteCoverLetter } from '@/hooks/useDeleteCoverLetter';
import DeleteConfirmModal from './_components/DeleteConfirmModal';
import { ERROR_MESSAGES } from '@/lib/coverLetterMessages';
import CoverLetterLayout from '@/components/cover-letter/CoverLetterLayout';
import CoverLetterSidebar from '@/components/cover-letter/CoverLetterSidebar';
import CoverLetterTopBar from '@/components/cover-letter/CoverLetterTopBar';
import CoverLetterEmpty from '@/components/cover-letter/CoverLetterEmpty';
import CoverLetterDetailPanel from '@/components/cover-letter/CoverLetterDetailPanel';

export default function CoverLetterListPage() {
  const { items, isLoading, error, refetch } = useCoverLetterList({ limit: 20 });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const deletion = useDeleteCoverLetter({
    onSettled: (_letterId, wasNewlyDeleted) => {
      if (wasNewlyDeleted) toast.success('Cover letter deleted.');
      void refetch();
      // Clear right panel if the deleted letter was selected.
      if (pendingDeleteId === selectedId) setSelectedId(null);
      setPendingDeleteId(null);
    },
    onError: (_letterId, err) => {
      const message = ERROR_MESSAGES[err.reason] ?? ERROR_MESSAGES.unknown;
      toast.error(message);
      setPendingDeleteId(null);
    },
  });

  if (error) {
    const message = ERROR_MESSAGES[error.reason] ?? ERROR_MESSAGES.unknown;
    toast.error(message, { id: `cl-list-error:${error.reason}` });
  }

  const pendingItem =
    pendingDeleteId != null
      ? (items.find((i) => i.letter_id === pendingDeleteId) ?? null)
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
            onDelete={setPendingDeleteId}
          />
        }
        main={
          <>
            <CoverLetterTopBar />
            {selectedId ? (
              <CoverLetterDetailPanel letterId={selectedId} />
            ) : (
              <CoverLetterEmpty />
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
    </>
  );
}