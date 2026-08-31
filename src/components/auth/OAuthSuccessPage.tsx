"use client"
import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { isAuthenticated } from "@/api/authApi"
import { getStoredAuthRedirect } from "@/lib/authRedirect"

interface Props {
    provider: string
}

/**
 * Remove access_token / refresh_token from the address bar without navigating.
 *
 * A token in a URL is written to browser history, sent in the Referer header
 * of any subsequent third-party request from this page, and captured by proxy
 * and CDN access logs. Replacing the entry as soon as the value has been read
 * keeps the credential out of all three.
 */
function scrubAuthTokensFromUrl(): void {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (!url.searchParams.has('access_token') && !url.searchParams.has('refresh_token')) return
    url.searchParams.delete('access_token')
    url.searchParams.delete('refresh_token')
    window.history.replaceState({}, '', url.toString())
}

export function OAuthSuccessPage({ provider }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')

    useEffect(() => {
        const verifyAndRedirect = async () => {
            try {
                // NO token is read from the URL, and none is stored.
                //
                // The backend's LinkedIn callback redirects here with the
                // session already set as httpOnly cookies and nothing in the
                // query string — verified against careerbot-api
                // origin/integration/develop2_072026_pr:
                // app/api/v1/endpoints/linkedin_oauth.py, which builds
                // RedirectResponse(f"{frontend_url}/auth/linkedin/success")
                // and then calls set_access_token_cookie /
                // set_refresh_token_cookie. (The careerbot:// deep-link
                // further down that file is the mobile path, not this page.)
                //
                // So the legitimate flow NEVER supplies access_token or
                // refresh_token here. Anything that does is a crafted link,
                // which is why the previous behaviour — persisting both to
                // localStorage "as backup (for debugging or if cookies fail)"
                // — was worse than redundant: the long-lived refresh token
                // became readable by any XSS on this origin, and the access
                // token was replayed as an Authorization: Bearer header on
                // every subsequent request by the interceptor in lib/http.ts,
                // letting an attacker-supplied token drive the victim's
                // session.
                //
                // The cookies are the session. The URL is scrubbed so nothing
                // supplied there survives in history or a Referer header.
                scrubAuthTokensFromUrl()

                // ✅ Verify authentication (uses httpOnly cookies set by backend callback)
                const authenticated = await isAuthenticated()

                if (authenticated) {
                    setStatus('success')
                    sessionStorage.removeItem('__signing_out')
                    toast.success(`Successfully signed in with ${provider}!`)

                    const redirectTo = getStoredAuthRedirect()
                    setTimeout(() => router.push(redirectTo), 1000)
                } else {
                    setStatus('error')
                    toast.error('Session verification failed. Please try again.')
                    setTimeout(() => router.push('/'), 2000)
                }
            } catch (error: unknown) {
                console.error('Sign in error:', error)
                setStatus('error')
                toast.error('Failed to complete sign in')
                setTimeout(() => router.push('/'), 2000)
            }
        }

        verifyAndRedirect()
    }, [searchParams, router, provider])

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
            <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'processing' && (
                    <>
                        <div className="relative mb-6">
                            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Completing sign in...</h2>
                        <p className="text-gray-600">Setting up your account</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-green-500 mb-6">
                            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome! 🎉</h2>
                        <p className="text-gray-600">Successfully signed in with {provider}</p>
                        <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-red-500 mb-6">
                            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
                        <p className="text-gray-600 mb-4">Something went wrong</p>
                        <p className="text-sm text-gray-500">Redirecting home...</p>
                    </>
                )}
            </div>
        </div>
    )
}
