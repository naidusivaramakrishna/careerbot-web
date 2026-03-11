// "use client"
// import React, { useEffect, useState } from "react"
// import { Eye, EyeClosed, X } from "lucide-react"
// import { toast } from "sonner"
// import axios from "axios"
// import { useRouter } from "next/navigation"
// import { signUp, signIn } from "@/api/authApi"
// import { SignUpForm as ISignUpForm, LoginForm, ErrorState, LoadingState, ValidationError, FormType } from "@/types/authTypes"
// import SocialLoginButtons from "./SocialLoginButtons"

// interface Props {
//     open: boolean
//     onClose: () => void
// }

// type SignUpStatus = "form" | "loading" | "email_sent";

// const AuthModal: React.FC<Props> = ({ open, onClose }) => {
//     const router = useRouter()

//     const [formType, setFormType] = useState<FormType>("signup")
//     const [showPassword, setShowPassword] = useState(false)
//     const [signUpStatus, setSignUpStatus] = useState<SignUpStatus>("form")
//     const [signUpEmail, setSignUpEmail] = useState("")
//     const [isEmailVerified, setIsEmailVerified] = useState(false)

//     const [signUpForm, setSignUpForm] = useState<ISignUpForm>({ email: "", username: "", password: "" })
//     const [loginForm, setLoginForm] = useState<LoginForm>({ email: "", password: "" })

//     const [errors, setErrors] = useState<ErrorState>({ email: "", username: "", password: "", login: "" })
//     const [loading, setLoading] = useState<LoadingState>({ signUp: false, login: false })

//     // Check for email verified in sessionStorage (set by home page)
//     useEffect(() => {
//         if (typeof window !== "undefined") {
//             if (sessionStorage.getItem("emailVerified") === "true") {
//                 setIsEmailVerified(true)
//                 setFormType("signin")
//                 // Clear the flag after using it
//                 sessionStorage.removeItem("emailVerified")
//             }
//         }
//     }, [])

//     // Clear errors when switching between signup and signin
//     useEffect(() => {
//         setErrors({ email: "", username: "", password: "", login: "" })
//     }, [formType])

//     // handleChange for both forms
//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = e.target
//         if (formType === "signup") setSignUpForm((p) => ({ ...p, [name]: value }))
//         else setLoginForm((p) => ({ ...p, [name]: value }))
//         setErrors((prev) => ({ ...prev, [name]: "" }))
//     }

//     // ================== SIGN UP ==================
//     const handleSignUp = async () => {
//         setErrors({ email: "", username: "", password: "", login: "" })
//         setLoading((prev) => ({ ...prev, signUp: true }))
//         try {
//             await signUp(signUpForm)

//             // Show email verification message instead of auto-login
//             setSignUpEmail(signUpForm.email)
//             setSignUpStatus("email_sent")
//             toast.success("Account created! Please verify your email to continue.")
//         } catch (err) {
//             handleApiError(err)
//         } finally {
//             setLoading((prev) => ({ ...prev, signUp: false }))
//         }
//     }

//     // ================== LOGIN ==================
//     const handleLogin = async () => {
//         setErrors((prev) => ({ ...prev, login: "" }))
//         setLoading((prev) => ({ ...prev, login: true }))
//         try {
//             // ✅ Tokens are in httpOnly cookies - browser manages them automatically
//             // ❌ No need to manually store tokens
//             await signIn(loginForm)
//             toast.success("Login successful")
//             setLoginForm({ email: "", password: "" })
//             window.location.href = "/profile"
//             onClose()
//         } catch (err) {
//             handleApiError(err, true)
//         } finally {
//             setLoading((prev) => ({ ...prev, login: false }))
//         }
//     }

//     // ================== API Error Handling ==================
//     const handleApiError = (err: any, isLogin = false) => {
//         if (axios.isAxiosError(err)) {
//             const res = err.response
//             const newErrors: ErrorState = { email: "", username: "", password: "", login: "" }

