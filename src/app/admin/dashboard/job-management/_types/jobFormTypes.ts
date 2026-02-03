export type JobStatus = "active" | "draft" | "expired" | "closed"
export type WorkMode = "remote" | "hybrid" | "on-site"
export type JobType = "full-time" | "part-time" | "internship" | "contract"

export type JobFormData = {
    jobTitle: string
    company: string
    location: string
    workMode: WorkMode
    salaryMin: string
    salaryMax: string
    jobType: JobType
    openings: string
    jobDescription: string
    aboutCompany: string
    skills: string[]
    applicationUrl: string
    applyBy: string
    whoCanApply: string
    status: JobStatus
    startDate: string
    experience: string
    experienceMin: string
    experienceMax: string
    logo?: string | null
    logoFile?: File | null
    companyLogoUrl?: string
}
