import React, { memo } from 'react'
import { Eye, SquarePen, Trash2 } from 'lucide-react'
import { JobStatusBadge } from './JobStatusBadge'
import type { JobListItem } from '@/api/adminJobsApi'

interface JobTableRowProps {
    job: JobListItem
    onView: (job: JobListItem) => void
    onEdit: (job: JobListItem) => void
    onDelete: (jobId: string) => void
    formatDate: (date: string) => string
}

export const JobTableRow = memo(({
    job,
    onView,
    onEdit,
    onDelete,
    formatDate
}: JobTableRowProps) => {
    return (
        <tr className="border-b border-[#00000033]/70 last:border-none hover:bg-gray-50 transition-colors">
            <td className="p-3">{job.job_title}</td>
            <td className="p-3 text-gray-600">{job.company}</td>
            <td className="p-3">{job.location}</td>
            <td className="p-3">
                <JobStatusBadge status={job.status} />
            </td>
            <td className="p-3 text-gray-600 capitalize">{job.source}</td>
            <td className="p-3 text-gray-600">{job.views_count}</td>
            <td className="p-3 text-gray-600">{job.applications_count}</td>
            <td className="p-3 text-gray-600">{formatDate(job.posted_date)}</td>
            <td className="p-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onView(job)}
                        className="text-gray-700 hover:text-blue-600 transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEdit(job)}
                        className="text-gray-700 hover:text-blue-600 transition-colors"
                        title="Edit Job"
                    >
                        <SquarePen className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(job.id)}
                        className="text-[#E7000B] hover:text-red-700 transition-colors"
                        title="Delete Job"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    )
})

JobTableRow.displayName = 'JobTableRow'
