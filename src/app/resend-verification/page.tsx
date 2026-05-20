"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle } from "lucide-react";
import { resendVerificationEmail } from "@/api/authApi";
import { toast } from "sonner";
import logger from "@/lib/logger";

type ResendStatus = "idle" | "loading" | "success";

const ResendVerificationPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<ResendStatus>("idle");
  const [emailError, setEmailError] = useState("");

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setStatus("loading");
      setEmailError("");
      logger.info("Requesting to resend verification email for:", email);

      const response = await resendVerificationEmail({ email });

      logger.info("Resend verification email response:", response);

      setStatus("success");
      toast.success(response.message || "Verification email sent successfully!");

      // Clear form
      setEmail("");

      // Redirect after 5 seconds
      setTimeout(() => {
        router.push("/?showLogin=true");
      }, 5000);
    } catch (error: unknown) {
      logger.error("Error resending verification email:", error);

      let errorMsg = "Failed to resend verification email. Please try again.";
      if (typeof error === "object" && error !== null) {
        const apiError = error as { response?: { data?: { error?: { message?: string }; detail?: string } } };
        errorMsg =
          apiError.response?.data?.error?.message ||
          apiError.response?.data?.detail ||
          "Failed to resend verification email. Please try again.";
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      setStatus("idle");
      setEmailError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        {status !== "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-[#c9dcf2] rounded-full p-4">
                <Mail className="w-8 h-8 text-[#2257a7]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Resend Verification Email</h1>
            <p className="text-gray-600 text-center mb-6">
              Enter your email address and we&apos;ll send you a new verification link.
            </p>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2 text-center">Email Sent!</h1>
            <p className="text-gray-600 text-center mb-6">
              A verification email has been sent to <strong>{email}</strong>. Check your inbox and click the verification link.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">Redirecting to Sign In in 5 seconds...</p>
            </div>
          </>
        )}


        {/* Form */}
        {status !== "success" ? (
          <form onSubmit={handleResendEmail} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="your@email.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${emailError ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#2257a7]"}`}
                disabled={status === "loading"}
                required
              />
              {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
            </div>

            <button
              type="submit"
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
              onClick={() => router.push("/?showLogin=true")}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
            >
              Back to Sign In
            </button>
          </form>
        ) : null}

        {/* Success State Buttons */}
        {status === "success" && (
          <button
            onClick={() => router.push("/?showLogin=true")}
            className="w-full bg-[#2257a7] hover:bg-[#184284] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Go to Sign In
          </button>
        )}

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-3">
            <strong>Tips:</strong>
          </p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Check your spam/junk folder</li>
            <li>Verification links expire in 48 hours</li>
            <li>Make sure you entered the correct email</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResendVerificationPage;
