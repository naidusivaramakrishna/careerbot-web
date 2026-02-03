"use client";
import React, { memo } from 'react';

interface EmptyStateProps {
    message: string;
    className?: string;
}

const EmptyState = memo<EmptyStateProps>(({
    message,
    className = ''
}) => (
    <div className={`text-center py-12 bg-white rounded-lg border border-gray-200 ${className}`}>
        <p className="text-gray-500">{message}</p>
    </div>
));

EmptyState.displayName = 'EmptyState';

export default EmptyState;
