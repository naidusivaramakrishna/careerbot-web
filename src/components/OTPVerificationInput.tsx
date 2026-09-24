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
}

type VerificationStatus = "idle" | "loading" | "success" | "error"

const OTPVerificationInput: React.FC<OTPVerificationInputProps> = ({
  email,
  userId,
  password,
  onSuccess,
  onClose,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
  const [status, setStatus] = useState<VerificationStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    inputRefs.current[0]?.focus()
    // Start resend countdown when component mounts (OTP just sent)
    setResendCountdown(30)
  }, [])

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setErrorMessage("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
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
      setResendCountdown(30)
      toast.success("Verification code resent to your email")
    } catch (error) {
      logger.error("Resend OTP error:", error)
      let errorMsg = "Failed to resend code. Please try again."

      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as unknown as Record<string, unknown>
        const errorObj = (apiError?.error as Record<string, unknown>) || {}
        errorMsg = (errorObj?.message as string) || (apiError?.detail as string) || errorMsg
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

      if (response && response.message) {
        setStatus("success")
        toast.success(response.message || "Email verified successfully!")

        // Auto-signin after verification
        setTimeout(async () => {
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
            logger.error("Auto-signin failed:", signinError)
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
      logger.error("Email verification error:", error)

      let errorMsg = "Email verification failed. Please try again."
      let attempts: number | null = null

      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as unknown as Record<string, unknown>
        const errorObj = (apiError?.error as Record<string, unknown>) || {}
        const errorCode = (errorObj?.code as string) || (apiError?.code as string)
        const detail = (errorObj?.message as string) || (apiError?.detail as string) || ""

        if (errorCode === "OTP_INVALID") {
          attempts = (errorObj?.attempts_remaining as number) || null
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
        setRemainingAttempts(attempts)
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
            <span className="font-semibold text-[#2257a7]">Next step:</span> We&apos;re setting up your account and signing you in. You&apos;ll be redirected to your dashboard shortly.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[#2257a7] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[#2257a7] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-[#2257a7] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          <p className="text-gray-600 text-sm ml-2">Signing you in...</p>
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
            maxLength={1}
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

      {/* Error Message */}
      {errorMessage && (
        <p className="text-red-600 text-sm text-center">
          {errorMessage}
        </p>
      )}

      {/* Remaining Attempts Info */}
      {remainingAttempts !== null && (
        <p className="text-xs text-red-500 text-center">
          {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
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
            {resendCountdown > 0 ? `Resend in 00:${String(resendCountdown).padStart(2, "0")}` : "Resend"}
          </button>
        </p>
      </div>
    </div>
  )
}

export default OTPVerificationInput
