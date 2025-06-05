import { VendorListWithTheme } from "./vendor_apps/components/vendor/VendorListWithTheme";
import { AuthForm, AuthProvider, useAuth } from "./vendor_apps";

// Main App Content Component
const AppContent = () => {
  const { user, loading, signOut } = useAuth();

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

  return <VendorListWithTheme />;
};

// Main App Component
const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
