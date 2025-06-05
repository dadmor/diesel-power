// src/themes/default/components/Tabs.tsx
import React from 'react';

interface Tab {
  id: string;
  name: string;
  description?: string;
  isCompleted?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ""
}) => {
  return (
    <div className={`flex gap-1 rounded-lg overflow-hidden bg-gray-100 p-1 shadow-inner ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isCompleted = tab.isCompleted;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm rounded-md transition-all duration-200 flex items-center gap-2 ${
              isActive
                ? "bg-white text-blue-600 shadow-sm font-medium"
                : isCompleted
                ? "bg-green-50 text-green-700 hover:bg-green-100"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{tab.name}</span>
            {isCompleted && <span className="text-green-500">✓</span>}
          </button>
        );
      })}
    </div>
  );
};