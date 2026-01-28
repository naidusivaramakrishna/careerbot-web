import React, { memo } from 'react'
import { HiOutlineLightBulb } from 'react-icons/hi2'

interface InsightBoxProps {
    insight: string
}

export const InsightBox = memo(({ insight }: InsightBoxProps) => {
    return (
        <div className="p-4 border border-[#E2E8F0] rounded-lg text-[#45556C] bg-[#F8FAFC] text-sm flex items-center gap-2 mt-4">
            <HiOutlineLightBulb className='w-5 h-5 flex-shrink-0' />
            <p>{insight}</p>
        </div>
    )
})

InsightBox.displayName = 'InsightBox'