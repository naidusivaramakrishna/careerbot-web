"use client"
import React, { useEffect, useState } from "react"
import { Eye, EyeOff, X, User, Mail, Lock } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { useRouter } from "next/navigation"
import { signUp, signIn } from "@/api/authApi"
import { SignUpForm as ISignUpForm, LoginForm, ErrorState, LoadingState, FormType } from "@/types/authTypes"
import SocialLoginButtons from "./SocialLoginButtons"
import { mapAuthError, AUTH_ERROR_MESSAGES } from "@/lib/authMessages"
import { sanitizeAuthRedirect, DEFAULT_AUTH_REDIRECT } from "@/lib/authRedirect"
import OTPVerificationInput from "./OTPVerificationInput"

interface Props {
    open: boolean
    onClose: () => void
    initialFormType?: FormType
    redirectTo?: string
    onSuccess?: () => void
    /** Skip this modal's own backdrop/blur — use when it's already nested inside
     * another modal that renders its own backdrop, to avoid stacking two
     * expensive backdrop-blur layers (causes visible jank on open). */
    hideOverlay?: boolean
}

const AuthModal: React.FC<Props> = ({ open, onClose, initialFormType = "signup", redirectTo, onSuccess, hideOverlay = false }) => {
    const router = useRouter()
    const authRedirectTo = sanitizeAuthRedirect(redirectTo)

    const [formType, setFormType] = useState<FormType>(initialFormType)
    const [showPassword, setShowPassword] = useState(false)
    const [isEmailVerified, setIsEmailVerified] = useState(false)
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
    const [verificationData, setVerificationData] = useState<{ userId: string; email: string; password: string } | null>(null)

    const [signUpForm, setSignUpForm] = useState<ISignUpForm>({ email: "", username: "", password: "" })
    const [loginForm, setLoginForm] = useState<LoginForm>({ email: "", password: "" })

    const [errors, setErrors] = useState<ErrorState>({ email: "", username: "", password: "", login: "" })
    const [loading, setLoading] = useState<LoadingState>({ signUp: false, login: false })

    // Sync formType whenever the modal opens
    useEffect(() => {
        if (open) setFormType(initialFormType)
    }, [open, initialFormType])

    // Check for email verified in sessionStorage (set by home page)
    useEffect(() => {
        if (sessionStorage.getItem("emailVerified") === "true") {
            setIsEmailVerified(true)
            setFormType("signin")
            sessionStorage.removeItem("emailVerified")
        }
    }, [])

    // Clear errors when switching between signup and signin
    useEffect(() => {
        setErrors({ email: "", username: "", password: "", login: "" })
    }, [formType])

    // handleChange for both forms
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (formType === "signup") setSignUpForm((p) => ({ ...p, [name]: value }))
        else setLoginForm((p) => ({ ...p, [name]: value }))
        setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    // ================== SIGN UP ==================
    const handleSignUp = async () => {
        setErrors({ email: "", username: "", password: "", login: "" })
        setLoading((prev) => ({ ...prev, signUp: true }))
        try {
            const response = await signUp(signUpForm)

            if (response.id) {
                toast.success("Account created! Verification email sent.")
                // Store pending verification in localStorage for recovery if user closes modal
                localStorage.setItem('pendingEmailVerification', JSON.stringify({
                    userId: response.id,
                    email: signUpForm.email,
                    pendingVerification: true,
                    timestamp: Date.now(),
                }))
                setVerificationData({
                    userId: response.id,
                    email: signUpForm.email,
                    password: signUpForm.password,
                })
                setIsVerifyingEmail(true)
            } else {
                setLoading((prev) => ({ ...prev, signUp: false }))
                setErrors({ email: "", username: "", password: "", login: "Account creation failed. Please try again." })
                toast.error("Account creation failed. Please try again.")
            }
        } catch (err) {
            handleApiError(err, false)
            setLoading((prev) => ({ ...prev, signUp: false }))
        }
    }

    // ================== LOGIN ==================
    const handleLogin = async () => {
        setErrors({ email: "", username: "", password: "", login: "" })
        setLoading((prev) => ({ ...prev, login: true }))
        try {
            // Tenant ID is auto-generated and set in context
            // httpClient will add X-Tenant-Id header automatically
            await signIn(loginForm)
            toast.success("Login successful! Redirecting...")
            setLoginForm({ email: "", password: "" })
            // Reset the refresh timestamp so useTokenRefresh doesn't immediately
            // fire a refresh attempt on dashboard mount due to a stale previous-session timestamp.
            localStorage.setItem('token_last_refreshed_at', Date.now().toString())
            if (onSuccess) { onSuccess(); onClose(); } else { window.location.href = authRedirectTo; onClose(); }
        } catch (err) {
            handleApiError(err, true)
        } finally {
            setLoading((prev) => ({ ...prev, login: false }))
        }
    }

    // ================== API Error Handling ==================
    const handleApiError = (err: unknown, isLogin = false) => {
        if (axios.isAxiosError(err)) {
            const res = err.response
            const newErrors: ErrorState = { email: "", username: "", password: "", login: "" }

            // No response at all — the request never completed (timeout, offline, server
            // unreachable). There is no status or body to branch on, so report the
            // connection failure instead of falling through to the field-error parsing.
            if (!res) {
                const timedOut = err.code === "ECONNABORTED" || err.code === "ETIMEDOUT"
                console.warn(
                    `[auth:${isLogin ? 'signin' : 'signup'}] no response (${err.code ?? 'unknown'}): ${err.message}`
                )
                newErrors.login = timedOut
                    ? "The server took too long to respond. Please try again."
                    : AUTH_ERROR_MESSAGES.NETWORK_ERROR
                setErrors(newErrors)
                return
            }

            console.error(`[auth:${isLogin ? 'signin' : 'signup'}] status=${res.status}`, res.data)

            // Backend uses OAuth2 form-data convention on /signin, so the email field
            // is reported as "username". Re-map to "email" for the login UI.
            const normaliseField = (field: string): string =>
                isLogin && field === 'username' ? 'email' : field

            const cleanMessage = (raw: string): string => {
                let msg = raw
                if (msg.includes('Value error,')) msg = msg.replace('Value error,', '').trim()
                if (msg.includes(':')) msg = msg.split(':').slice(1).join(':').trim()
                return msg
            }

            // Handle new backend validation error format (envelope with validation_errors)
            if (res?.data?.error?.details?.validation_errors) {
                const validationErrors: Array<{ field: string; message: string }> =
                    res.data.error.details.validation_errors
                validationErrors.forEach((v) => {
                    const field = normaliseField(v.field)
                    if (field in newErrors && !newErrors[field as keyof ErrorState]) {
                        newErrors[field as keyof ErrorState] = cleanMessage(v.message)
                    }
                })
                setErrors(newErrors)
            }
            // Handle FastAPI 422 validation format (detail array) — applies to login & signup
            else if (res?.status === 422 && Array.isArray(res.data.detail)) {
                res.data.detail.forEach((d: { loc: string[]; msg: string }) => {
                    const rawField = d.loc[d.loc.length - 1]
                    const field = normaliseField(rawField)
                    if (field in newErrors && !newErrors[field as keyof ErrorState]) {
                        newErrors[field as keyof ErrorState] = cleanMessage(d.msg)
                    }
                })
                setErrors(newErrors)
            }
            // Handle direct error message from backend
            else if (res?.data?.error?.message) {
                const msg = res.data.error.message as string
                const msgLower = msg.toLowerCase()
                if (!isLogin && msgLower.includes('username')) {
                    newErrors.username = msg
                } else if (!isLogin && msgLower.includes('email')) {
                    newErrors.email = msg
                } else {
                    newErrors.login = msg
                }
                setErrors(newErrors)
            }
            // Handle generic error messages with safe, user-friendly mapping.
            // Merge the HTTP status into the data so mapAuthError can identify 5xx
            // errors (e.g. 502 when the backend is unreachable) and return the
            // correct SERVER_ERROR message instead of the generic fallback.
            else {
                const context = isLogin ? 'login' : 'signup'
                const errorPayload = res?.data
                    ? { ...res.data, status: res.status }
                    : err
                const safeMessage = mapAuthError(errorPayload, context)
                const rawMsg = (
                    res?.data?.detail || res?.data?.message || res?.data?.error || ''
                ).toString().toLowerCase()
                if (!isLogin && rawMsg.includes('username')) {
                    newErrors.username = safeMessage
                } else if (!isLogin && rawMsg.includes('email')) {
                    newErrors.email = safeMessage
                } else {
                    newErrors.login = safeMessage
                }
                setErrors(newErrors)
            }
        } else {
            setErrors((prev) => ({ ...prev, login: "Something went wrong. Please try again." }))
        }
    }

    const renderLoginForm = () => {
        const activeLoginError = errors.email ? 'email' : errors.password ? 'password' : errors.login ? 'login' : null
        return (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="flex flex-col gap-4">
                {/* Email Field */}
                <div className="mb-4">
                    <label htmlFor="login-email" className="text-sm font-semibold text-gray-900 mb-2 block">Email address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="email"
                            name="email"
                            autoFocus
                            placeholder="name@example.com"
                            value={loginForm.email}
                            onChange={handleChange}
                            data-testid="login-email-input"
                            id="login-email"
                            className={`w-full rounded-md pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 transition-all ${(errors.email || errors.login) ? 'bg-red-50 border border-red-400 focus:ring-red-300' : 'bg-white border border-gray-300 focus:border-blue-400 focus:ring-blue-200'}`}
                        />
                    </div>
                    {activeLoginError === 'email' && <p role="alert" className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="mb-4">
                    <label htmlFor="login-password" className="text-sm font-semibold text-gray-900 mb-2 block">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Enter your password"
                            value={loginForm.password}
                            onChange={handleChange}
                            data-testid="login-password-input"
                            id="login-password"
                            className={`w-full rounded-md pl-10 pr-10 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 transition-all ${(errors.password || errors.login) ? 'bg-red-50 border border-red-400 focus:ring-red-300' : 'bg-white border border-gray-300 focus:border-blue-400 focus:ring-blue-200'}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            data-testid="toggle-login-password-btn"
                            aria-label="Toggle password visibility"
                            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {activeLoginError === 'password' && <p role="alert" className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    {activeLoginError === 'login' && <p role="alert" className="text-red-500 text-xs mt-1">{errors.login}</p>}
                </div>

                <p
                    data-testid="forgot-password-link"
                    className="text-xs font-semibold cursor-pointer flex justify-end mb-4 text-blue-600 hover:text-blue-700 transition-colors"
                    onClick={() => {
                        router.push('/forgot-password')
                        onClose()
                    }}
                >
                    Forgot Password?
                </p>

                <button
                    type="submit"
                    disabled={loading.login}
                    data-testid="login-submit-btn"
                    className="w-full py-3 rounded-md font-semibold text-white text-sm bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                    {loading.login ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Signing in...
                        </>
                    ) : (
                        "Sign in"
                    )}
                </button>
            </form>
        )
    }


    const renderAuthForm = () => {
        // Show OTP verification during signup flow
        if (isVerifyingEmail && verificationData) {
            return (
                <OTPVerificationInput
                    userId={verificationData.userId}
                    email={verificationData.email}
                    password={verificationData.password}
                    onSuccess={() => {
                        // Clear pending verification from localStorage on success
                        localStorage.removeItem('pendingEmailVerification')
                        setIsVerifyingEmail(false)
                        setLoading((prev) => ({ ...prev, signUp: false }))
                        // Call parent onSuccess callback if provided
                        if (onSuccess) {
                            onSuccess()
                            onClose()
                        } else {
                            // New users always go to onboarding first. If a specific redirect
                            // was intended (not the default), append it as ?next= so onboarding
                            // can forward them after profile setup.
                            onClose()
                            if (authRedirectTo !== DEFAULT_AUTH_REDIRECT) {
                                window.location.href = `/onboarding?next=${encodeURIComponent(authRedirectTo)}`
                            } else {
                                window.location.href = "/onboarding"
                            }
                        }
                    }}
                    onClose={() => {
                        // Keep pending verification in localStorage so user can recover
                        // (Don't clear it - let user resume from recovery option if they closed modal)
                        setIsVerifyingEmail(false)
                        setVerificationData(null)
                        setFormType("signup")
                        setLoading((prev) => ({ ...prev, signUp: false }))
                    }}
                />
            )
        }

        // Show verified email message when redirected from email verification
        if (isEmailVerified && formType === "signin") {
            return (
                <>
                    <div className="text-center mb-6">
                        <div className="mb-4 flex justify-center">
                            <div className="bg-green-100 rounded-full p-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-xl font-semibold text-green-600 mb-2">Email Verified!</h1>
                        <p className="text-gray-600">Your email has been successfully verified. Please log in with your credentials to access your account.</p>
                    </div>
                    {renderLoginForm()}
                </>
            )
        }

        return (
            <>
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {formType === "signup" ? "Create your account" : "Welcome back"}
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">
                        {formType === "signup"
                            ? "Start with your CareerBOT account."
                            : "Sign in to continue your career journey"}
                    </p>
                </div>

                {/* Username Field (Signup Only) */}
                {formType === "signup" && (
                    <div className="mb-4">
                        <label htmlFor="signup-username" className="text-sm font-semibold text-gray-900 mb-2 block">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                name="username"
                                autoFocus
                                placeholder="Enter username"
                                value={signUpForm.username}
                                onChange={handleChange}
                                data-testid="signup-username-input"
                                id="signup-username"
                                className={`w-full rounded-md pl-10 pr-4 py-3 border text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 transition-all ${errors.username ? 'bg-red-50 border-red-400 focus:ring-red-300' : 'bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-200'}`}
                            />
                        </div>
                        {errors.username && <p role="alert" className="text-red-500 text-xs mt-1">{errors.username}</p>}
                    </div>
                )}

                {/* Email Field */}
                <div className="mb-4">
                    <label htmlFor="signup-email" className="text-sm font-semibold text-gray-900 mb-2 block">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="email"
                            name="email"
                            placeholder="name@example.com"
                            value={formType === "signup" ? signUpForm.email : loginForm.email}
                            onChange={handleChange}
                            data-testid="signup-email-input"
                            id="signup-email"
                            className={`w-full rounded-md pl-10 pr-4 py-3 border text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 transition-all ${(errors.email || errors.login) ? 'bg-red-50 border-red-400 focus:ring-red-300' : 'bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-200'}`}
                        />
                    </div>
                    {errors.email && <p role="alert" className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="mb-4">
                    <label htmlFor="signup-password" className="text-sm font-semibold text-gray-900 mb-2 block">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Enter your password"
                            value={formType === "signup" ? signUpForm.password : loginForm.password}
                            onChange={handleChange}
                            data-testid="signup-password-input"
                            id="signup-password"
                            className={`w-full rounded-md pl-10 pr-10 py-3 border text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 transition-all ${(errors.password || errors.login) ? 'bg-red-50 border-red-400 focus:ring-red-300' : 'bg-white border-gray-300 focus:border-blue-400 focus:ring-blue-200'}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            data-testid="toggle-password-btn"
                            aria-label="Toggle password visibility"
                            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.password && <p role="alert" className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    {errors.login && <p role="alert" className="text-red-500 text-xs mt-1">{errors.login}</p>}
                </div>

                {/* Forgot Password Link (Signin Only) */}
                {formType === "signin" && (
                    <p
                        data-testid="forgot-password-link"
                        className="text-xs font-semibold cursor-pointer flex justify-end mb-4 text-blue-600 hover:text-blue-700 transition-colors"
                        onClick={() => {
                            router.push('/forgot-password')
                            onClose()
                        }}
                    >
                        Forgot Password?
                    </p>
                )}

                {/* Submit Button */}
                <button
                    onClick={formType === "signup" ? handleSignUp : handleLogin}
                    disabled={formType === "signup" ? loading.signUp : loading.login}
                    data-testid="auth-submit-btn"
                    className="w-full py-3 rounded-md font-semibold text-white text-sm bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                    {formType === "signup" ? (
                        loading.signUp ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Creating account...
                            </>
                        ) : (
                            "Create Account"
                        )
                    ) : loading.login ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Signing in...
                        </>
                    ) : (
                        "Sign in"
                    )}
                </button>

                {/* Divider */}
                <div className="flex items-center my-4">
                    <div className="grow h-px bg-gray-300"></div>
                    <p className="text-gray-500 text-center px-4 text-xs font-semibold">
                        Or continue with
                    </p>
                    <div className="grow h-px bg-gray-300"></div>
                </div>

                {/* Social Login Buttons */}
                <SocialLoginButtons redirectTo={authRedirectTo} />

                {/* Switch Form Link */}
                <p className="text-sm text-center mt-4 text-gray-700">
                    {formType === "signup" ? (
                        <>
                            Already have an account?{" "}
                            <span
                                onClick={() => setFormType("signin")}
                                data-testid="switch-to-signin-link"
                                className="text-blue-600 font-semibold cursor-pointer hover:text-blue-700 transition-colors"
                            >
                                Sign in
                            </span>
                        </>
                    ) : (
                        <>
                            Don&apos;t have an account?{" "}
                            <span
                                onClick={() => setFormType("signup")}
                                data-testid="switch-to-signup-link"
                                className="text-blue-600 font-semibold cursor-pointer hover:text-blue-700 transition-colors"
                            >
                                Sign up
                            </span>
                        </>
                    )}
                </p>
            </>
        )
    }

    if (!open) return null

    const handleModalClose = () => {
        // Reset verification state when closing
        if (isVerifyingEmail) {
            setIsVerifyingEmail(false)
            setVerificationData(null)
            setLoading((prev) => ({ ...prev, signUp: false }))
        }
        onClose()
    }

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${hideOverlay ? "" : "bg-black/60 backdrop-blur-md"}`}>
            <div className="relative w-full max-w-124 h-150 p-8 rounded-[28px] shadow-2xl bg-white ring-1 ring-gray-200">
                <button
                    onClick={handleModalClose}
                    data-testid="auth-modal-close-btn"
                    aria-label="Close modal"
                    className="absolute top-5 right-5 p-1.5 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="h-4 w-4 text-gray-500" />
                </button>
                {/* render form for both signup and login */}
                {renderAuthForm()}
            </div>
        </div>
    )
}

export default AuthModal
