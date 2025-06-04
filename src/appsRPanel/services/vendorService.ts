// services/vendorService.ts
const API_URL = "https://vvkjfzjikfuqdpmomdbx.supabase.co/rest/v1";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2a2pmemppa2Z1cWRwbW9tZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4OTE2NTcsImV4cCI6MjA2NDQ2NzY1N30.sVejmzInkxXnGxjm5rowJKuwTuVrcJ40Ix3Dk1W3ogE";

const getHeaders = (token?: string) => ({
  'apikey': API_KEY,
  'Authorization': `Bearer ${token || API_KEY}`,
  'Content-Type': 'application/json'
});

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  description: string;
  schema: {
    tables: Array<{
      name: string;
      description?: string;
      columns: Array<{
        name: string;
        type: string;
        required?: boolean;
        defaultValue?: any;
        validation?: any;
      }>;
    }>;
  };
  created_at: string;
  created_by?: string;
}

export interface VendorDataRecord {
  id: string;
  vendor_id: string;
  entity_type: string;
  data: any;
  created_at: string;
  created_by?: string;
}

export const vendorService = {
  async getVendors(token: string): Promise<Vendor[]> {
    const res = await fetch(`${API_URL}/vendors?select=*&order=created_at.desc`, {
      headers: getHeaders(token)
    });
    
    if (!res.ok) throw new Error('Failed to fetch vendors');
    
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async createVendor(vendor: Omit<Vendor, 'id' | 'created_at'>, token: string): Promise<Vendor> {
    const res = await fetch(`${API_URL}/vendors`, {
      method: 'POST',
      headers: { ...getHeaders(token), 'Prefer': 'return=representation' },
      body: JSON.stringify(vendor)
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create vendor');
    }
    
    const data = await res.json();
    return data[0];
  },

  async updateVendor(id: string, vendor: Partial<Vendor>, token: string): Promise<Vendor> {
    const res = await fetch(`${API_URL}/vendors?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...getHeaders(token), 'Prefer': 'return=representation' },
      body: JSON.stringify(vendor)
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update vendor');
    }
    
    const data = await res.json();
    return data[0];
  },

  async deleteVendor(id: string, token: string): Promise<void> {
    const res = await fetch(`${API_URL}/vendors?id=eq.${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete vendor');
    }
  },

  async getVendorData(vendorId: string, entityType: string, token: string): Promise<VendorDataRecord[]> {
    const res = await fetch(
      `${API_URL}/vendor_data?vendor_id=eq.${vendorId}&entity_type=eq.${entityType}&select=*&order=created_at.desc`,
      { headers: getHeaders(token) }
    );
    
    if (!res.ok) throw new Error('Failed to fetch vendor data');
    
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async createVendorData(
    vendorId: string, 
    entityType: string, 
    data: any, 
    userId: string, 
    token: string
  ): Promise<VendorDataRecord> {
    const res = await fetch(`${API_URL}/vendor_data`, {
      method: 'POST',
      headers: { ...getHeaders(token), 'Prefer': 'return=representation' },
      body: JSON.stringify({
        vendor_id: vendorId,
        entity_type: entityType,
        data: data,
        created_by: userId
      })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create vendor data');
    }
    
    const result = await res.json();
    return result[0];
  }
};