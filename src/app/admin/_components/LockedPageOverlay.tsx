"use client";

import React from 'react';
import { Lock } from 'lucide-react';
import { formatRoleName, AdminRole } from '../_utils/permissions';

interface LockedPageOverlayProps {
  requiredRoles: AdminRole[];
  pageName?: string;
}

export const LockedPageOverlay: React.FC<LockedPageOverlayProps> = ({
  requiredRoles,
  pageName = 'This page',
}) => {
  return (
    <div className="relative w-full min-h-screen">
      {/* Blurred background */}
      <div className="absolute inset-0 backdrop-blur-md bg-black/5 z-40 rounded-lg" />

      {/* Locked overlay content */}
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 rounded-full p-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            {pageName} is only accessible to the following roles:
          </p>

          {/* Required Roles */}
          <div className="space-y-2 mb-6">
            {requiredRoles.map((role) => (
              <div
                key={role}
                className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium mx-1"
              >
                {formatRoleName(role)}
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <p className="text-sm text-gray-500">
            Please contact your administrator to access this page.
          </p>
        </div>
      </div>

      {/* Hidden content - visible but blurred */}
      <div className="opacity-30 pointer-events-none blur-sm">
        {/* Placeholder for page content */}
        <div className="h-96 bg-gray-200 rounded-lg mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
};
