// ==================== CONSTANTS ====================
export const TABS = [
    'Feature Flags',
    'System configuration',
    'Security'
] as const;

export const LOGIN_METHODS = ['email', 'google', 'linkedin'] as const;

// ==================== HELPER FUNCTIONS ====================
export const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString()}`;
};

export const sanitizeNumericInput = (value: string, maxLength = 6): string => {
    return value.replace(/\D/g, '').slice(0, maxLength);
};
