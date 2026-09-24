"use client"

import React, { useRef, useEffect, useState } from "react"
import { CircleCheck } from "lucide-react"
import { verifyEmail, signIn, resendVerificationEmail } from "@/api/authApi"
import { toast } from "sonner"
import logger from "@/lib/logger"
import axios from "axios"

interface OTPVerificationInputProps {
  email: string
  userId: string
  password: string
  onSuccess?: () => void
  onClose?: () => void
  /**
   * Seconds before "Resend" is enabled. Defaults to the server cooldown,
   * because right after signup a code has just been sent. Pass 0 when no code
   * was just sent (e.g. sign-in answered EMAIL_NOT_VERIFIED), so the user can
   * ask for a fresh one straight away.
   */
  initialResendCooldown?: number
  /** Optional context shown above the code boxes. */
  notice?: string
}

type VerificationStatus = "idle" | "loading" | "success" | "error"

// Written by SignUpModal after signup, read by VerificationRecovery.
export const PENDING_VERIFICATION_KEY = "pendingEmailVerification"

// careerbot-api OTP_RESEND_COOLDOWN_SECONDS (config/settings.py). A resend
// inside the cooldown still answers 200 with a generic body but sends nothing
// (endpoints/auth.py resend_verification_email), so a shorter UI countdown
// would tell the user a code was resent when it was not.
const RESEND_COOLDOWN_SECONDS = 60

/**
 * Describe a failed request WITHOUT the axios error object: its `config.data`
 * is the serialized request body, i.e. the OTP (verify) or the password
 * (auto sign-in), and logger.error writes to the browser console.
 */
function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return `status=${error.response?.status ?? "none"} code=${error.code ?? "none"}`
  }
  return error instanceof Error ? error.name : typeof error
}

/**
 * careerbot-api error envelope (app/core/exception_handler.py):
 *   {success: false, error: {message, error_code, details: {error: "OTP_INVALID", remaining_attempts}}}
 * The OTP code lives in error.details.error; error.error_code is the generic HTTP_4xx.
 */
function parseOtpError(data: unknown): { code?: string; message?: string; remaining?: number } {
  const body = (data ?? {}) as Record<string, unknown>
  const err = (body.error && typeof body.error === "object" ? body.error : {}) as Record<string, unknown>
  const details = (err.details && typeof err.details === "object" ? err.details : {}) as Record<string, unknown>
  const code =
    (typeof details.error === "string" && details.error) ||
    (typeof err.code === "string" && err.code) ||
    (typeof body.code === "string" && body.code) ||
    undefined
  const message =
    (typeof err.message === "string" && err.message) ||
    (typeof body.detail === "string" && body.detail) ||
    undefined
  const remainingRaw = details.remaining_attempts ?? err.attempts_remaining
  const remaining = typeof remainingRaw === "number" ? remainingRaw : undefined
  return { code, message, remaining }
}

