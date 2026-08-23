'use client';

import React, { useState } from 'react';
import { CalendarRange, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createBatch, InstitutionApiError } from '@/api/institutionApi';
import { useInstitution } from '@/contexts/InstitutionContext';
import { useBatches } from '@/hooks/useInstitutionResource';
import { READ_ONLY_CONTROL_HINT } from '@/lib/institutionMessages';
import type { Batch } from '@/types/institution';
import { DataTable } from '../_components/DataTable';
import { EmptyState } from '../_components/EmptyState';
import { ErrorNotice, FormError } from '../_components/ErrorNotice';
import { TextField, fieldErrorMap } from '../_components/FormField';
import { RoleGuard } from '../_components/RoleGuard';
import { LoadingAnnouncement, TableSkeleton } from '../_components/Skeletons';
import { MicroLabel, PageHeader, SectionTitle } from '../_components/Typography';
import { WriteGuard } from '../_components/WriteGuard';
import { CARD } from '../_components/tokens';

/**
 * Batches — one per intake year. Sections sit inside a batch, so this is
 * step two of the college setup, between departments and sections.
 */
function Batches() {
  const { readOnlyReason, canWrite } = useInstitution();
  const batches = useBatches();
  const [academicYear, setAcademicYear] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const rows = batches.data;
  const writable = canWrite('manage_org');
  const fieldErrors = fieldErrorMap(error);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writable || submitting) return;
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      const batch = await createBatch({
        academic_year: academicYear.trim(),
        name: name.trim(),
      });
      setCreated(`${batch.name} added.`);
      setAcademicYear('');
      setName('');
      await batches.refetch();
    } catch (err) {
      setError(
        err instanceof InstitutionApiError ? err : new InstitutionApiError({ reason: 'UNKNOWN' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const saveButton = (
    <Button type="submit" variant="default" size="md" disabled={submitting || !writable}>
      {submitting ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          Adding
        </>
      ) : (
        'Add batch'
      )}
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Batches"
        description="Intake years. Each section belongs to a batch, so add the year before you add its classes."
      />

      {batches.error ? (
        <ErrorNotice error={batches.error} onRetry={batches.refetch} className="mb-4" />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <section className="min-w-0">
          {batches.isLoading && !rows ? (
            <>
              <TableSkeleton rows={4} columns={2} />
              <LoadingAnnouncement label="Loading batches" />
            </>
          ) : rows && rows.length === 0 ? (
            <EmptyState
              icon={CalendarRange}
              title="No batches yet"
              body="A batch is one intake — the 2026 cohort, for instance. Add the current academic year to start placing students into sections."
            />
          ) : rows ? (
            <DataTable<Batch>
              caption="Batches"
              rows={rows}
              rowKey={(b) => b.id}
              columns={[
                {
                  key: 'name',
                  header: 'Batch',
                  render: (b) => <span className="font-medium text-[#0f172a]">{b.name}</span>,
                },
                {
                  key: 'year',
                  header: 'Academic year',
                  align: 'right',
                  width: 'w-[180px]',
                  render: (b) => <span className="tabular-nums">{b.academic_year}</span>,
                },
              ]}
            />
          ) : null}
        </section>

        <aside className="min-w-0">
          <SectionTitle className="mb-2.5">Add a batch</SectionTitle>
          <form className={`${CARD} p-4`} onSubmit={submit}>
            <MicroLabel as="legend" className="mb-3 block">
              New batch
            </MicroLabel>

            <FormError error={error} />

            <div className="space-y-4">
              <TextField
                label="Academic year"
                required
                value={academicYear}
                disabled={!writable}
                error={fieldErrors.academic_year}
                placeholder="2026-27"
                onChange={(e) => setAcademicYear(e.target.value)}
              />
              <TextField
                label="Name"
                required
                value={name}
                disabled={!writable}
                error={fieldErrors.name}
                placeholder="2026 intake"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="mt-4">
              {readOnlyReason ? (
                <WriteGuard active hint={READ_ONLY_CONTROL_HINT[readOnlyReason]}>
                  {saveButton}
                </WriteGuard>
              ) : (
                saveButton
              )}
            </div>

            <p role="status" aria-live="polite" className="mt-3 min-h-[1rem]">
              {created ? (
                <span className="text-[12px] font-medium text-green-700">{created}</span>
              ) : null}
            </p>
          </form>
        </aside>
      </div>
    </>
  );
}

export default function BatchesPage() {
  return (
    <RoleGuard capability="manage_org">
      <Batches />
    </RoleGuard>
  );
}
