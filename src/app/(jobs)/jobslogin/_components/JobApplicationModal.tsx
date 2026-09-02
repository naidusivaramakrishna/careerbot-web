

"use client";
import { useRouter } from "next/navigation";
// const router = useRouter();
import { useRef, useState } from "react";
import { X, FileText, CheckCircle, Check, } from "lucide-react";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  job: any;
  onClose: () => void;
}

export default function JobApplicationModal({ job, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
const router = useRouter();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleReplaceResume = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // allow only pdf & docx
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF or DOCX file only");
      return;
    }

    setResumeFile(file);
  };

  const formatFileSize = (bytes: number) =>
    `${(bytes / 1024).toFixed(1)} KB`;

  const handleSubmit = () => {
    setShowSuccess(true);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-[760px] max-h-[90vh] rounded-2xl shadow-xl overflow-y-auto">
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-start p-6 border-b">
          <div className="flex gap-4">
            <img
              src={job.logo}
              alt={job.company}
              className="w-12 h-12 rounded"
            />

            <div>
              <h2 className="text-lg font-semibold">{job.title}</h2>
              <p className="text-sm text-gray-600">{job.company}</p>

              {/* Pills */}
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600">
                <span className="px-2 py-1 bg-gray-100 rounded-md">
                  📍 {job.location}
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded-md">
                  💰 {job.salary}
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded-md">
                  🧑‍💼 {job.experience}
                </span>
              </div>
            </div>
          </div>

          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="p-6">
          {/* Job preview */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">About the role</h3>
            <p className="text-sm text-gray-700 mb-3">{job.about}</p>

            <p className="font-semibold mb-2">Key responsibilities</p>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {job.responsibilities.map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <button className="mt-2 text-sm text-blue-600 hover:underline">
              View full job description →
            </button>
          </div>

          {/* ================= APPLICATION CARD ================= */}
          <div className="border rounded-xl p-5 bg-gray-50">
            <h3 className="font-semibold mb-4">Submit Your Application</h3>

            {/* Pre-screening */}
            <div className="grid grid-cols-2 gap-6 text-sm mb-6">
              <div>
                <p className="font-medium mb-2">
                  Are you available to join immediately?
                </p>
                <label className="mr-4">
                  <input type="radio" name="join" defaultChecked /> Yes
                </label>
                <label>
                  <input type="radio" name="join" /> No
                </label>
              </div>

              <div>
                <p className="font-medium mb-2">
                  Do you have a working laptop and internet?
                </p>
                <label className="mr-4">
                  <input type="radio" name="laptop" defaultChecked /> Yes
                </label>
                <label>
                  <input type="radio" name="laptop" /> No
                </label>
              </div>
            </div>

            {/* Notice period */}
            <div className="mb-4">
              <label className="font-medium text-sm mb-1 block">
                Do you have a notice period?
              </label>
              <select className="w-full border rounded-md px-3 py-2 text-sm">
                <option>Select notice period</option>
                <option>Immediate</option>
                <option>15 days</option>
                <option>30 days</option>
                <option>60 days</option>
              </select>
            </div>

            {/* Portfolio */}
            <div className="mb-4">
              <label className="font-medium text-sm mb-1 block">
                Portfolio / Project link
              </label>
              <input
                type="text"
                placeholder="Paste your Behance / Dribbble link"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
            </div>

            {/* ================= RESUME (UPDATED UI ONLY) ================= */}
            <div className="mb-4">
              <label className="font-medium text-sm mb-2 block">
                Resume
              </label>

              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center bg-red-100 rounded">
                    <FileText className="text-red-600" size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      {resumeFile
                        ? resumeFile.name
                        : "No resume uploaded"}
                    </p>
                    {resumeFile && (
                      <p className="text-xs text-gray-500">
                        {formatFileSize(resumeFile.size)}
                      </p>
                    )}
                  </div>
                </div>

                {resumeFile && (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    <CheckCircle size={14} />
                    Auto-attached
                  </span>
                )}
              </div>

              <button
                onClick={handleReplaceResume}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Replace resume
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="font-medium text-sm mb-1 block">
                Attachments / Project document
              </label>
              <div className="border border-dashed rounded-md p-4 text-center text-sm text-gray-500 bg-white">
                Upload additional documents
              </div>
            </div>
          </div>


          {/* ================= FOOTER ================= */}
          <div className="flex justify-end gap-3 mt-6">
            <button className="px-4 py-2 border rounded-md text-sm">
              Save Job for Later
            </button>
            <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
              >
                Submit Application
              </button>
          </div>
        </div>
      </div>
    </div>
    {/* ================= SUCCESS POPUP (TOP LAYER) ================= */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative bg-white w-[420px] rounded-2xl shadow-xl p-6 text-center">
            {/* Success Icon */}
            <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="text-green-600" size={28} />
            </div>

            <h2 className="text-lg font-semibold mb-1">
              Application Submitted Successfully!
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Your application has been sent to the employer.
            </p>

            {/* Job Card */}
            <div className="border rounded-xl p-4 mb-4 text-left">
              <h3 className="text-sm font-semibold">{job.title}</h3>
              <p className="text-xs text-gray-500">{job.company}</p>

              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className="px-2 py-1 bg-gray-100 rounded">
                  📍 {job.location}
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded">
                  💰 {job.salary}
                </span>
              </div>

              <p className="text-xs text-gray-600 mt-3">
                What happens next?
              </p>
              <ul className="text-xs text-gray-600 list-disc pl-4 mt-1">
                <li>Your application will be reviewed</li>
                <li>You’ll receive updates on status</li>
                <li>Track progress from dashboard</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              {/* <button className="px-4 py-2 border rounded-md text-sm">
                Track application
              </button> */}


              <button
  onClick={() => router.push(`/applications/${job.id}`)}
  className="px-4 py-2 border rounded-md text-sm"
>
  Track application
</button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
              >
                Browse more jobs
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