const OTPVerificationInput: React.FC<OTPVerificationInputProps> = ({
  email,
  userId,
  password,
  onSuccess,
  onClose,
  initialResendCooldown = RESEND_COOLDOWN_SECONDS,
  notice,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const verifyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
  const [status, setStatus] = useState<VerificationStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    inputRefs.current[0]?.focus()
    // Start resend countdown when component mounts (OTP just sent)
    setResendCountdown(initialResendCooldown)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, [])

  // Cleanup post-verify timeout on unmount
  useEffect(() => {
    return () => {
      if (verifyTimeoutRef.current) clearTimeout(verifyTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const handleChange = (index: number, value: string) => {
    // Extract only digits and limit to reasonable autofill length
    const digits = value.replace(/\D/g, '').substring(0, 6)

    if (digits.length === 0) {
      // Clear the current field if input is empty
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)
      setErrorMessage("")
      return
    }

    const newOtp = [...otp]

    // If box was already filled and user typed (2 chars total), replace the digit
    if (otp[index] && digits.length === 2) {
      newOtp[index] = digits[1]
    } else {
      // Handle multi-digit input (from autofill/paste) by spreading across boxes
      for (let i = 0; i < digits.length && i + index < 6; i++) {
        newOtp[i + index] = digits[i]
      }
    }

    setOtp(newOtp)
    setErrorMessage("")

    // Auto-focus next empty input or verify button if all filled
    if (digits.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus()
    } else if (digits.length === 2 && otp[index]) {
      // User typed into filled box: keep focus
    } else if (digits.length > 1) {
      // Multi-digit paste: focus the next empty field after filled ones
      const lastFilledIndex = Math.min(index + digits.length - 1, 5)
      if (lastFilledIndex < 5) {
        inputRefs.current[lastFilledIndex + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const digits = pastedData.replace(/\D/g, '').substring(0, 6)

    if (digits.length > 0) {
      const newOtp = [...otp]
      for (let i = 0; i < digits.length && i + index < 6; i++) {
        newOtp[index + i] = digits[i]
      }
      setOtp(newOtp)
      setErrorMessage("")

      // Focus the last filled input or the next empty one
      const lastFilledIndex = Math.min(index + digits.length - 1, 5)
      if (lastFilledIndex < 5) {
        inputRefs.current[lastFilledIndex + 1]?.focus()
      }
    }
  }

  const handleResend = async () => {
    try {
      await resendVerificationEmail({ email })
      setResendCountdown(RESEND_COOLDOWN_SECONDS)
      toast.success("Verification code resent to your email")
    } catch (error) {
      logger.error(`Resend OTP error: ${describeError(error)}`)
      let errorMsg = "Failed to resend code. Please try again."

      if (axios.isAxiosError(error)) {
        errorMsg = parseOtpError(error.response?.data).message || errorMsg
      } else if (error instanceof Error) {
        errorMsg = error.message
      }

      toast.error(errorMsg)
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join("")

    if (otpCode.length !== 6) {
      setErrorMessage("Please enter all 6 digits.")
      toast.error("Please enter all 6 digits.")
      return
    }

    try {
      setStatus("loading")
      const response = await verifyEmail({ user_id: userId, otp: otpCode })

      logger.info("Email verification response received")

      // careerbot-api answers a successful verify with 200 {"message": ...}
      // and no `success` field; failures are non-2xx and land in the catch.
      if (response?.success !== false) {
        setStatus("success")
        toast.success(response?.message || "Email verified successfully!")

        // The account is verified server-side from here on, whatever happens
        // to the sign-in below, so the recovery banner must not come back.
        localStorage.removeItem(PENDING_VERIFICATION_KEY)

        // Without a password (recovery banner after a reload) there is nothing
        // to sign in with: send the user to the sign-in form.
        if (!password) {
          verifyTimeoutRef.current = setTimeout(() => {
            if (onClose) onClose()
            window.location.href = "/?showLogin=true&verified=true"
          }, 1500)
          return
        }

        // Auto-signin after verification
        verifyTimeoutRef.current = setTimeout(async () => {
          try {
            await signIn({ email, password })
            localStorage.setItem("token_last_refreshed_at", Date.now().toString())
            toast.success("Signed in successfully!")

            if (onSuccess) {
              onSuccess()
            } else {
              window.location.href = "/onboarding"
            }
          } catch (signinError) {
            logger.error(`Auto-signin failed: ${describeError(signinError)}`)
            toast.error("Auto-signin failed. Please sign in manually.")
            if (onClose) onClose()
            window.location.href = "/?showLogin=true&verified=true"
          }
        }, 1500)
      } else {
        setStatus("error")
        setErrorMessage("Email verification failed. Please try again.")
        toast.error("Email verification failed. Please try again.")
      }
    } catch (error: unknown) {
      logger.error(`Email verification error: ${describeError(error)}`)

      let errorMsg = "Email verification failed. Please try again."

      if (axios.isAxiosError(error)) {
        const { code: errorCode, message: detail = "", remaining } = parseOtpError(error.response?.data)

        if (errorCode === "OTP_INVALID") {
          const attempts = remaining || null
          errorMsg = attempts
            ? `Invalid OTP. ${attempts} attempt${attempts !== 1 ? "s" : ""} remaining.`
            : "Invalid OTP."
          setOtp(["", "", "", "", "", ""])
          inputRefs.current[0]?.focus()
        } else if (errorCode === "OTP_EXPIRED") {
          errorMsg = "OTP has expired. Please request a new one."
        } else if (errorCode === "OTP_MAX_ATTEMPTS") {
          errorMsg = "Too many wrong attempts. Please request a new OTP."
        } else if (errorCode === "USER_NOT_FOUND") {
          errorMsg = "User not found. Please sign up again."
        } else {
          errorMsg = detail || errorMsg
        }
      } else if (error instanceof Error) {
        errorMsg = error.message
      }

      setStatus("error")
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-8">
        <div className="mb-8 flex justify-center">
          <CircleCheck className="w-20 h-20 text-green-600" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-3">Email Verified! 🎉</h2>

        <p className="text-gray-600 text-base mb-6">
          Congratulations! Your email has been successfully verified.
        </p>

        <div className="bg-blue-50 border-l-4 border-[#2257a7] rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-[#2257a7]">Next step:</span>{" "}
            {password
              ? "We're setting up your account and signing you in. You'll be redirected to your dashboard shortly."
              : "Sign in with your email and password to continue. Taking you to the sign-in page..."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[#2257a7] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[#2257a7] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-[#2257a7] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          <p className="text-gray-600 text-sm ml-2">{password ? "Signing you in..." : "Redirecting..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Verify your email</h2>
        <p className="text-gray-600 text-sm">Enter the 6-digit code sent to</p>
        <p className="text-gray-900 font-semibold">{email}</p>
        {notice && (
          <p className="text-gray-600 text-sm mt-3" data-testid="otp-notice">{notice}</p>
        )}
      </div>

      {/* OTP Input Fields */}
      <div className="flex gap-2 justify-center mb-4">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(e, index)}
            data-testid={`otp-input-${index}`}
            className={`w-14 h-14 text-2xl font-bold text-center border-2 rounded-lg outline-none transition-all ${
              errorMessage
                ? "border-red-400 bg-red-50"
                : digit
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 bg-white"
            } focus:border-blue-600 focus:ring-1 focus:ring-blue-200`}
          />
        ))}
      </div>

      {/* Error Message (includes attempts if available) */}
      {errorMessage && (
        <p className="text-red-600 text-sm text-center">
          {errorMessage}
        </p>
      )}

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={status === "loading" || otp.join("").length !== 6}
        data-testid="verify-email-btn"
        className="w-full py-3 rounded-lg font-semibold text-white bg-[#2257a7] hover:bg-[#184284] disabled:bg-[#8ba9c7] disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center justify-center gap-2"
      >
        {status === "loading" && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
        {status === "loading" ? "Verifying..." : "Verify email"}
      </button>

      {/* Resend Option */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Didn&apos;t receive the code?{" "}
          <button
            onClick={handleResend}
            disabled={resendCountdown > 0}
            data-testid="resend-otp-btn"
            className={`text-[#2257a7] hover:text-[#184284] disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer ${resendCountdown === 0 ? "font-semibold" : ""}`}
          >
            {resendCountdown > 0 ? `Resend in ${String(Math.floor(resendCountdown / 60)).padStart(2, "0")}:${String(resendCountdown % 60).padStart(2, "0")}` : "Resend"}
          </button>
        </p>
      </div>
    </div>
  )
}

export default OTPVerificationInput
