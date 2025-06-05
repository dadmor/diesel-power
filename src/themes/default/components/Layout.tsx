// src/themes/default/components/Layout.tsx
import React from 'react';


interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{title || 'Vendor App'}</h1>
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{user.email}</p>
                  <p className="text-xs text-gray-500">Zalogowany</p>
                </div>
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Wyloguj
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};
function useAuth(): { user: any; signOut: any; } {
  throw new Error('Function not implemented.');
}

