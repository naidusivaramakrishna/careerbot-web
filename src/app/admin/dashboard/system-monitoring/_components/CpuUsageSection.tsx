import React from 'react'
import { BsCpuFill, BsFire } from 'react-icons/bs'
import { ResourceUsageSection } from './ResourceUsageSection'
import type { CpuUsageResponse } from '@/api/adminMonitoringApi'

interface CpuUsageSectionProps {
    activeTab: string
    onTabChange: (tab: string) => void
    showComparison: boolean
    onComparisonChange: (show: boolean) => void
    metrics: CpuUsageResponse | null
}

export const CpuUsageSection = ({ activeTab, onTabChange, showComparison, onComparisonChange, metrics }: CpuUsageSectionProps) => (
    <ResourceUsageSection
        title="CPU Usage"
        compareId="cpu-compare"
        avgLabel="CPU Avg (7D)"
        peakLabel="Peak CPU"
        avgIcon={BsCpuFill}
        peakIcon={BsFire}
        strokeColor="#FF9D3A"
        tooltipLabel="CPU"
        metrics={metrics}
        activeTab={activeTab}
        onTabChange={onTabChange}
        showComparison={showComparison}
        onComparisonChange={onComparisonChange}
    />
)

CpuUsageSection.displayName = 'CpuUsageSection'
