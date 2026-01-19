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
}

const AuthModal: React.FC<Props> = ({ open, onClose }) => {
    const router = useRouter()

    const [formType, setFormType] = useState<FormType>("signup")
    const [showPassword, setShowPassword] = useState(false)

    const [signUpForm, setSignUpForm] = useState<ISignUpForm>({ email: "", username: "", password: "" })
    const [loginForm, setLoginForm] = useState<LoginForm>({ email: "", password: "" })

    const [errors, setErrors] = useState<ErrorState>({ email: "", username: "", password: "", login: "" })
    const [loading, setLoading] = useState<LoadingState>({ signUp: false, login: false })

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
            toast.success("Sign up successful")

            // auto login after signup
            const loginData = await signIn({ email: signUpForm.email, password: signUpForm.password })
            localStorage.setItem("access_token", loginData.access_token)
            localStorage.setItem("refresh_token", loginData.refresh_token)
            localStorage.setItem("username", signUpForm.username)

            router.push("/dashboard/profile")
            onClose()
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
            const data = await signIn(loginForm)
            localStorage.setItem("access_token", data.access_token)
            localStorage.setItem("refresh_token", data.refresh_token)
            localStorage.setItem("username", loginForm.email.split('@')[0])
            toast.success("Login successful")
            setLoginForm({ email: "", password: "" })
            window.location.href = "/dashboard/profile"
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
            if (!isLogin && res?.status === 422 && Array.isArray(res.data.detail)) {
                const newErrors: ErrorState = { email: "", username: "", password: "", login: "" }
                res.data.detail.forEach((e: ValidationError) => {
                    const field = e.loc[e.loc.length - 1]
                    if (field in newErrors) newErrors[field as keyof ErrorState] = e.msg
                })
                setErrors(newErrors)
            } else {
                const detail = res?.data?.error?.message || res?.data?.detail || "Something went wrong"
                const newErrors: ErrorState = { email: "", username: "", password: "", login: "" }
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

    const renderAuthForm = () => (
        <>
            <div className="text-center">
                <h1 className="text-xl font-semibold">
                    {formType === "signup" ? "Create Your Account" : "Welcome Back"}
                </h1>
                <p className="text-[#4A5565] my-4">
                    {formType === "signup"
                        ? "Join us today and start your journey"
                        : "Sign in to continue your career journey"}
                </p>
            </div>

            <SocialLoginButtons variant={formType} />

            <div className="flex items-center my-4">
                <div className="flex-grow h-px bg-gray-300"></div>
                <p className="text-neutral-400 text-center px-4 text-sm">
                    Or Continue with Email
                </p>
                <div className="flex-grow h-px bg-gray-300"></div>
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
                            className="w-full bg-gray-100 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 outline-none"
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
                    className="w-full bg-gray-100 rounded-lg px-3 py-2.5 text-sm  placeholder-gray-600 outline-none"
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={formType === "signup" ? signUpForm.password : loginForm.password}
                        onChange={handleChange}
                        className="w-full bg-gray-100 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600  outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-600"
                    >
                        {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
                    </button>
                </div>

                {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                {errors.login && formType === "login" && <p className="text-red-500 text-sm">{errors.login}</p>}
            </div>

            {formType === "login" && (
                <p className="text-xs font-semibold cursor-pointer flex justify-end my-2">
                    Forgot Password?
                </p>
            )}

            <button
                onClick={formType === "signup" ? handleSignUp : handleLogin}
                disabled={formType === "signup" ? loading.signUp : loading.login}
                className="bg-[#6863FE] text-white cursor-pointer font-semibold rounded-lg w-full px-6 py-2.5 my-4 disabled:opacity-50"
            >
                {formType === "signup"
                    ? loading.signUp
                        ? "Signing up..."
                        : "Create Account"
                    : loading.login
                        ? "Signing in..."
                        : "Sign in"}
            </button>

            <div className="text-xs text-center  text-[#6A7282] my-4">
                <p>
                    By continuing, you agree to our <b className="text-black">Terms </b> and <b className="text-black">Privacy Policy</b>
                </p>
                <p className="mt-2">Your data is secure & encrypted</p>
            </div>
            <p className="text-sm text-center mt-3 text-gray-600 font-semibold">
                {formType === "signup" ? (
                    <>
                        Already have an account?{" "}
                        <span
                            onClick={() => setFormType("login")}
                            className="text-[#2200FF] font-semibold cursor-pointer"
                        >
                            Sign in
                        </span>
                    </>
                ) : (
                    <>
                        New to CareerBot?{" "}
                        <span
                            onClick={() => setFormType("signup")}
                            className="text-[#2200FF] font-semibold cursor-pointer"
                        >
                            Sign up
                        </span>
                    </>
                )}
            </p>
        </>
    )

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
            <div className="relative w-[480px] h-[580px] bg-white p-10 rounded-4xl shadow-xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 cursor-pointer hover:bg-black hover:text-white rounded-full"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* render form for both signup and login */}
                {renderAuthForm()}
            </div>
        </div>
    )
}

export default AuthModal