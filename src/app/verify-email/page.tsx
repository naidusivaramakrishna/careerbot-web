"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Mail } from "lucide-react";
import { verifyEmail, signIn } from "@/api/authApi";
import { toast } from "sonner";
import logger from "@/lib/logger";
import axios from "axios";

type VerificationStatus = "loading" | "success" | "error" | "idle" | "waiting-otp";

const VerifyEmailContent = () => {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<VerificationStatus>("waiting-otp");
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("pendingVerificationUserId");
    const storedEmail = sessionStorage.getItem("pendingVerificationEmail");
    const storedPassword = sessionStorage.getItem("pendingVerificationPassword");

    if (storedUserId) setUserId(storedUserId);
    if (storedEmail) setEmail(storedEmail);
    if (storedPassword) setPassword(storedPassword);
  }, []);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(async () => {
        // Auto-signin user after email verification
        try {
          await signIn({ email, password });
          localStorage.setItem('token_last_refreshed_at', Date.now().toString());

          // Clear temporary credentials
          sessionStorage.removeItem("pendingVerificationUserId");
          sessionStorage.removeItem("pendingVerificationEmail");
          sessionStorage.removeItem("pendingVerificationPassword");

          // Redirect to onboarding
          window.location.href = "/onboarding";
        } catch (signinError) {
          logger.error("Auto-signin failed after email verification:", signinError);
          // Fallback to signin page if auto-signin fails
          sessionStorage.removeItem("pendingVerificationUserId");
          sessionStorage.removeItem("pendingVerificationEmail");
          sessionStorage.removeItem("pendingVerificationPassword");
          sessionStorage.setItem("emailVerified", "true");
          window.location.href = "/?showLogin=true&verified=true";
        }
      }, 2000);
      setRedirectTimer(timer);
      return () => clearTimeout(timer);
    }

    if (status === "error" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      setRedirectTimer(timer);
      return () => clearTimeout(timer);
    }

    if (status === "error" && countdown === 0) {
      router.push("/?showLogin=true");
    }
  }, [countdown, status, router, email, password]);

  useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [redirectTimer]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      setStatus("error");
      setErrorMessage("Session expired. Please sign up again.");
      toast.error("Session expired. Please sign up again.");
      return;
    }

    if (!otp || otp.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit OTP.");
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setStatus("loading");
      const response = await verifyEmail({ user_id: userId, otp });

      logger.info("Email verification response received");

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

      let errorMsg = "Email verification failed. Please try again.";
      let attempts: number | null = null;

      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as unknown as Record<string, unknown>;
        const errorObj = (apiError?.error as Record<string, unknown>) || {};
        const errorCode = (errorObj?.code as string) || (apiError?.code as string);
        const detail = (errorObj?.message as string) || (apiError?.detail as string) || "";

        if (errorCode === "OTP_INVALID") {
          attempts = (errorObj?.attempts_remaining as number) || null;
          errorMsg = attempts
            ? `Invalid OTP. ${attempts} attempt${attempts !== 1 ? "s" : ""} remaining.`
            : "Invalid OTP.";
        } else if (errorCode === "OTP_EXPIRED") {
          errorMsg = "OTP has expired. Please request a new one.";
        } else if (errorCode === "OTP_MAX_ATTEMPTS") {
          errorMsg = "Too many wrong attempts. Please request a new OTP.";
        } else if (errorCode === "USER_NOT_FOUND") {
          errorMsg = "User not found. Please sign up again.";
        } else {
          errorMsg = detail || errorMsg;
        }
        setRemainingAttempts(attempts);
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      setStatus("error");
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
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
            <div className="space-y-3">
              <button
                type="button"
                data-testid="goto-signin-btn"
                onClick={() => window.location.href = "/?showLogin=true&verified=true"}
                className="w-full bg-[#2257a7] hover:bg-[#184284] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Go to Sign In
              </button>
            </div>
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
            <p role="alert" className="text-gray-600 mb-4">{errorMessage}</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-yellow-900 mb-2">What you can do:</p>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Check your email for the OTP code</li>
                <li>Request a new OTP code</li>
                <li>Check your spam/junk folder</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                data-testid="try-again-btn"
                onClick={() => {
                  setCountdown(5);
                  setErrorMessage("");
                  setStatus("waiting-otp");
                  setOtp("");
                }}
                className="w-full bg-[#2257a7] hover:bg-[#184284] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                type="button"
                data-testid="back-to-signin-btn"
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

        {/* Waiting for OTP Input */}
        {(status === "waiting-otp" || status === "loading") && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="bg-blue-100 rounded-full p-4">
                <Mail className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
            <p className="text-gray-600 mb-6">
              We&apos;ve sent a 6-digit code to your email. Enter it below to verify your account.
            </p>

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-900 mb-2">
                  6-Digit OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  data-testid="otp-input"
                  className={`w-full px-4 py-3 text-2xl tracking-widest text-center border-2 rounded-lg outline-none transition-colors ${
                    errorMessage
                      ? "border-red-400 bg-red-50 focus:border-red-600"
                      : "border-gray-300 bg-white focus:border-blue-600"
                  }`}
                />
              </div>

              {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}

              <button
                type="submit"
                disabled={!otp || otp.length !== 6}
                data-testid="verify-otp-btn"
                className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {status === "loading" && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                Verify Email
              </button>
            </form>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-700 mb-4">
                <strong>Didn&apos;t receive the code?</strong>
              </p>
              <button
                type="button"
                data-testid="resend-otp-btn"
                onClick={() => router.push("/?showLogin=true")}
                className="text-sm text-[#2257a7] hover:text-[#184284] font-semibold underline"
              >
                Request a new OTP
              </button>
            </div>

            <button
              type="button"
              data-testid="back-to-signin-btn"
              onClick={() => router.push("/?showLogin=true")}
              className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
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
