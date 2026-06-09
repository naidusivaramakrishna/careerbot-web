"use client"
import React, { useEffect, useState } from "react"
import { Eye, EyeClosed, X } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { useRouter } from "next/navigation"
import { signUp, signIn } from "@/api/authApi"
import { SignUpForm as ISignUpForm, LoginForm, ErrorState, LoadingState, FormType } from "@/types/authTypes"
import SocialLoginButtons from "./SocialLoginButtons"
import { mapAuthError } from "@/lib/authMessages"
import { sanitizeAuthRedirect } from "@/lib/authRedirect"

interface Props {
    open: boolean
    onClose: () => void
    initialFormType?: FormType
    redirectTo?: string
    onSuccess?: () => void
}

const AuthModal: React.FC<Props> = ({ open, onClose, initialFormType = "signup", redirectTo, onSuccess }) => {
    const router = useRouter()
    const authRedirectTo = sanitizeAuthRedirect(redirectTo)

    const [formType, setFormType] = useState<FormType>(initialFormType)
    const [showPassword, setShowPassword] = useState(false)
    const [isEmailVerified, setIsEmailVerified] = useState(false)

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
            // Tenant ID is auto-generated and set in context
            // httpClient will add X-Tenant-Id header automatically
            await signUp(signUpForm)

            // Sign in immediately after signup to get access_token and refresh_token
            await signIn({ email: signUpForm.email, password: signUpForm.password })

            // Verification email is sent automatically by backend
            // User can verify email from profile/settings later
            toast.success("Account created! Redirecting...")
            localStorage.setItem('token_last_refreshed_at', Date.now().toString())
            if (onSuccess) { onSuccess(); onClose(); } else { window.location.href = authRedirectTo }
        } catch (err) {
            handleApiError(err)
        } finally {
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
            console.error(`[auth:${isLogin ? 'signin' : 'signup'}] status=${res?.status}`, res?.data)
            const newErrors: ErrorState = { email: "", username: "", password: "", login: "" }

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
                newErrors.login = res.data.error.message
                setErrors(newErrors)
            }
            // Handle generic error messages with safe, user-friendly mapping
            else {
                const context = isLogin ? 'login' : 'signup'
                const safeMessage = mapAuthError(res?.data || err, context)
                newErrors.login = safeMessage
                setErrors(newErrors)
            }
        } else {
            setErrors((prev) => ({ ...prev, login: "Something went wrong" }))
        }
    }

    const renderLoginForm = () => {
        const activeLoginError = errors.email ? 'email' : errors.password ? 'password' : errors.login ? 'login' : null
        return (
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="flex flex-col gap-4">
            <input
                type="email"
                name="email"
                autoFocus
                placeholder="Email Address"
                value={loginForm.email}
                onChange={handleChange}
                className={`w-full rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 transition-all ${(errors.email || errors.login) ? 'bg-red-50 border border-red-400 focus:ring-red-300' : 'bg-gray-100 border border-gray-300 focus:ring-blue-200'}`}
            />
            {activeLoginError === 'email' && <p className="text-red-500 text-xs -mt-2">{errors.email}</p>}

            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={handleChange}
                    className={`w-full rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 transition-all ${(errors.password || errors.login) ? 'bg-red-50 border border-red-400 focus:ring-red-300' : 'bg-gray-100 border border-gray-300 focus:ring-blue-200'}`}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                </button>
            </div>

            {activeLoginError === 'password' && <p className="text-red-500 text-xs -mt-2">{errors.password}</p>}
            {activeLoginError === 'login' && <p className="text-red-500 text-xs -mt-2">{errors.login}</p>}

            <p
                className="text-xs font-semibold cursor-pointer flex justify-end my-2 text-blue-500 hover:text-blue-700 transition-colors"
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
                className="w-full py-3 rounded-xl font-semibold text-white text-sm bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-purple-200 flex items-center justify-center gap-2"
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
    )}


    const renderAuthForm = () => {
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
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {formType === "signup" ? "Create Your Account" : "Welcome Back"}
                        </h1>
                    </div>
                    <p className="text-[#473659] text-sm mt-1">
                        {formType === "signup"
                            ? "Join us today and start your journey"
                            : "Sign in to continue your career journey"}
                    </p>
                </div>

                <SocialLoginButtons variant={formType} redirectTo={authRedirectTo} />

                <div className="flex items-center my-5">
                    <div className="grow h-px bg-gray-300"></div>
                    <p className="text-gray-500 text-center px-4 text-xs font-semibold">
                        Or Continue with Email
                    </p>
                    <div className="grow h-px bg-gray-300"></div>
                </div>

                {(() => {
                    const activeError = (formType === 'signup' && errors.username) ? 'username'
                        : errors.email ? 'email'
                        : errors.password ? 'password'
                        : errors.login ? 'login' : null
                    return (
                        <div className="flex flex-col gap-4">
                            {formType === "signup" && (
                                <>
                                    <input
                                        type="text"
                                        name="username"
                                        autoFocus
                                        placeholder="Username"
                                        value={signUpForm.username}
                                        onChange={handleChange}
                                        className={`w-full rounded-xl px-4 py-3 border text-sm text-gray-800 placeholder-[#635B6B] outline-none focus:ring-2 transition-all ${errors.username ? 'bg-red-50 border-red-400 focus:ring-red-300' : 'bg-gray-100 border-gray-300 focus:ring-blue-300'}`}
                                    />
                                    {activeError === 'username' && <p className="text-red-500 text-xs -mt-2">{errors.username}</p>}
                                </>
                            )}

                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formType === "signup" ? signUpForm.email : loginForm.email}
                                onChange={handleChange}
                                className={`w-full rounded-xl px-4 py-3 border text-sm text-gray-800 placeholder-[#635B6B] outline-none focus:ring-2 transition-all ${(errors.email || (formType === "signin" && errors.login)) ? 'bg-red-50 border-red-400 focus:ring-red-300' : 'bg-gray-100 border-gray-300 focus:ring-blue-300'}`}
                            />
                            {activeError === 'email' && <p className="text-red-500 text-xs -mt-2">{errors.email}</p>}

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={formType === "signup" ? signUpForm.password : loginForm.password}
                                    onChange={handleChange}
                                    className={`w-full rounded-xl px-4 py-3 border text-sm text-gray-800 placeholder-[#635B6B] outline-none focus:ring-2 transition-all ${(errors.password || (formType === "signin" && errors.login)) ? 'bg-red-50 border-red-400 focus:ring-red-300' : 'bg-gray-100 border-gray-300 focus:ring-blue-300'}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {activeError === 'password' && <p className="text-red-500 text-xs -mt-2">{errors.password}</p>}
                            {activeError === 'login' && <p className="text-red-500 text-xs -mt-2">{errors.login}</p>}
                        </div>
                    )
                })()}

                {formType === "signin" && (
                    <p
                        className="text-xs font-semibold cursor-pointer flex justify-end my-2 text-[#1e0ce8] hover:text-blue-700 transition-colors"
                        onClick={() => {
                            router.push('/forgot-password')
                            onClose()
                        }}
                    >
                        Forgot Password?
                    </p>
                )}

                <button
                    onClick={formType === "signup" ? handleSignUp : handleLogin}
                    disabled={formType === "signup" ? loading.signUp : loading.login}
                    className="w-full mt-5 py-3 rounded-xl font-semibold text-white text-sm bg-[#2257a7] hover:bg-[#184284] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                    {formType === "signup" ? (
                        loading.signUp ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Signing up...
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

                <div className="text-xs text-center text-[#7B698F] mt-4 space-y-1">
                    <p>
                        By continuing, you agree to our <b className="text-[#371A62] font-semibold">Terms</b> and <b className="text-[#371A62] font-semibold">Privacy Policy</b>
                    </p>
                    <p>Your data is secure & encrypted</p>
                </div>
                <p className="text-sm text-center mt-4 text-[#241438] font-medium">
                    {formType === "signup" ? (
                        <>
                            Already have an account?{" "}
                            <span
                                onClick={() => setFormType("signin")}
                                className="text-[#1e0ce8] font-bold cursor-pointer hover:text-blue-700 transition-colors"
                            >
                                Sign in
                            </span>
                        </>
                    ) : (
                        <>
                            New to CareerBot?{" "}
                            <span
                                onClick={() => setFormType("signup")}
                                className="text-[#1e0ce8] font-bold cursor-pointer hover:text-blue-700 transition-colors"
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-124 h-145 p-8 rounded-[28px] shadow-2xl bg-white ring-1 ring-gray-200">
                <button
                    onClick={onClose}
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
