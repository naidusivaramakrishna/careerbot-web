"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mail, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/api/authApi";
import { useEmailForm } from "@/hooks/useEmailForm";

const ForgotPasswordPage = () => {
  const { email, setEmail, emailError, status, handleSubmit, goToSignIn } = useEmailForm({
    onSubmit: (email) => requestPasswordReset({ email }),
    errorContext: "password_reset",
    successMessage: "Password reset email sent successfully!",
    rateLimitSeconds: 60,
    disableAutoRedirect: true, // User must click "Back to Sign In" button manually
  });

  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const lastResendTimeRef = useRef(0);
  const RESEND_RATE_LIMIT = 60; // Same as main form rate limit

  useEffect(() => {
    if (status === "success") {
      // On initial success, set countdown to rate limit
      lastResendTimeRef.current = Date.now();
      setResendCountdown(RESEND_RATE_LIMIT);
    }
  }, [status]);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCountdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResendEmail = async () => {
    if (!email) return;

    const now = Date.now();
    const timeSinceLastAttempt = now - lastResendTimeRef.current;
    const remainingSeconds = Math.ceil((RESEND_RATE_LIMIT * 1000 - timeSinceLastAttempt) / 1000);

    if (timeSinceLastAttempt < RESEND_RATE_LIMIT * 1000) {
      toast.error(`Please wait ${remainingSeconds}s before resending`);
      return;
    }

    setIsResending(true);
    try {
      await requestPasswordReset({ email });
      lastResendTimeRef.current = now;
      setResendCountdown(RESEND_RATE_LIMIT);
      toast.success("Reset link resent to your email");
    } catch {
      toast.error("Failed to resend reset link. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">

        {status !== "success" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Forgot your password?</h1>
            <p className="text-gray-600 text-center mb-6">
              Enter your email address and we&apos;ll send you a reset link.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-6">
              <CircleCheck className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Check your email</h1>
            <p className="text-gray-600 text-center mb-4">
              We sent a password reset link to your email address.
            </p>
            <p className="text-gray-900 font-semibold text-center mb-6">
              {email}
            </p>
            <button
              type="button"
              data-testid="goto-signin-btn"
              onClick={goToSignIn}
              className="w-full bg-[#2257a7] hover:bg-[#184284] cursor-pointer text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Back to Sign In
            </button>
            {resendCountdown > 0 ? (
              <p className="text-sm text-gray-600 text-center mt-4">
                Didn&apos;t get the email? Resend in {formatCountdown(resendCountdown)}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={isResending}
                className="text-sm text-[#2257a7] hover:text-[#184284] cursor-pointer font-semibold text-center mt-4 w-full"
              >
                {isResending ? "Resending..." : "Didn't get the email? Resend now"}
              </button>
            )}
          </>
        )}

        {status !== "success" && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <div className={`flex items-center px-4 py-3 border rounded-lg focus-within:outline-none focus-within:ring-2 focus-within:border-transparent ${emailError ? "border-red-400 focus-within:ring-red-300" : "border-gray-300 focus-within:ring-[#2257a7]"}`}>
                <Mail className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  data-testid="forgot-email-input"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-transparent focus:outline-none"
                  disabled={status === "loading"}
                />
              </div>
              {emailError && <p role="alert" className="text-red-500 text-sm mt-1">{emailError}</p>}
            </div>

            <button
              type="submit"
              data-testid="send-reset-link-btn"
              disabled={status === "loading"}
              className="w-full bg-[#2257a7] hover:bg-[#184284] disabled:bg-[#2557a7] text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
            >
              {status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </span>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        )}

        {status !== "success" && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              Remember your password?{" "}
              <button
                type="button"
                data-testid="remember-password-signin-btn"
                onClick={goToSignIn}
                className="text-[#2257a7] hover:text-[#184284] cursor-pointer font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
