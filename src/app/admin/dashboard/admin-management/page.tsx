"use client";
import Dropdown from "@/components/common/CustomDropdown";
import { Search, Eye, X, UserPlus, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import AdminDetailsModal from "../../_components/AdminDetailsModal";
import { BsFilterLeft } from "react-icons/bs";
import { getAdminList, AdminListItem, deleteAdmin } from "@/api/adminManagementApi";
import ConfirmDeleteModal from '@/app/(user)/dashboard/profile/_components/ConfirmDeleteModal';
import { toast } from "sonner";

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


const AdminManagement = () => {
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminListItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    created_from: "",
    created_to: "",
    sort_by: "created_at",
    sort_order: "desc" as "asc" | "desc",
  });

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };

      // Add filters only if they have values
      if (filters.search) params.search = filters.search;
      if (filters.role && filters.role !== "All") params.role = filters.role;
      if (filters.status) params.status = filters.status;
      if (filters.created_from) params.created_from = filters.created_from;
      if (filters.created_to) params.created_to = filters.created_to;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;

      const response = await getAdminList(params);

      setAdmins(response.admins);
      setTotalPages(response.total_pages);
      setTotalAdmins(response.total);

    } catch (error: any) {
      console.error("Error fetching admins:", error);
      toast.error(error.response?.data?.detail || "Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  // Fetch admins on mount and when filters/pagination change
  useEffect(() => {
    fetchAdmins();
  }, [currentPage, pageSize, filters.role, filters.status]);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentPage === 1) {
        fetchAdmins();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters.search]);

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      role: "",
      status: "",
      created_from: "",
      created_to: "",
      sort_by: "created_at",
      sort_order: "desc",
    });
    setCurrentPage(1);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role && filters.role !== "All") count++;
    if (filters.status) count++;
    if (filters.created_from) count++;
    if (filters.created_to) count++;
    return count;
  };

  // Get role badge color
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

  const handleDeleteClick = (adminId: string) => {
    setAdminToDelete(adminId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!adminToDelete) return;

    try {
      setIsDeleting(true);
      await deleteAdmin(adminToDelete);
      toast.success('Admin deleted successfully');
      setDeleteModalOpen(false);
      setAdminToDelete(null);
      fetchAdmins(); // Refresh list
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete admin');
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className="font-semibold text-xl">Admin Management</h1>
          <p className="text-[#4A5565] text-xs">
            Manage admin accounts, roles, and permissions.
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-lg p-6 my-8 shadow-sm border border-gray-100">
        <div className="flex gap-4 items-center">
          {/* Search */}
          <div className="flex items-center bg-[#F3F3F5] text-sm p-2 rounded-md w-full sm:w-2/5 lg:w-3/5">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
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
              handleFilterChange(
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
              handleFilterChange(
                "status",
                value === "Status" ? "" : STATUS_MAP[value]
              )
            }
            className="w-34"
          />

          {/* Advanced Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <BsFilterLeft className="w-6 h-6" />
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm">Advanced Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
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
                  onChange={(e) => handleFilterChange("created_from", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
                  onChange={(e) => handleFilterChange("created_to", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sort_by}
                  onChange={(e) => handleFilterChange("sort_by", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
                  onChange={(e) => handleFilterChange("sort_order", e.target.value as "asc" | "desc")}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {admins.length} of {totalAdmins} admins
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading admins...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No admins found matching your filters.
            </div>
          ) : (
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
                  <tr key={admin.id} className="border-b border-[#00000033]/70 last:border-none hover:bg-gray-50">
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
                          onClick={() => setSelectedAdmin(admin)}
                          className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600"
                          title="view"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(admin.id)}
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
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Rows per page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedAdmin && (
        <AdminDetailsModal
          adminId={selectedAdmin.id}
          onClose={() => {
            setSelectedAdmin(null);
            fetchAdmins();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteModalOpen}
        title="Delete Admin"
        description="Are you sure you want to delete this admin? This action cannot be undone and will remove all associated data."
        loading={isDeleting}
        onCancel={() => {
          setDeleteModalOpen(false);
          setAdminToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default AdminManagement;