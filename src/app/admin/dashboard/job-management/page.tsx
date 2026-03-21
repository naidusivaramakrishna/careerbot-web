"use client"
import React, { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import FilterModal from '../../_components/FilterModal'
import JobDetailsModal from '../../_components/jobDetailsModal'
import AddNewJobForm from './_components/job-form/AddNewJobForm'
import ConfirmDeleteModal from '@/app/(user)/profile/_components/ConfirmDeleteModal'
import type { JobListItem, JobDetailsResponse, JobListQueryParams } from '@/api/adminJobsApi'
import type { JobFormData } from './_types/jobFormTypes'
import { JobListControls, JobsPagination, JobsTable } from './_components/job-management'
import { PreviewJobPage } from './_components/job-form'
import { useJobManagement } from './_hooks/useJobManagement'
import { logger } from '@/lib/logger'
import { useAdminAccess } from '../../_hooks/useAdminAccess'
import { LockedPageOverlay } from '../../_components/LockedPageOverlay'

type PageState = "list" | "add" | "edit" | "preview"

const JobManagement = () => {
  const { hasAccess, requiredRoles, loading: accessLoading } = useAdminAccess('job-management');
  // Custom hook for all job management logic
  const {
    jobs,
    loading,
    pagination,
    filters,
    handleSearch,
    handleSourceFilter,
    handleStatusFilter,
    handleApplyFilters,
    handleResetFilters,
    handlePageChange,
    handleExport,
    handleDeleteJob,
    fetchJobDetails,
    fetchJobs
  } = useJobManagement()

  // UI State
  const [pageState, setPageState] = useState<PageState>("list")
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobListItem | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState<JobFormData | null>(null)
  const [editingJobDetails, setEditingJobDetails] = useState<JobDetailsResponse | null>(null)
  const [loadingJobDetails, setLoadingJobDetails] = useState(false)

  // Filter Modal Handlers
  const handleFilterModalOpen = useCallback(() => {
    setFilterModalOpen(true)
  }, [])

  const handleFilterModalClose = useCallback(() => {
    setFilterModalOpen(false)
  }, [])

  const handleApplyFiltersAndClose = useCallback(async (filters: JobListQueryParams) => {
    try {
      await handleApplyFilters(filters)
      // Only close modal if filters were successfully applied
      setFilterModalOpen(false)
    } catch (error) {
      // Keep modal open and re-throw so FilterModal can display errors
      throw error
    }
  }, [handleApplyFilters])

  // Job Actions
  const handleViewJob = useCallback((job: JobListItem) => {
    setSelectedJob(job)
  }, [])

  const handleCloseJobDetails = useCallback(() => {
    setSelectedJob(null)
  }, [])

  const handleEditClick = useCallback(async (job: JobListItem) => {
    try {
      logger.info(`Editing job: ${job.id}`)
      setLoadingJobDetails(true)
      const jobDetails = await fetchJobDetails(job.id)
      setEditingJobDetails(jobDetails)
      setPageState("edit")
    } catch (error) {
      logger.error(`Failed to load job details for job: ${job.id}`, error)
      // Error already toasted in hook
    } finally {
      setLoadingJobDetails(false)
    }
  }, [fetchJobDetails])

  const handleEditFromModal = useCallback(async (jobId: string) => {
    try {
      logger.info(`Editing job from modal: ${jobId}`)
      setLoadingJobDetails(true)
      const jobDetails = await fetchJobDetails(jobId)
      setEditingJobDetails(jobDetails)
      setSelectedJob(null)
      setPageState("edit")
    } catch (error) {
      logger.error(`Failed to load job details for job: ${jobId}`, error)
    } finally {
      setLoadingJobDetails(false)
    }
  }, [fetchJobDetails])

  const handleDeleteClick = useCallback((jobId: string) => {
    setJobToDelete(jobId)
    setDeleteModalOpen(true)
  }, [])

  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false)
    setJobToDelete(null)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!jobToDelete) return

    try {
      logger.warn(`Deleting job: ${jobToDelete}`)
      setIsDeleting(true)
      await handleDeleteJob(jobToDelete)
      setDeleteModalOpen(false)
      setJobToDelete(null)
      logger.info(`Job deleted successfully: ${jobToDelete}`)
    } catch (error) {
      logger.error(`Failed to delete job: ${jobToDelete}`, error)
      // Error already toasted in hook
    } finally {
      setIsDeleting(false)
    }
  }, [jobToDelete, handleDeleteJob])

  // Form Navigation
  const handleAddNewJob = useCallback(() => {
    logger.info('Creating new job')
    setPageState("add")
  }, [])

  const handlePreview = useCallback((data: JobFormData) => {
    setFormData(data)
    setPageState("preview")
  }, [])

  const handleJobPublished = useCallback(() => {
    setPageState("list")
    setEditingJobDetails(null)
    setFormData(null)
    fetchJobs()
    toast.success('Job published successfully!')
  }, [fetchJobs])

  const handleJobSavedAsDraft = useCallback(() => {
    setPageState("list")
    setEditingJobDetails(null)
    setFormData(null)
    fetchJobs()
    toast.success('Job saved as draft successfully!')
  }, [fetchJobs])

  const handleCancelForm = useCallback(() => {
    setPageState("list")
    setEditingJobDetails(null)
    setFormData(null)
  }, [])

  const handleBackToEdit = useCallback(() => {
    setPageState(editingJobDetails ? "edit" : "add")
  }, [editingJobDetails])

  // Block render until access check completes
  if (accessLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check access
  if (!hasAccess) {
    return <LockedPageOverlay requiredRoles={requiredRoles} pageName="Job Management" />;
  }

  // Render different page states
  if (pageState === "preview") {
    return (
      <PreviewJobPage
        data={formData}
        onPublish={handleJobPublished}
        onBack={handleBackToEdit}
      />
    )
  }

  if (pageState === "add") {
    return (
      <AddNewJobForm
        onPreview={handlePreview}
        onPublish={handleJobPublished}
        onCancel={handleCancelForm}
        onSaveDraft={handleJobSavedAsDraft}
        initialData={formData || undefined}
      />
    )
  }

  if (pageState === "edit") {
    if (loadingJobDetails) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E5EFF]"></div>
          <p className="mt-2 text-gray-500 ml-4">Loading job details...</p>
        </div>
      )
    }

    if (!editingJobDetails) {
      return (
        <div className="flex justify-center items-center h-screen">
          <p className="text-gray-500">No job details available</p>
        </div>
      )
    }

    return (
      <AddNewJobForm
        initialData={{
          jobTitle: editingJobDetails.job_title,
          company: editingJobDetails.company,
          location: editingJobDetails.location,
          workMode: editingJobDetails.work_mode as 'remote' | 'hybrid' | 'on-site',
          salaryMin: editingJobDetails.salary_min?.toString() || '',
          salaryMax: editingJobDetails.salary_max?.toString() || '',
          jobType: editingJobDetails.job_type as 'full-time' | 'part-time' | 'internship' | 'contract',
          openings: editingJobDetails.number_of_openings?.toString() || '1',
          jobDescription: editingJobDetails.job_description || '',
          aboutCompany: editingJobDetails.about_company || '',
          skills: editingJobDetails.skills || [],
          applicationUrl: editingJobDetails.application_url || '',
          applyBy: editingJobDetails.application_deadline || '',
          whoCanApply: editingJobDetails.who_can_apply || '',
          status: editingJobDetails.status as 'active' | 'draft' | 'expired' | 'closed',
          startDate: 'Immediately',
          experience: editingJobDetails.experience_min?.toString() || '0',
          experienceMin: editingJobDetails.experience_min?.toString() || '',
          experienceMax: editingJobDetails.experience_max?.toString() || '',
          logo: editingJobDetails.company_logo_url || null,
        }}
        isEdit={true}
        jobId={editingJobDetails.id}
        onPreview={handlePreview}
        onPublish={handleJobPublished}
        onCancel={handleCancelForm}
        onSaveDraft={handleJobSavedAsDraft}
      />
    )
  }

  // Default: List View
  return (
    <div>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='font-semibold text-xl'>Job Management</h1>
          <p className="text-[#4A5565] text-xs">
            Manage all jobs, postings and applications.
          </p>
        </div>
        <button
          onClick={handleAddNewJob}
          className='bg-[#5E5EFF] text-white flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm cursor-pointer hover:bg-[#4a4acc] transition-colors'
        >
          <Plus className='w-4 h-4' />
          Add new Job
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg p-6 my-8 shadow-sm border border-gray-100">
        {/* Controls */}
        <JobListControls
          searchValue={filters.search || ''}
          onSearchChange={handleSearch}
          onSourceFilter={handleSourceFilter}
          onStatusFilter={handleStatusFilter}
          onFilterClick={handleFilterModalOpen}
          onExportClick={handleExport}
        />

        {/* Stats */}
        <div className="my-4 text-sm text-gray-600">
          Showing {jobs.length} of {pagination.total} jobs
        </div>

        {/* Table */}
        <div className="mt-6">
          <JobsTable
            jobs={jobs}
            loading={loading}
            onView={handleViewJob}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </div>

        {/* Pagination */}
        {!loading && jobs.length > 0 && (
          <JobsPagination
            currentPage={pagination.page}
            totalPages={pagination.total_pages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Modals */}
      <FilterModal
        open={filterModalOpen}
        onClose={handleFilterModalClose}
        onApply={handleApplyFiltersAndClose}
        onReset={handleResetFilters}
      />

      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={handleCloseJobDetails}
          onUpdate={fetchJobs}
          onEdit={handleEditFromModal}
        />
      )}

      <ConfirmDeleteModal
        open={deleteModalOpen}
        title="Delete Job"
        description="Are you sure you want to delete this job? This action cannot be undone and will remove all associated data."
        loading={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default JobManagement
