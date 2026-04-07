"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Mail } from "lucide-react";
import { verifyEmail } from "@/api/authApi";
import { toast } from "sonner";
import logger from "@/lib/logger";

type VerificationStatus = "loading" | "success" | "error" | "idle";

const VerifyEmailContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Auto-verify if token exists
    if (token) {
      verifyEmailToken();
    } else {
      setStatus("error");
      setErrorMessage("No verification token found. Please check your email link.");
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect immediately on success, countdown timer for error
  useEffect(() => {
    if (status === "success") {
      // Wait 2 seconds to show success message, then redirect to login
      const timer = setTimeout(() => {
        window.location.href = "/?showLogin=true&verified=true";
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (status === "error" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    // Redirect on error after countdown
    if (status === "error" && countdown === 0) {
      router.push("/?showLogin=true");
    }
  }, [countdown, status, router]);

  const verifyEmailToken = async () => {
    if (!token) return;

    try {
      setStatus("loading");
      logger.info("Verifying email with token:", token.substring(0, 10) + "...");

      const response = await verifyEmail({ token });

      logger.info("Email verification response:", response);

      // Backend returns success if API call completes without error
      // Response contains: { message: "Email verified successfully" } or similar
      if (response && response.message) {
        setStatus("success");
        toast.success(response.message || "Email verified successfully!");
      } else {
        setStatus("error");
        setErrorMessage("Email verification failed. Please try again.");
        toast.error("Email verification failed. Please try again.");
      }
    } catch (error: unknown) {
      logger.error("Email verification error:", error);

      setStatus("error");

      let errorMsg = "Email verification failed. Please try again.";
      if (typeof error === "object" && error !== null) {
        const apiError = error as { response?: { data?: { error?: { message?: string }; detail?: string } } };
        errorMsg =
          apiError.response?.data?.error?.message ||
          apiError.response?.data?.detail ||
          "Email verification failed. Please try again.";
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Loading State */}
        {status === "loading" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
            <p className="text-gray-600 mb-4">Please wait while we verify your email address...</p>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-6">
              Your email address has been successfully verified. Your account is now active.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">Redirecting to Sign In page...</p>
            </div>
            <button
              onClick={() => window.location.href = "/?showLogin=true&verified=true"}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
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
            <h1 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-4">{errorMessage}</p>

            {/* Troubleshooting tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-yellow-900 mb-2">What you can do:</p>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Check if the link has expired (links expire in 48 hours)</li>
                <li>Request a new verification email</li>
                <li>Check your spam/junk folder</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setCountdown(5);
                  setStatus("idle");
                  if (token) {
                    verifyEmailToken();
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/?showLogin=true")}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              >
                Back to Sign In
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-700">
                Redirecting to Sign In in <span className="font-bold text-blue-600">{countdown}s</span>...
              </p>
            </div>
          </>
        )}

        {/* Idle State (No token) */}
        {status === "idle" && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="bg-gray-100 rounded-full p-4">
                <Mail className="w-12 h-12 text-gray-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verification</h1>
            <p className="text-gray-600 mb-6">
              Click the link in your email to verify your email address.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-4">
                <strong>Didn&apos;t receive the email?</strong>
              </p>
              <button
                onClick={() => router.push("/?showLogin=true")}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Click here to request a new verification email
              </button>
            </div>

            <button
              onClick={() => router.push("/?showLogin=true")}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const VerifyEmailPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmailPage;
