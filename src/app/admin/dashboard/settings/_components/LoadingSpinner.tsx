"use client";
import React, { memo } from 'react';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
};

const LoadingSpinner = memo<LoadingSpinnerProps>(({
    message = 'Loading...',
    size = 'md'
}) => (
    <div className="text-center py-12">
        <div
            className={`inline-block animate-spin rounded-full border-b-2 border-gray-900 ${sizeClasses[size]}`}
            role="status"
            aria-label="Loading"
        />
        {message && <p className="mt-2 text-gray-600">{message}</p>}
    </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
