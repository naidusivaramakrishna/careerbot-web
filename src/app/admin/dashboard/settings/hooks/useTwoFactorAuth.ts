"use client";
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
    getCurrentAdmin,
    setup2FA,
    enable2FA,
    disable2FA
} from '@/api/adminAuthApi';
import { AdminData, Setup2FAResponse } from '../types';
import { logger } from '@/lib/logger';

interface UseTwoFactorAuthReturn {
    twoFAEnabled: boolean;
    twoFASetupData: Setup2FAResponse | null;
    showQRCode: boolean;
    totpCode: string;
    disablePassword: string;
    loading: boolean;
    adminData: AdminData | null;
    showDisableConfirmModal: boolean;
    setTotpCode: (code: string) => void;
    setDisablePassword: (password: string) => void;
    fetchAdminData: () => Promise<void>;
    handleSetup2FA: () => Promise<void>;
    handleEnable2FA: () => Promise<void>;
    handleDisable2FA: () => void;
    confirmDisable2FA: () => Promise<void>;
    cancelDisable2FA: () => void;
    handleCancelSetup: () => void;
}

export const useTwoFactorAuth = (): UseTwoFactorAuthReturn => {
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [twoFASetupData, setTwoFASetupData] = useState<Setup2FAResponse | null>(null);
    const [showQRCode, setShowQRCode] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [adminData, setAdminData] = useState<AdminData | null>(null);
    const [showDisableConfirmModal, setShowDisableConfirmModal] = useState(false);

    const fetchAdminData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCurrentAdmin();
            setAdminData(data);
            setTwoFAEnabled(data.totp_enabled);
        } catch (error: unknown) {
            logger.error('Error fetching admin data:', error);
            toast.error('Failed to fetch admin details');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSetup2FA = useCallback(async () => {
        try {
            setLoading(true);
            const response = await setup2FA();
            setTwoFASetupData(response);
            setShowQRCode(true);
            toast.success('2FA setup initiated. Scan the QR code with your authenticator app.');
        } catch (error: unknown) {
            logger.error('Error setting up 2FA:', error);
            const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to setup 2FA';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleEnable2FA = useCallback(async () => {
        if (!twoFASetupData) {
            toast.error('Please setup 2FA first');
            return;
        }

        if (!totpCode || totpCode.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        try {
            setLoading(true);
            await enable2FA({
                secret: twoFASetupData.secret,
                totp_code: totpCode,
                backup_codes: twoFASetupData.backup_codes,
            });

            toast.success('2FA enabled successfully!');
            setTwoFAEnabled(true);
            setShowQRCode(false);
            setTotpCode('');
            setTwoFASetupData(null);

            // Refresh admin data
            fetchAdminData();
        } catch (error: unknown) {
            logger.error('Error enabling 2FA:', error);
            const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to enable 2FA. Please check your code.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [twoFASetupData, totpCode, fetchAdminData]);

    const handleDisable2FA = useCallback(() => {
        if (!disablePassword) {
            toast.error('Please enter your password to disable 2FA');
            return;
        }

        setShowDisableConfirmModal(true);
    }, [disablePassword]);

    const confirmDisable2FA = useCallback(async () => {
        try {
            setLoading(true);
            await disable2FA(disablePassword);

            toast.success('2FA disabled successfully');
            setTwoFAEnabled(false);
            setDisablePassword('');
            setShowDisableConfirmModal(false);

            // Refresh admin data
            fetchAdminData();
        } catch (error: unknown) {
            logger.error('Error disabling 2FA:', error);
            const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to disable 2FA. Please check your password.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [disablePassword, fetchAdminData]);

    const cancelDisable2FA = useCallback(() => {
        setShowDisableConfirmModal(false);
    }, []);

    const handleCancelSetup = useCallback(() => {
        setShowQRCode(false);
        setTwoFASetupData(null);
        setTotpCode('');
    }, []);

    return {
        twoFAEnabled,
        twoFASetupData,
        showQRCode,
        totpCode,
        disablePassword,
        loading,
        adminData,
        showDisableConfirmModal,
        setTotpCode,
        setDisablePassword,
        fetchAdminData,
        handleSetup2FA,
        handleEnable2FA,
        handleDisable2FA,
        confirmDisable2FA,
        cancelDisable2FA,
        handleCancelSetup,
    };
};
