import JobTracker from './_components/JobTracker';

export const metadata = {
  title: 'Application Tracker | CareerBot',
  description: 'Track and manage all your job applications in one place',
};

export default function TrackerPage() {
  return (
    <div className="w-full h-screen bg-white">
      <JobTracker />
    </div>
  );
}
