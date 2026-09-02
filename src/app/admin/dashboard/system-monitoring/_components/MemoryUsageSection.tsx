import React from 'react'
import { GiCpu } from 'react-icons/gi'
import { BsFire } from 'react-icons/bs'
import { ResourceUsageSection } from './ResourceUsageSection'
import type { MemoryUsageResponse } from '@/api/adminMonitoringApi'

interface MemoryUsageSectionProps {
    activeTab: string
    onTabChange: (tab: string) => void
    showComparison: boolean
    onComparisonChange: (show: boolean) => void
    metrics: MemoryUsageResponse | null
}

export const MemoryUsageSection = ({ activeTab, onTabChange, showComparison, onComparisonChange, metrics }: MemoryUsageSectionProps) => (
    <ResourceUsageSection
        title="Memory Usage"
        compareId="memory-compare"
        avgLabel="Memory Avg (7D)"
        peakLabel="Peak Memory"
        avgIcon={GiCpu}
        peakIcon={BsFire}
        strokeColor="#40B37C"
        tooltipLabel="Memory"
        metrics={metrics}
        activeTab={activeTab}
        onTabChange={onTabChange}
        showComparison={showComparison}
        onComparisonChange={onComparisonChange}
    />
)

MemoryUsageSection.displayName = 'MemoryUsageSection'
