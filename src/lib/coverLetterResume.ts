export type CoverLetterResumeCandidate = Record<string, unknown>;
export type CoverLetterResumeSource = 'parser' | 'builder';

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function hasParsedData(resume: CoverLetterResumeCandidate): boolean {
  const parsedData = resume.parsed_data;
  return (
    typeof parsedData === 'object' &&
    parsedData !== null &&
    Object.keys(parsedData).length > 0
  );
}

export function getCoverLetterParsedResumeId(
  resume: CoverLetterResumeCandidate | null | undefined
): string | null {
  if (!resume) return null;
  const explicitParserId = [
    resume.parsed_resume_id,
    resume.resume_id,
    resume.parser_resume_id,
    resume.resume_parser_id,
  ]
    .map(asNonEmptyString)
    .find((value): value is string => Boolean(value));

  if (explicitParserId) return explicitParserId;

  if (!hasParsedData(resume)) return null;

  return [resume.id, resume._id]
    .map(asNonEmptyString)
    .find((value): value is string => Boolean(value)) ?? null;
}

export function getCoverLetterResumeSource(
  resume: CoverLetterResumeCandidate | null | undefined
): CoverLetterResumeSource {
  return asNonEmptyString(resume?.source) === 'builder' ? 'builder' : 'parser';
}

export function hasCoverLetterUsableResume(
  resume: CoverLetterResumeCandidate | null | undefined
): boolean {
  return Boolean(getCoverLetterParsedResumeId(resume));
}
