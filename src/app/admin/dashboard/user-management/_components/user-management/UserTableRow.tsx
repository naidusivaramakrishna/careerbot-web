import React, { memo, useMemo } from 'react'
import { Eye } from 'lucide-react'
import { UserStatusBadge, SubscriptionBadge } from './UserBadges'
import type { UserListItem } from '@/api/userManagementApi'

interface UserTableRowProps {
    user: UserListItem
    onViewDetails: (user: UserListItem) => void
}

export const UserTableRow = memo(({ user, onViewDetails }: UserTableRowProps) => {
    const formattedDate = useMemo(() => {
        const date = new Date(user.created_at)
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-')
    }, [user.created_at])

    return (
        <tr className="border-b border-[#00000033]/70 last:border-none hover:bg-gray-50 transition-colors">
            <td className="p-3">{user.full_name || user.username}</td>
            <td className="p-3 text-gray-600">{user.email}</td>
            <td className="p-3 capitalize">{user.role}</td>
            <td className="p-3">
                <SubscriptionBadge subscription={user.subscription} />
            </td>
            <td className="p-3">
                <UserStatusBadge status={user.status} />
            </td>
            <td className="p-3 text-gray-600">{formattedDate}</td>
            <td className="p-3">
                <button
                    onClick={() => onViewDetails(user)}
                    className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                >
                    <Eye className="w-4 h-4" />
                    View
                </button>
            </td>
        </tr>
    )
})

UserTableRow.displayName = 'UserTableRow'