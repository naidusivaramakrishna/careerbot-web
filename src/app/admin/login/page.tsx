// "use client";
// import React, { useState } from "react";
// import { Eye, EyeClosed, X } from 'lucide-react';
// import { useRouter } from 'next/navigation';
// import { adminLogin, adminSignUp } from "@/api/adminAuthApi";

// const AdminLoginPage = () => {
//     const [isSignUp, setIsSignUp] = useState(true);
//     const [open, setOpen] = useState(false);
//     const [showPassword, setShowPassword] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [totpRequired, setTotpRequired] = useState(false);

//     const router = useRouter();

//     // Form state
//     const [formData, setFormData] = useState({
//         fullName: '',
//         email: '',
//         password: '',
//         totpCode: ''
//     });

//     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({
//             ...prev,
//             [name]: value
//         }));
//         setError(''); // Clear error on input change
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setError('');

//         try {
//             if (isSignUp) {
//                 // Sign up
//                 await adminSignUp({
//                     email: formData.email,
//                     full_name: formData.fullName,
//                     password: formData.password
//                 });

//                 // After successful signup, switch to sign in
//                 setIsSignUp(false);
//                 setFormData(prev => ({ ...prev, fullName: '', totpCode: '' }));
//                 alert('Account created successfully! Please sign in.');
//             } else {
//                 // Sign in
//                 const response = await adminLogin({
//                     email: formData.email,
//                     password: formData.password,
//                     totp_code: totpRequired ? formData.totpCode : undefined
//                 });

//                 // Redirect to admin dashboard on successful login
//                 router.push('/admin/dashboard');
//             }
//         } catch (err: any) {
//             console.error('Auth error:', err);

//             // Check if 2FA is required
//             if (err.response?.status === 403 && err.response?.data?.detail?.includes('2FA')) {
//                 setTotpRequired(true);
//                 setError('Please enter your 2FA code');
//             } else {
//                 setError(err.response?.data?.detail || 'An error occurred. Please try again.');
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen flex items-center justify-center bg-black/20 px-4">
//             <div className="relative h-auto w-full max-w-md rounded-4xl bg-white backdrop-blur-xl p-8 shadow-2xl border border-white/10">
//                 {/* Toggle Buttons */}
//                 <div className='flex items-center justify-between mb-6'>
//                     <div className="flex w-[200px] rounded-full bg-gray-300 p-1">
//                         <button
//                             onClick={() => {
//                                 setIsSignUp(true);
//                                 setTotpRequired(false);
//                                 setError('');
//                                 setFormData({ fullName: '', email: '', password: '', totpCode: '' });
//                             }}
//                             className={`flex-1 cursor-pointer py-2 rounded-full text-sm font-medium transition-all ${isSignUp ? "bg-black text-white" : "text-gray-600"
//                                 }`}
//                         >
//                             Sign up
//                         </button>
//                         <button
//                             onClick={() => {
//                                 setIsSignUp(false);
//                                 setTotpRequired(false);
//                                 setError('');
//                                 setFormData({ fullName: '', email: '', password: '', totpCode: '' });
//                             }}
//                             className={`flex-1 cursor-pointer py-2 rounded-full text-sm font-medium transition-all ${!isSignUp ? "bg-black text-white" : "text-gray-600"
//                                 }`}
//                         >
//                             Sign in
//                         </button>
//                     </div>
//                     <button onClick={() => setOpen(false)} className="cursor-pointer hover:bg-black hover:text-white rounded-full p-1.5">
//                         <X className="h-4 w-4" />
//                     </button>
//                 </div>

//                 <h2 className="text-xl font-semibold mb-6 text-center">
//                     {isSignUp ? "Create an account" : "Welcome back"}
//                 </h2>

//                 {error && (
//                     <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
//                         {error}
//                     </div>
//                 )}

//                 <form onSubmit={handleSubmit} className="space-y-4">
//                     {isSignUp && (
//                         <div>
//                             <input
//                                 type="text"
//                                 name="fullName"
//                                 value={formData.fullName}
//                                 onChange={handleInputChange}
//                                 placeholder="Full Name"
//                                 required
//                                 className="w-full rounded-lg bg-gray-100 outline-none px-4 py-3 placeholder-gray-500 transition"
//                             />
//                         </div>
//                     )}
//                     <div>
//                         <input
//                             type="email"
//                             name="email"
//                             value={formData.email}
//                             onChange={handleInputChange}
//                             placeholder="Email address"
//                             required
//                             className="w-full rounded-lg bg-gray-100 outline-none px-4 py-3 placeholder-gray-500 transition"
//                         />
//                     </div>
//                     <div className="relative">
//                         <input
//                             type={showPassword ? "text" : "password"}
//                             name="password"
//                             value={formData.password}
//                             onChange={handleInputChange}
//                             placeholder="Password"
//                             required
//                             className="w-full rounded-lg bg-gray-100 outline-none px-4 py-3 placeholder-gray-500 transition"
//                         />
//                         <button
//                             type="button"
//                             onClick={() => setShowPassword((p) => !p)}
//                             className="absolute inset-y-0 right-3 flex items-center text-gray-600"
//                         >
//                             {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
//                         </button>
//                     </div>

//                     {/* 2FA Code Input - shown only when required */}
//                     {totpRequired && !isSignUp && (
//                         <div>
//                             <input
//                                 type="text"
//                                 name="totpCode"
//                                 value={formData.totpCode}
//                                 onChange={handleInputChange}
//                                 placeholder="2FA Code"
//                                 required
//                                 maxLength={6}
//                                 className="w-full rounded-lg bg-gray-100 outline-none px-4 py-3 placeholder-gray-500 transition"
//                             />
//                         </div>
//                     )}

