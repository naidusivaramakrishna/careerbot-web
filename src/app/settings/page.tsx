"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle,
  Loader,
  Lock,
  Mail,
  ShieldCheck,
  UserCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getProfile, UserProfile } from "@/api/userApi";
import { resendVerificationEmail, requestPasswordReset } from "@/api/authApi";
import logger from "@/lib/logger";

const SettingsPage = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  type PasswordResetStatus = "idle" | "loading" | "success" | "error";
  const [resetStatus, setResetStatus] = useState<PasswordResetStatus>("idle");
  const [resetErrorMessage, setResetErrorMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

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
      const errorMsg = error instanceof Error ? error.message : "Failed to resend email";
      logger.error("Resend verification error:", error);
      toast.error(errorMsg);
    } finally {
      setResendLoading(false);
    }
  };

  const memberSince = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not available";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-gray-950 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="rounded-2xl border border-gray-200 bg-white px-8 py-7 text-center shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
            <Loader className="mx-auto h-8 w-8 animate-spin text-[#2557a7]" />
            <p className="mt-4 text-sm font-black text-gray-950">Loading settings</p>
            <p className="mt-1 text-sm text-gray-500">Preparing your account preferences.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-5 text-gray-950 sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-[0_18px_55px_rgba(15,23,42,0.055)] sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Account control center</p>
              <h1 className="mt-1.5 text-[26px] font-black leading-tight tracking-[-0.03em] text-gray-950 sm:text-[30px]">
                Settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Manage account access, email verification, plan usage, and the security details that keep your CareerBot workspace reliable.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2557a7] ring-1 ring-gray-200">
                <UserCircle size={19} />
              </span>
              <div className="min-w-0 pr-2">
                <p className="truncate text-sm font-black text-gray-950">{userProfile?.email || "Account email unavailable"}</p>
                <p className="mt-0.5 text-xs font-semibold text-gray-500">
                  {userProfile?.is_verified ? "Verified workspace" : "Verification required"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
            <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2557a7] ring-1 ring-[#d9e5f8]">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Security</p>
                  <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-gray-950">Account access</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-500">Keep sign-in recovery and email access up to date.</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-[42px_1fr_auto] sm:items-start sm:px-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-[#2557a7]">
                  <Lock size={17} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-gray-950">Password reset</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                    Send a secure reset link to your registered email. The link expires in 48 hours.
                  </p>

                  {resetStatus === "success" && (
                    <div className="mt-4 rounded-2xl border border-[#c8d7ef] bg-[#f8fbff] px-4 py-3">
                      <p className="flex items-center gap-2 text-sm font-black text-[#2557a7]">
                        <CheckCircle size={16} />
                        Reset email sent
                      </p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">
                        Check {userProfile?.email}. If it is not visible, review spam or promotions.
                      </p>
                    </div>
                  )}

                  {resetStatus === "error" && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                      <p className="flex items-center gap-2 text-sm font-black text-red-700">
                        <AlertCircle size={16} />
                        Request failed
                      </p>
                      <p className="mt-1 text-sm leading-6 text-red-700">{resetErrorMessage}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={resetStatus === "idle" ? handleRequestPasswordReset : () => setResetStatus("idle")}
                  disabled={resetStatus === "loading"}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2557a7] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,87,167,0.2)] transition hover:bg-[#1f4a91] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resetStatus === "loading" ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Sending
                    </>
                  ) : resetStatus === "idle" ? (
                    "Send reset link"
                  ) : (
                    "Done"
                  )}
                </button>
              </div>

              <div className="grid gap-4 px-5 py-5 sm:grid-cols-[42px_1fr_auto] sm:items-start sm:px-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-[#2557a7]">
                  <Mail size={17} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-gray-950">Email verification</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${userProfile?.is_verified ? "bg-[#eef4ff] text-[#2557a7]" : "bg-gray-100 text-gray-600"}`}>
                      {userProfile?.is_verified ? "Verified" : "Not verified"}
                    </span>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                    {userProfile?.is_verified
                      ? "Your email is verified and your workspace features are available."
                      : "Verify your email to keep account recovery and CareerBot workflows fully available."}
                  </p>
                  <p className="mt-3 truncate rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
                    {userProfile?.email || "No email found"}
                  </p>
                </div>
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading || userProfile?.is_verified}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-black text-[#2557a7] transition hover:bg-[#eef4ff] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {resendLoading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Sending
                    </>
                  ) : userProfile?.is_verified ? (
                    "Verified"
                  ) : (
                    "Resend email"
                  )}
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Account</p>
              <h2 className="mt-1.5 text-lg font-black tracking-[-0.025em] text-gray-950">Profile status</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-3 py-3 ring-1 ring-gray-200">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <span className="h-2 w-2 rounded-full bg-[#2557a7]" />
                    Account status
                  </span>
                  <span className="text-sm font-black text-gray-950">Active</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 px-3 py-3 ring-1 ring-gray-200">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <CalendarDays size={15} className="text-[#2557a7]" />
                    Member since
                  </span>
                  <span className="text-right text-sm font-black text-gray-950">{memberSince}</span>
                </div>
              </div>
            </div>

            <Link
              href="/settings/subscription"
              className="group block rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-[0_18px_55px_rgba(15,23,42,0.055)] transition hover:border-[#c8d7ef] hover:bg-[#fbfdff]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2557a7] ring-1 ring-[#d9e5f8]">
                  <Zap size={17} />
                </span>
                <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-gray-400 transition group-hover:text-[#2557a7]" />
              </div>
              <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Plan and credits</p>
              <h2 className="mt-1.5 text-lg font-black tracking-[-0.025em] text-gray-950">Subscription</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Review your plan, credits, and usage history from one place.
              </p>
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default SettingsPage;
