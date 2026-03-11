import React, { memo, ChangeEvent, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { JobFormData } from '../../_types/jobFormTypes'

interface LogoUploadProps {
    logo: string | null | undefined
    onLogoChange: (e: ChangeEvent<HTMLInputElement>) => void
    onUpdate: <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => void
    onLogoFileSelected: (file: File) => void
}

export const LogoUpload = memo(({
    logo,
    onLogoChange,
    onUpdate,
    onLogoFileSelected
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
                onClick={openFilePicker}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-dashed cursor-pointer border-2 rounded-md p-3 flex items-center justify-center transition-colors ${
                    isDragging
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                }`}
            >
                {logo ? (
                    <div className="relative">
                        <img
                            src={logo}
                            alt="Company logo"
                            className="w-24 h-24 object-cover rounded"
                        />
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
