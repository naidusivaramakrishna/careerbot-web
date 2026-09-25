"use client";
import React, { memo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Dropdown from "@/components/common/CustomDropdown";

const statusMap: Record<string, string> = {
    ACTIVE: "active",
    SUSPENDED: "suspended",
    INACTIVE: "inactive",
};

interface StatusDialogProps {
    statusForm: { status: string; reason: string };
    setStatusForm: React.Dispatch<React.SetStateAction<{ status: string; reason: string }>>;
    actionLoading: boolean;
    onUpdate: () => void;
    onClose: () => void;
    currentStatus: string;
}

const StatusDialog = memo(({ statusForm, setStatusForm, actionLoading, onUpdate, onClose, currentStatus }: StatusDialogProps) => {
    const [confirmed, setConfirmed] = useState(false);
    const isStatusChanged = statusForm.status !== currentStatus;

    const handleClick = () => {
        if (!confirmed) { setConfirmed(true); return; }
        onUpdate();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Change Admin Status</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                        <Dropdown
                            options={["Status", "ACTIVE", "SUSPENDED", "INACTIVE"]}
                            defaultValue={Object.keys(statusMap).find(key => statusMap[key] === statusForm.status)}
                            onChange={(value) => { setStatusForm(f => ({ ...f, status: statusMap[value] })); setConfirmed(false); }}
                            bgColor="bg-gray-100"
                            bgOptions="bg-white"
                            className="w-full"
                            disabledOptions={[Object.keys(statusMap).find(key => statusMap[key] === currentStatus) || ""]}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason (minimum 10 characters)
                        </label>
                        <textarea
                            value={statusForm.reason}
                            onChange={(e) => { setStatusForm(f => ({ ...f, reason: e.target.value })); setConfirmed(false); }}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Explain why you're changing this admin's status..."
                        />
                    </div>
                    {confirmed && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                This will update the admin&apos;s account status. Click <strong>Confirm</strong> to proceed.
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleClick}
                        disabled={actionLoading || !isStatusChanged}
                        className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                        title={!isStatusChanged ? "Select a different status to proceed" : ""}
                    >
                        {actionLoading ? "Updating..." : confirmed ? "Confirm" : "Update Status"}
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
StatusDialog.displayName = "StatusDialog";
export default StatusDialog;
