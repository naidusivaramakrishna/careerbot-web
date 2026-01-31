"use client";
import React, { memo, ReactNode } from 'react';

interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

const SectionHeader = memo<SectionHeaderProps>(({
    title,
    description,
    action
}) => (
    <div className="flex justify-between items-center my-4">
        <div>
            <h1 className="font-semibold text-lg">{title}</h1>
            {description && (
                <p className="text-[#4A5565] text-xs">{description}</p>
            )}
        </div>
        {action}
    </div>
));

SectionHeader.displayName = 'SectionHeader';

export default SectionHeader;
