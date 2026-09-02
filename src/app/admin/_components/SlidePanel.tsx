"use client";

import React from 'react';

interface SlidePanelProps {
    children: React.ReactNode;
    maxWidth?: string;
    loading?: boolean;
}

export const SlidePanel: React.FC<SlidePanelProps> = ({
    children,
    maxWidth = 'max-w-2xl',
    loading = false,
}) => {
    return (
        <div className={`fixed inset-0 flex items-center justify-end bg-black/50 z-50 ${loading ? '' : 'overflow-y-auto'}`}>
            <div className={`bg-white rounded-2xl rounded-tr-none rounded-br-none shadow-lg w-full ${maxWidth} p-6 relative ${loading ? '' : 'my-4 max-h-screen overflow-y-auto'}`}>
                {children}
            </div>
        </div>
    );
};
