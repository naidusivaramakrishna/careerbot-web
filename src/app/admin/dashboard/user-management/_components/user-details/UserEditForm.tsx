import React, { memo, useState, useEffect, useCallback } from 'react'
import { Check, AlertTriangle } from 'lucide-react'
import Dropdown from '@/components/common/CustomDropdown'
import type { UserDetailsResponse } from '@/api/userManagementApi'

interface EditFormData {
    full_name: string
    role: string
    [key: string]: string
}

export type { EditFormData }

interface UserEditFormProps {
    user: UserDetailsResponse
    onSave: (data: EditFormData) => Promise<boolean>
    onCancel: () => void
    loading: boolean
}

const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export const UserEditForm = memo(({
    user,
    onSave,
    onCancel,
    loading
}: UserEditFormProps) => {
    const [editForm, setEditForm] = useState({
        full_name: user.full_name,
        role: user.role,
    })
    const [showRoleConfirm, setShowRoleConfirm] = useState(false)

    useEffect(() => {
        setEditForm({
            full_name: user.full_name,
            role: user.role,
        })
    }, [user])

    const handleSave = useCallback(async () => {
        const roleChanged = editForm.role.toLowerCase() !== user.role.toLowerCase()
        const promotingToAdmin = roleChanged && editForm.role.toLowerCase() === 'admin'
        if (promotingToAdmin && !showRoleConfirm) {
            setShowRoleConfirm(true)
            return
        }
        setShowRoleConfirm(false)
        await onSave(editForm)
    }, [editForm, user.role, showRoleConfirm, onSave])

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-300 my-4">
            <h4 className="font-semibold text-sm mb-3">Edit User Information</h4>

            <div className="grid grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        placeholder="Enter full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Role Dropdown */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Role
                    </label>
                    <Dropdown
                        options={['Role', 'User', 'Admin']}
                        defaultValue={capitalize(editForm.role)}
                        onChange={(value) => setEditForm({ ...editForm, role: value.toLowerCase() })}
                        bgColor="bg-gray-100"
                        bgOptions="bg-white"
                        className="w-full"
                    />
                </div>
            </div>

            {/* Role promotion confirmation */}
            {showRoleConfirm && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        This will promote the user to <strong>Admin</strong>. Confirm to proceed.
                    </span>
                </div>
            )}

            {/* Save/Cancel Buttons */}
            <div className="flex gap-2 mt-4">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 cursor-pointer bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                    <Check className="w-4 h-4" />
                    Save Changes
                </button>
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 cursor-pointer bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
})

UserEditForm.displayName = 'UserEditForm'
