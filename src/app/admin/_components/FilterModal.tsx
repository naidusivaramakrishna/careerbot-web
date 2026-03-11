"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import Dropdown from "@/components/common/CustomDropdown";
import { JobListQueryParams } from "@/api/adminJobsApi";

type ErrorResponse = {
    response?: {
        data?: {
            error?: {
                message?: string
                details?: {
                    validation_errors?: Array<{ field?: string; message?: string }>
                }
            }
            detail?: string
        }
    }
}

interface FilterModalProps {
    open: boolean;
    onClose: () => void;
    onApply: (filters: JobListQueryParams) => Promise<void>;
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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    if (!open) return null;

    const getFieldError = (field: string): string | undefined => {
        return fieldErrors[field];
    };

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

    const handleApply = async () => {
        setFieldErrors({});
        try {
            // Call onApply - this will close the modal only if successful
            await onApply(filters);
        } catch (error: unknown) {
            const err = error as ErrorResponse;
            const validationErrors = err?.response?.data?.error?.details?.validation_errors;

            if (validationErrors && Array.isArray(validationErrors)) {
                const errors: Record<string, string> = {};
                validationErrors.forEach((validation: { field?: string; message?: string }) => {
                    // Extract field name from "query → salary_min" format
                    let fieldName = validation.field?.split('→').pop()?.trim() || validation.field;

                    // Map backend field names to frontend field names
                    if (fieldName === 'minimum_views') fieldName = 'min_views';
                    if (fieldName === 'minimum_applications') fieldName = 'min_applications';

                    if (fieldName && validation.message) {
                        errors[fieldName] = validation.message;
                    }
                });
                setFieldErrors(errors);
                // Don't re-throw - just keep modal open with errors displayed
                return;
            } else {
                // Fallback to detail message
                const errorDetail = err?.response?.data?.detail;
                if (errorDetail && typeof errorDetail === 'string') {
                    const fieldMatch = errorDetail.match(/^(\w+)\s/);
                    if (fieldMatch) {
                        const fieldName = fieldMatch[1];
                        setFieldErrors(prev => ({
                            ...prev,
                            [fieldName]: errorDetail
                        }));
                    }
                    // Don't re-throw - keep modal open
                    return;
                }
            }
            // If we couldn't handle the error, re-throw
            throw error;
        }
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
        setFieldErrors({});
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
                                    value={filters.salary_min ?? ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        salary_min: e.target.value !== '' ? Number(e.target.value) : undefined
                                    }))}
                                    className={`w-full p-2 bg-gray-100 rounded-md outline-none text-sm pr-10 ${getFieldError('salary_min') ? 'border-2 border-red-500' : ''}`}
                                    placeholder="0"
                                />
                                {getFieldError('salary_min') && (
                                    <p className="text-xs text-red-600 mt-1">{getFieldError('salary_min')}</p>
                                )}
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
                                    value={filters.salary_max ?? ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        salary_max: e.target.value !== '' ? Number(e.target.value) : undefined
                                    }))}
                                    className={`w-full p-2 bg-gray-100 rounded-md outline-none text-sm pr-10 ${getFieldError('salary_max') ? 'border-2 border-red-500' : ''}`}
                                    placeholder="0"
                                />
                                {getFieldError('salary_max') && (
                                    <p className="text-xs text-red-600 mt-1">{getFieldError('salary_max')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Min Views */}
                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-semibold">Minimum Views</label>
                        <div>
                            <input
                                type="number"
                                value={filters.min_views ?? ''}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    min_views: e.target.value !== '' ? Number(e.target.value) : undefined
                                }))}
                                className={`w-full p-2 bg-gray-100 rounded-md outline-none text-sm ${getFieldError('min_views') ? 'border-2 border-red-500' : ''}`}
                                placeholder="0"
                            />
                            {getFieldError('min_views') && (
                                <p className="text-xs text-red-600 mt-1">{getFieldError('min_views')}</p>
                            )}
                        </div>
                    </div>

                    {/* Min Applications */}
                    <div className="flex flex-col gap-2">
                        <label className="text-lg font-semibold">Minimum Applications</label>
                        <div>
                            <input
                                type="number"
                                value={filters.min_applications ?? ''}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    min_applications: e.target.value !== '' ? Number(e.target.value) : undefined
                                }))}
                                className={`w-full p-2 bg-gray-100 rounded-md outline-none text-sm ${getFieldError('min_applications') ? 'border-2 border-red-500' : ''}`}
                                placeholder="0"
                            />
                            {getFieldError('min_applications') && (
                                <p className="text-xs text-red-600 mt-1">{getFieldError('min_applications')}</p>
                            )}
                        </div>
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
                                    className={`w-full p-2 bg-gray-100 rounded-md text-sm outline-none ${getFieldError('posted_from') ? 'border-2 border-red-500' : ''}`}
                                />
                                {getFieldError('posted_from') && (
                                    <p className="text-xs text-red-600 mt-1">{getFieldError('posted_from')}</p>
                                )}
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
                                    className={`w-full p-2 bg-gray-100 rounded-md text-sm outline-none ${getFieldError('posted_to') ? 'border-2 border-red-500' : ''}`}
                                />
                                {getFieldError('posted_to') && (
                                    <p className="text-xs text-red-600 mt-1">{getFieldError('posted_to')}</p>
                                )}
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
