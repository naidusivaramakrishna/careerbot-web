import React, { memo, useState } from 'react'

interface SuspendDialogProps {
    onConfirm: (reason: string) => Promise<boolean>
    onCancel: () => void
    loading: boolean
}

export const SuspendDialog = memo(({ onConfirm, onCancel, loading }: SuspendDialogProps) => {
    const [reason, setReason] = useState('')

    const handleSubmit = async () => {
        if (reason.length < 10) {
            return
        }
        const success = await onConfirm(reason)
        if (success) {
            setReason('')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Suspend User</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Please provide a reason for suspending this user. The user will be notified.
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for suspension (minimum 10 characters)"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={4}
                />
                {reason.length > 0 && reason.length < 10 && (
                    <p className="text-xs text-red-500 mb-2">
                        Reason must be at least 10 characters ({reason.length}/10)
                    </p>
                )}
                <div className="flex gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || reason.length < 10}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                        Suspend
                    </button>
                    <button
                        onClick={() => {
                            onCancel()
                            setReason('')
                        }}
                        disabled={loading}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
})

SuspendDialog.displayName = 'SuspendDialog'

interface DeleteDialogProps {
    onConfirm: (reason: string, isPermanent: boolean, confirmed: boolean) => Promise<boolean>
    onCancel: () => void
    loading: boolean
}

export const DeleteDialog = memo(({ onConfirm, onCancel, loading }: DeleteDialogProps) => {
    const [reason, setReason] = useState('')
    const [isPermanent, setIsPermanent] = useState(false)
    const [confirmed, setConfirmed] = useState(false)

    const handleSubmit = async () => {
        if (reason.length < 10 || !confirmed) {
            return
        }
        const success = await onConfirm(reason, isPermanent, confirmed)
        if (success) {
            setReason('')
            setIsPermanent(false)
            setConfirmed(false)
        }
    }

    const handleCancel = () => {
        onCancel()
        setReason('')
        setIsPermanent(false)
        setConfirmed(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4 text-red-600">Delete User</h3>
                <p className="text-sm text-gray-600 mb-4">
                    This action cannot be undone. Please provide a reason and confirm deletion.
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for deletion (minimum 10 characters)"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                />
                {reason.length > 0 && reason.length < 10 && (
                    <p className="text-xs text-red-500 mb-2">
                        Reason must be at least 10 characters ({reason.length}/10)
                    </p>
                )}
                <div className="flex items-center gap-2 mb-4">
                    <input
                        type="checkbox"
                        checked={isPermanent}
                        onChange={(e) => setIsPermanent(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <label className="text-sm">Permanent deletion (cannot be recovered)</label>
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <label className="text-sm font-semibold">I confirm this deletion</label>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || reason.length < 10 || !confirmed}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                        {isPermanent ? 'Permanently Delete' : 'Delete'}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
})

DeleteDialog.displayName = 'DeleteDialog'
