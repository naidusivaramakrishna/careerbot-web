'use client';

import { useState, useEffect } from 'react';
import { JobApplicationRecord, mockTrackerData } from '../_components/mockTrackerData';

type TabType = 'Applied' | 'Saved' | 'Interview' | 'Offer' | 'Rejected';

export function useJobTracker() {
  const [jobs, setJobs] = useState<JobApplicationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('Applied');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch jobs from mock data or API
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch('/api/v1/jobs/tracker/applications');
      // const data = await response.json();
      // setJobs(data.applications);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setJobs(mockTrackerData);
    } catch (error) {
      console.error('Failed to fetch job applications:', error);
      setJobs(mockTrackerData); // Fallback to mock data
    } finally {
      setIsLoading(false);
    }
  };

  const updateJobStatus = (jobId: string, newStatus: TabType) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, status: newStatus } : job
      )
    );

    // TODO: Sync with backend API when ready
    // await fetch(`/api/v1/jobs/tracker/${jobId}`, {
    //   method: 'PATCH',
    //   body: JSON.stringify({ status: newStatus }),
    // });
  };

  const updateJobNotes = (jobId: string, notes: string) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, notes } : job
      )
    );

    // TODO: Sync with backend API when ready
    // await fetch(`/api/v1/jobs/tracker/${jobId}`, {
    //   method: 'PATCH',
    //   body: JSON.stringify({ notes }),
    // });
  };

  const deleteJob = (jobId: string) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));

    // TODO: Sync with backend API when ready
    // await fetch(`/api/v1/jobs/tracker/${jobId}`, {
    //   method: 'DELETE',
    // });
  };

  const getJobsByStatus = (status: TabType): JobApplicationRecord[] => {
    return jobs.filter(job => job.status === status);
  };

  const getTabCounts = () => {
    const tabs: TabType[] = ['Applied', 'Saved', 'Interview', 'Offer', 'Rejected'];
    return tabs.reduce(
      (acc, tab) => {
        acc[tab] = jobs.filter(job => job.status === tab).length;
        return acc;
      },
      {} as Record<TabType, number>
    );
  };

  return {
    jobs,
    activeTab,
    setActiveTab,
    isLoading,
    filteredJobs: getJobsByStatus(activeTab),
    updateJobStatus,
    updateJobNotes,
    deleteJob,
    tabCounts: getTabCounts(),
    refetch: fetchJobs,
  };
}
