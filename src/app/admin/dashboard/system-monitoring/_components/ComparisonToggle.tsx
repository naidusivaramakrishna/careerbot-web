import React, { memo } from 'react'

interface ComparisonToggleProps {
    id: string
    checked: boolean
    onChange: (checked: boolean) => void
}

export const ComparisonToggle = memo(({ id, checked, onChange }: ComparisonToggleProps) => {
    return (
        <div className='flex justify-end my-4'>
            <div className='flex gap-2'>
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <label htmlFor={id} className='text-sm cursor-pointer'>
                    Compare to previous period
                </label>
            </div>
        </div>
    )
})

ComparisonToggle.displayName = 'ComparisonToggle'