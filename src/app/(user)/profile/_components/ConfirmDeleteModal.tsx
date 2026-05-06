"use client";

import Modal from "@/components/common/Modal";
import { Trash2 } from "lucide-react";

interface ConfirmDeleteModalProps {
    open: boolean;
    title?: string;
    description?: string;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function ConfirmDeleteModal({
    open,
    title = "Delete Experience",
    description = "Are you sure you want to delete this experience? This action cannot be undone.",
    loading = false,
    onCancel,
    onConfirm,
}: ConfirmDeleteModalProps) {
    return (
        <Modal open={open} onClose={onCancel} title={title}>
            <div className="flex flex-col gap-4">
                {/* Icon + Text */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-600" />
                    </div>

                    <p className="text-sm text-neutral-600">{description}</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-sm rounded-md border border-neutral-300 hover:bg-neutral-100 cursor-pointer"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
