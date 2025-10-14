"use client"
import React from "react"
import Image from "next/image"
import { signIn as nextAuthSignIn } from "next-auth/react"

interface Props {
  variant?: "signup" | "signin"
}

const SocialLoginButtons: React.FC<Props> = ({ variant = "signup" }) => {
  const handleGoogleLogin = () => nextAuthSignIn("google", { callbackUrl: "/dashboard/jobs" })
  const handleLinkedInLogin = () => nextAuthSignIn("linkedin", { callbackUrl: "/dashboard/jobs" })
  const handleMicrosoftLogin = () => nextAuthSignIn("azure-ad", { callbackUrl: "/dashboard/jobs" })

  return (
    <>
      {/* Google Button */}
      <button
        onClick={handleGoogleLogin}
        className="flex gap-2 items-center justify-center border border-neutral-200 cursor-pointer rounded-lg px-4 py-2 w-full"
      >
        <Image src="/assets/icons/google-icon.svg" alt="google-icon" width={24} height={24} className="w-6 h-6" />
        <span className="text-xl font-semibold">
          {variant === "signup" ? "Sign up" : "Sign in"} with Google
        </span>
      </button>

      {/* LinkedIn + Microsoft */}
      <div className="w-full flex items-center gap-2 my-4">
        <button
          onClick={handleLinkedInLogin}
          className="flex gap-2 items-center justify-center border border-neutral-200 cursor-pointer rounded-lg px-4 py-2 w-full"
        >
          <Image src="/assets/icons/linkedin-icon.svg" alt="linkedin-icon" width={24} height={24} className="w-6 h-6" />
          <span className="text-xl font-semibold">LinkedIn</span>
        </button>
        <button
          onClick={handleMicrosoftLogin}
          className="flex gap-2 items-center justify-center border border-neutral-200 cursor-pointer rounded-lg px-4 py-2 w-full"
        >
          <Image src="/assets/icons/microsoft-icon.svg" alt="microsoft-icon" width={24} height={24} className="w-6 h-6" />
          <span className="text-xl font-semibold">Microsoft</span>
        </button>
      </div>
    </>
  )
}

export default SocialLoginButtons
