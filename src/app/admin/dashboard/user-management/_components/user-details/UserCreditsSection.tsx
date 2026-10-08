import React, { useCallback, useState } from 'react'
import { Coins, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addUserCredits, type AddCreditsRequest, type AddCreditsResponse } from '@/api/adminCreditsApi'
import { useUserCredits } from '../../_hooks/useUserCredits'
import { AddCreditsDialog } from './AddCreditsDialog'

interface UserCreditsSectionProps {
    userId: string
    userLabel: string
    /** True only for SUPER_ADMIN. UI hint only — the backend enforces 403. */
    canAddCredits: boolean
    /** Called after a successful grant (e.g. to refresh credit history). */
    onCreditsAdded?: (response: AddCreditsResponse) => void
}

export const UserCreditsSection: React.FC<UserCreditsSectionProps> = ({
    userId,
    userLabel,
    canAddCredits,
    onCreditsAdded,
}) => {
    const { balance, loading, error, applyGrant } = useUserCredits(userId, canAddCredits)
    const [dialogOpen, setDialogOpen] = useState(false)

    const handleSubmit = useCallback(
        (body: AddCreditsRequest, key: string) => addUserCredits(userId, body, key),
        [userId]
    )

    const handleSuccess = useCallback((res: AddCreditsResponse) => {
        applyGrant(res.new_balance, res.credits_added)
        setDialogOpen(false)
        if (res.partial_warning) {
            toast.warning(`Added ${res.credits_added} credits. New balance: ${res.new_balance}. ${res.partial_warning}`)
            onCreditsAdded?.(res)
            return
        }
        toast.success(
            res.idempotent_replay
                ? `This grant was already applied. Balance is ${res.new_balance}.`
                : `Added ${res.credits_added} credits. New balance: ${res.new_balance}.`
        )
        onCreditsAdded?.(res)
    }, [applyGrant, onCreditsAdded])

    const remaining = balance?.credits_remaining ?? null
    const total = balance?.credits_total ?? null

    return (
        <div className="flex items-center justify-between gap-3 border border-[#00000033]/40 rounded-lg p-3 text-sm mb-4">
            <div className="flex items-center gap-2" data-testid="user-credits-balance">
                <Coins size={16} className="text-gray-500" aria-hidden="true" />
                <span className="font-medium">Credits:</span>
                {!canAddCredits ? (
                    <span className="text-gray-500">Visible to super admins only</span>
                ) : loading ? (
                    <span className="text-gray-500">Loading…</span>
                ) : error ? (
                    <span className="text-gray-500">{error}</span>
                ) : (
                    <span>
                        {remaining ?? '—'} remaining / {total ?? '—'} total
                    </span>
                )}
            </div>
            {canAddCredits && (
                <button
                    type="button"
                    onClick={() => setDialogOpen(true)}
                    className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={14} aria-hidden="true" />
                    Add credits
                </button>
            )}
            {canAddCredits && dialogOpen && (
                <AddCreditsDialog
                    userLabel={userLabel}
                    currentBalance={remaining}
                    onSubmit={handleSubmit}
                    onSuccess={handleSuccess}
                    onClose={() => setDialogOpen(false)}
                />
            )}
        </div>
    )
}
