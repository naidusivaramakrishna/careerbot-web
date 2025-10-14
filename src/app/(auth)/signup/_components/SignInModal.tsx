"use client"
import React from "react"
import { Eye, EyeClosed, Lock, MoveRight, X } from "lucide-react"
import SocialLoginButtons from "./SocialLoginButtons"
import { ErrorState, LoginForm } from "../_types/authTypes"

interface Props {
  open: boolean
  formData: LoginForm
  errors: ErrorState
  showPassword: boolean
  loading: boolean
  onClose: () => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTogglePassword: () => void
  onSubmit: () => void
}

const SignInModal: React.FC<Props> = ({
  open,
  formData,
  errors,
  showPassword,
  loading,
  onClose,
  onChange,
  onTogglePassword,
  onSubmit,
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[600px] rounded-2xl p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer rounded-full p-2 hover:bg-black hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h1 className="text-2xl mb-6 text-center">
          Welcome back to <span className="font-bold">CareerBot</span>
        </h1>

        <SocialLoginButtons variant="signin" />

        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-300"></div>
          <p className="text-neutral-400 text-center px-4">Or sign in with email</p>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        {/* Login Form */}
        <div className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={onChange}
            className="w-full border border-neutral-200 px-3 py-3 rounded-lg bg-neutral-100 outline-neutral-500"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={onChange}
              className="w-full border border-neutral-200 px-3 py-3 rounded-lg bg-neutral-100 outline-neutral-500"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute inset-y-0 right-3 flex items-center text-gray-600"
            >
              {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
            </button>
          </div>
          {errors.login && <p className="text-red-500 text-sm mt-1">{errors.login}</p>}
        </div>

        <div className="flex items-center justify-between my-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" />
            <div>
              <p className="font-semibold">Remember me</p>
              <p className="">Stay Signed in for 30 days</p>
            </div>
          </div>
          <p className="text-sm font-semibold cursor-pointer">Forgot Password?</p>
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          className="bg-black text-white cursor-pointer font-semibold text-lg rounded-lg w-full px-6 py-3 my-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "SIGN IN"}
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 " />
            <span>Your login is secure & encrypted</span>
          </div>
          <div className="flex gap-6 my-4 items-center">
            <span>Privacy Policy</span>
            <li>
              <span className="list-disc mx-2">Terms of Service</span>
            </li>
          </div>
          <hr className="w-full my-4 text-neutral-400" />
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 border border-neutral-200 cursor-pointer hover:bg-gray-200 font-semibold rounded-lg w-full px-6 py-3 my-4"
          >
            New to CareerBot? Sign up free
            <MoveRight />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignInModal
