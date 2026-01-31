import React, { memo } from 'react'
import { Download, ListFilter, Search } from 'lucide-react'
import Dropdown from '@/components/common/CustomDropdown'

interface JobListControlsProps {
    searchValue: string
    onSearchChange: (value: string) => void
    onSourceFilter: (value: string) => void
    onStatusFilter: (value: string) => void
    onFilterClick: () => void
    onExportClick: () => void
}

export const JobListControls = memo(({
    searchValue,
    onSearchChange,
    onSourceFilter,
    onStatusFilter,
    onFilterClick,
    onExportClick
}: JobListControlsProps) => {
    return (
        <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="flex items-center bg-[#F3F3F5] text-sm p-2 rounded-md w-full sm:w-2/5 lg:w-3/5">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search by title or company..."
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full outline-none bg-transparent ml-2"
                />
            </div>

            {/* Source Dropdown */}
            <Dropdown
                options={["Source", "All", "Admin", "Scraped"]}
                defaultValue="Source"
                bgColor="bg-gray-100"
                bgOptions="bg-white"
                onChange={onSourceFilter}
                className="w-34"
            />

            {/* Status Dropdown */}
            <Dropdown
                options={["Status", "All", "Active", "Draft", "Expired", "Closed"]}
                defaultValue="Status"
                bgColor="bg-gray-100"
                bgOptions="bg-white"
                onChange={onStatusFilter}
                className="w-34"
            />

            {/* Filter Button */}
            <button
                onClick={onFilterClick}
                className='bg-[#EFEFEF] border border-gray-200 flex items-center gap-2 py-2 px-4 rounded-lg text-sm cursor-pointer hover:bg-gray-200 transition-colors'
            >
                <ListFilter className='w-4 h-4' />
                Filter
            </button>

            {/* Export Button */}
            <button
                onClick={onExportClick}
                className='bg-white text-[#5E5EFF] font-semibold border border-[#5E5EFF] flex items-center gap-2 py-2 px-4 rounded-lg text-sm cursor-pointer hover:bg-[#5E5EFF] hover:text-white transition-colors'
            >
                <Download className='w-4 h-4' />
                Export
            </button>
        </div>
    )
})

JobListControls.displayName = 'JobListControls'
