'use client';

import React, { useCallback, useState } from 'react';
import { ClipboardPen, Users } from 'lucide-react';
import {
  useStudentProgress,
  useStudentsPaged,
} from '@/hooks/useInstitutionResource';
import { activityLabel } from '@/lib/institutionMessages';
import type { ProgressRecord } from '@/types/institution';
import { DataTable, OptionalCell } from '../_components/DataTable';
import { EmptyState } from '../_components/EmptyState';
import { ErrorNotice } from '../_components/ErrorNotice';
import { RecordProgressForm } from '../_components/RecordProgressForm';
import { RoleGuard } from '../_components/RoleGuard';
import { CardListSkeleton, TableSkeleton } from '../_components/Skeletons';
import { ProgressStatusPill, ScoreCell } from '../_components/StatusPill';
import { PageHeader, SectionTitle } from '../_components/Typography';

/**
 * The faculty's data-entry screen.
 *
 * Two columns on a laptop: the form on the left, and what has already been
 * recorded for the selected student on the right — so a faculty member can see
 * they are not about to log the same mock test twice. The contract has no
 * "all recent progress" route, only per-student, so the right column follows
 * the form's selection (see report).
 */
const ROSTER_LIMIT = 200;

function RecordProgress() {
  // The picker must offer every student this faculty member may write for. The
  // default page was fifty, so anyone past that was simply not in the list --
  // and an absent student looks exactly like one who was never assigned.
  const students = useStudentsPaged({ limit: ROSTER_LIMIT });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const progress = useStudentProgress(selectedId, Boolean(selectedId));

  const refetchProgress = useCallback(() => {
    void progress.refetch();
  }, [progress]);

  const rows = students.data?.items;
  const total = students.data?.total ?? 0;
  const truncated = total > (rows?.length ?? 0);

  return (
    <>
      <PageHeader
        title="Record progress"
        description="Log what a student has completed. Entries appear on their record straight away."
      />

      {students.error ? (
        <ErrorNotice error={students.error} onRetry={students.refetch} className="mb-4" />
      ) : null}

      {truncated ? (
        <p className="mb-3 rounded-lg border border-[#fcd34d] bg-[#fffbeb] px-3 py-2 text-[13px] leading-5 text-[#78350f]">
          This form lists {rows?.length} of your {total} students. Record
          progress for the rest from their own record on the roster.
        </p>
      ) : null}

      {students.isLoading && !rows ? (
        <CardListSkeleton items={2} />
      ) : rows && rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students assigned to you yet"
          body="Progress is recorded against the students assigned to you. Your head of department or placement officer assigns them; once they do, they appear in this form."
        />
      ) : rows ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <div>
            <RecordProgressForm
              students={rows}
              onStudentChange={setSelectedId}
              onRecorded={refetchProgress}
            />
          </div>

          <section className="min-w-0">
            <SectionTitle className="mb-2.5">Already recorded</SectionTitle>

            {!selectedId ? (
              <EmptyState
                icon={ClipboardPen}
                title="Pick a student to see their entries"
                body="Once you choose someone in the form, everything already logged for them shows up here — so you do not record the same activity twice."
              />
            ) : progress.error ? (
              <ErrorNotice error={progress.error} onRetry={progress.refetch} />
            ) : progress.isLoading && !progress.data ? (
              <TableSkeleton rows={4} columns={4} />
            ) : progress.data && progress.data.length === 0 ? (
              <EmptyState
                icon={ClipboardPen}
                title="Nothing logged for them yet"
                body="This will be their first entry."
              />
            ) : progress.data ? (
              <DataTable<ProgressRecord>
                caption="Progress already recorded for the selected student"
                rows={progress.data}
                rowKey={(r) => r.id ?? `${r.activity_type}-${r.status}-${r.score ?? 'x'}`}
                maxHeightClass="max-h-[420px]"
                columns={[
                  {
                    key: 'activity',
                    header: 'Activity',
                    render: (r) => (
                      <span className="font-medium text-[#0f172a]">
                        {activityLabel(r.activity_type)}
                      </span>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Result',
                    width: 'w-[140px]',
                    render: (r) => <ProgressStatusPill status={r.status} />,
                  },
                  {
                    key: 'score',
                    header: 'Score',
                    align: 'right',
                    width: 'w-[120px]',
                    render: (r) => <ScoreCell score={r.score} maxScore={r.max_score} />,
                  },
                  {
                    key: 'ref',
                    header: 'Reference',
                    secondary: true,
                    render: (r) => <OptionalCell value={r.activity_ref} />,
                  },
                ]}
              />
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

export default function RecordProgressPage() {
  return (
    <RoleGuard capability="write_progress">
      <RecordProgress />
    </RoleGuard>
  );
}
