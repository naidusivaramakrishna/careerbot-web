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
}

type JobListProps = {
  jobs: JobItem[];
  onBotClick: (job: JobItem) => void;
};

export default function JobList({ jobs, onBotClick }: JobListProps) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const visibleJobs = jobs.filter((job) => !removedIds.has(job.id));

  return (
    <div className="space-y-4">
      {visibleJobs.map((job) => (
        <JobCard
          key={job.id}
          {...job}
          onBotClick={() => onBotClick(job)}
          onRemove={() => setRemovedIds((prev) => new Set([...prev, job.id]))}
        />
      ))}
    </div>
  );
}
