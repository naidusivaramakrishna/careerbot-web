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
  // up once reads start using the resolved, scoped key. This is a one-shot
  // migration, not a permanent union — the unscoped bucket is shared across
  // every account on this browser, so it must be folded in and cleared here
  // rather than merged on every read, or it would leak into other accounts.
  const scopedK = scopedKey(APPLIED_JOBS_KEY, userId);
  const scoped = readApplicationsAt(scopedK);
  if (!userId) return scoped;

  const unscoped = readApplicationsAt(APPLIED_JOBS_KEY);
  if (unscoped.length === 0) return scoped;

  const seen = new Set(scoped.map((app) => app.jobId));
  const migrated = [...scoped, ...unscoped.filter((app) => !seen.has(app.jobId))];
  try {
    localStorage.setItem(scopedK, JSON.stringify(migrated));
    localStorage.removeItem(APPLIED_JOBS_KEY);
  } catch (e) {
    console.error("getApplicationHistory: Failed to migrate unscoped applications:", e instanceof Error ? e.message : String(e));
  }
  return migrated;
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

// Removes from both the scoped and unscoped buckets — getApplicationHistory
// merges the two on read (see above), so a record written before userId had
// resolved lives in the unscoped bucket and would otherwise survive a
// scoped-only delete and reappear on the next read.
export function removeApplication(jobId: string, userId?: string | null): void {
  if (typeof window === "undefined") return;

  try {
    const scopedK = scopedKey(APPLIED_JOBS_KEY, userId);
    const scoped = readApplicationsAt(scopedK).filter((app) => app.jobId !== jobId);
    localStorage.setItem(scopedK, JSON.stringify(scoped));

    if (userId) {
      const unscoped = readApplicationsAt(APPLIED_JOBS_KEY).filter((app) => app.jobId !== jobId);
      localStorage.setItem(APPLIED_JOBS_KEY, JSON.stringify(unscoped));
    }
  } catch (e) {
    console.error("removeApplication: Failed to remove application:", e instanceof Error ? e.message : String(e));
  }
}

// ==================== SAVED JOBS TRACKING ====================

function readSavedJobsAt(key: string): SavedJob[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as SavedJob[] : [];
  } catch (e) {
    console.error("getSavedJobs: Failed to parse stored jobs:", e);
    return [];
  }
}

export function getSavedJobs(userId?: string | null): SavedJob[] {
  if (typeof window === "undefined") return [];

  // A user can click Save while useCurrentUserId is still resolving. That
  // write lands in the unscoped bucket; once the id resolves, reads switch to
  // the scoped bucket. Merge both so the saved job does not disappear during
  // that transition. This is a one-shot migration, not a permanent union —
  // the unscoped bucket is shared across every account on this browser, so
  // it must be folded into the scoped bucket and cleared here, or it would
  // leak into every other account that reads on this browser afterward.
  const scopedK = scopedKey(SAVED_JOBS_KEY, userId);
  const scoped = readSavedJobsAt(scopedK);
  if (!userId) return scoped;

  const unscoped = readSavedJobsAt(SAVED_JOBS_KEY);
  if (unscoped.length === 0) return scoped;

  const seen = new Set(scoped.map((job) => job.jobId));
  const migrated = [...scoped, ...unscoped.filter((job) => !seen.has(job.jobId))];
  try {
    localStorage.setItem(scopedK, JSON.stringify(migrated));
    localStorage.removeItem(SAVED_JOBS_KEY);
  } catch (e) {
    console.error("getSavedJobs: Failed to migrate unscoped saved jobs:", e instanceof Error ? e.message : String(e));
  }
  return migrated;
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
      // getSavedJobs merges scoped and pre-user-id records. Remove from both
      // buckets or the unscoped copy would make the job reappear immediately.
      removeSavedJob(jobId, userId);
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
    const scopedK = scopedKey(SAVED_JOBS_KEY, userId);
    const scoped = readSavedJobsAt(scopedK).filter((job) => job.jobId !== jobId);
    localStorage.setItem(scopedK, JSON.stringify(scoped));

    if (userId) {
      const unscoped = readSavedJobsAt(SAVED_JOBS_KEY).filter((job) => job.jobId !== jobId);
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(unscoped));
    }
  } catch (e) {
    console.error("removeSavedJob: Failed to remove saved job:", e instanceof Error ? e.message : String(e));
  }
}

// ==================== CLEANUP UTILITIES ====================

export function clearAllApplications(userId?: string | null): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(scopedKey(APPLIED_JOBS_KEY, userId));
    // getApplicationHistory merges the scoped and unscoped buckets on read —
    // clear both or the unscoped copy makes cleared applications reappear.
    if (userId) localStorage.removeItem(APPLIED_JOBS_KEY);
  } catch (e) {
    console.error("clearAllApplications: Failed to clear:", e instanceof Error ? e.message : String(e));
  }
}

export function clearAllSavedJobs(userId?: string | null): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(scopedKey(SAVED_JOBS_KEY, userId));
    // getSavedJobs merges the scoped and unscoped buckets on read — clear
    // both or the unscoped copy makes cleared saved jobs reappear.
    if (userId) localStorage.removeItem(SAVED_JOBS_KEY);
  } catch (e) {
    console.error("clearAllSavedJobs: Failed to clear:", e instanceof Error ? e.message : String(e));
  }
}
