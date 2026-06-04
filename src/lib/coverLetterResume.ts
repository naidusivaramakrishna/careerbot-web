export type CoverLetterResumeCandidate = Record<string, unknown>;

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

  // A plain builder resume id is only safe for cover-letter generation
  // when the row itself contains parser output. Builder-only rows do not
  // satisfy the backend ParsedResumeResolver.
  if (!hasParsedData(resume)) return null;

  return [resume.id, resume._id]
    .map(asNonEmptyString)
    .find((value): value is string => Boolean(value)) ?? null;
}

export function hasCoverLetterUsableResume(
  resume: CoverLetterResumeCandidate | null | undefined
): boolean {
  return Boolean(getCoverLetterParsedResumeId(resume));
}
