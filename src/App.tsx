import React from 'react';
import { AuthForm, AuthProvider, useAuth, VendorList } from './vendor_apps';


const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        Ładowanie...
      </div>
    );
  }
  
  if (!user) {
    return <AuthForm />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Multi-Tenant System</h1>
            <p className="text-sm text-gray-600">Zarządzanie dostawcami</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user.email}</span>
            <button
              onClick={signOut}
              className="text-blue-600 hover:underline"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </header>
      <VendorList />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;