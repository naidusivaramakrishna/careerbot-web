"use client";
import React from "react";
import { Eye, Trash2 } from "lucide-react";
import { AdminListItem } from "@/api/adminManagementApi";

interface AdminTableProps {
    admins: AdminListItem[];
    loading: boolean;
    onViewDetails: (admin: AdminListItem) => void;
    onDeleteClick: (adminId: string) => void;
}

const AdminTable: React.FC<AdminTableProps> = ({
    admins,
    loading,
    onViewDetails,
    onDeleteClick,
}) => {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');
    };

    const formatRole = (role: string) => {
        return role.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role.toUpperCase()) {
            case 'SUPER_ADMIN':
                return 'text-purple-700 bg-purple-100';
            case 'ADMIN':
                return 'text-blue-700 bg-blue-100';
            case 'MODERATOR':
                return 'text-green-700 bg-green-100';
            case 'SUPPORT':
                return 'text-orange-700 bg-orange-100';
            default:
                return 'text-gray-700 bg-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Loading admins...</p>
            </div>
        );
    }

    if (admins.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No admins found matching your filters.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-[#7F78DF33] text-left text-gray-700">
                        <th className="p-3 font-semibold">Name</th>
                        <th className="p-3 font-semibold">Email</th>
                        <th className="p-3 font-semibold">Username</th>
                        <th className="p-3 font-semibold">Role</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold">2FA</th>
                        <th className="p-3 font-semibold">Last Login</th>
                        <th className="p-3 font-semibold">Created</th>
                        <th className="p-3 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody className="border-t-0 border-2 border-[#E5E7EB]">
                    {admins.map((admin) => (
                        <tr
                            key={admin.id}
                            className="border-b border-[#00000033]/70 last:border-none hover:bg-gray-50"
                        >
                            <td className="p-3 font-medium">{admin.full_name}</td>
                            <td className="p-3 text-gray-600">{admin.email}</td>
                            <td className="p-3 text-gray-600">{admin.username}</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(admin.role)}`}>
                                    {formatRole(admin.role)}
                                </span>
                            </td>
                            <td className="p-3">
                                <span
                                    className={`px-2 py-1 text-xs rounded-md font-medium capitalize
                    ${admin.status.toLowerCase() === "active"
                                            ? "text-[#008236] bg-[#DCFCE7]"
                                            : admin.status.toLowerCase() === "inactive"
                                                ? "text-[#364153] bg-[#E4E4E499]/60"
                                                : "text-[#BA1219] bg-[#FF9C9C66]/40"
                                        }`}
                                >
                                    {admin.status}
                                </span>
                            </td>
                            <td className="p-3">
                                <span
                                    className={`px-2 py-1 text-xs rounded-md font-medium
                    ${admin.totp_enabled
                                            ? "text-green-700 bg-green-100"
                                            : "text-gray-500 bg-gray-100"
                                        }`}
                                >
                                    {admin.totp_enabled ? "Enabled" : "Disabled"}
                                </span>
                            </td>
                            <td className="p-3 text-gray-600 text-xs">
                                {formatDate(admin.last_login)}
                            </td>
                            <td className="p-3 text-gray-600 text-xs">
                                {formatDate(admin.created_at)}
                            </td>
                            <td className="p-3">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => onViewDetails(admin)}
                                        className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onDeleteClick(admin.id)}
                                        className="text-[#E7000B] hover:text-red-700"
                                        title="Delete Admin"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminTable;
