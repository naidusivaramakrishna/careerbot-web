import React from 'react';

const JobSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 pl-5 pr-4 pt-4 pb-3.5 animate-pulse">
      <div className="flex gap-3">
        {/* Logo */}
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-3 bg-gray-100 rounded w-10" />
              <div className="w-6 h-6 bg-gray-100 rounded-full" />
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-2">
            <div className="h-3 bg-gray-100 rounded w-20" />
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="h-3 bg-gray-100 rounded w-14" />
          </div>

          {/* Badge row */}
          <div className="flex gap-1.5 mt-2">
            <div className="h-5 bg-gray-100 rounded-full w-16" />
            <div className="h-5 bg-gray-100 rounded-full w-20" />
            <div className="h-5 bg-gray-100 rounded-full w-18" />
          </div>

          {/* Skills row */}
          <div className="flex gap-1.5 mt-2.5">
            <div className="h-4 bg-gray-100 rounded-full w-14" />
            <div className="h-4 bg-gray-100 rounded-full w-18" />
            <div className="h-4 bg-gray-100 rounded-full w-12" />
            <div className="h-4 bg-gray-100 rounded-full w-16" />
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
        <div className="flex gap-3">
          <div className="h-3.5 bg-gray-100 rounded w-16" />
          <div className="h-3.5 bg-gray-100 rounded w-20" />
        </div>
        <div className="h-7 bg-gray-200 rounded-lg w-24" />
      </div>
    </div>
  );
};

export default JobSkeleton;
