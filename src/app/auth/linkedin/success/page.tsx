"use client"
import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import Cookies from "js-cookie"

const GoogleSuccessPage = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')

    useEffect(() => {
        const storeTokensAndRedirect = async () => {
            try {
                // Get tokens from URL query parameters
                const accessToken = searchParams.get('access_token')
                const refreshToken = searchParams.get('refresh_token')
                const tokenType = searchParams.get('token_type')
                const expiresIn = searchParams.get('expires_in')

                if (!accessToken || !refreshToken) {
                    throw new Error('No tokens received from backend')
                }

                console.log('Storing tokens from Google OAuth...')

                // Store in localStorage
                localStorage.setItem('access_token', accessToken)
                localStorage.setItem('refresh_token', refreshToken)

                // You might want to fetch user info here or decode the JWT
                // For now, we'll set a default username
                localStorage.setItem('username', 'Google User')

                // Store in cookies (for middleware and server-side access)
                Cookies.set('access_token', accessToken, {
                    expires: 7, // 7 days
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    path: '/'
                })

                Cookies.set('refresh_token', refreshToken, {
                    expires: 30, // 30 days
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    path: '/'
                })

                console.log('✅ Tokens stored successfully')
                setStatus('success')
                toast.success('Successfully signed in with Google!')

                // Redirect to dashboard after a brief moment
                setTimeout(() => {
                    router.push('/dashboard/profile')
                }, 1000)

            } catch (error: any) {
                console.error('❌ Error storing tokens:', error)
                setStatus('error')
                toast.error('Failed to complete sign in')

                // Redirect to signup page after error
                setTimeout(() => {
                    router.push('/signup')
                }, 2000)
            }
        }

        storeTokensAndRedirect()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
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
                        <p className="text-gray-600">Successfully signed in with LinkedIn</p>
                        <p className="text-sm text-gray-500 mt-2">Redirecting to your dashboard...</p>
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
                        <p className="text-sm text-gray-500">Redirecting back to sign up...</p>
                    </>
                )}
            </div>
        </div>
    )
}

export default GoogleSuccessPage