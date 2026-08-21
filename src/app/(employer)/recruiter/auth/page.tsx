"use client";
import React, { useState, useEffect, useRef } from "react";
import { Eye, X } from "lucide-react";
import logger from "@/lib/logger";
import { recruiterAuthApi } from "@/api/recruiterAuthApiMain";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [open, setOpen] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: ""
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: ""
  });
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleGoogleSignIn = async () => {
    try {
      logger.info("🔐 Fetching Google OAuth URL from backend...");
      const params = new URLSearchParams({
        prompt: "select_account",
        access_type: "offline",
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/google/login-url?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to get Google login URL: ${response.status}`);
      }

      const data = await response.json();
      const authUrl = data.auth_url;

      if (!authUrl) {
        throw new Error("No auth_url in response");
      }

      logger.info("✅ Redirecting to Google OAuth...", { authUrl: authUrl.substring(0, 50) + "..." });
      window.location.href = authUrl;
    } catch (error) {
      logger.error("❌ Failed to initiate Google OAuth:", error);
      alert("Failed to start Google sign-in. Please try again.");
    }
  };

  // Get saved credentials from localStorage for sign-in suggestions
  const getSavedCredentials = (): string[] => {
    try {
      const saved = localStorage.getItem('savedCredentials');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // Save credentials to localStorage after successful signup
  const saveCredentials = (username: string, email: string) => {
    try {
      const saved = getSavedCredentials();
      // Add both username and email if not already saved
      if (username && !saved.includes(username)) saved.push(username);
      if (email && !saved.includes(email)) saved.push(email);
      localStorage.setItem('savedCredentials', JSON.stringify(saved));
    } catch {}
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    // Only add listener on client side
    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  // Reset form data when switching between signup and signin
  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      username: ""
    });
    setErrors({
      email: "",
      password: "",
      confirmPassword: "",
      username: ""
    });
  };

  const handleTabSwitch = (isSignUpTab: boolean) => {
    if (isSignUp !== isSignUpTab) {
      resetForm();
      setIsSignUp(isSignUpTab);
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // ⭐ STRONG PASSWORD VALIDATION
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const number = /[0-9]/.test(password);
    const special = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return minLength && upper && lower && number && special;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));

    // Show suggestions for username field during sign-in
    if (name === 'username' && !isSignUp && value.length >= 1) {
      const saved = getSavedCredentials();
      const filtered = saved.filter(cred =>
        cred.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (value: string) => {
    setFormData(prev => ({ ...prev, username: value }));
    setShowSuggestions(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      email: "",
      password: "",
      confirmPassword: "",
      username: ""
    };
    let isValid = true;

    if (isSignUp) {
      // Signup validation
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
        isValid = false;
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
        isValid = false;
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Please enter a valid email address";
        isValid = false;
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
    } else {
      // Login validation
      if (!formData.username.trim()) {
        newErrors.username = "Email or Username is required";
        isValid = false;
      }
    }

    // ⭐ Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (isSignUp && !validatePassword(formData.password)) {
      // Only validate password strength during signup, not signin
      newErrors.password =
        "Password must be 8+ chars, include uppercase, lowercase, number & special character";
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      setLoading(true);

      try {
        if (isSignUp) {
          // Call recruiter signup API: POST /api/v1/auth/signup/recruiter
          logger.debug('Calling signup API...');
          await recruiterAuthApi.signup({
            email: formData.email,
            username: formData.username,
            password: formData.password,
            fullName: "",
            companyName: "",
            phone: "",
            termsAccepted: true,
            companyWebsite: "",
          });
          // Save credentials for sign-in suggestions
          saveCredentials(formData.username, formData.email);
        } else {
          // Call recruiter signin API using /api/v1/auth/signin
          // Backend accepts either email or username in the 'username' field
          logger.debug('Calling login API with email/username:', formData.username);
          const loginResult = await recruiterAuthApi.login({
            email: formData.username, // Can be either email or username
            password: formData.password,
            rememberMe: false,
          });
          logger.debug('Login response:', loginResult);
        }

        logger.info('Auth successful! Data in localStorage:', localStorage.getItem('recruiterData'));

        // Redirect on success with a small delay to ensure data is saved
        if (typeof window !== "undefined") {
          logger.debug('Redirecting to dashboard in 500ms...');
          // Reset refresh timestamp so useTokenRefresh doesn't fire a stale refresh on mount
          localStorage.setItem('token_last_refreshed_at', Date.now().toString());

          setTimeout(() => {
            logger.debug('Executing redirect to dashboard');
            window.location.href = "/recruiter/dashboard";
          }, 500);
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        logger.error('Authentication error details:', error);
        logger.error('Error message:', error.message);
        logger.error('Full error object:', JSON.stringify(error, null, 2));

        // Handle error - check if it's an email/username already exists error
        const errorMessage = error.message || "Authentication failed. Please try again.";

        if (isSignUp && (
          errorMessage.toLowerCase().includes('email') &&
          (errorMessage.toLowerCase().includes('already') ||
           errorMessage.toLowerCase().includes('exist') ||
           errorMessage.toLowerCase().includes('registered'))
        )) {
          // Email already exists - show error on email field
          setErrors({
            ...newErrors,
            email: errorMessage
          });
        } else if (isSignUp && (
          errorMessage.toLowerCase().includes('username') &&
          (errorMessage.toLowerCase().includes('already') ||
           errorMessage.toLowerCase().includes('exist') ||
           errorMessage.toLowerCase().includes('taken'))
        )) {
          // Username already exists - show error on username field
          setErrors({
            ...newErrors,
            username: errorMessage
          });
        } else {
          // Other errors - show on password field
          setErrors({
            ...newErrors,
            password: errorMessage
          });
        }

        // Reset loading state on error
        setLoading(false);
        logger.debug('Loading state reset to false due to error');
      }
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700"
        >
          Recruiter Signup
        </button>
      )}

      {open && (
        <div className="min-h-screen flex items-center justify-center bg-black/20 px-4">
          <div className="relative h-auto w-full max-w-md rounded-4xl bg-white p-8 shadow-2xl border border-gray-200">

            <div className="flex items-center justify-between mb-6">
              <div className="flex w-[200px] rounded-full bg-gray-200 p-1">
                <button
                  onClick={() => handleTabSwitch(true)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium ${
                    isSignUp ? "bg-blue-600 text-white" : "text-gray-600"
                  }`}
                >
                  Sign up
                </button>
                <button
                  onClick={() => handleTabSwitch(false)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium ${
                    !isSignUp ? "bg-blue-600 text-white" : "text-gray-600"
                  }`}
                >
                  Sign in
                </button>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="hover:bg-gray-300 rounded-full p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="text-xl font-semibold mb-6 text-center text-blue-600">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h2>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full mb-4 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              {/* Username field - shown for both signup and login */}
              <div className="relative" ref={suggestionsRef}>
                <input
                  type="text"
                  name="username"
                  placeholder={isSignUp ? "Username" : "Email or Username"}
                  value={formData.username}
                  onChange={handleChange}
                  onFocus={() => {
                    if (!isSignUp && formData.username.length >= 1) {
                      const saved = getSavedCredentials();
                      const filtered = saved.filter(cred =>
                        cred.toLowerCase().startsWith(formData.username.toLowerCase())
                      );
                      setSuggestions(filtered);
                      setShowSuggestions(filtered.length > 0);
                    }
                  }}
                  autoComplete="off"
                  className={`w-full rounded-lg bg-gray-100 px-4 py-3 text-black ${
                    errors.username ? "border-2 border-red-500" : ""
                  }`}
                />
                {/* Custom suggestion dropdown */}
                {!isSignUp && showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>

              {/* Email field - only shown for signup */}
              {isSignUp && (
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="off"
                    className={`w-full rounded-lg bg-gray-100 px-4 py-3 text-black ${
                      errors.email ? "border-2 border-red-500" : ""
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
              )}

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    className={`w-full rounded-lg bg-gray-100 px-4 py-3 text-black ${
                      errors.password ? "border-2 border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center"
                  >
                    <Eye size={20} />
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {isSignUp && (
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className={`w-full rounded-lg bg-gray-100 px-4 py-3 text-black ${
                        errors.confirmPassword ? "border-2 border-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Please wait..." : isSignUp ? "Sign up" : "Sign in"}
              </button>
            </form>

            <p className="text-xs text-center mt-6 text-black">
              By creating an account, you agree to our{" "}
              <span className="underline cursor-pointer">Terms & Service</span>.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
