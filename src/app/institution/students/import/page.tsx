'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, FileUp, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  BULK_CHUNK_SIZE,
  bulkOnboardStudents,
  chunkStudents,
  InstitutionApiError,
} from '@/api/institutionApi';
import { useInstitution } from '@/contexts/InstitutionContext';
import { useDepartments } from '@/hooks/useInstitutionResource';
import { parseCsv } from '@/lib/csv';
import { READ_ONLY_CONTROL_HINT } from '@/lib/institutionMessages';
import type { BulkRowOutcome, BulkStudentRow } from '@/types/institution';
import { DataTable } from '../../_components/DataTable';
import { ErrorNotice } from '../../_components/ErrorNotice';
import { RoleGuard } from '../../_components/RoleGuard';
import { PageHeader, SectionTitle } from '../../_components/Typography';
import { WriteGuard } from '../../_components/WriteGuard';

/**
 * Load a roster from a spreadsheet.
 *
 * Onboarding is otherwise one form per student, and a deemed university has
 * thirty thousand of them.
 *
 * THE FILE IS PARSED IN THE BROWSER and sent as JSON, rather than uploaded.
 * Three reasons, in order of weight:
 *   1. The person has to see what will be imported BEFORE it is, and check
 *      that their columns were understood. That means parsing on this side
 *      whatever else happens.
 *   2. Row-level errors have to point at the line in the file the person is
 *      looking at. The server sees a chunk, not a file, so only this side can
 *      do that mapping.
 *   3. The server then validates ONE shape -- the same StudentIn the
 *      single-student form posts -- instead of a second CSV path that will
 *      drift from it.
 * The cost is that a malformed file is diagnosed here; the benefit is that it
 * is diagnosed before anything is written.
 */

/** What we ask the file to contain. */
const REQUIRED_COLUMNS = ['full_name', 'admission_number'] as const;
const OPTIONAL_COLUMNS = [
  'department_id',
  'college_email',
  'section_id',
  'batch_year',
] as const;

interface PreparedRow {
  /** The line in the FILE, which is what the person sees in their editor. */
  line: number;
  student: BulkStudentRow;
}

interface RowReport {
  line: number;
  admission_number: string;
  outcome: BulkRowOutcome;
  message: string | null;
}

const OUTCOME_STYLES: Record<BulkRowOutcome, { label: string; className: string }> = {
  created: { label: 'Added', className: 'bg-[#dcfce7] text-[#166534]' },
  duplicate: { label: 'Already there', className: 'bg-[#fef3c7] text-[#92400e]' },
  rejected: { label: 'Not added', className: 'bg-[#fee2e2] text-[#991b1b]' },
};

function OutcomePill({ outcome }: { outcome: BulkRowOutcome }) {
  const style = OUTCOME_STYLES[outcome];
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
        style.className,
      )}
    >
      {style.label}
    </span>
  );
}

export default function BulkImportPage() {
  return (
    <RoleGuard capability="onboard_student">
      <BulkImport />
    </RoleGuard>
  );
}

