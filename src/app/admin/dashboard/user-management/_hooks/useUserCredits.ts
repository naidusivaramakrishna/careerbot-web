import { useCallback, useEffect, useRef, useState } from 'react'
import { getAdminUserCreditHistory, type AdminUserCreditBalance } from '@/api/adminCreditsApi'
import { logger } from '@/lib/logger'

/**
 * Loads a user's credit balance for the admin user-details panel.
 *
 * Source: top-level `balance` of GET /admin/quota/user/{id}/credit-history
 * (users collection — the balance deductions use). That endpoint is
 * SUPER_ADMIN only, so the fetch runs only when `enabled`.
 */
export const useUserCredits = (userId: string, enabled: boolean) => {
    const [balance, setBalance] = useState<AdminUserCreditBalance | null>(null)
    const [loading, setLoading] = useState(enabled)
    const [error, setError] = useState<string | null>(null)

    // Every fetch and every applyGrant takes a new version; a fetch commits only
    // if it is still the latest, so a slow initial balance can never overwrite
    // the authoritative result of a grant that landed after it was requested.
    const versionRef = useRef(0)
    useEffect(() => () => { versionRef.current++ }, [userId])

    const fetchBalance = useCallback(async () => {
        const version = ++versionRef.current
        setLoading(true)
        setError(null)
        try {
            const res = await getAdminUserCreditHistory(userId, 1, 1)
            if (version !== versionRef.current) return
            setBalance(res.balance)
        } catch (err) {
            if (version !== versionRef.current) return
            logger.error('Error fetching user credit balance:', err)
            setError('Credit balance unavailable')
        } finally {
            if (version === versionRef.current) setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        if (enabled) {
            fetchBalance()
        } else {
            setLoading(false)
        }
    }, [enabled, fetchBalance])

    /** A grant raises remaining to new_balance and total by credits_added. */
    const applyGrant = useCallback((newBalance: number, creditsAdded: number) => {
        ++versionRef.current
        setLoading(false)
        setBalance(prev => ({
            credits_remaining: newBalance,
            credits_total: prev?.credits_total != null ? prev.credits_total + creditsAdded : null,
        }))
        setError(null)
    }, [])

    return { balance, loading, error, fetchBalance, applyGrant }
}
