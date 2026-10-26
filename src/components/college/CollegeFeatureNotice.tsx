'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { collegeFeatureMessage, onCollegeFeatureRefused } from '@/lib/collegeFeatures';

/**
 * One friendly message for every engine when the API refuses a start with
 * COLLEGE_FEATURE_DISABLED. Mounted once (ClientLayout); the HTTP client
 * announces the refusal, so no engine has to learn a new error branch.
 * Deduplicated per feature: a page that retries does not stack toasts.
 */
export default function CollegeFeatureNotice() {
  useEffect(
    () =>
      onCollegeFeatureRefused((feature) => {
        toast.error(collegeFeatureMessage(feature), { id: `college-feature-${feature}` });
      }),
    [],
  );
  return null;
}
