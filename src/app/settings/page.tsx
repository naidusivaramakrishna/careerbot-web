"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getProfile, UserProfile } from "@/api/userApi";
import { resendVerificationEmail, requestPasswordReset } from "@/api/authApi";
import logger from "@/lib/logger";

const SettingsPage = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Reset Password States
  type PasswordResetStatus = "idle" | "loading" | "success" | "error";
  const [resetStatus, setResetStatus] = useState<PasswordResetStatus>("idle");
  const [resetErrorMessage, setResetErrorMessage] = useState("");

  // Email Verification States
  const [resendLoading, setResendLoading] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        setUserProfile(profile);
      } catch (error) {
        logger.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle password reset request (sends email with token)
  const handleRequestPasswordReset = async () => {
    if (!userProfile?.email) {
      toast.error("Email not found");
      return;
    }

    setResetStatus("loading");
    setResetErrorMessage("");

    try {
      logger.info("Requesting password reset for:", userProfile.email);

      const response = await requestPasswordReset({ email: userProfile.email });

      logger.info("Password reset request response:", response);

      setResetStatus("success");
      toast.success(response.message || "Password reset email sent successfully!");
    } catch (error: unknown) {
      logger.error("Error requesting password reset:", error);

      setResetStatus("error");

      let errorMsg = "Failed to request password reset. Please try again.";
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === "object" && error !== null) {
        const apiError = error as { response?: { data?: { detail?: string; error?: string } } };
        errorMsg =
          apiError.response?.data?.detail ||
          apiError.response?.data?.error ||
          "Failed to request password reset. Please try again.";
      }

      setResetErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Handle email verification resend
  const handleResendVerification = async () => {
    if (!userProfile?.email) {
      toast.error("Email not found");
      return;
    }

    setResendLoading(true);
    try {
      await resendVerificationEmail({ email: userProfile.email });
      toast.success("Verification email sent! Check your inbox.");
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to resend email";
      logger.error("Resend verification error:", error);
      toast.error(errorMsg);
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account security and preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reset Password Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Reset Password
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Update your password to keep your account secure
              </p>
            </div>
          </div>

          {resetStatus === "success" ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-green-600 mb-2 text-center">Email Sent!</h3>
              <p className="text-gray-600 text-center mb-6">
                A password reset link has been sent to <strong>{userProfile?.email}</strong>. Check your email and follow the instructions to set your new password.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">💡 <strong>Tip:</strong> Check your spam folder if you don&apos;t see the email.</p>
              </div>
              <button
                onClick={() => setResetStatus("idle")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                Done
              </button>
            </>
          ) : resetStatus === "error" ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="bg-red-100 rounded-full p-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-red-600 mb-2 text-center">Error</h3>
              <p className="text-gray-600 text-center mb-6">{resetErrorMessage}</p>
              <button
                onClick={() => setResetStatus("idle")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                We&apos;ll send you an email with a link to reset your password. You can set your new password by clicking the link in the email.
              </p>
              <button
                onClick={handleRequestPasswordReset}
                disabled={resetStatus === "loading"}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {resetStatus === "loading" ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-700">
                  <strong>Note:</strong> The reset link will expire in 48 hours.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Email Verification Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                Email Verification
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Verify your email to unlock all features
              </p>
            </div>
          </div>

          {/* Email Status */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {userProfile?.email || "No email"}
                </p>
                {userProfile?.is_verified ? (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={14} />
                    Email verified
                  </p>
                ) : (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Email not verified
                  </p>
                )}
              </div>
              {userProfile?.is_verified && (
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              )}
            </div>
          </div>

          {/* Status Message */}
          {userProfile?.is_verified ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700">
                ✓ Your email is verified. You have access to all features.
              </p>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-700">
                Please verify your email to enable all features. Check your
                inbox for the verification link.
              </p>
            </div>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResendVerification}
            disabled={resendLoading || userProfile?.is_verified}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {resendLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Sending...
              </>
            ) : userProfile?.is_verified ? (
              "Email Already Verified"
            ) : (
              "Resend Verification Email"
            )}
          </button>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>💡 Tip:</strong> Check your spam folder if you don&apos;t see
              the email. Verification links expire in 48 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Plan & Credits Navigation Card */}
      <Link href="/settings/subscription">
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 shrink-0">
                <Zap className="h-6 w-6 text-[#2557a7]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Plan &amp; Credits</h2>
                <p className="text-sm text-gray-600 mt-1">
                  View your subscription, credit balance, and usage history
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#2557a7] transition-colors shrink-0" />
          </div>
        </div>
      </Link>

      {/* Additional Settings Section */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Account Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Status
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="inline-flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-900 font-medium">Active</span>
              </span>
            </div>
          </div>

          {/* Member Since */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member Since
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-900">
                {userProfile?.created_at
                  ? new Date(userProfile.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
