import React, { memo } from 'react'
import { Activity, Database, Cpu, Server, HardDrive, LucideIcon } from 'lucide-react'
import type { HealthCard } from '@/api/adminMonitoringApi'

interface HealthCardsProps {
    healthCards: HealthCard[]
}

const iconMap: Record<HealthCard['icon'], LucideIcon> = {
    'activity': Activity,
    'database': Database,
    'cpu': Cpu,
    'server': Server,
    'disk': HardDrive
}

const statusStyles = {
    healthy: {
        bg: 'bg-[#DBEAFE]',
        text: 'text-[#3B82F6]',
        iconBg: 'bg-[#DBEAFE]',
        iconColor: 'text-[#3B82F6]'
    },
    warning: {
        bg: 'bg-[#FEF3C7]',
        text: 'text-[#F59E0B]',
        iconBg: 'bg-[#FEF3C7]',
        iconColor: 'text-[#F59E0B]'
    },
    critical: {
        bg: 'bg-[#FEE2E2]',
        text: 'text-[#EF4444]',
        iconBg: 'bg-[#FEE2E2]',
        iconColor: 'text-[#EF4444]'
    }
} as const

const HealthCardItem = memo(({ card }: { card: HealthCard }) => {
    const IconComponent = iconMap[card.icon] || Activity
    const styles = statusStyles[card.status_badge]

    return (
        <div className='bg-white rounded-lg p-4'>
            <div className='flex justify-between items-center'>
                <div className={`${styles.iconBg} rounded-lg w-10 h-10 flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${styles.iconColor}`} />
                </div>
                <div className={`text-sm py-1 px-4 ${styles.bg} ${styles.text} rounded-lg capitalize`}>
                    {card.status_badge}
                </div>
            </div>
            <div className='my-4'>
                <h1 className='text-[#64748B] text-sm'>{card.title}</h1>
                <h1 className=''>{card.status}</h1>
                <p className='text-[#64748B] text-sm mt-2'>
                    {card.metric_label}: {card.metric_value}
                </p>
            </div>
        </div>
    )
})

HealthCardItem.displayName = 'HealthCardItem'

export const HealthCards = memo(({ healthCards }: HealthCardsProps) => {
    return (
        <div className='grid grid-cols-3 gap-4 my-8'>
            {healthCards.map((card, idx) => (
                <HealthCardItem key={idx} card={card} />
            ))}
        </div>
    )
})

HealthCards.displayName = 'HealthCards'