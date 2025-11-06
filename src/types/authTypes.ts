
export interface SignUpForm {
  email: string
  username: string
  password: string
}

export interface LoginForm {
  email: string
  password: string
}

export interface LoadingState {
  signUp: boolean
  login: boolean
}

export interface ErrorState {
  email: string
  username: string
  password: string
  login: string
}

export interface ValidationError {
  loc: string[]
  msg: string
}

export type FormType = "signup" | "login"
