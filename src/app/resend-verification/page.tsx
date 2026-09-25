"use client";

import React from "react";
import { Mail, CheckCircle } from "lucide-react";
import { resendVerificationEmail } from "@/api/authApi";
import { useEmailForm } from "@/hooks/useEmailForm";

const ResendVerificationPage = () => {
  const { email, setEmail, emailError, status, handleSubmit, goToSignIn } = useEmailForm({
    onSubmit: (email) => resendVerificationEmail({ email }),
    errorContext: "email_verify",
    successMessage: "Verification email sent successfully!",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">

        {status !== "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-[#c9dcf2] rounded-full p-4">
                <Mail className="w-8 h-8 text-[#2257a7]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Resend Verification Email</h1>
            <p className="text-gray-600 text-center mb-6">
              Enter your email address and we&apos;ll send you a new verification code.
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
            <h1 className="text-2xl font-bold text-green-600 mb-2 text-center">Email Sent!</h1>
            <p className="text-gray-600 text-center mb-6">
              If <strong>{email}</strong> is registered and not yet verified, we&apos;ve sent it a new 6-digit code.
            </p>
            <p className="text-gray-600 text-center mb-6">
              To enter the code, sign in with your email and password. You&apos;ll be asked for it before your account opens.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">Redirecting to Sign In in 5 seconds...</p>
            </div>
            <button
              type="button"
              data-testid="goto-signin-btn"
              onClick={goToSignIn}
              className="w-full bg-[#2257a7] hover:bg-[#184284] text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Go to Sign In
            </button>
          </>
        )}

        {status !== "success" && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="resend-email"
                name="email"
                type="email"
                data-testid="resend-email-input"
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
              data-testid="resend-submit-btn"
              disabled={status === "loading"}
              className="w-full bg-[#2257a7] hover:bg-[#184284] disabled:bg-[#2557a7] text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </span>
              ) : (
                "Resend Verification Email"
              )}
            </button>

            <button
              type="button"
              data-testid="back-to-signin-btn"
              onClick={goToSignIn}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
            >
              Back to Sign In
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-3">
            <strong>Tips:</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Check your spam/junk folder</li>
            <li>Verification codes expire after 10 minutes. Request a new one if yours has expired</li>
            <li>Make sure you entered the correct email</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResendVerificationPage;
