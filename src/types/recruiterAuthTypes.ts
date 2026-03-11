export interface RecruiterSignupData {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
  username: string;
  companyWebsite?: string;
}
 
export interface RecruiterLoginData {
  email: string;
  password: string;
  rememberMe: boolean;
}
 
export interface RecruiterAuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    recruiter: {
      id: string;
      email: string;
      username: string;
      full_name?: string | null;
      fullName?: string;
      companyName?: string;
      status?: string;
      role?: string;
      is_verified?: boolean;
      created_at?: string;
      last_login?: string | null;
    };
  };
}
 
export interface FormErrors {
  [key: string]: string;
}