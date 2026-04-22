"use client";
import React, { memo, useCallback } from 'react';
import { TABS } from '../utils';
import { TabType } from '../types';

interface TabNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const TabNavigation = memo<TabNavigationProps>(({
    activeTab,
    onTabChange
}) => {
    const handleTabClick = useCallback((tab: string) => {
        onTabChange(tab as TabType);
    }, [onTabChange]);

    return (
        <div className="border-b border-gray-200 bg-white my-8 p-1 max-w-3xl flex items-center gap-4 text-sm rounded-lg">
            {TABS.map((tab) => (
                <button
                    key={tab}
                    onClick={() => handleTabClick(tab)}
                    className={`w-full font-semibold py-2 transition-colors duration-200 ${activeTab === tab
                        ? 'bg-[#ECECF0] rounded-lg px-4'
                        : 'hover:bg-gray-50 rounded-lg'
                        }`}
                    aria-selected={activeTab === tab}
                    role="tab"
                >
                    {tab}
                </button>
            ))}
        </div>
    );
});

TabNavigation.displayName = 'TabNavigation';

export default TabNavigation;
