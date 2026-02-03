import { useState, useCallback, ChangeEvent } from 'react'
import { toast } from 'sonner'
import { createJob, uploadJobLogo, type CreateJobRequest } from '@/api/adminJobsApi'
import type { JobFormData } from '../_types/jobFormTypes'
import { logger } from '@/lib/logger'

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
    companyLogoUrl: "",
}

export const useJobForm = (initialData?: Partial<JobFormData>) => {
    const [form, setForm] = useState<JobFormData>({
        ...defaultForm,
        ...initialData,
    })
    const [skillInput, setSkillInput] = useState("")
    const [publishing, setPublishing] = useState(false)

    const updateField = useCallback(<K extends keyof JobFormData>(
        key: K,
        value: JobFormData[K]
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }, [])

    const handleLogoChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Logo file size must be less than 5MB')
            return
        }

        updateField("logoFile", file)

        const reader = new FileReader()
        reader.onload = () => {
            updateField("logo", reader.result as string)
        }
        reader.readAsDataURL(file)
    }, [updateField])

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

    const validateForm = useCallback((): boolean => {
        if (!form.jobTitle.trim()) {
            toast.error('Job title is required')
            return false
        }
        if (!form.company.trim()) {
            toast.error('Company name is required')
            return false
        }
        if (!form.location.trim()) {
            toast.error('Location is required')
            return false
        }
        if (!form.salaryMin || !form.salaryMax) {
            toast.error('Salary range is required')
            return false
        }
        if (Number(form.salaryMin) >= Number(form.salaryMax)) {
            toast.error('Maximum salary must be greater than minimum salary')
            return false
        }
        if (!form.jobDescription.trim()) {
            toast.error('Job description is required')
            return false
        }
        return true
    }, [form])

    const uploadLogoIfNeeded = useCallback(async (): Promise<string | undefined> => {
        let logoUrl = form.companyLogoUrl || undefined

        if (form.logoFile) {
            toast.loading('Uploading company logo...')
            logoUrl = await uploadJobLogo(form.logoFile)
            toast.dismiss()
            toast.success('Logo uploaded successfully')
        }

        return logoUrl
    }, [form.companyLogoUrl, form.logoFile])

    const buildJobData = useCallback((logoUrl: string | undefined, status: 'active' | 'draft'): CreateJobRequest => {
        return {
            job_title: form.jobTitle,
            company: form.company,
            location: form.location || (status === 'draft' ? 'TBD' : form.location),
            work_mode: form.workMode,
            salary_min: Number(form.salaryMin) || 0,
            salary_max: Number(form.salaryMax) || 0,
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
            company_logo_url: logoUrl,
        }
    }, [form])

    const publishJob = useCallback(async (onSuccess: () => void) => {
        if (!validateForm()) return

        try {
            setPublishing(true)
            const logoUrl = await uploadLogoIfNeeded()
            const jobData = buildJobData(logoUrl, 'active')

            toast.loading('Publishing job...')
            await createJob(jobData)
            toast.dismiss()
            toast.success('Job published successfully!')
            onSuccess()
        } catch (error: unknown) {
            logger.error('Error publishing job:', error)
            toast.dismiss()
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to publish job'
            toast.error(errorMessage)
        } finally {
            setPublishing(false)
        }
    }, [validateForm, uploadLogoIfNeeded, buildJobData])

    const saveDraft = useCallback(async (onSuccess: () => void) => {
        if (!form.jobTitle.trim() || !form.company.trim()) {
            toast.error('Job title and company name are required')
            return
        }

        try {
            setPublishing(true)
            const logoUrl = await uploadLogoIfNeeded()
            const jobData = buildJobData(logoUrl, 'draft')

            await createJob(jobData)
            toast.success('Job saved as draft')
            onSuccess()
        } catch (error: unknown) {
            logger.error('Error saving draft:', error)
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save draft'
            toast.error(errorMessage)
        } finally {
            setPublishing(false)
        }
    }, [form.jobTitle, form.company, uploadLogoIfNeeded, buildJobData])

    return {
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
    }
}
