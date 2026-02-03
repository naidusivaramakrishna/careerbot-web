import React, { memo } from 'react'
import { UserTableRow } from './UserTableRow'
import type { UserListItem } from '@/api/userManagementApi'

interface UsersTableProps {
    users: UserListItem[]
    loading: boolean
    onViewDetails: (user: UserListItem) => void
}

const TableHeader = memo(() => (
    <thead>
        <tr className="bg-[#7F78DF33] text-left text-gray-700">
            <th className="p-3 font-semibold">Name</th>
            <th className="p-3 font-semibold">Email</th>
            <th className="p-3 font-semibold">Role</th>
            <th className="p-3 font-semibold">Subscription</th>
            <th className="p-3 font-semibold">Status</th>
            <th className="p-3 font-semibold">Join Date</th>
            <th className="p-3 font-semibold">Actions</th>
        </tr>
    </thead>
))

TableHeader.displayName = 'TableHeader'

const LoadingState = memo(() => (
    <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Loading users...</p>
    </div>
))

LoadingState.displayName = 'LoadingState'

const EmptyState = memo(() => (
    <div className="text-center py-8 text-gray-500">
        No users found matching your filters.
    </div>
))

EmptyState.displayName = 'EmptyState'

export const UsersTable = memo(({ users, loading, onViewDetails }: UsersTableProps) => {
    if (loading) {
        return <LoadingState />
    }

    if (users.length === 0) {
        return <EmptyState />
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <TableHeader />
                <tbody className="border-t-0 border-2 border-[#E5E7EB]">
                    {users.map((user) => (
                        <UserTableRow
                            key={user.id}
                            user={user}
                            onViewDetails={onViewDetails}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    )
})

UsersTable.displayName = 'UsersTable'
