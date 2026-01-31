"use client"
import React, { memo } from 'react'
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
    initialData?: Partial<JobFormData>
    isEdit?: boolean
}

const FormHeader = memo(({
    isEdit,
    onPreview,
    form
}: {
    isEdit: boolean
    onPreview: (data: JobFormData) => void
    form: JobFormData
}) => (
    <div className="flex justify-between items-start mb-6 p-4">
        <div>
            <h1 className="text-2xl font-semibold">
                {isEdit ? 'Edit Job' : 'Add New Job'}
            </h1>
            <p className="text-sm text-gray-500">
                {isEdit ? 'Update job posting details' : 'Create a new job posting'}
            </p>
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
    onPublish
}: {
    publishing: boolean
    onSaveDraft: () => void
    onPublish: () => void
}) => (
    <div className="mt-6 flex justify-end gap-4">
        <button
            onClick={onSaveDraft}
            disabled={publishing}
            className="px-4 py-2 border border-black rounded-md bg-white text-[#9E5559] disabled:opacity-50 hover:bg-gray-50 transition-colors"
        >
            Save as Draft
        </button>
        <button
            onClick={onPublish}
            disabled={publishing}
            className="px-4 py-2 rounded-md bg-[#5E5EFF] text-white disabled:opacity-50 hover:bg-[#4a4acc] transition-colors"
        >
            {publishing ? 'Publishing...' : 'Publish Job'}
        </button>
    </div>
))

FormActions.displayName = 'FormActions'

export const AddNewJobForm = memo(({
    onPreview,
    onPublish,
    onCancel,
    initialData,
    isEdit = false
}: AddNewJobFormProps) => {
    const {
        form,
        skillInput,
        setSkillInput,
        publishing,
        updateField,
        handleLogoChange,
        addSkill,
        removeSkill,
        publishJob,
        saveDraft
    } = useJobForm(initialData)

    const handlePublish = () => {
        publishJob(onPublish)
    }

    const handleSaveDraft = () => {
        saveDraft(onCancel)
    }

    return (
        <div className="min-h-screen p-4 rounded-xl bg-white">
            <FormHeader isEdit={isEdit} onPreview={onPreview} form={form} />

            <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
                {/* Left - Form Fields */}
                <div className="col-span-8">
                    <div className="space-y-4">
                        {/* Basic Fields */}
                        <JobFormBasicFields form={form} onUpdate={updateField} />

                        {/* Text Fields */}
                        <JobFormTextFields form={form} onUpdate={updateField} />

                        {/* Skills */}
                        <JobFormSkills
                            skills={form.skills}
                            skillInput={skillInput}
                            onSkillInputChange={setSkillInput}
                            onAddSkill={addSkill}
                            onRemoveSkill={removeSkill}
                        />
                    </div>

                    {/* Actions */}
                    <FormActions
                        publishing={publishing}
                        onSaveDraft={handleSaveDraft}
                        onPublish={handlePublish}
                    />
                </div>

                {/* Right - Sidebar */}
                <div className="col-span-4">
                    {/* Logo Upload */}
                    <LogoUpload
                        logo={form.logo}
                        companyLogoUrl={form.companyLogoUrl}
                        onLogoChange={handleLogoChange}
                        onUpdate={updateField}
                    />

                    {/* Application Settings */}
                    <ApplicationSettings form={form} onUpdate={updateField} />
                </div>
            </div>
        </div>
    )
})

AddNewJobForm.displayName = 'AddNewJobForm'

export default AddNewJobForm
