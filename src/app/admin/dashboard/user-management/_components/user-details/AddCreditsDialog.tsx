import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
    ADD_CREDITS_MAX,
    ADD_CREDITS_MIN,
    ADD_CREDITS_REASON_MAX,
    ADD_CREDITS_REASON_MIN,
    describeAddCreditsError,
    type AddCreditsRequest,
    type AddCreditsErrorInfo,
    type AddCreditsResponse,
} from '@/api/adminCreditsApi'
import { randomUuid } from '@/lib/idempotencyKey'

export interface AddCreditsDialogProps {
    userLabel: string
    currentBalance: number | null
    /** Performs the POST. Receives the Idempotency-Key for this submission. */
    onSubmit: (body: AddCreditsRequest, idempotencyKey: string) => Promise<AddCreditsResponse>
    onSuccess: (response: AddCreditsResponse) => void
    onClose: () => void
}

export function validateAmount(raw: string): string | null {
    const s = raw.trim()
    if (!s) return 'Enter the number of credits to add.'
    if (!/^\d+$/.test(s)) return 'Credits must be a whole number.'
    const n = Number(s)
    if (n < ADD_CREDITS_MIN || n > ADD_CREDITS_MAX) {
        return `Credits must be between ${ADD_CREDITS_MIN} and ${ADD_CREDITS_MAX}.`
    }
    return null
}

