import React, { memo } from 'react'
import { JobFormData } from '../../_types/jobFormTypes'

interface ApplicationSettingsProps {
    form: JobFormData
    onUpdate: <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => void
}

export const ApplicationSettings = memo(({ form, onUpdate }: ApplicationSettingsProps) => {
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
                        className="w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm"
                    />
                </div>

                {/* Application Deadline */}
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-sm">Application Deadline</label>
                    <input
                        type="date"
                        value={form.applyBy}
                        onChange={(e) => onUpdate("applyBy", e.target.value)}
                        className="w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm"
                    />
                </div>

                {/* Who Can Apply */}
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-sm">Who can apply</label>
                    <input
                        value={form.whoCanApply}
                        onChange={(e) => onUpdate("whoCanApply", e.target.value)}
                        placeholder="e.g. Graduates with 2+ years experience"
                        className="w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm"
                    />
                </div>
            </div>
        </div>
    )
})

ApplicationSettings.displayName = 'ApplicationSettings'
