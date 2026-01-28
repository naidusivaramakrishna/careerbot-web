import React, { memo, useMemo } from 'react'
import { JobTableRow } from './JobTableRow'
import type { JobListItem } from '@/api/adminJobsApi'

interface JobsTableProps {
    jobs: JobListItem[]
    loading: boolean
    onView: (job: JobListItem) => void
    onEdit: (job: JobListItem) => void
    onDelete: (jobId: string) => void
}

const TableHeader = memo(() => (
    <thead>
        <tr className="bg-[#7F78DF33] text-left text-gray-700">
            <th className="p-3 font-semibold">Job Title</th>
            <th className="p-3 font-semibold">Company</th>
            <th className="p-3 font-semibold">Location</th>
            <th className="p-3 font-semibold">Status</th>
            <th className="p-3 font-semibold">Source</th>
            <th className="p-3 font-semibold">Views</th>
            <th className="p-3 font-semibold">Applications</th>
            <th className="p-3 font-semibold">Posted Date</th>
            <th className="p-3 font-semibold">Actions</th>
        </tr>
    </thead>
))

TableHeader.displayName = 'TableHeader'

const LoadingState = memo(() => (
    <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E5EFF]"></div>
        <p className="mt-2 text-gray-500">Loading jobs...</p>
    </div>
))

LoadingState.displayName = 'LoadingState'

const EmptyState = memo(() => (
    <div className="text-center py-12">
        <p className="text-gray-500">No jobs found</p>
    </div>
))

EmptyState.displayName = 'EmptyState'

export const JobsTable = memo(({
    jobs,
    loading,
    onView,
    onEdit,
    onDelete
}: JobsTableProps) => {
    const formatDate = useMemo(() => {
        return (dateString: string) => {
            return new Date(dateString).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        }
    }, [])

    if (loading) {
        return <LoadingState />
    }

    if (jobs.length === 0) {
        return <EmptyState />
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <TableHeader />
                <tbody className="border-t-0 border-2 border-[#E5E7EB]">
                    {jobs.map((job) => (
                        <JobTableRow
                            key={job.id}
                            job={job}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            formatDate={formatDate}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    )
})

JobsTable.displayName = 'JobsTable'