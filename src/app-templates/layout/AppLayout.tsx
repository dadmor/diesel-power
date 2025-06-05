// src/app-templates/layout/AppLayout.tsx
// Layout aplikacji z nawigacją i headerem

import React from 'react';
import { Vendor } from '../../vendor_apps';
import { AppRoute } from '../utils/routeGenerator';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  vendor: Vendor;
  user: any;
  routes: AppRoute[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  vendor,
  user,
  routes,
  currentPath,
  onNavigate,
  onLogout,
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Filtruj routes na podstawie roli użytkownika
  const visibleRoutes = routes.filter(route => 
    route.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        vendor={vendor}
        user={user}
        onLogout={onLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex">
        <AppSidebar
          routes={visibleRoutes}
          currentPath={currentPath}
          onNavigate={onNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
