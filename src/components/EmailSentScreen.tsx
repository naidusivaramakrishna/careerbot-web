"use client"
import React from "react"

interface Props {
  email: string
  onGoToSignIn: () => void
  onClose: () => void
}

export function EmailSentScreen({ email, onGoToSignIn, onClose }: Props) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-6 flex justify-center">
        <div className="bg-green-100 rounded-full p-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Check Your Email</h2>
      <p className="text-gray-600 text-center mb-4">
        We&apos;ve sent a verification link to <strong>{email}</strong>
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 w-full text-sm text-blue-700">
        <p className="font-semibold mb-2">📧 Next steps:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Check your inbox for the verification email</li>
          <li>Click the verification link</li>
          <li>You&apos;ll be logged in automatically</li>
        </ul>
      </div>
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 w-full">
        <p className="text-xs text-orange-700">
          <strong>💡 Tip:</strong> Check your spam folder if you don&apos;t see the email. The link expires in 48 hours.
        </p>
      </div>
      <button
        onClick={onGoToSignIn}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors mb-3"
      >
        Go to Sign in
      </button>
      <button
        onClick={onClose}
        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2.5 rounded-lg transition-colors"
      >
        Close
      </button>
    </div>
  )
}
