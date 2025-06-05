// components.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { Vendor, Schema } from './types';
import { VendorService } from './services';
import { useAuth } from './auth';

export const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        await signUp(email, password);
        alert('Check your email for verification link!');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        
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

interface VendorFormProps {
  vendor?: Vendor;
  onSave: (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

export const VendorForm: React.FC<VendorFormProps> = ({ vendor, onSave, onCancel }) => {
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
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const schema: Schema = JSON.parse(formData.schemaJson);
      await onSave({
        slug: formData.slug,
        name: formData.name,
        schema
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON schema');
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const VendorList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | undefined>(undefined);
  const [error, setError] = useState('');
  
  const loadVendors = async () => {
    try {
      const data = await VendorService.getVendors();
      setVendors(data);
    } catch (err) {
      setError('Failed to load vendors: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadVendors();
  }, []);
  
  const handleSaveVendor = async (vendorData: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingVendor) {
        await VendorService.updateVendor(editingVendor.id!, vendorData);
      } else {
        await VendorService.createVendor(vendorData);
      }
      
      setShowForm(false);
      setEditingVendor(undefined);
      await loadVendors();
    } catch (err) {
      throw new Error('Failed to save vendor: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };
  
  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Are you sure you want to delete "${vendor.name}"? This will also drop all associated tables.`)) {
      return;
    }
    
    try {
      await VendorService.deleteVendor(vendor);
      await loadVendors();
    } catch (err) {
      alert('Failed to delete vendor: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
              Created: {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
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