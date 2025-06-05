// src/app-templates/AppRouter.tsx
// Router zarządzający ścieżkami w aplikacji na podstawie schematu

import React, { useState } from 'react';
import { Vendor } from '../vendor_apps';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { TablePage } from './pages/TablePage';
import { generateRoutes, generatePageConfig } from './utils/routeGenerator';

interface AppRouterProps {
  vendor: Vendor;
  user: any;
  initialPath: string;
  onLogout: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({ 
  vendor, 
  user, 
  initialPath, 
  onLogout 
}) => {
  const [currentPath, setCurrentPath] = useState(initialPath);
  
  const routes = generateRoutes(vendor);
  const pageConfig = generatePageConfig(vendor, currentPath, user.role);
  
  const renderPage = () => {
    if (currentPath === '/home') {
      return <HomePage vendor={vendor} user={user} config={pageConfig} />;
    }
    
    // Sprawdź czy to ścieżka tabeli
    const tableName = currentPath.replace(/^\/(?:admin\/|supervisor\/)?/, '');
    const table = vendor.schema.tables.find(t => t.name === tableName);
    
    if (table) {
      return (
        <TablePage 
          vendor={vendor}
          user={user}
          table={table}
          config={pageConfig}
          isAdminView={currentPath.startsWith('/admin/')}
          isSupervisorView={currentPath.startsWith('/supervisor/')}
        />
      );
    }
    
    return <div>Strona nie znaleziona: {currentPath}</div>;
  };

  return (
    <AppLayout
      vendor={vendor}
      user={user}
      routes={routes}
      currentPath={currentPath}
      onNavigate={setCurrentPath}
      onLogout={onLogout}
    >
      {renderPage()}
    </AppLayout>
  );
};