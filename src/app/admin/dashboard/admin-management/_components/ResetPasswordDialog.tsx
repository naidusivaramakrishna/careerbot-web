"use client";
import React, { memo, useState } from "react";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";

interface ResetPasswordDialogProps {
    passwordForm: { new_password: string; reason: string };
    setPasswordForm: React.Dispatch<React.SetStateAction<{ new_password: string; reason: string }>>;
    actionLoading: boolean;
    onUpdate: () => void;
    onClose: () => void;
    adminName: string;
}

const ResetPasswordDialog = memo(({
    passwordForm,
    setPasswordForm,
    actionLoading,
    onUpdate,
    onClose,
    adminName,
}: ResetPasswordDialogProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const handleClick = () => {
        if (!confirmed) { setConfirmed(true); return; }
        onUpdate();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-2">Reset Admin Password</h3>
                <p className="text-sm text-gray-600 mb-4">Resetting password for {adminName}</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password (minimum 8 characters)
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={passwordForm.new_password}
                                onChange={(e) => { setPasswordForm(f => ({ ...f, new_password: e.target.value })); setConfirmed(false); }}
                                className="w-full border border-gray-300 rounded-lg p-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Enter new password..."
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason (minimum 10 characters)
                        </label>
                        <textarea
                            value={passwordForm.reason}
                            onChange={(e) => { setPasswordForm(f => ({ ...f, reason: e.target.value })); setConfirmed(false); }}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows={3}
                            placeholder="Explain why you're resetting this admin's password..."
                        />
                    </div>
                    {confirmed && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                This will reset the admin&apos;s password immediately. Click <strong>Confirm</strong> to proceed.
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleClick}
                        disabled={actionLoading}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Resetting..." : confirmed ? "Confirm" : "Reset Password"}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
});
ResetPasswordDialog.displayName = "ResetPasswordDialog";
export default ResetPasswordDialog;
