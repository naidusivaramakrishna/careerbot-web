"use client"
import React, { useState, useCallback } from 'react'
import Dropdown from '@/components/common/CustomDropdown'
import type { UserListItem } from '@/api/userManagementApi'
import { useUserManagement } from './_hooks/useUserManagement'
import { UserListControls } from './_components/user-management/UserListControls'
import { AdvancedFiltersPanel } from './_components/user-management/AdvancedFiltersPanel'
import { UsersTable } from './_components/user-management/UsersTable'
import { UsersPagination } from './_components/user-management/UsersPagination'
import { UserDetailsModal } from './_components/user-details'
import { logger } from '@/lib/logger'

const UserManagement = () => {
  const {
    users,
    loading,
    currentPage,
    totalPages,
    totalUsers,
    pageSize,
    filters,
    handleFilterChange,
    clearFilters,
    handlePageChange,
    handlePageSizeChange,
    handleExport,
    getActiveFilterCount,
    fetchUsers
  } = useUserManagement()

  const [showFilters, setShowFilters] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null)

  const handleToggleFilters = useCallback(() => {
    logger.debug('Toggling filters panel')
    setShowFilters(prev => !prev)
  }, [])

  const handleCloseFilters = useCallback(() => {
    setShowFilters(false)
  }, [])

  const handleViewDetails = useCallback((user: UserListItem) => {
    logger.info(`Viewing user details for user: ${user.id}`)
    setSelectedUser(user)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedUser(null)
    fetchUsers()
  }, [fetchUsers])

  const handleExportChange = useCallback((value: string) => {
    if (value === 'Export as CSV') {
      logger.info('Exporting users as CSV')
      handleExport('csv')
    }
    if (value === 'Export as Xlsx') {
      logger.info('Exporting users as XLSX')
      handleExport('xlsx')
    }
  }, [handleExport])

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
          options={['Export as CSV', 'Export as Xlsx']}
          defaultValue="Export"
          onChange={handleExportChange}
          bgColor="bg-[#5E5EFF]"
          bgOptions="bg-white"
          textColor="text-white"
          className="w-34"
        />
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg p-6 my-8 shadow-sm border border-gray-100">
        {/* Search + Filters */}
        <UserListControls
          searchValue={filters.search}
          onSearchChange={(value) => handleFilterChange('search', value)}
          onRoleFilter={(value) => handleFilterChange('role', value)}
          onSubscriptionFilter={(value) => handleFilterChange('subscription', value)}
          onStatusFilter={(value) => handleFilterChange('status', value)}
          onToggleFilters={handleToggleFilters}
          activeFilterCount={getActiveFilterCount()}
        />

        {/* Advanced Filters Panel */}
        {showFilters && (
          <AdvancedFiltersPanel
            filters={{
              created_from: filters.created_from,
              created_to: filters.created_to,
              sort_by: filters.sort_by,
              sort_order: filters.sort_order
            }}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            onClose={handleCloseFilters}
          />
        )}

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {users.length} of {totalUsers} users
        </div>

        {/* Table */}
        <div className="mt-6">
          <UsersTable
            users={users}
            loading={loading}
            onViewDetails={handleViewDetails}
          />
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <UsersPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {/* Modal */}
      {selectedUser && (
        <UserDetailsModal
          userId={selectedUser.id}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default UserManagement