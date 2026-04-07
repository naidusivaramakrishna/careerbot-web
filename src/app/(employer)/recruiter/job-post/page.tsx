"use client";
import { useState, useEffect } from "react";
import { Upload, Plus, X, CheckCircle, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import logger from "@/lib/logger";
import { recruiterAuthApi } from "@/api/recruiterAuthApiMain";
import DashboardLayout from "../dashboard/_components/DashboardLayout";

type JobForm = {
  id?: number;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  salaryMax?: string;
  skills: string;
  description: string;
  responsibilities: string;
  deadline: string;
  remote: boolean;
  category: string;
  openings: string;
  mode: string;
  education: string;
  notice: string;
  benefits: string;
  postedDate?: string;
  status?: string;
  applicants?: number;
  contactEmail: string;
  contactPhone: string;
  companyWebsite: string;
  applicationUrl: string;
  hrContactPerson: string;
};

const jobTitleSuggestions = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "React Developer", "Node.js Developer", "Java Developer", "Data Analyst", "HR Recruiter", "Digital Marketing Executive",
];

const locationSuggestions = ["Bangalore", "Hyderabad", "Chennai", "Pune", "Mumbai", "Vijayawada", "Vizag", "Delhi", "Remote", "PAN India"];

const skillSuggestions = ["React", "Node.js", "JavaScript", "TypeScript", "Next.js", "MongoDB", "AWS", "Java", "Python"];

const benefitsSuggestions = [
  "Provident Fund (PF)", "Health Insurance", "Performance Bonus", "Work From Home Allowance",
  "Employee Wellness Program", "Paid Leaves", "Gratuity", "Learning & Certification Budget",
];

