"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Eye, EyeClosed } from "lucide-react";
import { confirmPasswordReset } from "@/api/authApi";
import { validatePassword } from "@/lib/passwordPolicy";
import { PasswordRequirements } from "@/components/PasswordRequirements";
import { toast } from "sonner";
import logger from "@/lib/logger";

const ResetPasswordContent = () => {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({ password: "", confirmPassword: "" });
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);

  // Extract token from URL and strip from URL for privacy
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      // Store token in state before stripping from URL
      setToken(urlToken);
      // Strip token from URL after reading to prevent leakage via:
      // - Browser history
      // - Referer headers
      // - Server access logs
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      setResetError("No reset token found. Please check your email link.");
    }
  }, []);

  // Countdown timer for redirect on success
  useEffect(() => {
    if (resetSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      setRedirectTimer(timer);
      return () => clearTimeout(timer);
    }

    if (countdown === 0 && resetSuccess) {
      router.push("/?showLogin=true");
    }
  }, [countdown, resetSuccess, router]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [redirectTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setResetError("No reset token found.");
      return;
    }

    // Validate password strength
    const validation = validatePassword(formData.password);
    if (!validation.valid) {
      setFieldErrors({ password: validation.message, confirmPassword: "" });
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ password: "", confirmPassword: "Passwords do not match" });
      return;
    }

    setFieldErrors({ password: "", confirmPassword: "" });

    try {
      setIsResetting(true);

      const response = await confirmPasswordReset({
        token,
        new_password: formData.password,
      });

      logger.info("Password reset response received");

      // Backend returns success if API call completes without error
      // Response contains: { message: "Password reset successfully" } or similar
      if (response && response.message) {
        setResetSuccess(true);
        toast.success(response.message || "Password reset successfully!");
      } else {
        setResetError("Password reset failed. Please try again.");
        toast.error("Password reset failed. Please try again.");
      }
    } catch (error: unknown) {
      logger.error("Password reset error:", error);

      let errorMsg = "Failed to reset password. Please try again.";
      let isSamePasswordError = false;

      if (typeof error === "object" && error !== null) {
        const apiError = error as { response?: { data?: { error?: { code?: string; message?: string }; detail?: string } } };

        // Check for error code first (preferred)
        const errorCode = apiError.response?.data?.error?.code;
        if (errorCode === "PASSWORD_REUSE" || errorCode?.toLowerCase().includes("password_reuse")) {
          isSamePasswordError = true;
          errorMsg = "Your new password must be different from your current password";
        } else {
          // Fallback to message patterns
          const msg =
            apiError.response?.data?.error?.message ||
            apiError.response?.data?.detail ||
            "";

          if (msg.toLowerCase().includes("same") && msg.toLowerCase().includes("password")) {
            isSamePasswordError = true;
            errorMsg = "Your new password must be different from your current password";
          } else {
            errorMsg = msg || "Failed to reset password. Please try again.";
          }
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      // Show inline field error for "same password" case, full error page for others
      if (isSamePasswordError) {
        setFieldErrors({ password: errorMsg, confirmPassword: "" });
      } else {
        setResetError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Success State */}
        {resetSuccess && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2 text-center">Password Reset!</h1>
            <p className="text-gray-600 mb-6 text-center">
              Your password has been successfully reset. You can now Sign In with your new password.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 text-center">
                Redirecting to Sign In in <span className="font-bold text-blue-600" aria-live="polite" aria-atomic="true">{countdown}s</span>...
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/?showLogin=true")}
                className="w-full bg-[#2257a7] hover:bg-[#184284] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Go to Sign In
              </button>
            </div>
          </>
        )}

        {/* Error State */}
        {resetError && !resetSuccess && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="bg-red-100 rounded-full p-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2 text-center">Reset Failed</h1>
            <p className="text-gray-600 mb-6 text-center">{resetError}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (token) {
                    setResetError("");
                    setFormData({ password: "", confirmPassword: "" });
                    setFieldErrors({ password: "", confirmPassword: "" });
                  } else {
                    setResetError("No reset token found. Please request a new password reset link.");
                  }
                }}
                className="w-full bg-[#2257a7] hover:bg-[#184284] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/?showLogin=true")}
                className="w-full bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </>
        )}

        {/* Form State */}
        {(token && !resetSuccess && !resetError) && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Reset Your Password</h1>
            <p className="text-gray-600 text-center mb-6">Enter your new password below.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoFocus
                    value={formData.password}
                    onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setFieldErrors(p => ({ ...p, password: "" })); }}
                    placeholder="Enter new password"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${fieldErrors.password ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#2257a7]"}`}
                    disabled={isResetting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); setFieldErrors(p => ({ ...p, confirmPassword: "" })); }}
                    placeholder="Confirm password"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${fieldErrors.confirmPassword ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"}`}
                    disabled={isResetting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>}
              </div>

              <PasswordRequirements password={formData.password} />

              <button
                type="submit"
                disabled={isResetting}
                className="w-full bg-[#2257a7] hover:bg-[#184284] disabled:bg-[#2557a7] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isResetting ? (
                  <span className="flex items-center cursor-pointer justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/?showLogin=true")}
                className="w-full bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              >
                Back to Sign In
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
  return <ResetPasswordContent />;
};

export default ResetPasswordPage;