export function validateReason(raw: string): string | null {
    const s = raw.trim()
    if (!s) return 'A reason is required.'
    if (s.length < ADD_CREDITS_REASON_MIN) return `Reason must be at least ${ADD_CREDITS_REASON_MIN} characters.`
    if (s.length > ADD_CREDITS_REASON_MAX) return `Reason must be at most ${ADD_CREDITS_REASON_MAX} characters.`
    return null
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

/**
 * Two-step "Add credits" dialog (form -> confirm).
 *
 * Idempotency: one key per submission. The key is minted on the first
 * Confirm click and reused for every retry of that same submission
 * (network error, 409 CREDIT_GRANT_IN_PROGRESS, 500 CREDIT_GRANT_FAILED,
 * unknown 5xx). The backend requires the header (422 without it). Going Back
 * to edit, closing the dialog, or 409 IDEMPOTENCY_KEY_REUSED discards it so
 * the next attempt gets a fresh key.
 */
export const AddCreditsDialog: React.FC<AddCreditsDialogProps> = ({
    userLabel,
    currentBalance,
    onSubmit,
    onSuccess,
    onClose,
}) => {
    const titleId = useId()
    const amountId = useId()
    const reasonId = useId()
    const amountErrId = useId()
    const reasonErrId = useId()

    const dialogRef = useRef<HTMLDivElement | null>(null)
    const amountRef = useRef<HTMLInputElement | null>(null)
    const keyRef = useRef<string | null>(null)
    const inFlightRef = useRef(false)

    const [step, setStep] = useState<'form' | 'confirm'>('form')
    const [amount, setAmount] = useState('')
    const [reason, setReason] = useState('')
    const [showErrors, setShowErrors] = useState(false)
    const [pending, setPending] = useState(false)
    const [submitError, setSubmitError] = useState<AddCreditsErrorInfo | null>(null)

    const amountError = validateAmount(amount)
    const reasonError = validateReason(reason)
    const credits = amountError ? 0 : Number(amount.trim())

    const handleClose = useCallback(() => {
        if (inFlightRef.current) return
        keyRef.current = null
        onClose()
    }, [onClose])

    // Initial focus + restore focus on unmount.
    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null
        amountRef.current?.focus()
        return () => {
            previouslyFocused?.focus?.()
        }
    }, [])

    // Move focus to the first control of the confirmation step.
    useEffect(() => {
        if (step === 'confirm') {
            dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
        } else {
            amountRef.current?.focus()
        }
    }, [step])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            e.stopPropagation()
            handleClose()
            return
        }
        if (e.key !== 'Tab' || !dialogRef.current) return
        const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        if (nodes.length === 0) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
        }
    }

    const handleReview = (e: React.FormEvent) => {
        e.preventDefault()
        setShowErrors(true)
        if (amountError || reasonError) return
        setSubmitError(null)
        setStep('confirm')
    }

    const handleBack = () => {
        if (inFlightRef.current) return
        // Editing makes it a different submission -> fresh key next time.
        keyRef.current = null
        setSubmitError(null)
        setStep('form')
    }

    const handleConfirm = async () => {
        if (inFlightRef.current) return
        inFlightRef.current = true
        if (!keyRef.current) keyRef.current = randomUuid()
        const key = keyRef.current
        setPending(true)
        setSubmitError(null)
        try {
            const res = await onSubmit({ credits, reason: reason.trim() }, key)
            keyRef.current = null
            inFlightRef.current = false
            setPending(false)
            onSuccess(res)
        } catch (err) {
            const info = describeAddCreditsError(err)
            // 'same-key' keeps the key so the retry is the same submission;
            // otherwise the next attempt must be a NEW submission.
            if (info.retry !== 'same-key') keyRef.current = null
            inFlightRef.current = false
            setPending(false)
            setSubmitError(info)
        }
    }

    const amountInvalid = showErrors && !!amountError
    const reasonInvalid = showErrors && !!reasonError

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) handleClose()
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onKeyDown={handleKeyDown}
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
                <h3 id={titleId} className="text-lg font-semibold mb-1">Add credits</h3>
                <p className="text-sm text-gray-600 mb-4">Grant bonus credits to {userLabel}.</p>

                {step === 'form' ? (
                    <form onSubmit={handleReview} noValidate>
                        <label htmlFor={amountId} className="block text-sm font-medium mb-1">
                            Credits to add
                        </label>
                        <input
                            id={amountId}
                            ref={amountRef}
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            aria-invalid={amountInvalid}
                            aria-describedby={amountInvalid ? amountErrId : undefined}
                            placeholder={`${ADD_CREDITS_MIN}-${ADD_CREDITS_MAX}`}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {amountInvalid && (
                            <p id={amountErrId} className="text-xs text-red-600 mt-1">{amountError}</p>
                        )}

                        <label htmlFor={reasonId} className="block text-sm font-medium mt-4 mb-1">
                            Reason
                        </label>
                        <textarea
                            id={reasonId}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={ADD_CREDITS_REASON_MAX + 50}
                            aria-invalid={reasonInvalid}
                            aria-describedby={reasonInvalid ? reasonErrId : undefined}
                            placeholder={`Why are these credits being granted? (${ADD_CREDITS_REASON_MIN}-${ADD_CREDITS_REASON_MAX} characters)`}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-between">
                            {reasonInvalid ? (
                                <p id={reasonErrId} className="text-xs text-red-600 mt-1">{reasonError}</p>
                            ) : <span />}
                            <span className="text-xs text-gray-400 mt-1">{reason.trim().length}/{ADD_CREDITS_REASON_MAX}</span>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Review
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-1" data-testid="add-credits-summary">
                            <p className="flex justify-between">
                                <span className="font-medium">Credits to add:</span>
                                <span>+{credits}</span>
                            </p>
                            <p className="flex justify-between" data-testid="add-credits-balance-change">
                                <span className="font-medium">Balance:</span>
                                <span>
                                    {currentBalance === null
                                        ? `Current unknown -> +${credits}`
                                        : `Current ${currentBalance} -> New ${currentBalance + credits}`}
                                </span>
                            </p>
                            <p className="pt-1 text-gray-600 break-words">
                                <span className="font-medium text-gray-800">Reason:</span> {reason.trim()}
                            </p>
                        </div>

                        {submitError && (
                            <p role="alert" className="text-sm text-red-600 mt-3">{submitError.message}</p>
                        )}

                        <div className="flex gap-2 mt-4">
                            <button
                                type="button"
                                data-autofocus
                                onClick={handleConfirm}
                                disabled={pending}
                                aria-busy={pending}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {pending
                                    ? 'Adding…'
                                    : submitError?.retry === 'same-key'
                                        ? 'Retry'
                                        : submitError?.retry === 'new-key'
                                            ? 'Submit again'
                                            : 'Confirm'}
                            </button>
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={pending}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
