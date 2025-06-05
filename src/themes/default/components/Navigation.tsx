// src/themes/default/components/Navigation.tsx
import React from 'react';

interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  active?: boolean;
}

interface NavigationProps {
  items: NavigationItem[];
  onItemClick: (id: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ items, onItemClick }) => {
  return (
    <nav className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${item.active 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
};