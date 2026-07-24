"use client"
import React, { Suspense } from "react"
import { OAuthSuccessPage } from "@/components/auth/OAuthSuccessPage"

const Fallback = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
    </div>
)

const LinkedInSuccessPage = () => (
    <Suspense fallback={<Fallback />}>
        <OAuthSuccessPage provider="LinkedIn" />
    </Suspense>
)

export default LinkedInSuccessPage
