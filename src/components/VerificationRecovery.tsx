"use client";

import React, { useEffect, useState } from "react";
import { X, Mail } from "lucide-react";
import OTPVerificationInput from "./OTPVerificationInput";
import { toast } from "sonner";

interface PendingVerification {
  userId: string;
  email: string;
  pendingVerification: boolean;
  timestamp: number;
}

export const VerificationRecovery: React.FC = () => {
  const [pending, setPending] = useState<PendingVerification | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("pendingEmailVerification");
    if (stored && !dismissed) {
      try {
        const data: PendingVerification = JSON.parse(stored);
        // Check if verification is not older than 24 hours
        const ageMs = Date.now() - data.timestamp;
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (ageMs < oneDayMs) {
          setPending(data);
        } else {
          // Clear expired verification
          localStorage.removeItem("pendingEmailVerification");
        }
      } catch {
        localStorage.removeItem("pendingEmailVerification");
      }
    }
  }, [dismissed]);

  if (!pending || dismissed || showOTP) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40">
      <div className="flex items-start gap-3">
        <Mail className="w-5 h-5 text-[#2257a7] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">
            Resume Email Verification
          </h3>
          <p className="text-gray-600 text-xs mt-1">
            You have a pending email verification for <strong>{pending.email}</strong>.
            Enter the code you received in your email.
          </p>
          <button
            onClick={() => setShowOTP(true)}
            className="mt-3 text-sm font-semibold text-[#2257a7] hover:text-[#184284] transition-colors"
          >
            Enter verification code →
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {showOTP && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <OTPVerificationInput
            userId={pending.userId}
            email={pending.email}
            password=""
            onSuccess={() => {
              localStorage.removeItem("pendingEmailVerification");
              toast.success("Email verified successfully!");
              setPending(null);
              setShowOTP(false);
            }}
            onClose={() => {
              setShowOTP(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VerificationRecovery;
