import React, { memo } from 'react'
import { JobFormData, JobType, WorkMode } from '../../_types/jobFormTypes'

interface JobFormBasicFieldsProps {
    form: JobFormData
    onUpdate: <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => void
}

export const JobFormBasicFields = memo(({ form, onUpdate }: JobFormBasicFieldsProps) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-4">
            {/* Job Title */}
            <div className="flex flex-col gap-2">
                <label className="text-lg font-semibold">
                    Job Title <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={form.jobTitle}
                    onChange={(e) => onUpdate("jobTitle", e.target.value)}
                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                    placeholder="e.g. Senior Frontend Developer"
                />
            </div>

            {/* Company */}
            <div className="flex flex-col gap-2">
                <label className="text-lg font-semibold">
                    Company <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={form.company}
                    onChange={(e) => onUpdate("company", e.target.value)}
                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                    placeholder="e.g. Tech Corp"
                />
            </div>

            {/* Location */}
            <div className="flex flex-col gap-2">
                <label className="text-lg font-semibold">
                    Location <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={form.location}
                    onChange={(e) => onUpdate("location", e.target.value)}
                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                    placeholder="e.g. Bangalore"
                />
            </div>

            {/* Work Mode */}
            <div className="flex flex-col gap-2">
                <label className="text-lg font-semibold">Work Mode</label>
                <select
                    value={form.workMode}
                    onChange={(e) => onUpdate("workMode", e.target.value as WorkMode)}
                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on-site">On-site</option>
                </select>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-2 gap-5 col-span-2">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="text-lg font-semibold">
                            Salary Range (LPA) <span className="text-red-500">*</span>
                        </label>
                        <span className="text-xs text-gray-600">Min</span>
                    </div>
                    <input
                        type="number"
                        value={form.salaryMin}
                        onChange={(e) => onUpdate("salaryMin", e.target.value)}
                        className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                        placeholder="e.g. 6"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="text-lg opacity-0 select-none">.</label>
                        <span className="text-xs text-gray-600">Max</span>
                    </div>
                    <input
                        type="number"
                        value={form.salaryMax}
                        onChange={(e) => onUpdate("salaryMax", e.target.value)}
                        className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                        placeholder="e.g. 12"
                    />
                </div>
            </div>

            {/* Job Type */}
            <div className="flex flex-col gap-2">
                <label className="text-lg font-semibold">Job Type</label>
                <select
                    value={form.jobType}
                    onChange={(e) => onUpdate("jobType", e.target.value as JobType)}
                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                </select>
            </div>

            {/* Number of Openings */}
            <div className="flex flex-col gap-2">
                <label className="text-lg font-semibold">Number of Openings</label>
                <input
                    type="number"
                    value={form.openings}
                    onChange={(e) => onUpdate("openings", e.target.value)}
                    className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                    min="1"
                />
            </div>

            {/* Experience Range */}
            <div className="grid grid-cols-2 gap-5 col-span-2">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="text-lg font-semibold">Experience (Years)</label>
                        <span className="text-xs text-gray-600">Min</span>
                    </div>
                    <input
                        type="number"
                        value={form.experienceMin}
                        onChange={(e) => onUpdate("experienceMin", e.target.value)}
                        className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                        placeholder="0"
                        min="0"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="text-lg opacity-0 select-none">.</label>
                        <span className="text-xs text-gray-600">Max</span>
                    </div>
                    <input
                        type="number"
                        value={form.experienceMax}
                        onChange={(e) => onUpdate("experienceMax", e.target.value)}
                        className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm"
                        placeholder="5"
                        min="0"
                    />
                </div>
            </div>
        </div>
    )
})

JobFormBasicFields.displayName = 'JobFormBasicFields'