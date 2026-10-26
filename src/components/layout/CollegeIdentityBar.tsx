'use client';

import Link from 'next/link';
import type { StudentRecord } from '@/hooks/useStudentRecord';
import type { Standing } from '@/types/institution';

/**
 * The college identity bar (spec: student section, "always visible", LOCKED):
 *
 *   [VIT]  VIT Chennai · CSE · Section B · Batch 2027 · 22CSE118   Readiness 81/100   #12 in college   #4 in CSE
 *
 * Rendered in the Header's centre slot, so it is on every page that mounts the
 * app Header. Full-screen assessment screens (mock test, mock interview,
 * communication, coding test) have no Header and no bar -- owner decision D1:
 * nothing distracts during an assessment.
 *
 * A missing piece is DROPPED, never shown as a dash: no section yet, no batch,
 * or a rank withheld below the privacy floor simply leaves that part out.
 * Below `md` it shrinks to the badge and the readiness number.
 */
function rankText(standing: Standing | null | undefined, where: string): string | null {
  return standing && standing.available ? `#${standing.rank} in ${where}` : null;
}

export function identityParts(record: StudentRecord): {
  badge: string;
  identity: string;
  readiness: string | null;
  collegeRank: string | null;
  departmentRank: string | null;
} {
  const { college, student, readiness, standing } = record;
  const department = student?.department_name ?? student?.department_id ?? null;
  const identity = [
    college.name,
    department,
    student?.section_name ? `Section ${student.section_name}` : null,
    student?.batch_year ? `Batch ${student.batch_year}` : null,
    student?.admission_number ?? null,
  ].filter((part): part is string => Boolean(part)).join(' · ');

  return {
    badge: college.id.toUpperCase().slice(0, 6),
    identity,
    readiness: readiness ? `${Math.round(readiness.readiness)}/${readiness.max}` : null,
    collegeRank: standing && standing.available ? rankText(standing.college, 'college') : null,
    departmentRank: department ? rankText(standing, department) : null,
  };
}

export function CollegeIdentityBar({ record }: { record: StudentRecord }) {
  const p = identityParts(record);
  const spoken = [p.identity, p.readiness && `Readiness ${p.readiness}`, p.collegeRank, p.departmentRank]
    .filter(Boolean)
    .join('. ');

  return (
    <Link
      href="/institution"
      aria-label={`Your college: ${spoken}`}
      data-testid="college-identity-bar"
      className="flex min-w-0 items-center gap-3 rounded-[10px] border border-[#d6e2f7] bg-[#f4f8ff] px-3 py-1.5 text-[12px] text-[#1e293b] hover:border-[#2557a7]/40"
    >
      <span className="shrink-0 rounded-md bg-[#2557a7] px-1.5 py-0.5 text-[11px] font-bold text-white">
        {p.badge}
      </span>
      <span className="hidden min-w-0 truncate font-semibold md:inline">{p.identity}</span>
      {p.readiness ? (
        <>
          <span className="hidden h-4 w-px shrink-0 bg-[#cbd5e1] md:inline-block" aria-hidden />
          <span className="shrink-0 whitespace-nowrap">
            <span className="hidden md:inline">Readiness </span>
            <b className="text-[#2557a7]">{p.readiness.split('/')[0]}</b>/{p.readiness.split('/')[1]}
          </span>
        </>
      ) : null}
      {p.collegeRank ? (
        <span className="hidden shrink-0 whitespace-nowrap font-semibold lg:inline">{p.collegeRank}</span>
      ) : null}
      {p.departmentRank ? (
        <span className="hidden shrink-0 whitespace-nowrap font-semibold lg:inline">{p.departmentRank}</span>
      ) : null}
    </Link>
  );
}