export default function PostJobPage() {
  const router = useRouter();
  const [form, setForm] = useState<JobForm>({
    title: "", company: "", location: "Bangalore", type: "Full-time", experience: "",
    salary: "", salaryMax: "", skills: "", description: "", responsibilities: "",
    deadline: "", remote: false, category: "", openings: "", mode: "Hybrid",
    education: "", notice: "", benefits: "",
    contactEmail: "", contactPhone: "", companyWebsite: "", applicationUrl: "", hrContactPerson: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      if (!isLoggedIn) {
        window.location.href = "/recruiter/auth";
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    setErrors({ ...errors, [name]: "" });
  };

  const addSkill = () => {
    if (skillInput.trim() && !skillsList.includes(skillInput)) {
      setSkillsList([...skillsList, skillInput]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkillsList(skillsList.filter(s => s !== skill));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file is an image
      if (!file.type.startsWith('image/')) {
        setApiError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setApiError('Logo file size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      logger.debug('Logo file selected:', file.name, file.size);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const requiredFields = ["title", "company", "location", "type", "experience", "salary", "description", "responsibilities", "deadline", "category", "openings", "mode", "contactEmail", "contactPhone", "hrContactPerson"];

    requiredFields.forEach(f => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(form as any)[f]?.trim()) newErrors[f] = "Required field";
    });

    if (skillsList.length === 0) newErrors.skills = "Add at least one skill";
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      newErrors.contactEmail = "Invalid email format";
    }
    if (form.contactPhone && !/^[0-9]{10}$/.test(form.contactPhone.replace(/[\s-]/g, ''))) {
      newErrors.contactPhone = "Invalid phone number (10 digits)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    // Show confirmation dialog instead of immediately submitting
    setShowPublishConfirm(true);
  };

  const handleConfirmPublish = async () => {
    setLoading(true);
    setShowPublishConfirm(false);

    try {
      // Validate all fields are filled
      if (!form.title?.trim()) throw new Error('Job title is required');
      if (!form.company?.trim()) throw new Error('Company name is required');
      if (!form.location?.trim()) throw new Error('Location is required');
      if (!form.type?.trim()) throw new Error('Job type is required');
      if (!form.experience?.trim()) throw new Error('Experience is required');
      if (!form.salary?.trim()) throw new Error('Salary is required');
      if (!form.description?.trim()) throw new Error('Job description is required');
      if (!form.responsibilities?.trim()) throw new Error('Company information is required');
      if (!form.deadline?.trim()) throw new Error('Application deadline is required');
      if (!form.category?.trim()) throw new Error('Job category is required');
      if (!form.openings?.trim()) throw new Error('Number of openings is required');
      if (!form.mode?.trim()) throw new Error('Work mode is required');
      if (!form.contactEmail?.trim()) throw new Error('Contact email is required');
      if (!form.contactPhone?.trim()) throw new Error('Contact phone is required');
      if (!form.hrContactPerson?.trim()) throw new Error('HR contact person is required');
      if (skillsList.length === 0) throw new Error('At least one skill is required');

      // Parse salary values for potential object format
      const salaryMin = parseInt(form.salary, 10);
      const salaryMax = form.salaryMax ? parseInt(form.salaryMax, 10) : salaryMin;

      if (isNaN(salaryMin)) throw new Error('Minimum salary must be a valid number');
      if (isNaN(salaryMax)) throw new Error('Maximum salary must be a valid number');
      if (salaryMax < salaryMin) throw new Error('Maximum salary must be greater than minimum salary');

      const openingsNum = parseInt(form.openings, 10);
      if (isNaN(openingsNum) || openingsNum < 1) throw new Error('Number of openings must be at least 1');

      // Format experience properly - ensure it has proper spacing and format like "1 - 2 years"
      let experienceFormatted = form.experience.trim();
      // If experience doesn't contain "years", add it
      if (!experienceFormatted.toLowerCase().includes('years')) {
        experienceFormatted = `${experienceFormatted} years`;
      }
      // Ensure proper spacing around dash
      experienceFormatted = experienceFormatted.replace(/\s*-\s*/g, ' - ');

      // Prepare job data - send only essential fields to avoid validation errors
      const jobData = {
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location.trim(),
        type: form.type.trim(),
        experience: experienceFormatted,
        salary: form.salaryMax
          ? `${form.salary} - ${form.salaryMax}`
          : form.salary,
        skills: skillsList.join(", "),
        job_description: form.description.trim(),
        responsibilities: form.responsibilities.trim(),
        deadline: form.deadline.trim(),
        remote: form.remote === true,
        category: form.category.trim(),
        openings: form.openings.trim(),
        mode: form.mode.trim(),
        education: form.education?.trim() || "",
        notice: form.notice?.trim() || "",
        benefits: form.benefits?.trim() || "",
        contact_email: form.contactEmail.trim(),
        contact_phone: form.contactPhone.replace(/[\s-]/g, ''),
        hr_contact_person: form.hrContactPerson.trim(),
        company_website: form.companyWebsite?.trim() || "",
        application_url: form.applicationUrl?.trim() || "",
      };

      logger.debug('Sending job data to API:', JSON.stringify(jobData, null, 2));

      // Send to backend API: POST /api/v1/jobs/
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await recruiterAuthApi.createJob(jobData as any);
      logger.debug('API Response:', response);

      // Create job object for local storage
      const newJob = {
        ...form,
        id: response.data?.id || Date.now(),
        postedDate: response.data?.created_at || new Date().toISOString(),
        status: "active",
        applicants: 0,
        newApplicants: 0,
        verifiedApplicants: 0,
        skills: skillsList.join(", "),
      };

      logger.debug('Saving job to localStorage:', newJob);

      // Update localStorage with new job
      const existingJobs = JSON.parse(localStorage.getItem("postedJobs") || "[]");
      existingJobs.push(newJob);
      localStorage.setItem("postedJobs", JSON.stringify(existingJobs));

      logger.debug('Jobs in localStorage:', existingJobs);

      setSubmitted(true);
      setLoading(false);
      // Redirect to posted jobs page with success flag
      setTimeout(() => {
        router.push('/recruiter/posted-jobs?jobPublished=true');
      }, 500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error('Job posting error:', error);

      // Extract detailed error information
      const errorData = error.response?.data;
      const statusCode = error.response?.status;
      const errorMsg = errorData?.message || errorData?.detail || error.message;
      let msg = errorMsg || 'Failed to post job. Please try again.';

      logger.error('Error message:', msg);
      logger.error('Full error response:', JSON.stringify(errorData, null, 2));
      logger.error('Status code:', statusCode);
      console.error('=== FULL ERROR DETAILS ===');
      console.error('Status:', statusCode);
      console.error('Response Data:', errorData);

      // Handle specific error codes
      if (statusCode === 409) {
        msg = 'A job with similar details already exists. Please check your posted jobs or modify the job details.';
      } else if (statusCode === 422) {
        msg = `Validation error: ${errorData?.message || 'Please check all required fields are filled correctly.'}`;
      } else if (msg.includes('Session expired') || msg.includes('Authentication required')) {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('access_token');
        localStorage.removeItem('isLoggedIn');
        setApiError('Session expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/recruiter/auth';
        }, 2000);
        return;
      }

      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setApiError(null);
    setDraftSaved(false);

    // Validate at least title and description
    if (!form.title?.trim()) {
      setApiError('Job title is required for draft');
      return;
    }
    if (!form.description?.trim()) {
      setApiError('Job description is required for draft');
      return;
    }

    try {
      // Prepare draft job data
      const draftJobData = {
        ...form,
        status: 'draft',
        skills: skillsList.length > 0 ? skillsList.join(', ') : form.skills,
        postedDate: new Date().toISOString(),
        id: form.id || Date.now(),
        applicants: 0,
        newApplicants: 0,
        verifiedApplicants: 0,
      };

      logger.debug('Saving draft job:', draftJobData);

      // Save to localStorage under 'draftJobs'
      const existingDrafts = JSON.parse(localStorage.getItem('draftJobs') || '[]');

      // Check if this draft already exists and update it, or add new
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const draftIndex = existingDrafts.findIndex((d: any) => d.id === form.id);
      if (draftIndex >= 0) {
        existingDrafts[draftIndex] = draftJobData;
        logger.debug('Updated existing draft');
      } else {
        existingDrafts.push(draftJobData);
        logger.debug('Created new draft');
      }

      localStorage.setItem('draftJobs', JSON.stringify(existingDrafts));

      logger.info('✅ Draft saved successfully');
      setDraftSaved(true);

      // Show success message for 2 seconds
      setTimeout(() => {
        setDraftSaved(false);
      }, 2000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error('Error saving draft:', error);
      setApiError('Failed to save draft. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Post Job</h1>
            <p className="text-gray-600 text-sm mt-1">Create a new job posting</p>
          </div>
          <button
            onClick={() => window.location.href = '/recruiter/dashboard'}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Preview
          </button>
        </div>

        {submitted && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
            <span className="font-medium">Job Posted Successfully! Redirecting...</span>
          </div>
        )}

        {draftSaved && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
            <span className="font-medium">Draft Saved Successfully!</span>
          </div>
        )}

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error: {apiError}</p>
            <p className="text-sm mt-2">Please check your internet connection and try again. Check the browser console (F12) for more details.</p>
          </div>
        )}

        {Object.keys(errors).length > 0 && !apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium mb-2">Please fix the following errors:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{field.charAt(0).toUpperCase() + field.slice(1)}: {error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6 pb-24">
          {/* Main Form - 2 columns */}
          <div className="col-span-2 space-y-6">
            {/* Job Title & Company */}
            <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-gray-200">
              <FormField label="Job Title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Senior Frontend Developer" error={errors.title} />
              <FormField label="Company" name="company" value={form.company} onChange={handleChange} placeholder="e.g., InteliCore Pvt Ltd" error={errors.company} />
            </div>

            {/* Location & Work Mode */}
            <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-gray-200">
              <FormField label="Location" name="location" value={form.location} onChange={handleChange} placeholder="e.g., Bangalore" error={errors.location} />
              <FormSelect label="Work Mode" name="mode" value={form.mode} onChange={handleChange} options={["Work From Office", "Hybrid", "Remote"]} error={errors.mode} />
            </div>

            {/* Salary Range */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-4">Salary Range (LPA)</label>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Min</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">₹</span>
                    <input type="number" name="salary" value={form.salary} onChange={handleChange} placeholder="6,00,000" className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Max</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">₹</span>
                    <input type="number" name="salaryMax" value={form.salaryMax} onChange={handleChange} placeholder="8,00,000" className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              </div>
              {errors.salary && <p className="text-red-500 text-xs mt-2">{errors.salary}</p>}
            </div>

            {/* Job Type & Openings */}
            <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-gray-200">
              <FormSelect label="Job Type" name="type" value={form.type} onChange={handleChange} options={["Full-time", "Part-time", "Contract", "Internship"]} error={errors.type} />
              <FormField label="Number of openings" name="openings" type="number" value={form.openings} onChange={handleChange} placeholder="e.g., 5" error={errors.openings} />
            </div>

            {/* Experience & Category */}
            <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-gray-200">
              <FormField label="Experience Required" name="experience" value={form.experience} onChange={handleChange} placeholder="e.g., 2-3 years" error={errors.experience} />
              <FormField label="Job Category" name="category" value={form.category} onChange={handleChange} placeholder="e.g., Engineering, Sales, HR" error={errors.category} />
            </div>

            {/* Job Description */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <FormTextarea label="Job Description" name="description" value={form.description} onChange={handleChange} placeholder="Describe the role, responsibilities, and requirements...." rows={5} error={errors.description} />
            </div>

            {/* About Company */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <FormTextarea label="About Company" name="responsibilities" value={form.responsibilities} onChange={handleChange} placeholder="Explain briefly about your company....." rows={4} error={errors.responsibilities} />
            </div>

            {/* Skills */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">Skills</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={addSkill} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                  Add
                </button>
              </div>
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill) => (
                    <span key={skill} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-blue-900">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.skills && <p className="text-red-500 text-xs mt-2">{errors.skills}</p>}
            </div>

            {/* Bottom Action Buttons - Inside Form */}
            <div className="flex justify-end gap-4 bg-white p-6 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition font-medium bg-blue-50"
              >
                💾 Save as Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Publishing..." : "Publish Job"}
              </button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-1 space-y-6">
            {/* Company Logo Upload */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Company Logo</label>
              <p className="text-sm text-gray-600 mb-4">Upload your company logo</p>
              <input
                type="file"
                id="logoUpload"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-48 object-contain bg-gray-50 rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoPreview(null);
                      const input = document.getElementById('logoUpload') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => document.getElementById('logoUpload')?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click or Drag & drop to upload logo</p>
                </div>
              )}
            </div>

            {/* Application Settings */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
              <h3 className="font-semibold text-gray-900">Application Settings</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                <input type="url" name="companyWebsite" value={form.companyWebsite} onChange={handleChange} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
                <input type="date" name="deadline" value={form.deadline} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Who can apply</label>
                <input type="text" placeholder="e.g., All candidates" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                  <option>Draft</option>
                  <option>Published</option>
                </select>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
              <h3 className="font-semibold text-gray-900">Contact Details</h3>

              <FormField label="Contact Email" type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} placeholder="hr@company.com" error={errors.contactEmail} />
              <FormField label="Contact Phone" name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="10 digit number" error={errors.contactPhone} />
              <FormField label="HR Contact Person" name="hrContactPerson" value={form.hrContactPerson} onChange={handleChange} placeholder="Name" error={errors.hrContactPerson} />
            </div>
          </div>
        </form>

        {/* Publish Confirmation Modal */}
        {showPublishConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Dimmed Background Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40"></div>

            {/* Modal Dialog */}
            <div className="bg-white rounded-lg shadow-2xl p-8 border border-gray-300 w-full max-w-md mx-4 relative z-50">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Are you sure you want to publish?</h2>
                <p className="text-gray-600 text-sm mb-6">Publishing will make your job posting visible to all careerbot applicants.</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowPublishConfirm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPublish}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Publishing..." : "Publish"}
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Reusable Components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormField({ label, name, type = "text", value, onChange, placeholder, error }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormSelect({ label, name, value, onChange, options, error }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'}`}
      >
        <option value="">Select</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FormTextarea({ label, name, value, onChange, placeholder, rows = 4, error }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${error ? 'border-red-500' : 'border-gray-300'}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
