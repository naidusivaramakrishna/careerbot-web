"use client"
import React, { useState, useEffect } from 'react'
import Dropdown from '@/components/common/CustomDropdown'
import { Download, Eye, ListFilter, Plus, Search, SquarePen, Trash2 } from 'lucide-react';
import FilterModal from '../../_components/FilterModal';
import JobDetailsModal from '../../_components/jobDetailsModal';
import AddNewJobForm, { PreviewJobPage } from './_components/AddNewJobForm';
import ConfirmDeleteModal from '@/app/(user)/dashboard/profile/_components/ConfirmDeleteModal';
import {
  getJobList,
  getJobDetails,
  deleteJob,
  downloadJobsCSV,
  JobListItem,
  JobDetailsResponse,
  JobListQueryParams
} from '@/api/adminJobsApi';
import { toast } from 'sonner'; // or your toast library

const JobManagement = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListItem | null>(null);
  const [pageState, setPageState] = useState<"list" | "add" | "edit" | "preview">("list");
  const [formData, setFormData] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingJobDetails, setEditingJobDetails] = useState<JobDetailsResponse | null>(null);
  const [loadingJobDetails, setLoadingJobDetails] = useState(false);

  // API State
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0
  });

  // Filter State
  const [filters, setFilters] = useState<JobListQueryParams>({
    page: 1,
    page_size: 10,
    search: '',
    status: undefined,
    source: undefined,
  });

  // Fetch jobs on mount and filter changes
  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getJobList(filters);
      setJobs(response.jobs);
      setPagination({
        page: response.page,
        page_size: response.page_size,
        total: response.total,
        total_pages: response.total_pages
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleSourceFilter = (value: string) => {
    if (value === 'Source' || value === 'All') {
      setFilters(prev => ({ ...prev, source: undefined, page: 1 }));
    } else {
      setFilters(prev => ({
        ...prev,
        source: value.toLowerCase() as 'admin' | 'scraped',
        page: 1
      }));
    }
  };

  const handleStatusFilter = (value: string) => {
    if (value === 'Status' || value === 'All') {
      setFilters(prev => ({ ...prev, status: undefined, page: 1 }));
    } else {
      setFilters(prev => ({
        ...prev,
        status: value.toLowerCase() as 'active' | 'draft' | 'expired' | 'closed',
        page: 1
      }));
    }
  };

  const handleApplyFilters = (advancedFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...advancedFilters,
      page: 1
    }));
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      page_size: 10,
      search: '',
      status: undefined,
      source: undefined,
    });
  };

  const handleExport = async () => {
    try {
      toast.loading('Exporting jobs...');
      await downloadJobsCSV({
        search: filters.search,
        status: filters.status,
        work_mode: filters.work_mode,
        job_type: filters.job_type
      }, `jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Jobs exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export jobs');
    }
  };

  const handleDeleteClick = (jobId: string) => {
    setJobToDelete(jobId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;

    try {
      setIsDeleting(true);
      await deleteJob(jobToDelete);
      toast.success('Job deleted successfully');
      setDeleteModalOpen(false);
      setJobToDelete(null);
      fetchJobs(); // Refresh list
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete job');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = async (job: JobListItem) => {
    try {
      setLoadingJobDetails(true);
      const jobDetails = await getJobDetails(job.id);
      setEditingJobDetails(jobDetails);
      setPageState("edit");
    } catch (error) {
      console.error('Error fetching job details for edit:', error);
      toast.error('Failed to load job details for editing');
    } finally {
      setLoadingJobDetails(false);
    }
  };

  const handleJobPublished = () => {
    setPageState("list");
    fetchJobs(); // Refresh the list
    toast.success('Job published successfully!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // ============================
  // LIST PAGE (DEFAULT)
  // ============================
  if (pageState === "list") {
    return (
      <div>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='font-semibold text-xl'>Job Management</h1>
            <p className="text-[#4A5565] text-xs">
              Manage all jobs, postings and applications.
            </p>
          </div>
          <button
            onClick={() => setPageState("add")}
            className='bg-[#5E5EFF] text-white flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm cursor-pointer'>
            <Plus className='w-4 h-4 ' />
            Add new Job
          </button>
        </div>

        <div className="bg-white rounded-lg p-6 my-8 shadow-sm border border-gray-100">
          <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="flex items-center bg-[#F3F3F5] text-sm p-2 rounded-md w-full sm:w-2/5 lg:w-3/5">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by title or company..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full outline-none bg-transparent ml-2"
              />
            </div>

            {/* Dropdowns */}
            <Dropdown
              options={["Source", "All", "Admin", "Scraped"]}
              defaultValue="Source"
              bgColor="bg-gray-100"
              bgOptions="bg-white"
              onChange={handleSourceFilter}
              className="w-34"
            />
            <Dropdown
              options={["Status", "All", "Active", "Draft", "Expired", "Closed"]}
              defaultValue="Status"
              bgColor="bg-gray-100"
              bgOptions="bg-white"
              onChange={handleStatusFilter}
              className="w-34"
            />
            <button
              onClick={() => setFilterOpen(true)}
              className='bg-[#EFEFEF] border border-gray-200  flex items-center gap-2 py-2 px-4 rounded-lg text-sm cursor-pointer'>
              <ListFilter className='w-4 h-4 ' />
              Filter
            </button>
            <button
              onClick={handleExport}
              className='bg-white text-[#5E5EFF] font-semibold border border-[#5E5EFF] flex items-center gap-2 py-2 px-4 rounded-lg text-sm cursor-pointer'>
              <Download className='w-4 h-4 ' />
              Export
            </button>
          </div>

          {/* Stats */}
          <div className="my-4 text-sm text-gray-600">
            Showing {jobs.length} of {pagination.total} jobs
          </div>

          {/* Table */}
          <div className="mt-6 overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E5EFF]"></div>
                <p className="mt-2 text-gray-500">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No jobs found</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#7F78DF33] text-left text-gray-700">
                    <th className="p-3 font-semibold">Job Title</th>
                    <th className="p-3 font-semibold">Company</th>
                    <th className="p-3 font-semibold">Location</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Source</th>
                    <th className="p-3 font-semibold">Views</th>
                    <th className="p-3 font-semibold">Applications</th>
                    <th className="p-3 font-semibold">Posted Date</th>
                    <th className="p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="border-t-0 border-2 border-[#E5E7EB]">
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-[#00000033]/70 last:border-none hover:bg-gray-50">
                      <td className="p-3">{job.job_title}</td>
                      <td className="p-3 text-gray-600">{job.company}</td>
                      <td className="p-3">{job.location}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-md font-medium
                          ${job.status === "active"
                              ? "text-[#008236] bg-[#DCFCE7]"
                              : job.status === "expired"
                                ? "text-[#FE0004] bg-[#FFB0BA66]/40"
                                : job.status === "closed"
                                  ? "text-[#FF6B00] bg-[#FFE5CC]"
                                  : "text-[#9A9A9A] bg-[#F3F3F3]"
                            }`}
                        >
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 capitalize">{job.source}</td>
                      <td className="p-3 text-gray-600">{job.views_count}</td>
                      <td className="p-3 text-gray-600">{job.applications_count}</td>
                      <td className="p-3 text-gray-600">{formatDate(job.posted_date)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="text-gray-700 hover:text-blue-600"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(job)}
                            className="text-gray-700 hover:text-blue-600"
                            title="Edit Job"
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(job.id)}
                            className="text-[#E7000B] hover:text-red-700"
                            title="Delete Job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && jobs.length > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.total_pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-1.5 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-4 py-1.5 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Modal */}
        <FilterModal
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        {/* Job Details Modal */}
        {selectedJob && (
          <JobDetailsModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onUpdate={fetchJobs}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          open={deleteModalOpen}
          title="Delete Job"
          description="Are you sure you want to delete this job? This action cannot be undone and will remove all associated data."
          loading={isDeleting}
          onCancel={() => {
            setDeleteModalOpen(false);
            setJobToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      </div>
    )
  }

  // ============================
  // ADD JOB PAGE
  // ============================
  if (pageState === "add") {
    return (
      <AddNewJobForm
        onPreview={(data: any) => {
          setFormData(data);
          setPageState("preview");
        }}
        onPublish={handleJobPublished}
        onCancel={() => setPageState("list")}
      />
    );
  }

  // ============================
  // EDIT JOB PAGE
  // ============================
  if (pageState === "edit") {
    if (loadingJobDetails) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E5EFF]"></div>
          <p className="mt-2 text-gray-500 ml-4">Loading job details...</p>
        </div>
      );
    }

    if (!editingJobDetails) {
      return (
        <div className="flex justify-center items-center h-screen">
          <p className="text-gray-500">No job details available</p>
        </div>
      );
    }

    return (
      <AddNewJobForm
        initialData={{
          jobTitle: editingJobDetails.job_title,
          company: editingJobDetails.company,
          location: editingJobDetails.location,
          workMode: editingJobDetails.work_mode as any,
          salaryMin: editingJobDetails.salary_min?.toString() || '',
          salaryMax: editingJobDetails.salary_max?.toString() || '',
          jobType: editingJobDetails.job_type as any,
          openings: editingJobDetails.number_of_openings?.toString() || '1',
          jobDescription: editingJobDetails.job_description || '',
          aboutCompany: editingJobDetails.about_company || '',
          skills: editingJobDetails.skills || [],
          applicationUrl: editingJobDetails.application_url || '',
          applyBy: editingJobDetails.application_deadline || '',
          whoCanApply: editingJobDetails.who_can_apply || '',
          status: editingJobDetails.status as any,
          startDate: 'Immediately',
          experience: editingJobDetails.experience_min?.toString() || '0',
          experienceMin: editingJobDetails.experience_min?.toString() || '',
          experienceMax: editingJobDetails.experience_max?.toString() || '',
          logo: editingJobDetails.company_logo_url || null,
        }}
        isEdit={true}
        onPreview={(data: any) => {
          setFormData(data);
          setPageState("preview");
        }}
        onPublish={() => {
          handleJobPublished();
          setEditingJobDetails(null);
        }}
        onCancel={() => {
          setPageState("list");
          setEditingJobDetails(null);
        }}
      />
    );
  }

  // ============================
  // PREVIEW PAGE
  // ============================
  if (pageState === "preview") {
    return (
      <PreviewJobPage
        data={formData}
        onPublish={handleJobPublished}
        onBack={() => setPageState("add")}
      />
    );
  }
}

export default JobManagement