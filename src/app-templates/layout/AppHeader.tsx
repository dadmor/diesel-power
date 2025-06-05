// src/app-templates/layout/AppHeader.tsx
// Header aplikacji

import React from 'react';
import { Vendor } from '../../vendor_apps';

interface AppHeaderProps {
  vendor: Vendor;
  user: any;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  vendor,
  user,
  onLogout,
  onToggleSidebar
}) => {
  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      'admin': 'Administrator',
      'supervisor': 'Supervisor',
      'agent': 'Agent',
      'customer': 'Klient'
    };
    return roleNames[role] || role;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            ☰
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {vendor.name}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700">
              {user.full_name || user.email}
            </div>
            <div className="text-xs text-gray-500">
              {getRoleName(user.role)}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </header>
  );
};