//             // Handle new backend validation error format - show only first error
//             if (res?.data?.error?.details?.validation_errors) {
//                 const validationErrors = res.data.error.details.validation_errors
//                 if (validationErrors.length > 0) {
//                     const firstError = validationErrors[0]
//                     const field = firstError.field
//                     if (field in newErrors) {
//                         let message = firstError.message
//                         // Simplify email error message
//                         if (field === 'email' && message.includes(':')) {
//                             message = message.split(':')[0]
//                         }
//                         // Simplify password error message - extract only the main message
//                         if (field === 'password' && message.includes('Value error,')) {
//                             message = message.replace('Value error,', '').trim()
//                         }
//                         newErrors[field as keyof ErrorState] = message
//                     }
//                 }
//                 setErrors(newErrors)
//             }
//             // Handle old validation error format (422 with detail array) - show only first error
//             else if (!isLogin && res?.status === 422 && Array.isArray(res.data.detail)) {
//                 if (res.data.detail.length > 0) {
//                     const firstError = res.data.detail[0]
//                     const field = firstError.loc[firstError.loc.length - 1]
//                     if (field in newErrors) {
//                         newErrors[field as keyof ErrorState] = firstError.msg
//                     }
//                 }
//                 setErrors(newErrors)
//             }
//             // Handle generic error messages
//             else {
//                 const detail = res?.data?.error?.message || res?.data?.detail || "Something went wrong"
//                 if (typeof detail === "string") {
//                     if (detail.toLowerCase().includes("email")) newErrors.email = detail
//                     else if (detail.toLowerCase().includes("username")) newErrors.username = detail
//                     else if (detail.toLowerCase().includes("password")) newErrors.password = detail
//                     else newErrors.login = detail
//                 }
//                 setErrors(newErrors)
//             }
//         } else {
//             setErrors((prev) => ({ ...prev, login: "Something went wrong" }))
//         }
//     }

//     const renderLoginForm = () => (
//         <div className="flex flex-col gap-4">
//             <input
//                 type="email"
//                 name="email"
//                 placeholder="Email Address"
//                 value={loginForm.email}
//                 onChange={handleChange}
//                 className="w-full bg-violet-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
//             />
//             {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

//             <div className="relative">
//                 <input
//                     type={showPassword ? "text" : "password"}
//                     name="password"
//                     placeholder="Password"
//                     value={loginForm.password}
//                     onChange={handleChange}
//                     className="w-full bg-violet-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
//                 />
//                 <button
//                     type="button"
//                     onClick={() => setShowPassword((p) => !p)}
//                     className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
//                 >
//                     {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
//                 </button>
//             </div>

//             {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
//             {errors.login && formType === "signin" && <p className="text-red-500 text-sm">{errors.login}</p>}

//             <p
//                 className="text-xs font-semibold cursor-pointer flex justify-end my-2 text-blue-500 hover:text-blue-700 transition-colors"
//                 onClick={() => {
//                     router.push('/forgot-password')
//                     onClose()
//                 }}
//             >
//                 Forgot Password?
//             </p>

//             <button
//                 onClick={handleLogin}
//                 disabled={loading.login}
//                 className="bg-[#6863FE] text-white cursor-pointer font-semibold rounded-lg w-full px-6 py-2.5 disabled:opacity-50"
//             >
//                 {loading.login ? "Signing in..." : "Sign in"}
//             </button>
//         </div>
//     )

//     const renderAuthForm = () => {
//         // Show verified email message when redirected from email verification
//         if (isEmailVerified && formType === "signin") {
//             return (
//                 <>
//                     <div className="text-center mb-6">
//                         <div className="mb-4 flex justify-center">
//                             <div className="bg-green-100 rounded-full p-4">
//                                 <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                 </svg>
//                             </div>
//                         </div>
//                         <h1 className="text-xl font-semibold text-green-600 mb-2">Email Verified!</h1>
//                         <p className="text-gray-600">Your email has been successfully verified. Please log in with your credentials to access your account.</p>
//                     </div>
//                     {renderLoginForm()}
//                 </>
//             )
//         }

//         // Show email verification message after signup (only if no errors)
//         if (formType === "signup" && signUpStatus === "email_sent" && !errors.email && !errors.username && !errors.password) {
//             return (
//                 <div className="flex flex-col items-center justify-center">
//                     <div className="mb-6 flex justify-center">
//                         <div className="bg-green-100 rounded-full p-4">
//                             <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                             </svg>
//                         </div>
//                     </div>
//                     <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Check Your Email</h2>
//                     <p className="text-gray-600 text-center mb-4">
//                         We've sent a verification link to <strong>{signUpEmail}</strong>
//                     </p>
//                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 w-full text-sm text-blue-700">
//                         <p className="font-semibold mb-2">📧 Next steps:</p>
//                         <ul className="list-disc list-inside space-y-1 text-xs">
//                             <li>Check your inbox for the verification email</li>
//                             <li>Click the verification link</li>
//                             <li>You'll be logged in automatically</li>
//                         </ul>
//                     </div>
//                     <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 w-full">
//                         <p className="text-xs text-orange-700">
//                             <strong>💡 Tip:</strong> Check your spam folder if you don't see the email. The link expires in 48 hours.
//                         </p>
//                     </div>
//                     <button
//                         onClick={() => {
//                             setSignUpStatus("form")
//                             setSignUpForm({ email: "", username: "", password: "" })
//                         }}
//                         className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors mb-3"
//                     >
//                         Back to Form
//                     </button>
//                     <button
//                         onClick={onClose}
//                         className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2.5 rounded-lg transition-colors"
//                     >
//                         Close
//                     </button>
//                 </div>
//             )
//         }

