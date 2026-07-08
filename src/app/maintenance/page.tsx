import React from 'react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 flex flex-col items-center justify-center p-6">

            <div className="w-full max-w-lg">
                {/* Main card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-100 p-10 text-center mb-6">

                    <p className="font-bold text-sm uppercase tracking-widest mb-7">CareerBOT</p>

                    {/* Icon */}
                    <div className="flex justify-center mb-7">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-blue-50 to-indigo-100 border border-blue-100 flex items-center justify-center">
                                <svg className="w-9 h-9 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                                </svg>
                            </div>
                            {/* Subtle ring animation */}
                            <div className="absolute -inset-2 rounded-3xl border-2 border-blue-200 animate-ping opacity-20" />
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-600 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Scheduled Maintenance
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                        We&apos;ll be back shortly
                    </h1>

                    <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                        We&apos;re performing scheduled maintenance to bring you a better experience.
                        We apologize for the inconvenience and appreciate your patience.
                    </p>

                </div>

                {/* Support link */}
                <p className="text-center text-gray-400 text-sm">
                    Need urgent help?{' '}
                    <a href="mailto:support@careerbot.ai" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                        Contact support
                    </a>
                </p>
            </div>

            {/* Footer */}
            <p className="absolute bottom-5 text-gray-300 text-xs tracking-widest uppercase">
                © 2025 CareerBOT. All rights reserved.
            </p>
        </div>
    );
}
