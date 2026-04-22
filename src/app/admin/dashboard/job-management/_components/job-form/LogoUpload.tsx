import React, { memo, ChangeEvent, useState } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { JobFormData } from '../../_types/jobFormTypes'

interface LogoUploadProps {
    logo: string | null | undefined
    onLogoChange: (e: ChangeEvent<HTMLInputElement>) => void
    onUpdate: <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => void
    onLogoFileSelected: (file: File) => void
    jobId?: string
    uploading?: boolean
}

export const LogoUpload = memo(({
    logo,
    onLogoChange,
    onUpdate,
    onLogoFileSelected,
    jobId,
    uploading = false
}: LogoUploadProps) => {
    const [isDragging, setIsDragging] = useState(false)

    const openFilePicker = () => {
        document.getElementById("logoInput")?.click()
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            onLogoFileSelected(files[0])
        }
    }

    const handleRemoveLogo = (e: React.MouseEvent) => {
        e.stopPropagation()
        onUpdate("logo", null)
        onUpdate("logoFile", null)
    }

    return (
        <div className="p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold">Company Logo</h3>
            <p className="text-xs text-gray-600">
                Upload your company logo (or provide URL below)
            </p>

            {/* Upload Area */}
            <div
                onClick={!uploading ? openFilePicker : undefined}
                onDragOver={!uploading ? handleDragOver : undefined}
                onDragLeave={!uploading ? handleDragLeave : undefined}
                onDrop={!uploading ? handleDrop : undefined}
                className={`border-dashed border-2 rounded-md p-3 flex items-center justify-center transition-colors ${uploading
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : isDragging
                            ? 'border-blue-400 bg-blue-50 cursor-pointer'
                            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                    }`}
            >
                {uploading ? (
                    <div className="flex flex-col gap-2 items-center py-6">
                        <div className="animate-spin">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25" />
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-500">Uploading logo...</p>
                    </div>
                ) : logo || jobId ? (
                    <div className="relative">
                        {logo?.startsWith('data:') ? (
                            // For newly uploaded files (data URLs)
                            <Image
                                src={logo}
                                alt="Company logo"
                                width={96}
                                height={96}
                                className="w-24 h-24 object-cover rounded"
                                priority
                            />
                        ) : (
                            // For server-hosted logos (only when job is saved with jobId)
                            <Image
                                src={
                                    jobId
                                        ? `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000'}/api/v1/admin/jobs/${jobId}/logo`
                                        : logo || ''
                                }
                                alt="Company logo"
                                width={96}
                                height={96}
                                className="rounded object-cover"
                                priority
                            />
                        )}
                        <button
                            onClick={handleRemoveLogo}
                            className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full p-1 hover:bg-gray-600 transition-colors"
                            title="Remove logo"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
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
        </div>
    )
})

LogoUpload.displayName = 'LogoUpload'
