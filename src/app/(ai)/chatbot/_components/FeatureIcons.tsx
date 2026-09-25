import React from 'react';

export const ResumeBuilderIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="6" width="32" height="36" rx="2" fill="#E8F0FE" stroke="#1F5FB7" strokeWidth="2"/>
    <path d="M14 14h20M14 22h20M14 30h20M14 38h12" stroke="#1F5FB7" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="32" cy="20" r="6" fill="#1F5FB7"/>
    <path d="M32 18v4M30 20h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const ResumeParserIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="7" fill="#10B981"/>
    <circle cx="32" cy="32" r="7" fill="#10B981"/>
    <path d="M23 23l6 6" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
    <rect x="10" y="10" width="28" height="28" rx="2" fill="none" stroke="#10B981" strokeWidth="1.5" opacity="0.5"/>
  </svg>
);

export const ResumeEnhancerIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 6L28 18H40L31 25L35 37L24 30L13 37L17 25L8 18H20L24 6Z" fill="#7C3AED" opacity="0.2" stroke="#7C3AED" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="24" cy="24" r="16" fill="none" stroke="#7C3AED" strokeWidth="1.5" opacity="0.3"/>
    <circle cx="24" cy="12" r="2" fill="#7C3AED"/>
  </svg>
);

export const CoverLetterIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="32" height="32" rx="2" fill="#FEE8F5" stroke="#E91E8C" strokeWidth="2"/>
    <path d="M14 16h20M14 24h16M14 32h14" stroke="#E91E8C" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M32 14L36 10L40 14" stroke="#E91E8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const JobSearchIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="18" r="8" fill="#10B981" opacity="0.2" stroke="#10B981" strokeWidth="2"/>
    <path d="M26 24L32 30" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="32" cy="30" r="6" fill="none" stroke="#10B981" strokeWidth="2"/>
  </svg>
);

export const JobMatchIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="7" fill="#FB923C"/>
    <circle cx="32" cy="16" r="7" fill="#FB923C"/>
    <circle cx="16" cy="32" r="7" fill="#FB923C" opacity="0.5"/>
    <circle cx="32" cy="32" r="7" fill="#FB923C" opacity="0.5"/>
    <path d="M23 16h2M16 23v2M32 23v2M23 32h2" stroke="#FB923C" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const MockInterviewIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="12" width="32" height="24" rx="2" fill="#8B5CF6" opacity="0.2" stroke="#8B5CF6" strokeWidth="2"/>
    <path d="M14 18L18 22L26 14M32 26V30M38 26V30" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MockTestIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="32" height="32" rx="2" fill="#F43F5E" opacity="0.2" stroke="#F43F5E" strokeWidth="2"/>
    <path d="M16 18L20 22L28 14M16 28L20 32L28 24" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BrowserExtensionIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="10" width="32" height="28" rx="2" fill="#F97316" opacity="0.2" stroke="#F97316" strokeWidth="2"/>
    <path d="M12 16L18 16L18 22L12 22Z" fill="#F97316"/>
    <path d="M22 16L28 16L28 22L22 22Z" fill="#3B82F6"/>
    <path d="M32 16L38 16L38 22L32 22Z" fill="#10B981"/>
    <path d="M12 26L18 26L18 32L12 32Z" fill="#8B5CF6"/>
    <path d="M22 26L28 26L28 32L22 32Z" fill="#EC4899"/>
    <path d="M32 26L38 26L38 32L32 32Z" fill="#F59E0B"/>
  </svg>
);

export const ChatbotIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="36" height="24" rx="3" fill="#06B6D4" opacity="0.2" stroke="#06B6D4" strokeWidth="2"/>
    <path d="M12 34L10 40L15 36H36" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="16" cy="20" r="2.5" fill="#06B6D4"/>
    <circle cx="24" cy="20" r="2.5" fill="#06B6D4"/>
    <circle cx="32" cy="20" r="2.5" fill="#06B6D4"/>
    <circle cx="20" cy="28" r="2" fill="#14B8A6" opacity="0.6"/>
    <circle cx="28" cy="28" r="2" fill="#14B8A6" opacity="0.6"/>
  </svg>
);

export const PaymentBillingIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="12" width="36" height="24" rx="3" fill="#FBBF24" opacity="0.2" stroke="#F59E0B" strokeWidth="2"/>
    <rect x="10" y="8" width="28" height="5" rx="1" fill="#F59E0B" opacity="0.4"/>
    <circle cx="30" cy="24" r="5" fill="none" stroke="#F59E0B" strokeWidth="2"/>
    <path d="M30 21v6M27 24h6" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="17" x2="22" y2="17" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="16" cy="32" r="1.5" fill="#FBBF24" opacity="0.6"/>
    <circle cx="24" cy="32" r="1.5" fill="#FBBF24" opacity="0.6"/>
  </svg>
);

export const AccountOrganizationIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="12" r="3.5" fill="#8B5CF6"/>
    <circle cx="24" cy="12" r="3.5" fill="#3B82F6"/>
    <circle cx="34" cy="12" r="3.5" fill="#EC4899"/>
    <path d="M8 22C8 20 9.8 18 12 18H16C18.2 18 20 20 20 22V30H8V22Z" fill="#8B5CF6" opacity="0.3" stroke="#8B5CF6" strokeWidth="1.5"/>
    <path d="M20 22C20 20 21.8 18 24 18H28C30.2 18 32 20 32 22V30H20V22Z" fill="#3B82F6" opacity="0.3" stroke="#3B82F6" strokeWidth="1.5"/>
    <path d="M32 22C32 20 33.8 18 36 18H40C42.2 18 44 20 44 22V30H32V22Z" fill="#EC4899" opacity="0.3" stroke="#EC4899" strokeWidth="1.5"/>
    <path d="M16 36C16 34 17.8 32 20 32H28C30.2 32 32 34 32 36V42H16V36Z" fill="#10B981" opacity="0.3" stroke="#10B981" strokeWidth="1.5"/>
    <circle cx="24" cy="38" r="2" fill="#10B981"/>
  </svg>
);

export const LoginIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="14" width="28" height="20" rx="2" fill="#DC2626" opacity="0.2" stroke="#DC2626" strokeWidth="2"/>
    <path d="M16 14V11C16 8.79 17.79 7 20 7H28C30.21 7 32 8.79 32 11V14" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="24" cy="24" r="2" fill="#DC2626"/>
    <path d="M24 24V28" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
