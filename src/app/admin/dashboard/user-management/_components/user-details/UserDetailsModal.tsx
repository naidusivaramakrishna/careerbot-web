"use client"

import React, { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { useUserDetails } from '../../_hooks/useUserDetails'
import { formatDate } from '@/app/admin/_utils/formatDate'
import { SlidePanel } from '@/app/admin/_components/SlidePanel'
import { UserProfileSection } from './UserProfileSection'
import { UserEditForm, type EditFormData } from './UserEditForm'
import { UserDetailsTabs } from './UserDetailsTabs'
import { ActivityTab, PaymentsTab, ResumesTab, SubscriptionTab } from './TabContents'
import { UserActionButtons } from './UserActionButtons'
import { DeleteDialog, SuspendDialog } from './ActionDialogs'

interface Props {
    userId: string
    onClose: () => void
}

const UserDetailsModal: React.FC<Props> = ({ userId, onClose }) => {
    const {
        user,
        activities,
        loading,
        actionLoading,
        activeTab,
        setActiveTab,
        handleUpdateUser,
        handleSuspendUser,
        handleUnsuspendUser,
        handleDeleteUser
    } = useUserDetails(userId)

    const [isEditing, setIsEditing] = useState(false)
    const [showSuspendDialog, setShowSuspendDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    // Handlers
    const handleEdit = useCallback(() => {
        setIsEditing(true)
    }, [])

    const handleCancelEdit = useCallback(() => {
        setIsEditing(false)
    }, [])

    const handleSaveEdit = useCallback(async (data: EditFormData) => {
        const success = await handleUpdateUser(data)
        if (success) {
            setIsEditing(false)
        }
        return success
    }, [handleUpdateUser])

    const handleOpenSuspendDialog = useCallback(() => {
        setShowSuspendDialog(true)
    }, [])

    const handleCloseSuspendDialog = useCallback(() => {
        setShowSuspendDialog(false)
    }, [])

    const handleConfirmSuspend = useCallback(async (reason: string) => {
        const success = await handleSuspendUser(reason)
        if (success) {
            setShowSuspendDialog(false)
        }
        return success
    }, [handleSuspendUser])

    const handleOpenDeleteDialog = useCallback(() => {
        setShowDeleteDialog(true)
    }, [])

    const handleCloseDeleteDialog = useCallback(() => {
        setShowDeleteDialog(false)
    }, [])

    const handleConfirmDelete = useCallback(async (
        reason: string,
        isPermanent: boolean,
        confirmed: boolean
    ) => {
        const success = await handleDeleteUser(reason, isPermanent, confirmed)
        if (success) {
            setShowDeleteDialog(false)
            onClose()
        }
        return success
    }, [handleDeleteUser, onClose])

    if (loading || !user) {
        return (
            <SlidePanel loading>
                <div className="flex items-center justify-center h-96">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </SlidePanel>
        )
    }

    return (
        <SlidePanel>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 cursor-pointer hover:text-gray-800 z-10 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <h2 className="text-xl font-semibold">User Details</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Complete information about {user.full_name || user.username}
                </p>

                {/* Profile Section */}
                <UserProfileSection
                    user={user}
                    isEditing={isEditing}
                    formatDate={formatDate}
                />

                {/* Edit Form */}
                {isEditing && (
                    <UserEditForm
                        user={user}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                        loading={actionLoading}
                    />
                )}

                {/* Tabs */}
                <UserDetailsTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                {/* Tab Content */}
                <div className="max-h-[300px] overflow-y-auto">
                    {activeTab === 'Subscription' && (
                        <SubscriptionTab user={user} />
                    )}

                    {activeTab === 'Resumes' && (
                        <ResumesTab
                            resumes={user.resumes || []}
                            formatDate={formatDate}
                        />
                    )}

                    {activeTab === 'Payments' && (
                        <PaymentsTab
                            payments={user.payments || []}
                            formatDate={formatDate}
                        />
                    )}

                    {activeTab === 'Activity' && (
                        <ActivityTab
                            activities={activities}
                        />
                    )}
                </div>

                {/* Action Buttons */}
                {!isEditing && (
                    <UserActionButtons
                        userStatus={user.status}
                        onEdit={handleEdit}
                        onSuspend={handleOpenSuspendDialog}
                        onUnsuspend={handleUnsuspendUser}
                        onDelete={handleOpenDeleteDialog}
                        loading={actionLoading}
                    />
                )}

                {/* Dialogs */}
                {showSuspendDialog && (
                    <SuspendDialog
                        onConfirm={handleConfirmSuspend}
                        onCancel={handleCloseSuspendDialog}
                        loading={actionLoading}
                    />
                )}

                {showDeleteDialog && (
                    <DeleteDialog
                        onConfirm={handleConfirmDelete}
                        onCancel={handleCloseDeleteDialog}
                        loading={actionLoading}
                    />
                )}
        </SlidePanel>
    )
}

export default UserDetailsModal
