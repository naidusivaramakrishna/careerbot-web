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

// Keys are scoped per user id so switching accounts on the same browser
// doesn't leak one user's saved/applied jobs into another's counts.
function scopedKey(base: string, userId?: string | null): string {
  return userId ? `${base}:${userId}` : base;
}

// ==================== APPLICATION TRACKING ====================

function readApplicationsAt(key: string): JobApplication[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as JobApplication[] : [];
  } catch (e) {
    console.error("getApplicationHistory: Failed to parse stored applications:", e);
    return [];
  }
}

export function getApplicationHistory(userId?: string | null): JobApplication[] {
  if (typeof window === "undefined") return [];

  // Merge the scoped (per-user) and unscoped bucket so an application
  // recorded before the user id had resolved (unscoped write) still shows
  // up once reads start using the resolved, scoped key.
  const scoped = readApplicationsAt(scopedKey(APPLIED_JOBS_KEY, userId));
  if (!userId) return scoped;

  const unscoped = readApplicationsAt(APPLIED_JOBS_KEY);
  if (unscoped.length === 0) return scoped;

  const seen = new Set(scoped.map((app) => app.jobId));
  return [...scoped, ...unscoped.filter((app) => !seen.has(app.jobId))];
}

export function isJobApplied(jobId: string, userId?: string | null): boolean {
  const history = getApplicationHistory(userId);
  return history.some((app) => app.jobId === jobId);
}

export function recordJobApplication(
  jobId: string,
  title: string,
  company: string,
  url: string,
  userId?: string | null
): void {
  if (typeof window === "undefined") return;

  try {
    const history = getApplicationHistory(userId);

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
    localStorage.setItem(scopedKey(APPLIED_JOBS_KEY, userId), JSON.stringify(history));
  } catch (e) {
    console.error("recordJobApplication: Failed to save application:", e instanceof Error ? e.message : String(e));
  }
}

export function getApplicationCount(userId?: string | null): number {
  return getApplicationHistory(userId).length;
}

// ==================== SAVED JOBS TRACKING ====================

export function getSavedJobs(userId?: string | null): SavedJob[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(scopedKey(SAVED_JOBS_KEY, userId));
    return stored ? JSON.parse(stored) as SavedJob[] : [];
  } catch (e) {
    console.error("getSavedJobs: Failed to parse stored jobs:", e);
    return [];
  }
}

export function getSavedJobIds(userId?: string | null): string[] {
  return getSavedJobs(userId).map((job) => job.jobId);
}

export function isJobSaved(jobId: string, userId?: string | null): boolean {
  const saved = getSavedJobs(userId);
  return saved.some((job) => job.jobId === jobId);
}

export function toggleJobSaved(
  jobId: string,
  title: string,
  company: string,
  location: string,
  type: string,
  userId?: string | null
): boolean {
  if (typeof window === "undefined") return false;

  try {
    const saved = getSavedJobs(userId);

    // Check if already saved
    const existingIndex = saved.findIndex((job) => job.jobId === jobId);

    if (existingIndex > -1) {
      // Remove from saved
      saved.splice(existingIndex, 1);
      localStorage.setItem(scopedKey(SAVED_JOBS_KEY, userId), JSON.stringify(saved));
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
      localStorage.setItem(scopedKey(SAVED_JOBS_KEY, userId), JSON.stringify(saved));
      return true;
    }
  } catch (e) {
    console.error("toggleJobSaved: Failed to toggle saved job:", e instanceof Error ? e.message : String(e));
    return false;
  }
}

export function getSavedJobsCount(userId?: string | null): number {
  return getSavedJobs(userId).length;
}

export function removeSavedJob(jobId: string, userId?: string | null): void {
  if (typeof window === "undefined") return;

  try {
    let saved = getSavedJobs(userId);
    saved = saved.filter((job) => job.jobId !== jobId);
    localStorage.setItem(scopedKey(SAVED_JOBS_KEY, userId), JSON.stringify(saved));
  } catch (e) {
    console.error("removeSavedJob: Failed to remove saved job:", e instanceof Error ? e.message : String(e));
  }
}

// ==================== CLEANUP UTILITIES ====================

export function clearAllApplications(userId?: string | null): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(scopedKey(APPLIED_JOBS_KEY, userId));
  } catch (e) {
    console.error("clearAllApplications: Failed to clear:", e instanceof Error ? e.message : String(e));
  }
}

export function clearAllSavedJobs(userId?: string | null): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(scopedKey(SAVED_JOBS_KEY, userId));
  } catch (e) {
    console.error("clearAllSavedJobs: Failed to clear:", e instanceof Error ? e.message : String(e));
  }
}