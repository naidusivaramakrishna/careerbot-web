/**
 * Job ID Helper - Generate consistent IDs for both recruiter and aggregated jobs
 */
 
/**
 * Generate a composite ID for aggregated jobs (external sources)
 * Creates a stable hash from job title, company, and location
 * This allows matching jobs across multiple API calls
 */
export function generateCompositeJobId(title: string, company: string, location: string): string {
  // Create a simple hash from the concatenated string
  const combined = `${title}||${company}||${location}`.toLowerCase();
 
  // Simple hash function (djb2)
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) + combined.charCodeAt(i);
  }
 
  return `composite-${Math.abs(hash).toString(36)}`;
}
 
/**
 * Get job ID - uses actual API ID if available, otherwise generates composite ID
 */
export function getJobId(
  apiId: string | undefined,
  title: string,
  company: string,
  location: string
): string {
  // If API provided an ID, use it (recruiter jobs)
  if (apiId && apiId.trim()) {
    return apiId;
  }
 
  // For aggregated jobs without ID, generate composite ID
  return generateCompositeJobId(title, company, location);
}

const BACKEND_JOB_ID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * POST /premium/actions validates job_id server-side as a canonical UUID.
 * A client-generated composite-* fallback never matches, and neither does any
 * legacy/non-UUID id that made it into a job document before ids were
 * standardized on uuid4() — so check the actual shape rather than just the
 * composite-* prefix.
 */
export function isValidBackendJobId(id: string): boolean {
  return BACKEND_JOB_ID_PATTERN.test(id);
}