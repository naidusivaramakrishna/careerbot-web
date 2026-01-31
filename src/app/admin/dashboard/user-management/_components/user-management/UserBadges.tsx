import React, { memo } from 'react'

interface UserStatusBadgeProps {
    status: string
}

interface SubscriptionBadgeProps {
    subscription: string | null
}

const statusStyles = {
    active: 'text-[#008236] bg-[#DCFCE7]',
    inactive: 'text-[#364153] bg-[#E4E4E499]/60',
    suspended: 'text-[#BA1219] bg-[#FF9C9C66]/40',
    pending_verification: 'text-[#F59E0B] bg-[#FEF3C7]'
} as const

const subscriptionStyles = {
    pro: 'text-pink-600 underline decoration-pink-500',
    basic: 'text-green-600 underline decoration-green-500',
    enterprise: 'text-red-600 underline decoration-red-500',
    premium: 'text-purple-600 underline decoration-purple-500',
    free: 'text-blue-600 underline decoration-blue-500'
} as const

export const UserStatusBadge = memo(({ status }: UserStatusBadgeProps) => {
    const normalizedStatus = status.toLowerCase() as keyof typeof statusStyles
    const style = statusStyles[normalizedStatus] || statusStyles.active

    return (
        <span className={`px-2 py-1 text-xs rounded-md font-medium capitalize ${style}`}>
            {status.replace('_', ' ')}
        </span>
    )
})

UserStatusBadge.displayName = 'UserStatusBadge'

export const SubscriptionBadge = memo(({ subscription }: SubscriptionBadgeProps) => {
    const plan = (subscription || 'free').toLowerCase() as keyof typeof subscriptionStyles
    const style = subscriptionStyles[plan] || subscriptionStyles.free

    return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${style}`}>
            {subscription || 'Free'}
        </span>
    )
})

SubscriptionBadge.displayName = 'SubscriptionBadge'
