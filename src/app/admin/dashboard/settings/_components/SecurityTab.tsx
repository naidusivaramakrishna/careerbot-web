"use client";
import React, { memo, useEffect, useCallback, ChangeEvent } from 'react';
import LoadingSpinner from './LoadingSpinner';
import SectionHeader from './SectionHeader';
import { sanitizeNumericInput } from '../utils';
import { Setup2FAResponse } from '../types';

// ==================== SUB-COMPONENTS ====================

interface StatusBadgeProps {
    enabled: boolean;
}

const StatusBadge = memo<StatusBadgeProps>(({ enabled }) => (
    <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${enabled
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
        {enabled ? '✓ Enabled' : '⚠ Disabled'}
    </div>
));
StatusBadge.displayName = 'StatusBadge';

interface InfoBoxProps {
    variant: 'blue' | 'green' | 'yellow';
    children: React.ReactNode;
}

const InfoBox = memo<InfoBoxProps>(({ variant, children }) => {
    const variantClasses = {
        blue: 'bg-blue-50 border-blue-200',
        green: 'bg-green-50 border-green-200',
        yellow: 'bg-yellow-50 border-yellow-200',
    };

    return (
        <div className={`border rounded-lg p-4 mb-6 ${variantClasses[variant]}`}>
            {children}
        </div>
    );
});
InfoBox.displayName = 'InfoBox';

interface BackupCodesDisplayProps {
    codes: string[];
}

const BackupCodesDisplay = memo<BackupCodesDisplayProps>(({ codes }) => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-2">
            {codes.map((code, index) => (
                <code
                    key={index}
                    className="bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono text-center"
                >
                    {code}
                </code>
            ))}
        </div>
    </div>
));
BackupCodesDisplay.displayName = 'BackupCodesDisplay';

// ==================== SETUP COMPONENTS ====================

interface SetupInitialProps {
    loading: boolean;
    onSetup: () => void;
}

const SetupInitial = memo<SetupInitialProps>(({ loading, onSetup }) => (
    <div>
        <InfoBox variant="blue">
            <h3 className="font-semibold text-sm text-blue-900 mb-2">Why enable 2FA?</h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li className="list-disc">Protects your admin account from unauthorized access</li>
                <li className="list-disc">Requires both password and time-based code to login</li>
                <li className="list-disc">Industry best practice for admin accounts</li>
            </ul>
        </InfoBox>

        <button
            onClick={onSetup}
            disabled={loading}
            className="bg-[#5E5EFF] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4E4EEF] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
        </button>
    </div>
));
SetupInitial.displayName = 'SetupInitial';

interface SetupQRCodeProps {
    qrCodeUrl: string;
    secret: string;
    backupCodes: string[];
    totpCode: string;
    loading: boolean;
    onTotpChange: (code: string) => void;
    onEnable: () => void;
    onCancel: () => void;
}

