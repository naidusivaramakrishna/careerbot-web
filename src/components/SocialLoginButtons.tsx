"use client"
import React from "react"
import Image from "next/image"
import { getGoogleLoginUrl, getLinkedInLoginUrl } from "@/api/authApi"
import { toast } from "sonner"

interface Props {
  variant?: "signup" | "signin"
}

const SocialLoginButtons: React.FC<Props> = ({ variant = "signup" }) => {
  // Use BACKEND OAuth for Google (gives you tokens for your API)
  const handleGoogleLogin = async () => {
    try {
      const loginUrl = await getGoogleLoginUrl()
      window.location.href = loginUrl
    } catch (error) {
      console.error('Error initiating Google login:', error)
      toast.error('Failed to initiate Google login')
    }
  }
  // Use BACKEND OAuth for LinkedIn 
  const handleLinkedInLogin = async () => {
    try {
      const loginUrl = await getLinkedInLoginUrl()
      window.location.href = loginUrl
    } catch (error) {
      console.error('Error initiating LinkedIn login:', error)
      toast.error('Failed to initiate LinkedIn login')
    }
  }

  return (
    <div className="flex gap-2 my-4">
      {/* Google Button - Uses Backend OAuth */}
      <div className="w-full flex items-center">
        <button
          onClick={handleGoogleLogin}
          className="flex gap-2 items-center justify-center border border-neutral-200 cursor-pointer rounded-lg px-4 py-3 w-full"
        >
          <Image src="/assets/icons/google-icon.svg" alt="google-icon" width={24} height={24} className="w-6 h-6" />
          {/* <span className="text-xl font-semibold">
            {variant === "signup" ? "Sign up" : "Sign in"} with Google
          </span> */}
        </button>
      </div>


      {/* LinkedIn + Microsoft - Using NextAuth (update these when backend supports them) */}
      <div className="w-full flex items-center">
        <button
          onClick={handleLinkedInLogin}
          className="flex gap-2 items-center justify-center border border-neutral-200 cursor-pointer rounded-lg px-4 py-3 w-full"
        >
          <Image src="/assets/icons/linkedin-icon.svg" alt="linkedin-icon" width={24} height={24} className="w-6 h-6" />
          {/* <span className="text-xl font-semibold">{variant === "signup" ? "Sign up" : "Sign in"} with LinkedIn</span> */}
        </button>
      </div>
    </div>
  )
}

export default SocialLoginButtons