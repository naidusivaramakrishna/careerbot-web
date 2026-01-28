"use client";
import React from "react";
import { useAdminManagement } from "./_hooks/useAdminManagement";
import { AdminDetailsModal, AdminTable, AdvancedFiltersPanel, Pagination, SearchFilterControls } from "./_components";
import ConfirmDeleteModal from "@/app/(user)/dashboard/profile/_components/ConfirmDeleteModal";
import { logger } from "@/lib/logger";

const AdminManagement = () => {
  const {
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
  } = useAdminManagement();

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
        <SearchFilterControls
          filters={filters}
          activeFilterCount={getActiveFilterCount()}
          onFilterChange={(key, value) => {
            logger.debug(`Admin filter changed: ${key} = ${value}`)
            handleFilterChange(key, value)
          }}
          onToggleAdvancedFilters={() => {
            logger.debug('Toggling advanced filters')
            setShowFilters(!showFilters)
          }}
        />

        {/* Advanced Filters Panel */}
        {showFilters && (
          <AdvancedFiltersPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
            onClearFilters={clearFilters}
          />
        )}

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {admins.length} of {totalAdmins} admins
        </div>

        {/* Table */}
        <div className="mt-6">
          <AdminTable
            admins={admins}
            loading={loading}
            onViewDetails={(admin) => {
              logger.info(`Viewing admin details: ${admin.id}`)
              setSelectedAdmin(admin)
            }}
            onDeleteClick={(adminId) => {
              logger.warn(`Initiating delete for admin: ${adminId}`)
              handleDeleteClick(adminId)
            }}
          />
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalAdmins}
          onPageChange={(page) => {
            logger.debug(`Admin page changed to: ${page}`)
            setCurrentPage(page)
          }}
          onPageSizeChange={(size) => {
            logger.debug(`Admin page size changed to: ${size}`)
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Modal */}
      {selectedAdmin && (
        <AdminDetailsModal
          adminId={selectedAdmin.id}
          onClose={handleCloseModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteModalOpen}
        title="Delete Admin"
        description="Are you sure you want to delete this admin? This action cannot be undone and will remove all associated data."
        loading={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default AdminManagement;