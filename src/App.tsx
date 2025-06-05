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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
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

// Table Service
class TableService {
  static async createVendorTables(vendor: Vendor): Promise<void> {
    const { schema, slug } = vendor;
    
    // Set vendor context in JWT claims for security
    await supabase.rpc('set_vendor_context', { vendor_slug: slug });
    
    for (const table of schema.tables) {
      const tableName = `${slug}_${table.name}`;
      
      // Build CREATE TABLE SQL
      const columns = table.columns.map(col => {
        let columnDef = `${col.name} ${this.mapColumnType(col.type)}`;
        if (col.required) columnDef += ' NOT NULL';
        if (col.enum) columnDef += ` CHECK (${col.name} IN (${col.enum.map(v => `'${v}'`).join(', ')}))`;
        return columnDef;
      }).join(', ');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id BIGSERIAL PRIMARY KEY,
          ${columns},
          vendor_slug TEXT DEFAULT '${slug}' NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT ${tableName}_vendor_check CHECK (vendor_slug = '${slug}')
        );
        
        -- Enable RLS
        ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policy for vendor isolation
        CREATE POLICY "${tableName}_vendor_policy" ON ${tableName}
          FOR ALL USING (vendor_slug = current_setting('jwt.claims.vendor_slug', true));
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS ${tableName}_vendor_idx ON ${tableName}(vendor_slug);
      `;
      
      // Execute SQL using supabase rpc with vendor context
      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (error) {
        console.error(`Error creating table ${tableName}:`, error);
        throw new Error(`Failed to create table ${tableName}: ${error.message}`);
      }
    }
  }
  
  static async dropVendorTables(vendor: Vendor): Promise<void> {
    const { schema, slug } = vendor;
    
    // Set vendor context for security
    await supabase.rpc('set_vendor_context', { vendor_slug: slug });
    
    for (const table of schema.tables) {
      const tableName = `${slug}_${table.name}`;
      const dropTableSQL = `DROP TABLE IF EXISTS ${tableName} CASCADE;`;
      
      const { error } = await supabase.rpc('exec_sql', { sql: dropTableSQL });
      if (error) {
        console.error(`Error dropping table ${tableName}:`, error);
      }
    }
  }
  
  private static mapColumnType(type: string): string {
    switch (type) {
      case 'text': return 'TEXT';
      case 'integer': return 'INTEGER';
      case 'boolean': return 'BOOLEAN';
      case 'timestamp': return 'TIMESTAMP WITH TIME ZONE';
      default: return 'TEXT';
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
    // First create the vendor record
    const { data, error } = await supabase
      .from('vendors')
      .insert([vendor])
      .select()
      .single();
    
    if (error) throw error;
    
    // Then create the tables
    try {
      await TableService.createVendorTables(data);
      return data;
    } catch (tableError) {
      // If table creation fails, delete the vendor record
      await supabase.from('vendors').delete().eq('id', data.id);
      throw tableError;
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
    // First drop the tables
    await TableService.dropVendorTables(vendor);
    
    // Then delete the vendor record
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
            type="button"
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
        {"name": "status", "type": "text", "enum": ["open", "closed"]}
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
              pattern="[a-z0-9-]+"
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
              rows={15}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Vendor'}
            </button>
          </div>
        </div>
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
    if (!confirm(`Are you sure you want to delete "${vendor.name}"? This will also drop all associated tables.`)) {
      return;
    }
    
    try {
      await VendorService.deleteVendor(vendor);
      await loadVendors();
    } catch (err: any) {
      alert('Failed to delete vendor: ' + err.message);
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
        <h1 className="text-3xl font-bold text-gray-900">Multi-Tenant Vendors</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Vendor
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="bg-white p-6 rounded-lg shadow-md border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{vendor.name}</h3>
                <p className="text-gray-600">/{vendor.slug}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingVendor(vendor);
                    setShowForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteVendor(vendor)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Tables:</strong> {vendor.schema.tables.length}
              </p>
              <div className="text-sm text-gray-600">
                {vendor.schema.tables.map((table, idx) => (
                  <div key={idx} className="ml-4">
                    • {vendor.slug}_{table.name} ({table.columns.length} columns)
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              Created: {new Date(vendor.created_at!).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      
      {vendors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No vendors yet. Create your first vendor!</p>
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
          <h1 className="text-xl font-semibold">Multi-Tenant System</h1>
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