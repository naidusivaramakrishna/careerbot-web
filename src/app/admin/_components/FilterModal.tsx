"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import Dropdown from "@/components/common/CustomDropdown";
import { JobListQueryParams } from "@/api/adminJobsApi";

interface FilterModalProps {
    open: boolean;
    onClose: () => void;
    onApply: (filters: JobListQueryParams) => void;
    onReset: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
    open,
    onClose,
    onApply,
    onReset
}) => {
    const [filters, setFilters] = useState<JobListQueryParams>({
        work_mode: undefined,
        job_type: undefined,
        salary_min: undefined,
        salary_max: undefined,
        min_views: undefined,
        min_applications: undefined,
        posted_from: undefined,
        posted_to: undefined,
    });

    if (!open) return null;

    const handleWorkModeChange = (value: string) => {
        if (value === 'Work Mode' || value === 'All') {
            setFilters(prev => ({ ...prev, work_mode: undefined }));
        } else {
            setFilters(prev => ({
                ...prev,
                work_mode: value.toLowerCase() as 'remote' | 'hybrid' | 'on-site'
            }));
        }
    };

    const handleJobTypeChange = (value: string) => {
        if (value === 'Job Type' || value === 'All') {
            setFilters(prev => ({ ...prev, job_type: undefined }));
        } else {
            setFilters(prev => ({
                ...prev,
                job_type: value.toLowerCase() as 'full-time' | 'part-time' | 'internship' | 'contract'
            }));
        }
    };

    const handleApply = () => {
        onApply(filters);
    };

    const handleReset = () => {
        setFilters({
            work_mode: undefined,
            job_type: undefined,
            salary_min: undefined,
            salary_max: undefined,
            min_views: undefined,
            min_applications: undefined,
            posted_from: undefined,
            posted_to: undefined,
        });
        onReset();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl w-[90%] max-w-3xl p-6 shadow-lg animate-fadeIn relative">

                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-semibold text-xl">Advanced Filters</h2>
                    <X className="w-5 h-5 cursor-pointer" onClick={onClose} />
                </div>

                <p className="text-gray-600 text-sm mb-6">
                    Apply advanced filters to refine job listings.
                </p>

                {/* Grid Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Work Mode */}
                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-semibold">Work Mode</label>
                        <Dropdown
                            options={["Work Mode", "All", "Remote", "Hybrid", "On-site"]}
                            defaultValue={filters.work_mode
                                ? filters.work_mode.charAt(0).toUpperCase() + filters.work_mode.slice(1)
                                : "Work Mode"
                            }
                            bgColor="bg-gray-100"
                            bgOptions="bg-white"
                            onChange={handleWorkModeChange}
                            className="w-full"
                        />
                    </div>

                    {/* Job Type */}
                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-semibold">Job Type</label>
                        <Dropdown
                            options={["Job Type", "All", "Full-time", "Part-time", "Internship", "Contract"]}
                            defaultValue={filters.job_type
                                ? filters.job_type.split('-').map(word =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                ).join('-')
                                : "Job Type"
                            }
                            bgColor="bg-gray-100"
                            bgOptions="bg-white"
                            onChange={handleJobTypeChange}
                            className="w-full"
                        />
                    </div>

                    {/* Salary Range */}
                    <div className="grid grid-cols-2 gap-5 col-span-2">
                        {/* Salary Min */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-lg font-semibold">Salary Range (LPA)</label>
                                <span className="text-xs text-gray-600">Min</span>
                            </div>
                            <div>
                                <input
                                    type="number"
                                    value={filters.salary_min || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        salary_min: e.target.value ? Number(e.target.value) : undefined
                                    }))}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm pr-10"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Salary Max */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-lg opacity-0 select-none">.</label>
                                <span className="text-xs text-gray-600">Max</span>
                            </div>
                            <div>
                                <input
                                    type="number"
                                    value={filters.salary_max || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        salary_max: e.target.value ? Number(e.target.value) : undefined
                                    }))}
                                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm pr-10"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Min Views */}
                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-semibold">Minimum Views</label>
                        <input
                            type="number"
                            value={filters.min_views || ''}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                min_views: e.target.value ? Number(e.target.value) : undefined
                            }))}
                            className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                            placeholder="0"
                        />
                    </div>

                    {/* Min Applications */}
                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-semibold">Minimum Applications</label>
                        <input
                            type="number"
                            value={filters.min_applications || ''}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                min_applications: e.target.value ? Number(e.target.value) : undefined
                            }))}
                            className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                            placeholder="0"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-5 col-span-2">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-lg font-semibold">Date Range</label>
                                <span className="text-xs text-gray-600">from date</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={filters.posted_from || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        posted_from: e.target.value
                                    }))}
                                    className="w-full p-2 bg-gray-100 rounded-md text-sm outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-lg opacity-0 select-none">.</label>
                                <span className="text-xs text-gray-600">to date</span>
                            </div>
                            <div>
                                <input
                                    type="date"
                                    value={filters.posted_to || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        posted_to: e.target.value
                                    }))}
                                    className="w-full p-2 bg-gray-100 rounded-md text-sm outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 cursor-pointer rounded-md border border-black/80 bg-white text-sm text-[#9E5559]"
                    >
                        Reset All
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-5 py-2 cursor-pointer rounded-md bg-[#5E5EFF] text-white text-sm"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;
