"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X, Shield, Calendar, Activity, Edit2, Ban, Key, Lock } from "lucide-react";
import { formatRoleName } from "@/app/admin/_utils/permissions";
import RoleDialog from "./RoleDialog";
import StatusDialog from "./StatusDialog";
import ResetPasswordDialog from "./ResetPasswordDialog";
import {
    getAdminDetails,
    updateAdminRole,
    updateAdminStatus,
    resetAdminPassword,
    AdminDetailsResponse
} from "@/api/adminManagementApi";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useAdminAccess } from "@/app/admin/_hooks/useAdminAccess";
import { extractApiError } from "@/app/admin/_utils/apiError";
import { formatDateTime } from "@/app/admin/_utils/formatDate";
import { SlidePanel } from "@/app/admin/_components/SlidePanel";

interface Props {
    adminId: string;
    onClose: () => void;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
    super_admin: 'text-purple-600 bg-purple-100',
    admin: 'text-blue-600 bg-blue-100',
    // Matches AdminTable's teal. Same role, same colour, both screens.
    platform_admin: 'text-teal-600 bg-teal-100',
    moderator: 'text-green-600 bg-green-100',
    support: 'text-gray-600 bg-gray-100',
};

function getRoleBadgeColor(role: string): string {
    return ROLE_BADGE_COLORS[role.toLowerCase()] ?? 'text-gray-600 bg-gray-100';
}

