"use client";

import JobCard from "../job-cards/JobCard";

type JobListProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobs: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBotClick: (job: any) => void;
};

export default function JobList({ jobs, onBotClick }: JobListProps) {
  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <JobCard key={job.id} {...job} onBotClick={() => onBotClick(job)} />
      ))}
    </div>
  );
}
