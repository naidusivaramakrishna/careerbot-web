'use client';

import React, { useEffect, useState } from 'react';
import { Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createSection, InstitutionApiError } from '@/api/institutionApi';
import { useInstitution } from '@/contexts/InstitutionContext';
import { useBatches, useDepartments, useSections } from '@/hooks/useInstitutionResource';
import { READ_ONLY_CONTROL_HINT } from '@/lib/institutionMessages';
import type { Section } from '@/types/institution';
import { DataTable, OptionalCell } from '../_components/DataTable';
import { EmptyState } from '../_components/EmptyState';
import { ErrorNotice, FormError } from '../_components/ErrorNotice';
import { SelectField, TextField, fieldErrorMap } from '../_components/FormField';
import { RoleGuard } from '../_components/RoleGuard';
import { LoadingAnnouncement, TableSkeleton } from '../_components/Skeletons';
import { MicroLabel, PageHeader, SectionTitle } from '../_components/Typography';
import { WriteGuard } from '../_components/WriteGuard';
import { CARD } from '../_components/tokens';

/**
 * Sections — the class groups students actually sit in.
 *
 * `GET /sections` is the one list route that takes a filter (`?department_id=`),
 * so the department picker here is a real server-side filter rather than a
 * client-side one. An HOD sees their own department; the server narrows it
 * either way.
 *
 * A section needs BOTH a department and a batch, so if either list is empty the
 * form says which one to create first instead of offering an empty dropdown.
 */
function Sections() {
  const { readOnlyReason, canWrite, activeMembership } = useInstitution();
  const departments = useDepartments();
  const batches = useBatches();

  const [filterDepartment, setFilterDepartment] = useState('');
  const sections = useSections(filterDepartment || undefined);

  const [departmentId, setDepartmentId] = useState(activeMembership?.department_id ?? '');
  const [batchId, setBatchId] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  // Preselect the only department there is — an HOD has exactly one, and
  // making them pick it every time is friction with no decision in it.
  useEffect(() => {
    if (!departmentId && departments.data?.length === 1) {
      setDepartmentId(departments.data[0].id);
    }
  }, [departmentId, departments.data]);

  const rows = sections.data;
  const writable = canWrite('manage_org');
  const fieldErrors = fieldErrorMap(error);

  const missingPrerequisite =
    departments.data?.length === 0
      ? 'department'
      : batches.data?.length === 0
        ? 'batch'
        : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writable || submitting) return;
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      const section = await createSection({
        department_id: departmentId,
        batch_id: batchId,
        name: name.trim(),
      });
      setCreated(`Section ${section.name} added.`);
      setName('');
      await sections.refetch();
    } catch (err) {
      setError(
        err instanceof InstitutionApiError ? err : new InstitutionApiError({ reason: 'UNKNOWN' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const saveButton = (
    <Button
      type="submit"
      variant="default"
      size="md"
      disabled={submitting || !writable || Boolean(missingPrerequisite)}
    >
      {submitting ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          Adding
        </>
      ) : (
        'Add section'
      )}
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Sections"
        description="Class groups inside a department and a batch. Students are placed into one of these."
      />

      {sections.error ? (
        <ErrorNotice error={sections.error} onRetry={sections.refetch} className="mb-4" />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <section className="min-w-0">
          {departments.data && departments.data.length > 1 ? (
            <div className="mb-3 max-w-[280px]">
              <SelectField
                label="Department"
                value={filterDepartment}
                placeholder="All departments"
                onChange={(e) => setFilterDepartment(e.target.value)}
                options={[
                  { value: '', label: 'All departments' },
                  ...departments.data.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
            </div>
          ) : null}

          {sections.isLoading && !rows ? (
            <>
              <TableSkeleton rows={5} columns={3} />
              <LoadingAnnouncement label="Loading sections" />
            </>
          ) : rows && rows.length === 0 ? (
            <EmptyState
              icon={Layers}
              title={filterDepartment ? 'No sections in that department' : 'No sections yet'}
              body={
                missingPrerequisite === 'department'
                  ? 'Sections sit inside a department. Create a department first, then come back here.'
                  : missingPrerequisite === 'batch'
                    ? 'Sections sit inside a batch. Add the academic year on the Batches screen first, then come back here.'
                    : 'A section is one class group — CSE-A, for instance. Add one on the right and you can start placing students into it.'
              }
            />
          ) : rows ? (
            <DataTable<Section>
              caption="Sections"
              rows={rows}
              rowKey={(s) => s.id}
              columns={[
                {
                  key: 'name',
                  header: 'Section',
                  render: (s) => <span className="font-medium text-[#0f172a]">{s.name}</span>,
                },
                {
                  key: 'department',
                  header: 'Department',
                  render: (s) => (
                    <OptionalCell
                      value={
                        departments.data?.find((d) => d.id === s.department_id)?.name ??
                        s.department_id
                      }
                    />
                  ),
                },
                {
                  key: 'batch',
                  header: 'Batch',
                  secondary: true,
                  render: (s) => (
                    <OptionalCell
                      value={batches.data?.find((b) => b.id === s.batch_id)?.name ?? s.batch_id}
                    />
                  ),
                },
              ]}
            />
          ) : null}
        </section>

        <aside className="min-w-0">
          <SectionTitle className="mb-2.5">Add a section</SectionTitle>
          <form className={`${CARD} p-4`} onSubmit={submit}>
            <MicroLabel as="legend" className="mb-3 block">
              New section
            </MicroLabel>

            <FormError error={error} />

            <div className="space-y-4">
              <SelectField
                label="Department"
                required
                value={departmentId}
                placeholder="Choose a department"
                disabled={!writable || departments.data?.length === 0}
                error={fieldErrors.department_id}
                hint={
                  departments.data?.length === 0
                    ? 'Create a department first — sections belong to one.'
                    : undefined
                }
                onChange={(e) => setDepartmentId(e.target.value)}
                options={(departments.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
              />
              <SelectField
                label="Batch"
                required
                value={batchId}
                placeholder="Choose a batch"
                disabled={!writable || (batches.data?.length ?? 0) === 0}
                error={fieldErrors.batch_id}
                hint={
                  batches.error
                    ? 'Batches are managed by your placement officer — ask them for the batch to use.'
                    : batches.data?.length === 0
                      ? 'Add an academic year on the Batches screen first.'
                      : undefined
                }
                onChange={(e) => setBatchId(e.target.value)}
                options={(batches.data ?? []).map((b) => ({
                  value: b.id,
                  label: `${b.name} · ${b.academic_year}`,
                }))}
              />
              <TextField
                label="Name"
                required
                value={name}
                disabled={!writable}
                error={fieldErrors.name}
                placeholder="CSE-A"
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

export default function SectionsPage() {
  return (
    <RoleGuard capability="manage_org">
      <Sections />
    </RoleGuard>
  );
}
