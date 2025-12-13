"use client"
import React, { useEffect, useState } from "react"
import { Eye, EyeClosed, X, MoveRight, Lock } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { useRouter } from "next/navigation"
import { signUp, signIn } from "@/api/authApi"
import { SignUpForm as ISignUpForm, LoginForm, ErrorState, LoadingState, ValidationError, FormType } from "@/types/authTypes"
import SocialLoginButtons from "./SocialLoginButtons"

const items = ["Resume Builder", "JD Match", "Jobs", "ATS-Scan"]

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

    const [progress, setProgress] = useState(0)
    const [direction, setDirection] = useState(1)
    const [currentItem, setCurrentItem] = useState(0)
    const [cycleCount, setCycleCount] = useState(0); // count forward/backward cycles

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                let next = prev + direction * 5;
                if (next >= 100) {
                    next = 100;
                    setDirection(-1);
                } else if (next <= 0) {
                    next = 0;
                    setDirection(1);
                    setCycleCount((count) => count + 1); // when full back → forward done
                }
                return next;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [direction]);

    // change item after each full forward + backward cycle
    useEffect(() => {
        if (cycleCount > 0) {
            setCurrentItem((i) => (i + 1) % items.length);
        }
    }, [cycleCount]);

    if (!open) return null

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
            localStorage.setItem("user_email", signUpForm.email)

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
            // localStorage.setItem("username", loginForm.email.split('@')[0])
            localStorage.setItem("user_email", loginForm.email)
            toast.success("Login successful")
            setLoginForm({ email: "", password: "" })
            window.location.href = "/dashboard/profile"
            router.push("/dashboard/profile")
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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="grid grid-cols-2 min-w-4xl">
                <div className="bg-cyan-100 flex flex-col justify-between rounded-tl-2xl rounded-bl-2xl p-12">
                    <div className="w-[90%]">
                        <p className="text-3xl">
                            <span className="font-bold leading-16">
                                Simple, Easy to<br /> Create Resumes  <br />
                            </span>{" "}
                            <span>in just a Click</span>
                        </p>
                    </div>
                    <div className="flex flex-col">
                        {/* Progress bar */}
                        <div className="w-20 h-2 bg-gray-200  overflow-hidden mb-6">
                            <div
                                className="h-full bg-black transition-all duration-100 ease-linear"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        {/* Current item */}
                        <div className="text-2xl font-semibold text-gray-800 animate-fadeIn transition-opacity duration-500">
                            {items[currentItem]}
                        </div>
                    </div>
                </div>
                <div className="bg-white  p-8 relative rounded-tr-2xl rounded-br-2xl">
                    <button onClick={onClose} className="absolute top-4 right-4 cursor-pointer rounded-full p-2 hover:bg-black hover:text-white">
                        <X className="h-4 w-4" />
                    </button>

                    <h1 className="text-xl font-semibold mb-8 text-center">
                        {formType === "signup" ? "Welcome to " : "Welcome back to "}
                        <span className="">CareerBot</span>
                    </h1>

                    {/* <SocialLoginButtons variant={formType} /> */}

                    {/* <div className="flex items-center my-4">
                        <div className="flex-grow h-px bg-gray-300"></div>
                        <p className="text-neutral-400 text-center px-4">Or</p>
                        <div className="flex-grow h-px bg-gray-300"></div>
                    </div> */}

                    {/* Form */}
                    <div className="flex flex-col gap-4">
                        {/* Email */}
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formType === "signup" ? signUpForm.email : loginForm.email}
                            onChange={handleChange}
                            className="w-full bg-gray-100 rounded-lg px-3 py-2.5 text-sm outline-none"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}

                        {/* Username only for signup */}
                        {formType === "signup" && (
                            <>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    value={signUpForm.username}
                                    onChange={handleChange}
                                    className="w-full bg-gray-100 rounded-lg px-3 py-2.5 text-sm outline-none"
                                />
                                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                            </>
                        )}

                        {/* Password */}
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                value={formType === "signup" ? signUpForm.password : loginForm.password}
                                onChange={handleChange}
                                className="w-full bg-gray-100 rounded-lg px-3 py-2.5 text-sm outline-none"
                            />
                            <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute inset-y-0 right-3 flex items-center text-gray-600">
                                {showPassword ? <Eye size={20}/> : <EyeClosed size={20} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                        {errors.login && formType === "login" && <p className="text-red-500 text-sm mt-1">{errors.login}</p>}
                    </div>

                    {formType === "login" && <p className="text-xs font-semibold cursor-pointer flex justify-end my-2">Forgot Password?</p>}
                    <div className="flex flex-col my-4">
                        <button
                            onClick={formType === "signup" ? handleSignUp : handleLogin}
                            disabled={formType === "signup" ? loading.signUp : loading.login}
                            className="bg-black text-white cursor-pointer font-semibold rounded-lg w-full px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {formType === "signup" ? (loading.signUp ? "Signing up..." : "SIGN UP") : (loading.login ? "Signing in..." : "SIGN IN")}
                        </button>

                        <div className="flex items-center my-4">
                            <div className="flex-grow h-px bg-gray-300"></div>
                            <p className="text-neutral-400 text-center px-4 text-sm">Or {formType ==="login" ? "login with" :"signup with"}</p>
                            <div className="flex-grow h-px bg-gray-300"></div>
                        </div>
                        <SocialLoginButtons variant={formType} />
                        {formType === "login" &&
                            <div className="flex flex-col items-center mb-4">
                                <div className="flex items-center gap-2 text-xs">
                                    <Lock className="w-4 h-4 " />
                                    <span>Your login is secure & encrypted</span>
                                </div>
                                {/* <div className="flex gap-6 my-4 items-center text-xs">
                                    <span>Privacy Policy</span>
                                    <li>
                                        <span className="list-disc mx-2">Terms of Service</span>
                                    </li>
                                </div> */}
                            </div>
                        }
                        <button
                            onClick={() => setFormType(formType === "signup" ? "login" : "signup")}
                            className=" border border-gray-200  cursor-pointer hover:bg-gray-100 rounded-lg w-full px-6 py-2.5 flex gap-2 justify-center items-center"
                        >
                            {formType === "signup" ? "Already a member? Sign in now" : "New to CareerBot? Sign up free"}
                            {formType === "login" && <MoveRight className="w-4 h-4"/>}
                        </button>
                    </div>


                </div>
            </div>

        </div>
    )
}

export default AuthModal