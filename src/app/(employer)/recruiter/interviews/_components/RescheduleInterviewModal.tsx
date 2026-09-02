'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

interface Interview {
  id: string | number;
  candidateName: string;
  position: string;
  date: string;
  time: string;
  location: string;
  locationType: 'in-person' | 'online';
  interviewer: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  candidateInitials: string;
  candidateColor: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface RescheduleModalProps {
  interview: Interview | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedInterview: Interview) => void;
}

export default function RescheduleInterviewModal({
  interview,
  isOpen,
  onClose,
  onSave,
}: RescheduleModalProps) {
  const [formData, setFormData] = useState<Interview | null>(interview);

  React.useEffect(() => {
    setFormData(interview);
  }, [interview]);

  if (!isOpen || !interview || !formData) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) =>
      prev ? { ...prev, [name]: value } : null
    );
  };

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  const handleReset = () => {
    setFormData(interview);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Reschedule interview</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Candidate Info */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${interview.candidateColor}`}>
              {interview.candidateInitials}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{interview.candidateName}</h3>
              <p className="text-gray-600">{interview.position}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Interviewer Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Interviewer Name
              </label>
              <input
                type="text"
                name="interviewer"
                value={formData.interviewer}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter interviewer name"
              />
            </div>

            {/* Interview Type and Meeting Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Interview Type
                </label>
                <select
                  name="locationType"
                  value={formData.locationType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="offline">Offline</option>
                  <option value="in-person">In-person</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Meeting Link / Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter location or meeting link"
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Date Range
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    name="time"
                    value={convertTo24HourFormat(formData.time)}
                    onChange={(e) => {
                      const time24 = e.target.value;
                      const time12 = convertTo12HourFormat(time24);
                      setFormData((prev) =>
                        prev ? { ...prev, time: time12 } : null
                      );
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Notes for Candidate */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Notes for Candidate
              </label>
              <textarea
                name="notes"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value={(formData as any).notes || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add any notes or instructions for the candidate..."
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-6 py-2.5 border border-red-600 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition"
          >
            Reset All
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert 12-hour format to 24-hour format
function convertTo24HourFormat(time12: string): string {
  if (!time12) return '';

  const [time, period] = time12.split(' ');
  // eslint-disable-next-line prefer-const
  let [hours, minutes] = time.split(':').map(Number);

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Helper function to convert 24-hour format to 12-hour format
function convertTo12HourFormat(time24: string): string {
  if (!time24) return '';

  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}
