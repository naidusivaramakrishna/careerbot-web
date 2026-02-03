import React, { memo } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    fullScreen?: boolean;
}

const ErrorStateComponent: React.FC<ErrorStateProps> = ({
    message = 'Failed to load data',
    onRetry,
    fullScreen = false
}) => {
    const containerClass = fullScreen
        ? 'flex items-center justify-center min-h-screen'
        : 'flex items-center justify-center py-12';

    return (
        <div className={containerClass}>
            <div className="text-center max-w-md mx-auto px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#5E5EFF] text-white rounded-lg font-medium hover:bg-[#4E4EEF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#5E5EFF] focus:ring-offset-2"
                        type="button"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
};

// Memoize component
export const ErrorState = memo(ErrorStateComponent);
ErrorState.displayName = 'ErrorState';

export default ErrorState;
