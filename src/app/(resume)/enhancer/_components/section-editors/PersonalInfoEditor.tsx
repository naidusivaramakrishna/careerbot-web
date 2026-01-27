"use client";
import React from "react";

/* ===== INPUT STYLE ===== */
const resumeInput =
  "w-full px-5 py-3.5 rounded-xl bg-gray-100 text-gray-900 placeholder-gray-400 " +
  "border border-transparent " +
  "focus:outline-none focus:ring-0 transition-colors duration-200 text-base";

const PersonalInfoEditor = ({ formData, setFormData }: any) => {
  // Combine firstName and lastName for Full Name display
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
      <div className="md:col-span-2 space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
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
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
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
            <label className="block text-sm font-semibold mb-2 text-gray-700">
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
          <label className="block text-sm font-semibold mb-2 text-gray-700">
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
          <label className="block text-sm font-semibold mb-2 text-gray-700">
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
          <label className="block text-sm font-semibold mb-2 text-gray-700">
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
      <div className="space-y-4 text-sm text-gray-700">
        <h3 className="font-semibold text-gray-900 text-base">Tips</h3>

        <p>
          Always include your full name, professional email address, current phone number with voicemail, and city-state location to help recruiters contact you for interviews easily.
        </p>

        <p>
          Add LinkedIn profile and portfolio links only when they are current, professional, relevant to your industry, and showcase your work effectively to potential employers consistently.
        </p>
      </div>
    </div>
  );
};

export default PersonalInfoEditor;