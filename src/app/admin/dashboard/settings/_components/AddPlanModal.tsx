"use client";
import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import Dropdown from "@/components/common/CustomDropdown";

interface AddPlanModalProps {
    open: boolean;
    onClose: () => void;
    onApply: () => void;
    onDelete?: () => void;
    onSetPopular?: () => void;
    mode?: "add" | "edit";
    formData: any;
    setFormData: (data: any) => void;
    isPopular?: boolean;
}

const AddPlanModal: React.FC<AddPlanModalProps> = ({
    open,
    onClose,
    onApply,
    onDelete,
    onSetPopular,
    mode = "add",
    formData,
    setFormData,
    isPopular = false
}) => {
    const [newFeature, setNewFeature] = useState("");

    if (!open) return null;

    const handleChange = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value });
    };

    const handleAddFeature = () => {
        if (newFeature.trim()) {
            const updatedFeatures = [...(formData.features || []), newFeature.trim()];
            setFormData({ ...formData, features: updatedFeatures });
            setNewFeature("");
        }
    };

    const handleRemoveFeature = (index: number) => {
        const updatedFeatures = formData.features.filter((_: any, i: number) => i !== index);
        setFormData({ ...formData, features: updatedFeatures });
    };

    const handleReset = () => {
        setFormData({
            planName: "",
            price: "",
            resumeLimit: "",
            jobLimit: "",
            aiCredits: "",
            templates: "",
            features: []
        });
        setNewFeature("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl w-[90%] max-w-3xl p-6 shadow-lg animate-fadeIn relative max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-3 sticky top-0 bg-white pb-3">
                    <div>
                        <h2 className="font-semibold text-xl">
                            {mode === "edit" ? "Edit Plan" : "Add New Plan"}
                        </h2>
                        <h2 className="text-sm text-[#666666]">
                            {mode === "edit"
                                ? "Modify the existing subscription plan"
                                : "Create a new subscription plan"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 cursor-pointer hover:bg-gray-100 rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">

                    {/* Plan Name */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold">
                            Plan Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={formData.planName}
                            onChange={(e) => handleChange("planName", e.target.value)}
                            placeholder="e.g., Basic, Pro, Enterprise"
                            className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Price */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold">
                            Price (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleChange("price", e.target.value)}
                            placeholder="e.g., 499"
                            className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Resume Limit */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold">Resume Scan Limit</label>
                        <input
                            type="number"
                            value={formData.resumeLimit}
                            onChange={(e) => handleChange("resumeLimit", e.target.value)}
                            placeholder="e.g., 50 (0 for unlimited)"
                            className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500">Enter 0 for unlimited scans</p>
                    </div>

                    {/* Job Limit */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold">Job Application Limit</label>
                        <input
                            type="number"
                            value={formData.jobLimit}
                            onChange={(e) => handleChange("jobLimit", e.target.value)}
                            placeholder="e.g., 100 (0 for unlimited)"
                            className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500">Enter 0 for unlimited applications</p>
                    </div>

                    {/* AI Credits */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold">AI Credits</label>
                        <input
                            type="number"
                            value={formData.aiCredits}
                            onChange={(e) => handleChange("aiCredits", e.target.value)}
                            placeholder="e.g., 1000"
                            className="w-full p-2 bg-gray-100 rounded-md outline-none text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500">Monthly AI credits allocation</p>
                    </div>

                    {/* Templates */}
                    <div className="flex flex-col gap-2 w-full">
                        <label className="text-sm font-semibold">Templates</label>
                        <Dropdown
                            options={[
                                "Limited Templates",
                                "Basic Templates",
                                "Premium Templates",
                                "Unlimited Templates"
                            ]}
                            defaultValue={formData.templates || "Limited Templates"}
                            onChange={(v) => handleChange("templates", v)}
                            bgColor="bg-gray-100"
                            bgOptions="bg-white"
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Features Section */}
                <div className="flex flex-col gap-2 my-4">
                    <label className="text-sm font-semibold">Features</label>

                    {/* Add Feature Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddFeature();
                                }
                            }}
                            className="flex-1 p-2 bg-gray-100 rounded-md outline-none text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Type a feature and press Add or Enter"
                        />
                        <button
                            onClick={handleAddFeature}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition"
                        >
                            <Plus className="w-4 h-4" />
                            Add
                        </button>
                    </div>

                    {/* Features List */}
                    {formData.features && formData.features.length > 0 && (
                        <div className="mt-3 space-y-2">
                            <p className="text-xs text-gray-600 font-medium">Added Features:</p>
                            {formData.features.map((feature: string, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-blue-50 border border-blue-200 p-2 rounded-md"
                                >
                                    <span className="text-sm text-gray-700">{feature}</span>
                                    <button
                                        onClick={() => handleRemoveFeature(index)}
                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {(!formData.features || formData.features.length === 0) && (
                        <p className="text-xs text-gray-400 italic mt-2">No features added yet</p>
                    )}
                </div>

                {/* Buttons */}
                <div className="mt-8 pt-4  sticky bottom-0 bg-white">
                    {/* Edit Mode - 4 buttons in grid */}
                    {mode === "edit" ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-4 gap-3">
                                <button
                                    onClick={onApply}
                                    className="px-5 py-2 cursor-pointer bg-[#5E5EFF] text-white rounded-md hover:bg-[#4E4EEF] transition flex items-center justify-center gap-2"
                                >
                                    Update
                                </button>

                                {!isPopular && onSetPopular && (
                                    <button
                                        onClick={onSetPopular}
                                        className="px-4 py-2 cursor-pointer bg-purple-50 text-purple-700 border border-purple-300 rounded-md hover:bg-purple-100 transition flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        Set as Popular
                                    </button>
                                )}

                                {isPopular && (
                                    <div className="px-4 py-2 bg-purple-100 text-purple-700 border border-purple-300 rounded-md flex items-center justify-center gap-2 cursor-not-allowed">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                        Popular
                                    </div>
                                )}

                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 cursor-pointer border border-black/80 bg-white rounded-md text-sm text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Reset All
                                </button>

                                {onDelete && (
                                    <button
                                        onClick={onDelete}
                                        className="px-4 py-2 cursor-pointer bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Add Mode - 2 buttons */
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleReset}
                                    className="px-4 py-2 cursor-pointer border border-black/80 bg-white rounded-md text-sm text-[#9E5559] hover:bg-gray-50 transition"
                            >
                                Reset All
                            </button>

                            <button
                                onClick={onApply}
                                    className="px-5 py-2 cursor-pointer bg-[#5E5EFF] text-white rounded-md hover:bg-[#4E4EEF] transition"
                            >
                                Create Plan
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AddPlanModal;