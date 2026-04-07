"use client";
import React from "react";

/* ===== INPUT STYLE ===== */
const resumeInput =
  "w-full px-4 py-2.5 rounded-xl bg-gray-100 text-gray-900 placeholder-gray-400 " +
  "border border-transparent " +
  "focus:outline-none focus:border-[#2557a7] focus:ring-0 transition-colors text-sm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PersonalInfoEditor = ({ formData, setFormData }: any) => {
  const fullName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim();

  const handleFullNameChange = (value: string) => {
    const parts = value.trim().split(" ");
    if (parts.length === 1) {
      setFormData({ ...formData, firstName: parts[0], lastName: "" });
    } else {
      const lastName = parts.pop();
      const firstName = parts.join(" ");
      setFormData({ ...formData, firstName, lastName });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* ================= LEFT FORM ================= */}
      <div className="md:col-span-2 space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            value={fullName}
            onChange={(e) => handleFullNameChange(e.target.value)}
            placeholder="Enter Full Name"
            className={resumeInput}
          />
        </div>

        {/* Email + Phone Number */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter Email"
              className={resumeInput}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Enter Phone Number"
              className={resumeInput}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-gray-700">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            value={formData.location || ""}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="Enter Location"
            className={resumeInput}
          />
        </div>

        {/* LinkedIn URL */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-gray-700">
            LinkedIn URL
          </label>
          <input
            value={formData.linkedinUrl || ""}
            onChange={(e) =>
              setFormData({ ...formData, linkedinUrl: e.target.value })
            }
            placeholder="Enter LinkedIn URL"
            className={resumeInput}
          />
        </div>

        {/* GitHub URL */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-gray-700">
            GitHub URL
          </label>
          <input
            value={formData.githubUrl || ""}
            onChange={(e) =>
              setFormData({ ...formData, githubUrl: e.target.value })
            }
            placeholder="Enter GitHub URL"
            className={resumeInput}
          />
        </div>
      </div>

      {/* ================= RIGHT TIPS ================= */}
      <div className="space-y-4">
        <div className="bg-[#f0f5ff] border border-[#2557a7]/15 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-[#2557a7] flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Tips</h3>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2557a7] mt-1.5 flex-shrink-0" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Always include your full name, professional email address, current phone number with voicemail, and city-state location to help recruiters contact you easily.
              </p>
            </div>
            <div className="flex gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2557a7] mt-1.5 flex-shrink-0" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Add LinkedIn profile and portfolio links only when they are current, professional, and showcase your work effectively to potential employers.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-500 text-sm">★</span>
            <h4 className="text-xs font-semibold text-amber-800">Pro Tip</h4>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            Use a professional email format like <span className="font-medium">firstname.lastname@email.com</span> to make a strong first impression.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoEditor;
