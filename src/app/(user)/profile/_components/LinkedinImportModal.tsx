"use client";
import React, { useState } from "react";

interface LinkedinImportModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (linkedinUrl: string) => void;
}

const LinkedinImportModal: React.FC<LinkedinImportModalProps> = ({ open, onClose, onSubmit }) => {
    const [url, setUrl] = useState("");

    if (!open) return null;

    const handleSubmit = () => {
        if (!url.trim()) return;
        onSubmit(url.trim());
        onClose();
        setUrl("");
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[380px] shadow-xl">
                <h2 className="text-lg font-semibold mb-3">Import LinkedIn Profile</h2>

                <input
                    type="text"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md mb-4 bg-gray-100 outline-none text-sm"
                    placeholder="Paste LinkedIn profile URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                    >
                        Import
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LinkedinImportModal;