//         return (
//             <>
//                 <div className="text-center">
//                     <h1 className="text-xl font-semibold">
//                         {formType === "signup" ? "Create Your Account" : "Welcome Back"}
//                     </h1>
//                     <p className="text-[#4A5565] my-4">
//                         {formType === "signup"
//                             ? "Join us today and start your journey"
//                             : "Sign in to continue your career journey"}
//                     </p>
//                 </div>

//                 <SocialLoginButtons variant={formType} />

//                 <div className="flex items-center my-4">
//                     <div className="flex-grow h-px bg-gray-300"></div>
//                     <p className="text-neutral-400 text-center px-4 text-sm">
//                         Or Continue with Email
//                     </p>
//                     <div className="flex-grow h-px bg-gray-300"></div>
//                 </div>

//                 <div className="flex flex-col gap-4">
//                     {formType === "signup" && (
//                         <>
//                             <input
//                                 type="text"
//                                 name="username"
//                                 placeholder="Full Name"
//                                 value={signUpForm.username}
//                                 onChange={handleChange}
//                                 className="w-full bg-violet-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
//                             />
//                             {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
//                         </>
//                     )}

//                     <input
//                         type="email"
//                         name="email"
//                         placeholder="Email Address"
//                         value={formType === "signup" ? signUpForm.email : loginForm.email}
//                         onChange={handleChange}
//                         className="w-full bg-violet-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
//                     />
//                     {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

//                     <div className="relative">
//                         <input
//                             type={showPassword ? "text" : "password"}
//                             name="password"
//                             placeholder="Password"
//                             value={formType === "signup" ? signUpForm.password : loginForm.password}
//                             onChange={handleChange}
//                             className="w-full bg-violet-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
//                         />
//                         <button
//                             type="button"
//                             onClick={() => setShowPassword((p) => !p)}
//                             className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
//                         >
//                             {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
//                         </button>
//                     </div>

//                     {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
//                     {errors.login && formType === "signin" && <p className="text-red-500 text-sm">{errors.login}</p>}
//                 </div>

//                 {formType === "signin" && (
//                     <p
//                         className="text-xs font-semibold cursor-pointer flex justify-end my-2 text-blue-500 hover:text-blue-700 transition-colors"
//                         onClick={() => {
//                             router.push('/forgot-password')
//                             onClose()
//                         }}
//                     >
//                         Forgot Password?
//                     </p>
//                 )}

//                 <button
//                     onClick={formType === "signup" ? handleSignUp : handleLogin}
//                     disabled={formType === "signup" ? loading.signUp : loading.login}
//                     className="bg-[#6863FE] text-white cursor-pointer font-semibold rounded-lg w-full px-6 py-2.5 my-4 disabled:opacity-50"
//                 >
//                     {formType === "signup"
//                         ? loading.signUp
//                             ? "Signing up..."
//                             : "Create Account"
//                         : loading.login
//                             ? "Signing in..."
//                             : "Sign in"}
//                 </button>

//                 <div className="text-xs text-center  text-[#6A7282] my-4">
//                     <p>
//                         By continuing, you agree to our <b className="text-black">Terms </b> and <b className="text-black">Privacy Policy</b>
//                     </p>
//                     <p className="mt-2">Your data is secure & encrypted</p>
//                 </div>
//                 <p className="text-sm text-center mt-3 text-gray-600 font-semibold">
//                     {formType === "signup" ? (
//                         <>
//                             Already have an account?{" "}
//                             <span
//                                 onClick={() => setFormType("signin")}
//                                 className="text-[#2200FF] font-semibold cursor-pointer"
//                             >
//                                 Sign in
//                             </span>
//                         </>
//                     ) : (
//                         <>
//                             New to CareerBot?{" "}
//                             <span
//                                 onClick={() => setFormType("signup")}
//                                 className="text-[#2200FF] font-semibold cursor-pointer"
//                             >
//                                 Sign up
//                             </span>
//                         </>
//                     )}
//                 </p>
//             </>
//         )
//     }

