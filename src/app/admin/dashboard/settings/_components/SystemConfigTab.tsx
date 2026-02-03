"use client";
import React, { memo, useEffect, useCallback } from 'react';
import Switch from '@/components/common/Switch';
import { useSystemConfig } from '../hooks/useSystemConfig';
import SectionHeader from './SectionHeader';
import LoadingSpinner from './LoadingSpinner';
import { FILE_SIZE_OPTIONS, FILE_TYPES, LOGIN_METHODS } from '../utils';

interface CheckboxGroupProps {
    label: string;
    options: readonly string[];
    selected: string[];
    onToggle: (value: string) => void;
    format?: (value: string) => string;
}

const CheckboxGroup = memo<CheckboxGroupProps>(({
    label,
    options,
    selected,
    onToggle,
    format = (v) => v.charAt(0).toUpperCase() + v.slice(1)
}) => (
    <div className="mt-6">
        <p className="text-sm font-semibold">{label}</p>
        <div className="flex gap-5 mt-2 text-sm">
            {options.map((option) => (
                <label key={option} className="flex gap-1 items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selected.includes(option)}
                        onChange={() => onToggle(option)}
                    />
                    {format(option)}
                </label>
            ))}
        </div>
    </div>
));
CheckboxGroup.displayName = 'CheckboxGroup';

interface ConfigInputProps {
    label: string;
    type?: 'text' | 'email' | 'number';
    value: string | number;
    onChange: (value: string) => void;
}

const ConfigInput = memo<ConfigInputProps>(({ label, type = 'text', value, onChange }) => (
    <div>
        <p className="text-sm font-semibold">{label}</p>
        <input
            type={type}
            className="w-full border border-[#8A8A8A] rounded-sm p-2 mt-1"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
));
ConfigInput.displayName = 'ConfigInput';

interface SystemConfigTabProps {
    isActive: boolean;
}

export const SystemConfigTab = memo<SystemConfigTabProps>(({ isActive }) => {
    const {
        systemConfig,
        loading,
        fetchSystemConfig,
        handleUpdateSystemConfig,
        handleResetSystemConfig,
        updateConfigField,
        toggleLoginMethod,
        toggleFileType,
    } = useSystemConfig();

    useEffect(() => {
        if (isActive) {
            fetchSystemConfig();
        }
    }, [isActive, fetchSystemConfig]);

    const handleMaintenanceToggle = useCallback(() => {
        if (systemConfig) {
            updateConfigField('maintenance_mode', !systemConfig.maintenance_mode);
        }
    }, [systemConfig, updateConfigField]);

    if (!isActive) return null;

    return (
        <div>
            <SectionHeader
                title="Manage System Configuration"
                description="Platform-wide settings and environment configurations."
            />

            {loading ? (
                <div className="bg-white rounded-lg">
                    <LoadingSpinner message="Loading system configuration..." />
                </div>
            ) : !systemConfig ? (
                <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-500">Failed to load system configuration</p>
                </div>
            ) : (
                <>
                    {/* Maintenance Mode Box */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-sm">Maintenance Mode</h2>
                            <p className="text-[#4A5565] text-xs">
                                Enable maintenance mode to temporarily disable the platform
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch
                                checked={systemConfig.maintenance_mode}
                                onChange={handleMaintenanceToggle}
                            />
                            <span className="text-sm text-gray-600">
                                Maintenance Mode is {systemConfig.maintenance_mode ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    </div>

                    {/* Settings Grid */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
                        <div className="grid grid-cols-2 gap-6">
                            <ConfigInput
                                label="Platform Name"
                                value={systemConfig.platform_name}
                                onChange={(v) => updateConfigField('platform_name', v)}
                            />

                            <ConfigInput
                                label="Support Email"
                                type="email"
                                value={systemConfig.support_email}
                                onChange={(v) => updateConfigField('support_email', v)}
                            />

                            <ConfigInput
                                label="Maximum Users"
                                type="number"
                                value={systemConfig.maximum_users}
                                onChange={(v) => updateConfigField('maximum_users', parseInt(v) || 0)}
                            />

                            <div>
                                <p className="text-sm font-semibold">Max File Size (MB)</p>
                                <select
                                    className="w-full border border-[#8A8A8A] rounded-sm p-2 mt-1"
                                    value={systemConfig.max_file_size_mb}
                                    onChange={(e) => updateConfigField('max_file_size_mb', parseInt(e.target.value))}
                                >
                                    {FILE_SIZE_OPTIONS.map((size) => (
                                        <option key={size} value={size}>{size}MB</option>
                                    ))}
                                </select>
                            </div>

                            <ConfigInput
                                label="API Requests per hour"
                                type="number"
                                value={systemConfig.api_requests_per_hour}
                                onChange={(v) => updateConfigField('api_requests_per_hour', parseInt(v) || 0)}
                            />

                            <ConfigInput
                                label="File Uploads per hour"
                                type="number"
                                value={systemConfig.file_uploads_per_hour}
                                onChange={(v) => updateConfigField('file_uploads_per_hour', parseInt(v) || 0)}
                            />

                            <CheckboxGroup
                                label="Allowed Login Methods"
                                options={LOGIN_METHODS}
                                selected={systemConfig.allowed_login_methods}
                                onToggle={toggleLoginMethod}
                            />

                            <CheckboxGroup
                                label="Allowed File Types"
                                options={FILE_TYPES}
                                selected={systemConfig.allowed_file_types}
                                onToggle={toggleFileType}
                                format={(v) => v.toUpperCase()}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-4 mt-10">
                            <button
                                onClick={handleResetSystemConfig}
                                disabled={loading}
                                className="px-5 py-2 border border-black rounded-lg text-sm text-[#9E5559] hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Reset to Default
                            </button>

                            <button
                                onClick={handleUpdateSystemConfig}
                                disabled={loading}
                                className="px-6 py-2 bg-[#5E5EFF] text-white rounded-lg text-sm hover:bg-[#4E4EEF] transition disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

SystemConfigTab.displayName = 'SystemConfigTab';
