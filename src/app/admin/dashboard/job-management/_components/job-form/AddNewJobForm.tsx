"use client"
import React, { memo, useState } from 'react'
import { JobFormBasicFields } from './JobFormBasicFields'
import { JobFormTextFields } from './JobFormTextFields'
import { JobFormSkills } from './JobFormSkills'
import { LogoUpload } from './LogoUpload'
import { ApplicationSettings } from './ApplicationSettings'
import { JobFormData } from '../../_types/jobFormTypes'
import { useJobForm } from '../../_hooks/useJobForm'

interface AddNewJobFormProps {
    onPreview: (data: JobFormData) => void
    onPublish: () => void
    onCancel: () => void
    onSaveDraft?: () => void
    initialData?: Partial<JobFormData>
    isEdit?: boolean
    jobId?: string
}

const FormHeader = memo(({
    isEdit,
    onPreview,
    onCancel,
    form
}: {
    isEdit: boolean
    onPreview: (data: JobFormData) => void
    onCancel: () => void
    form: JobFormData
}) => (
    <div className="flex justify-between items-start mb-6 p-4">
        <div className="flex items-center gap-4">
            <button
                onClick={onCancel}
                className="text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                title="Go back"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div>
                <h1 className="text-2xl font-semibold">
                    {isEdit ? 'Edit Job' : 'Add New Job'}
                </h1>
                <p className="text-sm text-gray-500">
                    {isEdit ? 'Update job posting details' : 'Create a new job posting'}
                </p>
            </div>
        </div>
        <button
            onClick={() => onPreview(form)}
            className="bg-white border border-gray-200 px-4 py-2 rounded-md text-sm shadow-sm hover:bg-gray-50 transition-colors"
        >
            Preview
        </button>
    </div>
))

FormHeader.displayName = 'FormHeader'

const FormActions = memo(({
    publishing,
    onSaveDraft,
    onPublish,
    showWarning,
    onPublishClick
}: {
    publishing: boolean
    onSaveDraft: () => void
    onPublish: () => void
    showWarning: boolean
    onPublishClick: () => void
}) => (
    <div className="mt-6">
        {showWarning && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                    <span className="font-semibold">⚠️ Warning:</span> Your job status is set to Draft. Publishing will change the status to <span className="font-semibold">Active</span>.
                </p>
            </div>
        )}
        <div className="flex justify-end gap-4">
            <button
                onClick={onSaveDraft}
                disabled={publishing}
                className="px-4 py-2 border border-black rounded-md bg-white text-[#9E5559] disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
                Save as Draft
            </button>
            <button
                onClick={onPublishClick}
                disabled={publishing}
                className="px-4 py-2 rounded-md bg-[#5E5EFF] text-white disabled:opacity-50 hover:bg-[#4a4acc] transition-colors"
            >
                {publishing ? 'Publishing...' : 'Publish Job'}
            </button>
        </div>
    </div>
))

FormActions.displayName = 'FormActions'

export const AddNewJobForm = memo(({
    onPreview,
    onPublish,
    onCancel,
    onSaveDraft,
    initialData,
    isEdit = false,
    jobId
}: AddNewJobFormProps) => {
    const [showWarning, setShowWarning] = useState(false)
    const {
        form,
        skillInput,
        setSkillInput,
        publishing,
        updateField,
        handleLogoChange,
        processLogoFile,
        addSkill,
        removeSkill,
        publishJob,
        saveDraft,
        fieldErrors,
        getFieldError
    } = useJobForm({ initialData, isEdit, jobId })

    const handlePublishClick = () => {
        // Show warning only when editing and status is draft
        if (isEdit && form.status === 'draft' && !showWarning) {
            setShowWarning(true)
        } else {
            // If not editing, or warning already shown, or status is not draft, publish
            publishJob(onPublish)
        }
    }

    const handleSaveDraft = () => {
        saveDraft(onSaveDraft || onCancel)
    }

    return (
        <div className="min-h-screen p-4 rounded-xl bg-white">
            <FormHeader isEdit={isEdit} onPreview={onPreview} onCancel={onCancel} form={form} />

            <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
                {/* Left - Form Fields */}
                <div className="col-span-8">
                    <div className="space-y-4">
                        {/* Basic Fields */}
                        <JobFormBasicFields form={form} onUpdate={updateField} getFieldError={getFieldError} />

                        {/* Text Fields */}
                        <JobFormTextFields form={form} onUpdate={updateField} getFieldError={getFieldError} />

                        {/* Skills */}
                        <JobFormSkills
                            skills={form.skills}
                            skillInput={skillInput}
                            onSkillInputChange={setSkillInput}
                            onAddSkill={addSkill}
                            onRemoveSkill={removeSkill}
                            getFieldError={getFieldError}
                        />
                    </div>

                    {/* Actions */}
                    <FormActions
                        publishing={publishing}
                        onSaveDraft={handleSaveDraft}
                        onPublish={onPublish}
                        showWarning={showWarning}
                        onPublishClick={handlePublishClick}
                    />
                </div>

                {/* Right - Sidebar */}
                <div className="col-span-4">
                    {/* Logo Upload */}
                    <LogoUpload
                        logo={form.logo}
                        onLogoChange={handleLogoChange}
                        onUpdate={updateField}
                        onLogoFileSelected={processLogoFile}
                    />

                    {/* Application Settings */}
                    <ApplicationSettings form={form} onUpdate={updateField} getFieldError={getFieldError} isEdit={isEdit} />
                </div>
            </div>
        </div>
    )
})

AddNewJobForm.displayName = 'AddNewJobForm'

export default AddNewJobForm
