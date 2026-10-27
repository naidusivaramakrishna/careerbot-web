const PRIMARY_KEY = "primary_resume_id";

/** The resume the user marked as their default. Stored per browser. */
export const getPrimaryResumeId = (): string | null => {
  try {
    return localStorage.getItem(PRIMARY_KEY);
  } catch {
    return null;
  }
};

/** Marks one resume as primary (only one at a time). It is only a label: it does not change the resume the other pages use. */
export const setPrimaryResumeId = (resumeId: string): void => {
  try {
    localStorage.setItem(PRIMARY_KEY, resumeId);
  } catch {
    /* storage unavailable - primary just won't persist */
  }
};
