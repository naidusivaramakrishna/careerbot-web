export type JobPreferenceSignal =
  | "previewed"
  | "saved"
  | "unsaved"
  | "dismissed"
  | "applied"
  | "ai_used"
  | "tailored";

export interface PreferenceJob {
  id: string;
  title?: string;
  company?: string;
  location?: string;
  type?: string;
  mode?: string;
  skills?: string;
  source?: string;
  description?: string;
  url?: string;
  application_url?: string;
  created_at?: string | null;
  posted_date?: string | null;
  matchScore?: number;
}

interface StoredSignal {
  jobId: string;
  signal: JobPreferenceSignal;
  at: string;
  tokens: string[];
}

const KEY = "careerbotJobPreferenceSignals";
const MAX_SIGNALS = 200;

function scopedKey(userId?: string | null) {
  return userId ? `${KEY}:${userId}` : KEY;
}

function tokensFor(job: PreferenceJob): string[] {
  return Array.from(new Set(
    [job.title, job.company, job.location, job.type, job.mode, job.skills]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((token) => token.length > 2)
  )).slice(0, 24);
}

function readSignals(userId?: string | null): StoredSignal[] {
  if (typeof window === "undefined") return [];
  try {
    const value = localStorage.getItem(scopedKey(userId));
    return value ? JSON.parse(value) as StoredSignal[] : [];
  } catch {
    return [];
  }
}

export function recordJobPreferenceSignal(
  signal: JobPreferenceSignal,
  job: PreferenceJob,
  userId?: string | null
) {
  if (typeof window === "undefined") return;
  const signals = readSignals(userId);
  signals.push({ jobId: job.id, signal, at: new Date().toISOString(), tokens: tokensFor(job) });
  try {
    localStorage.setItem(scopedKey(userId), JSON.stringify(signals.slice(-MAX_SIGNALS)));
  } catch {
    // Preference learning is best-effort and must never block the jobs flow.
  }
}

const SIGNAL_WEIGHT: Record<JobPreferenceSignal, number> = {
  previewed: 1,
  saved: 5,
  unsaved: -3,
  dismissed: -8,
  applied: 8,
  ai_used: 3,
  tailored: 7,
};

export function getJobQualitySignal(job: PreferenceJob) {
  let score = 20;
  const reasons: string[] = [];
  if (job.company) score += 12;
  if (job.location) score += 8;
  if (job.description && job.description.replace(/<[^>]*>/g, "").trim().length >= 180) {
    score += 20;
    reasons.push("Detailed description");
  }
  if (job.url || job.application_url) {
    score += 15;
    reasons.push("Application link available");
  }
  if (job.source) {
    score += 10;
    reasons.push(`Source: ${job.source}`);
  }
  const date = job.posted_date || job.created_at;
  if (date) {
    const ageDays = (Date.now() - new Date(date).getTime()) / 86_400_000;
    if (Number.isFinite(ageDays) && ageDays <= 30) {
      score += 15;
      reasons.push("Recently posted");
    }
  }
  score = Math.min(100, score);
  return {
    score,
    label: score >= 75 ? "High confidence" : score >= 50 ? "Good confidence" : "Limited details",
    reasons: reasons.slice(0, 3),
  };
}

function dailyHash(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0) / 4294967295;
}

export function buildDailyShortlist<T extends PreferenceJob>(
  jobs: T[],
  userId?: string | null,
  limit = 5
): T[] {
  const signals = readSignals(userId);
  const tokenWeights = new Map<string, number>();
  const jobWeights = new Map<string, number>();

  signals.forEach((entry) => {
    const weight = SIGNAL_WEIGHT[entry.signal];
    jobWeights.set(entry.jobId, (jobWeights.get(entry.jobId) || 0) + weight);
    entry.tokens.forEach((token) => tokenWeights.set(token, (tokenWeights.get(token) || 0) + weight));
  });

  const day = new Date().toISOString().slice(0, 10);
  return [...jobs]
    .filter((job) => (job.matchScore || 0) >= 50 && (jobWeights.get(job.id) || 0) > -8)
    .map((job) => {
      const affinity = tokensFor(job).reduce((sum, token) => sum + (tokenWeights.get(token) || 0), 0);
      const quality = getJobQualitySignal(job).score;
      const score = (job.matchScore || 0) + Math.max(-15, Math.min(15, affinity / 4)) + quality * 0.12 + dailyHash(`${day}:${job.id}`);
      return { job, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ job }) => job);
}
