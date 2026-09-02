"use client";

import { useState } from "react";
import JobCard from "../job-cards/JobCard";

interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  logo?: string;
  type: string;
  mode?: string;
  salary?: string;
  time: string;
  posted_date?: string | null;
  created_at?: string | null;
  education?: string;
  matchScore?: number;
  matchText?: string;
  url?: string;
  application_url?: string;
  recruiter_id?: string;
  source?: string;
  company_website?: string;
  skills?: string;
  experience?: string;
  experience_level?: string;
  description?: string;
  roleTrending?: boolean;
  highHiring?: boolean;
  is_applied?: boolean;
  matched_skills?: string[];
  missing_skills?: string[];
  match_band?: string;
  applicant_count?: number | string;
  h1b_sponsor?: boolean;
  remote?: boolean;
  requirements?: string[];
  responsibilities?: string;
}

type JobListProps = {
  jobs: JobItem[];
  onBotClick: (job: JobItem) => void;
  onApplyClick?: (job: JobItem) => void;
  onSaveToggle?: (jobId: string, saved: boolean) => void;
  // Permanent removal — only wired up on the Applied tab (see JobsContents),
  // where it actually deletes the underlying application record, unlike
  // allowDismiss below which never persists anything.
  onRemoveApplication?: (jobId: string) => void;
  // Fired when a job is quick-marked "Already Applied" from the card menu
  // (as opposed to the Apply Now → confirm-on-return flow, see onApplyClick),
  // so JobsContents can bump the Applied tab badge/list immediately.
  onAppliedToggle?: (jobId: string) => void;
  // "Not interested" only makes sense for Smart Match recommendations — and
  // even there it's a transient, session-only hide (see removedIds below),
  // never persisted. Saved/Applied entries are jobs the user deliberately
  // saved/applied to; showing the same dismiss control on those tabs let
  // users "remove" one, only to see it silently reappear the next time this
  // list re-fetched (every tab revisit), since nothing was ever persisted.
  // Defaults to false so any other caller doesn't opt into that trap.
  allowDismiss?: boolean;
};

export default function JobList({ jobs, onBotClick, onApplyClick, onSaveToggle, onRemoveApplication, onAppliedToggle, allowDismiss = false }: JobListProps) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const visibleJobs = jobs.filter((job) => !removedIds.has(job.id));

  return (
    <div className="space-y-4">
      {visibleJobs.map((job) => (
        <JobCard
          key={job.id}
          {...job}
          onBotClick={() => onBotClick(job)}
          onRemove={allowDismiss ? () => setRemovedIds((prev) => new Set([...prev, job.id])) : undefined}
          onApplyClick={() => onApplyClick?.(job)}
          onSaveToggle={(saved) => onSaveToggle?.(job.id, saved)}
          onRemoveApplication={onRemoveApplication ? () => onRemoveApplication(job.id) : undefined}
          onAppliedToggle={onAppliedToggle ? () => onAppliedToggle(job.id) : undefined}
        />
      ))}
    </div>
  );
}
