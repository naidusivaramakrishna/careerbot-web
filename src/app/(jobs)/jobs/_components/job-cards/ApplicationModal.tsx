"use client";

import { useState, useEffect } from "react";
import { X, Check, Lock, Briefcase, MapPin, Users } from "lucide-react";

interface ApplicationModalProps {
  isOpen: boolean;
  jobTitle: string;
  jobCompany?: string;
  location?: string;
  jobType?: string;
  recruiterName?: string;
  onClose: () => void;
  onSubmit: (data: ApplicationData) => Promise<void>;
  isLoading: boolean;
}

export interface ApplicationData {
  cover_letter: string;
  experience_years: string;
  notice_period: string;
  phone_number: string;
}

export default function ApplicationModal({
  isOpen,
  jobTitle,
  jobCompany = "Company",
  location = "Location not specified",
  jobType = "Full Time",
  recruiterName = "Recruiter",
  onClose,
  onSubmit,
  isLoading,
}: ApplicationModalProps) {
  const [formData, setFormData] = useState<ApplicationData>({
    cover_letter: "",
    experience_years: "",
    notice_period: "",
    phone_number: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);


  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading && !showSuccess) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isOpen, isLoading, showSuccess, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setShowSuccess(true);

    // Auto-close after 1.5 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setFormData({
        cover_letter: "",
        experience_years: "",
        notice_period: "",
        phone_number: "",
      });
      onClose();
    }, 1500);
  };

  // Handle click outside modal to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading && !showSuccess) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Success state
  if (showSuccess) {
    return (
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Application Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your details have been shared with the recruiter.
          </p>
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Your data is securely shared only with the recruiter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300 transition-all">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close"
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition z-10"
        >
          <X size={24} />
        </button>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-0 h-full">
          {/* Left Column - Apply To */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-12 border-r border-gray-200 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-8">
              Apply To:
            </h3>

            {/* Company Logo/Icon */}
            <div className="mb-8 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                {jobCompany.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{jobCompany}</h2>
              </div>
            </div>

            {/* Job Title */}
            <div className="mb-12">
              <h4 className="font-semibold text-gray-900 text-2xl">{jobTitle}</h4>
            </div>

            {/* Job Details */}
            <div className="space-y-8 flex-1">
              {/* Location */}
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</p>
                  <p className="text-base text-gray-700 font-medium mt-1">{location}</p>
                </div>
              </div>

              {/* Job Type */}
              <div className="flex items-start gap-4">
                <Briefcase className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Job Type</p>
                  <p className="text-base text-gray-700 font-medium mt-1">{jobType}</p>
                </div>
              </div>

              {/* Recruiter */}
              <div className="flex items-start gap-4">
                <Users className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">About Your Recruiter</p>
                  <p className="text-base text-gray-700 font-medium mt-1">{recruiterName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Application Form */}
          <div className="p-12 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-8">
              Your Application
            </h3>

            <p className="text-base text-gray-600 mb-8">
              Please fill out the information below to apply for this position.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  placeholder="+91-9876543210"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={isLoading}
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Years of Experience
                </label>
                <input
                  type="text"
                  required
                  value={formData.experience_years}
                  onChange={(e) =>
                    setFormData({ ...formData, experience_years: e.target.value })
                  }
                  placeholder="e.g., 3 years"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={isLoading}
                />
              </div>

              {/* Notice Period */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Notice Period
                </label>
                <select
                  required
                  title="Notice Period"
                  value={formData.notice_period}
                  onChange={(e) =>
                    setFormData({ ...formData, notice_period: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={isLoading}
                >
                  <option value="">Select notice period</option>
                  <option value="Immediate">Immediate</option>
                  <option value="15 days">15 days</option>
                  <option value="30 days">30 days</option>
                  <option value="60 days">60 days</option>
                  <option value="90 days">90 days</option>
                </select>
              </div>

              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Cover Letter (Optional)
                </label>
                <textarea
                  value={formData.cover_letter}
                  onChange={(e) =>
                    setFormData({ ...formData, cover_letter: e.target.value })
                  }
                  placeholder="Why are you interested in this role?"
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 font-semibold text-base rounded-lg transition duration-200 mt-auto ${
                  isLoading
                    ? "bg-blue-400 text-white cursor-not-allowed opacity-70"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isLoading ? "Applying..." : "Apply Now"}
              </button>
            </form>

            {/* Trust Indicator */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> Your data is securely shared only with the recruiter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
