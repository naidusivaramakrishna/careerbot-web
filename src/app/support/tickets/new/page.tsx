"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleCheck, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  escalateToSupport,
  sendTicketOtp,
  verifyTicketOtp,
  uploadTicketAttachment,
  type EscalationResponse,
  type TicketAttachmentSummary,
} from "@/api/chatbotApi";
import { getProfile } from "@/api/userApi";
import {
  TICKET_CATEGORIES,
  FEATURE_ISSUE_TYPES,
  MAX_TICKET_ATTACHMENTS,
  MAX_TICKET_ATTACHMENT_BYTES,
  MAX_TICKET_SUBJECT_CHARS,
  readTicketContext,
  clearTicketContext,
} from "@/lib/ticketCategories";

// The backend only ever accepts a guest ticket whose category maps to the
// account_organization affected_feature (support_tickets_public.py's guest
// CHECK 2 -- see mapFeatureToBackend in chatbotApi.ts for the id -> enum
// mapping). Every other category is guaranteed to 403. Guests only ever see
// these two from the shared TICKET_CATEGORIES list; authenticated users
// still see all of them, unfiltered.
const GUEST_ALLOWED_CATEGORY_IDS = new Set(["login-issues", "account-organization"]);

// Same logic ChatApp.tsx uses to derive a ticket subject from the question
// that preceded an unhelpful answer -- duplicated here (not imported) since
// it's a small pure text helper, not shared business logic.
const firstSentence = (text: string): string => {
  const firstLine = text.split("\n")[0];

  const match = firstLine.match(/^.{20,}?[.!?](?=\s|$)/);
  if (match) return match[0].trim();

  if (firstLine.length >= 20) return firstLine.trim();

  if (text.length > 160) {
    const truncated = text.substring(0, 160);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 20) return truncated.substring(0, lastSpace).trim() + "…";
  }

  return text.trim();
};

const describeError = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

const getHttpStatus = (error: unknown): number | undefined =>
  typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;

// Axios lowercases response header names, regardless of what the server sent.
const getResponseHeader = (error: unknown, name: string): string | undefined => {
  if (typeof error !== "object" || error === null || !("response" in error)) return undefined;
  const headers = (error as { response?: { headers?: Record<string, unknown> } }).response?.headers;
  const value = headers?.[name.toLowerCase()];
  return typeof value === "string" ? value : undefined;
};

const getBackendDetail = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null || !("response" in error)) return undefined;
  const data = (error as { response?: { data?: unknown } }).response?.data;
  const detail = data && typeof data === "object" && "detail" in data ? (data as { detail?: unknown }).detail : undefined;
  return typeof detail === "string" ? detail : undefined;
};

const MIN_SUBJECT_LENGTH = 5;
const MIN_DESCRIPTION_LENGTH = 20;
const OTP_COOLDOWN_SECONDS = 60;

type FieldErrors = Partial<Record<"name" | "email" | "userType" | "category" | "subject" | "description" | "otp", string>>;

// useSearchParams() opts this page out of static prerendering unless it's
// wrapped in Suspense -- without this, `next build` fails outright (Next.js
// requires a Suspense boundary around any client component that reads
// search params on an otherwise-static route; see page.tsx:758 below).
const PortalLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
    <Loader2 className="w-8 h-8 text-[#1f5fb7] animate-spin" data-testid="ticket-portal-loading" />
  </div>
);

