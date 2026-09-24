import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getUserList, exportUsers, downloadExportedFile, type UserListItem } from '@/api/userManagementApi'
import { logger } from '@/lib/logger'
import { extractApiError } from '@/app/admin/_utils/apiError'

export interface UserFilters {
    search: string
    role: string
    subscription: string
    status: string
    created_from: string
    created_to: string
    sort_by: string
    sort_order: 'asc' | 'desc'
}

export const useUserManagement = () => {
    const [users, setUsers] = useState<UserListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalUsers, setTotalUsers] = useState(0)
    const [pageSize, setPageSize] = useState(10)

    const [filters, setFilters] = useState<UserFilters>({
        search: '',
        role: '',
        subscription: '',
        status: '',
        created_from: '',
        created_to: '',
        sort_by: 'created_at',
        sort_order: 'desc',
    })

    // Fetch users
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true)

            const params: Record<string, unknown> = {
                page: currentPage,
                page_size: pageSize,
            }

            // Add filters only if they have values
            if (filters.search) params.search = filters.search
            if (filters.role && filters.role !== 'All') params.role = filters.role.toLowerCase()
            if (filters.subscription) params.subscription = filters.subscription.toLowerCase()
            if (filters.status) params.status = filters.status.toLowerCase()
            if (filters.created_from) params.created_from = filters.created_from
            if (filters.created_to) params.created_to = filters.created_to
            if (filters.sort_by) params.sort_by = filters.sort_by
            if (filters.sort_order) params.sort_order = filters.sort_order

            const response = await getUserList(params)

            setUsers(response.users)
            setTotalPages(response.total_pages)
            setTotalUsers(response.total)
        } catch (error: unknown) {
            logger.error('Error fetching users:', error)
            toast.error(extractApiError(error, 'Failed to fetch users'))
        } finally {
            setLoading(false)
        }
    }, [currentPage, pageSize, filters])

    // Fetch users when page or filters change
    useEffect(() => {
        fetchUsers()
    }, [currentPage, pageSize, filters.role, filters.subscription, filters.status, filters.created_from, filters.created_to, filters.sort_by, filters.sort_order, fetchUsers])

    // Handle search with debounce and reset to page 1
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            setCurrentPage(1)
        }, 500)

        return () => clearTimeout(debounceTimer)
    }, [filters.search])

    // Handle filter change
    const handleFilterChange = useCallback((key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key as keyof UserFilters]: value }))
        setCurrentPage(1)
    }, [])

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters({
            search: '',
            role: '',
            subscription: '',
            status: '',
            created_from: '',
            created_to: '',
            sort_by: 'created_at',
            sort_order: 'desc',
        })
        setCurrentPage(1)
    }, [])

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    // Handle page size change
    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size)
        setCurrentPage(1)
    }, [])

    // Handle export
    const handleExport = useCallback(async (format: 'csv' | 'xlsx') => {
        try {
            const toastId = toast.loading('Preparing export...')

            // Get total count to warn user if over 10000 rows
            const countParams: Record<string, unknown> = {
                page: 1,
                page_size: 1,
            }
            if (filters.search) countParams.search = filters.search
            if (filters.role && filters.role !== 'All') countParams.role = filters.role.toLowerCase()
            if (filters.subscription) countParams.subscription = filters.subscription.toLowerCase()
            if (filters.status) countParams.status = filters.status.toLowerCase()
            if (filters.created_from) countParams.created_from = filters.created_from
            if (filters.created_to) countParams.created_to = filters.created_to

            const countResponse = await getUserList(countParams)
            const totalToExport = countResponse.total

            // Warn user if export is large (backend may have limits)
            if (totalToExport > 10000) {
                toast.dismiss(toastId)
                toast.error(`Export limited to 10,000 rows. Found ${totalToExport.toLocaleString()} total users. Please refine filters.`)
                return
            }

            // Use pagination to fetch all users (max 100 per page)
            const pageSize = 100
            const totalPages = Math.ceil(totalToExport / pageSize)

            const exportParams: Record<string, unknown> = {
                page: 1,
                page_size: pageSize,
            }

            // Add current filters to export
            if (filters.search) exportParams.search = filters.search
            if (filters.role && filters.role !== 'All') exportParams.role = filters.role.toLowerCase()
            if (filters.subscription) exportParams.subscription = filters.subscription.toLowerCase()
            if (filters.status) exportParams.status = filters.status.toLowerCase()
            if (filters.created_from) exportParams.created_from = filters.created_from
            if (filters.created_to) exportParams.created_to = filters.created_to

            // For now, export first page (backend should support full export)
            // TODO: When backend supports streaming/full export, fetch all pages
            const blob = await exportUsers(exportParams, format)
            downloadExportedFile(blob, format)

            toast.dismiss(toastId)
            if (totalPages > 1) {
                toast.warning(`Export contains page 1 of ${totalPages}. Export ${totalToExport} rows via backend streaming.`)
            } else {
                toast.success(`Users exported as ${format.toUpperCase()}`)
            }
        } catch (error) {
            toast.dismiss()
            toast.error('Failed to export users')
            logger.error('Export error:', error)
        }
    }, [filters])

    // Get active filter count
    const getActiveFilterCount = useCallback(() => {
        let count = 0
        if (filters.search) count++
        if (filters.role && filters.role !== 'All') count++
        if (filters.subscription) count++
        if (filters.status) count++
        if (filters.created_from) count++
        if (filters.created_to) count++
        return count
    }, [filters])

    return {
        users,
        loading,
        currentPage,
        totalPages,
        totalUsers,
        pageSize,
        filters,
        handleFilterChange,
        clearFilters,
        handlePageChange,
        handlePageSizeChange,
        handleExport,
        getActiveFilterCount,
        fetchUsers
    }
}
