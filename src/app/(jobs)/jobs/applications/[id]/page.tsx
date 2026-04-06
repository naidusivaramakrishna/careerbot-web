







// "use client";

// import { useParams } from "next/navigation";
// import { CheckCircle } from "lucide-react";
// import { jobs } from "@/app/jobs/data/jobs";
// import LeftSidebar from "@/app/jobs/_components/LeftSidebar";

// export default function ApplicationTrackingPage() {
//   const params = useParams();
//   const id = params.id as string;

//   const job = jobs.find((j) => j.id === id);

//   if (!job) {
//     return <div className="p-10">Application not found</div>;
//   }

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       {/* ================= LEFT SIDEBAR ================= */}
//       <LeftSidebar />

//       {/* ================= MAIN CONTENT ================= */}
//       <div className="flex-1 p-8">
//         {/* ================= HEADER ================= */}
//         <div className="bg-white rounded-xl shadow p-6 mb-6">
//           <div className="flex items-center gap-4">
//             <img
//               src={job.logo}
//               alt={job.company}
//               className="w-12 h-12 rounded"
//             />

//             <div>
//               <h1 className="text-xl font-semibold">{job.title}</h1>
//               <p className="text-sm text-gray-600">{job.company}</p>

//               <div className="flex gap-3 text-xs mt-2 text-gray-600">
//                 <span>📍 {job.location}</span>
//                 <span>💰 {job.salary}</span>
//                 <span>🕒 Applied Dec 5, 2025</span>
//               </div>
//             </div>

//             <span className="ml-auto text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
//               Applied
//             </span>
//           </div>
//         </div>

//         {/* ================= CONTENT ================= */}
//         <div className="grid grid-cols-12 gap-6">
//           {/* ========== LEFT SIDE ========= */}
//           <div className="col-span-8 bg-white rounded-xl shadow p-6">
//             <h2 className="font-semibold mb-2">Job Description</h2>
//             <p className="text-sm text-gray-700 mb-4">{job.about}</p>

//             <h3 className="font-semibold mb-2">Requirements</h3>
//             <ul className="list-disc pl-5 text-sm text-gray-700 mb-6">
//               {job.requirements?.map((req: string) => (
//                 <li key={req}>{req}</li>
//               ))}
//             </ul>

//             <h3 className="font-semibold mb-2">Your Answers</h3>

//             <div className="border rounded-md p-3 text-sm mb-3">
//               <p className="font-medium">Available to join immediately?</p>
//               <p className="text-gray-600">Yes</p>
//             </div>

//             <div className="border rounded-md p-3 text-sm mb-6">
//               <p className="font-medium">Notice period</p>
//               <p className="text-gray-600">15 days</p>
//             </div>

//             <h3 className="font-semibold mb-2">Attachments</h3>
//             <div className="border rounded-md p-3 flex items-center gap-3 text-sm">
//               📄 Gowtham_UIUX_Designer.pdf
//               <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">
//                 PDF
//               </span>
//             </div>
//           </div>

//           {/* ========== RIGHT SIDE ========= */}
//           <div className="col-span-4 bg-white rounded-xl shadow p-6">
//             <h3 className="font-semibold mb-4">Application Progress</h3>

//             <div className="space-y-4 text-sm">
//               <ProgressItem active label="Application Submitted" />
//               <ProgressItem label="Resume Screening" />
//               <ProgressItem label="Phone Interview" />
//               <ProgressItem label="Technical Interview" />
//               <ProgressItem label="Final Interview" />
//               <ProgressItem label="Decision" />
//             </div>

//             <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
//               <p className="font-medium">Next Step</p>
//               <p className="text-gray-600">
//                 Your resume is being reviewed by the hiring team.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ================= PROGRESS ITEM ================= */
// function ProgressItem({
//   label,
//   active,
// }: {
//   label: string;
//   active?: boolean;
// }) {
//   return (
//     <div className="flex items-center gap-3">
//       <div
//         className={`w-5 h-5 rounded-full flex items-center justify-center ${
//           active ? "bg-green-500 text-white" : "border border-gray-300"
//         }`}
//       >
//         {active && <CheckCircle size={14} />}
//       </div>

//       <span className={active ? "font-medium" : "text-gray-600"}>
//         {label}
//       </span>
//     </div>
//   );
// }










// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { CheckCircle, ArrowLeft } from "lucide-react";
// import { jobs } from "@/app/jobs/data/jobs";
// import LeftSidebar from "@/app/jobs/_components/LeftSidebar";

// export default function ApplicationTrackingPage() {
//   const params = useParams();
//   const id = params.id as string;

//   const job = jobs.find((j) => j.id === id);

//   if (!job) {
//     return <div className="p-10">Application not found</div>;
//   }

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       {/* ================= LEFT SIDEBAR ================= */}
//       <LeftSidebar />

//       {/* ================= MAIN CONTENT ================= */}
//       <div className="flex-1 p-8">
//         {/* ================= BACK TO JOBS ================= */}
//         <Link
//           href="/jobs"
//           className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4"
//         >
//           <ArrowLeft size={16} />
//           Back to Jobs
//         </Link>

//         {/* ================= HEADER ================= */}
//         <div className="bg-white rounded-xl shadow p-6 mb-6">
//           <div className="flex items-center gap-4">
//             <img
//               src={job.logo}
//               alt={job.company}
//               className="w-12 h-12 rounded"
//             />

//             <div>
//               <h1 className="text-xl font-semibold">{job.title}</h1>
//               <p className="text-sm text-gray-600">{job.company}</p>

//               <div className="flex gap-3 text-xs mt-2 text-gray-600">
//                 <span>📍 {job.location}</span>
//                 <span>💰 {job.salary}</span>
//                 <span>🕒 Applied Dec 5, 2025</span>
//               </div>
//             </div>

//             <span className="ml-auto text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
//               Applied
//             </span>
//           </div>
//         </div>

//         {/* ================= CONTENT ================= */}
//         <div className="grid grid-cols-12 gap-6">
//           {/* ========== LEFT SIDE ========= */}
//           <div className="col-span-8 bg-white rounded-xl shadow p-6">
//             <h2 className="font-semibold mb-2">Job Description</h2>
//             <p className="text-sm text-gray-700 mb-4">{job.about}</p>

//             <h3 className="font-semibold mb-2">Requirements</h3>
//             <ul className="list-disc pl-5 text-sm text-gray-700 mb-6">
//               {job.requirements?.map((req: string) => (
//                 <li key={req}>{req}</li>
//               ))}
//             </ul>

//             <h3 className="font-semibold mb-2">Your Answers</h3>

//             <div className="border rounded-md p-3 text-sm mb-3">
//               <p className="font-medium">Available to join immediately?</p>
//               <p className="text-gray-600">Yes</p>
//             </div>

//             <div className="border rounded-md p-3 text-sm mb-6">
//               <p className="font-medium">Notice period</p>
//               <p className="text-gray-600">15 days</p>
//             </div>

//             <h3 className="font-semibold mb-2">Attachments</h3>
//             <div className="border rounded-md p-3 flex items-center gap-3 text-sm">
//               📄 Gowtham_UIUX_Designer.pdf
//               <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">
//                 PDF
//               </span>
//             </div>
//           </div>

//           {/* ========== RIGHT SIDE ========= */}
//           <div className="col-span-4 bg-white rounded-xl shadow p-6">
//             <h3 className="font-semibold mb-4">Application Progress</h3>

//             <div className="space-y-4 text-sm">
//               <ProgressItem active label="Application Submitted" />
//               <ProgressItem label="Resume Screening" />
//               <ProgressItem label="Phone Interview" />
//               <ProgressItem label="Technical Interview" />
//               <ProgressItem label="Final Interview" />
//               <ProgressItem label="Decision" />
//             </div>

//             <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
//               <p className="font-medium">Next Step</p>
//               <p className="text-gray-600">
//                 Your resume is being reviewed by the hiring team.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ================= PROGRESS ITEM ================= */
// function ProgressItem({
//   label,
//   active,
// }: {
//   label: string;
//   active?: boolean;
// }) {
//   return (
//     <div className="flex items-center gap-3">
//       <div
//         className={`w-5 h-5 rounded-full flex items-center justify-center ${
//           active ? "bg-green-500 text-white" : "border border-gray-300"
//         }`}
//       >
//         {active && <CheckCircle size={14} />}
//       </div>

//       <span className={active ? "font-medium" : "text-gray-600"}>
//         {label}
//       </span>
//     </div>
//   );
// }













