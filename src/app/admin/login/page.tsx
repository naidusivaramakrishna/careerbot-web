"use client";
import React, { useState } from "react";
import { Eye, EyeClosed, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminLogin, adminSignUp, bootstrapAdmin } from "@/api/adminAuthApi";
import { toast } from "sonner";
import logger from "@/lib/logger";

// Type guard for API errors
interface ApiError {
  response?: {
    status: number;
    data?: {
      detail?: string;
      error?: {
        message?: string;
      };
    };
  };
  request?: unknown;
  message?: string;
}

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    ('response' in err || 'request' in err || 'message' in err)
  );
}

const AdminLoginPage = () => {
    const [isSignUp, setIsSignUp] = useState(false); // Start with Sign In
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [totpRequired, setTotpRequired] = useState(false);

    const router = useRouter();

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        totpCode: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear error on input change
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isSignUp) {
                // Step 1: Try bootstrap endpoint first (works only when no admins exist)
                let signupSuccess = false;
                
                try {
                    await bootstrapAdmin({
                        email: formData.email,
                        full_name: formData.fullName,
                        password: formData.password
                    });
                    logger.info('✅ Bootstrap successful - Super Admin created');
                    toast.success("Super Admin created successfully! Logging you in...");
                    signupSuccess = true;
                } catch (bootstrapErr: unknown) {
                    // Bootstrap failed - determine if we should fall back to regular signup
                    if (!isApiError(bootstrapErr)) {
                        throw bootstrapErr;
                    }

                    const bootstrapStatus = bootstrapErr.response?.status;
                    const bootstrapData = bootstrapErr.response?.data;
                    // Check both 'detail' and 'error.message' fields for the error message
                    const errorMessage = bootstrapData?.detail || bootstrapData?.error?.message || '';
                    const bootstrapDetailStr = typeof errorMessage === 'string' ? errorMessage.toLowerCase() : '';

                    logger.warn('⚠️ Bootstrap failed:', { status: bootstrapStatus, detail: bootstrapDetailStr });

                    // Check if bootstrap failed because admins already exist
                    const adminsAlreadyExist = (
                        (bootstrapStatus === 400 || bootstrapStatus === 403 || bootstrapStatus === 409) &&
                        (bootstrapDetailStr.includes('admin already') ||
                         bootstrapDetailStr.includes('admin exists') ||
                         bootstrapDetailStr.includes('already created') ||
                         bootstrapDetailStr.includes('already exist') ||
                         bootstrapDetailStr.includes('bootstrap') ||
                         bootstrapDetailStr.includes('cannot bootstrap'))
                    );

                    if (adminsAlreadyExist) {
                        // Silently fall back to regular signup (don't show bootstrap error)
                        logger.info('ℹ️ Admins already exist, falling back to regular signup');
                        
                        try {
                            await adminSignUp({
                                email: formData.email,
                                full_name: formData.fullName,
                                password: formData.password
                            });
                            logger.info('✅ Regular signup successful');
                            toast.success("Account created successfully! Logging you in...");
                            signupSuccess = true;
                        } catch (signupErr: unknown) {
                            // This is the actual error we want to show to the user
                            logger.error('❌ Regular signup failed:', signupErr);
                            throw signupErr; // Re-throw to be caught by outer catch block
                        }
                    } else {
                        // Bootstrap failed for other reasons (rate limit, validation, network, etc.)
                        // Show this error to the user
                        logger.error('❌ Bootstrap failed for non-admin-exists reason');
                        throw bootstrapErr;
                    }
                }

                // Step 2: Auto-login after successful signup
                if (signupSuccess) {
                    await adminLogin({
                        email: formData.email,
                        password: formData.password,
                    });

                    // Step 3: Redirect to admin dashboard
                    router.push('/admin/dashboard');
                }
            } else {
                // Sign in
                logger.info('🔐 Attempting login with:', { email: formData.email });

                const response = await adminLogin({
                    email: formData.email,
                    password: formData.password,
                    totp_code: totpRequired ? formData.totpCode : undefined
                });
                logger.info('✅ Login response:', response);
                toast.success("Login successful");
                
                // Redirect to admin dashboard on successful login
                router.push('/admin/dashboard');
            }
        } catch (err: unknown) {
            logger.error('❌ Auth error:', err);

            // Better error handling
            let errorMessage = 'An error occurred. Please try again.';

            if (isApiError(err) && err.response) {
                // Server responded with error
                const status = err.response.status;
                const data = err.response.data;

                logger.error('Server error:', { status, data });

                // Check for 2FA requirement (various possible error formats)
                const apiErrorMsg = data?.detail || data?.error?.message || '';
                const detailStr = typeof apiErrorMsg === 'string' ? apiErrorMsg : '';
                const is2FARequired =
                    (status === 403 || status === 401) &&
                    (detailStr.toLowerCase().includes('2fa') ||
                        detailStr.toLowerCase().includes('two-factor') ||
                        detailStr.toLowerCase().includes('totp'));

                if (is2FARequired && !totpRequired) {
                    setTotpRequired(true);
                    errorMessage = 'This account has 2FA enabled. Please enter your authentication code.';
                } else if (is2FARequired && totpRequired) {
                    errorMessage = 'Invalid 2FA code. Please check your authenticator app and try again.';
                } else if (status === 401) {
                    errorMessage = 'Invalid email or password';
                } else if (status === 422) {
                    errorMessage = apiErrorMsg || 'Validation error. Please check your input.';
                } else if (status === 429) {
                    errorMessage = 'Too many attempts. Please try again later.';
                } else {
                    errorMessage = apiErrorMsg || `Server error (${status})`;
                }
            } else if (isApiError(err) && err.request) {
                // Request made but no response
                logger.error('No response from server');
                errorMessage = 'Cannot connect to server. Please check if backend is running.';
            } else if (isApiError(err) && err.message) {
                // Error setting up request
                logger.error('Request setup error:', err.message);
                errorMessage = err.message;
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-black/20 px-4">
                <div className="relative h-auto w-full max-w-md rounded-4xl bg-white backdrop-blur-xl p-8 shadow-2xl border border-white/10">
                    {/* Toggle Buttons */}
                    <div className='flex items-center justify-between mb-6'>
                        <div className="flex w-[200px] rounded-full bg-gray-300 p-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(true);
                                    setTotpRequired(false);
                                    setError('');
                                    setFormData({ fullName: '', email: '', password: '', totpCode: '' });
                                }}
                                className={`flex-1 cursor-pointer py-2 rounded-full text-sm font-medium transition-all ${isSignUp ? "bg-black text-white" : "text-gray-600"
                                    }`}
                            >
                                Sign up
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(false);
                                    setTotpRequired(false);
                                    setError('');
                                    setFormData({ fullName: '', email: '', password: '', totpCode: '' });
                                }}
                                className={`flex-1 cursor-pointer py-2 rounded-full text-sm font-medium transition-all ${!isSignUp ? "bg-black text-white" : "text-gray-600"
                                    }`}
                            >
                                Sign in
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="cursor-pointer hover:bg-black hover:text-white rounded-full p-1.5"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <h2 className="text-xl font-semibold mb-6 text-center">
                        {isSignUp ? "Create an account" : "Welcome back"}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Full Name"
                                    required
                                    className="w-full rounded-lg bg-gray-100 outline-none px-4 py-3 placeholder-gray-500 transition"
                                />
                            </div>
                        )}
                        <div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Email address"
                                required
                                className="w-full rounded-lg bg-gray-100 outline-none px-4 py-3 placeholder-gray-500 transition"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Password"
                                required
                                className="w-full rounded-lg bg-gray-100 outline-none px-4 py-3 placeholder-gray-500 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-600"
                            >
                                {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
                            </button>
                        </div>

                        {/* 2FA Toggle Link - Show when not in signup mode and 2FA not yet shown */}
                        {!isSignUp && !totpRequired && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setTotpRequired(true)}
                                    className="text-sm cursor-pointer text-blue-600 hover:text-blue-800 underline"
                                >
                                    Login with 2FA
                                </button>
                            </div>
                        )}

                        {/* 2FA Code Input - shown when required */}
                        {totpRequired && !isSignUp && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-sm font-semibold text-blue-900">Two-Factor Authentication</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTotpRequired(false);
                                            setFormData(prev => ({ ...prev, totpCode: '' }));
                                            setError('');
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <p className="text-xs text-blue-700 mb-3">Enter the 6-digit code from your authenticator app</p>
                                <input
                                    type="text"
                                    name="totpCode"
                                    value={formData.totpCode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setFormData(prev => ({ ...prev, totpCode: value }));
                                        setError('');
                                    }}
                                    placeholder="000000"
                                    maxLength={6}
                                    autoFocus
                                    className="w-full rounded-lg bg-white border-2 border-blue-300 outline-none px-4 py-3 text-center text-lg font-mono tracking-widest placeholder-gray-400 transition focus:border-blue-500"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 cursor-pointer bg-black text-white py-3 rounded-lg font-semibold hover:bg-black/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Please wait...' : (isSignUp ? "Sign up" : "Sign in")}
                        </button>
                    </form>

                    <p className="text-xs text-center mt-6">
                        By creating an account, you agree to our{" "}
                        <span className="underline cursor-pointer">Terms & Service</span>.
                    </p>
                </div>
            </div>
        </>
    );
};

export default AdminLoginPage;
