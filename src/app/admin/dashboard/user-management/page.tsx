"use client";
import Dropdown from "@/components/common/CustomDropdown";
import { Search, Eye, Filter, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import UserDetailsModal from "../../_components/UserDetailsModal";
import { BsFilterLeft } from "react-icons/bs";
import { getUserList, exportUsers, downloadExportedFile, UserListItem } from "@/api/userManagementApi";
import { toast } from "sonner";

const SUBSCRIPTION_MAP: Record<string, string> = {
  "Free": "free",
  "Basic": "basic",
  "Premium": "premium",
  "Pro": "pro",
  "Enterprise": "enterprise"
};
const ROLE_MAP: Record<string, string> = {
  "User": "user",
  "Admin": "admin"
};

const STATUS_MAP: Record<string, string> = {
  "Active": "active",
  "Inactive": "inactive",
  "Suspended": "suspended",
  "Pending Verification": "pending_verification"
};

const UserManagement = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    subscription: "",
    status: "",
    created_from: "",
    created_to: "",
    sort_by: "created_at",
    sort_order: "desc" as "asc" | "desc",
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };

      // Add filters only if they have values
      if (filters.search) params.search = filters.search;
      if (filters.role && filters.role !== "All") params.role = filters.role.toLowerCase();
      if (filters.subscription) params.subscription = filters.subscription.toLowerCase();
      if (filters.status) params.status = filters.status.toLowerCase();
      if (filters.created_from) params.created_from = filters.created_from;
      if (filters.created_to) params.created_to = filters.created_to;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.sort_order) params.sort_order = filters.sort_order;

      const response = await getUserList(params);

      setUsers(response.users);
      setTotalPages(response.total_pages);
      setTotalUsers(response.total);

    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.detail || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users on mount and when filters/pagination change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, filters.role, filters.subscription, filters.status]);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentPage === 1) {
        fetchUsers();
      } else {
        setCurrentPage(1); // Reset to page 1 when searching
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters.search]);

  // Handle export
  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      toast.loading("Preparing export...");

      const exportParams: any = {
        page: 1,
        page_size: 10000, // Export all
      };

      // Add current filters to export
      if (filters.search) exportParams.search = filters.search;
      if (filters.role && filters.role !== "All") exportParams.role = filters.role.toLowerCase();
      if (filters.subscription) exportParams.subscription = filters.subscription.toLowerCase();
      if (filters.status) exportParams.status = filters.status.toLowerCase();
      if (filters.created_from) exportParams.created_from = filters.created_from;
      if (filters.created_to) exportParams.created_to = filters.created_to;

      const blob = await exportUsers(exportParams, format);
      downloadExportedFile(blob, format);

      toast.dismiss();
      toast.success(`Users exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to export users");
      console.error("Export error:", error);
    }
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      role: "",
      subscription: "",
      status: "",
      created_from: "",
      created_to: "",
      sort_by: "created_at",
      sort_order: "desc",
    });
    setCurrentPage(1);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role && filters.role !== "All") count++;
    if (filters.subscription) count++;
    if (filters.status) count++;
    if (filters.created_from) count++;
    if (filters.created_to) count++;
    return count;
  };

  return (
    <div>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className="font-semibold text-xl">User Management</h1>
          <p className="text-[#4A5565] text-xs">
            Manage all users, subscriptions, and access controls.
          </p>
        </div>
        <Dropdown
          options={["Export as CSV", "Export as Xlsx"]}
          defaultValue="Export"
          onChange={(value) => {
            if (value === "Export as CSV") handleExport("csv");
            if (value === "Export as Xlsx") handleExport("xlsx");
          }}
          bgColor="bg-[#5E5EFF]"
          bgOptions="bg-white"
          textColor="text-white"
          className="w-34"
        />
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
            options={["Role", "All", "User", "Admin"]}
            defaultValue="Role"
            onChange={(value) =>
              handleFilterChange(
                "role",
                value === "Role" || value === "All" ? "" : ROLE_MAP[value]
              )
            }
            // onChange={(value) => handleFilterChange("role", value === "Role" ? "" : value)}
            bgColor="bg-gray-100"
            bgOptions="bg-white"
            className="w-34"
          />
          <Dropdown
            options={["Subscription", "Free", "Basic", "Premium", "Pro", "Enterprise"]}
            defaultValue="Subscription"
            onChange={(value) => handleFilterChange("subscription", value === "Subscription" ? "" : SUBSCRIPTION_MAP[value])}
            bgColor="bg-gray-100"
            bgOptions="bg-white"
            className="w-34"
          />
          <Dropdown
            options={["Status", "Active", "Inactive", "Suspended", "Pending Verification"]}
            defaultValue="Status"
            onChange={(value) => handleFilterChange("status", value === "Status" ? "" : STATUS_MAP[value])}
            bgColor="bg-gray-100"
            bgOptions="bg-white"
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
          Showing {users.length} of {totalUsers} users
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found matching your filters.
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#7F78DF33] text-left text-gray-700">
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Subscription</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Join Date</th>
                  <th className="p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="border-t-0 border-2 border-[#E5E7EB]">
                {users.map((user, idx) => (
                  <tr key={user.id} className="border-b border-[#00000033]/70 last:border-none hover:bg-gray-50">
                    <td className="p-3">{user.full_name || user.username}</td>
                    <td className="p-3 text-gray-600">{user.email}</td>
                    <td className="p-3 capitalize">{user.role}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium
                          ${user.subscription?.toLowerCase() === "pro"
                            ? "text-pink-600 underline decoration-pink-500"
                            : user.subscription?.toLowerCase() === "basic"
                              ? "text-green-600 underline decoration-green-500"
                              : user.subscription?.toLowerCase() === "enterprise"
                                ? "text-red-600 underline decoration-red-500"
                                : user.subscription?.toLowerCase() === "premium"
                                  ? "text-purple-600 underline decoration-purple-500"
                                  : "text-blue-600 underline decoration-blue-500"
                          }`}
                      >
                        {user.subscription || "Free"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-md font-medium capitalize
                          ${user.status.toLowerCase() === "active"
                            ? "text-[#008236] bg-[#DCFCE7]"
                            : user.status.toLowerCase() === "inactive"
                              ? "text-[#364153] bg-[#E4E4E499]/60"
                              : user.status.toLowerCase() === "suspended"
                                ? "text-[#BA1219] bg-[#FF9C9C66]/40"
                                : "text-[#F59E0B] bg-[#FEF3C7]"
                          }`}
                      >
                        {user.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{formatDate(user.created_at)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
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
      {selectedUser && (
        <UserDetailsModal
          userId={selectedUser.id}
          onClose={() => {
            setSelectedUser(null);
            fetchUsers(); // Refresh list after closing modal
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;