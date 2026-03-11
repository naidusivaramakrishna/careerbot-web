import React, { memo } from 'react'
import { JobFormData } from '../../_types/jobFormTypes'

interface JobFormTextFieldsProps {
    form: JobFormData
    onUpdate: <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => void
    getFieldError: (field: string) => string | undefined
}

export const JobFormTextFields = memo(({ form, onUpdate, getFieldError }: JobFormTextFieldsProps) => {
    return (
        <>
            {/* Job Description */}
            <div className="flex flex-col gap-2">
                <label className="text-lg font-semibold">
                    Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={form.jobDescription}
                    onChange={(e) => onUpdate("jobDescription", e.target.value)}
                    rows={6}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    className={`w-full p-2 bg-gray-100 rounded-md outline-none text-sm resize-none ${getFieldError('job_description') ? 'border-2 border-red-500' : ''}`}
                />
                {getFieldError('job_description') && (
                    <p className="text-xs text-red-600">{getFieldError('job_description')}</p>
                )}
            </div>

            {/* About Company */}
            <div className="flex flex-col gap-2">
                <label className="text-lg font-semibold">About Company</label>
                <textarea
                    value={form.aboutCompany}
                    onChange={(e) => onUpdate("aboutCompany", e.target.value)}
                    rows={3}
                    placeholder="Explain briefly about your company..."
                    className={`w-full p-2 bg-gray-100 rounded-md outline-none text-sm resize-none ${getFieldError('about_company') ? 'border-2 border-red-500' : ''}`}
                />
                {getFieldError('about_company') && (
                    <p className="text-xs text-red-600">{getFieldError('about_company')}</p>
                )}
            </div>
        </>
    )
})

JobFormTextFields.displayName = 'JobFormTextFields'
