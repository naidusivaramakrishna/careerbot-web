import React, { memo } from 'react'
import { Phone, MapPin, Calendar, CreditCard } from 'lucide-react'
import type { UserDetailsResponse } from '@/api/userManagementApi'
import { UserStatusBadge } from '../user-management/UserBadges'

interface UserProfileSectionProps {
    user: UserDetailsResponse
    isEditing: boolean
    formatDate: (date: string | null) => string
}

export const UserProfileSection = memo(({
    user,
    isEditing,
    formatDate
}: UserProfileSectionProps) => {
    return (
        <div className="bg-gray-50 p-4 my-6 rounded-xl border border-[#00000066]/40">
            <div className="flex items-center justify-between my-4">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-[#155DFC] to-[#4F39F6] text-white w-16 h-16 flex items-center justify-center rounded-lg text-2xl font-bold">
                        {(user.full_name || user.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold">{user.full_name || user.username}</h3>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                    </div>
                </div>

                <UserStatusBadge status={user.status} />
            </div>

            {/* Info Row - Only show when not editing */}
            {!isEditing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm py-4 text-gray-700 my-4 border-t">
                    <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-500" />
                        {user.phone || '+91 1202294700'}
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-500" />
                        {user.location || 'India'}
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-500" />
                        Joined {formatDate(user.joined_at)}
                    </div>
                    <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-gray-500" />
                        <span className="capitalize">{user.subscription || 'Free'} Plan</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                        <span className="font-medium">Role:</span>
                        <span className="capitalize">{user.role}</span>
                    </div>
                </div>
            )}
        </div>
    )
})

UserProfileSection.displayName = 'UserProfileSection'
