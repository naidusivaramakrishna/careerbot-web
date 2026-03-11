import React, { memo } from 'react'
import { JobFormData, JobStatus } from '../../_types/jobFormTypes'

interface ApplicationSettingsProps {
    form: JobFormData
    onUpdate: <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => void
    getFieldError: (field: string) => string | undefined
    isEdit?: boolean
}

export const ApplicationSettings = memo(({ form, onUpdate, getFieldError, isEdit = false }: ApplicationSettingsProps) => {
    return (
        <div className="border border-[#00000033]/60 shadow-sm space-y-4 rounded-xl p-6 my-8">
            <h4 className="text-lg font-semibold">Application Settings</h4>

            <div className="mt-3 space-y-6">
                {/* Application URL */}
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-sm">Application URL</label>
                    <input
                        type="url"
                        value={form.applicationUrl}
                        onChange={(e) => onUpdate("applicationUrl", e.target.value)}
                        placeholder="https://..."
                        className={`w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm ${getFieldError('application_url') ? 'border-2 border-red-500' : ''}`}
                    />
                    {getFieldError('application_url') && (
                        <p className="text-xs text-red-600">{getFieldError('application_url')}</p>
                    )}
                </div>

                {/* Application Deadline */}
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-sm">Application Deadline</label>
                    <input
                        type="date"
                        value={form.applyBy}
                        onChange={(e) => onUpdate("applyBy", e.target.value)}
                        className={`w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm ${getFieldError('application_deadline') ? 'border-2 border-red-500' : ''}`}
                    />
                    {getFieldError('application_deadline') && (
                        <p className="text-xs text-red-600">{getFieldError('application_deadline')}</p>
                    )}
                </div>

                {/* Who Can Apply */}
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-sm">Who can apply</label>
                    <input
                        value={form.whoCanApply}
                        onChange={(e) => onUpdate("whoCanApply", e.target.value)}
                        placeholder="e.g. Graduates with 2+ years experience"
                        className={`w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm ${getFieldError('who_can_apply') ? 'border-2 border-red-500' : ''}`}
                    />
                    {getFieldError('who_can_apply') && (
                        <p className="text-xs text-red-600">{getFieldError('who_can_apply')}</p>
                    )}
                </div>

                {/* Status - Only show when editing */}
                {isEdit && (
                    <div className="flex flex-col gap-1">
                        <label className="font-semibold text-sm">Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => onUpdate("status", e.target.value as JobStatus)}
                            className={`w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm ${getFieldError('status') ? 'border-2 border-red-500' : ''}`}
                        >
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="expired">Expired</option>
                            <option value="closed">Closed</option>
                        </select>
                        {getFieldError('status') && (
                            <p className="text-xs text-red-600">{getFieldError('status')}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
})

ApplicationSettings.displayName = 'ApplicationSettings'
