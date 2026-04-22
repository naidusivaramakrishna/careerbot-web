import { useState, useCallback, ChangeEvent } from 'react'
import { toast } from 'sonner'
import { createJob, updateJob, uploadJobLogo, type CreateJobRequest, type UpdateJobRequest } from '@/api/adminJobsApi'
import type { JobFormData } from '../_types/jobFormTypes'
import { logger } from '@/lib/logger'

type ErrorResponse = { response?: { data?: { error?: { details?: { validation_errors?: Array<{ field: string; message: string }> }; message?: string } } } }

const defaultForm: JobFormData = {
    jobTitle: "",
    company: "",
    location: "",
    workMode: "hybrid",
    salaryMin: "",
    salaryMax: "",
    jobType: "full-time",
    openings: "1",
    jobDescription: "",
    aboutCompany: "",
    skills: [],
    applicationUrl: "",
    applyBy: "",
    whoCanApply: "",
    status: "draft",
    startDate: "Immediately",
    experience: "0",
    experienceMin: "0",
    experienceMax: "5",
    logo: null,
    logoFile: null,
}

interface UseJobFormProps {
    initialData?: Partial<JobFormData>
    isEdit?: boolean
    jobId?: string
}

export const useJobForm = ({ initialData, isEdit = false, jobId }: UseJobFormProps = {}) => {
    const [form, setForm] = useState<JobFormData>({
        ...defaultForm,
        ...initialData,
    })
    const [skillInput, setSkillInput] = useState("")
    const [publishing, setPublishing] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const updateField = useCallback(<K extends keyof JobFormData>(
        key: K,
        value: JobFormData[K]
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }, [])

    const processLogoFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Logo file size must be less than 5MB')
            return
        }

        try {
            setUploading(true)

            // Show preview immediately using data URL
            const reader = new FileReader()
            reader.onload = () => {
                updateField("logo", reader.result as string)
            }
            reader.readAsDataURL(file)

            // Upload to server in background to get the server-stored file
            // But keep the data URL preview - will use API endpoint once job has jobId
            await uploadJobLogo(file)
            updateField("logoFile", null)
        } catch (error) {
            logger.error('Error uploading logo:', error)
            toast.error('Failed to upload logo')
            updateField("logo", null)
            updateField("logoFile", null)
        } finally {
            setUploading(false)
        }
    }, [updateField])

    const handleLogoChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        processLogoFile(file)
    }, [processLogoFile])

    const addSkill = useCallback(() => {
        const value = skillInput.trim()
        if (!value) return
        if (form.skills.includes(value)) {
            setSkillInput("")
            return
        }
        updateField("skills", [...form.skills, value])
        setSkillInput("")
    }, [skillInput, form.skills, updateField])

    const removeSkill = useCallback((index: number) => {
        const newSkills = [...form.skills]
        newSkills.splice(index, 1)
        updateField("skills", newSkills)
    }, [form.skills, updateField])

    const uploadLogoIfNeeded = useCallback(async (): Promise<string | undefined> => {
        if (form.logoFile) {
            return await uploadJobLogo(form.logoFile)
        }

        return undefined
    }, [form.logoFile])

    const buildJobData = useCallback((logoUrl: string | undefined, status: 'active' | 'draft'): CreateJobRequest | UpdateJobRequest => {
        const salaryMinNum = form.salaryMin ? Number(form.salaryMin) : undefined
        const salaryMaxNum = form.salaryMax ? Number(form.salaryMax) : undefined

        const jobData: CreateJobRequest = {
            job_title: form.jobTitle,
            company: form.company,
            location: form.location || (status === 'draft' ? 'TBD' : form.location),
            work_mode: form.workMode,
            salary_min: salaryMinNum,
            salary_max: salaryMaxNum,
            job_type: form.jobType,
            number_of_openings: Number(form.openings),
            job_description: form.jobDescription || (status === 'draft' ? 'To be updated' : form.jobDescription),
            about_company: form.aboutCompany || undefined,
            skills: form.skills.length > 0 ? form.skills : undefined,
            application_url: form.applicationUrl || undefined,
            application_deadline: form.applyBy || undefined,
            who_can_apply: form.whoCanApply || undefined,
            status,
            experience_min: Number(form.experienceMin) || undefined,
            experience_max: Number(form.experienceMax) || undefined,
            company_logo_url: logoUrl || (form.logo || undefined),
        }
        return jobData
    }, [form])

    const publishJob = useCallback(async (onSuccess: () => void) => {
        try {
            setPublishing(true)
            setFieldErrors({})
            const logoUrl = await uploadLogoIfNeeded()
            const jobData = buildJobData(logoUrl, 'active')

            toast.loading('Publishing job...')

            if (isEdit && jobId) {
                await updateJob(jobId, jobData as UpdateJobRequest)
                logger.info(`Job updated successfully: ${jobId}`)
            } else {
                await createJob(jobData as CreateJobRequest)
                logger.info('Job created successfully')
            }

            toast.dismiss()
            toast.success(`Job ${isEdit ? 'updated' : 'published'} successfully!`)
            onSuccess()
        } catch (error: unknown) {
            logger.error('Error publishing job:', error)
            toast.dismiss()

            const errorData = (error as ErrorResponse)?.response?.data?.error
            if (errorData?.details?.validation_errors) {
                const errors: Record<string, string> = {}
                errorData.details.validation_errors.forEach((err: { field: string; message: string }) => {
                    errors[err.field] = err.message
                })
                setFieldErrors(errors)
            } else {
                const errorMessage = errorData?.message || 'Failed to publish job'
                toast.error(errorMessage)
            }
        } finally {
            setPublishing(false)
        }
    }, [uploadLogoIfNeeded, buildJobData, isEdit, jobId])

    const saveDraft = useCallback(async (onSuccess: () => void) => {
        try {
            setPublishing(true)
            setFieldErrors({})
            const logoUrl = await uploadLogoIfNeeded()
            const jobData = buildJobData(logoUrl, 'draft')

            if (isEdit && jobId) {
                await updateJob(jobId, jobData as UpdateJobRequest)
                logger.info(`Job draft updated successfully: ${jobId}`)
            } else {
                await createJob(jobData as CreateJobRequest)
                logger.info('Job draft created successfully')
            }

            toast.success(`Job ${isEdit ? 'updated' : 'saved'} as draft`)
            onSuccess()
        } catch (error: unknown) {
            logger.error('Error saving draft:', error)

            const errorData = (error as ErrorResponse)?.response?.data?.error
            if (errorData?.details?.validation_errors) {
                const errors: Record<string, string> = {}
                errorData.details.validation_errors.forEach((err: { field: string; message: string }) => {
                    errors[err.field] = err.message
                })
                setFieldErrors(errors)
            } else {
                const errorMessage = errorData?.message || 'Failed to save draft'
                toast.error(errorMessage)
            }
        } finally {
            setPublishing(false)
        }
    }, [uploadLogoIfNeeded, buildJobData, isEdit, jobId])

    const getFieldError = (field: string): string | undefined => {
        return fieldErrors[field]
    }

    return {
        form,
        skillInput,
        setSkillInput,
        publishing,
        uploading,
        updateField,
        handleLogoChange,
        processLogoFile,
        addSkill,
        removeSkill,
        publishJob,
        saveDraft,
        fieldErrors,
        setFieldErrors,
        getFieldError
    }
}
