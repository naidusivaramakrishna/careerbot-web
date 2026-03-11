"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, CheckCircle } from "lucide-react";
import { requestPasswordReset } from "@/api/authApi";
import { toast } from "sonner";
import logger from "@/lib/logger";

type ForgotPasswordStatus = "idle" | "loading" | "success";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<ForgotPasswordStatus>("idle");
  const [emailError, setEmailError] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setStatus("loading");
      setEmailError("");
      logger.info("Requesting password reset for:", email);

      const response = await requestPasswordReset({ email });

      logger.info("Password reset request response:", response);

      setStatus("success");
      toast.success(response.message || "Password reset email sent successfully!");

      // Clear form
      setEmail("");

      // Redirect after 5 seconds
      setTimeout(() => {
        router.push("/?showLogin=true");
      }, 5000);
    } catch (error: unknown) {
      logger.error("Error requesting password reset:", error);

      let errorMsg = "Failed to request password reset. Please try again.";
      if (typeof error === "object" && error !== null) {
        const apiError = error as { response?: { data?: { error?: { message?: string }; detail?: string } } };
        errorMsg =
          apiError.response?.data?.error?.message ||
          apiError.response?.data?.detail ||
          "Failed to request password reset. Please try again.";
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      setStatus("idle");
      setEmailError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        {status !== "success" && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 rounded-full p-4">
                <KeyRound className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Forgot Password?</h1>
            <p className="text-gray-600 text-center mb-6">
              Enter your email address and we'll send you a link to reset your password.
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
              A password reset link has been sent to <strong>{email}</strong>. Check your email and follow the instructions.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">Redirecting to Sign In in 5 seconds...</p>
            </div>
          </>
        )}

        {/* Form */}
        {status !== "success" ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${emailError ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-500"}`}
                disabled={status === "loading"}
                required
              />
              {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
            >
              {status === "loading" ? (
                <span className="flex items-center justify-center cursor-pointer gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
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
        ) : null}

        {/* Success State Buttons */}
        {status === "success" && (
          <button
            onClick={() => router.push("/?showLogin=true")}
            className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Go to Sign In
          </button>
        )}

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-3">
            <strong>Remember your password?</strong>
          </p>
          <button
            type="button"
            onClick={() => router.push("/?showLogin=true")}
            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-semibold underline w-full text-center"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
