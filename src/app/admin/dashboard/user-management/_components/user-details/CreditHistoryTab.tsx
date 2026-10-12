import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Coins } from 'lucide-react'
import { getAdminUserCreditHistory, type AdminCreditHistoryResponse } from '@/api/adminCreditsApi'
import { adminCreditTypeLabel, formatCreditDate, formatSignedCredits, totalPagesOf } from '@/lib/creditHistory'
import { extractApiError } from '@/app/admin/_utils/apiError'
import { logger } from '@/lib/logger'

const PAGE_SIZE = 20

interface CreditHistoryTabProps {
    userId: string
    /** Bump to force a reload (e.g. after a grant). */
    refreshKey?: number
}

export const CreditHistoryTab: React.FC<CreditHistoryTabProps> = ({ userId, refreshKey = 0 }) => {
    const [page, setPage] = useState(1)
    const [data, setData] = useState<AdminCreditHistoryResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Request sequence: only the newest request may commit data / clear loading,
    // so a slow earlier page can never overwrite a newer one.
    const seqRef = useRef(0)
    useEffect(() => () => { seqRef.current++ }, [userId])

    const load = useCallback(async (p: number) => {
        const seq = ++seqRef.current
        setLoading(true)
        setError(null)
        try {
            const res = await getAdminUserCreditHistory(userId, p, PAGE_SIZE)
            if (seq !== seqRef.current) return
            setData(res)
        } catch (err) {
            if (seq !== seqRef.current) return
            logger.error('Error fetching credit history:', err)
            const status = (err as { response?: { status?: number } })?.response?.status
            setError(status === 403
                ? 'Only a super admin can view credit history.'
                : extractApiError(err, 'Failed to load credit history'))
        } finally {
            if (seq === seqRef.current) setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        load(page)
    }, [load, page, refreshKey])

    const totalPages = data ? totalPagesOf(data.total, data.page_size) : 1

    return (
        <div className="border border-[#00000033]/40 bg-gray-50 p-4 rounded-lg text-sm">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                    <Coins size={16} aria-hidden="true" /> Credit history
                </h4>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            aria-label="Previous credit history page"
                            className="p-1 rounded hover:bg-white disabled:opacity-35"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs text-gray-500">{page}/{totalPages}</span>
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                            aria-label="Next credit history page"
                            className="p-1 rounded hover:bg-white disabled:opacity-35"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>

            {loading && !data ? (
                <p className="text-gray-500 text-center py-4" role="status">Loading credit history…</p>
            ) : error ? (
                <div className="text-center py-4">
                    <p role="alert" className="text-red-600">{error}</p>
                    <button type="button" onClick={() => load(page)} className="mt-2 text-blue-600 hover:underline">
                        Retry
                    </button>
                </div>
            ) : !data || data.items.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No credit history</p>
            ) : (
                <ul className="divide-y divide-gray-300">
                    {data.items.map((item) => (
                        <li key={item.id} className="py-2" data-testid="admin-credit-history-row">
                            <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold text-black">
                                        {adminCreditTypeLabel(item.type)}
                                        {item.feature && (
                                            <span className="font-normal text-gray-500"> · {item.feature.replace(/_/g, ' ')}</span>
                                        )}
                                    </p>
                                    <p className="text-gray-500 text-xs">{formatCreditDate(item.created_at)}</p>
                                    {(item.admin_email || item.admin_id) && (
                                        <p className="text-gray-500 text-xs">By {item.admin_email || item.admin_id}</p>
                                    )}
                                    {item.reason && (
                                        <p className="text-gray-700 text-xs break-words">Reason: {item.reason}</p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`font-semibold ${item.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                        {formatSignedCredits(item.amount)}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        Balance {item.balance_after ?? '—'}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
