/**
 * Step 2: Resume Upload (Optional)
 *
 * Allows user to upload resume for parsing (5 credits)
 * Can be skipped
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { validateResumeFile } from '@/types/onboarding.types';
import { toast } from 'sonner';
import logger from '@/lib/logger';

export interface Step2ResumeUploadProps {
  onContinue: (uploaded: boolean, file?: File) => void;
  onSkip: () => void;
}

export const Step2ResumeUpload: React.FC<Step2ResumeUploadProps> = ({
  onContinue,
  onSkip,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validation = validateResumeFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUploadAndParse = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      logger.info('Uploading and parsing resume:', file.name);

      // Simulate upload and parsing (5 credits)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate success
      toast.success('Resume parsed successfully! Found 12 skills, 2 jobs, 1 degree');
      logger.info('Resume parsing completed');

      onContinue(true, file);
    } catch (err) {
      logger.error('Resume upload error:', err);
      setError('Failed to parse resume. Please try again.');
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Your Resume (Optional)
        </h2>
        <p className="text-gray-600">
          Auto-fill your profile and save time
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : file
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        {!file ? (
          <>
            <Upload className={`w-16 h-16 mx-auto mb-4 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Drag & drop your resume here
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              or click to browse
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-4">
              PDF or DOCX • Max 5MB
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <FileText className="w-12 h-12 text-green-500" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center justify-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            💎
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">
              This costs 5 credits
            </p>
            <p className="text-xs text-blue-700">
              You have <strong>50 FREE credits</strong> to start. We&apos;ll parse your resume and automatically fill your profile with skills, experience, and education.
            </p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onSkip}
          disabled={uploading}
          className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Skip for Now
        </button>
        <button
          type="button"
          onClick={handleUploadAndParse}
          disabled={!file || uploading}
          className="flex-1 py-3 px-6 bg-gradient-to-r from-[#2200FF] to-[#1800B3] text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Parsing Resume...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Upload & Parse
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      <p className="text-xs text-center text-gray-500">
        Don&apos;t have a resume yet? No problem! You can fill your profile manually in the next step.
      </p>
    </div>
  );
};
