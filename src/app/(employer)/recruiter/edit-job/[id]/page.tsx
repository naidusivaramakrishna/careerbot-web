// File: src/app/(employer)/recruiter/edit-job/[id]/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import logger from '@/lib/logger';
import { recruiterAuthApi } from '@/api/recruiterAuthApiMain';

interface JobFormData {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryMin: string;
  salaryMax: string;
  closingDate: string;
  status: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
}

const EditJobPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Mid',
    salaryMin: '',
    salaryMax: '',
    closingDate: '',
    status: 'Active',
    description: '',
    responsibilities: [''],
    requirements: [''],
    benefits: ['']
  });

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setIsLoading(true);

        // Normalizers so dropdown values always match an option
        const normalizeLocation = (v: string) => {
          if (!v) return 'Remote';
          const l = v.toLowerCase();
          if (l === 'remote' || l === 'wfh') return 'Remote';
          if (l.includes('hybrid')) return 'Hybrid';
          return 'On-site';
        };
        const normalizeEmploymentType = (v: string) => {
          if (!v) return 'Full-time';
          const t = v.toLowerCase().replace(/[\s_-]/g, '');
          if (t.startsWith('full')) return 'Full-time';
          if (t.startsWith('part')) return 'Part-time';
          if (t.includes('contract')) return 'Contract';
          if (t.includes('intern')) return 'Internship';
          return 'Full-time';
        };
        const normalizeExperience = (v: string) => {
          if (!v) return 'Mid';
          const e = v.toLowerCase();
          if (e.includes('entry') || e.includes('junior') || e.includes('fresher')) return 'Entry';
          if (e.includes('senior') || e.includes('sr')) return 'Senior';
          if (e.includes('lead') || e.includes('principal')) return 'Lead';
          if (e.includes('executive') || e.includes('director')) return 'Executive';
          return 'Mid';
        };

        // Helper function to map job data to form fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapJobToFormData = (job: any) => {
          setFormData({
            title: job.title || '',
            department: job.category || 'Engineering',
            location: normalizeLocation(job.location || ''),
            employmentType: normalizeEmploymentType(job.type || ''),
            experienceLevel: normalizeExperience(job.experience || ''),
            salaryMin: job.salary?.split('-')[0]?.trim().replace(/[^0-9]/g, '') || '',
            salaryMax: job.salary?.split('-')[1]?.trim().replace(/[^0-9]/g, '') || '',
            closingDate: job.deadline || '',
            status: job.status || 'Active',
            description: job.description || job.job_description || '',
            responsibilities: job.responsibilities ? job.responsibilities.split('\n').filter((r: string) => r.trim()) : [''],
            requirements: job.skills ? job.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s) : [''],
            benefits: job.benefits ? job.benefits.split(',').map((b: string) => b.trim()).filter((b: string) => b) : ['']
          });
        };

        // First try to get from backend API using getMyJobs
        try {
          const response = await recruiterAuthApi.getMyJobs();
          if (response.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const job = response.data.find((j: any) => String(j.id) === String(jobId));
            if (job) {
              mapJobToFormData(job);
              return; // Found in backend, no need to check localStorage
            }
          }
        } catch (apiError) {
          logger.warn('Backend fetch failed, falling back to localStorage');
        }

        // Fallback to localStorage
        const storedJobs = localStorage.getItem("postedJobs");
        if (storedJobs) {
          const jobs = JSON.parse(storedJobs);
          // Use string comparison to handle both string UUIDs and number IDs
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const job = jobs.find((j: any) => String(j.id) === String(jobId));

          if (job) {
            mapJobToFormData(job);
          }
        }
      } catch (error) {
        logger.error('Error fetching job data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'responsibilities' | 'requirements' | 'benefits', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'responsibilities' | 'requirements' | 'benefits') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'responsibilities' | 'requirements' | 'benefits', index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty items from arrays
    const cleanedData = {
      ...formData,
      responsibilities: formData.responsibilities.filter(item => item.trim() !== ''),
      requirements: formData.requirements.filter(item => item.trim() !== ''),
      benefits: formData.benefits.filter(item => item.trim() !== '')
    };

    try {
      // Try to update via backend API first
      try {
        // Pass jobId as-is (could be string UUID or number)
        // Only send fields that have values to avoid 422 validation errors
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatePayload: any = {
          title: cleanedData.title,
          location: cleanedData.location,
          type: cleanedData.employmentType,
          experience: cleanedData.experienceLevel,
          description: cleanedData.description,
          responsibilities: cleanedData.responsibilities.join('\n'),
          deadline: cleanedData.closingDate,
          category: cleanedData.department,
          mode: cleanedData.location === 'Remote' ? 'Remote' : 'Work From Office',
        };

        // Only add optional fields if they have values
        if (cleanedData.salaryMin || cleanedData.salaryMax) {
          updatePayload.salary = `${cleanedData.salaryMin} - ${cleanedData.salaryMax}`;
        }
        if (cleanedData.requirements.length > 0) {
          updatePayload.skills = cleanedData.requirements.join(', ');
        }
        if (cleanedData.benefits.length > 0) {
          updatePayload.benefits = cleanedData.benefits.join(', ');
        }
        updatePayload.remote = cleanedData.location === 'Remote';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await recruiterAuthApi.updateJob(jobId as any, updatePayload);
        logger.info('Job updated in backend successfully');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (apiError: any) {
        logger.error('Backend update failed:', apiError.message);
        // Continue with localStorage update even if backend fails
      }

      // Always update localStorage
      const storedJobs = localStorage.getItem("postedJobs");
      if (storedJobs) {
        const jobs = JSON.parse(storedJobs);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedJobs = jobs.map((job: any) => {
          // Use string comparison to handle both string UUIDs and number IDs
          if (String(job.id) === String(jobId)) {
            return {
              ...job,
              title: cleanedData.title,
              location: cleanedData.location,
              type: cleanedData.employmentType,
              experience: cleanedData.experienceLevel,
              salary: `${cleanedData.salaryMin} - ${cleanedData.salaryMax}`,
              skills: cleanedData.requirements.join(', '),
              description: cleanedData.description,
              responsibilities: cleanedData.responsibilities.join('\n'),
              deadline: cleanedData.closingDate,
              category: cleanedData.department,
              status: cleanedData.status,
              benefits: cleanedData.benefits.join(', '),
            };
          }
          return job;
        });
        localStorage.setItem("postedJobs", JSON.stringify(updatedJobs));
        logger.info('Job updated in localStorage successfully');
      }

      alert('Job updated successfully!');
      router.push('/recruiter/posted-jobs');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error('Error updating job:', error);
      alert(error.message || 'Failed to update job. Please try again.');
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      router.push('/recruiter/posted-jobs');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/recruiter/posted-jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Posted Jobs
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Job Posting</h1>
              <p className="text-gray-600 mt-1">Job ID: {jobId}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Analytics">Analytics</option>
                  <option value="HR">Human Resources</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type *
                </label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => handleInputChange('employmentType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level *
                </label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Min (₹)
                </label>
                <input
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 600000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Max (₹)
                </label>
                <input
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1200000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Date
                </label>
                <input
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => handleInputChange('closingDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the role, what the candidate will do, and what makes this opportunity exciting..."
                required
              />
            </div>
          </div>

          {/* Responsibilities */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Responsibilities</h2>
              <button
                type="button"
                onClick={() => addArrayItem('responsibilities')}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {formData.responsibilities.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Responsibility ${index + 1}`}
                  />
                  {formData.responsibilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('responsibilities', index)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Requirements</h2>
              <button
                type="button"
                onClick={() => addArrayItem('requirements')}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {formData.requirements.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Requirement ${index + 1}`}
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('requirements', index)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Benefits</h2>
              <button
                type="button"
                onClick={() => addArrayItem('benefits')}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {formData.benefits.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Benefit ${index + 1}`}
                  />
                  {formData.benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('benefits', index)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 sticky bottom-0 bg-gray-50 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJobPage;