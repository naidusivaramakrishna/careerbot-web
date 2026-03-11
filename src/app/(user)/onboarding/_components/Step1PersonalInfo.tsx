"use client";

/**
 * Step 1: Personal Info + Optional Resume Upload
 *
 * Visual career-stage cards, clean fields, integrated drag-&-drop upload.
 */

import React, { useState, useRef } from 'react';
import {
  User, Phone, MapPin, ChevronDown,
  Upload, FileText, X, Sparkles, Loader,
} from 'lucide-react';
import {
  PersonalInfoData, INDIAN_CITIES, CAREER_STAGES,
  validatePersonalInfo, validateResumeFile,
} from '@/types/onboarding.types';


export interface Step1PersonalInfoProps {
  initialData?:  Partial<PersonalInfoData>;
  onContinue:    (data: PersonalInfoData, resumeFile?: File) => void;
  isSubmitting?: boolean;
}

export const Step1PersonalInfo: React.FC<Step1PersonalInfoProps> = ({
  initialData,
  onContinue,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<PersonalInfoData>>({
    full_name:    initialData?.full_name    || '',
    phone:        initialData?.phone        || '',
    location:     initialData?.location     || '',
    career_stage: initialData?.career_stage || undefined,
  });

  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [resumeFile,  setResumeFile]  = useState<File | null>(null);
  const [dragActive,  setDragActive]  = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── helpers ── */
  const handleChange = (field: keyof PersonalInfoData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const processFile = (file: File) => {
    const v = validateResumeFile(file);
    if (!v.valid) { setResumeError(v.error || 'Invalid file'); return; }
    setResumeFile(file);
    setResumeError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const v = validatePersonalInfo(formData);
    if (!v.valid) { setErrors(v.errors); return; }
    onContinue(formData as PersonalInfoData, resumeFile || undefined);
  };

  /* ── shared class helpers ── */
  const inputBase = 'w-full py-2 text-sm border rounded-xl bg-gray-50 focus:bg-white outline-none transition-all duration-150 focus:ring-2';
  const inputOk   = 'border-gray-200 focus:ring-blue-50 focus:border-[#2557a7]';
  const inputErr  = 'border-red-300 bg-red-50 focus:ring-red-100 focus:border-red-400';

  return (
    <form onSubmit={handleSubmit} className="flex gap-8">

      {/* ── Left column: fields ── */}
      <div className="flex-1 flex flex-col gap-2.5">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">Tell us about yourself</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Helps us personalise your career journey — takes under 2 minutes
          </p>
        </div>

        {/* Name + Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="John Doe"
                className={`${inputBase} pl-9 pr-3 ${errors.full_name ? inputErr : inputOk}`}
              />
            </div>
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              Phone <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+91 9876543210"
                className={`${inputBase} pl-9 pr-3 ${errors.phone ? inputErr : inputOk}`}
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            City / Location <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className={`${inputBase} pl-9 pr-9 appearance-none ${errors.location ? inputErr : inputOk}`}
            >
              <option value="">Select your city</option>
              {INDIAN_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location}</p>}
        </div>

        {/* Career Stage */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            I am a <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {CAREER_STAGES.map((stage) => {
              const isSelected = formData.career_stage === stage.value;
              return (
                <button
                  key={stage.value}
                  type="button"
                  onClick={() => handleChange('career_stage', stage.value)}
                  className={`relative text-left p-2 rounded-xl border-2 transition-all duration-150 ${
                    isSelected
                      ? 'border-[#2557a7] bg-[#eff6ff] shadow-sm'
                      : 'border-gray-200 bg-gray-50/60 hover:border-blue-200 hover:bg-[#f8fbff]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-[#2557a7]' : 'text-gray-800'}`}>
                        {stage.label}
                      </p>
                      <p className="text-[11px] text-gray-400 leading-snug mt-0.5 line-clamp-1">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span
                      className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: '#2557a7' }}
                    >
                      <svg width="8" height="7" viewBox="0 0 8 7" fill="none" aria-hidden>
                        <path d="M1 3.5L3 5.5L7 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {errors.career_stage && <p className="mt-1 text-xs text-red-500">{errors.career_stage}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-6 text-white text-sm font-bold rounded-xl transition-all hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-auto"
          style={{ background: '#2557a7', boxShadow: '0 4px 14px rgba(37,87,167,0.35)' }}
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Saving your profile…
            </>
          ) : (
            <>
              Continue
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="w-px bg-gray-100 self-stretch" />

      {/* ── Right column: upload ── */}
      <div className="w-72 flex flex-col gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Upload Resume</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{ color: '#2557a7', background: '#eff6ff', borderColor: '#c7ddf8' }}
            >
              Optional
            </span>
          </div>
          <p className="text-xs text-gray-400">Skip if you prefer to fill in manually.</p>
        </div>

        {/* Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !resumeFile && fileInputRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded-xl transition-all duration-150 ${
            dragActive
              ? 'border-[#2557a7] bg-[#eff6ff] scale-[1.01]'
              : resumeFile
              ? 'border-[#5896d7] bg-[#eff6ff]/40 cursor-default'
              : 'border-gray-200 bg-gray-50/50 cursor-pointer hover:border-[#5896d7] hover:bg-[#f8fbff]'
          }`}
        >
          {resumeFile ? (
            <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
                <FileText className="w-6 h-6" style={{ color: '#2557a7' }} />
              </div>
              <div className="min-w-0 w-full">
                <p className="text-sm font-semibold text-gray-900 truncate">{resumeFile.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB · Ready to parse
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                <X size={12} /> Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-6 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold" style={{ color: '#2557a7' }}>Click to browse</span>
                <br />or drag &amp; drop
              </p>
              <p className="text-xs text-gray-400 mt-2">PDF or DOCX · Max 5 MB</p>
            </div>
          )}
        </div>

        {resumeError && <p className="text-xs text-red-500">{resumeError}</p>}

        {!resumeFile && (
          <p className="text-xs text-gray-400 flex items-start gap-1.5">
            <Sparkles className="w-3 h-3 shrink-0 mt-0.5" style={{ color: '#5896d7' }} />
            Auto-fills skills, experience &amp; education — saves you time!
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          className="hidden"
        />
      </div>

    </form>
  );
};
