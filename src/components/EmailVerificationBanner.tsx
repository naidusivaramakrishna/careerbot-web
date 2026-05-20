"use client";

import React, { useState } from "react";
import { Mail, X, Loader } from "lucide-react";
import { resendVerificationEmail } from "@/api/authApi";
import { toast } from "sonner";
import logger from "@/lib/logger";

interface EmailVerificationBannerProps {
  userEmail: string;
  isVerified?: boolean;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  userEmail,
  isVerified = false,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Don't show if already verified or dismissed
  if (isVerified || dismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    try {
      setLoading(true);
      await resendVerificationEmail({ email: userEmail });
      toast.success("Verification email sent! Check your inbox.");
      logger.info("Verification email resent for:", userEmail);
    } catch (error: unknown) {
      logger.error("Error resending verification email:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to resend email";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border-l-4 border-[#2257a7] p-4 mb-6 rounded-r-lg shadow-sm">
      <div className="flex items-start justify-between gap-4">
        {/* Content */}
        <div className="flex items-start gap-3 flex-1">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Verify Your Email</h3>
            <p className="text-sm text-blue-800 mb-3">
              We sent a verification link to <strong>{userEmail}</strong>.
              Click the link in your email to activate your account and unlock all features.
            </p>
            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend verification email"
              )}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0 p-1"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
