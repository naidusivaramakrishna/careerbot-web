/* eslint-disable @typescript-eslint/no-explicit-any, react/jsx-no-comment-textnodes */
'use client';

import React, { useState, useEffect } from 'react';
import { User, Building2, Bell, Shield, Pencil, Save, X, Eye, EyeOff, Check, ChevronDown } from 'lucide-react';
import DashboardLayout from '../dashboard/_components/DashboardLayout';
import { recruiterAuthApi } from '@/api/recruiterAuthApiMain';

type Tab = 'profile' | 'company' | 'preferences' | 'security';

// ── Toast ──────────────────────────────────────────────────
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
    ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    {message}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3 h-3" /></button>
  </div>
);

// ── Toggle ─────────────────────────────────────────────────
const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-gray-900' : 'bg-gray-300'}`}>
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

// ── Input Component ────────────────────────────────────────
const Input = ({ value, onChange, type = 'text', placeholder = '' }: any) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
);

// ── SelectField Component ──────────────────────────────────
const SelectField = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 appearance-none bg-white pr-8">
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

// ── Field Component ────────────────────────────────────────
const Field = ({ label, value, error, editMode = false, children }: any) => (
  <div>
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    {editMode ? children : <p className="text-sm text-gray-700">{value || '—'}</p>}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab]   = useState<Tab>('profile');
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [username, setUsername]     = useState<string>('');

  // Loading states for API calls
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ════════════════════════════════════════════════════════
  // 1. PROFILE STATE
  // ════════════════════════════════════════════════════════
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState({
    fullName:    '',
    email:       '',
    mobile:      '',
    bio:         '',
    designation: '',
    department:  '',
    location:    '',
  });
  const [profileDraft, setProfileDraft] = useState({ ...profile });

  // Load real profile data from API (always get fresh data, never use cache)
  useEffect(() => {
    const loadFromAPI = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${baseUrl}/auth/profile`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();

          // Extract username for avatar (from different possible field names)
          const extractedUsername = data?.username || data?.recruiter?.username || data?.name || data?.fullName || '';
          console.log('🔍 [Settings] Loaded username from API:', extractedUsername, 'First letter:', extractedUsername?.charAt(0).toUpperCase());
          if (extractedUsername) {
            setUsername(extractedUsername);
          }

          // Update profile data
          const loaded = {
            fullName:    data.full_name || data.fullName || data.username || data.name || '',
            email:       data.email || '',
            mobile:      data.phone || data.mobile || '',
            bio:         data.bio || '',
            designation: data.designation || data.role || '',
            department:  data.department || '',
            location:    data.location || '',
          };
          setProfile(loaded);
          setProfileDraft(loaded);

          // Update localStorage with fresh data
          localStorage.setItem('recruiterData', JSON.stringify(data));
        }
      } catch (error) {
        console.error('❌ Error loading from API:', error);
        setUsername('');
      }
    };

    loadFromAPI();
  }, []);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const validateProfile = () => {
    const errs: Record<string, string> = {};
    if (!profileDraft.fullName.trim())  errs.fullName = 'Full name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileDraft.email)) errs.email = 'Invalid email format';
    if (profileDraft.mobile && !/^\d{10}$/.test(profileDraft.mobile.replace(/[\s\-+]/g, '')))
      errs.mobile = 'Enter a valid mobile number';
    if (profileDraft.bio.length > 300) errs.bio = 'Bio must be under 300 characters';
    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveProfile = async () => {
    if (!validateProfile()) return;
    setLoadingProfile(true);
    console.log('🔵 [SETTINGS] Starting profile save at', new Date().toISOString());
    try {
      const profilePayload = {
        full_name: profileDraft.fullName,
        email: profileDraft.email,
        phone: profileDraft.mobile,
        bio: profileDraft.bio,
        designation: profileDraft.designation,
        department: profileDraft.department,
        location: profileDraft.location,
      };
      console.log('📤 [SETTINGS] Profile payload:', profilePayload);

      const result = await recruiterAuthApi.updateProfile(profilePayload);

      console.log('🟢 [SETTINGS] Profile update success:', result);
      setProfile({ ...profileDraft });
      setProfileErrors({});
      setEditingProfile(false);
      showToast('Profile updated successfully!');
    } catch (error: any) {
      console.error('🔴 [SETTINGS] Profile update failed:', error);
      const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
      console.error('🔴 Error details:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        statusCode: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        isTimeout,
      });

      // Handle timeout error specifically
      if (isTimeout) {
        showToast('Request timeout: Backend endpoint not responding. Please check with your administrator.', 'error');
        return;
      }

      // Handle field-specific errors from backend
      const errorData = error?.response?.data;
      if (errorData?.errors && typeof errorData.errors === 'object') {
        // Backend returned field-specific errors
        const fieldErrors: Record<string, string> = {};
        const errorMapping: Record<string, string> = {
          full_name: 'fullName',
          email: 'email',
          phone: 'mobile',
          mobile: 'mobile',
          bio: 'bio',
          designation: 'designation',
          department: 'department',
          location: 'location',
        };

        // Convert backend field names to frontend field names
        Object.entries(errorData.errors).forEach(([key, value]: [string, any]) => {
          const fieldKey = errorMapping[key] || key;
          const errorMsg = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : String(value);
          fieldErrors[fieldKey] = errorMsg;
        });

        setProfileErrors(fieldErrors);
        showToast('Please check the highlighted fields', 'error');
      } else {
        // Show general error message
        const errorMsg = errorData?.message || error?.message || 'Failed to update profile';
        showToast(errorMsg, 'error');
      }
    } finally {
      setLoadingProfile(false);
      console.log('✅ [SETTINGS] Profile save completed at', new Date().toISOString());
    }
  };

  // ════════════════════════════════════════════════════════
  // 2. COMPANY STATE
  // ════════════════════════════════════════════════════════
  const [editingCompany, setEditingCompany] = useState(false);
  const [company, setCompany] = useState({
    name:     'InteliCore System pvt.ltd',
    size:     '10-100 employees',
    email:    'info@InteliCore.com',
    website:  'https://InteliCore.com',
    phone:    '+91 9900000089',
    location: 'Vijayawada, Andhra Pradesh',
    about:    'InteliCore is a forward-thinking technology and consulting firm focused on delivering scalable digital solutions for modern businesses.',
  });
  const [companyDraft, setCompanyDraft] = useState({ ...company });
  const [companyErrors, setCompanyErrors] = useState<Record<string, string>>({});

  const validateCompany = () => {
    const errs: Record<string, string> = {};
    if (!companyDraft.name.trim())    errs.name  = 'Company name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyDraft.email)) errs.email = 'Invalid email format';
    if (companyDraft.website && !/^https?:\/\/.+/.test(companyDraft.website)) errs.website = 'URL must start with http:// or https://';
    setCompanyErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveCompany = async () => {
    if (!validateCompany()) return;
    setLoadingCompany(true);
    try {
      const companyPayload = {
        name: companyDraft.name,
        size: companyDraft.size,
        email: companyDraft.email,
        website: companyDraft.website,
        phone: companyDraft.phone,
        location: companyDraft.location,
        about: companyDraft.about,
      };
      await recruiterAuthApi.updateCompany(companyPayload);
      setCompany({ ...companyDraft });
      setCompanyErrors({});
      setEditingCompany(false);
      showToast('Company details updated successfully!');
    } catch (error: any) {
      console.error('Company update error:', error);
      const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');

      // Handle timeout error specifically
      if (isTimeout) {
        showToast('Request timeout: Backend endpoint not responding. Please check with your administrator.', 'error');
        return;
      }

      // Handle field-specific errors from backend
      const errorData = error?.response?.data;
      if (errorData?.errors && typeof errorData.errors === 'object') {
        // Backend returned field-specific errors
        const fieldErrors: Record<string, string> = {};
        const errorMapping: Record<string, string> = {
          name: 'name',
          size: 'size',
          email: 'email',
          website: 'website',
          phone: 'phone',
          location: 'location',
          about: 'about',
        };

        // Convert backend field names to frontend field names
        Object.entries(errorData.errors).forEach(([key, value]: [string, any]) => {
          const fieldKey = errorMapping[key] || key;
          const errorMsg = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : String(value);
          fieldErrors[fieldKey] = errorMsg;
        });

        setCompanyErrors(fieldErrors);
        showToast('Please check the highlighted fields', 'error');
      } else {
        // Show general error message
        const errorMsg = errorData?.message || error?.message || 'Failed to update company details';
        showToast(errorMsg, 'error');
      }
    } finally {
      setLoadingCompany(false);
    }
  };

  // ════════════════════════════════════════════════════════
  // 3. PREFERENCES STATE
  // ════════════════════════════════════════════════════════
  const [prefs, setPrefs] = useState({
    platformNotifications: true,
    emailNotifications:    true,
    interviewAlerts:       true,
    applicationAlerts:     true,
    messageNotifications:  false,
    timezone:              'Asia/Kolkata',
    language:              'English',
    theme:                 'Light',
    interviewDuration:     '30 minutes',
    autoReminder:          true,
    defaultStage:          'New',
  });

  const updatePref = async (key: string, value: any) => {
    setLoadingPrefs(true);
    try {
      // Create payload with snake_case keys for API
      const keyMap: Record<string, string> = {
        platformNotifications: 'platform_notifications',
        emailNotifications: 'email_notifications',
        interviewAlerts: 'interview_alerts',
        applicationAlerts: 'application_alerts',
        messageNotifications: 'message_notifications',
        autoReminder: 'auto_reminder',
        defaultStage: 'default_stage',
        interviewDuration: 'interview_duration',
      };

      const apiKey = keyMap[key] || key;
      const prefPayload = {
        [apiKey]: value,
      };

      await recruiterAuthApi.updatePreferences(prefPayload);
      setPrefs(prev => ({ ...prev, [key]: value }));
      showToast('Preferences updated!');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to update preferences';
      showToast(errorMsg, 'error');
      console.error('Preferences update error:', error);
    } finally {
      setLoadingPrefs(false);
    }
  };

  // ════════════════════════════════════════════════════════
  // 4. SECURITY STATE
  // ════════════════════════════════════════════════════════
  // Change Email Modal
  const [showEmailModal, setShowEmailModal]         = useState(false);
  const [emailStep, setEmailStep]                   = useState<'form' | 'otp-current' | 'otp-new' | 'success'>('form');
  const [emailForm, setEmailForm]                   = useState({ currentPass: '', newEmail: '', confirmEmail: '' });
  const [emailOtpCurrent, setEmailOtpCurrent]       = useState('');
  const [emailOtpNew, setEmailOtpNew]               = useState('');
  const [emailError, setEmailError]                 = useState('');
  const [resendOtpLoading, setResendOtpLoading]     = useState(false);

  const handleEmailSubmit = async () => {
    setEmailError('');
    if (!emailForm.currentPass)              return setEmailError('Current password is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail)) return setEmailError('Invalid email format');
    if (emailForm.newEmail !== emailForm.confirmEmail)           return setEmailError('Emails do not match');

    setLoadingEmail(true);
    try {
      // Request to send OTP to current email for verification
      await recruiterAuthApi.resendVerificationEmail({ email: profile.email });
      setEmailError('');
      setEmailStep('otp-current');
      showToast('OTP sent to your current email', 'success');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to send OTP';
      setEmailError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoadingEmail(false);
    }
  };

  const verifyCurrentOtp = async () => {
    if (emailOtpCurrent.length < 6) return setEmailError('Enter a valid OTP');
    setEmailError('');
    setLoadingEmail(true);
    try {
      // Verify OTP for current email
      await recruiterAuthApi.verifyEmail({ email: profile.email, otp: emailOtpCurrent });
      showToast('Current email verified', 'success');
      // Now send OTP to new email
      await recruiterAuthApi.resendVerificationEmail({ email: emailForm.newEmail });
      setEmailStep('otp-new');
      showToast('OTP sent to your new email', 'success');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'OTP verification failed';
      setEmailError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoadingEmail(false);
    }
  };

  const verifyNewOtp = async () => {
    if (emailOtpNew.length < 6) return setEmailError('Enter a valid OTP');
    setEmailError('');
    setLoadingEmail(true);
    try {
      // Verify OTP for new email
      await recruiterAuthApi.verifyEmail({ email: emailForm.newEmail, otp: emailOtpNew });
      showToast('Email changed successfully!', 'success');
      setEmailStep('success');
      setProfile({ ...profile, email: emailForm.newEmail });
      setTimeout(() => resetEmailModal(), 2000);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Email verification failed';
      setEmailError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleResendOtp = async (type: 'current' | 'new') => {
    setEmailError('');
    setResendOtpLoading(true);
    try {
      const email = type === 'current' ? profile.email : emailForm.newEmail;
      await recruiterAuthApi.resendVerificationEmail({ email });
      showToast(`OTP resent to ${email}`, 'success');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to resend OTP';
      setEmailError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setResendOtpLoading(false);
    }
  };

  const resetEmailModal = () => {
    setShowEmailModal(false);
    setEmailStep('form');
    setEmailForm({ currentPass: '', newEmail: '', confirmEmail: '' });
    setEmailOtpCurrent('');
    setEmailOtpNew('');
    setEmailError('');
    setResendOtpLoading(false);
  };

  // Change Password
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass]   = useState({ current: false, newPass: false, confirm: false });
  const [pwError, setPwError]     = useState('');

  const handleChangePassword = async () => {
    setPwError('');
    if (!passwords.current)             return setPwError('Current password is required');
    if (passwords.newPass.length < 8)   return setPwError('New password must be at least 8 characters');
    if (passwords.newPass !== passwords.confirm) return setPwError('Passwords do not match');

    setLoadingPassword(true);
    try {
      // Call password reset API with current password verification and new password
      await recruiterAuthApi.confirmPasswordReset({
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
        confirmPassword: passwords.confirm,
      });
      showToast('Password changed successfully!', 'success');
      setPasswords({ current: '', newPass: '', confirm: '' });
      setShowPass({ current: false, newPass: false, confirm: false });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to change password';
      setPwError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoadingPassword(false);
    }
  };

  // 2FA
  const [twoFA, setTwoFA]             = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [faAction, setFaAction]        = useState<'enable' | 'disable'>('enable');
  const [faOtp, setFaOtp]              = useState('');
  const [faPassword, setFaPassword]    = useState('');
  const [faError, setFaError]          = useState('');
  const [loading2FA, setLoading2FA]    = useState(false);

  // Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword]   = useState('');
  const [deleteError, setDeleteError]         = useState('');
  const [loadingDelete, setLoadingDelete]     = useState(false);

  const toggle2FA = (enable: boolean) => {
    setFaAction(enable ? 'enable' : 'disable');
    setFaOtp('');
    setFaPassword('');
    setFaError('');
    setShow2FAModal(true);
  };

  const confirm2FA = async () => {
    setFaError('');
    if (faAction === 'enable' && faOtp.length < 4) return setFaError('Enter the OTP from your authenticator app');
    if (faAction === 'disable' && !faPassword)     return setFaError('Password is required to disable 2FA');

    setLoading2FA(true);
    try {
      if (faAction === 'enable') {
        await recruiterAuthApi.enable2FA();
        showToast('2FA enabled successfully!', 'success');
      } else {
        await recruiterAuthApi.disable2FA({ password: faPassword });
        showToast('2FA has been disabled', 'success');
      }
      setTwoFA(faAction === 'enable');
      setShow2FAModal(false);
      setFaOtp('');
      setFaPassword('');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to update 2FA settings';
      setFaError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) return setDeleteError('Password is required');

    setLoadingDelete(true);
    try {
      await recruiterAuthApi.deleteAccount({ password: deletePassword, confirmDelete: true });
      showToast('Account deleted successfully', 'success');
      // Redirect to login or home page
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to delete account';
      setDeleteError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoadingDelete(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile',     label: 'Profile',     icon: <User className="w-4 h-4" /> },
    { key: 'company',     label: 'Company',     icon: <Building2 className="w-4 h-4" /> },
    { key: 'preferences', label: 'Preferences', icon: <Bell className="w-4 h-4" /> },
    { key: 'security',    label: 'Security',    icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-4xl mx-auto">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition border-b-2 ${
                activeTab === tab.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ════════ PROFILE TAB ════════ */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Profile Information</h2>
                <p className="text-xs text-gray-500 mt-0.5">Your personal details visible across the platform</p>
              </div>
              {!editingProfile ? (
                <button onClick={() => { setProfileDraft({ ...profile }); setProfileErrors({}); setEditingProfile(true); }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <Pencil className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingProfile(false); setProfileErrors({}); }}
                    disabled={loadingProfile}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={saveProfile}
                    disabled={loadingProfile}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <Save className="w-4 h-4" /> {loadingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Avatar Row */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div
                className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
                title={username ? `${username} (${username.charAt(0).toUpperCase()})` : 'Recruiter'}
              >
                {username && username.length > 0
                  ? username.charAt(0).toUpperCase()
                  : (profile.fullName?.charAt(0).toUpperCase() || 'R')}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{profile.fullName || username || 'Loading...'}</p>
                <p className="text-sm text-gray-500">{profile.designation} · {profile.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Field label="Full Name" value={profile.fullName} error={profileErrors.fullName} editMode={editingProfile}>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Input value={profileDraft.fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileDraft({ ...profileDraft, fullName: e.target.value })} />
              </Field>

              <Field label="Email" value={profile.email} error={profileErrors.email} editMode={editingProfile}>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Input type="email" value={profileDraft.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileDraft({ ...profileDraft, email: e.target.value })} />
              </Field>

              <Field label="Mobile Number" value={profile.mobile} error={profileErrors.mobile} editMode={editingProfile}>
                <Input type="tel" value={profileDraft.mobile} placeholder="e.g. 9876543210"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileDraft({ ...profileDraft, mobile: e.target.value })} />
              </Field>

              <Field label="Designation" value={profile.designation} editMode={editingProfile}>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Input value={profileDraft.designation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileDraft({ ...profileDraft, designation: e.target.value })} />
              </Field>

              <Field label="Department" value={profile.department} editMode={editingProfile}>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Input value={profileDraft.department} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileDraft({ ...profileDraft, department: e.target.value })} />
              </Field>

              <Field label="Location" value={profile.location} editMode={editingProfile}>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Input value={profileDraft.location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileDraft({ ...profileDraft, location: e.target.value })} />
              </Field>
            </div>

            {/* Bio - full width */}
            <div className="mt-6">
              <p className="text-xs text-gray-400 mb-1">Bio</p>
              {editingProfile ? (
                <div>
                  <textarea rows={3} value={profileDraft.bio}
                    onChange={e => setProfileDraft({ ...profileDraft, bio: e.target.value })}
                    placeholder="Write a short bio..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none" />
                  <p className={`text-xs mt-1 ${profileDraft.bio.length > 300 ? 'text-red-500' : 'text-gray-400'}`}>
                    {profileDraft.bio.length}/300 characters
                  </p>
                  {profileErrors.bio && <p className="text-xs text-red-500">{profileErrors.bio}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">{profile.bio || '—'}</p>
              )}
            </div>
          </div>
        )}

        {/* ════════ COMPANY TAB ════════ */}
        {activeTab === 'company' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Company Information</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage your company details</p>
              </div>
              {!editingCompany ? (
                <button onClick={() => { setCompanyDraft({ ...company }); setCompanyErrors({}); setEditingCompany(true); }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  <Pencil className="w-4 h-4" /> Edit Company Details
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingCompany(false); setCompanyErrors({}); }}
                    disabled={loadingCompany}
                    className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={saveCompany}
                    disabled={loadingCompany}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <Save className="w-4 h-4" /> {loadingCompany ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <Field label="Company Name" value={company.name} error={companyErrors.name} editMode={editingCompany}>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Input value={companyDraft.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyDraft({ ...companyDraft, name: e.target.value })} />
              </Field>

              <Field label="Company Size" value={company.size} editMode={editingCompany}>
                <SelectField value={companyDraft.size} onChange={v => setCompanyDraft({ ...companyDraft, size: v })}
                  options={['1-10 employees','10-50 employees','10-100 employees','100-500 employees','500-1000 employees','1000+ employees']} />
              </Field>

              <Field label="Company Email" value={company.email} error={companyErrors.email} editMode={editingCompany}>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Input type="email" value={companyDraft.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyDraft({ ...companyDraft, email: e.target.value })} />
              </Field>

              <Field label="Website" value={company.website} error={companyErrors.website} editMode={editingCompany}>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Input type="url" value={companyDraft.website} placeholder="https://..." onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyDraft({ ...companyDraft, website: e.target.value })} />
              </Field>

              <Field label="Contact Number" value={company.phone} editMode={editingCompany}>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Input type="tel" value={companyDraft.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyDraft({ ...companyDraft, phone: e.target.value })} />
              </Field>

              <Field label="Location" value={company.location} editMode={editingCompany}>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Input value={companyDraft.location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyDraft({ ...companyDraft, location: e.target.value })} />
              </Field>
            </div>

            <Field label="About Company" value={company.about} editMode={editingCompany}>
              <textarea rows={4} value={companyDraft.about}
                onChange={e => setCompanyDraft({ ...companyDraft, about: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none" />
            </Field>
          </div>
        )}

        {/* ════════ PREFERENCES TAB ════════ */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">

            {/* Notification Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Notification Settings</h2>
              <p className="text-xs text-gray-500 mb-5">Control what updates you receive</p>
              <div className="space-y-4">
                {[
                  { key: 'platformNotifications', label: 'Platform Notifications', desc: 'In-app alerts and badges' },
                  { key: 'emailNotifications',    label: 'Email Notifications',    desc: 'Receive updates via email' },
                  { key: 'interviewAlerts',       label: 'Interview Alerts',       desc: 'Reminders before scheduled interviews' },
                  { key: 'applicationAlerts',     label: 'Application Alerts',     desc: 'Notified when candidates apply' },
                  { key: 'messageNotifications',  label: 'Message Notifications',  desc: 'New message alerts' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <Toggle value={prefs[item.key as keyof typeof prefs] as boolean}
                      onChange={() => updatePref(item.key, !prefs[item.key as keyof typeof prefs])} />
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Preferences */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Platform Preferences</h2>
              <p className="text-xs text-gray-500 mb-5">Customize your experience</p>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Time Zone</p>
                  <SelectField value={prefs.timezone} onChange={v => updatePref('timezone', v)}
                    options={['Asia/Kolkata','Asia/Dubai','Europe/London','America/New_York','America/Los_Angeles','Australia/Sydney']} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Language</p>
                  <SelectField value={prefs.language} onChange={v => updatePref('language', v)}
                    options={['English','Hindi','Telugu','Tamil','Kannada','Malayalam']} />
                </div>
              </div>

              {/* Theme */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Theme Preference</p>
                <div className="flex gap-3">
                  {['Light', 'Dark', 'System Default'].map(theme => (
                    <button key={theme} onClick={() => updatePref('theme', theme)}
                      className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition ${
                        prefs.theme === theme
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}>
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Controls */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Additional Controls</h2>
              <p className="text-xs text-gray-500 mb-5">Interview and hiring workflow settings</p>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Default Interview Duration</p>
                    <SelectField value={prefs.interviewDuration} onChange={v => updatePref('interviewDuration', v)}
                      options={['15 minutes','30 minutes','45 minutes','60 minutes','90 minutes']} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Default Candidate Stage on Application</p>
                    <SelectField value={prefs.defaultStage} onChange={v => updatePref('defaultStage', v)}
                      options={['New','Shortlist','Interview','Rejected']} />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Auto-send Interview Reminder</p>
                    <p className="text-xs text-gray-500">Automatically remind candidates 1 hour before interview</p>
                  </div>
                  <Toggle value={prefs.autoReminder} onChange={() => updatePref('autoReminder', !prefs.autoReminder)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ SECURITY TAB ════════ */}
        {activeTab === 'security' && (
          <div className="space-y-6">

            {/* Change Email */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Email Address</h2>
                  <p className="text-sm text-gray-500 mt-1">Current: <span className="font-medium text-gray-800">{profile.email}</span></p>
                </div>
                <button onClick={() => { setShowEmailModal(true); setEmailStep('form'); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  Change Email
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Change Password</h2>
              <p className="text-xs text-gray-500 mb-5">Use a strong password with at least 8 characters</p>
              <div className="space-y-4 max-w-md">
                {[
                  { key: 'current', label: 'Current Password' },
                  { key: 'newPass', label: 'New Password'     },
                  { key: 'confirm', label: 'Confirm New Password' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <div className="relative">
                      <input
                        type={showPass[field.key as keyof typeof showPass] ? 'text' : 'password'}
                        value={passwords[field.key as keyof typeof passwords]}
                        onChange={e => setPasswords({ ...passwords, [field.key]: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                      <button type="button"
                        onClick={() => setShowPass(p => ({ ...p, [field.key]: !p[field.key as keyof typeof p] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass[field.key as keyof typeof showPass] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                {pwError && <p className="text-sm text-red-600">{pwError}</p>}
                <button onClick={handleChangePassword}
                  disabled={loadingPassword}
                  className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {loadingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>

            {/* 2FA */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Two-Factor Authentication</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your account</p>
                  <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                    twoFA ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${twoFA ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {twoFA ? '2FA Enabled' : '2FA Disabled'}
                  </span>
                </div>
                <Toggle value={twoFA} onChange={() => toggle2FA(!twoFA)} />
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl border border-red-200 p-6">
              <h2 className="text-base font-semibold text-red-600 mb-1">Danger Zone</h2>
              <p className="text-xs text-gray-500 mb-4">These actions cannot be undone</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Delete Account</p>
                  <p className="text-xs text-gray-500">Permanently remove your account and all associated data</p>
                </div>
                <button onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════ CHANGE EMAIL MODAL ════════ */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Change Email Address</h3>
              <button onClick={resetEmailModal} className="p-1 hover:bg-gray-100 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Step 1: Form */}
              {emailStep === 'form' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input type="password" value={emailForm.currentPass}
                      onChange={e => setEmailForm({ ...emailForm, currentPass: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
                    <input type="email" value={emailForm.newEmail}
                      onChange={e => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                      placeholder="new@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Email</label>
                    <input type="email" value={emailForm.confirmEmail}
                      onChange={e => setEmailForm({ ...emailForm, confirmEmail: e.target.value })}
                      placeholder="Confirm new email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                  </div>
                  {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                  <div className="flex gap-3 pt-2">
                    <button onClick={resetEmailModal} disabled={loadingEmail} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                    <button onClick={handleEmailSubmit} disabled={loadingEmail} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">{loadingEmail ? 'Loading...' : 'Continue'}</button>
                  </div>
                </div>
              )}

              {/* Step 2: OTP for current email */}
              {emailStep === 'otp-current' && (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Verify your current email</p>
                    <p className="text-xs text-gray-500 mt-1">Enter the OTP sent to <span className="font-medium">{profile.email}</span></p>
                  </div>
                  <input type="text" maxLength={6} value={emailOtpCurrent}
                    onChange={e => setEmailOtpCurrent(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter OTP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-gray-400" />
                  {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                  <p className="text-xs text-gray-500 text-center">
                    Didn&apos;t receive OTP?
                    <button
                      onClick={() => handleResendOtp('current')}
                      disabled={resendOtpLoading}
                      className="ml-1 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50">
                      {resendOtpLoading ? 'Sending...' : 'Resend'}
                    </button>
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setEmailStep('form')} disabled={loadingEmail} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Back</button>
                    <button onClick={verifyCurrentOtp} disabled={loadingEmail} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">{loadingEmail ? 'Verifying...' : 'Verify OTP'}</button>
                  </div>
                </div>
              )}

              {/* Step 3: OTP for new email */}
              {emailStep === 'otp-new' && (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Verify your new email</p>
                    <p className="text-xs text-gray-500 mt-1">Enter the OTP sent to <span className="font-medium">{emailForm.newEmail}</span></p>
                  </div>
                  <input type="text" maxLength={6} value={emailOtpNew}
                    onChange={e => setEmailOtpNew(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter OTP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-gray-400" />
                  {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                  <p className="text-xs text-gray-500 text-center">
                    Didn&apos;t receive OTP?
                    <button
                      onClick={() => handleResendOtp('new')}
                      disabled={resendOtpLoading}
                      className="ml-1 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50">
                      {resendOtpLoading ? 'Sending...' : 'Resend'}
                    </button>
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setEmailStep('otp-current')} disabled={loadingEmail} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Back</button>
                    <button onClick={verifyNewOtp} disabled={loadingEmail} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">{loadingEmail ? 'Confirming...' : 'Confirm Change'}</button>
                  </div>
                </div>
              )}

              {/* Step 4: Success */}
              {emailStep === 'success' && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">Email Updated!</p>
                    <p className="text-sm text-gray-500 mt-1">Your email has been successfully updated to <span className="font-medium">{emailForm.newEmail}</span></p>
                    <p className="text-xs text-gray-400 mt-2">A confirmation has been sent to both your old and new email addresses.</p>
                  </div>
                  <button onClick={resetEmailModal} className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════ 2FA MODAL ════════ */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {faAction === 'enable' ? 'Enable 2FA' : 'Disable 2FA'}
              </h3>
              <button onClick={() => setShow2FAModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {faAction === 'enable' ? (
                <>
                  {/* QR Code placeholder */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-36 h-36 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                      <div className="grid grid-cols-5 gap-1 p-2 opacity-30">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div key={i} className={`w-5 h-5 rounded-sm ${Math.random() > 0.4 ? 'bg-gray-900' : 'bg-white'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">Scan this QR code with your authenticator app (Google Authenticator / Authy)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP from Authenticator</label>
                    <input type="text" maxLength={6} value={faOtp}
                      onChange={e => setFaOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit OTP"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-gray-400" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">Please confirm your password to disable 2FA.</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" value={faPassword}
                      onChange={e => setFaPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                  </div>
                </>
              )}

              {faError && <p className="text-sm text-red-600">{faError}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShow2FAModal(false)} disabled={loading2FA} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button onClick={confirm2FA} disabled={loading2FA}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    faAction === 'enable' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-red-600 hover:bg-red-700'}`}>
                  {loading2FA ? (faAction === 'enable' ? 'Enabling...' : 'Disabling...') : (faAction === 'enable' ? 'Enable 2FA' : 'Disable 2FA')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ DELETE ACCOUNT MODAL ════════ */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-red-100 bg-red-50">
              <h3 className="text-base font-bold text-red-600">Delete Account</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-red-100 rounded-full transition">
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Permanently delete your account</p>
                  <p className="text-xs text-gray-500 mt-1">This action cannot be undone. All your data including job postings, applications, interviews, and settings will be permanently deleted.</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-medium text-red-600">⚠️ Important</p>
                <p className="text-xs text-red-600 mt-1">Please confirm your password to proceed with account deletion.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
              </div>

              {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowDeleteModal(false)} disabled={loadingDelete} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button onClick={handleDeleteAccount} disabled={loadingDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {loadingDelete ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
