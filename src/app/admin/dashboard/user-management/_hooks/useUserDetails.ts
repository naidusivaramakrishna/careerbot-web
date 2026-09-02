import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
    getUserDetails,
    getUserActivity,
    updateUser,
    deleteUser,
    suspendUser,
    unsuspendUser,
    type UserDetailsResponse,
    type UserActivityLog
} from '@/api/userManagementApi'
import { logger } from '@/lib/logger'
import { extractApiError } from '@/app/admin/_utils/apiError'

export const useUserDetails = (userId: string) => {
    const [user, setUser] = useState<UserDetailsResponse | null>(null)
    const [activities, setActivities] = useState<UserActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('Subscription')

    // Fetch user details
    const fetchUserDetails = useCallback(async () => {
        try {
            setLoading(true)
            const details = await getUserDetails(userId)
            setUser(details)
        } catch (error: unknown) {
            logger.error('Error fetching user details:', error)
            toast.error(extractApiError(error, 'Failed to load user details'))
        } finally {
            setLoading(false)
        }
    }, [userId])

    // Fetch activity
    const fetchUserActivity = useCallback(async () => {
        try {
            const response = await getUserActivity(userId, {
                page: 1,
                page_size: 100,
            })
            setActivities(response.events || [])
        } catch (error) {
            logger.error('Error fetching user activity:', error)
        }
    }, [userId])

    // Initial fetch
    useEffect(() => {
        fetchUserDetails()
    }, [fetchUserDetails])

    // Fetch activity when the Activity tab is opened.
    // Intentionally independent of the user-details fetch: fetchUserActivity only
    // needs userId (not the loaded user object), so activity loads even if user
    // details are still in flight. Dep changed from user→userId to avoid re-fetching
    // on every user-object identity change.
    useEffect(() => {
        if (activeTab === 'Activity') {
            fetchUserActivity()
        }
    }, [activeTab, userId, fetchUserActivity])

    // Update user
    const handleUpdateUser = useCallback(async (data: Record<string, unknown>) => {
        try {
            setActionLoading(true)
            await updateUser(userId, data)
            toast.success('User updated successfully')
            await fetchUserDetails()
            return true
        } catch (error: unknown) {
            logger.error('Error updating user:', error)
            toast.error(extractApiError(error, 'Failed to update user'))
            return false
        } finally {
            setActionLoading(false)
        }
    }, [userId, fetchUserDetails])

    // Suspend user
    const handleSuspendUser = useCallback(async (reason: string) => {
        try {
            setActionLoading(true)
            await suspendUser(userId, {
                reason,
                notify_user: true,
            })
            toast.success('User suspended successfully')
            await fetchUserDetails()
            return true
        } catch (error: unknown) {
            logger.error('Error suspending user:', error)
            toast.error(extractApiError(error, 'Failed to suspend user'))
            return false
        } finally {
            setActionLoading(false)
        }
    }, [userId, fetchUserDetails])

    // Unsuspend user
    const handleUnsuspendUser = useCallback(async () => {
        try {
            setActionLoading(true)
            await unsuspendUser(userId)
            toast.success('User unsuspended successfully')
            await fetchUserDetails()
        } catch (error: unknown) {
            logger.error('Error unsuspending user:', error)
            toast.error(extractApiError(error, 'Failed to unsuspend user'))
        } finally {
            setActionLoading(false)
        }
    }, [userId, fetchUserDetails])

    // Delete user
    const handleDeleteUser = useCallback(async (
        reason: string,
        isPermanent: boolean,
        confirmed: boolean
    ) => {
        try {
            setActionLoading(true)
            await deleteUser(
                userId,
                {
                    reason,
                    confirm: confirmed,
                },
                isPermanent
            )
            toast.success(`User ${isPermanent ? 'permanently deleted' : 'deleted'} successfully`)
            return true
        } catch (error: unknown) {
            logger.error('Error deleting user:', error)
            toast.error(extractApiError(error, 'Failed to delete user'))
            return false
        } finally {
            setActionLoading(false)
        }
    }, [userId])

    return {
        user,
        activities,
        loading,
        actionLoading,
        activeTab,
        setActiveTab,
        handleUpdateUser,
        handleSuspendUser,
        handleUnsuspendUser,
        handleDeleteUser,
        fetchUserDetails
    }
}
