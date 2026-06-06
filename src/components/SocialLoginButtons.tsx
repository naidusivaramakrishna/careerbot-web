"use client"
import React from "react"
import Image from "next/image"
import { getGoogleLoginUrl, getLinkedInLoginUrl } from "@/api/authApi"
import { mapAuthError } from "@/lib/authMessages"
import { AUTH_REDIRECT_STORAGE_KEY, sanitizeAuthRedirect } from "@/lib/authRedirect"
import { toast } from "sonner"

interface Props {
  variant?: "signup" | "signin"
  redirectTo?: string
}

const SocialLoginButtons: React.FC<Props> = ({ variant = "signup", redirectTo }) => {
  const storeRedirectTarget = () => {
    sessionStorage.setItem(
      AUTH_REDIRECT_STORAGE_KEY,
      sanitizeAuthRedirect(redirectTo)
    )
  }

  // Use BACKEND OAuth for Google (gives you tokens for your API)
  const handleGoogleLogin = async () => {
    try {
      storeRedirectTarget()
      const loginUrl = await getGoogleLoginUrl()
      window.location.href = loginUrl
    } catch (error) {
      // Check for service unavailability (503)
      const isServiceUnavailable =
        error instanceof Object && 'response' in error &&
        typeof (error as Record<string, unknown>).response === 'object' &&
        (error as Record<string, unknown>).response !== null &&
        (error as Record<string, Record<string, unknown>>).response.status === 503;

      let errorMessage = 'Failed to initiate Google login';
      if (isServiceUnavailable) {
        errorMessage = 'Google sign-in is temporarily unavailable. Please try email sign-in instead.';
      } else {
        // Map other errors to user-friendly messages
        const mappedError = mapAuthError(error, 'login');
        if (mappedError && !mappedError.includes('Something went wrong')) {
          errorMessage = mappedError;
        }
      }
      toast.error(errorMessage)
    }
  }
  // Use BACKEND OAuth for LinkedIn
  const handleLinkedInLogin = async () => {
    try {
      storeRedirectTarget()
      const loginUrl = await getLinkedInLoginUrl()
      window.location.href = loginUrl
    } catch (error) {
      // Check for service unavailability (503)
      const isServiceUnavailable =
        error instanceof Object && 'response' in error &&
        typeof (error as Record<string, unknown>).response === 'object' &&
        (error as Record<string, unknown>).response !== null &&
        (error as Record<string, Record<string, unknown>>).response.status === 503;

      let errorMessage = 'Failed to initiate LinkedIn login';
      if (isServiceUnavailable) {
        errorMessage = 'LinkedIn sign-in is temporarily unavailable. Please try email sign-in instead.';
      } else {
        // Map other errors to user-friendly messages
        const mappedError = mapAuthError(error, 'login');
        if (mappedError && !mappedError.includes('Something went wrong')) {
          errorMessage = mappedError;
        }
      }
      toast.error(errorMessage)
    }
  }

  return (
    <div className="flex  gap-2 my-4">
      {/* Google Button - Uses Backend OAuth */}
      <div className="w-full flex items-center">
        <button
          onClick={handleGoogleLogin}
          className="flex gap-2 items-center justify-center hover:bg-gray-200 cursor-pointer rounded-lg px-4 py-2.5 w-full border border-gray-300 outline-none focus:ring-2 focus:ring-blue-200 transition-all"
        >
          <Image src="/assets/icons/google-icon.svg" alt="google-icon" width={20} height={20} className="w-4 h-4" />
          <span className="text-sm">
            {variant === "signup" ? "Sign up" : "Sign in"} with Google
          </span>
        </button>
      </div>


      {/* LinkedIn + Microsoft - Using NextAuth (update these when backend supports them) */}
      <div className="w-full flex items-center">
        <button
          onClick={handleLinkedInLogin}
          className="flex gap-2 items-center justify-center  hover:bg-gray-200 cursor-pointer rounded-lg px-4 py-2.5 w-full border border-gray-300 outline-none focus:ring-2 focus:ring-blue-200 transition-all"
        >
          <Image src="/assets/icons/linkedin-icon.svg" alt="linkedin-icon" width={20} height={20} className="w-4 h-4" />
          <span className="text-sm ">{variant === "signup" ? "Sign up" : "Sign in"} with LinkedIn</span>
        </button>
      </div>
    </div>
  )
}

export default SocialLoginButtons

