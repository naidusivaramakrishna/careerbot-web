
// import JobCard from "../job-cards/JobCard";

// export default function JobList({ jobs }: { jobs: any[] }) {

//   return (
//     <div className="space-y-4">
//       {jobs.map((job) => (
//         <JobCard
//   key={job.id}
//   id={job.id}           // ✅ ADD THIS
//   title={job.title}
//   company={job.company}
//   location={job.location}
//   logo={job.logo}
//   type={job.type}
//   salary={job.salary}
//   time={job.time}
//   matchScore={job.matchScore}
//   matchText={job.matchText}
// />
//       ))}
//     </div>
//   );
// }







// import JobCard from "../job-cards/JobCard";

// export default function JobList({ jobs }: { jobs: any[] }) {
//   return (
//     <div className="space-y-4">
//       {jobs.map((job) => (
//         <JobCard
//           key={job.id}
//           id={job.id}
//           title={job.title}
//           company={job.company}
//           location={job.location}
//           logo={job.logo}
//           type={job.type}
//           salary={job.salary}
//           time={job.time}
//           matchScore={job.matchScore}
//           matchText={job.matchText}
//           roleTrending={job.roleTrending}
//           highHiring={job.highHiring}
//         />
//       ))}
//     </div>
//   );
// }







// // app/jobs/_components/sidebar/JobList.tsx

// import JobCard from "../job-cards/JobCard";

// export default function JobList({ jobs, onBotClick }: { jobs: any[]; onBotClick: (job: any) => void }) {
//   return (
//     <div className="space-y-4">
//       {jobs.map((job) => (
//         <JobCard
//           key={job.id}
//           {...job}
//           onBotClick={() => onBotClick(job)}
//         />
//       ))}
//     </div>
//   );
// }
// 






"use client";

import { useEffect, useRef } from "react";
import JobCard from "../job-cards/JobCard";

type JobListProps = {
  jobs: any[];
  onBotClick: (job: any) => void;
  fetchMoreJobs: () => void;   // 👈 pagination function
  hasMore: boolean;           // 👈 more data available or not
  loading: boolean;           // 👈 loading state
};

export default function JobList({
  jobs,
  onBotClick,
  fetchMoreJobs,
  hasMore,
  loading,
}: JobListProps) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loading) return;
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMoreJobs(); // 🔥 infinite scroll trigger
        }
      },
      { threshold: 1 }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [fetchMoreJobs, hasMore, loading]);

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          {...job}
          onBotClick={() => onBotClick(job)}
        />
      ))}

      {/* 👇 Scroll trigger (UI change kaadu, invisible) */}
      <div ref={observerRef} />

      {/* 👇 Bottom loader (optional, minimal UI impact) */}
      {loading && (
        <p className="text-center text-sm text-gray-500">
          Loading more jobs...
        </p>
      )}
    </div>
  );
}
