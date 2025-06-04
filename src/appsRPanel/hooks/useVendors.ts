// hooks/useVendors.ts
import { useState, useCallback } from 'react';
import { vendorService, type Vendor } from '../services/vendorService';
import { validate } from '../validator';

export const useVendors = (token?: string) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadVendors = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await vendorService.getVendors(token);
      setVendors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createVendor = useCallback(async (vendorData: any, userId: string) => {
    if (!token) throw new Error('No token');
    
    // Validate first
    const validation = validate(vendorData);
    if (!validation.success) {
      throw new Error(`Validation errors: ${validation.errors?.join(', ')}`);
    }
    
    setLoading(true);
    try {
      const newVendor = await vendorService.createVendor({
        ...validation.data,
        created_by: userId
      }, token);
      
      setVendors(prev => [newVendor, ...prev]);
      return newVendor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateVendor = useCallback(async (id: string, vendorData: any) => {
    if (!token) throw new Error('No token');
    
    // Validate first
    const validation = validate(vendorData);
    if (!validation.success) {
      throw new Error(`Validation errors: ${validation.errors?.join(', ')}`);
    }
    
    setLoading(true);
    try {
      const updatedVendor = await vendorService.updateVendor(id, validation.data, token);
      
      setVendors(prev => prev.map(v => v.id === id ? updatedVendor : v));
      return updatedVendor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vendor');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteVendor = useCallback(async (id: string) => {
    if (!token) throw new Error('No token');
    
    setLoading(true);
    try {
      await vendorService.deleteVendor(id, token);
      setVendors(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vendor');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    vendors,
    loading,
    error,
    loadVendors,
    createVendor,
    updateVendor,
    deleteVendor,
    clearError: () => setError('')
  };
};

// hooks/useVendorData.ts
export const useVendorData = (token?: string) => {
  const [vendorData, setVendorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadVendorData = useCallback(async (vendorId: string, entityType: string) => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await vendorService.getVendorData(vendorId, entityType, token);
      setVendorData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendor data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createVendorData = useCallback(async (
    vendorId: string, 
    entityType: string, 
    data: any, 
    userId: string
  ) => {
    if (!token) throw new Error('No token');
    
    setLoading(true);
    try {
      const newRecord = await vendorService.createVendorData(vendorId, entityType, data, userId, token);
      setVendorData(prev => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    vendorData,
    loading,
    error,
    loadVendorData,
    createVendorData,
    clearError: () => setError('')
  };
};