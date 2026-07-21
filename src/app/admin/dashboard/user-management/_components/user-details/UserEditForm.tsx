import React, { memo, useState, useEffect } from 'react'
import { Check } from 'lucide-react'
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

    useEffect(() => {
        setEditForm({
            full_name: user.full_name,
            role: user.role,
        })
    }, [user])

    const handleSave = async () => {
        await onSave(editForm)
    }

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
                        options={['User', 'Admin']}
                        defaultValue={capitalize(editForm.role)}
                        onChange={(value) => setEditForm({ ...editForm, role: value.toLowerCase() })}
                        bgColor="bg-gray-100"
                        bgOptions="bg-white"
                        className="w-full"
                    />
                </div>
            </div>

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
