/**
 * Job Tracking Utilities
 * Manages job applications and saved jobs in localStorage
 */

export interface JobApplication {
  jobId: string;
  title: string;
  company: string;
  url: string;
  appliedAt: string;
}

export interface SavedJob {
  jobId: string;
  title: string;
  company: string;
  location: string;
  type: string;
  savedAt: string;
}

const APPLIED_JOBS_KEY = "appliedJobs";
const SAVED_JOBS_KEY = "savedJobs";

// ==================== APPLICATION TRACKING ====================

export function getApplicationHistory(): JobApplication[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(APPLIED_JOBS_KEY);
    return stored ? JSON.parse(stored) as JobApplication[] : [];
  } catch (e) {
    console.error("getApplicationHistory: Failed to parse stored applications:", e);
    return [];
  }
}

export function isJobApplied(jobId: string): boolean {
  const history = getApplicationHistory();
  return history.some((app) => app.jobId === jobId);
}

export function recordJobApplication(
  jobId: string,
  title: string,
  company: string,
  url: string
): void {
  if (typeof window === "undefined") return;

  try {
    const history = getApplicationHistory();

    // Avoid duplicates
    if (history.some((app) => app.jobId === jobId)) {
      return;
    }

    const newApplication: JobApplication = {
      jobId,
      title,
      company,
      url,
      appliedAt: new Date().toISOString(),
    };

    history.push(newApplication);
    localStorage.setItem(APPLIED_JOBS_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("recordJobApplication: Failed to save application:", e instanceof Error ? e.message : String(e));
  }
}

export function getApplicationCount(): number {
  return getApplicationHistory().length;
}

// ==================== SAVED JOBS TRACKING ====================

export function getSavedJobs(): SavedJob[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(SAVED_JOBS_KEY);
    return stored ? JSON.parse(stored) as SavedJob[] : [];
  } catch (e) {
    console.error("getSavedJobs: Failed to parse stored jobs:", e);
    return [];
  }
}

export function getSavedJobIds(): string[] {
  return getSavedJobs().map((job) => job.jobId);
}

export function isJobSaved(jobId: string): boolean {
  const saved = getSavedJobs();
  return saved.some((job) => job.jobId === jobId);
}

export function toggleJobSaved(
  jobId: string,
  title: string,
  company: string,
  location: string,
  type: string
): boolean {
  if (typeof window === "undefined") return false;

  try {
    let saved = getSavedJobs();

    // Check if already saved
    const existingIndex = saved.findIndex((job) => job.jobId === jobId);

    if (existingIndex > -1) {
      // Remove from saved
      saved.splice(existingIndex, 1);
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(saved));
      return false;
    } else {
      // Add to saved
      const newSavedJob: SavedJob = {
        jobId,
        title,
        company,
        location,
        type,
        savedAt: new Date().toISOString(),
      };

      saved.push(newSavedJob);
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(saved));
      return true;
    }
  } catch (e) {
    console.error("toggleJobSaved: Failed to toggle saved job:", e instanceof Error ? e.message : String(e));
    return false;
  }
}

export function getSavedJobsCount(): number {
  return getSavedJobs().length;
}

export function removeSavedJob(jobId: string): void {
  if (typeof window === "undefined") return;

  try {
    let saved = getSavedJobs();
    saved = saved.filter((job) => job.jobId !== jobId);
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(saved));
  } catch (e) {
    console.error("removeSavedJob: Failed to remove saved job:", e instanceof Error ? e.message : String(e));
  }
}

// ==================== CLEANUP UTILITIES ====================

export function clearAllApplications(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(APPLIED_JOBS_KEY);
  } catch (e) {
    console.error("clearAllApplications: Failed to clear:", e instanceof Error ? e.message : String(e));
  }
}

export function clearAllSavedJobs(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SAVED_JOBS_KEY);
  } catch (e) {
    console.error("clearAllSavedJobs: Failed to clear:", e instanceof Error ? e.message : String(e));
  }
}
