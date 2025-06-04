import React, { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, AuthError } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://vvkjfzjikfuqdpmomdbx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2a2pmemppa2Z1cWRwbW9tZGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4OTE2NTcsImV4cCI6MjA2NDQ2NzY1N30.sVejmzInkxXnGxjm5rowJKuwTuVrcJ40Ix3Dk1W3ogE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
interface VendorColumn {
  name: string;
  type: 'text' | 'integer' | 'boolean' | 'timestamp';
  required?: boolean;
  enum?: string[];
}

interface VendorTable {
  name: string;
  columns: VendorColumn[];
}

interface VendorSchema {
  tables: VendorTable[];
}

interface Vendor {
  id?: string;
  slug: string;
  name: string;
  schema: VendorSchema;
  created_at?: string;
  created_by?: string;
  table_status?: 'pending' | 'created' | 'error';
}

// Auth Context
const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

// Auth Provider
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Edge Function Service
class EdgeFunctionService {
  static async createVendorTables(vendor: Vendor): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${supabaseUrl}/functions/v1/create-vendor-tables`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendor_id: vendor.id,
        slug: vendor.slug,
        schema: vendor.schema,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create tables');
    }
    
    return result;
  }

  static async dropVendorTables(vendor: Vendor): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${supabaseUrl}/functions/v1/drop-vendor-tables`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendor_id: vendor.id,
        slug: vendor.slug,
        schema: vendor.schema,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to drop tables');
    }
  }

  static async getTableData(vendorSlug: string, tableName: string): Promise<any[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${supabaseUrl}/functions/v1/get-table-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendor_slug: vendorSlug,
        table_name: tableName,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to get table data');
    }
    
    return result.data || [];
  }

  static async insertTableData(vendorSlug: string, tableName: string, data: any): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${supabaseUrl}/functions/v1/insert-table-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendor_slug: vendorSlug,
        table_name: tableName,
        data: data,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to insert data');
    }
  }
}

