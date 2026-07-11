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

  const extractErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Object && 'response' in error) {
      const res = (error as Record<string, unknown>).response as Record<string, unknown> | null
      if (res) {
        const status = res.status as number
        // Use backend message directly for client errors (4xx)
        if (status >= 400 && status < 500) {
          const data = res.data as Record<string, unknown> | undefined
          const backendMessage = (data?.error as Record<string, unknown> | undefined)?.message as string | undefined
          if (backendMessage) return backendMessage
        }
        if (status === 503) {
          return fallback.replace('Failed to initiate', '') + ' is temporarily unavailable. Please try email sign-in instead.'
        }
      }
    }
    const mappedError = mapAuthError(error, 'login')
    if (mappedError && !mappedError.includes('Something went wrong')) return mappedError
    return fallback
  }

  const handleGoogleLogin = async () => {
    try {
      storeRedirectTarget()
      const loginUrl = await getGoogleLoginUrl()
      window.location.href = loginUrl
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to initiate Google login'))
    }
  }

  const handleLinkedInLogin = async () => {
    try {
      storeRedirectTarget()
      const loginUrl = await getLinkedInLoginUrl()
      window.location.href = loginUrl
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to initiate LinkedIn login'))
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

