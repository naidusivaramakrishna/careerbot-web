"use client";
import React, { memo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Dropdown from "@/components/common/CustomDropdown";

interface RoleDialogProps {
    roleForm: { role: string; reason: string };
    setRoleForm: React.Dispatch<React.SetStateAction<{ role: string; reason: string }>>;
    actionLoading: boolean;
    onUpdate: () => void;
    onClose: () => void;
}

// THE ROLES A SUPER ADMIN CAN ASSIGN. Must stay in step with AdminRole in
// app/services/admin_service/models.py -- the backend accepts platform_admin
// on PATCH /admin/auth/{id}/role, and this list omitting it was the only thing
// preventing the role from ever being given to anybody. The role, its
// permissions and every screen behind it were built and unreachable.
const VALID_ROLES = new Set([
    'SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'MODERATOR', 'SUPPORT',
]);

const RoleDialog = memo(({ roleForm, setRoleForm, actionLoading, onUpdate, onClose }: RoleDialogProps) => {
    const [confirmed, setConfirmed] = useState(false);
    const isValidRole = VALID_ROLES.has(roleForm.role);

    const handleClick = () => {
        if (!confirmed) { setConfirmed(true); return; }
        onUpdate();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Change Admin Role</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Role</label>
                        <Dropdown
                            options={["Role", "SUPER_ADMIN", "ADMIN", "PLATFORM_ADMIN", "MODERATOR", "SUPPORT"]}
                            defaultValue={roleForm.role || undefined}
                            onChange={(value) => { setRoleForm(f => ({ ...f, role: value })); setConfirmed(false); }}
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
                            onChange={(e) => { setRoleForm(f => ({ ...f, reason: e.target.value })); setConfirmed(false); }}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Explain why you're changing this admin's role..."
                        />
                    </div>
                    {confirmed && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                This will permanently change the admin&apos;s role. Click <strong>Confirm</strong> to proceed.
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleClick}
                        disabled={actionLoading || !isValidRole}
                        className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Updating..." : confirmed ? "Confirm" : "Update Role"}
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
RoleDialog.displayName = "RoleDialog";
export default RoleDialog;
