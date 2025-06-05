import React, { useState, useEffect } from 'react';
import { AuthForm, AuthProvider, useAuth } from "./vendor_apps";
import { VendorListWithTheme } from "./vendor_apps/components/vendor/VendorListWithTheme";
import { DynamicVendorApp } from "./app-templates";

// Router główny aplikacji
const AppRouter = () => {
  const [currentRoute, setCurrentRoute] = useState('');
  const [vendorSlug, setVendorSlug] = useState('');
  const [appPath, setAppPath] = useState('/home');

  useEffect(() => {
    // Parsuj URL aby określić czy to panel admin czy aplikacja vendora
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    if (segments.length === 0) {
      // Główna strona - panel admin
      setCurrentRoute('admin');
    } else if (segments[0] === 'admin') {
      // Ścieżka /admin - panel admin
      setCurrentRoute('admin');
    } else {
      // Wszystko inne to aplikacja vendora: /helpdesk/tickets
      setCurrentRoute('vendor-app');
      setVendorSlug(segments[0]);
      setAppPath('/' + segments.slice(1).join('/') || '/home');
    }

    // Listener dla zmian URL
    const handlePopState = () => {
      window.location.reload(); // Proste rozwiązanie - reload przy zmianie URL
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Funkcja nawigacji do aplikacji vendora
  const navigateToVendorApp = (slug: string, path = '/home') => {
    const url = `/${slug}${path}`;
    window.history.pushState({}, '', url);
    setCurrentRoute('vendor-app');
    setVendorSlug(slug);
    setAppPath(path);
  };

  // Funkcja powrotu do panelu admin
  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setCurrentRoute('admin');
    setVendorSlug('');
    setAppPath('/home');
  };

  if (currentRoute === 'vendor-app' && vendorSlug) {
    return (
      <DynamicVendorApp 
        vendorSlug={vendorSlug}
        initialPath={appPath}
        onBackToAdmin={navigateToAdmin}
      />
    );
  }

  // Panel administracyjny
  return (
    <AdminPanel 
      onNavigateToVendor={navigateToVendorApp}
    />
  );
};

// Rozszerzony panel admin z możliwością nawigacji do aplikacji
const AdminPanel = ({ onNavigateToVendor }: { onNavigateToVendor: (slug: string) => void }) => {
  return (
    <VendorListWithTheme 
      onOpenVendorApp={onNavigateToVendor}
    />
  );
};

// Rozszerzony DynamicVendorApp z przyciskiem powrotu
const EnhancedDynamicVendorApp = ({ 
  vendorSlug, 
  initialPath, 
  onBackToAdmin 
}: {
  vendorSlug: string;
  initialPath: string;
  onBackToAdmin: () => void;
}) => {
  return (
    <div>
      {/* Pasek nawigacji z powrotem do admin */}
      <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToAdmin}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <span>←</span>
            <span>Powrót do panelu admin</span>
          </button>
          <span className="text-gray-400">|</span>
          <span className="font-medium">Aplikacja: {vendorSlug}</span>
        </div>
        <div className="text-sm text-gray-400">
          Ścieżka: {initialPath}
        </div>
      </div>
      
      {/* Aplikacja vendora */}
      <DynamicVendorApp 
        vendorSlug={vendorSlug}
        initialPath={initialPath}
      />
    </div>
  );
};

// Główny komponent aplikacji
const AppContent = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          Ładowanie...
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <AuthForm />;
  }
  
  return <AppRouter />;
};

// Główna aplikacja
const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;