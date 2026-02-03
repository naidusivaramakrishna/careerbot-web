"use client";

import { X } from "lucide-react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[650px] overflow-y-auto shadow-lg z-10">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 text-neutral-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-2">{children}</div>
            </div>
        </div>
    );
}