const SetupQRCode = memo<SetupQRCodeProps>(({
    qrCodeUrl,
    secret,
    backupCodes,
    totpCode,
    loading,
    onTotpChange,
    onEnable,
    onCancel,
}) => {
    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        onTotpChange(sanitizeNumericInput(e.target.value, 6));
    }, [onTotpChange]);

    return (
        <div>
            {/* Step 1: QR Code */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-base mb-4">Step 1: Scan QR Code</h3>
                <p className="text-sm text-[#4A5565] mb-4">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>

                <div className="flex justify-center my-6">
                    <img
                        src={qrCodeUrl}
                        alt="2FA QR Code"
                        className="border-4 border-gray-300 rounded-lg"
                        style={{ width: '250px', height: '250px' }}
                    />
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-xs text-[#4A5565] mb-2">Or enter this code manually:</p>
                    <code className="bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono block text-center">
                        {secret}
                    </code>
                </div>
            </div>

            {/* Step 2: Backup Codes */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-base mb-4">Step 2: Backup Codes</h3>
                <p className="text-sm text-[#4A5565] mb-4">
                    Save these backup codes in a secure location. You can use them to access your account if you lose your device.
                </p>
                <BackupCodesDisplay codes={backupCodes} />
            </div>

            {/* Step 3: Verify */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-base mb-4">Step 3: Verify Code</h3>
                <p className="text-sm text-[#4A5565] mb-4">
                    Enter the 6-digit code from your authenticator app to complete setup
                </p>

                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-sm font-semibold mb-2 block">Verification Code</label>
                        <input
                            type="text"
                            value={totpCode}
                            onChange={handleInputChange}
                            placeholder="000000"
                            maxLength={6}
                            className="w-full border border-gray-300 rounded-lg p-3 text-center text-lg font-mono tracking-widest"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onEnable}
                        disabled={loading || totpCode.length !== 6}
                        className="bg-[#5E5EFF] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4E4EEF] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Complete Setup'}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
});
SetupQRCode.displayName = 'SetupQRCode';

interface DisableSectionProps {
    password: string;
    loading: boolean;
    onPasswordChange: (password: string) => void;
    onDisable: () => void;
}

const DisableSection = memo<DisableSectionProps>(({
    password,
    loading,
    onPasswordChange,
    onDisable,
}) => {
    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        onPasswordChange(e.target.value);
    }, [onPasswordChange]);

    return (
        <div>
            <InfoBox variant="green">
                <p className="text-sm text-green-800">
                    ✓ Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when logging in.
                </p>
            </InfoBox>

            <div className="bg-white border border-red-200 rounded-lg p-6">
                <h3 className="font-semibold text-base mb-2 text-red-700">Disable Two-Factor Authentication</h3>
                <p className="text-sm text-[#4A5565] mb-4">
                    Disabling 2FA will make your account less secure. Enter your password to confirm.
                </p>

                <div className="max-w-md">
                    <label className="text-sm font-semibold mb-2 block">Current Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        className="w-full border border-gray-300 rounded-lg p-3 mb-4"
                    />

                    <button
                        onClick={onDisable}
                        disabled={loading || !password}
                        className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                </div>
            </div>
        </div>
    );
});
DisableSection.displayName = 'DisableSection';

// ==================== MAIN COMPONENT ====================

interface SecurityTabProps {
    isActive: boolean;
    twoFAEnabled: boolean;
    twoFASetupData: Setup2FAResponse | null;
    showQRCode: boolean;
    totpCode: string;
    disablePassword: string;
    loading: boolean;
    onFetch: () => void;
    onSetTotpCode: (code: string) => void;
    onSetDisablePassword: (password: string) => void;
    onSetup2FA: () => void;
    onEnable2FA: () => void;
    onDisable2FA: () => void;
    onCancelSetup: () => void;
}

const SecurityTab = memo<SecurityTabProps>(({
    isActive,
    twoFAEnabled,
    twoFASetupData,
    showQRCode,
    totpCode,
    disablePassword,
    loading,
    onFetch,
    onSetTotpCode,
    onSetDisablePassword,
    onSetup2FA,
    onEnable2FA,
    onDisable2FA,
    onCancelSetup,
}) => {
    useEffect(() => {
        if (isActive) {
            onFetch();
        }
    }, [isActive, onFetch]);

    if (!isActive) return null;

    return (
        <div>
            <SectionHeader
                title="Security Settings"
                description="Manage your account security and two-factor authentication."
            />

            {loading && !twoFASetupData ? (
                <div className="bg-white rounded-lg">
                    <LoadingSpinner message="Loading security settings..." />
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    {/* 2FA Status Card */}
                    <div className="border-b border-gray-200 pb-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-base">Two-Factor Authentication (2FA)</h2>
                                <p className="text-sm text-[#4A5565] mt-1">
                                    Add an extra layer of security to your admin account
                                </p>
                            </div>
                            <StatusBadge enabled={twoFAEnabled} />
                        </div>
                    </div>

                    {/* Conditional Content */}
                    {!twoFAEnabled && !showQRCode && (
                        <SetupInitial loading={loading} onSetup={onSetup2FA} />
                    )}

                    {!twoFAEnabled && showQRCode && twoFASetupData && (
                        <SetupQRCode
                            qrCodeUrl={twoFASetupData.qr_code_url}
                            secret={twoFASetupData.secret}
                            backupCodes={twoFASetupData.backup_codes}
                            totpCode={totpCode}
                            loading={loading}
                            onTotpChange={onSetTotpCode}
                            onEnable={onEnable2FA}
                            onCancel={onCancelSetup}
                        />
                    )}

                    {twoFAEnabled && (
                        <DisableSection
                            password={disablePassword}
                            loading={loading}
                            onPasswordChange={onSetDisablePassword}
                            onDisable={onDisable2FA}
                        />
                    )}
                </div>
            )}
        </div>
    );
});

SecurityTab.displayName = 'SecurityTab';

export default SecurityTab;
