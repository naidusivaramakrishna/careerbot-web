'use client';

import { MoreVertical, Trash2, Download } from 'lucide-react';
import { Resume } from '../page';

interface ResumeTableRowProps {
  resume: Resume;
  index: number;
  isDropdownOpen: boolean;
  onToggleDropdown: () => void;
  onDelete: () => void;
  onDownload: () => void;
  downloading: boolean;
}

export default function ResumeTableRow({
  resume,
  isDropdownOpen,
  onToggleDropdown,
  onDelete,
  onDownload,
  downloading,
}: ResumeTableRowProps) {
  const scoreColor =
    resume.score >= 80
      ? 'text-green-600 bg-green-50'
      : resume.score >= 50
      ? 'text-yellow-600 bg-yellow-50'
      : 'text-red-600 bg-red-50';

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Resume name + initials */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#e8eeff] flex items-center justify-center text-sm font-semibold text-[#2200ff]">
            {resume.initials}
          </div>
          <span className="text-sm font-medium text-gray-800">{resume.name}</span>
        </div>
      </td>

      {/* Target job title */}
      <td className="p-4 text-sm text-gray-600">{resume.job}</td>

      {/* Resume score */}
      <td className="p-4">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scoreColor}`}>
          {resume.score > 0 ? `${resume.score}%` : '—'}
        </span>
      </td>

      {/* Last modified */}
      <td className="p-4 text-sm text-gray-500">{resume.modified}</td>

      {/* Created */}
      <td className="p-4 text-sm text-gray-500">{resume.created}</td>

      {/* Actions */}
      <td className="p-4 relative">
        <button
          onClick={onToggleDropdown}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-4 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-40 py-1">
            <button
              onClick={onDownload}
              disabled={downloading}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
