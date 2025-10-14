"use client"
import React, { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { signUp, signIn } from "@/api/authApi"

import { SignUpForm as ISignUpForm, LoginForm, LoadingState, ErrorState, ValidationError } from "../signup/_types/authTypes"
import LeftBanner from "./_components/LeftBanner"
import SocialLoginButtons from "./_components/SocialLoginButtons"
import SignUpForm from "./_components/SignUpForm"
import SignInModal from "./_components/SignInModal"

const SignUp = () => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [signUpForm, setSignUpForm] = useState<ISignUpForm>({ email: "", username: "", password: "" })
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: "", password: "" })

  const [loading, setLoading] = useState<LoadingState>({ signUp: false, login: false })
  const [errors, setErrors] = useState<ErrorState>({ email: "", username: "", password: "", login: "" })

  // handleChange
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, formType: "signup" | "login") => {
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
      toast.success("Sign up successful")

      const loginData = await signIn({
        email: signUpForm.email,
        password: signUpForm.password,
      })
      localStorage.setItem("access_token", loginData.access_token)
      localStorage.setItem("refresh_token", loginData.refresh_token)
      localStorage.setItem("username", signUpForm.username)

      router.push("/dashboard/profile")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const res = err.response
        if (res?.status === 422 && Array.isArray(res.data.detail)) {
          const newErrors: ErrorState = { email: "", username: "", password: "", login: "" }
          res.data.detail.forEach((e: ValidationError) => {
            const field = e.loc[e.loc.length - 1]
            if (field in newErrors) newErrors[field as keyof ErrorState] = e.msg
          })
          setErrors(newErrors)
        } else {
          const detail = res?.data?.detail || "Something went wrong"
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
      localStorage.setItem("username", loginForm.email)
      toast.success("Login successful")
      setLoginForm({ email: "", password: "" })
      setOpen(false)
      router.push("/dashboard/profile")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.detail || err.message || "Login failed"
        setErrors((prev) => ({ ...prev, login: msg }))
      } else {
        setErrors((prev) => ({ ...prev, login: "Login failed" }))
      }
    } finally {
      setLoading((prev) => ({ ...prev, login: false }))
    }
  }

  return (
    <div className="px-[10%] min-h-screen flex items-center justify-center bg-gray-200">
      <div className="grid grid-cols-2 py-8">
        <LeftBanner />
        <div className="bg-white p-8 rounded-tr-4xl rounded-br-4xl px-20">
          <h1 className="text-3xl pb-8 text-center">
            Welcome to <span className="font-bold">CareerBot</span>
          </h1>
          <SocialLoginButtons variant="signup" />
          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-gray-300"></div>
            <p className="text-neutral-400 text-center px-4">Or sign up with email</p>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>
          <SignUpForm
            formData={signUpForm}
            errors={errors}
            showPassword={showPassword}
            onChange={(e) => handleChange(e, "signup")}
            onTogglePassword={() => setShowPassword((p) => !p)}
            onSubmit={handleSignUp}
            loading={loading.signUp}
            onOpenLogin={() => setOpen(true)}
          />
        </div>
      </div>

      <SignInModal
        open={open}
        formData={loginForm}
        errors={errors}
        showPassword={showPassword}
        loading={loading.login}
        onClose={() => setOpen(false)}
        onChange={(e) => handleChange(e, "login")}
        onTogglePassword={() => setShowPassword((p) => !p)}
        onSubmit={handleLogin}
      />
    </div>
  )
}

export default SignUp
