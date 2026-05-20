"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Eye, EyeClosed } from "lucide-react";
import { confirmPasswordReset } from "@/api/authApi";
import { toast } from "sonner";
import logger from "@/lib/logger";

type ResetStatus = "loading" | "form" | "success" | "error";

const ResetPasswordContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<ResetStatus>(token ? "form" : "error");
  const [errorMessage, setErrorMessage] = useState(token ? "" : "No reset token found. Please check your email link.");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({ password: "", confirmPassword: "" });

  // Countdown timer for redirect on success
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0 && status === "success") {
      router.push("/?showLogin=true");
    }
  }, [countdown, status, router]);

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (!password) {
      return { valid: false, message: "Password is required" };
    }

    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }

    if (!/\d/.test(password)) {
      return { valid: false, message: "Password must contain at least one digit" };
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, message: "Password must contain at least one special character" };
    }

    return { valid: true, message: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setStatus("error");
      setErrorMessage("No reset token found.");
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
      setStatus("loading");
      logger.info("Confirming password reset with token:", token.substring(0, 10) + "...");

      const response = await confirmPasswordReset({
        token,
        new_password: formData.password,
      });

      logger.info("Password reset response:", response);

      // Backend returns success if API call completes without error
      // Response contains: { message: "Password reset successfully" } or similar
      if (response && response.message) {
        setStatus("success");
        toast.success(response.message || "Password reset successfully!");
      } else {
        setStatus("error");
        setErrorMessage("Password reset failed. Please try again.");
        toast.error("Password reset failed. Please try again.");
      }
    } catch (error: unknown) {
      logger.error("Password reset error:", error);

      let errorMsg = "Failed to reset password. Please try again.";
      if (typeof error === "object" && error !== null) {
        const apiError = error as { response?: { data?: { error?: { message?: string }; detail?: string } } };
        errorMsg =
          apiError.response?.data?.error?.message ||
          apiError.response?.data?.detail ||
          "Failed to reset password. Please try again.";
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      // Show inline field error for "same password" case, full error page for others
      if (errorMsg.toLowerCase().includes("same as current")) {
        setStatus("form");
        setFieldErrors({ password: errorMsg, confirmPassword: "" });
      } else {
        setStatus("error");
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Success State */}
        {status === "success" && (
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
                Redirecting to Sign In in <span className="font-bold text-blue-600">{countdown}s</span>...
              </p>
            </div>
            <button
              onClick={() => router.push("/?showLogin=true")}
              className="w-full bg-[#2257a7] hover:bg-[#184284] text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Go to Sign In
            </button>
          </>
        )}

        {/* Error State */}
        {status === "error" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="bg-red-100 rounded-full p-4">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2 text-center">Reset Failed</h1>
            <p className="text-gray-600 mb-6 text-center">{errorMessage}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (token) {
                    setStatus("form");
                    setFormData({ password: "", confirmPassword: "" });
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
        {(status === "form" || status === "loading") && (
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
                    value={formData.password}
                    onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setFieldErrors(p => ({ ...p, password: "" })); }}
                    placeholder="Enter new password"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${fieldErrors.password ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#2257a7]"}`}
                    disabled={status === "loading"}
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
                    disabled={status === "loading"}
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

              {/* Password Requirements */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className={formData.password.length >= 8 ? "text-green-600" : ""}>
                    ✓ At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? "text-green-600" : ""}>
                    ✓ One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(formData.password) ? "text-green-600" : ""}>
                    ✓ One lowercase letter
                  </li>
                  <li className={/\d/.test(formData.password) ? "text-green-600" : ""}>
                    ✓ One number
                  </li>
                  <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? "text-green-600" : ""}>
                    ✓ One special character
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-[#2257a7] hover:bg-[#184284] disabled:bg-[#2557a7] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {status === "loading" ? (
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
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;