function BulkImport() {
  const { readOnlyReason } = useInstitution();
  const departments = useDepartments();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PreparedRow[]>([]);
  const [skipped, setSkipped] = useState<RowReport[]>([]);
  const [fallbackDepartment, setFallbackDepartment] = useState('');

  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [reports, setReports] = useState<RowReport[] | null>(null);
  const [importError, setImportError] = useState<InstitutionApiError | null>(null);

  const departmentRows = departments.data ?? [];
  const onlyDepartment = departmentRows.length === 1 ? departmentRows[0].id : '';

  /**
   * `fallback` is passed in rather than read from state. The department select
   * re-parses on change, and at that moment the state setter has not applied
   * yet -- reading it here would use the PREVIOUS department, so the first
   * choice appeared to do nothing and the second applied the first.
   */
  const readFile = async (file: File, fallback = fallbackDepartment) => {
    setFileError(null);
    setReports(null);
    setImportError(null);
    setPrepared([]);
    setSkipped([]);
    setFileName(file.name);

    let text: string;
    try {
      text = await file.text();
    } catch {
      setFileError('That file could not be read. Try saving it again as CSV.');
      return;
    }

    const { headers, rows } = parseCsv(text);
    if (rows.length === 0) {
      setFileError('There are no rows in that file below the header line.');
      return;
    }

    const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      setFileError(
        `The file needs a column for ${missing.join(' and ')}. ` +
          `It has: ${headers.filter(Boolean).join(', ') || 'nothing readable'}.`,
      );
      return;
    }

    // Rows that cannot be sent at all are separated HERE and reported beside
    // the ones that were, so the final list accounts for every line in the
    // file. Silently dropping them is how an import reports "2,900 added" for
    // a 3,000-row file and nobody notices which hundred are missing.
    const ready: PreparedRow[] = [];
    const unusable: RowReport[] = [];

    rows.forEach(({ values, line }) => {
      const fullName = (values.full_name ?? '').trim();
      const admissionNumber = (values.admission_number ?? '').trim();
      const departmentId =
        (values.department_id ?? '').trim() || fallback || onlyDepartment;

      const problem = !fullName
        ? 'no name'
        : !admissionNumber
          ? 'no admission number'
          : !departmentId
            ? 'no department, and none chosen below'
            : null;

      if (problem) {
        unusable.push({
          line,
          admission_number: admissionNumber,
          outcome: 'rejected',
          message: problem,
        });
        return;
      }

      const batchYearRaw = (values.batch_year ?? '').trim();
      const batchYear = batchYearRaw ? Number(batchYearRaw) : null;

      ready.push({
        line,
        student: {
          department_id: departmentId,
          full_name: fullName,
          admission_number: admissionNumber,
          college_email: (values.college_email ?? '').trim() || null,
          section_id: (values.section_id ?? '').trim() || null,
          // A year that is not a number is left OUT rather than sent as NaN,
          // which would fail the whole chunk on a body error and take the
          // other 499 rows with it.
          batch_year: Number.isFinite(batchYear) ? batchYear : null,
        },
      });
    });

    setPrepared(ready);
    setSkipped(unusable);
  };

  const runImport = async () => {
    setIsImporting(true);
    setImportError(null);
    setReports(null);

    const chunks = chunkStudents(prepared, BULK_CHUNK_SIZE);
    setProgress({ done: 0, total: prepared.length });

    const collected: RowReport[] = [...skipped];
    let offset = 0;

    try {
      // Sequential, not parallel. Ten chunks at once is ten times the write
      // load on one college's collection for no wall-clock the person cares
      // about, and a partial failure becomes much harder to describe.
      for (const chunk of chunks) {
        const response = await bulkOnboardStudents(chunk.map((r) => r.student));
        response.results.forEach((result) => {
          // The server counts within the CHUNK. Map back to the file's own
          // line before this is shown to anyone.
          const source = chunk[result.index];
          collected.push({
            line: source ? source.line : offset + result.index + 1,
            admission_number: result.admission_number,
            outcome: result.outcome,
            message: result.message,
          });
        });
        offset += chunk.length;
        setProgress({ done: offset, total: prepared.length });
      }
      collected.sort((a, b) => a.line - b.line);
      setReports(collected);
      setPrepared([]);
      setSkipped([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      // The chunk was refused outright. Anything already imported STAYS
      // imported, and the report says how far it got -- telling someone the
      // import failed when two thousand students are now on the roster sends
      // them to re-upload and be told they are all duplicates.
      setImportError(
        err instanceof InstitutionApiError
          ? err
          : new InstitutionApiError({ reason: 'UNKNOWN' }),
      );
      if (collected.length > skipped.length) {
        collected.sort((a, b) => a.line - b.line);
        setReports(collected);
      }
    } finally {
      setIsImporting(false);
    }
  };

  const summary = useMemo(() => {
    if (!reports) return null;
    return {
      created: reports.filter((r) => r.outcome === 'created').length,
      duplicate: reports.filter((r) => r.outcome === 'duplicate').length,
      rejected: reports.filter((r) => r.outcome === 'rejected').length,
    };
  }, [reports]);

  const needsDepartment =
    prepared.length === 0 &&
    skipped.some((r) => r.message === 'no department, and none chosen below');

  const importButton = (
    <Button
      variant="default"
      size="sm"
      onClick={runImport}
      disabled={prepared.length === 0 || isImporting || Boolean(readOnlyReason)}
    >
      {isImporting ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
          Importing {progress.done} of {progress.total}
        </>
      ) : (
        <>
          <Upload className="mr-1.5 h-4 w-4" aria-hidden />
          Import {prepared.length} {prepared.length === 1 ? 'student' : 'students'}
        </>
      )}
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Import students from a spreadsheet"
        description="Save your roster as CSV and choose it here. Nothing is imported until you have seen what will be."
        actions={
          <Link href="/institution/people">
            <Button variant="outline" size="sm">Add one student instead</Button>
          </Link>
        }
      />

      {departments.error ? (
        <ErrorNotice error={departments.error} onRetry={departments.refetch} className="mb-4" />
      ) : null}

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <SectionTitle className="mb-1">The file</SectionTitle>
        <p className="mb-3 text-[13px] leading-relaxed text-[#475569]">
          One row per student. It must have a <code>full_name</code> column and an{' '}
          <code>admission_number</code> column. It may also have{' '}
          {OPTIONAL_COLUMNS.map((c) => <code key={c}>{c}</code>).reduce(
            (acc, el, i) => (i === 0 ? [el] : [...acc, ', ', el]),
            [] as React.ReactNode[],
          )}
          . Column names are matched ignoring case and spacing.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-[#eef2ff] file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-[#2557a7] hover:file:bg-[#e0e7ff]"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void readFile(file);
          }}
        />

        {fileName ? (
          <p className="mt-2 text-[12px] text-[#64748b]">
            <FileUp className="mr-1 inline h-3.5 w-3.5" aria-hidden />
            {fileName}
          </p>
        ) : null}

        {fileError ? (
          <p className="mt-3 flex items-start gap-1.5 rounded-md bg-[#fee2e2] px-3 py-2 text-[13px] text-[#991b1b]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {fileError}
          </p>
        ) : null}

        {departmentRows.length > 1 && (prepared.length > 0 || needsDepartment) ? (
          <label className="mt-4 block text-[13px]">
            <span className="mb-1 block font-medium text-[#334155]">
              Department for rows that do not name one
            </span>
            <select
              value={fallbackDepartment}
              onChange={(e) => {
                const next = e.target.value;
                setFallbackDepartment(next);
                const file = fileRef.current?.files?.[0];
                if (file) void readFile(file, next);
              }}
              className="w-full max-w-sm rounded-md border border-[#cbd5e1] px-2.5 py-1.5 text-[13px]"
            >
              <option value="">Leave them out</option>
              {departmentRows.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
        ) : null}
      </section>

      {prepared.length > 0 || skipped.length > 0 ? (
        <section className="mt-5">
          <SectionTitle className="mb-2">
            Ready to import: {prepared.length}
            {skipped.length > 0 ? ` · cannot be imported: ${skipped.length}` : ''}
          </SectionTitle>

          {skipped.length > 0 ? (
            <div className="mb-3 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
              <p className="mb-1.5 text-[13px] font-medium text-[#92400e]">
                These rows will be skipped
              </p>
              <ul className="space-y-0.5 text-[12px] text-[#92400e]">
                {skipped.slice(0, 8).map((r) => (
                  <li key={r.line}>Row {r.line} — {r.message}</li>
                ))}
                {skipped.length > 8 ? (
                  <li>…and {skipped.length - 8} more</li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {readOnlyReason ? (
            <WriteGuard active hint={READ_ONLY_CONTROL_HINT[readOnlyReason]}>
              {importButton}
            </WriteGuard>
          ) : (
            importButton
          )}
          {prepared.length > BULK_CHUNK_SIZE ? (
            <p className="mt-2 text-[12px] text-[#64748b]">
              Sent in {chunkStudents(prepared, BULK_CHUNK_SIZE).length} batches of up
              to {BULK_CHUNK_SIZE}. Leave this page open until it finishes.
            </p>
          ) : null}
        </section>
      ) : null}

      {importError ? (
        <ErrorNotice error={importError} className="mt-4" />
      ) : null}

      {reports && summary ? (
        <section className="mt-6">
          <SectionTitle className="mb-2">
            {summary.created} added
            {summary.duplicate > 0 ? ` · ${summary.duplicate} already on the roster` : ''}
            {summary.rejected > 0 ? ` · ${summary.rejected} not added` : ''}
          </SectionTitle>

          {summary.created > 0 && summary.rejected === 0 && summary.duplicate === 0 ? (
            <p className="mb-3 flex items-center gap-1.5 rounded-md bg-[#dcfce7] px-3 py-2 text-[13px] text-[#166534]">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Every row imported.
            </p>
          ) : null}

          <DataTable<RowReport>
            caption="What happened to each row"
            rows={reports}
            rowKey={(r) => `${r.line}-${r.admission_number}`}
            maxHeightClass="max-h-[60vh]"
            columns={[
              {
                key: 'line',
                header: 'Row',
                align: 'right',
                width: 'w-[70px]',
                render: (r) => <span className="tabular-nums">{r.line}</span>,
              },
              {
                key: 'admission',
                header: 'Admission no.',
                render: (r) => r.admission_number || <span className="text-[#94a3b8]">—</span>,
              },
              {
                key: 'outcome',
                header: 'Result',
                width: 'w-[130px]',
                render: (r) => <OutcomePill outcome={r.outcome} />,
              },
              {
                key: 'message',
                header: 'Detail',
                render: (r) => r.message ?? <span className="text-[#94a3b8]">—</span>,
              },
            ]}
          />

          <div className="mt-3">
            <Link href="/institution/students">
              <Button variant="outline" size="sm">View the roster</Button>
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
