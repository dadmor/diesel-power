// components/VendorForm.tsx
import { useState, useEffect } from 'react';
import { type Vendor } from '../services/vendorService';

interface VendorFormProps {
  vendor?: Vendor | null;
  loading: boolean;
  onSave: (vendorData: any) => Promise<void>;
  onCancel: () => void;
}

const DEFAULT_VENDOR = {
  slug: "example-app",
  name: "Example App",
  description: "Application description",
  schema: { tables: [] }
};

export const VendorForm = ({ vendor, loading, onSave, onCancel }: VendorFormProps) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (vendor) {
      setJsonInput(JSON.stringify(vendor, null, 2));
    } else {
      setJsonInput(JSON.stringify(DEFAULT_VENDOR, null, 2));
    }
  }, [vendor]);

  const handleSave = async () => {
    setError('');
    
    try {
      const vendorData = JSON.parse(jsonInput);
      await onSave(vendorData);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format');
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  };

  const isEdit = !!vendor;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center mb-8">
          <button 
            onClick={onCancel}
            className="border px-4 py-2 text-sm rounded-md hover:bg-gray-50 mr-4"
            disabled={loading}
          >
            Back
          </button>
          <h1 className="text-2xl font-semibold">
            {isEdit ? 'Edit Vendor' : 'Add Vendor'}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex justify-between items-center">
            <pre className="whitespace-pre-wrap text-sm">{error}</pre>
            <button 
              onClick={() => setError('')} 
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="bg-white border rounded-lg p-6">
          <label className="block text-sm font-medium mb-2">JSON Configuration</label>
          
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-96 font-mono text-sm border rounded-md p-4"
            placeholder="Paste your vendor JSON configuration..."
            disabled={loading}
          />
          
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              className="bg-gray-900 text-white px-6 py-2 text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </button>
            
            <button
              onClick={onCancel}
              className="border px-6 py-2 text-sm rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};