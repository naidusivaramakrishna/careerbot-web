import React from 'react';

const JobSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start space-x-4">
        {/* Company Logo Skeleton */}
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>

        {/* Job Details Skeleton */}
        <div className="flex-1 min-w-0">
          {/* Job Title */}
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>

          {/* Company and Location */}
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>

          {/* Job Type and Salary */}
          <div className="flex items-center space-x-4 mb-3">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>

          {/* Description */}
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-14"></div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSkeleton;
