import React, { memo } from 'react'
import type { JobStatus } from '@/api/adminJobsApi'

interface JobStatusBadgeProps {
    status: JobStatus
}

const statusStyles = {
    active: 'text-[#008236] bg-[#DCFCE7]',
    expired: 'text-[#FE0004] bg-[#FFB0BA66]/40',
    closed: 'text-[#FF6B00] bg-[#FFE5CC]',
    draft: 'text-[#9A9A9A] bg-[#F3F3F3]'
} as const

export const JobStatusBadge = memo(({ status }: JobStatusBadgeProps) => {
    return (
        <span className={`px-2 py-1 text-xs rounded-md font-medium ${statusStyles[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    )
})

JobStatusBadge.displayName = 'JobStatusBadge'
