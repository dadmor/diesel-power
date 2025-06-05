// src/app-templates/layout/AppSidebar.tsx
// Sidebar z nawigacją

import React from 'react';
import { AppRoute } from '../utils/routeGenerator';

interface AppSidebarProps {
  routes: AppRoute[];
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  routes,
  currentPath,
  onNavigate,
  isOpen,
  onClose
}) => {
  // Grupuj routes według kategorii
  const groupedRoutes = routes.reduce((acc, route) => {
    const category = route.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(route);
    return acc;
  }, {} as Record<string, AppRoute[]>);

  const categoryNames: Record<string, string> = {
    'main': 'Główne',
    'tables': 'Moduły',
    'admin': 'Administracja',
    'supervisor': 'Zarządzanie'
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <nav className="p-4 space-y-6">
          {Object.entries(groupedRoutes).map(([category, categoryRoutes]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {categoryNames[category] || category}
              </h3>
              <div className="space-y-1">
                {categoryRoutes.map(route => (
                  <button
                    key={route.path}
                    onClick={() => {
                      onNavigate(route.path);
                      onClose();
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      flex items-center space-x-3
                      ${currentPath === route.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="text-lg">{route.icon}</span>
                    <span>{route.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};