"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle, ArrowLeft, Phone, Calendar, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { httpClient } from "@/lib/http";

interface ApplicationResponse {
  id: string;
  job_id: string;
  job_title?: string;
  company?: string;
  location?: string;
  salary?: string;
  phone_number: string;
  experience_years: string;
  notice_period: string;
  cover_letter: string;
  status: "pending" | "accepted" | "rejected" | "interview";
  applied_at: string;
  reviewed_at?: string;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending Review" },
  interview: { bg: "bg-blue-50", text: "text-blue-700", label: "Interview Scheduled" },
  accepted: { bg: "bg-green-50", text: "text-green-700", label: "Accepted" },
  rejected: { bg: "bg-red-50", text: "text-red-700", label: "Not Selected" },
};

const progressSteps = [
  { label: "Application Submitted", key: "submitted" },
  { label: "Resume Screening", key: "screening" },
  { label: "Phone Interview", key: "phone" },
  { label: "Technical Interview", key: "technical" },
  { label: "Final Interview", key: "final" },
  { label: "Decision", key: "decision" },
];

export default function ApplicationTrackingPage() {
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<ApplicationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch application details from API
  useEffect(() => {
    if (!id) return;

    const fetchApplication = async () => {
      try {
        setLoading(true);
        const response = await httpClient.get<{ data: ApplicationResponse }>(
          `/jobs/${id}/application`
        );
        setApplication(response.data.data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching application:", err);
        if (err.response?.status === 404) {
          setError("Application not found");
        } else {
          setError("Failed to load application details");
        }
        toast.error("Could not load application");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">{error || "Application not found"}</h2>
          <p className="text-gray-600 mb-6">The application you're looking for doesn't exist.</p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = statusColors[application.status] || statusColors.pending;
  const appliedDate = new Date(application.applied_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* BACK TO JOBS */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeft size={16} />
        Back to Jobs
      </Link>

      {/* HEADER */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{application.job_title || "Job Application"}</h1>
            <p className="text-gray-600 mt-1">{application.company || "Company"}</p>

            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-4">
              {application.location && (
                <span className="flex items-center gap-1">📍 {application.location}</span>
              )}
              {application.salary && (
                <span className="flex items-center gap-1">💰 {application.salary}</span>
              )}
              <span className="flex items-center gap-1">🕒 Applied {appliedDate}</span>
            </div>
          </div>

          <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT SIDE - YOUR APPLICATION */}
        <div className="col-span-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-6">Your Application</h2>

          {/* Phone Number */}
          <div className="border rounded-lg p-4 mb-4 flex items-start gap-3">
            <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
              <p className="text-gray-900 font-medium">{application.phone_number}</p>
            </div>
          </div>

          {/* Experience */}
          <div className="border rounded-lg p-4 mb-4 flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Years of Experience</p>
              <p className="text-gray-900 font-medium">{application.experience_years}</p>
            </div>
          </div>

          {/* Notice Period */}
          <div className="border rounded-lg p-4 mb-4 flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notice Period</p>
              <p className="text-gray-900 font-medium">{application.notice_period}</p>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="border rounded-lg p-4 mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Cover Letter</p>
            <p className="text-gray-700 whitespace-pre-wrap">
              {application.cover_letter || "No cover letter provided"}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              ✓ Your application has been submitted to the recruiter and is being reviewed.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - PROGRESS */}
        <div className="col-span-4 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-6">Application Progress</h3>

          <div className="space-y-4 mb-6">
            {progressSteps.map((step, idx) => (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    idx === 0 ? "bg-green-500 text-white" : "border-2 border-gray-300"
                  }`}
                >
                  {idx === 0 && <CheckCircle size={16} />}
                </div>
                <span className={idx === 0 ? "font-semibold text-gray-900" : "text-gray-600"}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* STATUS BOX */}
          <div className={`p-4 rounded-lg ${statusConfig.bg}`}>
            <p className={`font-semibold ${statusConfig.text} mb-1`}>{statusConfig.label}</p>
            <p className="text-sm text-gray-700">
              {application.status === "pending"
                ? "Your application is under review. We'll notify you soon."
                : application.status === "interview"
                ? "You have an interview scheduled. Check your email for details."
                : application.status === "accepted"
                ? "Congratulations! You've been selected. Check your email."
                : "Thank you for your interest. We've decided to move forward with other candidates."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
