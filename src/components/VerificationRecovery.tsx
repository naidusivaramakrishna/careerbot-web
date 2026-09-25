"use client";

import React, { useEffect, useState } from "react";
import { X, Mail } from "lucide-react";
import OTPVerificationInput from "./OTPVerificationInput";
import { toast } from "sonner";
import {
  PENDING_VERIFICATION_CLEARED_EVENT,
  PENDING_VERIFICATION_STORAGE_KEY,
  PENDING_VERIFICATION_UPDATED_EVENT,
} from "@/lib/pendingVerification";

interface PendingVerification {
  userId: string;
  email: string;
  pendingVerification: boolean;
  timestamp: number;
}

/** The stored record if it is under 24 hours old; clears an expired or corrupt one. */
const readPendingRecord = (): PendingVerification | null => {
  const stored = localStorage.getItem(PENDING_VERIFICATION_STORAGE_KEY);
  if (!stored) return null;
  try {
    const data: PendingVerification = JSON.parse(stored);
    // Check if verification is not older than 24 hours
    const ageMs = Date.now() - data.timestamp;
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (ageMs < oneDayMs) return data;
    // Clear expired verification
    localStorage.removeItem(PENDING_VERIFICATION_STORAGE_KEY);
  } catch {
    localStorage.removeItem(PENDING_VERIFICATION_STORAGE_KEY);
  }
  return null;
};

export const VerificationRecovery: React.FC = () => {
  const [pending, setPending] = useState<PendingVerification | null>(null);
  const [showOTP, setShowOTP] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const data = readPendingRecord();
    if (data) setPending(data);
  }, [dismissed]);

  // ClientLayout keeps this banner mounted across client-side navigation, so
  // hide it when sign-in / sign-out clears the record (authApi).
  useEffect(() => {
    const onCleared = () => {
      setPending(null);
      setShowOTP(false);
    };
    window.addEventListener(PENDING_VERIFICATION_CLEARED_EVENT, onCleared);
    return () => window.removeEventListener(PENDING_VERIFICATION_CLEARED_EVENT, onCleared);
  }, []);

  // ...and show it when a signup writes a new record (SignUpModal), in this
  // tab (custom event) or another one (storage event). A new signup is new
  // information, so it un-dismisses the banner; the effect above re-reads
  // storage when `dismissed` flips; reading here covers the case where it was
  // not dismissed.
  useEffect(() => {
    const onUpdated = () => {
      setDismissed(false);
      const data = readPendingRecord();
      if (data) setPending(data);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PENDING_VERIFICATION_STORAGE_KEY) return;
      if (e.newValue === null) {
        setPending(null);
        setShowOTP(false);
      } else {
        onUpdated();
      }
    };
    window.addEventListener(PENDING_VERIFICATION_UPDATED_EVENT, onUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PENDING_VERIFICATION_UPDATED_EVENT, onUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (!pending || dismissed) {
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