//     if (!open) return null

//     return (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
//             <div className="relative w-[480px] h-[600px] bg-white p-10 rounded-4xl shadow-xl">
//                 <button
//                     onClick={onClose}
//                     className="absolute top-4 right-4 p-2 cursor-pointer hover:bg-black hover:text-white rounded-full"
//                 >
//                     <X className="h-4 w-4" />
//                 </button>

//                 {/* render form for both signup and login */}
//                 {renderAuthForm()}
//             </div>
//         </div>
//     )
// }

// export default AuthModal


"use client"
import React, { useEffect, useState } from "react"
import { Eye, EyeClosed, X } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { useRouter } from "next/navigation"
import { signUp, signIn } from "@/api/authApi"
import { SignUpForm as ISignUpForm, LoginForm, ErrorState, LoadingState, ValidationError, FormType } from "@/types/authTypes"
import SocialLoginButtons from "./SocialLoginButtons"

interface Props {
    open: boolean
    onClose: () => void
    initialFormType?: FormType
}

type SignUpStatus = "form" | "loading" | "email_sent";

const AuthModal: React.FC<Props> = ({ open, onClose, initialFormType = "signup" }) => {
    const router = useRouter()

    const [formType, setFormType] = useState<FormType>(initialFormType)
    const [showPassword, setShowPassword] = useState(false)
    const [signUpStatus, setSignUpStatus] = useState<SignUpStatus>("form")
    const [signUpEmail, setSignUpEmail] = useState("")
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
        if (typeof window !== "undefined") {
            if (sessionStorage.getItem("emailVerified") === "true") {
                setIsEmailVerified(true)
                setFormType("signin")
                // Clear the flag after using it
                sessionStorage.removeItem("emailVerified")
            }
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
            await signUp(signUpForm)

            // Show email verification message instead of auto-login
            setSignUpEmail(signUpForm.email)
            setSignUpStatus("email_sent")
            toast.success("Account created! Please verify your email to continue.")
        } catch (err) {
            handleApiError(err)
        } finally {
            setLoading((prev) => ({ ...prev, signUp: false }))
        }
    }

    // ================== LOGIN ==================
    const handleLogin = async () => {
        setErrors((prev) => ({ ...prev, login: "" }))
        setLoading((prev) => ({ ...prev, login: true }))
        try {
            // ✅ Tokens are in httpOnly cookies - browser manages them automatically
            // ❌ No need to manually store tokens
            await signIn(loginForm)
            toast.success("Login successful")
            setLoginForm({ email: "", password: "" })
            window.location.href = "/dashboard"
            onClose()
        } catch (err) {
            handleApiError(err, true)
        } finally {
            setLoading((prev) => ({ ...prev, login: false }))
        }
    }

    // ================== API Error Handling ==================
    const handleApiError = (err: any, isLogin = false) => {
        if (axios.isAxiosError(err)) {
            const res = err.response
            const newErrors: ErrorState = { email: "", username: "", password: "", login: "" }

            // Handle new backend validation error format - show only first error
            if (res?.data?.error?.details?.validation_errors) {
                const validationErrors = res.data.error.details.validation_errors
                if (validationErrors.length > 0) {
                    const firstError = validationErrors[0]
                    const field = firstError.field
                    if (field in newErrors) {
                        let message = firstError.message
                        // Simplify email error message
                        if (field === 'email' && message.includes(':')) {
                            message = message.split(':')[0]
                        }
                        // Simplify password error message - extract only the main message
                        if (field === 'password' && message.includes('Value error,')) {
                            message = message.replace('Value error,', '').trim()
                        }
                        newErrors[field as keyof ErrorState] = message
                    }
                }
                setErrors(newErrors)
            }
            // Handle old validation error format (422 with detail array) - show only first error
            else if (!isLogin && res?.status === 422 && Array.isArray(res.data.detail)) {
                if (res.data.detail.length > 0) {
                    const firstError = res.data.detail[0]
                    const field = firstError.loc[firstError.loc.length - 1]
                    if (field in newErrors) {
                        newErrors[field as keyof ErrorState] = firstError.msg
                    }
                }
                setErrors(newErrors)
            }
            // Handle generic error messages
            else {
                const detail = res?.data?.error?.message || res?.data?.detail || "Something went wrong"
                if (typeof detail === "string") {
                    if (detail.toLowerCase().includes("email")) newErrors.email = detail
                    else if (detail.toLowerCase().includes("username")) newErrors.username = detail
                    else if (detail.toLowerCase().includes("password")) newErrors.password = detail
                    else newErrors.login = detail
                }
                setErrors(newErrors)
            }
        } else {
            setErrors((prev) => ({ ...prev, login: "Something went wrong" }))
        }
    }

    const renderLoginForm = () => (
        <div className="flex flex-col gap-4">
            <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={loginForm.email}
                onChange={handleChange}
                className="w-full bg-violet-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={handleChange}
                    className="w-full bg-violet-50 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                </button>
            </div>

            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            {errors.login && formType === "signin" && <p className="text-red-500 text-sm">{errors.login}</p>}

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
                onClick={handleLogin}
                disabled={loading.login}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-purple-200"
            >
                {loading.login ? "Signing in..." : "Sign in"}
            </button>
        </div>
    )

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

        // Show email verification message after signup (only if no errors)
        if (formType === "signup" && signUpStatus === "email_sent" && !errors.email && !errors.username && !errors.password) {
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
                        We've sent a verification link to <strong>{signUpEmail}</strong>
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 w-full text-sm text-blue-700">
                        <p className="font-semibold mb-2">📧 Next steps:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Check your inbox for the verification email</li>
                            <li>Click the verification link</li>
                            <li>You'll be logged in automatically</li>
                        </ul>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 w-full">
                        <p className="text-xs text-orange-700">
                            <strong>💡 Tip:</strong> Check your spam folder if you don't see the email. The link expires in 48 hours.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setFormType("signin")
                            setSignUpStatus("form")
                            setSignUpForm({ email: "", username: "", password: "" })
                        }}
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

                <SocialLoginButtons variant={formType} />

                <div className="flex items-center my-5">
                    <div className="grow h-px bg-[#e6d6f4]"></div>
                    <p className="text-[#836B94] text-center px-4 text-xs font-semibold">
                        Or Continue with Email
                    </p>
                    <div className="grow h-px bg-[#e6d6f4]"></div>
                </div>

                <div className="flex flex-col gap-4">
                    {formType === "signup" && (
                        <>
                            <input
                                type="text"
                                name="username"
                                placeholder="Full Name"
                                value={signUpForm.username}
                                onChange={handleChange}
                                className="w-full bg-[#f8f0fd] rounded-xl px-4 py-3 border border-purple-200 text-sm text-gray-800 placeholder-[#635B6B] outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                                style={{ boxShadow: '0 2px 4px 0 rgba(168, 85, 247, 0.35)' }}
                            />
                            {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
                        </>
                    )}

                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formType === "signup" ? signUpForm.email : loginForm.email}
                        onChange={handleChange}
                        className="w-full bg-[#f8f0fd] rounded-xl px-4 py-3 border border-purple-200 text-sm text-gray-800 placeholder-[#635B6B] outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                        style={{ boxShadow: '0 2px 4px 0 rgba(168, 85, 247, 0.35)' }}
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={formType === "signup" ? signUpForm.password : loginForm.password}
                            onChange={handleChange}
                            className="w-full bg-[#f8f0fd] rounded-xl px-4 py-3 border border-purple-200 text-sm text-gray-800 placeholder-[#635B6B] outline-none  focus:ring-2 focus:ring-purple-400 transition-all"
                            style={{ boxShadow: '0 2px 4px 0 rgba(168, 85, 247, 0.35)' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
                        </button>
                    </div>

                    {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                    {errors.login && formType === "signin" && <p className="text-red-500 text-sm">{errors.login}</p>}
                </div>

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
                    className="w-full mt-5 py-3 rounded-xl font-semibold text-white text-sm bg-linear-to-r from-[#F977E8] via-[#9255Ef] to-[#7794FF]  transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-purple-400"
                >
                    {formType === "signup"
                        ? loading.signUp
                            ? "Signing up..."
                            : "Create Account"
                        : loading.login
                            ? "Signing in..."
                            : "Sign in"}
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
            <div className="relative w-full max-w-120 h-145 p-8 rounded-[28px] shadow-2xl  bg-linear-to-br from-[#fff4fc] to-[#efe0ff]">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-1.5 cursor-pointer hover:bg-gray-200 rounded-full transition-colors"
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
