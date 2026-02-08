import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
    getJobList,
    getJobDetails,
    deleteJob,
    downloadJobsCSV,
    type JobListItem,
    type JobDetailsResponse,
    type JobListQueryParams
} from '@/api/adminJobsApi'
import { logger } from '@/lib/logger'

export const useJobManagement = () => {
    const [jobs, setJobs] = useState<JobListItem[]>([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        page: 1,
        page_size: 10,
        total: 0,
        total_pages: 0
    })

    const [filters, setFilters] = useState<JobListQueryParams>({
        page: 1,
        page_size: 10,
        search: '',
        status: undefined,
        source: undefined,
    })

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true)
            const response = await getJobList(filters)
            setJobs(response.jobs)
            setPagination({
                page: response.page,
                page_size: response.page_size,
                total: response.total,
                total_pages: response.total_pages
            })
        } catch (error) {
            logger.error('Error fetching jobs:', error)
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => {
        fetchJobs()
    }, [fetchJobs])

    const handleSearch = useCallback((value: string) => {
        setFilters(prev => ({ ...prev, search: value, page: 1 }))
    }, [])

    const handleSourceFilter = useCallback((value: string) => {
        if (value === 'Source' || value === 'All') {
            setFilters(prev => ({ ...prev, source: undefined, page: 1 }))
        } else {
            setFilters(prev => ({
                ...prev,
                source: value.toLowerCase() as 'admin' | 'scraped',
                page: 1
            }))
        }
    }, [])

    const handleStatusFilter = useCallback((value: string) => {
        if (value === 'Status' || value === 'All') {
            setFilters(prev => ({ ...prev, status: undefined, page: 1 }))
        } else {
            setFilters(prev => ({
                ...prev,
                status: value.toLowerCase() as 'active' | 'draft' | 'expired' | 'closed',
                page: 1
            }))
        }
    }, [])

    const handleApplyFilters = useCallback((advancedFilters: any) => {
        setFilters(prev => ({
            ...prev,
            ...advancedFilters,
            page: 1
        }))
    }, [])

    const handleResetFilters = useCallback(() => {
        setFilters({
            page: 1,
            page_size: 10,
            search: '',
            status: undefined,
            source: undefined,
        })
    }, [])

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({ ...prev, page }))
    }, [])

    const handleExport = useCallback(async () => {
        try {
            toast.loading('Exporting jobs...')
            await downloadJobsCSV({
                search: filters.search,
                status: filters.status,
                work_mode: filters.work_mode,
                job_type: filters.job_type
            }, `jobs_export_${new Date().toISOString().split('T')[0]}.csv`)
            toast.dismiss()
            toast.success('Jobs exported successfully!')
        } catch (error) {
            logger.error('Export error:', error)
            toast.dismiss()
            toast.error('Failed to export jobs')
        }
    }, [filters])

    const handleDeleteJob = useCallback(async (jobId: string) => {
        try {
            await deleteJob(jobId)
            toast.success('Job deleted successfully')
            fetchJobs()
        } catch (error) {
            logger.error('Delete error:', error)
            toast.error('Failed to delete job')
            throw error
        }
    }, [fetchJobs])

    const fetchJobDetails = useCallback(async (jobId: string): Promise<JobDetailsResponse> => {
        try {
            const jobDetails = await getJobDetails(jobId)
            return jobDetails
        } catch (error) {
            logger.error('Error fetching job details:', error)
            throw error
        }
    }, [])

    return {
        jobs,
        loading,
        pagination,
        filters,
        handleSearch,
        handleSourceFilter,
        handleStatusFilter,
        handleApplyFilters,
        handleResetFilters,
        handlePageChange,
        handleExport,
        handleDeleteJob,
        fetchJobDetails,
        fetchJobs
    }
}
