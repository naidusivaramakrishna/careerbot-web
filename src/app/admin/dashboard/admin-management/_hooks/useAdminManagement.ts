"use client";
import { useState, useEffect, useCallback } from "react";
import { getAdminList, AdminListItem, deleteAdmin } from "@/api/adminManagementApi";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface FilterState {
  search: string;
  role: string;
  status: string;
  created_from: string;
  created_to: string;
  sort_by: string;
  sort_order: "asc" | "desc";
}

export const useAdminManagement = () => {
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminListItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    role: "",
    status: "",
    created_from: "",
    created_to: "",
    sort_by: "created_at",
    sort_order: "desc",
  });

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);

      const params: Record<string, unknown> = {
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
    } catch (error: unknown) {
      logger.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  // Fetch admins on mount and when dependencies change
  useEffect(() => {
    fetchAdmins();
  }, [currentPage, pageSize, filters.role, filters.status, filters.created_from, filters.created_to, filters.sort_by, filters.sort_order, fetchAdmins]);

  // Handle search with debounce and reset to page 1
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters.search]);

  // Handle filter change
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key !== 'search') {
      setCurrentPage(1);
    }
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
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
  }, []);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role && filters.role !== "All") count++;
    if (filters.status) count++;
    if (filters.created_from) count++;
    if (filters.created_to) count++;
    return count;
  }, [filters]);

  // Handle delete
  const handleDeleteClick = useCallback((adminId: string) => {
    setAdminToDelete(adminId);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!adminToDelete) return;

    try {
      setIsDeleting(true);
      await deleteAdmin(adminToDelete);
      toast.success('Admin deleted successfully');
      setDeleteModalOpen(false);
      setAdminToDelete(null);
      fetchAdmins();
    } catch (error) {
      logger.error('Delete error:', error);
      toast.error('Failed to delete admin');
    } finally {
      setIsDeleting(false);
    }
  }, [adminToDelete, fetchAdmins]);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setAdminToDelete(null);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setSelectedAdmin(null);
    fetchAdmins();
  }, [fetchAdmins]);

  return {
    admins,
    loading,
    currentPage,
    totalPages,
    totalAdmins,
    pageSize,
    selectedAdmin,
    showFilters,
    deleteModalOpen,
    isDeleting,
    filters,
    setCurrentPage,
    setPageSize,
    setSelectedAdmin,
    setShowFilters,
    handleFilterChange,
    clearFilters,
    getActiveFilterCount,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    handleCloseModal,
  };
};