// Vendor Service
class VendorService {
  static async getVendors(): Promise<Vendor[]> {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  static async createVendor(vendor: Omit<Vendor, 'id' | 'created_at' | 'created_by'>): Promise<Vendor> {
    // Create the vendor record
    const { data, error } = await supabase
      .from('vendors')
      .insert([{ ...vendor, table_status: 'pending' }])
      .select()
      .single();
    
    if (error) throw error;
    
    try {
      // Create the actual SQL tables using Edge Function
      await EdgeFunctionService.createVendorTables(data);
      
      // Update status to created
      await supabase
        .from('vendors')
        .update({ table_status: 'created' })
        .eq('id', data.id);
      
      return { ...data, table_status: 'created' };
    } catch (tableError) {
      // Update status to error
      await supabase
        .from('vendors')
        .update({ table_status: 'error' })
        .eq('id', data.id);
      
      throw new Error(`Failed to create tables: ${tableError.message}`);
    }
  }
  
  static async updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor> {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async deleteVendor(vendor: Vendor): Promise<void> {
    try {
      // Drop the tables using Edge Function
      await EdgeFunctionService.dropVendorTables(vendor);
    } catch (error) {
      console.warn('Error dropping tables:', error);
      // Continue with vendor deletion even if table drop fails
    }
    
    // Delete the vendor record
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendor.id);
    
    if (error) throw error;
  }
}

// Auth Component
const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useContext(AuthContext);
  
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        await signUp(email, password);
        alert('Check your email for verification link!');
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h2>
          <p className="text-center text-gray-600 mt-2">Multi-Tenant Vendor System</p>
          <p className="text-center text-green-600 text-sm mt-1">🚀 With Real SQL Tables via Edge Functions</p>
        </div>
        
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:text-blue-500"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Vendor Form Component
const VendorForm: React.FC<{
  vendor?: Vendor;
  onSave: (vendor: Omit<Vendor, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
  onCancel: () => void;
}> = ({ vendor, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    slug: vendor?.slug || '',
    name: vendor?.name || '',
    schemaJson: vendor ? JSON.stringify(vendor.schema, null, 2) : `{
  "tables": [
    {
      "name": "tickets",
      "columns": [
        {"name": "title", "type": "text", "required": true},
        {"name": "description", "type": "text"},
        {"name": "status", "type": "text", "enum": ["open", "in_progress", "closed"]},
        {"name": "priority", "type": "text", "enum": ["low", "medium", "high"]},
        {"name": "assigned_to", "type": "text"}
      ]
    },
    {
      "name": "users", 
      "columns": [
        {"name": "name", "type": "text", "required": true},
        {"name": "email", "type": "text", "required": true},
        {"name": "role", "type": "text", "enum": ["admin", "agent", "customer"]},
        {"name": "active", "type": "boolean"}
      ]
    }
  ]
}`
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const schema = JSON.parse(formData.schemaJson);
      await onSave({
        slug: formData.slug,
        name: formData.name,
        schema
      });
    } catch (err: any) {
      setError(err.message || 'Invalid JSON schema');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {vendor ? 'Edit Vendor' : 'Create New Vendor'}
        </h3>
        <p className="text-sm text-green-600 mb-4">
          ⚡ This will create REAL SQL tables: {formData.slug}_tablename
        </p>
        
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              pattern="[a-z0-9\\-]+"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="helpdesk-app"
            />
            <p className="text-xs text-gray-500">Only lowercase letters, numbers, and hyphens</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Helpdesk System"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Schema (JSON)</label>
            <textarea
              value={formData.schemaJson}
              onChange={(e) => setFormData({ ...formData, schemaJson: e.target.value })}
              required
              rows={18}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating Real Tables...' : 'Create Vendor & Tables'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Table Data Manager Component
const TableDataManager: React.FC<{ vendor: Vendor; onClose: () => void }> = ({ vendor, onClose }) => {
  const [selectedTable, setSelectedTable] = useState(vendor.schema.tables[0]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [newRecord, setNewRecord] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    loadTableData();
  }, [selectedTable]);
  
  const loadTableData = async () => {
    if (!selectedTable || vendor.table_status !== 'created') return;
    
    setLoading(true);
    setError('');
    try {
      const data = await EdgeFunctionService.getTableData(vendor.slug, selectedTable.name);
      setTableData(data);
    } catch (err: any) {
      setError('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddRecord = async () => {
    if (!selectedTable || vendor.table_status !== 'created') return;
    
    try {
      await EdgeFunctionService.insertTableData(vendor.slug, selectedTable.name, newRecord);
      setNewRecord({});
      await loadTableData();
    } catch (err: any) {
      setError('Error adding record: ' + err.message);
    }
  };
  
  if (vendor.table_status !== 'created') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold mb-4">Tables Not Ready</h3>
          <p className="text-gray-600 mb-4">
            Status: <span className="font-medium">{vendor.table_status}</span>
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {vendor.table_status === 'pending' && 'Tables are being created...'}
            {vendor.table_status === 'error' && 'Error creating tables. Please try recreating the vendor.'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold">Manage Real SQL Tables: {vendor.name}</h3>
            <p className="text-sm text-green-600">✅ Connected to live PostgreSQL tables</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Table</label>
          <select
            value={selectedTable?.name || ''}
            onChange={(e) => {
              const table = vendor.schema.tables.find(t => t.name === e.target.value);
              setSelectedTable(table!);
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {vendor.schema.tables.map((table) => (
              <option key={table.name} value={table.name}>
                🗃️ {vendor.slug}_{table.name} ({table.columns.length} columns)
              </option>
            ))}
          </select>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {selectedTable && (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium mb-3 text-green-800">📝 Add New Record to SQL Table</h4>
              <div className="grid grid-cols-2 gap-4">
                {selectedTable.columns.map((column) => (
                  <div key={column.name}>
                    <label className="block text-sm font-medium text-gray-700">
                      {column.name} {column.required && <span className="text-red-500">*</span>}
                    </label>
                    {column.enum ? (
                      <select
                        value={newRecord[column.name] || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, [column.name]: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select {column.name}</option>
                        {column.enum.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : column.type === 'boolean' ? (
                      <select
                        value={newRecord[column.name] || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, [column.name]: e.target.value === 'true' })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select {column.name}</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <input
                        type={column.type === 'integer' ? 'number' : 'text'}
                        value={newRecord[column.name] || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, [column.name]: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Enter ${column.name}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddRecord}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                ➕ Insert into SQL Table
              </button>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">🗄️ Live SQL Data ({tableData.length} records)</h4>
              {loading ? (
                <div className="text-center py-4">Loading from SQL table...</div>
              ) : tableData.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <p className="text-lg mb-2">📊 SQL Table is Empty</p>
                  <p>Add some data above to see it here!</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        {selectedTable.columns.map((column) => (
                          <th key={column.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {column.name}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableData.map((record, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.id}</td>
                          {selectedTable.columns.map((column) => (
                            <td key={column.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record[column.name]?.toString() || '-'}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.created_at ? new Date(record.created_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Vendor List Component
const VendorList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | undefined>();
  const [showDataManager, setShowDataManager] = useState<Vendor | null>(null);
  const [error, setError] = useState('');
  
  const loadVendors = async () => {
    try {
      const data = await VendorService.getVendors();
      setVendors(data);
    } catch (err: any) {
      setError('Failed to load vendors: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadVendors();
  }, []);
  
  const handleSaveVendor = async (vendorData: Omit<Vendor, 'id' | 'created_at' | 'created_by'>) => {
    try {
      if (editingVendor) {
        await VendorService.updateVendor(editingVendor.id!, vendorData);
      } else {
        await VendorService.createVendor(vendorData);
      }
      
      setShowForm(false);
      setEditingVendor(undefined);
      await loadVendors();
    } catch (err: any) {
      throw new Error('Failed to save vendor: ' + err.message);
    }
  };
  
  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Are you sure you want to delete "${vendor.name}"? This will DROP all SQL tables: ${vendor.schema.tables.map(t => vendor.slug + '_' + t.name).join(', ')}`)) {
      return;
    }
    
    try {
      await VendorService.deleteVendor(vendor);
      await loadVendors();
    } catch (err: any) {
      alert('Failed to delete vendor: ' + err.message);
    }
  };
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'created':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">✅ Tables Created</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">⏳ Creating...</span>;
      case 'error':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">❌ Error</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">❓ Unknown</span>;
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading vendors...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Multi-Tenant Vendors</h1>
          <p className="text-green-600 font-medium">🚀 Powered by Edge Functions + Real SQL Tables</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          ➕ Add Vendor
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{vendor.name}</h3>
                <p className="text-gray-600">/{vendor.slug}</p>
                <div className="mt-2">
                  {getStatusBadge(vendor.table_status)}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                {vendor.table_status === 'created' && (
                  <button
                    onClick={() => setShowDataManager(vendor)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    📊 Manage Data
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingVendor(vendor);
                    setShowForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteVendor(vendor)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>SQL Tables:</strong> {vendor.schema.tables.length}
              </p>
              <div className="text-sm text-gray-600">
                {vendor.schema.tables.map((table, idx) => (
                  <div key={idx} className="ml-4 flex items-center">
                    <span className="mr-2">🗃️</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {vendor.slug}_{table.name}
                    </span>
                    <span className="ml-2 text-gray-500">({table.columns.length} cols)</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              Created: {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        ))}
      </div>
      
      {vendors.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🚀</div>
          <p className="text-gray-600 text-lg mb-2">No vendors yet. Create your first vendor!</p>
          <p className="text-sm text-gray-500">Each vendor will get real SQL tables with proper schemas</p>
        </div>
      )}
      
      {showForm && (
        <VendorForm
          vendor={editingVendor}
          onSave={handleSaveVendor}
          onCancel={() => {
            setShowForm(false);
            setEditingVendor(undefined);
          }}
        />
      )}
      
      {showDataManager && (
        <TableDataManager
          vendor={showDataManager}
          onClose={() => setShowDataManager(null)}
        />
      )}
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <AuthForm />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Multi-Tenant System</h1>
            <p className="text-sm text-green-600">Edge Functions + Real SQL Tables</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-blue-600 hover:text-blue-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <VendorList />
    </div>
  );
};

// App with Auth Provider
const AppWithAuth: React.FC = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default AppWithAuth;