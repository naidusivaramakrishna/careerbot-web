import React, { memo } from 'react'
import { Search } from 'lucide-react'
import { BsFilterLeft } from 'react-icons/bs'
import Dropdown from '@/components/common/CustomDropdown'

interface UserListControlsProps {
    searchValue: string
    onSearchChange: (value: string) => void
    onRoleFilter: (value: string) => void
    onSubscriptionFilter: (value: string) => void
    onStatusFilter: (value: string) => void
    onToggleFilters: () => void
    activeFilterCount: number
}

const SUBSCRIPTION_MAP: Record<string, string> = {
    'Free': 'free',
    'Basic': 'basic',
    'Premium': 'premium',
    'Pro': 'pro',
    'Enterprise': 'enterprise'
}

const ROLE_MAP: Record<string, string> = {
    'User': 'user',
    'Admin': 'admin'
}

const STATUS_MAP: Record<string, string> = {
    'Active': 'active',
    'Inactive': 'inactive',
    'Suspended': 'suspended',
    'Pending Verification': 'pending_verification'
}

export const UserListControls = memo(({
    searchValue,
    onSearchChange,
    onRoleFilter,
    onSubscriptionFilter,
    onStatusFilter,
    onToggleFilters,
    activeFilterCount
}: UserListControlsProps) => {
    const handleRoleChange = (value: string) => {
        onRoleFilter(value === 'Role' || value === 'All' ? '' : ROLE_MAP[value])
    }

    const handleSubscriptionChange = (value: string) => {
        onSubscriptionFilter(value === 'Subscription' ? '' : SUBSCRIPTION_MAP[value])
    }

    const handleStatusChange = (value: string) => {
        onStatusFilter(value === 'Status' ? '' : STATUS_MAP[value])
    }

    return (
        <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="flex items-center bg-[#F3F3F5] text-sm p-2 rounded-md w-full sm:w-2/5 lg:w-3/5">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full outline-none bg-transparent ml-2"
                />
            </div>

            {/* Role Dropdown */}
            <Dropdown
                options={['Role', 'All', 'User', 'Admin']}
                defaultValue="Role"
                onChange={handleRoleChange}
                bgColor="bg-gray-100"
                bgOptions="bg-white"
                className="w-34"
            />

            {/* Subscription Dropdown */}
            <Dropdown
                options={['Subscription', 'Free', 'Basic', 'Premium', 'Pro', 'Enterprise']}
                defaultValue="Subscription"
                onChange={handleSubscriptionChange}
                bgColor="bg-gray-100"
                bgOptions="bg-white"
                className="w-34"
            />

            {/* Status Dropdown */}
            <Dropdown
                options={['Status', 'Active', 'Inactive', 'Suspended', 'Pending Verification']}
                defaultValue="Status"
                onChange={handleStatusChange}
                bgColor="bg-gray-100"
                bgOptions="bg-white"
                className="w-34"
            />

            {/* Advanced Filters Button */}
            <button
                onClick={onToggleFilters}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
            >
                <BsFilterLeft className="w-6 h-6" />
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
            </button>
        </div>
    )
})

UserListControls.displayName = 'UserListControls'
