// Onboarding Flow Type Definitions
// Based on CAREERBOT_USER_DASHBOARD_DESIGN_V3.txt Section 4

export type OnboardingStep = 0 | 1 | 2 | 3;

export type CareerStage = 'fresh_graduate' | 'working_professional' | 'career_switcher';

export interface OnboardingState {
  current_step: OnboardingStep;
  completed: boolean;
  step_data: {
    personal_info?: PersonalInfoData;
    resume_uploaded?: boolean;
    resume_parsed?: boolean;
  };
}

// Step 1: Personal Information
export interface PersonalInfoData {
  full_name: string;
  phone: string;
  location: string; // City name
  career_stage: CareerStage;
}

export interface PersonalInfoFormData extends PersonalInfoData {
  // Form-specific validation
}

// Step 2: Resume Upload
export interface ResumeUploadData {
  file?: File;
  parsing_status?: 'idle' | 'uploading' | 'parsing' | 'success' | 'error';
  error_message?: string;
}

export interface ResumeParseResponse {
  success: boolean;
  resume_id?: string;
  parsed_data?: {
    skills_found: number;
    experience_found: number;
    education_found: number;
  };
  message?: string;
}

// Step 3: Welcome Summary
export interface WelcomeSummaryData {
  account_created: boolean;
  plan_activated: boolean;
  credits_allocated: number;
  profile_completeness: number;
}

// API request/response types
export interface OnboardingProgressRequest {
  step: OnboardingStep;
  data?: Partial<PersonalInfoData>;
}

export interface OnboardingProgressResponse {
  success: boolean;
  current_step: OnboardingStep;
  message?: string;
}

export interface OnboardingCompleteRequest {
  completed: true;
}

export interface OnboardingCompleteResponse {
  success: boolean;
  redirect_url?: string;
  message?: string;
}

// City options for location dropdown
export const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Surat',
  'Jaipur',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Pimpri-Chinchwad',
  'Patna',
  'Vadodara',
  'Ghaziabad',
  'Ludhiana',
  'Agra',
  'Nashik',
  'Faridabad',
  'Meerut',
  'Rajkot',
  'Kalyan-Dombivli',
  'Vasai-Virar',
  'Varanasi',
  'Srinagar',
  'Aurangabad',
  'Dhanbad',
  'Amritsar',
  'Navi Mumbai',
  'Allahabad',
  'Ranchi',
  'Howrah',
  'Coimbatore',
  'Jabalpur',
  'Gwalior',
  'Vijayawada',
  'Jodhpur',
  'Madurai',
  'Raipur',
  'Kota',
  'Guwahati',
  'Chandigarh',
  'Solapur',
  'Hubli-Dharwad',
  'Other',
];

// Career stage options with descriptions
export const CAREER_STAGES: Array<{
  value: CareerStage;
  label: string;
  description: string;
}> = [
  {
    value: 'fresh_graduate',
    label: 'Fresh Graduate',
    description: '0-1 years of experience',
  },
  {
    value: 'working_professional',
    label: 'Working Professional',
    description: '1+ years of experience',
  },
  {
    value: 'career_switcher',
    label: 'Career Switcher',
    description: 'Transitioning to a new field',
  },
];

// Validation helpers
export function validatePersonalInfo(data: Partial<PersonalInfoData>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.full_name = 'Please enter your full name';
  }

  if (!data.phone || !/^[+]?[0-9]{10,15}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.location = 'Please select your location';
  }

  if (!data.career_stage) {
    errors.career_stage = 'Please select your career stage';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateResumeFile(file: File | null): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: 'Please select a file' };
  }

  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only PDF and DOCX files are allowed' };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  return { valid: true };
}