function SupportTicketPortalContent() {
  const searchParams = useSearchParams();
  // Carried over from the chatbot when this page is reached via the
  // "Raise a support ticket →" link under an unhelpful answer, or via
  // "Contact Support" in the guided flow (no context there, both params
  // absent) -- same original_question/chatbot_answer the in-widget modal
  // sends, read once on mount since the params don't change afterward.
  // Capped defensively here too (ChatApp.tsx already caps before handing
  // them over) -- this page must not trust the query string alone.
  // readTicketContext: from sessionStorage (?ctx=) or ?question=&answer=.
  const [{ question: originalQuestion, answer: chatbotAnswer }] = useState(() => readTicketContext(searchParams));
  useEffect(() => clearTicketContext(searchParams), [searchParams]);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Guest-only, matching the old in-widget modal's guest section exactly.
  const [userType, setUserType] = useState("");
  const [category, setCategory] = useState("");
  // Authenticated-only (same visibility rule as the old modal's "Affected
  // Feature" + "Issue Type" pairing) -- guests never see or send this.
  const [issueType, setIssueType] = useState("");
  const [priority, setPriority] = useState<1 | 2>(1);
  const [subject, setSubject] = useState(() =>
    originalQuestion ? firstSentence(originalQuestion).slice(0, MAX_TICKET_SUBJECT_CHARS) : ""
  );
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentNotice, setAttachmentNotice] = useState("");
  const [successAttachments, setSuccessAttachments] = useState<TicketAttachmentSummary[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticket, setTicket] = useState<EscalationResponse | null>(null);
  // The authenticated identity this form was opened for -- escalateToSupport
  // relies on the httpOnly session cookie, not this value, so if a different
  // account signs in from another tab mid-submit (e.g. during the attachment
  // uploads, which can take a while), the ticket would otherwise go out
  // filed under whichever account's cookie is active by the time it fires,
  // silently misattributing it. null for guests -- there's no account to
  // switch out from under an OTP-verified email submission.
  const authenticatedEmailRef = useRef<string | null>(null);
  // Separate from the ref above being null, which is also the normal state
  // for a guest: true once an authenticated user's email has actually been
  // read successfully at least once. If the mount-time fetch below fails,
  // this stays false and the pre-step check must establish the baseline
  // (or block) instead of silently skipping the switch guard forever.
  const accountBaselineConfirmedRef = useRef(false);
  // Keyed by File object identity so a retry (after a failed submit, or an
  // account-check abort) never re-uploads a file that already succeeded --
  // removing and re-picking a file gets a new File instance, so it still
  // uploads fresh.
  const uploadedAttachmentsRef = useRef<Map<File, TicketAttachmentSummary>>(new Map());

  // Guest-only email verification -- the backend rejects a guest ticket
  // with a 403 if this hasn't happened (see escalateToSupport's 403
  // handling below), so it's not optional UI polish.
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpCooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // isUserAuthenticated() is a local heuristic (a token marker), not
      // proof of a valid session -- only a SUCCESSFUL profile fetch
      // confirms it. Rendering the authenticated form (no name/email/
      // user-type fields, no OTP requirement) off the heuristic alone
      // would let a visitor whose session has actually expired submit
      // with zero identifying information and no verification at all.
      // So always probe (a stale marker can still have a valid session;
      // skipAuthRedirect refreshes but never redirects a guest).
      let confirmedAuthed = false;
      try {
        const profile = await getProfile({ skipAuthRedirect: true });
        if (!cancelled) {
          setName(profile.full_name || "");
          setEmail(profile.email || "");
          authenticatedEmailRef.current = profile.email || null;
          accountBaselineConfirmedRef.current = true;
          confirmedAuthed = true;
        }
      } catch {
        // Falls back to the guest path below, same as the chatbot's
        // own (legacy) ticket modal -- confirmedAuthed stays false.
      }
      if (!cancelled) {
        setAuthenticated(confirmedAuthed);
        setCheckingAuth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (otpCooldownTimerRef.current) clearInterval(otpCooldownTimerRef.current);
    };
  }, []);

  const startOtpCooldown = (seconds: number) => {
    setOtpCooldown(seconds);
    if (otpCooldownTimerRef.current) clearInterval(otpCooldownTimerRef.current);
    otpCooldownTimerRef.current = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          if (otpCooldownTimerRef.current) clearInterval(otpCooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    setOtpError("");
    if (otpCooldown > 0) return;
    if (!email.trim()) {
      setOtpError("Enter your email address first.");
      return;
    }
    setIsSendingOtp(true);
    try {
      await sendTicketOtp({ email: email.trim() });
      setOtpSent(true);
      setOtpCode("");
      toast.success("OTP sent — check your inbox.");
      startOtpCooldown(OTP_COOLDOWN_SECONDS);
    } catch (error) {
      const message = describeError(error, "Failed to send OTP");
      const cooldownMatch = message.match(/(\d+)\s*second/);
      setOtpError(
        cooldownMatch
          ? `Please wait ${cooldownMatch[1]} seconds before requesting a new OTP.`
          : message,
      );
      startOtpCooldown(cooldownMatch ? parseInt(cooldownMatch[1], 10) : 30);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    if (otpCode.length !== 6) {
      setOtpError("Enter the 6-digit code from your email.");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const response = await verifyTicketOtp({ email: email.trim(), otp: otpCode });
      if (response.verified) {
        setOtpVerified(true);
        setVerificationToken(response.token || null);
        setOtpSent(false);
        toast.success("Email verified.");
      } else {
        setOtpError("Verification failed. Please try again.");
      }
    } catch (error) {
      setOtpError(describeError(error, "Invalid or expired OTP"));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // A verification token belongs to the exact email it was issued for --
  // changing the email after verifying invalidates it, so make the guest
  // re-verify rather than silently submitting under a stale verification.
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (otpVerified) {
      setOtpVerified(false);
      setVerificationToken(null);
      setOtpSent(false);
    }
  };

  // Issue Type options depend on the selected category -- same as the
  // modal's "Affected Feature" grid resetting Issue Type on every change.
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setIssueType("");
  };

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const picked = Array.from(files);
      const tooLarge = picked.filter((f) => f.size > MAX_TICKET_ATTACHMENT_BYTES);
      const fitting = picked.filter((f) => f.size <= MAX_TICKET_ATTACHMENT_BYTES);
      const room = Math.max(0, MAX_TICKET_ATTACHMENTS - attachments.length);
      const overCount = fitting.slice(room);
      const notes: string[] = [];
      if (tooLarge.length > 0) {
        notes.push(`Not attached (larger than 5 MB): ${tooLarge.map((f) => f.name).join(", ")}.`);
      }
      if (overCount.length > 0) {
        notes.push(`You can attach up to ${MAX_TICKET_ATTACHMENTS} files. Not attached: ${overCount.map((f) => f.name).join(", ")}.`);
      }
      setAttachmentNotice(notes.join(" "));
      setAttachments((prev) => [...prev, ...fitting.slice(0, room)]);
      // Lets the user pick the same file again after removing it.
      event.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      uploadedAttachmentsRef.current.delete(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!authenticated) {
      if (!name.trim()) errors.name = "Name is required.";
      if (!email.trim()) errors.email = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(email.trim())) errors.email = "Enter a valid email address.";
      if (!userType) errors.userType = "Please select your user type.";
    }
    if (!category) errors.category = "Please select an issue category.";
    if (!subject.trim()) errors.subject = "Subject is required.";
    else if (subject.trim().length < MIN_SUBJECT_LENGTH)
      errors.subject = `Subject must be at least ${MIN_SUBJECT_LENGTH} characters.`;
    if (!description.trim()) errors.description = "Description is required.";
    else if (description.trim().length < MIN_DESCRIPTION_LENGTH)
      errors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`;
    if (!authenticated && !otpVerified) errors.otp = "Please verify your email before submitting.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Re-reads the signed-in account and tells apart three outcomes, since
  // only one of them is actually "the account changed":
  //  - the check itself failed (network/server error, or the session
  //    expired) -- that says nothing about which account is active, so it
  //    must never be reported as a switch;
  //  - no confirmed baseline exists yet (the mount-time fetch above
  //    failed) -- this successful read becomes the baseline instead of a
  //    false "switch" against a baseline that was never real;
  //  - a confirmed baseline exists and genuinely disagrees with this read.
  // Guests have no account to switch out from under an OTP-verified email,
  // so this is a no-op for them.
  const verifyAccountUnchanged = async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!authenticated) return { ok: true };
    let profile: { email?: string } | null = null;
    try {
      profile = await getProfile({ skipAuthRedirect: true });
    } catch (error) {
      if (getHttpStatus(error) === 401) {
        return { ok: false, message: "You've been signed out. Please sign in again and resubmit this ticket." };
      }
      return { ok: false, message: "Couldn't confirm your account before continuing. Please check your connection and try again." };
    }
    const currentEmail = profile.email || null;
    if (!accountBaselineConfirmedRef.current) {
      authenticatedEmailRef.current = currentEmail;
      accountBaselineConfirmedRef.current = true;
      return { ok: true };
    }
    if (currentEmail !== authenticatedEmailRef.current) {
      return {
        ok: false,
        message: "Your account changed in another tab since you opened this form. Please refresh and submit again to avoid filing this ticket under the wrong account.",
      };
    }
    return { ok: true };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Checked before anything irreversible happens (an upload, or the
      // submission itself) -- catches an already-switched account before
      // a single file is sent under the wrong one.
      const preUploadCheck = await verifyAccountUnchanged();
      if (!preUploadCheck.ok) {
        setSubmitError(preUploadCheck.message);
        return;
      }

      // Upload attachments before creating the ticket, but never let an
      // upload failure block the ticket itself -- a screenshot is always
      // optional (Promise.allSettled, not Promise.all), same as the modal.
      // Already-uploaded files (from a previous attempt that failed or was
      // aborted by the account check) are reused, not re-sent.
      let uploaded: TicketAttachmentSummary[] = [];
      let failedAttachmentNames: string[] = [];
      if (attachments.length > 0) {
        const results = await Promise.allSettled(
          attachments.map(async (file) => {
            const cached = uploadedAttachmentsRef.current.get(file);
            if (cached) return cached;
            const result = await uploadTicketAttachment(file);
            const summary: TicketAttachmentSummary = { attachment_id: result.attachment_id, filename: result.filename };
            uploadedAttachmentsRef.current.set(file, summary);
            return summary;
          }),
        );
        uploaded = results
          .filter((r): r is PromiseFulfilledResult<TicketAttachmentSummary> => r.status === "fulfilled")
          .map((r) => r.value);
        // A failed upload must never silently vanish -- the ticket still
        // goes out without it (resilience), but the submitter needs to know
        // which file(s) didn't make it so they can resend some other way.
        failedAttachmentNames = results
          .map((r, i) => (r.status === "rejected" ? attachments[i].name : null))
          .filter((name): name is string => name !== null);
      }
      const attachmentIds = uploaded.map((a) => a.attachment_id);

      // Re-confirm the account right before the submission itself, after
      // the (potentially slow) attachment uploads above -- that's the
      // window where a switch in another tab is most likely to have
      // already happened by the time we'd otherwise fire escalateToSupport.
      const preSubmitCheck = await verifyAccountUnchanged();
      if (!preSubmitCheck.ok) {
        setSubmitError(preSubmitCheck.message);
        return;
      }

      const response = await escalateToSupport({
        issue_category: category,
        issue_title: subject.trim(),
        issue_description: description.trim(),
        authenticated,
        contact_email: email.trim() || undefined,
        attachment_ids: attachmentIds.length > 0 ? attachmentIds : undefined,
        issue_details: {
          feature: category,
          // Subcategory (Issue Type) -- shown to guest and authenticated
          // users alike, so sent for both whenever one was picked.
          issue_type: issueType || undefined,
          priority,
          steps_to_reproduce: stepsToReproduce.trim() || undefined,
          requester_name: name.trim() || undefined,
          requester_email: email.trim() || undefined,
          // User Type is guest-only (the old modal never asked
          // authenticated users for it either).
          user_type: !authenticated ? userType || undefined : undefined,
          verification_token: verificationToken || undefined,
          original_question: originalQuestion || undefined,
          chatbot_answer: chatbotAnswer || undefined,
        },
      });
      // Guest tickets get a view_url back per attachment (a single-use,
      // login-free link) -- merge by attachment_id so a response with no
      // attachments (e.g. an older backend) still shows what was uploaded.
      const viewUrlByAttachmentId = new Map((response.attachments || []).map((a) => [a.attachment_id, a.view_url]));
      setSuccessAttachments(uploaded.map((a) => ({ ...a, view_url: viewUrlByAttachmentId.get(a.attachment_id) })));
      setTicket(response);
      toast.success("Support ticket submitted.");
      if (failedAttachmentNames.length > 0) {
        toast.warning(
          `${failedAttachmentNames.length === 1 ? "This file" : "These files"} couldn't be attached: ${failedAttachmentNames.join(", ")}. The ticket was submitted without ${failedAttachmentNames.length === 1 ? "it" : "them"} -- reply to the confirmation email to send it another way.`,
        );
      }
    } catch (error) {
      const status = getHttpStatus(error);
      if (status === 403 && !authenticated) {
        // The backend returns 403 for two unrelated guest cases, told apart
        // by which "what to do next" header it sends: X-Redirect (e.g. the
        // category isn't a login/access issue, which only a logged-in user
        // can file) means re-verifying the OTP would never fix it, so the
        // verified state must NOT be discarded. Anything else (missing/
        // expired/already-used token) sends X-Next-Step back to verify-otp
        // instead -- that's the one case where resetting and asking the
        // guest to re-verify is actually correct.
        const redirectHint = getResponseHeader(error, "x-redirect");
        if (redirectHint) {
          setSubmitError(
            getBackendDetail(error) || "You don't have permission to submit this ticket. Please log in and try again.",
          );
        } else {
          setOtpVerified(false);
          setVerificationToken(null);
          setSubmitError("Your email verification expired or doesn't match this email. Please verify your email again and resubmit.");
        }
      } else {
        setSubmitError(describeError(error, "Failed to create ticket. Please try again."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
        <Loader2 className="w-8 h-8 text-[#1f5fb7] animate-spin" data-testid="ticket-portal-loading" />
      </div>
    );
  }

  if (ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center" data-testid="ticket-success">
          <div className="flex justify-center mb-6">
            <CircleCheck className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket submitted successfully</h1>
          <p className="text-gray-600 mb-6">Your support request has been received by the CareerBot Support Team.</p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ticket ID</p>
            <p className="text-lg font-bold text-gray-900" data-testid="ticket-id">{ticket.ticket_id}</p>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Our support team will review your request and contact you at <strong>{email || "your registered email"}</strong>.
          </p>

          {successAttachments.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Attachment{successAttachments.length > 1 ? "s" : ""}
              </p>
              {successAttachments.map((att) => (
                <p key={att.attachment_id} className="text-sm text-gray-700">
                  📎 {att.view_url ? (
                    <a href={att.view_url} target="_blank" rel="noopener noreferrer" className="text-[#1f5fb7] underline">
                      {att.filename}
                    </a>
                  ) : (
                    att.filename
                  )}
                </p>
              ))}
            </div>
          )}

          <Link
            href="/"
            className="inline-block w-full bg-[#1f5fb7] hover:bg-[#184284] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Back to CareerBot
          </Link>
        </div>
      </div>
    );
  }

  const otpButtonDisabled = isSendingOtp || !email.trim() || otpCooldown > 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-xl w-full mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Support Ticket Portal</h1>
        <p className="text-gray-600 text-center mb-8">
          Tell us what&apos;s going on and our support team will get back to you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {!authenticated && (
            <>
              <div>
                <label htmlFor="ticket-name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  id="ticket-name"
                  data-testid="ticket-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.name ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#1f5fb7]"
                  }`}
                  disabled={isSubmitting}
                />
                {fieldErrors.name && <p role="alert" className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="ticket-email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div
                    className={`flex-1 flex items-center px-4 py-3 border rounded-lg focus-within:outline-none focus-within:ring-2 focus-within:border-transparent ${
                      fieldErrors.email ? "border-red-400 focus-within:ring-red-300" : "border-gray-300 focus-within:ring-[#1f5fb7]"
                    }`}
                  >
                    <Mail className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
                    <input
                      id="ticket-email"
                      data-testid="ticket-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-transparent focus:outline-none"
                      disabled={isSubmitting || otpVerified}
                    />
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      data-testid="send-otp-btn"
                      onClick={handleSendOtp}
                      disabled={otpButtonDisabled}
                      className="shrink-0 px-4 py-3 bg-[#1f5fb7] hover:bg-[#184284] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      {isSendingOtp ? "Sending…" : otpCooldown > 0 ? `Resend (${otpCooldown}s)` : "Send OTP"}
                    </button>
                  )}
                </div>
                {fieldErrors.email && <p role="alert" className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
              </div>

              {otpVerified && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 font-semibold text-sm rounded-lg px-4 py-3">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  Email verified
                </div>
              )}

              {otpSent && !otpVerified && (
                <div>
                  <label htmlFor="ticket-otp" className="block text-sm font-semibold text-gray-700 mb-2">
                    Enter the 6-digit code sent to {email}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="ticket-otp"
                      data-testid="ticket-otp-input"
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      disabled={isVerifyingOtp}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-center tracking-[0.5em] text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#1f5fb7]"
                      placeholder="000000"
                    />
                    <button
                      type="button"
                      data-testid="verify-otp-btn"
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                      className="shrink-0 px-4 py-3 bg-[#1f5fb7] hover:bg-[#184284] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                    >
                      {isVerifyingOtp ? "Verifying…" : "Verify"}
                    </button>
                  </div>
                </div>
              )}

              {otpError && <p role="alert" className="text-red-500 text-sm">{otpError}</p>}
              {fieldErrors.otp && !otpError && <p role="alert" className="text-red-500 text-sm">{fieldErrors.otp}</p>}

              <div>
                <label htmlFor="ticket-user-type" className="block text-sm font-semibold text-gray-700 mb-2">
                  User type <span className="text-red-500">*</span>
                </label>
                <select
                  id="ticket-user-type"
                  data-testid="ticket-user-type-select"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white ${
                    fieldErrors.userType ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#1f5fb7]"
                  }`}
                >
                  <option value="">Select your user type…</option>
                  <option value="student">Student</option>
                  <option value="professional">Professional</option>
                  <option value="organization">Organization</option>
                  <option value="other">Other</option>
                </select>
                {fieldErrors.userType && <p role="alert" className="text-red-500 text-sm mt-1">{fieldErrors.userType}</p>}
              </div>
            </>
          )}

          {authenticated && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
              Submitting as <strong>{name || "your account"}</strong> ({email})
            </div>
          )}

          <div>
            <label htmlFor="ticket-category" className="block text-sm font-semibold text-gray-700 mb-2">
              Issue category <span className="text-red-500">*</span>
            </label>
            <select
              id="ticket-category"
              data-testid="ticket-category-select"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white ${
                fieldErrors.category ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#1f5fb7]"
              }`}
            >
              <option value="">Select a category…</option>
              {(authenticated ? TICKET_CATEGORIES : TICKET_CATEGORIES.filter((c) => GUEST_ALLOWED_CATEGORY_IDS.has(c.id))).map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {fieldErrors.category && <p role="alert" className="text-red-500 text-sm mt-1">{fieldErrors.category}</p>}
          </div>

          {/* Subcategory (Issue Type), shown to guests and authenticated
              users alike -- its options depend on whichever category was
              just picked above, reusing the exact same shared
              FEATURE_ISSUE_TYPES data/logic both forms already use. */}
          <div>
            <label htmlFor="ticket-issue-type" className="block text-sm font-semibold text-gray-700 mb-2">
              Subcategory
            </label>
            <select
              id="ticket-issue-type"
              data-testid="ticket-issue-type-select"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              disabled={isSubmitting || !category}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f5fb7] focus:border-transparent bg-white"
            >
              <option value="">{category ? "Select a subcategory…" : "Select a category first"}</option>
              {category && (FEATURE_ISSUE_TYPES[category] || FEATURE_ISSUE_TYPES.other).map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="priority-normal-btn"
                onClick={() => setPriority(1)}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${
                  priority === 1 ? "bg-[#1f5fb7] border-[#1f5fb7] text-white" : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                data-testid="priority-urgent-btn"
                onClick={() => setPriority(2)}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${
                  priority === 2 ? "bg-red-600 border-red-600 text-white" : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                🔥 Urgent
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="ticket-subject" className="block text-sm font-semibold text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              id="ticket-subject"
              data-testid="ticket-subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, MAX_TICKET_SUBJECT_CHARS))}
              maxLength={MAX_TICKET_SUBJECT_CHARS}
              placeholder="Brief summary of your issue"
              disabled={isSubmitting}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                fieldErrors.subject ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#1f5fb7]"
              }`}
            />
            <p className={`text-xs mt-1 ${subject.trim().length >= MIN_SUBJECT_LENGTH ? "text-green-600" : "text-gray-400"}`}>
              {subject.trim().length}/{MIN_SUBJECT_LENGTH} min
            </p>
            {fieldErrors.subject && <p role="alert" className="text-red-500 text-sm mt-1">{fieldErrors.subject}</p>}
          </div>

          <div>
            <label htmlFor="ticket-description" className="block text-sm font-semibold text-gray-700 mb-2">
              Detailed description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="ticket-description"
              data-testid="ticket-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in as much detail as possible"
              rows={6}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-y ${
                fieldErrors.description ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-[#1f5fb7]"
              }`}
            />
            <p className={`text-xs mt-1 ${description.trim().length >= MIN_DESCRIPTION_LENGTH ? "text-green-600" : "text-gray-400"}`}>
              {description.trim().length}/{MIN_DESCRIPTION_LENGTH} min
            </p>
            {fieldErrors.description && <p role="alert" className="text-red-500 text-sm mt-1">{fieldErrors.description}</p>}
          </div>

          <div>
            <label htmlFor="ticket-steps" className="block text-sm font-semibold text-gray-700 mb-2">
              Steps to reproduce <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="ticket-steps"
              data-testid="ticket-steps-input"
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="e.g. 1. Open Resume Parser 2. Upload a resume 3. Click Parse Resume"
              rows={3}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f5fb7] focus:border-transparent resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attachments <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleAttachmentUpload}
              accept=".png,.jpg,.jpeg,.pdf"
              multiple
              className="hidden"
            />
            <button
              type="button"
              data-testid="attach-file-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              📎 Upload screenshot/file
            </button>
            {attachmentNotice && <p role="alert" className="text-amber-600 text-sm mt-1">{attachmentNotice}</p>}
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {attachments.map((file, index) => (
                  <li key={index} className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeAttachment(index)}
                      disabled={isSubmitting}
                      className="text-gray-400 hover:text-red-500 ml-2"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {submitError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            data-testid="submit-ticket-btn"
            disabled={isSubmitting}
            className="w-full bg-[#1f5fb7] hover:bg-[#184284] disabled:bg-[#1f5fb7]/60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </span>
            ) : (
              "Submit ticket"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SupportTicketPortalPage() {
  return (
    <Suspense fallback={<PortalLoadingFallback />}>
      <SupportTicketPortalContent />
    </Suspense>
  );
}
