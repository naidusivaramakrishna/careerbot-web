import React, { memo, ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import { JobFormData } from '../../_types/jobFormTypes'

interface LogoUploadProps {
    logo: string | null | undefined
    companyLogoUrl: string | undefined
    onLogoChange: (e: ChangeEvent<HTMLInputElement>) => void
    onUpdate: <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => void
}

export const LogoUpload = memo(({
    logo,
    companyLogoUrl,
    onLogoChange,
    onUpdate
}: LogoUploadProps) => {
    const openFilePicker = () => {
        document.getElementById("logoInput")?.click()
    }

    return (
        <div className="p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold">Company Logo</h3>
            <p className="text-xs text-gray-600">
                Upload your company logo (or provide URL below)
            </p>

            {/* Upload Area */}
            <div
                onClick={openFilePicker}
                className="border-dashed cursor-pointer border-2 border-gray-300 rounded-md p-3 flex items-center justify-center hover:border-gray-400 transition-colors"
            >
                {logo ? (
                    <img
                        src={logo}
                        alt="Company logo"
                        className="w-24 h-24 object-cover rounded"
                    />
                ) : (
                    <div className="flex flex-col gap-2 items-center py-6">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <label className="text-sm text-gray-500 text-center">
                            Click or Drag & drop to upload logo
                        </label>
                        <input
                            id="logoInput"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onLogoChange}
                        />
                    </div>
                )}
            </div>

            {/* URL Input */}
            <div>
                <label className="text-sm font-semibold">Or provide logo URL</label>
                <input
                    type="url"
                    value={companyLogoUrl}
                    onChange={(e) => onUpdate("companyLogoUrl", e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full p-2 outline-none rounded-lg bg-[#F3F3F5] text-sm mt-2"
                />
            </div>
        </div>
    )
})

LogoUpload.displayName = 'LogoUpload'