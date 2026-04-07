'use client';

import { useState } from 'react';
import { ChevronDown, Trash2, ExternalLink } from 'lucide-react';
import { useJobTracker } from '../_hooks/useJobTracker';
import { JobApplicationRecord } from './mockTrackerData';

type TabType = 'Applied' | 'Saved' | 'Interview' | 'Offer' | 'Rejected';

const TAB_COLORS: Record<TabType, { bg: string; text: string; badge: string }> = {
  Applied: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  Saved: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  Interview: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  Offer: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  Rejected: { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' },
};

export default function JobTracker() {
  const { activeTab, setActiveTab, isLoading, filteredJobs, updateJobStatus, updateJobNotes, deleteJob, tabCounts } =
    useJobTracker();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const tabs: TabType[] = ['Applied', 'Saved', 'Interview', 'Offer', 'Rejected'];

  const handleStatusChange = (jobId: string, newStatus: TabType) => {
    updateJobStatus(jobId, newStatus);
  };

  const handleNotesChange = (jobId: string, notes: string) => {
    setEditingNotes(prev => ({ ...prev, [jobId]: notes }));
    updateJobNotes(jobId, notes);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">Application Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all your job applications and opportunities</p>
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-6 pt-4 pb-0">
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${
                activeTab === tab
                  ? `border-blue-600 text-blue-600`
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-gray-100 text-gray-700">
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading applications...</div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p className="text-sm">No applications in {activeTab.toLowerCase()}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isExpanded={expandedJobId === job.id}
                onToggleExpand={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                onStatusChange={handleStatusChange}
                onNotesChange={handleNotesChange}
                onDelete={deleteJob}
                editingNotes={editingNotes[job.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface JobCardProps {
  job: JobApplicationRecord;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (jobId: string, status: TabType) => void;
  onNotesChange: (jobId: string, notes: string) => void;
  onDelete: (jobId: string) => void;
  editingNotes?: string;
}

function JobCard({
  job,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  onNotesChange,
  onDelete,
  editingNotes,
}: JobCardProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const colors = TAB_COLORS[job.status];
  const tabs: TabType[] = ['Applied', 'Saved', 'Interview', 'Offer', 'Rejected'];

  return (
    <div className="border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow duration-150">
      {/* Job Card Header */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <h3 className="font-medium text-gray-900 text-sm">{job.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{job.company}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded font-medium ${colors.badge}`}>{job.status}</span>
            <span className="text-xs text-gray-500">{job.appliedDate ? new Date(job.appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ChevronDown
            size={18}
            className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
          {/* Status Dropdown */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
            <button
              type="button"
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className={`w-full px-3 py-2 text-sm rounded border border-gray-200 text-gray-900 bg-white hover:bg-gray-50 flex items-center justify-between transition-colors`}
            >
              <span>{job.status}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
            </button>

            {isStatusOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-sm z-10">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      onStatusChange(job.id, tab);
                      setIsStatusOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      job.status === tab ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
            <textarea
              value={editingNotes ?? job.notes}
              onChange={e => onNotesChange(job.id, e.target.value)}
              placeholder="Add your notes here..."
              className="w-full text-sm px-3 py-2 rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
            {job.jobUrl && (
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View job <ExternalLink size={12} />
              </a>
            )}
            <button
              type="button"
              onClick={() => onDelete(job.id)}
              className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 ml-auto"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
