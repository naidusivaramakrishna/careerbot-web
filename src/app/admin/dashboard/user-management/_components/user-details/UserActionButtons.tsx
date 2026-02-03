import React, { memo } from 'react'
import { SquarePen, Ban, Trash2, Check } from 'lucide-react'

interface UserActionButtonsProps {
    userStatus: string
    onEdit: () => void
    onSuspend: () => void
    onUnsuspend: () => void
    onDelete: () => void
    loading: boolean
}

export const UserActionButtons = memo(({
    userStatus,
    onEdit,
    onSuspend,
    onUnsuspend,
    onDelete,
    loading
}: UserActionButtonsProps) => {
    const isSuspended = userStatus.toLowerCase() === 'suspended'

    return (
        <div className="grid grid-cols-3 gap-4 my-4">
            <button
                onClick={onEdit}
                className="flex items-center justify-center cursor-pointer text-sm gap-2 p-2 rounded-lg text-white bg-[#155DFC] hover:bg-[#1348cc] transition-colors"
            >
                <SquarePen className="w-4 h-4" />
                <span>Edit User</span>
            </button>

            {isSuspended ? (
                <button
                    onClick={onUnsuspend}
                    disabled={loading}
                    className="flex items-center justify-center cursor-pointer text-sm gap-2 p-2 rounded-lg text-green-700 border border-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                >
                    <Check className="w-4 h-4" />
                    <span>Unsuspend</span>
                </button>
            ) : (
                <button
                    onClick={onSuspend}
                    className="flex items-center justify-center cursor-pointer text-sm gap-2 p-2 rounded-lg text-[#9E5559] border hover:bg-red-50 transition-colors"
                >
                    <Ban className="w-4 h-4" />
                    <span>Suspend</span>
                </button>
            )}

            <button
                onClick={onDelete}
                className="flex items-center justify-center cursor-pointer text-sm gap-2 p-2 rounded-lg text-[#E7000B] bg-[#FF5B5B33] hover:bg-[#FF5B5B55] transition-colors"
            >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
            </button>
        </div>
    )
})

UserActionButtons.displayName = 'UserActionButtons'
