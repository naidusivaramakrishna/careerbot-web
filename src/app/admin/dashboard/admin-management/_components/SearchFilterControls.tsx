"use client";
import React from "react";
import { Search } from "lucide-react";
import { BsFilterLeft } from "react-icons/bs";
import Dropdown from "@/components/common/CustomDropdown";

const STATUS_MAP: Record<string, string> = {
    Active: "active",
    Suspended: "suspended",
    Inactive: "inactive",
};

const ROLE_MAP: Record<string, string> = {
    "Super Admin": "super_admin",
    "Admin": "admin",
    "Moderator": "moderator",
    "Support": "support",
};

interface FilterValues {
    search: string;
    role: string;
    status: string;
}

interface SearchFilterControlsProps {
    filters: FilterValues;
    activeFilterCount: number;
    onFilterChange: (key: string, value: string) => void;
    onToggleAdvancedFilters: () => void;
}

const SearchFilterControls: React.FC<SearchFilterControlsProps> = ({
    filters,
    activeFilterCount,
    onFilterChange,
    onToggleAdvancedFilters,
}) => {
    return (
        <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="flex items-center bg-[#F3F3F5] text-sm p-2 rounded-md w-full sm:w-2/5 lg:w-3/5">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={filters.search}
                    onChange={(e) => onFilterChange("search", e.target.value)}
                    className="w-full outline-none bg-transparent ml-2"
                />
            </div>

            {/* Quick Filters */}
            <Dropdown
                options={["Role", "All", "Super Admin", "Admin", "Moderator", "Support"]}
                defaultValue="Role"
                bgColor="bg-gray-100"
                bgOptions="bg-white"
                onChange={(value) =>
                    onFilterChange(
                        "role",
                        value === "Role" || value === "All" ? "" : ROLE_MAP[value]
                    )
                }
                className="w-34"
            />
            <Dropdown
                options={["Status", "Active", "Suspended", "Inactive"]}
                defaultValue="Status"
                bgColor="bg-gray-100"
                bgOptions="bg-white"
                onChange={(value) =>
                    onFilterChange(
                        "status",
                        value === "Status" ? "" : STATUS_MAP[value]
                    )
                }
                className="w-34"
            />

            {/* Advanced Filters Button */}
            <button
                onClick={onToggleAdvancedFilters}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Toggle advanced filters"
            >
                <BsFilterLeft className="w-6 h-6" />
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default SearchFilterControls;