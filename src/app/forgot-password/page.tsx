"use client";

import React from "react";
import { KeyRound, CheckCircle } from "lucide-react";
import { requestPasswordReset } from "@/api/authApi";
import { useEmailForm } from "@/hooks/useEmailForm";

const ForgotPasswordPage = () => {
  const { email, setEmail, emailError, status, handleSubmit, goToSignIn } = useEmailForm({
    onSubmit: (email) => requestPasswordReset({ email }),
    errorContext: "password_reset",
    successMessage: "Password reset email sent successfully!",
    rateLimitSeconds: 60,
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">

        {status !== "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-[#c9dcf2] rounded-full p-4">
                <KeyRound className="w-8 h-8 text-[#2257a7]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Forgot Password?</h1>
            <p className="text-gray-600 text-center mb-6">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2 text-center">Check Your Email</h1>
            <p className="text-gray-600 text-center mb-6">
              If an account exists with this email address, a password reset link will be sent. Check your email and spam folder for instructions.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                Redirecting to Sign In in <span aria-live="polite" aria-atomic="true">5 seconds</span>...
              </p>
            </div>
            <button
              type="button"
              data-testid="goto-signin-btn"
              onClick={goToSignIn}
              className="w-full bg-[#2257a7] hover:bg-[#184284] cursor-pointer text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Go to Sign In
            </button>
          </>
        )}

        {status !== "success" && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                data-testid="forgot-email-input"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${emailError ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#2257a7]"}`}
                disabled={status === "loading"}
              />
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
                "Send Reset Link"
              )}
            </button>

            <button
              type="button"
              data-testid="back-to-signin-btn"
              onClick={goToSignIn}
              className="w-full bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
            >
              Back to Sign In
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-3">
            <strong>Remember your password?</strong>
          </p>
          <button
            type="button"
            data-testid="remember-password-signin-btn"
            onClick={goToSignIn}
            className="text-sm text-[#2257a7] hover:text-[#184284] cursor-pointer font-semibold underline w-full text-center"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