//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="w-full mt-2 cursor-pointer bg-black text-white py-3 rounded-lg font-semibold hover:bg-black/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                         {loading ? 'Please wait...' : (isSignUp ? "Sign up" : "Sign in")}
//                     </button>
//                 </form>

//                 <p className="text-xs text-center mt-6">
//                     By creating an account, you agree to our{" "}
//                     <span className="underline cursor-pointer">Terms & Service</span>.
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default AdminLoginPage;


"use client";
import React, { useState } from "react";
import { Eye, EyeClosed, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminLogin, adminSignUp } from "@/api/adminAuthApi";
import { toast } from "sonner";

const AdminLoginPage = () => {
    const [isSignUp, setIsSignUp] = useState(false); // Start with Sign In
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [totpRequired, setTotpRequired] = useState(false);

    const router = useRouter();

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        totpCode: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear error on input change
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isSignUp) {
                // Step 1: Sign up
                await adminSignUp({
                    email: formData.email,
                    full_name: formData.fullName,
                    password: formData.password
                });
                toast.success("Account created successfully! Logging you in...");
                // Step 2: Auto-login after signup
                const response = await adminLogin({
                    email: formData.email,
                    password: formData.password,
                });

                // Step 3: Redirect to admin dashboard
                router.push('/admin/dashboard');
            } else {
                // Sign in
                console.log('🔐 Attempting login with:', { email: formData.email });

                const response = await adminLogin({
                    email: formData.email,
                    password: formData.password,
                    totp_code: totpRequired ? formData.totpCode : undefined
                });
                console.log('✅ Login response:', response);
                toast.success("Login successful")
                // Redirect to admin dashboard on successful login
                router.push('/admin/dashboard');
            }
        } catch (err: any) {
            console.error('❌ Auth error:', err);

            // Better error handling
            let errorMessage = 'An error occurred. Please try again.';

            if (err.response) {
                // Server responded with error
                const status = err.response.status;
                const data = err.response.data;

                console.error('Server error:', { status, data });

                if (status === 403 && data?.detail?.includes('2FA')) {
                    setTotpRequired(true);
                    errorMessage = 'Please enter your 2FA code';
                } else if (status === 401) {
                    errorMessage = 'Invalid email or password';
                } else if (status === 422) {
                    errorMessage = data?.detail || 'Validation error. Please check your input.';
                } else if (status === 429) {
                    errorMessage = 'Too many attempts. Please try again later.';
                } else {
                    errorMessage = data?.detail || `Server error (${status})`;
                }
            } else if (err.request) {
                // Request made but no response
                console.error('No response from server');
                errorMessage = 'Cannot connect to server. Please check if backend is running.';
            } else {
                // Error setting up request
                console.error('Request setup error:', err.message);
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-black/20 px-4">
                <div className="relative h-auto w-full max-w-md rounded-4xl bg-white backdrop-blur-xl p-8 shadow-2xl border border-white/10">
                    {/* Toggle Buttons */}
                    <div className='flex items-center justify-between mb-6'>
                        <div className="flex w-[200px] rounded-full bg-gray-300 p-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(true);
                                    setTotpRequired(false);
                                    setError('');
                                    setFormData({ fullName: '', email: '', password: '', totpCode: '' });
                                }}
                                className={`flex-1 cursor-pointer py-2 rounded-full text-sm font-medium transition-all ${isSignUp ? "bg-black text-white" : "text-gray-600"
                                    }`}
                            >
                                Sign up
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(false);
                                    setTotpRequired(false);
                                    setError('');
                                    setFormData({ fullName: '', email: '', password: '', totpCode: '' });
                                }}
                                className={`flex-1 cursor-pointer py-2 rounded-full text-sm font-medium transition-all ${!isSignUp ? "bg-black text-white" : "text-gray-600"
                                    }`}
                            >
                                Sign in
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="cursor-pointer hover:bg-black hover:text-white rounded-full p-1.5"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <h2 className="text-xl font-semibold mb-6 text-center">
                        {isSignUp ? "Create an account" : "Welcome back"}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Full Name"
                                    required
                                    className="w-full rounded-lg bg-gray-100 outline-none px-4 py-3 placeholder-gray-500 transition"
                                />
                            </div>
                        )}
                        <div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Email address"
                                required
                                className="w-full rounded-lg bg-gray-100 outline-none px-4 py-3 placeholder-gray-500 transition"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Password"
                                required
                                className="w-full rounded-lg bg-gray-100 outline-none px-4 py-3 placeholder-gray-500 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-600"
                            >
                                {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
                            </button>
                        </div>

                        {/* 2FA Code Input - shown only when required */}
                        {totpRequired && !isSignUp && (
                            <div>
                                <input
                                    type="text"
                                    name="totpCode"
                                    value={formData.totpCode}
                                    onChange={handleInputChange}
                                    placeholder="2FA Code"
                                    required
                                    maxLength={6}
                                    className="w-full rounded-lg bg-gray-100 outline-none px-4 py-3 placeholder-gray-500 transition"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 cursor-pointer bg-black text-white py-3 rounded-lg font-semibold hover:bg-black/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Please wait...' : (isSignUp ? "Sign up" : "Sign in")}
                        </button>
                    </form>

                    <p className="text-xs text-center mt-6">
                        By creating an account, you agree to our{" "}
                        <span className="underline cursor-pointer">Terms & Service</span>.
                    </p>
                </div>
            </div>
        </>
    );
};

export default AdminLoginPage;