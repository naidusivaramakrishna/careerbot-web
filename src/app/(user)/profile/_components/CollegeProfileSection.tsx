'use client';

import type { StudentRecord } from '@/hooks/useStudentRecord';

/**
 * The College tab on a student's profile (spec: "College tab first, and
 * already filled in"): what the college's roster already holds, READ-ONLY.
 *
 * "Verified" means the value comes from the college's records, not from the
 * student -- the profile stops asking for what the roster has, and a recruiter
 * can later trust it. There are no inputs on purpose; a wrong value is fixed
 * by the placement office, and the copy says so.
 */
export function facultyLabel(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
}

export default function CollegeProfileSection({ record }: { record: StudentRecord }) {
  const { college, student, people } = record;
  const facultyNames = (people?.faculty ?? [])
    .map((p) => (p.name ?? '').trim())
    .filter(Boolean);
  const faculty = facultyLabel(facultyNames);

  const rows: { label: string; value: string; verified: string | null }[] = [
    { label: 'Department', value: student?.department_name ?? student?.department_id ?? '', verified: 'Verified by your college' },
    { label: 'Section', value: student?.section_name ?? '', verified: 'Verified' },
    { label: 'Batch', value: student?.batch_year ? String(student.batch_year) : '', verified: 'Verified' },
    { label: 'Admission', value: student?.admission_number ?? '', verified: 'Verified' },
    { label: 'Faculty', value: faculty ?? '', verified: null },
  ].filter((r) => r.value);

  return (
    <section aria-labelledby="college-record-heading" className="flex flex-col gap-4 p-1">
      <div>
        <h2 id="college-record-heading" className="text-[15px] font-bold text-gray-900">
          Your college record
        </h2>
        <p className="mt-1 text-xs text-gray-600">
          From {college.name}&apos;s records. Ask your placement office to correct anything here.
        </p>
      </div>
      {rows.length === 0 && record.failed ? (
        // A request failed (e.g. an expired college token): that is not the
        // same as the college having nothing, and must not be told as such.
        <p className="text-sm text-gray-600">
          Your college record could not be loaded right now. Please try again later.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-600">Your college has not added your details yet.</p>
      ) : (
        <dl className="grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 text-[13px]">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="text-gray-600">{r.label}</dt>
              <dd className="font-semibold text-gray-900">{r.value}</dd>
              <dd>
                {r.verified ? (
                  <span className="rounded-full bg-[#ecfdf3] px-2.5 py-0.5 text-xs text-[#166534]">
                    {r.verified}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
