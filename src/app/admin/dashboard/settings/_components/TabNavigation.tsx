"use client";
import React, { memo, useCallback } from 'react';
import { TABS } from '../utils';
import { TabType } from '../types';

interface TabNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    disabledTabs?: TabType[];
}

const TabNavigation = memo<TabNavigationProps>(({
    activeTab,
    onTabChange,
    disabledTabs = []
}) => {
    const handleTabClick = useCallback((tab: string, isDisabled: boolean) => {
        if (!isDisabled) {
            onTabChange(tab as TabType);
        }
    }, [onTabChange]);

    return (
        <div className="border-b border-gray-200 bg-white my-8 p-1 max-w-3xl flex items-center gap-4 text-sm rounded-lg">
            {(TABS as unknown as TabType[]).map((tab) => {
                const isDisabled = disabledTabs.includes(tab);
                return (
                    <button
                        key={tab}
                        onClick={() => handleTabClick(tab, isDisabled)}
                        disabled={isDisabled}
                        className={`w-full font-semibold py-2 transition-colors duration-200 rounded-lg px-4 ${
                            isDisabled
                                ? 'text-gray-400 bg-gray-50 cursor-not-allowed opacity-60'
                                : activeTab === tab
                                ? 'bg-[#ECECF0] text-gray-900'
                                : 'hover:bg-gray-50 text-gray-700'
                        }`}
                        aria-selected={activeTab === tab}
                        aria-disabled={isDisabled}
                        role="tab"
                        title={isDisabled ? 'You do not have permission to access this section' : ''}
                    >
                        {tab}
                    </button>
                );
            })}
        </div>
    );
});

TabNavigation.displayName = 'TabNavigation';

export default TabNavigation;
