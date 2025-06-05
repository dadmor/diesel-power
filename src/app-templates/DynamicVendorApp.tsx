// src/app-templates/DynamicVendorApp.tsx
// Główny komponent uruchamiający aplikację vendora na podstawie slug'a

import React, { useState, useEffect } from 'react';
import { Vendor, VendorService } from '../vendor_apps';
import { AppRouter } from './AppRouter';
import { LoginScreen } from './auth/LoginScreen';
import { LoadingScreen } from './ui/LoadingScreen';
import { ErrorScreen } from './ui/ErrorScreen';

interface DynamicVendorAppProps {
  vendorSlug: string;
  initialPath?: string;
}

export const DynamicVendorApp: React.FC<DynamicVendorAppProps> = ({ 
  vendorSlug, 
  initialPath = '/home' 
}) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVendor();
  }, [vendorSlug]);

  const loadVendor = async () => {
    try {
      setLoading(true);
      const vendors = await VendorService.getVendors();
      const foundVendor = vendors.find(v => v.slug === vendorSlug);
      
      if (!foundVendor) {
        setError(`Aplikacja "${vendorSlug}" nie została znaleziona`);
        return;
      }
      
      setVendor(foundVendor);
    } catch (err) {
      setError('Błąd ładowania aplikacji');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen vendorSlug={vendorSlug} />;
  if (error || !vendor) return <ErrorScreen error={error} />;
  if (!user) return <LoginScreen vendor={vendor} onLogin={setUser} />;

  return (
    <AppRouter 
      vendor={vendor} 
      user={user} 
      initialPath={initialPath}
      onLogout={() => setUser(null)}
    />
  );
};