const AdminDetailsModal: React.FC<Props> = ({ adminId, onClose }) => {
    const { userRole, loading: roleLoading } = useAdminAccess('admin-management');
    // Intentional access-control tightening: Change Role, Change Status, and Reset Password
    // are restricted to SUPER_ADMIN only. This is UI gating — the backend enforces the same
    // constraint independently via require_role(SUPER_ADMIN) on all three endpoints
    // (PATCH /{admin_id}/role, PATCH /{admin_id}/status, POST /{admin_id}/reset-password),
    // returning 403 for any caller that is not SUPER_ADMIN. Client-side checks are not security.
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    const [admin, setAdmin] = useState<AdminDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Dialogs state
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);

    // Form state
    const [roleForm, setRoleForm] = useState({ role: "", reason: "" });
    const [statusForm, setStatusForm] = useState({ status: "", reason: "" });
    const [passwordForm, setPasswordForm] = useState({ new_password: "", reason: "" });

    const fetchAdminDetails = useCallback(async () => {
        try {
            setLoading(true);
            const details = await getAdminDetails(adminId);
            setAdmin(details);
            setRoleForm({ role: details.role.toUpperCase(), reason: "" });
            setStatusForm({ status: details.status, reason: "" });
        } catch (error: unknown) {
            logger.error("Error fetching admin details:", error);
            toast.error(extractApiError(error, "Failed to load admin details"));
        } finally {
            setLoading(false);
        }
    }, [adminId]);

    useEffect(() => {
        fetchAdminDetails();
    }, [fetchAdminDetails]);

    const handleUpdateRole = useCallback(async () => {
        if (!roleForm.reason || roleForm.reason.length < 10) {
            toast.error("Reason must be at least 10 characters");
            return;
        }

        try {
            setActionLoading(true);
            await updateAdminRole(adminId, {
                role: roleForm.role.toLowerCase(),
                reason: roleForm.reason,
            });

            toast.success("Admin role updated successfully");
            setShowRoleDialog(false);
            setRoleForm({ role: "", reason: "" });
            await fetchAdminDetails();
        } catch (error: unknown) {
            logger.error("Error updating role:", error);
            toast.error(extractApiError(error, "Failed to update role"));
        } finally {
            setActionLoading(false);
        }
    }, [adminId, roleForm, fetchAdminDetails]);

    const handleUpdateStatus = useCallback(async () => {
        if (!statusForm.reason || statusForm.reason.length < 10) {
            toast.error("Reason must be at least 10 characters");
            return;
        }

        try {
            setActionLoading(true);
            await updateAdminStatus(adminId, {
                status: statusForm.status as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE',
                reason: statusForm.reason,
            });

            toast.success("Admin status updated successfully");
            setShowStatusDialog(false);
            setStatusForm({ status: "", reason: "" });
            await fetchAdminDetails();
        } catch (error: unknown) {
            logger.error("Error updating status:", error);
            toast.error(extractApiError(error, "Failed to update status"));
        } finally {
            setActionLoading(false);
        }
    }, [adminId, statusForm, fetchAdminDetails]);

    const handleResetPassword = useCallback(async () => {
        if (!passwordForm.new_password || passwordForm.new_password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        if (!passwordForm.reason || passwordForm.reason.length < 10) {
            toast.error("Reason must be at least 10 characters");
            return;
        }

        try {
            setActionLoading(true);
            await resetAdminPassword(adminId, {
                new_password: passwordForm.new_password,
                reason: passwordForm.reason,
            });

            toast.success("Admin password reset successfully");
            setShowResetPasswordDialog(false);
            setPasswordForm({ new_password: "", reason: "" });
            await fetchAdminDetails();
        } catch (error: unknown) {
            logger.error("Error resetting password:", error);
            toast.error(extractApiError(error, "Failed to reset password"));
        } finally {
            setActionLoading(false);
        }
    }, [adminId, passwordForm, fetchAdminDetails]);


    if (loading || !admin) {
        return (
            <SlidePanel loading>
                <div className="flex items-center justify-center h-96">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </SlidePanel>
        );
    }

    return (
        <SlidePanel>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <h2 className="text-xl font-semibold">Admin Details</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Complete information about {admin.full_name}
                </p>

                {/* Profile Section */}
                <div className="bg-gray-50 p-4 my-6 rounded-xl border border-gray-300">
                    <div className="flex items-center justify-between my-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-linear-to-r from-purple-500 to-blue-600 text-white w-16 h-16 flex items-center justify-center rounded-lg text-2xl font-bold">
                                {admin.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{admin.full_name}</h3>
                                <p className="text-gray-500 text-sm">{admin.email}</p>
                                <p className="text-gray-400 text-xs">@{admin.username}</p>
                            </div>
                        </div>

                        <span className={`px-3 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(admin.role)}`}>
                            {formatRoleName(admin.role)}
                        </span>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm py-4 my-4 border-t">
                        <div className="flex items-center gap-2">
                            <Shield size={16} className="text-gray-500" />
                            <div>
                                <p className="text-gray-500 text-xs">Status</p>
                                <p className="font-medium capitalize">{admin.status}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Key size={16} className="text-gray-500" />
                            <div>
                                <p className="text-gray-500 text-xs">2FA</p>
                                <p className="font-medium">{admin.totp_enabled ? 'Enabled' : 'Disabled'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-500" />
                            <div>
                                <p className="text-gray-500 text-xs">Created</p>
                                <p className="font-medium">{formatDateTime(admin.created_at)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-gray-500" />
                            <div>
                                <p className="text-gray-500 text-xs">Last Login</p>
                                <p className="font-medium">{formatDateTime(admin.last_login)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons — skeleton while role resolves to prevent flash-hidden */}
                {(roleLoading || isSuperAdmin) && (
                    <div className="grid grid-cols-3 gap-4 my-6">
                        {roleLoading ? (
                            <>
                                <div className="h-9 rounded-lg bg-gray-100 animate-pulse" />
                                <div className="h-9 rounded-lg bg-gray-100 animate-pulse" />
                                <div className="h-9 rounded-lg bg-gray-100 animate-pulse" />
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowRoleDialog(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Change Role
                                </button>
                                <button
                                    onClick={() => setShowStatusDialog(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                                >
                                    <Ban className="w-4 h-4" />
                                    Change Status
                                </button>
                                <button
                                    onClick={() => setShowResetPasswordDialog(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    <Lock className="w-4 h-4" />
                                    Reset Password
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Role Dialog */}
                {showRoleDialog && (
                    <RoleDialog
                        roleForm={roleForm}
                        setRoleForm={setRoleForm}
                        actionLoading={actionLoading}
                        onUpdate={handleUpdateRole}
                        onClose={() => {
                            setShowRoleDialog(false);
                            // Normalize to UPPERCASE so RoleDialog's VALID_ROLES check
                            // (and the pre-selected value) stay valid on reopen — matches
                            // the load-time normalization above and the .toLowerCase() on submit.
                            setRoleForm({ role: admin.role.toUpperCase(), reason: "" });
                        }}
                        currentRole={admin.role.toUpperCase()}
                    />
                )}

                {/* Status Dialog */}
                {showStatusDialog && (
                    <StatusDialog
                        statusForm={statusForm}
                        setStatusForm={setStatusForm}
                        actionLoading={actionLoading}
                        onUpdate={handleUpdateStatus}
                        onClose={() => {
                            setShowStatusDialog(false);
                            setStatusForm({ status: admin.status, reason: "" });
                        }}
                        currentStatus={admin.status}
                    />
                )}

                {/* Reset Password Dialog */}
                {showResetPasswordDialog && (
                    <ResetPasswordDialog
                        passwordForm={passwordForm}
                        setPasswordForm={setPasswordForm}
                        actionLoading={actionLoading}
                        onUpdate={handleResetPassword}
                        onClose={() => {
                            setShowResetPasswordDialog(false);
                            setPasswordForm({ new_password: "", reason: "" });
                        }}
                        adminName={admin.full_name}
                    />
                )}
        </SlidePanel>
    );
};

export default AdminDetailsModal;
