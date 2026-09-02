import React, { memo, useCallback } from 'react'
import { FileText, CreditCard, Download } from 'lucide-react'
import { toast } from 'sonner'
import type { UserDetailsResponse, UserActivityLog, Resume, Payment } from '@/api/userManagementApi'
import { formatDate as fmtDate } from '@/app/admin/_utils/formatDate'

interface SubscriptionTabProps {
    user: UserDetailsResponse
}

export const SubscriptionTab = memo(({ user }: SubscriptionTabProps) => {
    const sub = user.subscription
    return (
        <div className="border border-[#00000033]/40 p-4 rounded-lg text-sm">
            <h4 className="font-semibold mb-3">Subscription Details</h4>
            <div className="space-y-1">
                <p className="flex justify-between items-center">
                    <span className="font-medium">Current Plan:</span>
                    <span className="capitalize">{sub?.plan || 'Free'}</span>
                </p>
                <p className="flex justify-between items-center">
                    <span className="font-medium">Billing Cycle:</span>
                    <span className="capitalize">{sub?.billing_cycle || '—'}</span>
                </p>
                {sub?.amount != null && (
                    <p className="flex justify-between items-center">
                        <span className="font-medium">Amount:</span>
                        <span>{sub.currency === 'INR' ? '₹' : '$'}{sub.amount}</span>
                    </p>
                )}
                {sub?.started_at && (
                    <p className="flex justify-between items-center">
                        <span className="font-medium">Started:</span>
                        <span>{fmtDate(sub.started_at)}</span>
                    </p>
                )}
            </div>
        </div>
    )
})

SubscriptionTab.displayName = 'SubscriptionTab'

interface ResumesTabProps {
    resumes: Resume[]
    formatDate: (date: string) => string
}

export const ResumesTab = memo(({ resumes, formatDate }: ResumesTabProps) => {
    const handleDownloadResume = useCallback(async (resume: Resume) => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000'
            const fullUrl = `${backendUrl}${resume.download_url}`
            const response = await fetch(fullUrl)
            if (!response.ok) throw new Error('Download failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${resume.title}.pdf`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch {
            toast.error('Failed to download resume')
        }
    }, [])

    return (
        <div className="border border-[#00000033]/40 bg-gray-50 p-4 rounded-lg text-sm">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText size={16} /> Resumes List
            </h4>
            {resumes && resumes.length > 0 ? (
                <div className="divide-y divide-gray-300">
                    {resumes.map((resume) => (
                        <div key={resume.id} className="py-2 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-black">{resume.title}</p>
                                <p className="text-gray-500 text-xs">
                                    Last updated: {formatDate(resume.updated_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDownloadResume(resume)}
                                className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 hover:underline"
                                title={`Download ${resume.title}`}
                            >
                                <Download size={14} />
                                Download
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-4">No resumes found</p>
            )}
        </div>
    )
})

ResumesTab.displayName = 'ResumesTab'

const POSITIVE_STATUSES = new Set(['captured', 'authorized'])

interface PaymentsTabProps {
    payments: Payment[]
    formatDate: (date: string) => string
}

export const PaymentsTab = memo(({ payments, formatDate }: PaymentsTabProps) => {
    return (
        <div className="border border-[#00000033]/40 bg-gray-50 p-4 rounded-lg text-sm">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard size={16} /> Payment History
            </h4>
            {payments && payments.length > 0 ? (
                <div className="divide-y divide-gray-300">
                    {payments.map((payment, index) => (
                        <div key={index} className="py-2 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-black">
                                    {payment.currency === 'INR' ? '₹' : '$'}{payment.amount ?? '—'}
                                </p>
                                <p className="text-gray-500 text-xs capitalize">
                                    {payment.feature?.replace(/_/g, ' ') || payment.plan || '—'}
                                    {payment.payment_method && ` · ${payment.payment_method}`}
                                </p>
                                {payment.date && (
                                    <p className="text-gray-400 text-xs">{formatDate(payment.date)}</p>
                                )}
                            </div>
                            <span className={`capitalize ${POSITIVE_STATUSES.has(payment.status ?? '') ? 'text-green-600' : 'text-red-600'}`}>
                                {payment.status ?? '—'}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-4">No payment history</p>
            )}
        </div>
    )
})

PaymentsTab.displayName = 'PaymentsTab'

interface ActivityTabProps {
    activities: UserActivityLog[]
}

// Helper function to parse user agent and extract browser and OS
const parseUserAgent = (userAgent: string): { browser: string; os: string } => {
    let browser = 'Unknown Browser'
    let os = 'Unknown OS'

    // Detect OS
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'Mac'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS'

    // Detect Browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome'
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Edg')) browser = 'Edge'

    return { browser, os }
}

// Helper function to format timestamp
const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    const month = date.toLocaleString('en-US', { month: 'short' })
    const day = date.getDate()
    const year = date.getFullYear()
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    return `${month} ${day}, ${year} / ${time}`
}

// Helper function to get friendly event name and description
const getEventDisplay = (event: string, description: string, userAgent: string): { title: string; desc: string } => {
    const { browser, os } = parseUserAgent(userAgent)

    switch (event) {
        case 'user_login':
        case 'login':
            return {
                title: 'Login',
                desc: `Logged in from ${browser} on ${os}`
            }
        case 'user_logout':
        case 'logout':
            return {
                title: 'Logout',
                desc: `Logged out from ${browser} on ${os}`
            }
        case 'api_get':
        case 'api_post':
        case 'api_put':
        case 'api_delete':
        case 'api_call':
            return {
                title: 'API Call',
                desc: description || 'API request made'
            }
        case 'feature_used':
        case 'resume_builder':
            return {
                title: 'Feature ( Resume Builder )',
                desc: description || 'Used resume builder feature'
            }
        case 'user_profile_view':
            return {
                title: 'Profile View',
                desc: 'Viewed user profile'
            }
        default:
            return {
                title: event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                desc: description || 'Activity recorded'
            }
    }
}

export const ActivityTab = memo(({ activities }: ActivityTabProps) => {
    return (
        <div className="bg-white p-6 h-[110px] rounded-lg">
            <h4 className="font-semibold text-lg mb-6">Activity Log</h4>
            {activities && activities.length > 0 ? (
                <div className="space-y-6">
                    {activities.map((item, index) => {
                        const { title, desc } = getEventDisplay(item.event, item.description, item.user_agent)
                        return (
                            <div key={index} className="flex justify-between items-start border-b border-gray-200 pb-6 last:border-0">
                                <div className="flex-1">
                                    <h5 className="font-semibold text-base mb-1">{title}</h5>
                                    <p className="text-gray-600 text-sm">{desc}</p>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="text-sm text-gray-900">{formatTimestamp(item.timestamp)}</p>
                                    <p className="text-sm text-gray-600">IP: {item.ip}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-8">No activity logs</p>
            )}
        </div>
    )
})

ActivityTab.displayName = 'ActivityTab'
