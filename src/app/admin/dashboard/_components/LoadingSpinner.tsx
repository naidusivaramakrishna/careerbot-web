import React, { memo } from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
    fullScreen?: boolean;
}

const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-3',
    lg: 'h-16 w-16 border-4'
} as const;

const LoadingSpinnerComponent: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    message = 'Loading...',
    fullScreen = false
}) => {
    const containerClass = fullScreen
        ? 'flex items-center justify-center min-h-screen'
        : 'flex items-center justify-center py-12';

    return (
        <div className={containerClass}>
            <div className="text-center">
                <div className="relative inline-flex">
                    <div
                        className={`animate-spin rounded-full border-b-[#5E5EFF] border-t-transparent border-l-transparent border-r-transparent ${sizeClasses[size]}`}
                        style={{
                            animationDuration: '0.8s',
                            willChange: 'transform'
                        }}
                    />
                    <div
                        className={`absolute inset-0 animate-spin rounded-full border-b-transparent border-t-[#5E5EFF] border-l-transparent border-r-transparent ${sizeClasses[size]}`}
                        style={{
                            animationDuration: '1.2s',
                            animationDirection: 'reverse',
                            willChange: 'transform'
                        }}
                    />
                </div>
                {message && (
                    <p className="mt-4 text-gray-600 text-sm font-medium animate-pulse">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

// Memoize component
export const LoadingSpinner = memo(LoadingSpinnerComponent);
LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
