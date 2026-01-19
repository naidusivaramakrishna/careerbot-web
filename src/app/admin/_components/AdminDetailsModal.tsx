"use client";
import React, { useState, useEffect } from "react";
import { X, Shield, Mail, Calendar, Activity, Edit2, Ban, Trash2, Check, Key } from "lucide-react";
import Dropdown from "@/components/common/CustomDropdown";
import {
    getAdminDetails,
    getAdminActivityLogs,
    updateAdminRole,
    updateAdminStatus,
    resetAdminPassword,
    AdminDetailsResponse
} from "@/api/adminManagementApi";
import { toast } from "sonner";

interface Props {
    adminId: string;
    onClose: () => void;
}

const statusMap: Record<string, string> = {
    ACTIVE: "active",
    SUSPENDED: "suspended",
    INACTIVE: "inactive",
};
const RoleMap: Record<string, string> = {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    MODERATOR: "moderator",
    SUPPORT: "support",
};



const AdminDetailsModal: React.FC<Props> = ({ adminId, onClose }) => {
    const [admin, setAdmin] = useState<AdminDetailsResponse | null>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Dialogs state
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);

    // Form state
    const [roleForm, setRoleForm] = useState({ role: "", reason: "" });
    const [statusForm, setStatusForm] = useState({ status: "", reason: "" });
    const [passwordForm, setPasswordForm] = useState({ new_password: "", reason: "" });

    useEffect(() => {
        fetchAdminDetails();
    }, [adminId]);

    const fetchAdminDetails = async () => {
        try {
            setLoading(true);
            const details = await getAdminDetails(adminId);
            setAdmin(details);

            // Initialize forms
            setRoleForm({ role: details.role, reason: "" });
            setStatusForm({ status: details.status, reason: "" });
        } catch (error: any) {
            console.error("Error fetching admin details:", error);
            toast.error(error.response?.data?.detail || "Failed to load admin details");
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityLogs = async () => {
        try {
            const response = await getAdminActivityLogs(adminId, {
                page: 1,
                page_size: 10,
            });
            setActivities(response.logs);
        } catch (error) {
            console.error("Error fetching activity logs:", error);
        }
    };

    // Handle role update
    const handleUpdateRole = async () => {
        if (!roleForm.reason || roleForm.reason.length < 10) {
            toast.error("Reason must be at least 10 characters");
            return;
        }

        try {
            setActionLoading(true);
            await updateAdminRole(adminId, {
                role: roleForm.role,
                reason: roleForm.reason,
            });

            toast.success("Admin role updated successfully");
            setShowRoleDialog(false);
            setRoleForm({ role: "", reason: "" });
            await fetchAdminDetails();
        } catch (error: any) {
            console.error("Error updating role:", error);
            toast.error(error.response?.data?.detail || "Failed to update role");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle status update
    const handleUpdateStatus = async () => {
        if (!statusForm.reason || statusForm.reason.length < 10) {
            toast.error("Reason must be at least 10 characters");
            return;
        }

        try {
            setActionLoading(true);
            await updateAdminStatus(adminId, {
                status: statusForm.status as any,
                reason: statusForm.reason,
            });

            toast.success("Admin status updated successfully");
            setShowStatusDialog(false);
            setStatusForm({ status: "", reason: "" });
            await fetchAdminDetails();
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast.error(error.response?.data?.detail || "Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle password reset
    const handleResetPassword = async () => {
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
            await resetAdminPassword(adminId, passwordForm);

            toast.success("Password reset successfully");
            setShowPasswordDialog(false);
            setPasswordForm({ new_password: "", reason: "" });
        } catch (error: any) {
            console.error("Error resetting password:", error);
            toast.error(error.response?.data?.detail || "Failed to reset password");
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never";
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatRole = (role: string) => {
        return role.replace('_', ' ');
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'super_admin':
                return 'text-purple-600 bg-purple-100';
            case 'admin':
                return 'text-blue-600 bg-blue-100';
            case 'moderator':
                return 'text-green-600 bg-green-100';
            case 'support':
                return 'text-gray-600 bg-gray-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading || !admin) {
        return (
            <div className="fixed inset-0 flex items-center justify-end bg-black/50 z-50">
                <div className="bg-white rounded-2xl rounded-tr-none rounded-br-none shadow-lg w-full max-w-2xl p-6 relative">
                    <div className="flex items-center justify-center h-96">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex items-center justify-end bg-black/50 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl rounded-tr-none rounded-br-none shadow-lg w-full max-w-2xl p-6 relative my-4 max-h-screen overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10"
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
                            <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white w-16 h-16 flex items-center justify-center rounded-lg text-2xl font-bold">
                                {admin.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{admin.full_name}</h3>
                                <p className="text-gray-500 text-sm">{admin.email}</p>
                                <p className="text-gray-400 text-xs">@{admin.username}</p>
                            </div>
                        </div>

                        <span className={`px-3 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(admin.role)}`}>
                            {formatRole(admin.role)}
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
                                <p className="font-medium">{formatDate(admin.created_at)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-gray-500" />
                            <div>
                                <p className="text-gray-500 text-xs">Last Login</p>
                                <p className="font-medium">{formatDate(admin.last_login)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-4 my-6">
                    <button
                        onClick={() => setShowRoleDialog(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        <Edit2 className="w-4 h-4" />
                        Change Role
                    </button>
                    <button
                        onClick={() => setShowStatusDialog(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                    >
                        <Ban className="w-4 h-4" />
                        Change Status
                    </button>
                    <button
                        onClick={() => setShowPasswordDialog(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                        <Key className="w-4 h-4" />
                        Reset Password
                    </button>
                </div>

                {/* Role Dialog */}
                {showRoleDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">Change Admin Role</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Role
                                    </label>
                                    <Dropdown
                                        options={["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"]}
                                        defaultValue={
                                            Object.keys(RoleMap).find(
                                                (key) => RoleMap[key] === roleForm.role
                                            )
                                        }
                                        onChange={(value) =>
                                            setRoleForm({ ...roleForm, role: RoleMap[value] })
                                        }
                                        bgColor="bg-gray-100"
                                        bgOptions="bg-white"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason (minimum 10 characters)
                                    </label>
                                    <textarea
                                        value={roleForm.reason}
                                        onChange={(e) => setRoleForm({ ...roleForm, reason: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        rows={3}
                                        placeholder="Explain why you're changing this admin's role..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleUpdateRole}
                                    disabled={actionLoading}
                                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                >
                                    Update Role
                                </button>
                                <button
                                    onClick={() => {
                                        setShowRoleDialog(false);
                                        setRoleForm({ role: admin.role, reason: "" });
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Dialog */}
                {showStatusDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">Change Admin Status</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Status
                                    </label>
                                    <Dropdown
                                        options={["ACTIVE", "SUSPENDED", "INACTIVE"]}
                                        defaultValue={
                                            Object.keys(statusMap).find(
                                                (key) => statusMap[key] === statusForm.status
                                            )
                                        }
                                        onChange={(value) =>
                                            setStatusForm({ ...statusForm, status: statusMap[value] })
                                        }
                                        bgColor="bg-gray-100"
                                        bgOptions="bg-white"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason (minimum 10 characters)
                                    </label>
                                    <textarea
                                        value={statusForm.reason}
                                        onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        rows={3}
                                        placeholder="Explain why you're changing this admin's status..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleUpdateStatus}
                                    disabled={actionLoading}
                                    className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                                >
                                    Update Status
                                </button>
                                <button
                                    onClick={() => {
                                        setShowStatusDialog(false);
                                        setStatusForm({ status: admin.status, reason: "" });
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Password Dialog */}
                {showPasswordDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">Reset Admin Password</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password (minimum 8 characters)
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.new_password}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        placeholder="Enter new password..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason (minimum 10 characters)
                                    </label>
                                    <textarea
                                        value={passwordForm.reason}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, reason: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        rows={3}
                                        placeholder="Explain why you're resetting this password..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleResetPassword}
                                    disabled={actionLoading}
                                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                                >
                                    Reset Password
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPasswordDialog(false);
                                        setPasswordForm({ new_password: "", reason: "" });
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                
            </div>
        </div>
    );
};

export default AdminDetailsModal;