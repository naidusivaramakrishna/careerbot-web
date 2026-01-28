import React, { memo } from 'react'
import { LucideIcon } from 'lucide-react'
import { IconType } from 'react-icons'

interface MetricCardProps {
    label: string
    value: string | number
    icon: LucideIcon | IconType
    growth?: number | null
}

export const MetricCard = memo(({ label, value, icon: Icon, growth }: MetricCardProps) => {
    return (
        <div className='bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex justify-between items-center'>
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <h2 className="mt-1">
                    {value}
                    {growth !== null && growth !== undefined && (
                        <span className={`text-xs ml-1 ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                        </span>
                    )}
                </h2>
            </div>
            <Icon className='w-5 h-5' />
        </div>
    )
})

MetricCard.displayName = 'MetricCard'