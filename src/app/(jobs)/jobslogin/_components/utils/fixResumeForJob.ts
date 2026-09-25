// Shared by JobCard's "customize resume first?" apply gate and the job
// details page's "Customize Your Resume" AI tool — both need the exact same
// free match pipeline (resolve JD → parse resume → match → seed session →
// hand off to /jobmatch/app), so it lives here once instead of drifting
// out of sync between two copies.
import { parseResumeFromProfile, parseJdByJob } from "@/api/premiumApi";
import { matchResumeAndJD, getResume, getMatchAnalytics, parseJDText } from "@/api/parserApi";
import { isValidBackendJobId } from "@/utils/jobIdHelper";
import { writeJobmatchSessionSnapshot } from "@/utils/jobmatchSession";

// Error codes the backend returns with no usable `message` field (the generic
// exception handler falls back to "HTTP 404" etc. in that case) — map them to
// text a user can act on.
const FIX_RESUME_ERROR_MESSAGES: Record<string, string> = {
  jd_not_found: "This job's listing could not be matched — it may have expired. Please try again.",
  resume_not_found: "No resume found for matching. Please upload a resume to your profile first.",
  no_resume_in_profile: "No resume found on your profile. Please upload a resume first.",
  job_not_found: "This job listing could not be found. Please refresh the page and try again.",
  job_has_no_description: "This job listing has no description to match against.",
};

/**
 * runFixResumeForJob's calls span two API modules with different error shapes:
 * premiumApi.ts (parseResumeFromProfile/parseJdByJob) rethrows the raw Axios
 * error with `.response` intact, while parserApi.ts's safePost
 * (matchResumeAndJD, parseJDText, getMatchAnalytics) wraps failures into a
 * plain Error whose `.message` is the JSON-stringified backend envelope and
 * whose `__raw` carries the parsed envelope instead. Normalize both into one
 * user-facing message so the raw envelope is never shown in a toast.
 */
function resolveErrorEnvelope(err: unknown): unknown {
  const axiosData = (err as { response?: { data?: unknown } })?.response?.data;
  const rawData = (err as { __raw?: unknown })?.__raw;
  let envelope: unknown = axiosData ?? rawData;

  if (envelope === undefined && err instanceof Error) {
    try { envelope = JSON.parse(err.message); } catch { /* not JSON */ }
  }
  return envelope;
}

// Plain Errors thrown directly by runFixResumeForJob (e.g. "no description
// text to match against") have no JSON envelope — their message IS the
// user-facing text, so surface it instead of the generic fallback.
function extractPlainErrorMessage(err: unknown): string | undefined {
  if (err instanceof Error && err.message.trim() && !/^HTTP \d+$/i.test(err.message.trim())) {
    return err.message;
  }
  return undefined;
}

function extractEnvelopeMessage(envelope: Record<string, unknown>): string | undefined {
  const errorObj = (typeof envelope.error === "object" && envelope.error)
    ? (envelope.error as Record<string, unknown>)
    : undefined;
  const details = (typeof errorObj?.details === "object" && errorObj?.details)
    ? (errorObj.details as Record<string, unknown>)
    : undefined;

  const code = (details?.error as string | undefined) ?? (errorObj?.error_code as string | undefined);
  if (typeof code === "string" && FIX_RESUME_ERROR_MESSAGES[code]) {
    return FIX_RESUME_ERROR_MESSAGES[code];
  }

  const message = (errorObj?.message as string | undefined) ?? (envelope.message as string | undefined) ?? (envelope.detail as string | undefined);
  if (typeof message === "string" && message.trim() && !/^HTTP \d+$/i.test(message.trim())) {
    return message;
  }

  return undefined;
}

export function describeFixResumeError(err: unknown): string {
  const fallback = "Could not prepare your match analysis. Please try again.";
  const envelope = resolveErrorEnvelope(err);

  if (!envelope || typeof envelope !== "object") {
    return extractPlainErrorMessage(err) ?? fallback;
  }

  return extractEnvelopeMessage(envelope as Record<string, unknown>) ?? fallback;
}

// Runs the same free match pipeline the jobmatch page itself runs when a
// resume_id + jd_id are already known, then seeds its sessionStorage in the
// exact shape Overview.tsx expects (see its analyzeMatch()) so it renders
// results (with resume preview) directly instead of the upload wizard.
// Throws on failure — callers should catch and show describeFixResumeError(err).
export async function runFixResumeForJob(job: { id: string; title: string; company: string; description?: string }): Promise<void> {
  // parseJdByJob requires the backend to already have this job's JD
  // pre-indexed, which isn't true for every source (e.g. newer/less
  // common listings) — fall back to parsing the description text we
  // already have on the card, same as the manual "paste JD" wizard step.
  const resolveJdId = async (): Promise<string> => {
    // Aggregated listings often use a client-generated composite id that
    // parseJdByJob cannot accept. Skip that endpoint for those listings
    // and parse the JD text directly instead of rejecting the action.
    if (isValidBackendJobId(job.id)) {
      try {
        const byJob = await parseJdByJob(job.id);
        if (byJob.jd_id) return byJob.jd_id;
      } catch { /* fall through to text-based parse */ }
    }
    if (!job.description?.trim()) {
      throw new Error("This job has no description text to match against.");
    }
    const byText = await parseJDText(job.description);
    if (!byText.jd_id) throw new Error("Could not parse this job's description.");
    return byText.jd_id;
  };

  const [profileRes, jd_id] = await Promise.all([
    parseResumeFromProfile(),
    resolveJdId(),
  ]);

  const fullResumeData = await getResume(profileRes.resume_id).catch(() => null);

  // A freshly-created JD (from the parseJDText fallback above) can 404
  // with "jd_not_found" for a moment before the backend finishes making
  // it queryable — retry with backoff, same as Overview.tsx's analyzeMatch().
  let matchResp: Record<string, unknown> | undefined;
  let matchAttempt = 0;
  const maxMatchRetries = 2;
  while (matchAttempt <= maxMatchRetries) {
    try {
      matchResp = await matchResumeAndJD(profileRes.resume_id, jd_id) as Record<string, unknown>;
      break;
    } catch (matchErr) {
      matchAttempt++;
      if (matchAttempt > maxMatchRetries) throw matchErr;
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, matchAttempt - 1)));
    }
  }

  let finalMatchData = (matchResp?.data ?? matchResp) as Record<string, unknown>;
  try {
    const analytics = await getMatchAnalytics(profileRes.resume_id, jd_id);
    if (analytics) finalMatchData = { ...finalMatchData, analytics };
  } catch { /* optional enrichment */ }

  const newMatchResults = {
    data: finalMatchData,
    match_id: matchResp?.match_id ?? finalMatchData?.match_id,
    jd_id,
    duplicate: matchResp?.duplicate,
  };

  const snapshotWritten = writeJobmatchSessionSnapshot({
    matchResults: newMatchResults,
    parsedResumeData: fullResumeData,
    parsedJDData: null,
    jdText: job.description || `${job.title} at ${job.company}`,
  });
  if (!snapshotWritten) {
    throw new Error("Could not save your match results. Please try again.");
  }

  // Hard navigation, not router.push(): if /jobmatch/app was already
  // visited earlier this session, Next's client-side route cache can
  // reuse that mounted page instead of remounting it, which would skip
  // re-reading the sessionStorage we just seeded.
  window.location.href = "/jobmatch/app";
}
