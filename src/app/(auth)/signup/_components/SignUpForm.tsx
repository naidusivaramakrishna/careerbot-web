"use client"
import React from "react"
import { Eye, EyeClosed } from "lucide-react"
import { ErrorState, SignUpForm as ISignUpForm } from "../_types/authTypes"

interface Props {
  formData: ISignUpForm
  errors: ErrorState
  showPassword: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTogglePassword: () => void
  onSubmit: () => void
  loading: boolean
  onOpenLogin: () => void
}

const SignUpForm: React.FC<Props> = ({
  formData,
  errors,
  showPassword,
  onChange,
  onTogglePassword,
  onSubmit,
  loading,
  onOpenLogin,
}) => {
  return (
    <div>
      <div className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={onChange}
            className="w-full border border-neutral-200 px-3 py-3 rounded-lg bg-neutral-100 outline-neutral-500"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Username */}
        <div>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={onChange}
            className="w-full border border-neutral-200 px-3 py-3 rounded-lg bg-neutral-100 outline-neutral-500"
          />
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
        </div>

        {/* Password */}
        <div>
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
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>
      </div>

      {/* Buttons */}
      <button
        onClick={onSubmit}
        disabled={loading}
        className="bg-black text-white cursor-pointer font-semibold text-xl rounded-lg w-full px-6 py-3 my-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Signing up..." : "SIGN UP"}
      </button>

      <button
        onClick={onOpenLogin}
        className="border border-neutral-200 cursor-pointer hover:bg-gray-200 text-xl rounded-lg w-full px-6 py-3 my-4"
      >
        Already a member? <span className="font-semibold">Sign in now</span>
      </button>
    </div>
  )
}

export default SignUpForm
