'use client';

import React, { useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createDepartment, InstitutionApiError } from '@/api/institutionApi';
import { useInstitution } from '@/contexts/InstitutionContext';
import { useDepartments } from '@/hooks/useInstitutionResource';
import { READ_ONLY_CONTROL_HINT } from '@/lib/institutionMessages';
import type { Department } from '@/types/institution';
import { DataTable, OptionalCell } from '../_components/DataTable';
import { EmptyState } from '../_components/EmptyState';
import { ErrorNotice, FormError } from '../_components/ErrorNotice';
import { TextField, fieldErrorMap } from '../_components/FormField';
import { RoleGuard } from '../_components/RoleGuard';
import { LoadingAnnouncement, TableSkeleton } from '../_components/Skeletons';
import { MicroLabel, PageHeader, SectionTitle } from '../_components/Typography';
import { WriteGuard } from '../_components/WriteGuard';
import { CARD } from '../_components/tokens';

/**
 * Departments — the CPO's first-run screen.
 *
 * A brand-new college lands here with nothing, so the empty state is not an
 * apology: it is the instruction for step one. Departments come before batches,
 * sections, staff and students, because every one of those needs a department
 * to belong to.
 */
function Departments() {
  const { readOnlyReason, canWrite } = useInstitution();
  const departments = useDepartments();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<InstitutionApiError | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const rows = departments.data;
  const writable = canWrite('manage_org');
  const fieldErrors = fieldErrorMap(error);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writable || submitting) return;
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      const dept = await createDepartment({
        name: name.trim(),
        ...(slug.trim() ? { department_id: slug.trim() } : {}),
      });
      setCreated(`${dept.name} added.`);
      setName('');
      setSlug('');
      await departments.refetch();
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
        'Add department'
      )}
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Departments"
        description="The academic units of your college. Everything else — batches, sections, staff and students — hangs off these."
      />

      {departments.error ? (
        <ErrorNotice error={departments.error} onRetry={departments.refetch} className="mb-4" />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <section className="min-w-0">
          {departments.isLoading && !rows ? (
            <>
              <TableSkeleton rows={5} columns={2} />
              <LoadingAnnouncement label="Loading departments" />
            </>
          ) : rows && rows.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Start by adding your departments"
              body="Nothing has been set up for your college yet. Add a department — Computer Science, Mechanical, and so on — and the rest of the setup opens up from there."
            />
          ) : rows ? (
            <DataTable<Department>
              caption="Departments"
              rows={rows}
              rowKey={(d) => d.id}
              columns={[
                {
                  key: 'name',
                  header: 'Department',
                  render: (d) => <span className="font-medium text-[#0f172a]">{d.name}</span>,
                },
                {
                  key: 'id',
                  header: 'Code',
                  width: 'w-[200px]',
                  render: (d) => (
                    <span className="font-mono text-[12px] text-[#64748b]">
                      <OptionalCell value={d.id} />
                    </span>
                  ),
                },
              ]}
            />
          ) : null}
        </section>

        <aside className="min-w-0">
          <SectionTitle className="mb-2.5">Add a department</SectionTitle>
          <form className={`${CARD} p-4`} onSubmit={submit}>
            <MicroLabel as="legend" className="mb-3 block">
              New department
            </MicroLabel>

            <FormError error={error} />

            <div className="space-y-4">
              <TextField
                label="Name"
                required
                value={name}
                disabled={!writable}
                error={fieldErrors.name}
                placeholder="Computer Science"
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                label="Code"
                value={slug}
                disabled={!writable}
                error={fieldErrors.department_id}
                placeholder="cse"
                hint="Optional — a short code used in URLs and reports. One is generated if you leave it blank."
                onChange={(e) => setSlug(e.target.value)}
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

export default function DepartmentsPage() {
  return (
    <RoleGuard capability="manage_org">
      <Departments />
    </RoleGuard>
  );
}
