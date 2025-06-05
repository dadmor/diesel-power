// src/app-templates/hooks/useVendorApp.ts
// Hook do zarządzania stanem aplikacji vendora

import { useState, useEffect } from 'react';
import { Vendor, VendorService } from '../../vendor_apps';

export const useVendorApp = (vendorSlug: string) => {
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
      setError(null);
      
      const vendors = await VendorService.getVendors();
      const foundVendor = vendors.find(v => v.slug === vendorSlug);
      
      if (!foundVendor) {
        setError(`Aplikacja "${vendorSlug}" nie została znaleziona`);
        return;
      }
      
      setVendor(foundVendor);
    } catch (err) {
      setError('Błąd ładowania aplikacji: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: any) => {
    setUser(userData);
    localStorage.setItem('currentUserId', userData.id.toString());
    localStorage.setItem('currentUserRole', userData.role);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserRole');
  };

  return {
    vendor,
    user,
    loading,
    error,
    login,
    logout,
    reload: loadVendor
  };
};