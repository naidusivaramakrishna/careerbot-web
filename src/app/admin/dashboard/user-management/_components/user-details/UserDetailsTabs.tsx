import React, { memo } from 'react'

interface UserDetailsTabsProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

const TABS = ['Subscription', 'Resumes', 'Payments', 'Activity'] as const

export const UserDetailsTabs = memo(({ activeTab, onTabChange }: UserDetailsTabsProps) => {
    return (
        <div className="border-b border-gray-200 bg-[#ECECF0] my-4 p-1 flex items-center justify-evenly gap-6 text-sm rounded-lg">
            {TABS.map((tab) => (
                <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`font-medium w-full py-2 transition-all ${activeTab === tab
                            ? 'bg-white rounded-lg px-4'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {tab}
                </button>
            ))}
        </div>
    )
})

UserDetailsTabs.displayName = 'UserDetailsTabs'