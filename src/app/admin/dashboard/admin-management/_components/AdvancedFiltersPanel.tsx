"use client";
import React from "react";
import { X } from "lucide-react";

interface AdvancedFilters {
    created_from: string;
    created_to: string;
    sort_by: string;
    sort_order: "asc" | "desc";
}

interface AdvancedFiltersPanelProps {
    filters: AdvancedFilters;
    onFilterChange: (key: string, value: string) => void;
    onClose: () => void;
    onClearFilters: () => void;
}

const AdvancedFiltersPanel: React.FC<AdvancedFiltersPanelProps> = ({
    filters,
    onFilterChange,
    onClose,
    onClearFilters,
}) => {
    return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm">Advanced Filters</h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close advanced filters"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date From */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Created From
                    </label>
                    <input
                        type="date"
                        value={filters.created_from}
                        onChange={(e) => onFilterChange("created_from", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Date To */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Created To
                    </label>
                    <input
                        type="date"
                        value={filters.created_to}
                        onChange={(e) => onFilterChange("created_to", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Sort By */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sort By
                    </label>
                    <select
                        value={filters.sort_by}
                        onChange={(e) => onFilterChange("sort_by", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="created_at">Join Date</option>
                        <option value="email">Email</option>
                        <option value="full_name">Name</option>
                        <option value="last_login">Last Login</option>
                    </select>
                </div>

                {/* Sort Order */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sort Order
                    </label>
                    <select
                        value={filters.sort_order}
                        onChange={(e) => onFilterChange("sort_order", e.target.value as "asc" | "desc")}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                    </select>
                </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
                <button
                    onClick={onClearFilters}
                    className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                    Clear All Filters
                </button>
            </div>
        </div>
    );
};

export default AdvancedFiltersPanel;
