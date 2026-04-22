"use client"

import React, { memo, useState, useCallback } from 'react'
import Image from 'next/image'
import { MapPin, CirclePlay, Banknote, Briefcase } from 'lucide-react'
import { IoHourglassOutline } from 'react-icons/io5'
import { createJob, uploadJobLogo, type CreateJobRequest } from '@/api/adminJobsApi'
import { toast } from 'sonner'
import { JobFormData } from '../../_types/jobFormTypes'
import { logger } from '@/lib/logger'

interface PreviewJobPageProps {
    data?: JobFormData | null
    onPublish: () => void
    onBack: () => void
    jobId?: string
}

const JobPreviewHeader = memo(({ title, company, logo, jobId }: {
    title: string
    company: string
    logo?: string | null
    jobId?: string
}) => {
    // Determine logo source
    let logoSrc = logo
    if (jobId && logo && !logo.startsWith('data:')) {
        // For existing jobs, use API endpoint if logo is not a data URL
        logoSrc = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000'}/api/v1/admin/jobs/${jobId}/logo`
    }

    return (
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-xl font-semibold mb-2">{title || "Job Title"}</h1>
                <p className="text-gray-600 mb-4">{company || "Company Name"}</p>
            </div>
            <div className="ml-6">
                {logoSrc ? (
                    <Image src={logoSrc} alt={company} width={64} height={64} className="rounded object-cover" priority />
                ) : (
                    <div className="w-16 h-16 bg-[#D9D9D9] rounded flex items-center justify-center font-semibold text-xl">
                        {company ? company.charAt(0).toUpperCase() : "C"}
                    </div>
                )}
            </div>
        </div>
    )
})

JobPreviewHeader.displayName = 'JobPreviewHeader'

const JobBadge = memo(({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }> | null; text: string }) => (
    <div className="px-3 py-1.5 flex gap-1 items-center border border-[#00000066] rounded-lg text-sm">
        {Icon && <Icon className="w-4 h-4" />}
        {text}
    </div>
))

JobBadge.displayName = 'JobBadge'

const JobDetailItem = memo(({ icon: Icon, label, value }: {
    icon: React.ComponentType<{ className?: string }> | null
    label: string
    value: string
}) => (
    <div className="flex flex-col gap-1 text-sm">
        <div className="flex gap-1 text-[#7C7C7C]">
            {Icon && <Icon className="w-4 h-4" />}
            {label}
        </div>
        <div>{value}</div>
    </div>
))

JobDetailItem.displayName = 'JobDetailItem'

const JobSection = memo(({ title, content }: { title: string; content: React.ReactNode }) => (
    <div className="my-8">
        <h3 className="font-medium mb-3">{title}</h3>
        {content}
    </div>
))

JobSection.displayName = 'JobSection'

const SkillBadge = memo(({ skill }: { skill: string }) => (
    <span className="bg-[#ECEEF2] text-black px-3 py-1 rounded-md text-sm">
        {skill}
    </span>
))

SkillBadge.displayName = 'SkillBadge'

export const PreviewJobPage = memo(({
    data,
    onPublish,
    onBack
}: PreviewJobPageProps) => {
    const [publishing, setPublishing] = useState(false)

    const handlePublish = useCallback(async () => {
        if (!data) return

        try {
            setPublishing(true)

            // Upload logo if needed
            let logoUrl: string | undefined = undefined
            if (data.logoFile) {
                toast.loading('Uploading company logo...')
                logoUrl = await uploadJobLogo(data.logoFile)
                toast.dismiss()
                toast.success('Logo uploaded successfully')
            }

            // Create job
            const jobData: CreateJobRequest = {
                job_title: data.jobTitle,
                company: data.company,
                location: data.location,
                work_mode: data.workMode,
                salary_min: Number(data.salaryMin),
                salary_max: Number(data.salaryMax),
                job_type: data.jobType,
                number_of_openings: Number(data.openings),
                job_description: data.jobDescription,
                about_company: data.aboutCompany || undefined,
                skills: data.skills.length > 0 ? data.skills : undefined,
                application_url: data.applicationUrl || undefined,
                application_deadline: data.applyBy || undefined,
                who_can_apply: data.whoCanApply || undefined,
                status: 'active',
                experience_min: Number(data.experienceMin) || undefined,
                experience_max: Number(data.experienceMax) || undefined,
                company_logo_url: logoUrl,
            }

            toast.loading('Publishing job...')
            await createJob(jobData)
            toast.dismiss()
            toast.success('Job published successfully!')
            onPublish()
        } catch (error: unknown) {
            logger.error('Error publishing job:', error)
            toast.dismiss()
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to publish job'
            toast.error(errorMessage)
        } finally {
            setPublishing(false)
        }
    }, [data, onPublish])

    if (!data) return null

    return (
        <div className="min-h-screen">
            <div className="bg-white p-6 rounded-lg shadow">
                <h1 className="text-2xl font-semibold text-center mb-6">Job Preview</h1>

                {/* Header */}
                <JobPreviewHeader
                    title={data.jobTitle}
                    company={data.company}
                    logo={data.logo}
                />

                {/* Badges */}
                <div className="flex gap-2 my-4 flex-wrap">
                    <JobBadge icon={MapPin} text={data.location || "Location"} />
                    <JobBadge icon={null} text={data.workMode} />
                    <JobBadge icon={null} text={data.jobType} />
                </div>

                {/* Details */}
                <div className="flex gap-8 my-4 flex-wrap">
                    <JobDetailItem
                        icon={CirclePlay}
                        label="Start Date"
                        value="Immediately"
                    />
                    <JobDetailItem
                        icon={Banknote}
                        label="CTC (ANNUAL)"
                        value={`₹ ${data.salaryMin || "0"} - ${data.salaryMax || "0"} LPA`}
                    />
                    <JobDetailItem
                        icon={Briefcase}
                        label="Experience"
                        value={`${data.experienceMin} - ${data.experienceMax} Year(s)`}
                    />
                    <JobDetailItem
                        icon={IoHourglassOutline}
                        label="Apply by"
                        value={data.applyBy || "Open"}
                    />
                </div>

                {/* Job Description */}
                <JobSection
                    title="Job Description:"
                    content={
                        <p className="text-gray-700 whitespace-pre-wrap">
                            {data.jobDescription || "No description provided"}
                        </p>
                    }
                />

                {/* About Company */}
                {data.aboutCompany && (
                    <JobSection
                        title="About Company:"
                        content={<p className="text-gray-700">{data.aboutCompany}</p>}
                    />
                )}

                {/* Skills */}
                {data.skills.length > 0 && (
                    <JobSection
                        title="Required Skills:"
                        content={
                            <div className="flex gap-2 flex-wrap">
                                {data.skills.map((skill, i) => (
                                    <SkillBadge key={i} skill={skill} />
                                ))}
                            </div>
                        }
                    />
                )}

                {/* Actions */}
                <div className="mt-8 flex justify-end gap-4">
                    <button
                        onClick={onBack}
                        disabled={publishing}
                        className="px-4 py-2 border border-black rounded-md bg-white text-[#9E5559] disabled:opacity-50 hover:bg-gray-50 transition-colors"
                    >
                        Back to Edit
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className="px-4 py-2 rounded-md bg-[#5E5EFF] text-white disabled:opacity-50 hover:bg-[#4a4acc] transition-colors"
                    >
                        {publishing ? 'Publishing...' : 'Publish Job'}
                    </button>
                </div>
            </div>
        </div>
    )
})

PreviewJobPage.displayName = 'PreviewJobPage'

export default PreviewJobPage
